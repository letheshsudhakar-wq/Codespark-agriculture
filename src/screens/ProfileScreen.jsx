import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { 
  User, 
  MapPin, 
  Phone, 
  Globe, 
  FileText, 
  RotateCcw, 
  Check, 
  Edit3, 
  Save, 
  X, 
  ShieldCheck, 
  Sprout, 
  Trash2,
  LogOut
} from 'lucide-react';

export const ProfileScreen = () => {
  const { 
    farmInfo, 
    updateFarmInfo, 
    language, 
    changeLanguage, 
    soilReport, 
    removeSoilReport, 
    resetAppData, 
    navigate, 
    t 
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [editForm, setEditForm] = useState({
    farmerName: farmInfo.farmerName,
    phone: farmInfo.phone || '+91 98451 23456',
    location: farmInfo.location,
    crop: farmInfo.crop,
    farmArea: farmInfo.farmArea,
    growthStage: farmInfo.growthStage,
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateFarmInfo(editForm);
    setIsEditing(false);
  };

  const handleReset = () => {
    resetAppData();
    setShowResetConfirm(false);
  };

  const languageNames = {
    en: 'English (All Regions)',
    kn: 'ಕನ್ನಡ (ಕರ್ನಾಟಕ)',
    hi: 'हिंदी (North/Central India)',
    ta: 'தமிழ் (Tamil Nadu)',
  };

  return (
    <div className="screen-container">
      <Header showBack={true} title={t.profile?.title || 'Farmer Profile'} />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Profile Header Avatar Card */}
        <div 
          className="agri-card" 
          style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #171632 0%, #222047 100%)', 
            color: 'var(--surface-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--lime-green)',
                color: 'var(--deep-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '800'
              }}
            >
              {farmInfo.farmerName ? farmInfo.farmerName.charAt(0) : 'R'}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--surface-white)', letterSpacing: '-0.3px' }}>
                {farmInfo.farmerName || 'Ramesh Kumar'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                <MapPin size={13} color="var(--lime-green)" />
                <span>{farmInfo.location || 'Mandya, Karnataka'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="icon-btn"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', color: 'var(--surface-white)' }}
            title="Edit details"
          >
            {isEditing ? <X size={18} /> : <Edit3 size={18} />}
          </button>
        </div>

        {/* Inline Profile Edit Form */}
        {isEditing ? (
          <div className="agri-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--dark-green)', marginBottom: '16px' }}>
              Edit Farmer Details
            </h3>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Farmer's Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.farmerName}
                  onChange={(e) => setEditForm({ ...editForm, farmerName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location (District, State)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Farm Area (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={editForm.farmArea}
                    onChange={(e) => setEditForm({ ...editForm, farmArea: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Crop</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.crop}
                    onChange={(e) => setEditForm({ ...editForm, crop: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Farm & Crop Overview Card */}
        <div className="agri-card" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--dark-green)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {t.profile?.farmSummary || 'FARM & CROP DETAILS'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cultivated Crop</span>
              <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{farmInfo.crop}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Area</span>
              <strong style={{ color: 'var(--text-main)' }}>{farmInfo.farmArea} Acres</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Growth Stage</span>
              <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{farmInfo.growthStage}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Irrigation Method</span>
              <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{farmInfo.irrigation}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Contact Phone</span>
              <strong style={{ color: 'var(--text-main)' }}>{farmInfo.phone || '+91 98451 23456'}</strong>
            </div>
          </div>
        </div>

        {/* Language Preference Card */}
        <div className="agri-card" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t.profile?.languagePreference || 'Language Preference'}
            </span>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
              {languageNames[language] || 'English'}
            </div>
          </div>

          <button 
            className="btn-lime"
            onClick={() => navigate('language')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {t.profile?.changeLang || 'Change'}
          </button>
        </div>

        {/* Uploaded Soil Report Status */}
        <div className="agri-card" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--dark-green)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {t.profile?.soilReportsCount || 'UPLOADED SOIL REPORTS'}
          </h3>

          {soilReport.hasReport ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAF5', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#075C28" />
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>
                    {soilReport.fileName || 'Mandya_KVK_Soil_Health_Card.pdf'}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Verified Laboratory Report • {soilReport.testDate}
                  </span>
                </div>
              </div>

              <button 
                onClick={removeSoilReport}
                className="icon-btn"
                title="Remove Report"
                style={{ width: '32px', height: '32px' }}
              >
                <Trash2 size={16} color="var(--danger)" />
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '14px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                No active laboratory soil report uploaded.
              </p>
              <button 
                className="btn-secondary" 
                onClick={() => navigate('soil-report-choice')}
                style={{ minHeight: '38px', fontSize: '12.5px' }}
              >
                + Upload Soil Report
              </button>
            </div>
          )}
        </div>

        {/* Reset / Exit App Data Button */}
        <div style={{ marginTop: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={() => setShowResetConfirm(true)}
            style={{ color: 'var(--danger)', borderColor: '#FCA5A5' }}
          >
            <RotateCcw size={17} />
            <span>{t.profile?.resetApp || 'Reset Application Data / Start Over'}</span>
          </button>

          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-light)', marginTop: '14px' }}>
            {t.profile?.appVersion || 'AGRIWISE Version 1.0 • Built for Indian Agriculture'}
          </p>
        </div>

      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)', marginBottom: '10px' }}>
              Reset All Saved Data?
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '20px' }}>
              {t.profile?.resetConfirm || 'Are you sure you want to reset all saved farm information, soil records, and return to the onboarding flow?'}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleReset}
                style={{ backgroundColor: 'var(--danger)', boxShadow: 'none' }}
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

