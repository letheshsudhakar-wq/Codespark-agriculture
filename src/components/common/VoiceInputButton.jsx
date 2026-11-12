import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SPEECH_LOCALES = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
};

export const VoiceInputButton = ({ onTranscript, onStatusChange, showStatus = true }) => {
  const { language, t } = useApp();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const mountedRef = useRef(true);
  const completionTimerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(completionTimerRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    onStatusChange?.({ status, error });
  }, [status, error, onStatusChange]);

  const startRecognition = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(t.common.speechUnsupported);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t.common.speechUnsupported);
      return;
    }

    setError('');
    let permissionStream;
    try {
      permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((track) => track.stop());

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = SPEECH_LOCALES[language] || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (mountedRef.current) setStatus('listening');
      };
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (!transcript) return;
        if (mountedRef.current) {
          setStatus('processing');
          onTranscript(transcript);
          completionTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setStatus('completed');
          }, 250);
        }
      };
      recognition.onerror = (event) => {
        if (!mountedRef.current) return;
        setStatus('idle');
        setError(
          event.error === 'not-allowed' || event.error === 'service-not-allowed'
            ? t.common.speechDenied
            : t.common.speechError
        );
      };
      recognition.onend = () => {
        if (mountedRef.current) {
          setStatus((current) => current === 'listening' ? 'idle' : current);
        }
      };
      recognition.start();
    } catch (error) {
      permissionStream?.getTracks().forEach((track) => track.stop());
      if (mountedRef.current) {
        setStatus('idle');
        setError(
          error.name === 'NotAllowedError' || error.name === 'SecurityError'
            ? t.common.speechDenied
            : t.common.speechError
        );
      }
    }
  };

  const toggleRecognition = () => {
    if (status === 'listening') {
      recognitionRef.current?.stop();
      setStatus('idle');
      return;
    }
    startRecognition();
  };

  const statusText = {
    listening: t.common.recordingListening,
    processing: t.common.recordingProcessing,
    completed: t.common.recordingCompleted,
  }[status];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <button
        type="button"
        onClick={toggleRecognition}
        className={`icon-btn ${status === 'listening' ? 'pulse-mic' : ''}`}
        aria-label={status === 'listening' ? t.common.stopRecording : t.common.startRecording}
        title={status === 'listening' ? t.common.stopRecording : t.common.startRecording}
        style={{
          border: 'none',
          backgroundColor: status === 'listening' ? 'var(--lime-green)' : 'transparent',
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          flexShrink: 0,
        }}
      >
        {status === 'listening' ? <MicOff size={19} color="#171632" /> : <Mic size={19} color="#075C28" />}
      </button>
      {showStatus && (statusText || error) && (
        <span
          role="status"
          style={{ fontSize: '11px', color: error ? '#B91C1C' : 'var(--text-muted)' }}
        >
          {error || statusText}
        </span>
      )}
    </span>
  );
};
