import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const ChatbotScreen = () => {
  const { chatMessages, sendChatMessage, clearChat, farmInfo, t } = useApp();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  
  // Image attachment state
  const [attachedImage, setAttachedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const imageInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  // Browser Web Speech Recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(t.chatbot?.speechUnsupported || 'Speech recognition not supported on this browser. Please type your question.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Indian English, fallback supported
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(t.chatbot?.speechDenied || 'Microphone permission denied.');
        } else {
          setSpeechError('Could not capture voice: ' + event.error);
        }
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setSpeechError('Speech recognition error: ' + err.message);
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  // Handle Photo upload
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          url: reader.result,
        });
        setShowImageModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const suggestedQuestions = [
    "Why are my leaves turning yellow?",
    "Which fertilizer should I use right now?",
    "What is organic carbon and how can I increase it?",
    "Why is soil testing important and how do I do it?",
    "Will rain affect my fertilizer application?",
  ];

  return (
    <div className="screen-container" style={{ paddingBottom: '140px' }}>
      <Header showBack={true} title={t.chatbot?.title || 'AGRIWISE AI Assistant'} />

      {/* Demo Mode & Pre-calibrated notice */}
      <div style={{ backgroundColor: '#FAFDF6', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--dark-green)' }}>
            {t.chatbot?.demoBadge || 'Demo Mode • Agronomic Knowledge Base'}
          </span>
        </div>
        <button 
          onClick={clearChat}
          className="btn-link"
          style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          title="Clear Conversation"
        >
          <Trash2 size={13} />
          <span>Clear</span>
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
                  <img src={msg.image.url} alt="Attached Leaf" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: '2px' }}>
                    Photo: {msg.image.name}
                  </span>
                </div>
              )}

              {/* Message text with basic markdown formatting */}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.48' }}>
                {msg.text}
              </div>

              {/* Source citations */}
              {isBot && msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: '700' }}>Sources: </span>
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
        <div style={{ position: 'fixed', bottom: '86px', left: '0', right: '0', zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
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
          bottom: '0',
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
            title="Attach Leaf/Crop Photo"
            style={{ border: 'none', backgroundColor: 'transparent', width: '34px', height: '34px' }}
          >
            <Camera size={20} color="#075C28" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={isListening ? t.chatbot?.listening || "Listening... speak now" : (t.chatbot?.inputPlaceholder || "Ask a farming question...")}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-main)',
              backgroundColor: 'transparent',
              fontFamily: 'inherit'
            }}
          />

          {/* Voice Mic Button */}
          <button 
            type="button" 
            onClick={toggleSpeechRecognition}
            className={`icon-btn ${isListening ? 'pulse-mic' : ''}`}
            title="Voice input"
            style={{
              border: 'none',
              backgroundColor: isListening ? 'var(--lime-green)' : 'transparent',
              width: '34px',
              height: '34px',
              borderRadius: '50%'
            }}
          >
            {isListening ? <Mic size={20} color="#171632" /> : <Mic size={20} color="#075C28" />}
          </button>

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
              accept="image/*" 
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
                Tap to Take Photo or Browse
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                Supports JPG, PNG up to 10MB
              </span>
            </div>

            <div style={{ backgroundColor: '#F8FAF5', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Note for Farmers
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {t.imageAnalysis?.disclaimer || 'Visual image analysis prototype. When connected to a vision model (e.g. Gemini Vision), this will diagnose fungal leaf spots, stem borers, and micronutrient chlorosis.'}
              </p>
            </div>

            <button className="btn-secondary" onClick={() => setShowImageModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

