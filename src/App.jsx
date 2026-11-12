import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
import { SoilReportChoiceScreen } from './screens/SoilReportChoiceScreen';
import { FarmInfoScreen } from './screens/FarmInfoScreen';
import { PreliminaryAssessmentScreen } from './screens/PreliminaryAssessmentScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SoilDetailsScreen } from './screens/SoilDetailsScreen';
import { FertilizerAdvisorScreen } from './screens/FertilizerAdvisorScreen';
import { ChatbotScreen } from './screens/ChatbotScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BottomNav } from './components/common/BottomNav';
import { NotificationModal } from './components/common/NotificationModal';
import { Smartphone, Monitor } from 'lucide-react';

function AppContent() {
  const { currentScreen, deviceFrameMode, setDeviceFrameMode } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'language':
        return <LanguageSelectionScreen />;
      case 'soil-report-choice':
        return <SoilReportChoiceScreen />;
      case 'farm-info':
        return <FarmInfoScreen />;
      case 'preliminary-assessment':
        return <PreliminaryAssessmentScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'soil-details':
        return <SoilDetailsScreen />;
      case 'fertilizer-advisor':
        return <FertilizerAdvisorScreen />;
      case 'chatbot':
        return <ChatbotScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center', backgroundColor: '#E8EFE2' }}>
      
      {/* Desktop View Switcher Tool (Subtle floating pill on top-right on wide screens) */}
      <div 
        style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          zIndex: 90,
          backgroundColor: 'rgba(23, 22, 50, 0.88)',
          backdropFilter: 'blur(8px)',
          color: '#FFFFFF',
          padding: '6px 12px',
          borderRadius: '9999px',
          fontSize: '11.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}
      >
        <span style={{ opacity: 0.8 }}>Preview:</span>
        <button
          onClick={() => setDeviceFrameMode(false)}
          style={{
            border: 'none',
            background: !deviceFrameMode ? '#B8F52A' : 'transparent',
            color: !deviceFrameMode ? '#171632' : '#FFFFFF',
            padding: '3px 8px',
            borderRadius: '9999px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Mobile View (390px)"
        >
          <Smartphone size={13} />
          <span>Mobile</span>
        </button>
        <button
          onClick={() => setDeviceFrameMode(true)}
          style={{
            border: 'none',
            background: deviceFrameMode ? '#B8F52A' : 'transparent',
            color: deviceFrameMode ? '#171632' : '#FFFFFF',
            padding: '3px 8px',
            borderRadius: '9999px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Expanded Tablet / Desktop Width"
        >
          <Monitor size={13} />
          <span>Expanded</span>
        </button>
      </div>

      {/* Main Responsive Mobile Viewport */}
      <main className={`app-viewport ${deviceFrameMode ? 'fluid-mode' : ''}`}>
        {renderScreen()}
        <BottomNav />
        <NotificationModal />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
