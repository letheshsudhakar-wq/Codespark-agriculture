import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import { CROPS, GROWTH_STAGES, IRRIGATION_METHODS } from '../constants/agronomyData';
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react';

export const FarmInfoScreen = () => {
  const { farmInfo, updateFarmInfo, soilReport, navigate, goBack, t, language, localize } = useApp();

  // Multi-step progressive form (1-3 questions per step)
  const [subStep, setSubStep] = useState(1);
  const totalSubSteps = 4;

  // Preserve existing custom crop and soil information
  const existingCrop = farmInfo.crop || 'paddy';
  const isExistingCrop = CROPS.some(c => c.id === existingCrop);

  // Local form state
  const [formData, setFormData] = useState({
    farmerName: farmInfo.farmerName || '',
    location: farmInfo.location || '',
    crop: isExistingCrop ? existingCrop : 'other',
    customCrop: isExistingCrop ? '' : existingCrop,
    soilType: farmInfo.soilType || '',
    customSoilType: '',
    farmArea: farmInfo.farmArea || '2.5',
    sowingDate: farmInfo.sowingDate || '2026-10-12',
    growthStage: farmInfo.growthStage || 'vegetative',
    irrigation: farmInfo.irrigation || 'canal_flood',
    previousFertilizers: farmInfo.previousFertilizers || 'DAP & Urea',
    organicManure: farmInfo.organicManure || 'Yes (FYM applied)',
    farmingIssues: farmInfo.farmingIssues || ['Leaf yellowing at tips'],
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleIssueToggle = (issue) => {
    setFormData((prev) => {
      const exists = prev.farmingIssues.includes(issue);
      const updated = exists 
        ? prev.farmingIssues.filter(i => i !== issue)
        : [...prev.farmingIssues, issue];
      return { ...prev, farmingIssues: updated };
    });
  };

  const handleNextSubStep = () => {
    if (subStep < totalSubSteps) {
      setSubStep(subStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Validate custom crop and soil entries
      if (formData.crop === 'other' && !formData.customCrop.trim()) {
        alert('Please enter your crop name.');
        setSubStep(2);
        return;
      }

      if (formData.soilType === 'other' && !formData.customSoilType.trim()) {
        alert('Please enter your soil type.');
        setSubStep(2);
        return;
      }

      // Save actual values, not temporary form fields
      const dataToSave = {
        ...formData,
        crop: formData.crop === 'other'
          ? formData.customCrop.trim().toLowerCase()
          : formData.crop,
        soilType: formData.soilType === 'other'
          ? formData.customSoilType.trim()
          : formData.soilType,
      };

      delete dataToSave.customCrop;
      delete dataToSave.customSoilType;

      updateFarmInfo(dataToSave);

      // Decision logic:
      // If no verified soil report, go to Screen 5 (Preliminary Soil Assessment)
      // If soil report exists, go directly to Screen 6 (Dashboard)
      if (soilReport.hasReport) {
        navigate('dashboard');
      } else {
        navigate('preliminary-assessment');
      }
    }
  };

  const handleBackSubStep = () => {
    if (subStep > 1) {
      setSubStep(subStep - 1);
    } else {
      goBack();
    }
  };

  const issueOptions = [
    'Leaf yellowing at tips',
    'Stunted or slow tillering',
    'Pest attacks or stem borer',
    'Waterlogging / poor drainage',
    'Poor flowering / grain filling',
    'No issues observed (healthy)',
  ];

  return (
    <div className="screen-container no-nav" style={{ padding: '24px 20px', minHeight: '100vh', justifyContent: 'space-between' }}>
      <div>
        {/* Header & Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={handleBackSubStep} className="icon-btn" aria-label="Go back">
            <ArrowLeft size={20} color="#075C28" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--dark-green)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Farm Details • Step {subStep} of {totalSubSteps}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                {Math.round((subStep / totalSubSteps) * 100)}%
              </span>
            </div>
            {/* Progress Track */}
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-pill)', marginTop: '6px', overflow: 'hidden' }}>
              <div 
                style={{
                  width: `${(subStep / totalSubSteps) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--dark-green)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>
        </div>

        {/* SUBSTEP 1: Farmer Name & Location */}
        {subStep === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
              Who is farming this land?
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '22px' }}>
              Helps us personalize your daily advisories and soil health records.
            </p>

            <div className="form-group">
              <label className="form-label">
                {t.farmInfo?.farmerName || "Farmer's Full Name"} *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t.farmInfo?.farmerNamePlaceholder || "e.g., Ramesh Kumar"}
                  value={formData.farmerName}
                  onChange={(e) => handleChange('farmerName', e.target.value)}
                />
                <VoiceInputButton onTranscript={(text) => handleChange('farmerName', text)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t.farmInfo?.location || "Farm Location (Village / District, State)"} *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t.farmInfo?.locationPlaceholder || "e.g., Mandya, Karnataka"}
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
                <VoiceInputButton onTranscript={(text) => handleChange('location', text)} />
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                Used to fetch local weather advisories & package of practices.
              </span>
            </div>
          </div>
        )}

        {/* SUBSTEP 2: Crop & Farm Area */}
        {subStep === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
              What crop are you cultivating?
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Select your current standing crop to calculate exact fertilizer requirements.
            </p>

            <div className="form-group">
              <label className="form-label">Select Crop</label>
              <div className="grid-2" style={{ maxHeight: '230px', overflowY: 'auto', padding: '4px' }}>
                {CROPS.map((crop) => {
                  const isSelected = formData.crop === crop.id;
                  return (
                    <div
                      key={crop.id}
                      onClick={() => handleChange('crop', crop.id)}
                      className={`selectable-card ${isSelected ? 'active' : ''}`}
                      style={{ padding: '12px 8px' }}
                    >
                      <span style={{ fontSize: '24px' }}>{crop.icon}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {crop[language === 'kn' ? 'kannada' : language === 'hi' ? 'hindi' : language === 'ta' ? 'tamil' : 'name']}
                      </span>
                    </div>
                  );
                })}

                <div
                  onClick={() => handleChange('crop', 'other')}
                  className={`selectable-card ${formData.crop === 'other' ? 'active' : ''}`}
                  style={{ padding: '12px 8px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '24px' }}>🌱</span>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                    Other Crop
                  </span>
                </div>
              </div>
            </div>

            {formData.crop === 'other' && (
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Enter Crop Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sunflower, Ragi, Jowar"
                  value={formData.customCrop}
                  onChange={e => handleChange('customCrop', e.target.value)}
                />
              </div>
            )}

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Select Soil Type</label>
              <select
                className="form-select"
                value={formData.soilType}
                onChange={e => handleChange('soilType', e.target.value)}
              >
                <option value="">Select soil type</option>
                <option value="sandy">Sandy Soil</option>
                <option value="clayey">Clayey Soil</option>
                <option value="loamy">Loamy Soil</option>
                <option value="silty">Silty Soil</option>
                <option value="black">Black Soil (Regur)</option>
                <option value="red">Red Soil</option>
                <option value="laterite">Laterite Soil</option>
                <option value="alluvial">Alluvial Soil</option>
                <option value="other">Other</option>
                <option value="unknown">I Don't Know</option>
              </select>
            </div>

            {formData.soilType === 'other' && (
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Enter Soil Type *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Describe your soil"
                  value={formData.customSoilType}
                  onChange={e => handleChange('customSoilType', e.target.value)}
                />
              </div>
            )}

            <div className="grid-2" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">Farm Area (Acres)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  className="form-input"
                  placeholder="2.5"
                  value={formData.farmArea}
                  onChange={(e) => handleChange('farmArea', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sowing Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.sowingDate}
                  onChange={(e) => handleChange('sowingDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBSTEP 3: Growth Stage & Irrigation */}
        {subStep === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
              Growth Stage & Irrigation
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Fertilizers must match the plant's current physiological stage.
            </p>

            <div className="form-group">
              <label className="form-label">Current Growth Stage</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {GROWTH_STAGES.map((stg) => {
                  const isSelected = formData.growthStage === stg.id;
                  return (
                    <div
                      key={stg.id}
                      onClick={() => handleChange('growthStage', stg.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--light-green)' : 'var(--surface-white)',
                        border: isSelected ? '2px solid var(--dark-green)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{stg.icon}</span>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                            {localize(stg.name)}
                          </span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                            {stg.days}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check size={18} color="#075C28" strokeWidth={3} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Irrigation Method</label>
              <select
                className="form-select"
                value={formData.irrigation}
                onChange={(e) => handleChange('irrigation', e.target.value)}
              >
                {IRRIGATION_METHODS.map((irr) => (
                  <option key={irr.id} value={irr.id}>
                    {localize(irr.name)} ({localize(irr.efficiency)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* SUBSTEP 4: Past Inputs & Field Issues */}
        {subStep === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
              Past Inputs & Field Concerns
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              If you don't know, you can skip or leave as default.
            </p>

            <div className="form-group">
              <label className="form-label">
                Previous Fertilizers Used <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 1 bag Urea, 1 bag DAP, or 'I don't know'"
                  value={formData.previousFertilizers}
                  onChange={(e) => handleChange('previousFertilizers', e.target.value)}
                />
                <VoiceInputButton onTranscript={(text) => handleChange('previousFertilizers', text)} />
              </div>
              <button 
                type="button" 
                onClick={() => handleChange('previousFertilizers', "I don't know")}
                className="btn-link"
                style={{ fontSize: '12px', marginTop: '4px' }}
              >
                Select "I don't know"
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">
                Organic Manure / FYM (Cow Dung) Usage
              </label>
              <select
                className="form-select"
                value={formData.organicManure}
                onChange={(e) => handleChange('organicManure', e.target.value)}
              >
                <option value="Yes (FYM / Cow dung applied)">Yes (FYM / Cow dung applied before sowing)</option>
                <option value="Yes (Vermicompost applied)">Yes (Vermicompost applied)</option>
                <option value="No organic manure used">No organic manure used this season</option>
                <option value="I don't know">I don't know</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Any crop issues observed? (Select all that apply)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {issueOptions.map((issue) => {
                  const isChecked = formData.farmingIssues.includes(issue);
                  return (
                    <div
                      key={issue}
                      onClick={() => handleIssueToggle(issue)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isChecked ? 'var(--light-green)' : 'var(--surface-white)',
                        border: isChecked ? '1.5px solid var(--dark-green)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: '13.5px'
                      }}
                    >
                      <span style={{ color: 'var(--text-main)', fontWeight: isChecked ? '700' : '500' }}>
                        {localize(issue)}
                      </span>
                      {isChecked && <Check size={16} color="#075C28" strokeWidth={3} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ marginTop: '24px' }}>
        <button className="btn-primary" onClick={handleNextSubStep}>
          <span>
            {subStep === totalSubSteps 
              ? (soilReport.hasReport ? 'Save & Open Dashboard' : 'View Preliminary Assessment') 
              : 'Next Question'}
          </span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

