import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, ArrowRight, CheckCircle2, FileQuestion, HelpCircle, MapPin, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

export const PreliminaryAssessmentScreen = () => {
  const { farmInfo, navigate, t } = useApp();

  return (
    <div className="screen-container no-nav" style={{ padding: '24px 20px', minHeight: '100vh', justifyContent: 'space-between' }}>
      <div>
        {/* Banner Badge */}
        <div style={{ marginBottom: '16px' }}>
          <div className="pill-badge pill-warning" style={{ fontSize: '11.5px', padding: '6px 14px', gap: '8px' }}>
            <AlertTriangle size={15} />
            <span>{t.preliminaryAssessment?.badge || 'Preliminary Soil Assessment'}</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.3px' }}>
            Field Observation Assessment
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            For {farmInfo.farmerName || 'Farmer'} • {farmInfo.crop?.toUpperCase() || 'PADDY'} ({farmInfo.farmArea || '2.5'} Acres)
          </p>
        </div>

        {/* Honest Non-Laboratory Disclaimer Box */}
        <div 
          style={{
            backgroundColor: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px'
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldAlert size={18} color="#D97706" />
          </div>
          <div>
            <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#92400E', marginBottom: '4px' }}>
              Laboratory Soil Test Not Available
            </h4>
            <p style={{ fontSize: '12.5px', color: '#B45309', lineHeight: '1.45' }}>
              {t.preliminaryAssessment?.notLabReportNotice || 
                'IMPORTANT: This is a field-observation assessment, NOT a laboratory soil test report. We do not fabricate soil pH, NPK numbers, or fertility percentages without laboratory testing.'}
            </p>
          </div>
        </div>

        {/* Section 1: Summary of Available Information */}
        <div className="agri-card" style={{ marginBottom: '16px', padding: '18px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--dark-green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{t.preliminaryAssessment?.summaryTitle || 'Available Field Information'}</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Crop</span>
              <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{farmInfo.crop}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Farm Area</span>
              <strong style={{ color: 'var(--text-main)' }}>{farmInfo.farmArea} Acres</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Growth Stage</span>
              <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{farmInfo.growthStage}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Irrigation</span>
              <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{farmInfo.irrigation}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Critical Missing Laboratory Parameters */}
        <div className="agri-card" style={{ marginBottom: '16px', padding: '18px', borderLeft: '4px solid #D97706' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#92400E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileQuestion size={16} color="#D97706" />
            <span>{t.preliminaryAssessment?.missingTitle || 'Missing Laboratory Parameters'}</span>
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '10px' }}>
            {t.preliminaryAssessment?.missingDesc || 
              'Without a laboratory soil test, exact soil pH, organic carbon %, and available nitrogen/phosphorus/potassium remain unknown. Testing prevents costly over-fertilization.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span className="pill-badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontSize: '11px' }}>Soil pH (Unknown)</span>
            <span className="pill-badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontSize: '11px' }}>Available N-P-K (Unknown)</span>
            <span className="pill-badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontSize: '11px' }}>Organic Carbon % (Unknown)</span>
            <span className="pill-badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontSize: '11px' }}>Zinc / Boron (Unknown)</span>
          </div>
        </div>

        {/* Section 3: General Soil Management Guidance */}
        <div className="agri-card" style={{ marginBottom: '16px', padding: '18px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#075C28" />
            <span>{t.preliminaryAssessment?.guidanceTitle || 'General Soil Management Guidance'}</span>
          </h3>
          <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <li style={{ marginBottom: '6px' }}>
              <strong>Build Soil Organic Matter:</strong> Regularly incorporate 3-4 tonnes/acre of well-rotted FYM or grow Dhaincha/Sunn hemp green manure between seasons.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>Split Nitrogen Applications:</strong> Never apply all nitrogen at once. Divide urea into 2 or 3 split applications to prevent leaching.
            </li>
            <li>
              <strong>Observe Crop Symptoms:</strong> Check leaf tips for chlorosis. If tips turn yellow first, suspect nitrogen deficiency; if blotchy brown, suspect zinc shortage.
            </li>
          </ul>
        </div>

        {/* Section 4: Recommended Next Step: KVK Testing */}
        <div style={{ backgroundColor: 'var(--light-green)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--light-green-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Building2 size={18} color="#075C28" />
            <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--dark-green)' }}>
              {t.preliminaryAssessment?.actionStepsTitle || 'How to Get an Official Soil Test'}
            </h4>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Visit your nearest <strong>Krishi Vigyan Kendra (KVK)</strong> or <strong>Raitha Samparka Kendra</strong>. Government soil testing fees are subsidised (₹20 to ₹50). You can upload the report here anytime to unlock verified nutrient analysis.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginTop: '24px' }}>
        <button className="btn-primary" onClick={() => navigate('dashboard')}>
          <span>{t.preliminaryAssessment?.proceedToDashboard || 'Proceed to Farm Dashboard'}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

