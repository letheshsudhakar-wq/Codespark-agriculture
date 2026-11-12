import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { translations } from '../constants/translations';
import {
  SAMPLE_LAB_REPORT,
  INITIAL_REMINDERS,
  HISTORICAL_REPORTS,
  HISTORICAL_FERTILIZERS
} from '../constants/agronomyData';

const AppContext = createContext();

const STORAGE_KEY = 'agriwise_state_v1';

const DEFAULT_FARM_INFO = {
  farmerName: 'Ramesh Kumar',
  phone: '+91 98451 23456',
  location: 'Mandya, Karnataka',
  crop: 'paddy',
  farmArea: '2.5',
  sowingDate: '2026-10-12',
  growthStage: 'vegetative',
  irrigation: 'canal_flood',
  previousFertilizers: 'DAP & Urea',
  organicManure: 'Yes (FYM applied before transplanting)',
  farmingIssues: ['Leaf yellowing at tips'],
};

export const AppProvider = ({ children }) => {
  // Load saved state or default
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [screenHistory, setScreenHistory] = useState(['welcome']);
  const [language, setLanguage] = useState('en');
  const [stateLoaded, setStateLoaded] = useState(false);

  // Soil Report State (whether verified lab report is attached)
  const [soilReport, setSoilReport] = useState({
    hasReport: false,
    verified: false,
    fileName: null,
    fileSize: null,
    fileType: null,
    filePreviewUrl: null,
    testDate: null,
    labName: null,
    parameters: null,
  });

  // Farm Details
  const [farmInfo, setFarmInfo] = useState(DEFAULT_FARM_INFO);

  // Reminders & Activities
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);

  // Chatbot conversation
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-init-1',
      sender: 'bot',
      responseKey: 'greeting',
      sources: ['ICAR & State Agriculture Universities Package of Practices'],
      time: 'Just now',
    }
  ]);

  // History state
  const [historicalReports, setHistoricalReports] = useState(HISTORICAL_REPORTS);
  const [fertilizerLogs, setFertilizerLogs] = useState(HISTORICAL_FERTILIZERS);

  // UI state: simulated phone frame on desktop or fluid responsive
  const [deviceFrameMode, setDeviceFrameMode] = useState(false);

  // Backend connectivity state
  const [backendOnline, setBackendOnline] = useState(null);
  const [lastHealthCheck, setLastHealthCheck] = useState(0);

  // TTS (speech synthesis) state
  const [ttsSpeaking, setTTSSpeaking] = useState(false);

  // Notifications drawer state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Optimal Weather for Top-Dressing',
      message: 'Partly cloudy with low rain probability in Mandya for the next 48 hrs. Safe to apply second split of Neem-Coated Urea.',
      time: '2 hours ago',
      read: false,
      type: 'weather'
    },
    {
      id: 'notif-2',
      title: 'Paddy Tillering Check Reminder',
      message: 'Your paddy is at Day 31 (Active Tillering). Maintain 2-3 cm shallow water level to stimulate secondary tillers.',
      time: 'Yesterday',
      read: false,
      type: 'crop'
    },
    {
      id: 'notif-3',
      title: 'Krishi Vigyan Kendra Soil Testing Camp',
      message: 'Mobile soil testing camp at Mandya APMC Yard this Saturday. Soil testing fee: â‚¹30.',
      time: '3 days ago',
      read: true,
      type: 'kvk'
    }
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentScreen) setCurrentScreen(parsed.currentScreen);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.soilReport) setSoilReport(parsed.soilReport);
        if (parsed.farmInfo) setFarmInfo(parsed.farmInfo);
        if (parsed.reminders) setReminders(parsed.reminders);
        if (parsed.chatMessages) setChatMessages(parsed.chatMessages);
        if (parsed.historicalReports) setHistoricalReports(parsed.historicalReports);
        if (parsed.fertilizerLogs) setFertilizerLogs(parsed.fertilizerLogs);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    } finally {
      setStateLoaded(true);
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (!stateLoaded) return;
    try {
      const stateToSave = {
        currentScreen,
        language,
        soilReport,
        farmInfo,
        reminders,
        chatMessages: chatMessages.map((message) => message.image
          ? { ...message, image: { name: message.image.name, size: message.image.size, type: message.image.type } }
          : message),
        historicalReports,
        fertilizerLogs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [stateLoaded, currentScreen, language, soilReport, farmInfo, reminders, chatMessages, historicalReports, fertilizerLogs]);

  // Screen Navigation Helper
  const navigate = (newScreen) => {
    setScreenHistory((prev) => [...prev, newScreen]);
    setCurrentScreen(newScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const updated = [...screenHistory];
      updated.pop(); // remove current
      const prev = updated[updated.length - 1];
      setScreenHistory(updated);
      setCurrentScreen(prev);
    } else {
      // Fallback
      if (currentScreen !== 'dashboard' && currentScreen !== 'welcome') {
        setCurrentScreen('dashboard');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Language switcher
  const changeLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguage(langCode);
    }
  };

  const t = translations[language] || translations.en;
  const localize = (value) => localizeText(value, language);

  // Reminders actions
  const toggleReminder = (id) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const addReminder = (title, subtitle, category = 'General', dueDate = 'This Week') => {
    const newRem = {
      id: 'act-' + Date.now(),
      title,
      subtitle: subtitle || 'Custom farm activity',
      category,
      dueDate,
      completed: false,
      priority: 'medium'
    };
    setReminders((prev) => [newRem, ...prev]);
  };

  // Soil Report actions
  const loadSampleSoilReport = () => {
    setSoilReport({
      ...SAMPLE_LAB_REPORT,
      filePreviewUrl: null
    });
  };

  const uploadSoilReportFile = (file, previewUrl = null) => {
    // Simulate reading lab report values or assigning verified lab data
    setSoilReport({
      hasReport: true,
      verified: true,
      fileName: file.name,
      fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      fileType: file.type || 'application/pdf',
      filePreviewUrl: previewUrl,
      testDate: 'Uploaded Today',
      labName: 'KVK / Certified Soil Testing Laboratory',
      parameters: SAMPLE_LAB_REPORT.parameters
    });
  };

  const removeSoilReport = () => {
    setSoilReport({
      hasReport: false,
      verified: false,
      fileName: null,
      fileSize: null,
      fileType: null,
      filePreviewUrl: null,
      testDate: null,
      labName: null,
      parameters: null
    });
  };

  // Farm Info updater
  const updateFarmInfo = (newValues) => {
    setFarmInfo((prev) => ({ ...prev, ...newValues }));
  };

  // Chat message send
  const sendChatMessage = (userText, attachedImage = null) => {
    if (!userText && !attachedImage) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userText,
      image: attachedImage,
      time: 'Just now'
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Match demo agronomy question or fallback
    const lower = userText.toLowerCase();
    const matched = DEMO_CHAT_QA.find((item) =>
      item.triggers.some((trig) => lower.includes(trig))
    );

    setTimeout(() => {
      let botResponse;
      if (attachedImage) {
        botResponse = {
          id: 'msg-bot-' + Date.now(),
          sender: 'bot',
          text: `[Leaf Photo Analysis Prototype]\n\nBased on the uploaded image of your ${farmInfo.crop || 'crop'} leaf:\n\n- **Visual Pattern Detected:** Mild chlorotic interveinal yellowing with brown leaf margins.\n- **Likely Cause:** Zinc (Zn) deficiency or early moisture stress.\n- **Immediate Guidance:** Check soil moisture. Avoid water stagnation. Consider foliar spray of Chelated Zinc (Zn-EDTA 0.15% @ 1.5g/L water).\n\n*(Notice: This is a demo visual check. In production, this image is evaluated by our verified multimodal agricultural model).*`,
          sources: ['ICAR Crop Pathology Guide', 'TNAU Leaf Color Chart Standards'],
          time: 'Just now'
        };
      } else if (matched) {
        botResponse = {
          id: 'msg-bot-' + Date.now(),
          sender: 'bot',
          text: matched.answer,
          sources: matched.sources,
          time: 'Just now'
        };
      } else {
        botResponse = {
          id: 'msg-bot-' + Date.now(),
          sender: 'bot',
          text: `Thank you for your question about ${farmInfo.crop || 'your crop'}. For your ${farmInfo.farmArea} acre plot in ${farmInfo.location || 'your area'}, ensuring balanced nutrition (Nitrogen, Phosphorus, Potassium) and adequate soil organic matter is the foundation for healthy yield.\n\nCould you specify whether you are asking about **pest management**, **fertilizer split doses**, or **soil testing**? You can also tap one of the suggested questions above.`,
          sources: ['State Agricultural University Agronomy Guidelines'],
          time: 'Just now'
        };
      }
      setChatMessages((prev) => [...prev, botResponse]);
    }, 700);
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: 'msg-init-reset',
        sender: 'bot',
        responseKey: 'greeting',
        sources: ['ICAR & State Agriculture Universities Package of Practices'],
        time: 'Just now'
      }
    ]);
  };

  // Add fertilizer record to history
  const addFertilizerLog = (item, quantity, stage) => {
    const newEntry = {
      id: 'fert-' + Date.now(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      crop: farmInfo.crop,
      item,
      quantity,
      stage: stage || farmInfo.growthStage
    };
    setFertilizerLogs((prev) => [newEntry, ...prev]);
  };

  // Reset entire application
  const resetAppData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSoilReport({
      hasReport: false,
      verified: false,
      fileName: null,
      fileSize: null,
      fileType: null,
      filePreviewUrl: null,
      testDate: null,
      labName: null,
      parameters: null
    });
    setFarmInfo(DEFAULT_FARM_INFO);
    setReminders(INITIAL_REMINDERS);
    setChatMessages([]);
    setLanguage('en');
    setCurrentScreen('welcome');
    setScreenHistory(['welcome']);
  };

  // â”€â”€ Backend health check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const checkBackendHealth = async () => {
    try {
      await checkHealth();
      setBackendOnline(true);
    } catch (e) {
      setBackendOnline(false);
    } finally {
      setLastHealthCheck(Date.now());
    }
  };

  useEffect(() => {
    checkBackendHealth();
    // Re-check every 30 seconds
    const timer = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  // â”€â”€ Text-to-speech helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const ttsUtteranceRef = useRef(null);

  const speakText = (text, langCode) => {
    if (!('speechSynthesis' in window)) {
      return false;
    }
    // Cancel any ongoing speech
    if (ttsUtteranceRef.current) {
      window.speechSynthesis.cancel();
    }
    ttsUtteranceRef.current = new SpeechSynthesisUtterance(text);
    ttsUtteranceRef.current.lang = langCode;
    ttsUtteranceRef.current.rate = 1;
    ttsUtteranceRef.current.pitch = 1;
    ttsUtteranceRef.current.onstart = () => setTTSSpeaking(true);
    ttsUtteranceRef.current.onend = () => setTTSSpeaking(false);
    ttsUtteranceRef.current.onerror = () => setTTSSpeaking(false);
    window.speechSynthesis.speak(ttsUtteranceRef.current);
    return true;
  };

  const stopSpeaking = () => {
    if (ttsUtteranceRef.current) {
      window.speechSynthesis.cancel();
      setTTSSpeaking(false);
    }
  };

  const voiceLangMap = {
    en: 'en-IN',
    kn: 'kn-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
  };

  // â”€â”€ Backend-connected Chat (RAG + Gemini) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sendChatMessage = async (userText, attachedImage = null) => {
    if (!userText && !attachedImage) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userText,
      image: attachedImage,
      time: 'Just now'
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // If there's an attached image, use local demo response (backend doesn't support vision yet)
    if (attachedImage) {
      setTimeout(() => {
        const botResponse = {
          id: 'msg-bot-' + Date.now(),
          sender: 'bot',
          text: `[Leaf Photo Analysis Prototype]\n\nBased on the uploaded image of your ${farmInfo.crop || 'crop'} leaf:\n\n- **Visual Pattern Detected:** Mild chlorotic interveinal yellowing with brown leaf margins.\n- **Likely Cause:** Zinc (Zn) deficiency or early moisture stress.\n- **Immediate Guidance:** Check soil moisture. Avoid water stagnation. Consider foliar spray of Chelated Zinc (Zn-EDTA 0.15% @ 1.5g/L water).\n\n*(Notice: This is a demo visual check. In production, this image is evaluated by our verified multimodal agricultural model).*`,
          sources: ['ICAR Crop Pathology Guide', 'TNAU Leaf Color Chart Standards'],
          time: 'Just now'
        };
        setChatMessages((prev) => [...prev, botResponse]);
      }, 700);
      return;
    }

    // Show typing indicator
    const typingMsg = {
      id: 'msg-typing-' + Date.now(),
      sender: 'bot',
      text: '...',
      isTyping: true,
      time: 'Just now'
    };
    setChatMessages((prev) => [...prev, typingMsg]);

    try {
      // Call backend RAG + Gemini endpoint
      const response = await ragAsk(userText, 5);

      // Remove typing indicator
      setChatMessages((prev) => prev.filter(m => m.id !== typingMsg.id));

      const botResponse = {
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        text: response.answer || 'I could not find a grounded answer for your question.',
        sources: response.sources || [],
        time: 'Just now'
      };
      setChatMessages((prev) => [...prev, botResponse]);

      // Auto-speak the answer in the current language
      if (response.answer) {
        const langCode = voiceLangMap[language] || 'en-IN';
        speakText(response.answer, langCode);
      }
    } catch (err) {
      // Remove typing indicator
      setChatMessages((prev) => prev.filter(m => m.id !== typingMsg.id));

      const errorMsg = err.data?.error || err.message || 'Failed to get response from server';
      const botResponse = {
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        text: `Sorry, I couldn't connect to the agricultural knowledge base. ${errorMsg}`,
        sources: [],
        time: 'Just now'
      };
      setChatMessages((prev) => [...prev, botResponse]);
    }
  };

  // â”€â”€ Backend Voice Ask (Multilingual) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sendVoiceQuestion = async (question, languageCode) => {
    if (!question || !question.trim()) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: question,
      time: 'Just now'
    };
    setChatMessages((prev) => [...prev, userMsg]);

    const typingMsg = {
      id: 'msg-typing-' + Date.now(),
      sender: 'bot',
      text: '...',
      isTyping: true,
      time: 'Just now'
    };
    setChatMessages((prev) => [...prev, typingMsg]);

    try {
      const voiceLangCode = uiLangToVoiceLang(languageCode);
      const response = await voiceAsk(question, voiceLangCode, 5);

      setChatMessages((prev) => prev.filter(m => m.id !== typingMsg.id));

      const botResponse = {
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        text: response.answer || 'I could not process your voice question.',
        sources: response.sources || [],
        time: 'Just now'
      };
      setChatMessages((prev) => [...prev, botResponse]);

      // Auto-speak the translated answer
      if (response.answer) {
        speakText(response.answer, voiceLangCode);
      }
    } catch (err) {
      setChatMessages((prev) => prev.filter(m => m.id !== typingMsg.id));

      const errorMsg = err.data?.error || err.message || 'Voice service unavailable';
      const botResponse = {
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        text: `Voice service error: ${errorMsg}`,
        sources: [],
        time: 'Just now'
      };
      setChatMessages((prev) => [...prev, botResponse]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        screenHistory,
        navigate,
        goBack,
        language,
        changeLanguage,
        t,
        localize,
        soilReport,
        setSoilReport,
        loadSampleSoilReport,
        uploadSoilReportFile,
        removeSoilReport,
        farmInfo,
        updateFarmInfo,
        reminders,
        toggleReminder,
        addReminder,
        chatMessages,
        getChatMessageText,
        sendChatMessage,
        sendVoiceQuestion,
        clearChat,
        historicalReports,
        fertilizerLogs,
        addFertilizerLog,
        resetAppData,
        deviceFrameMode,
        setDeviceFrameMode,
        notifications,
        showNotifications,
        setShowNotifications,
        backendOnline,
        speakText,
        stopSpeaking,
        ttsSpeaking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
