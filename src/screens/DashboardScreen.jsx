import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { CROPS } from '../constants/agronomyData';
import { 
  FlaskConical, 
  Sprout, 
  Bot, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  CloudSun, 
  AlertCircle, 
  Plus, 
  MapPin, 
  Calendar, 
  TrendingUp,
  FileCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const DashboardScreen = () => {
  const { 
    farmInfo, 
    soilReport, 
    reminders, 
    toggleReminder, 
    addReminder, 
    navigate, 
    t,
    localize,
    language
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityCat, setNewActivityCat] = useState('Nutrient');

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (newActivityTitle.trim()) {
      addReminder(newActivityTitle.trim(), 'Scheduled custom activity', newActivityCat, 'Today');
      setNewActivityTitle('');
      setShowAddModal(false);
    }
  };

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);
  const crop = CROPS.find((item) => item.id === farmInfo.crop);
  const cropLabel = crop?.[language === 'kn' ? 'kannada' : language === 'hi' ? 'hindi' : language === 'ta' ? 'tamil' : 'name'] || farmInfo.crop;

  return (
    <div className="screen-container">
      <Header />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Farmer Welcome Greeting */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
              {t.dashboard?.greeting || 'Hello'}, {farmInfo.farmerName || 'Farmer'}! 👋
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.dashboard?.welcomeMsg || "Here's what's happening on your farm today."}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--surface-white)', padding: '6px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
            <MapPin size={13} color="#075C28" />
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)' }}>
              {farmInfo.location?.split(',')[0] || 'Mandya'}
            </span>
          </div>
        </div>

        {/* HERO CARD: Vibrant Lime Green Card (Signature visual from reference) */}
        <div className="hero-lime-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <span className="pill-badge pill-dark" style={{ fontSize: '10.5px', padding: '3px 10px', textTransform: 'uppercase' }}>
                {cropLabel} • {farmInfo.farmArea || '2.5'} {localize('Acres')}
              </span>
              <h2 style={{ fontSize: '21px', fontWeight: '800', color: 'var(--deep-navy)', marginTop: '8px', letterSpacing: '-0.4px', lineHeight: '1.2' }}>
                {localize(farmInfo.growthStage === 'vegetative' ? 'Active Tillering Phase' : 'Current Crop Stage')}
              </h2>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <Sprout size={24} color="#075C28" />
            </div>
          </div>

          <p style={{ fontSize: '13.5px', color: '#171632', lineHeight: '1.45', marginBottom: '16px', fontWeight: '500' }}>
            {soilReport.hasReport ? (
              <span>{localize('Verified soil report active. pH is')} <strong>6.8 ({localize('Optimal')})</strong>. {localize('Next top dressing of Urea is scheduled for tillering.')}</span>
            ) : (
              <span>Preliminary field assessment active. Lab testing recommended to optimize your fertilizer budget.</span>
            )}
          </p>

          <button 
            className="btn-primary" 
            onClick={() => navigate(soilReport.hasReport ? 'soil-details' : 'soil-report-choice')}
            style={{ 
              backgroundColor: 'var(--deep-navy)', 
              color: 'var(--surface-white)', 
              minHeight: '44px',
              fontSize: '14px',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            <span>{soilReport.hasReport ? 'Check Soil Health Details' : 'Upload Soil Test Report'}</span>
            <ArrowRight size={17} color="var(--lime-green)" />
          </button>
        </div>

        {/* SECTION A: SOIL HEALTH STATUS OVERVIEW */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--dark-green)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {t.dashboard?.soilHealthStatus || 'SOIL HEALTH STATUS'}
            </span>
            <button 
              onClick={() => navigate('soil-details')}
              className="btn-link" 
              style={{ fontSize: '12px', padding: 0 }}
            >
              {t.dashboard?.viewSoilReport || 'View Soil Details'} →
            </button>
          </div>

          {soilReport.hasReport ? (
            <div className="agri-card clickable" onClick={() => navigate('soil-details')} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={18} color="#075C28" />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--dark-green)' }}>
                    {t.dashboard?.verifiedReportBadge || 'Verified Lab Report (KVK)'}
                  </span>
                </div>
                <span className="pill-badge pill-green" style={{ fontSize: '10.5px' }}>
                  {localize('Healthy')}
                </span>
              </div>

              {/* 3 Parameter Micro-Cards */}
              <div className="grid-3">
                <div style={{ backgroundColor: '#F8FAF5', padding: '10px 8px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{localize('Soil pH')}</span>
                  <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>6.8</strong>
                  <span style={{ fontSize: '10px', color: '#075C28', display: 'block', fontWeight: '700' }}>{localize('Optimal')}</span>
                </div>
                <div style={{ backgroundColor: '#F8FAF5', padding: '10px 8px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{localize('Nitrogen (N)')}</span>
                  <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>235</strong>
                  <span style={{ fontSize: '10px', color: '#D97706', display: 'block', fontWeight: '700' }}>{localize('Medium')}</span>
                </div>
                <div style={{ backgroundColor: '#F8FAF5', padding: '10px 8px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{localize('Org. Carbon')}</span>
                  <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>0.54%</strong>
                  <span style={{ fontSize: '10px', color: '#EF4444', display: 'block', fontWeight: '700' }}>{localize('Mod. Low')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="agri-card" 
              style={{ 
                padding: '16px', 
                backgroundColor: '#FAFDF6', 
                border: '1.5px dashed var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={20} color="#D97706" />
                </div>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {t.dashboard?.untestedBadge || 'Soil test data unavailable'}
                  </h4>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {t.dashboard?.untestedDesc || 'Preliminary field assessment active.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('soil-report-choice')}
                className="btn-lime"
                style={{ 
                  padding: '6px 14px', 
                  borderRadius: 'var(--radius-pill)', 
                  border: 'none', 
                  fontSize: '12px', 
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Upload
              </button>
            </div>
          )}
        </div>

        {/* SECTION B: QUICK ACCESS (4 large cards inspired by reference) */}
        <div>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--dark-green)', letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
            {t.dashboard?.quickAccess || 'QUICK ACCESS'}
          </span>
          <div className="grid-2">
            {/* Card 1: Soil Details */}
            <div 
              className="agri-card clickable" 
              onClick={() => navigate('soil-details')}
              style={{ padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'var(--light-green)', color: 'var(--dark-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <FlaskConical size={20} />
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>
                {t.dashboard?.quickSoilDetails || 'Soil Details'}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t.dashboard?.quickSoilDetailsSub || 'Nutrient ranges & health'}
              </p>
            </div>

            {/* Card 2: Fertilizer Advisor */}
            <div 
              className="agri-card clickable" 
              onClick={() => navigate('fertilizer-advisor')}
              style={{ padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Sprout size={20} />
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>
                {t.dashboard?.quickFertilizer || 'Fertilizer Advisor'}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t.dashboard?.quickFertilizerSub || 'Stage-wise dosage plan'}
              </p>
            </div>

            {/* Card 3: Ask AGRIWISE AI */}
            <div 
              className="agri-card clickable" 
              onClick={() => navigate('chatbot')}
              style={{ padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(184, 245, 42, 0.35)', color: 'var(--dark-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Bot size={20} />
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>
                {t.dashboard?.quickChatbot || 'Ask AGRIWISE'}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t.dashboard?.quickChatbotSub || 'AI assistant & voice'}
              </p>
            </div>

            {/* Card 4: Soil History */}
            <div 
              className="agri-card clickable" 
              onClick={() => navigate('history')}
              style={{ padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <History size={20} />
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>
                {t.dashboard?.quickHistory || 'Soil History'}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t.dashboard?.quickHistorySub || 'Logs & report comparison'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION C: LOCAL WEATHER WIDGET */}
        <div 
          className="agri-card" 
          style={{ 
            padding: '16px 18px', 
            background: 'linear-gradient(135deg, #171632 0%, #222047 100%)', 
            color: 'var(--surface-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <CloudSun size={18} color="var(--lime-green)" />
              <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {farmInfo.location || 'Mandya'} {localize('Forecast')}
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800' }}>
              29°C <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>• {localize('Partly Cloudy')}</span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--lime-green)', marginTop: '4px' }}>
              {localize('Rain Probability')}: {localize('Low')} (12%) • {localize('Safe for field activities')}
            </p>
          </div>

          <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '14px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block' }}>{localize('Humidity')}</span>
            <strong style={{ fontSize: '15px' }}>64%</strong>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: '2px' }}>{localize('Wind')}</span>
            <strong style={{ fontSize: '13px' }}>11 km/h</strong>
          </div>
        </div>

        {/* SECTION D: ACTIONS & REMINDERS */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--dark-green)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {t.dashboard?.actionsTitle || "TODAY'S REMINDERS & ACTIVITIES"}
            </span>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="btn-link"
              style={{ fontSize: '12px', padding: 0 }}
            >
              {t.dashboard?.addReminder || '+ Add Activity'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reminders.map((rem) => (
              <div 
                key={rem.id}
                onClick={() => toggleReminder(rem.id)}
                style={{
                  backgroundColor: rem.completed ? '#F7FAF3' : 'var(--surface-white)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: rem.completed ? '1px solid #E1ECD8' : '1px solid var(--border-subtle)',
                  boxShadow: rem.completed ? 'none' : 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: 'pointer',
                  opacity: rem.completed ? 0.7 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {rem.completed ? (
                    <CheckCircle2 size={20} color="#075C28" strokeWidth={2.5} />
                  ) : (
                    <Circle size={20} color="#829787" strokeWidth={2} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 
                      style={{ 
                        fontSize: '13.5px', 
                        fontWeight: '700', 
                        color: 'var(--text-main)',
                        textDecoration: rem.completed ? 'line-through' : 'none'
                      }}
                    >
                      {localize(rem.title)}
                    </h4>
                    <span className="pill-badge pill-green" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {localize(rem.category)}
                    </span>
                  </div>
                  <p 
                    style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-muted)', 
                      marginTop: '3px',
                      textDecoration: rem.completed ? 'line-through' : 'none'
                    }}
                  >
                    {localize(rem.subtitle)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source citation footnote */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-light)', marginTop: '8px' }}>
          {t.dashboard?.sourceDisclaimer || 'Agronomic advisories aligned with ICAR & State Agriculture Universities.'}
        </p>

      </div>

      {/* Add Custom Activity Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)' }}>
              Add Farm Activity Reminder
            </h3>
            <form onSubmit={handleAddActivity}>
              <div className="form-group">
                <label className="form-label">Activity Description *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apply Zinc Sulphate foliar spray"
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={newActivityCat}
                  onChange={(e) => setNewActivityCat(e.target.value)}
                >
                  <option value="Nutrient">Nutrient / Fertilizer</option>
                  <option value="Irrigation">Irrigation Management</option>
                  <option value="Pest Check">Pest & Disease Inspection</option>
                  <option value="Soil Health">Soil Health Practice</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={!newActivityTitle.trim()}>
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
