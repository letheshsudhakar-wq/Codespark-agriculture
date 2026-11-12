import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Bot, FlaskConical, User } from 'lucide-react';

export const BottomNav = () => {
  const { currentScreen, navigate, t } = useApp();

  // Hide nav on onboarding screens
  const onboardingScreens = ['welcome', 'language', 'soil-report-choice', 'farm-info', 'preliminary-assessment'];
  if (onboardingScreens.includes(currentScreen)) {
    return null;
  }

  const navItems = [
    {
      id: 'dashboard',
      label: t.nav?.home || 'Home',
      icon: Home,
    },
    {
      id: 'chatbot',
      label: t.nav?.chat || 'AI Assistant',
      icon: Bot,
    },
    {
      id: 'soil-details',
      label: t.nav?.history ? 'Soil' : 'Soil',
      icon: FlaskConical,
    },
    {
      id: 'profile',
      label: t.nav?.profile || 'Profile',
      icon: User,
    },
  ];

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav-bar" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id || 
            (item.id === 'soil-details' && (currentScreen === 'fertilizer-advisor' || currentScreen === 'history'));

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
              </div>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

