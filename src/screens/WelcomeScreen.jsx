import React from 'react';
import { useApp } from '../context/AppContext';
import { FarmHeroIllustration } from '../components/illustrations/FarmHeroIllustration';
import { Sprout, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export const WelcomeScreen = () => {
  const { navigate, t } = useApp();

  return (
    <div className="screen-container no-nav" style={{ padding: '24px 20px', minHeight: '100vh', justifyContent: 'space-between' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--surface-white)',
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div 
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: 'var(--dark-green)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lime-green)'
            }}
          >
            <Sprout size={18} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--dark-green)', letterSpacing: '-0.3px' }}>
            {t.appName}
          </span>
        </div>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '8px', letterSpacing: '0.2px' }}>
          {t.tagline}
        </p>
      </div>

      {/* Hero Illustration */}
      <div style={{ margin: '16px 0' }}>
        <FarmHeroIllustration />
      </div>

      {/* Main Pitch Card */}
      <div className="agri-card" style={{ padding: '22px', backgroundColor: 'var(--surface-white)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.25', marginBottom: '8px' }}>
          {t.welcome?.title || 'Welcome to AGRIWISE'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
          {t.welcome?.subtitle || 'Your intelligent farm advisory and soil health partner.'}
        </p>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <CheckCircle2 size={15} color="#075C28" />
            </div>
            <div>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                {t.welcome?.bullet1Title}
              </span>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {t.welcome?.bullet1Desc}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <CheckCircle2 size={15} color="#075C28" />
            </div>
            <div>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                {t.welcome?.bullet2Title}
              </span>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {t.welcome?.bullet2Desc}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <CheckCircle2 size={15} color="#075C28" />
            </div>
            <div>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                {t.welcome?.bullet3Title}
              </span>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {t.welcome?.bullet3Desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div style={{ marginTop: '20px' }}>
        <button 
          className="btn-primary" 
          onClick={() => navigate('language')}
          style={{ minHeight: '54px', fontSize: '16.5px' }}
        >
          <span>{t.welcome?.getStarted || 'Get Started'}</span>
          <ArrowRight size={20} />
        </button>

        <p style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--text-light)', marginTop: '12px' }}>
          Aligned with ICAR & National Soil Health Standards • 100% Free for Farmers
        </p>
      </div>
    </div>
  );
};

