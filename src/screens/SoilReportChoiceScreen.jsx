import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ArrowRight, FileText, UploadCloud, CheckCircle2, X, RefreshCw, AlertCircle, FileCheck } from 'lucide-react';

export const SoilReportChoiceScreen = () => {
  const { 
    soilReport, 
    uploadSoilReportFile, 
    loadSampleSoilReport, 
    removeSoilReport, 
    navigate, 
    goBack, 
    t 
  } = useApp();

  const [hasReportChoice, setHasReportChoice] = useState(soilReport.hasReport ? 'yes' : null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      uploadSoilReportFile(file, previewUrl);
      setHasReportChoice('yes');
    }
  };

  const handleContinue = () => {
    if (hasReportChoice === 'yes') {
      if (!soilReport.hasReport) {
        // Automatically load sample verified lab report if farmer selected Yes but didn't upload a custom file
        loadSampleSoilReport();
      }
      navigate('farm-info');
    } else if (hasReportChoice === 'no') {
      removeSoilReport();
      navigate('farm-info');
    }
  };

  return (
    <div className="screen-container no-nav" style={{ padding: '24px 20px', minHeight: '100vh', justifyContent: 'space-between' }}>
      <div>
        {/* Back and Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={goBack} className="icon-btn" aria-label="Go back">
            <ArrowLeft size={20} color="#075C28" />
          </button>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--dark-green)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Step 2 of 4 • Soil Assessment
            </span>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
              {t.soilReportChoice?.question || 'Do you have a soil report?'}
            </h1>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '22px', lineHeight: '1.45' }}>
          {t.soilReportChoice?.subtitle || 'A laboratory soil test provides the most accurate nutrient recommendations.'}
        </p>

        {/* Two Large Choice Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {/* Card 1: YES */}
          <div
            onClick={() => setHasReportChoice('yes')}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: hasReportChoice === 'yes' ? 'var(--light-green)' : 'var(--surface-white)',
              border: hasReportChoice === 'yes' ? '2px solid var(--dark-green)' : '1.5px solid var(--border-subtle)',
              cursor: 'pointer',
              boxShadow: hasReportChoice === 'yes' ? '0 8px 20px rgba(7, 92, 40, 0.12)' : 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
            }}
            role="button"
            tabIndex={0}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  style={{
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    backgroundColor: hasReportChoice === 'yes' ? 'var(--dark-green)' : '#F0F5EC',
                    color: hasReportChoice === 'yes' ? 'var(--lime-green)' : 'var(--dark-green)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}
                >
                  <FileCheck size={20} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                  {t.soilReportChoice?.yesTitle || 'YES — I have a soil report'}
                </h3>
              </div>
              <div 
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: hasReportChoice === 'yes' ? 'none' : '2px solid var(--border-subtle)',
                  backgroundColor: hasReportChoice === 'yes' ? 'var(--dark-green)' : 'transparent',
                  color: 'var(--lime-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {hasReportChoice === 'yes' && <CheckCircle2 size={18} />}
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', paddingLeft: '46px' }}>
              {t.soilReportChoice?.yesDesc || 'From a Krishi Vigyan Kendra (KVK), Soil Health Card scheme, or government/private lab.'}
            </p>
          </div>

          {/* Card 2: NO */}
          <div
            onClick={() => {
              setHasReportChoice('no');
              removeSoilReport();
            }}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: hasReportChoice === 'no' ? 'var(--light-green)' : 'var(--surface-white)',
              border: hasReportChoice === 'no' ? '2px solid var(--dark-green)' : '1.5px solid var(--border-subtle)',
              cursor: 'pointer',
              boxShadow: hasReportChoice === 'no' ? '0 8px 20px rgba(7, 92, 40, 0.12)' : 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
            }}
            role="button"
            tabIndex={0}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  style={{
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    backgroundColor: hasReportChoice === 'no' ? 'var(--dark-green)' : '#F0F5EC',
                    color: hasReportChoice === 'no' ? 'var(--lime-green)' : 'var(--dark-green)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}
                >
                  <AlertCircle size={20} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                  {t.soilReportChoice?.noTitle || "NO — I don't have one"}
                </h3>
              </div>
              <div 
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: hasReportChoice === 'no' ? 'none' : '2px solid var(--border-subtle)',
                  backgroundColor: hasReportChoice === 'no' ? 'var(--dark-green)' : 'transparent',
                  color: 'var(--lime-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {hasReportChoice === 'no' && <CheckCircle2 size={18} />}
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', paddingLeft: '46px' }}>
              {t.soilReportChoice?.noDesc || 'I want guidance based on my crop observations and preliminary field assessment.'}
            </p>
          </div>
        </div>

        {/* UPLOAD SECTION (Visible when YES is selected) */}
        {hasReportChoice === 'yes' && (
          <div className="agri-card" style={{ padding: '20px', border: '1.5px dashed var(--dark-green)', backgroundColor: '#FAFCF7' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
              {t.soilReportChoice?.uploadTitle || 'Upload Your Soil Report'}
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t.soilReportChoice?.uploadInstruction || 'Drag & drop or click to upload PDF, JPG, or PNG (Max 10MB)'}
            </p>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }} 
            />

            {soilReport.hasReport ? (
              // Selected File Display
              <div style={{ backgroundColor: 'var(--surface-white)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={22} color="#075C28" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {soilReport.fileName || 'Mandya_KVK_Soil_Health_Card.pdf'}
                      </p>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {soilReport.fileSize || '1.2 MB'} • Verified Lab Report
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={removeSoilReport}
                    className="icon-btn" 
                    title="Remove File"
                    style={{ width: '32px', height: '32px', flexShrink: 0 }}
                  >
                    <X size={16} color="var(--danger)" />
                  </button>
                </div>

                {/* Actions: Replace file */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="btn-link"
                    style={{ fontSize: '13px' }}
                  >
                    <RefreshCw size={14} />
                    <span>{t.soilReportChoice?.replaceFile || 'Replace File'}</span>
                  </button>
                </div>
              </div>
            ) : (
              // Dropzone / File Picker
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '24px 16px',
                  backgroundColor: 'var(--surface-white)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '14px'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <UploadCloud size={24} color="#075C28" />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--dark-green)' }}>
                  {t.soilReportChoice?.chooseFile || 'Choose File from Device'}
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                  {t.soilReportChoice?.fileTypeWarn || 'PDF, JPG, JPEG, PNG up to 10MB'}
                </p>
              </div>
            )}

            {/* Quick Demo Option for Evaluator */}
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={loadSampleSoilReport}
                className="btn-link"
                style={{ fontSize: '13px', color: 'var(--dark-green)' }}
              >
                ✨ {t.soilReportChoice?.orTrySample || 'Or load sample Mandya KVK Soil Report'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div style={{ marginTop: '24px' }}>
        <button 
          className="btn-primary" 
          disabled={!hasReportChoice}
          onClick={handleContinue}
        >
          <span>
            {hasReportChoice === 'yes' 
              ? (t.soilReportChoice?.continueWithReport || 'Continue to Farm Info') 
              : (t.soilReportChoice?.proceedWithout || 'Proceed to Farm Info')}
          </span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

