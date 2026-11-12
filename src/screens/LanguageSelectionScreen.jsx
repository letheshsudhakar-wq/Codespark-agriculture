import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ArrowRight, Check, Globe } from 'lucide-react';

export const LanguageSelectionScreen = () => {
  const { language, changeLanguage, navigate, goBack, screenHistory, t, localize } = useApp();
  const [selected, setSelected] = useState(language);

  const languages = [
    {
      code: 'en',
      native: 'English',
      english: 'English',
      region: 'All agricultural zones of India',
      badge: 'Default',
    },
    {
      code: 'kn',
      native: 'ಕನ್ನಡ',
      english: 'Kannada',
      region: 'ಕರ್ನಾಟಕದ ರೈತರಿಗೆ',
      badge: 'Karnataka',
    },
    {
      code: 'hi',
      native: 'हिंदी',
      english: 'Hindi',
      region: 'उत्तर व मध्य भारत के किसानों के लिए',
      badge: 'North & Central India',
    },
    {
      code: 'ta',
      native: 'தமிழ்',
      english: 'Tamil',
      region: 'தமிழ்நாட்டு விவசாயிகளுக்கு',
      badge: 'Tamil Nadu',
    },
  ];

  const handleSelect = (code) => {
    setSelected(code);
    changeLanguage(code);
  };

  const handleContinue = () => {
    changeLanguage(selected);
    const previousScreen = screenHistory[screenHistory.length - 2];
    if (previousScreen && previousScreen !== 'welcome') {
      goBack();
    } else {
      navigate('soil-report-choice');
    }
  };

  return (
    <div className="screen-container no-nav" style={{ padding: '24px 20px', minHeight: '100vh', justifyContent: 'space-between' }}>
      <div>
        {/* Top Back & Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={goBack} className="icon-btn" aria-label="Go back">
            <ArrowLeft size={20} color="#075C28" />
          </button>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--dark-green)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {localize('Step 1 of 4 • Onboarding')}
            </span>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
              {t.languageScreen?.title || 'Choose Your Language'}
            </h1>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4' }}>
          {t.languageScreen?.subtitle || 'Select your preferred language for the application interface.'}
        </p>

        {/* Language Selection Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {languages.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <div
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isSelected ? 'var(--light-green)' : 'var(--surface-white)',
                  border: isSelected ? '2px solid var(--dark-green)' : '1.5px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 6px 16px rgba(7, 92, 40, 0.12)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s ease',
                }}
                role="button"
                tabIndex={0}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: isSelected ? 'var(--dark-green)' : '#F0F5EC',
                      color: isSelected ? 'var(--lime-green)' : 'var(--dark-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '16px',
                    }}
                  >
                    {lang.code.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {lang.native}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ({lang.english})
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {localize(lang.region)}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--dark-green)',
                      color: 'var(--lime-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={16} strokeWidth={3} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '2px solid var(--border-subtle)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action */}
      <div style={{ marginTop: '28px' }}>
        <button className="btn-primary" onClick={handleContinue}>
          <span>{t.languageScreen?.continue || 'Continue'}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
