import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';
import {
  SAMPLE_LAB_REPORT,
  INITIAL_REMINDERS,
  HISTORICAL_REPORTS,
  HISTORICAL_FERTILIZERS,
  DEMO_CHAT_QA
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
  farmingIssues: ['Minor leaf tip yellowing'],
};

export const AppProvider = ({ children }) => {
  // Load saved state or default
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [screenHistory, setScreenHistory] = useState(['welcome']);
  const [language, setLanguage] = useState('en');
  
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
      text: 'Namaste Farmer! I am your AGRIWISE AI Agricultural Assistant. How can I help you with your soil, crops, or fertilizers today?',
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
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    try {
      const stateToSave = {
        currentScreen,
        language,
        soilReport,
        farmInfo,
        reminders,
        chatMessages,
        historicalReports,
        fertilizerLogs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [currentScreen, language, soilReport, farmInfo, reminders, chatMessages, historicalReports, fertilizerLogs]);

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
        text: 'Chat history cleared. How can I assist you with your farming decisions today?',
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

