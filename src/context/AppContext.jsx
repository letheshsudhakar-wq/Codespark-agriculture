
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
} from 'react';

import { translations } from '../constants/translations';
import { localizeText } from '../constants/localization';

import {
  getChatIntent,
  getChatResponse
} from '../constants/chatResponses';

import {
  SAMPLE_LAB_REPORT,
  INITIAL_REMINDERS,
  HISTORICAL_REPORTS,
  HISTORICAL_FERTILIZERS
} from '../constants/agronomyData';

// Backend API functions
import {
  checkHealth,
  ragAsk,
  voiceAsk
} from '../services/api';

const AppContext = createContext(null);

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
  organicManure: 'Yes (FYM / Cow dung applied)',
  farmingIssues: ['Leaf yellowing at tips']
};

const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg-init-1',
    sender: 'bot',
    responseKey: 'greeting',
    sources: [
      'ICAR & State Agriculture Universities Package of Practices'
    ],
    time: 'Just now'
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Optimal Weather for Top-Dressing',
    message:
      'Partly cloudy with low rain probability in Mandya for the next 48 hrs. Safe to apply second split of Neem-Coated Urea.',
    time: '2 hours ago',
    read: false,
    type: 'weather'
  },
  {
    id: 'notif-2',
    title: 'Paddy Tillering Check Reminder',
    message:
      'Your paddy is at Day 31 (Active Tillering). Maintain 2-3 cm shallow water level to stimulate secondary tillers.',
    time: 'Yesterday',
    read: false,
    type: 'crop'
  },
  {
    id: 'notif-3',
    title: 'Krishi Vigyan Kendra Soil Testing Camp',
    message:
      'Mobile soil testing camp at Mandya APMC Yard this Saturday. Soil testing fee: ₹30.',
    time: '3 days ago',
    read: true,
    type: 'kvk'
  }
];

const VOICE_LANG_MAP = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ta: 'ta-IN'
};

// Convert UI language to speech language
const uiLangToVoiceLang = (languageCode) => {
  return VOICE_LANG_MAP[languageCode] || 'en-IN';
};

