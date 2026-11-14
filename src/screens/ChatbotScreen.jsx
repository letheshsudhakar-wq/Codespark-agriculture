import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import { CHAT_SUGGESTIONS } from '../constants/chatResponses';
import { 
  Send, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  AlertCircle, 
  X,
  Play,
  Square
} from 'lucide-react';

const SPEECH_LOCALES = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
};

export const ChatbotScreen = () => {
  const { chatMessages, sendChatMessage, clearChat, getChatMessageText, language, t } = useApp();
  const [inputText, setInputText] = useState('');
  const [speechError, setSpeechError] = useState(null);
  const [speechStatus, setSpeechStatus] = useState('idle');
  const [audioError, setAudioError] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [imageError, setImageError] = useState(null);
  
  // Image attachment state
  const [attachedImage, setAttachedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const imageInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const lastBotMessageIdRef = useRef(null);
  const speechRequestRef = useRef(0);

  const stopSpeech = useCallback(() => {
    speechRequestRef.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlayingMessageId(null);
  }, []);

  const speakResponse = useCallback((message) => {
    const text = getChatMessageText(message);
    if (!text?.trim()) return;

    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setAudioError(t.common.audioUnsupported);
      return;
    }

    const synthesis = window.speechSynthesis;
    const locale = SPEECH_LOCALES[language] || SPEECH_LOCALES.en;
    const requestId = speechRequestRef.current + 1;
    speechRequestRef.current = requestId;
    synthesis.cancel();
    setAudioError('');

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    const voices = synthesis.getVoices();
    const voice = voices.find((candidate) => candidate.lang.toLowerCase() === locale.toLowerCase())
      || voices.find((candidate) => candidate.lang.split('-')[0].toLowerCase() === locale.split('-')[0]);
    if (voice) {
      utterance.voice = voice;
    } else {
      setAudioError(t.common.voiceFallback);
    }

    utterance.onstart = () => {
      if (speechRequestRef.current === requestId) setPlayingMessageId(message.id);
    };
    utterance.onend = () => {
      if (speechRequestRef.current === requestId) setPlayingMessageId(null);
    };
    utterance.onerror = (event) => {
      if (speechRequestRef.current !== requestId) return;
      setPlayingMessageId(null);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setAudioError(t.common.audioError);
      }
    };

    try {
      synthesis.speak(utterance);
    } catch {
      if (speechRequestRef.current === requestId) {
        setPlayingMessageId(null);
        setAudioError(t.common.audioError);
      }
    }
  }, [getChatMessageText, language, t]);

  const speakResponseRef = useRef(speakResponse);
  useEffect(() => {
    speakResponseRef.current = speakResponse;
  }, [speakResponse]);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const latestBotMessage = [...chatMessages].reverse().find((message) => message.sender === 'bot');
    if (!latestBotMessage) return;
    if (lastBotMessageIdRef.current === null) {
      lastBotMessageIdRef.current = latestBotMessage.id;
      return;
    }
    if (lastBotMessageIdRef.current === latestBotMessage.id) return;

    lastBotMessageIdRef.current = latestBotMessage.id;
    if (latestBotMessage.responseKey === 'greeting') return;

    const timerId = window.setTimeout(() => speakResponseRef.current(latestBotMessage), 0);
    return () => window.clearTimeout(timerId);
  }, [chatMessages]);

  useEffect(() => () => {
    speechRequestRef.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    sendChatMessage(inputText.trim(), attachedImage);
    setInputText('');
    setAttachedImage(null);
  };

  const handleSuggestedClick = (question) => {
    sendChatMessage(question);
  };

  // Handle Photo upload
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = /\.(jpe?g|png|webp)$/i;
    if ((!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name))) {
      setImageError(t.common.imageInvalidType);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError(t.common.imageTooLarge);
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setImageError(t.common.imageReadError);
        return;
      }
      setAttachedImage({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'image/' + file.name.split('.').pop().toLowerCase(),
        url: reader.result,
      });
      setShowImageModal(false);
    };
    reader.onerror = () => setImageError(t.common.imageReadError);
    reader.readAsDataURL(file);
  };

  const suggestedQuestions = CHAT_SUGGESTIONS[language] || CHAT_SUGGESTIONS.en;
  const handleSpeechStatus = useCallback(({ status, error }) => {
    setSpeechStatus(status);
    setSpeechError(error);
  }, []);

  return (
    <div className="screen-container" style={{ paddingBottom: '170px' }}>
      <Header showBack={true} title={t.chatbot?.title || 'AGRIWISE AI Assistant'} />

      {/* AI Assistant status bar */}
      <div style={{ backgroundColor: '#FAFDF6', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--dark-green)' }}>
            AGRIWISE AI • Agricultural Knowledge Assistant
          </span>
        </div>
        <button 
          onClick={clearChat}
          className="btn-link"
          style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          title={t.chatbot?.clearChat || t.common.delete}
        >
          <Trash2 size={13} />
          <span>{t.chatbot?.clearChat || t.common.delete}</span>
        </button>
      </div>

      {/* Suggested Questions Horizontal Scroll */}
      <div style={{ padding: '12px 16px', overflowX: 'auto', display: 'flex', gap: '8px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-light)' }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestedClick(q)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--surface-white)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            💬 {q}
          </button>
        ))}
      </div>

      {/* Speech Error Banner */}
      {speechError && (
        <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>{speechError}</span>
        </div>
      )}
      {audioError && (
        <div role="status" style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>{audioError}</span>
          <button type="button" onClick={() => setAudioError('')} aria-label={t.common.close}><X size={14} /></button>
        </div>
      )}
      {!speechError && speechStatus !== 'idle' && (
        <div role="status" style={{ backgroundColor: '#F0F5EC', color: 'var(--dark-green)', padding: '8px 16px', fontSize: '12px' }}>
          {t.common[`recording${speechStatus[0].toUpperCase()}${speechStatus.slice(1)}`]}
        </div>
      )}
      {imageError && (
        <div role="alert" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>{imageError}</span>
          <button type="button" onClick={() => setImageError(null)} aria-label={t.common.close}><X size={14} /></button>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="chat-container">
        {chatMessages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div 
              key={msg.id} 
              className={`chat-bubble ${isBot ? 'bot' : 'user'}`}
              style={{
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                border: isBot ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              {/* If message has attached image */}
              {msg.image && (
                <div style={{ marginBottom: '8px', borderRadius: '12px', overflow: 'hidden', maxWidth: '200px' }}>
                  {msg.image.url &&                   <img src={msg.image.url} alt={t.imageAnalysis?.preview || 'Attached crop'} style={{ width: '100%', height: 'auto', display: 'block' }} />}
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: '2px' }}>
                    {t.imageAnalysis?.preview || 'Photo'}: {msg.image.name}
                  </span>
                </div>
              )}

              {/* Message text with basic markdown formatting */}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.48' }}>
                {getChatMessageText(msg)}
              </div>

              {isBot && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => speakResponse(msg)}
                    aria-label={t.common.playResponse}
                    title={t.common.playResponse}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-white)', color: 'var(--dark-green)', fontSize: '11px', cursor: 'pointer' }}
                  >
                    <Play size={13} />
                    {t.common.playResponse}
                  </button>
                  <button
                    type="button"
                    onClick={stopSpeech}
                    disabled={playingMessageId !== msg.id}
                    aria-label={t.common.stopAudio}
                    title={t.common.stopAudio}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-white)', color: 'var(--dark-green)', fontSize: '11px', cursor: playingMessageId === msg.id ? 'pointer' : 'default', opacity: playingMessageId === msg.id ? 1 : 0.5 }}
                  >
                    <Square size={12} />
                    {t.common.stopAudio}
                  </button>
                </div>
              )}

              {/* Source citations */}
              {isBot && msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: '700' }}>{t.chatbot?.sourcesTitle || 'Sources'}: </span>
                  {msg.sources.join(' • ')}
                </div>
              )}

              <span style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', display: 'block', textAlign: 'right' }}>
                {msg.time}
              </span>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Attached Image Preview bar before sending */}
      {attachedImage && (
        <div style={{ position: 'fixed', bottom: 'calc(var(--safe-bottom) + 164px)', left: '0', right: '0', zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ width: '100%', maxWidth: '408px', backgroundColor: 'var(--surface-white)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--dark-green)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={attachedImage.url} alt="Thumb" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px' }} />
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block' }}>Photo attached</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{attachedImage.size}</span>
              </div>
            </div>
            <button onClick={() => setAttachedImage(null)} className="icon-btn" style={{ width: '28px', height: '28px' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Fixed Chat Input Bar at Bottom */}
      <div 
        style={{
          position: 'fixed',
          bottom: 'calc(var(--safe-bottom) + 80px)',
          left: '0',
          right: '0',
          zIndex: 49,
          display: 'flex',
          justifyContent: 'center',
          padding: '10px 16px 20px',
          backgroundColor: 'rgba(248, 250, 245, 0.96)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <form 
          onSubmit={handleSend}
          style={{
            width: '100%',
            maxWidth: '408px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--surface-white)',
            borderRadius: 'var(--radius-pill)',
            padding: '6px 10px',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Photo attach button */}
          <button 
            type="button" 
            onClick={() => setShowImageModal(true)}
            className="icon-btn"
            title={t.chatbot?.attachImage || 'Attach crop/leaf photo'}
            style={{ border: 'none', backgroundColor: 'transparent', width: '34px', height: '34px' }}
          >
            <Camera size={20} color="#075C28" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={t.chatbot?.inputPlaceholder || "Ask a farming question..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-main)',
              backgroundColor: 'transparent',
              fontFamily: 'inherit'
            }}
          />

          <VoiceInputButton
            showStatus={false}
            onStatusChange={handleSpeechStatus}
            onTranscript={(transcript) => {
              setInputText((prev) => prev ? `${prev} ${transcript}` : transcript);
              setSpeechError(null);
            }}
          />

          {/* Send Button */}
          <button 
            type="submit"
            disabled={!inputText.trim() && !attachedImage}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: (inputText.trim() || attachedImage) ? 'var(--dark-green)' : '#D6DFD0',
              color: (inputText.trim() || attachedImage) ? 'var(--lime-green)' : '#829787',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (inputText.trim() || attachedImage) ? 'pointer' : 'default',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Image Upload & Inspection Modal */}
      {showImageModal && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>
                {t.imageAnalysis?.modalTitle || 'Crop & Leaf Photo Inspection'}
              </h3>
              <button className="icon-btn" onClick={() => setShowImageModal(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '16px' }}>
              {t.imageAnalysis?.description || 'Upload a clear photo of an affected leaf, stem, or field area for visual symptom checking.'}
            </p>

            <input 
              type="file" 
              ref={imageInputRef} 
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleImageSelect}
              style={{ display: 'none' }} 
            />

            <div 
              onClick={() => imageInputRef.current?.click()}
              style={{
                border: '2px dashed var(--dark-green)',
                borderRadius: 'var(--radius-lg)',
                padding: '30px 20px',
                textAlign: 'center',
                backgroundColor: '#FAFDF6',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--light-green)', color: 'var(--dark-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <ImageIcon size={26} />
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--dark-green)', display: 'block' }}>
                {t.imageAnalysis?.selectPhoto || 'Select Photo'}
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                {t.imageAnalysis?.fileTypes || 'Supports JPG, JPEG, PNG, WEBP up to 10MB'}
              </span>
            </div>

            <div style={{ backgroundColor: '#F8FAF5', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {t.imageAnalysis?.farmerNote || 'Note for Farmers'}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {t.imageAnalysis?.disclaimer || t.common.imageAnalysisUnavailable}
              </p>
            </div>

            <button className="btn-secondary" onClick={() => setShowImageModal(false)}>
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
