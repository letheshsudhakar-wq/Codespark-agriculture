import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';
import {
  SAMPLE_LAB_REPORT,
  INITIAL_REMINDERS,
  HISTORICAL_REPORTS,
  HISTORICAL_FERTILIZERS
} from '../constants/agronomyData';
import { getChatIntent, getChatResponse } from '../constants/chatResponses';
import { localizeText } from '../constants/localization';

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
  farmingIssues: ['Minor leaf tip yellowing'],
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
      message: 'Mobile soil testing camp at Mandya APMC Yard this Saturday. Soil testing fee: ₹30.',
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

    const intent = attachedImage ? 'imageUnavailable' : getChatIntent(userText);

    setTimeout(() => {
      setChatMessages((prev) => [...prev, {
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        responseKey: intent,
        sources: intent === 'imageUnavailable' ? [] : ['ICAR & State Agricultural University guidance'],
        time: 'Just now',
      }]);
    }, 700);
  };

  const getChatMessageText = (message) => {
    if (message.responseKey) {
      return getChatResponse(language, message.responseKey, {
        area: farmInfo.farmArea || '2.5',
        location: farmInfo.location || (language === 'en' ? 'your area' : ''),
      });
    }
    return message.text;
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

  return (
    <AppContext.Provider
      value={{
        currentScreen,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