export const AppProvider = ({ children }) => {

  // -----------------------------------
  // Application navigation
  // -----------------------------------

  const [currentScreen, setCurrentScreen] = useState('welcome');

  const [screenHistory, setScreenHistory] = useState([
    'welcome'
  ]);

  const [language, setLanguage] = useState('en');

  const [stateLoaded, setStateLoaded] = useState(false);

  // -----------------------------------
  // Backend state
  // -----------------------------------

  const [backendOnline, setBackendOnline] = useState(false);

  const [lastHealthCheck, setLastHealthCheck] = useState(null);

  // -----------------------------------
  // Text to speech state
  // -----------------------------------

  const [ttsSpeaking, setTTSSpeaking] = useState(false);

  const ttsUtteranceRef = useRef(null);

  // -----------------------------------
  // Soil report state
  // -----------------------------------

  const [soilReport, setSoilReport] = useState({
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

  // -----------------------------------
  // Farm information
  // -----------------------------------

  const [farmInfo, setFarmInfo] = useState(
    DEFAULT_FARM_INFO
  );

  // -----------------------------------
  // Reminders and activities
  // -----------------------------------

  const [reminders, setReminders] = useState(
    INITIAL_REMINDERS
  );

  // -----------------------------------
  // Chatbot conversation
  // -----------------------------------

  const [chatMessages, setChatMessages] = useState(
    INITIAL_CHAT_MESSAGES
  );

  // -----------------------------------
  // History
  // -----------------------------------

  const [historicalReports, setHistoricalReports] = useState(
    HISTORICAL_REPORTS
  );

  const [fertilizerLogs, setFertilizerLogs] = useState(
    HISTORICAL_FERTILIZERS
  );

  // -----------------------------------
  // UI state
  // -----------------------------------

  const [deviceFrameMode, setDeviceFrameMode] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState(
    INITIAL_NOTIFICATIONS
  );

  // -----------------------------------
  // Load saved application state
  // -----------------------------------

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed.currentScreen) {
          setCurrentScreen(parsed.currentScreen);
        }

        if (parsed.language) {
          setLanguage(parsed.language);
        }

        if (parsed.soilReport) {
          setSoilReport(parsed.soilReport);
        }

        if (parsed.farmInfo) {
          setFarmInfo(parsed.farmInfo);
        }

        if (parsed.reminders) {
          setReminders(parsed.reminders);
        }

        if (parsed.chatMessages) {
          setChatMessages(parsed.chatMessages);
        }

        if (parsed.historicalReports) {
          setHistoricalReports(parsed.historicalReports);
        }

        if (parsed.fertilizerLogs) {
          setFertilizerLogs(parsed.fertilizerLogs);
        }
      }
    } catch (error) {
      console.warn(
        'Could not read from localStorage:',
        error
      );
    } finally {
      setStateLoaded(true);
    }
  }, []);

  // -----------------------------------
  // Save application state
  // -----------------------------------

  useEffect(() => {
    if (!stateLoaded) return;

    try {
      const stateToSave = {
        currentScreen,
        language,
        soilReport,
        farmInfo,
        reminders,

        chatMessages: chatMessages.map((message) =>
          message.image
            ? {
                ...message,
                image: {
                  name: message.image.name,
                  size: message.image.size,
                  type: message.image.type
                }
              }
            : message
        ),

        historicalReports,
        fertilizerLogs
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(stateToSave)
      );
    } catch (error) {
      console.warn(
        'Could not save application state:',
        error
      );
    }
  }, [
    stateLoaded,
    currentScreen,
    language,
    soilReport,
    farmInfo,
    reminders,
    chatMessages,
    historicalReports,
    fertilizerLogs
  ]);

  // -----------------------------------
  // Navigation
  // -----------------------------------

  const navigate = (newScreen) => {
    setScreenHistory((prev) => [
      ...prev,
      newScreen
    ]);

    setCurrentScreen(newScreen);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const updated = [...screenHistory];

      updated.pop();

      const previousScreen =
        updated[updated.length - 1];

      setScreenHistory(updated);
      setCurrentScreen(previousScreen);
    } else if (
      currentScreen !== 'dashboard' &&
      currentScreen !== 'welcome'
    ) {
      setCurrentScreen('dashboard');
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // -----------------------------------
  // Language
  // -----------------------------------

  const changeLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguage(langCode);
    }
  };

  const t = translations[language] || translations.en;

  const localize = (value) => {
    return localizeText(value, language);
  };

  // -----------------------------------
  // Chat message text helper
  // -----------------------------------

  const getChatMessageText = (message) => {
    if (!message) return '';

    if (message.text) {
      return message.text;
    }

    if (message.responseKey) {
      try {
        return getChatResponse(message.responseKey);
      } catch (error) {
        console.warn('Chat response lookup failed:', error);
        return message.responseKey;
      }
    }

    return '';
  };

  // -----------------------------------
  // Reminder actions
  // -----------------------------------

  const toggleReminder = (id) => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              completed: !reminder.completed
            }
          : reminder
      )
    );
  };

  const addReminder = (
    title,
    subtitle,
    category = 'General',
    dueDate = 'This Week'
  ) => {
    const newReminder = {
      id: 'act-' + Date.now(),
      title,
      subtitle: subtitle || 'Custom farm activity',
      category,
      dueDate,
      completed: false,
      priority: 'medium'
    };

    setReminders((prev) => [
      newReminder,
      ...prev
    ]);
  };

  // -----------------------------------
  // Soil report actions
  // -----------------------------------

  const loadSampleSoilReport = () => {
    setSoilReport({
      ...SAMPLE_LAB_REPORT,
      filePreviewUrl: null
    });
  };

  const uploadSoilReportFile = (
    file,
    previewUrl = null
  ) => {
    if (!file) return;

    setSoilReport({
      hasReport: true,
      verified: true,
      fileName: file.name,

      fileSize:
        (file.size / (1024 * 1024)).toFixed(2) +
        ' MB',

      fileType: file.type || 'application/pdf',

      filePreviewUrl: previewUrl,

      testDate: 'Uploaded Today',

      labName:
        'KVK / Certified Soil Testing Laboratory',

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

  // -----------------------------------
  // Farm information updater
  // -----------------------------------

  const updateFarmInfo = (newValues) => {
    setFarmInfo((prev) => ({
      ...prev,
      ...newValues
    }));
  };

  // -----------------------------------
  // Clear chatbot
  // -----------------------------------

  const clearChat = () => {
    setChatMessages(INITIAL_CHAT_MESSAGES);
  };

  // -----------------------------------
  // Fertilizer history
  // -----------------------------------

  const addFertilizerLog = (
    item,
    quantity,
    stage
  ) => {
    const newEntry = {
      id: 'fert-' + Date.now(),

      date: new Date().toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      ),

      crop: farmInfo.crop,
      item,
      quantity,
      stage: stage || farmInfo.growthStage
    };

    setFertilizerLogs((prev) => [
      newEntry,
      ...prev
    ]);
  };

  // -----------------------------------
  // Reset application
  // -----------------------------------

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

    setChatMessages(INITIAL_CHAT_MESSAGES);

    setHistoricalReports(HISTORICAL_REPORTS);

    setFertilizerLogs(HISTORICAL_FERTILIZERS);

    setLanguage('en');

    setCurrentScreen('welcome');

    setScreenHistory(['welcome']);

    setBackendOnline(false);

    setShowNotifications(false);
  };

  // -----------------------------------
  // Backend health check
  // -----------------------------------

  const checkBackendHealth = async () => {
    try {
      await checkHealth();

      setBackendOnline(true);
    } catch (error) {
      console.error(
        'Backend health check failed:',
        error
      );

      setBackendOnline(false);
    } finally {
      setLastHealthCheck(Date.now());
    }
  };

  useEffect(() => {
    checkBackendHealth();

    const timer = setInterval(
      checkBackendHealth,
      30000
    );

    return () => clearInterval(timer);
  }, []);

  // -----------------------------------
  // Text to speech
  // -----------------------------------

  const speakText = (text, langCode) => {
    if (
      !('speechSynthesis' in window) ||
      !text
    ) {
      return false;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      text
    );

    utterance.lang = langCode || 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setTTSSpeaking(true);
    };

    utterance.onend = () => {
      setTTSSpeaking(false);
    };

    utterance.onerror = () => {
      setTTSSpeaking(false);
    };

    ttsUtteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);

    return true;
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setTTSSpeaking(false);
  };

  // -----------------------------------
  // Backend connected chatbot
  // -----------------------------------

  const sendChatMessage = async (
    userText,
    attachedImage = null
  ) => {
    if (
      (!userText || !userText.trim()) &&
      !attachedImage
    ) {
      return;
    }

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userText || '',
      image: attachedImage,
      time: 'Just now'
    };

    setChatMessages((prev) => [
      ...prev,
      userMsg
    ]);

    // Image demo response
    if (attachedImage) {
      setTimeout(() => {
        const botResponse = {
          id: 'msg-bot-' + Date.now(),

          sender: 'bot',

          text: `[Leaf Photo Analysis Prototype]

Based on the uploaded image of your ${
            farmInfo.crop || 'crop'
          } leaf:

- Visual Pattern Detected: Mild chlorotic interveinal yellowing with brown leaf margins.
- Likely Cause: Zinc deficiency or early moisture stress.
- Immediate Guidance: Check soil moisture. Avoid water stagnation.

This is a demo visual check, not a verified diagnosis.`,

          sources: [
            'ICAR Crop Pathology Guide',
            'TNAU Leaf Color Chart Standards'
          ],

          time: 'Just now'
        };

        setChatMessages((prev) => [
          ...prev,
          botResponse
        ]);
      }, 700);

      return;
    }

    const typingMsg = {
      id: 'msg-typing-' + Date.now(),
      sender: 'bot',
      text: '...',
      isTyping: true,
      time: 'Just now'
    };

    setChatMessages((prev) => [
      ...prev,
      typingMsg
    ]);

    try {
      const response = await ragAsk(
        userText,
        5
      );

      setChatMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== typingMsg.id
        )
      );

      const botResponse = {
        id: 'msg-bot-' + Date.now(),

        sender: 'bot',

        text:
          response?.answer ||
          'I could not find a grounded answer for your question.',

        sources: response?.sources || [],

        time: 'Just now'
      };

      setChatMessages((prev) => [
        ...prev,
        botResponse
      ]);

      if (response?.answer) {
        speakText(
          response.answer,
          uiLangToVoiceLang(language)
        );
      }
    } catch (error) {
      setChatMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== typingMsg.id
        )
      );

      const errorMsg =
        error?.data?.error ||
        error?.message ||
        'Failed to get response from server';

      setChatMessages((prev) => [
        ...prev,
        {
          id: 'msg-bot-' + Date.now(),
          sender: 'bot',

          text:
            `Sorry, I couldn't connect to the agricultural knowledge base. ${errorMsg}`,

          sources: [],
          time: 'Just now'
        }
      ]);
    }
  };

  // -----------------------------------
  // Voice assistant
  // -----------------------------------

  const sendVoiceQuestion = async (
    question,
    languageCode
  ) => {
    if (
      !question ||
      !question.trim()
    ) {
      return;
    }

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: question,
      time: 'Just now'
    };

    setChatMessages((prev) => [
      ...prev,
      userMsg
    ]);

    const typingMsg = {
      id: 'msg-typing-' + Date.now(),
      sender: 'bot',
      text: '...',
      isTyping: true,
      time: 'Just now'
    };

    setChatMessages((prev) => [
      ...prev,
      typingMsg
    ]);

    try {
      const voiceLangCode =
        uiLangToVoiceLang(languageCode);

      const response = await voiceAsk(
        question,
        voiceLangCode,
        5
      );

      setChatMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== typingMsg.id
        )
      );

      const botResponse = {
        id: 'msg-bot-' + Date.now(),

        sender: 'bot',

        text:
          response?.answer ||
          'I could not process your voice question.',

        sources: response?.sources || [],

        time: 'Just now'
      };

      setChatMessages((prev) => [
        ...prev,
        botResponse
      ]);

      if (response?.answer) {
        speakText(
          response.answer,
          voiceLangCode
        );
      }
    } catch (error) {
      setChatMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== typingMsg.id
        )
      );

      const errorMsg =
        error?.data?.error ||
        error?.message ||
        'Voice service unavailable';

      setChatMessages((prev) => [
        ...prev,
        {
          id: 'msg-bot-' + Date.now(),
          sender: 'bot',

          text: `Voice service error: ${errorMsg}`,

          sources: [],
          time: 'Just now'
        }
      ]);
    }
  };

  // -----------------------------------
  // Context provider
  // -----------------------------------

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
        lastHealthCheck,
        checkBackendHealth,

        speakText,
        stopSpeaking,
        ttsSpeaking
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// -----------------------------------
// Custom hook
// -----------------------------------

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used inside AppProvider'
    );
  }

  return context;
};
