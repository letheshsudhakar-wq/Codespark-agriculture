import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sprout, Bell, User, ArrowLeft, Globe } from 'lucide-react';

export const Header = ({ showBack = false, title = null }) => {
  const { currentScreen, goBack, navigate, setShowNotifications, notifications, language, t, localize } = useApp();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack ? (
          <button 
            onClick={goBack} 
            className="icon-btn" 
            aria-label={t.common.back}
            style={{ width: '38px', height: '38px' }}
          >
            <ArrowLeft size={20} color="#075C28" />
          </button>
        ) : null}

        {title ? (
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
            {title}
          </h1>
        ) : (
          <div className="brand-badge" onClick={() => navigate('dashboard')} role="button" tabIndex={0}>
            <div className="brand-icon">
              <Sprout size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="brand-name">{t.appName}</div>
              <div className="brand-tagline">{t.tagline}</div>
            </div>
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Quick Language switch pill */}
        <button 
          className="icon-btn" 
          onClick={() => navigate('language')}
          title={t.profile?.changeLang || t.languageScreen?.title}
          style={{ width: 'auto', padding: '0 10px', gap: '4px', fontSize: '12px', fontWeight: '700' }}
        >
          <Globe size={15} color="#075C28" />
          <span style={{ textTransform: 'uppercase' }}>{language}</span>
        </button>

        {/* Notifications Bell */}
        <button 
          className="icon-btn" 
          onClick={() => setShowNotifications(true)}
          aria-label={localize('Notifications')}
          title={localize('Notifications')}
        >
          <Bell size={19} color="#18251B" />
          {unreadCount > 0 && <span className="badge-dot" />}
        </button>

        {/* Farmer Profile shortcut */}
        <button 
          className="icon-btn" 
          onClick={() => navigate('profile')}
          aria-label={t.profile?.title || 'Profile'}
          title={t.profile?.title || 'Profile'}
          style={{ backgroundColor: currentScreen === 'profile' ? 'var(--light-green)' : 'var(--surface-white)' }}
        >
          <User size={19} color="#075C28" />
        </button>
      </div>
    </header>
  );
};
