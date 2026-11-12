import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { 
  FlaskConical, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  Info, 
  HelpCircle, 
  ArrowRight, 
  Leaf, 
  ChevronDown, 
  ChevronUp,
  FileCheck
} from 'lucide-react';

export const SoilDetailsScreen = () => {
  const { soilReport, navigate, loadSampleSoilReport, t, localize } = useApp();
  const [expandedParam, setExpandedParam] = useState('ph');

  const params = soilReport.parameters || {};

  const toggleExpand = (key) => {
    setExpandedParam(expandedParam === key ? null : key);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return { bg: '#EAF8DC', text: '#075C28', bar: '#10B981' };
      case 'medium': return { bg: '#FEF3C7', text: '#D97706', bar: '#F59E0B' };
      case 'low': return { bg: '#FEE2E2', text: '#DC2626', bar: '#EF4444' };
      case 'high': return { bg: '#EDE9FE', text: '#6D28D9', bar: '#8B5CF6' };
      default: return { bg: '#F3F4F6', text: '#4B5563', bar: '#9CA3AF' };
    }
  };

  const calculateMeterWidth = (val, min, max) => {
    if (!val || !max) return 50;
    const clamped = Math.max(min, Math.min(val, max));
    return Math.round(((clamped - min) / (max - min)) * 100);
  };

  return (
    <div className="screen-container">
      <Header showBack={true} title={t.soilDetails?.title || 'Soil Health Details'} />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* If Verified Lab Data Exists */}
        {soilReport.hasReport && soilReport.parameters ? (
          <div>
            {/* Report Header Card */}
            <div className="agri-card" style={{ padding: '18px', backgroundColor: 'var(--surface-white)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="pill-badge pill-green" style={{ fontSize: '11px', marginBottom: '8px' }}>
                    <FileCheck size={14} />
                    <span>{t.soilDetails?.labReportHeader || 'Laboratory Soil Health Card'}</span>
                  </div>
                  <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {localize(soilReport.labName || 'Krishi Vigyan Kendra (KVK) Soil Lab')}
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.soilDetails?.testDate || 'Test Date'}: {soilReport.testDate || '15 Oct 2026'} • Sample #8842
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Summary Banner */}
            <div style={{ backgroundColor: 'var(--light-green)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--light-green-border)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Leaf size={20} color="#075C28" flexShrink={0} />
              <p style={{ fontSize: '12.5px', color: 'var(--dark-green)', fontWeight: '600', lineHeight: '1.4' }}>
                {localize('Your soil pH is in the')} <strong>{localize('optimal range')} (6.8)</strong>. {localize('Focus on raising organic carbon with farmyard manure and balancing zinc.')}
              </p>
            </div>

            {/* Soil Parameters List (Interactive expandable cards) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(params).map(([key, item]) => {
                const colors = getStatusColor(item.status);
                const isExpanded = expandedParam === key;
                const percent = calculateMeterWidth(item.value, item.min, item.max);

                return (
                  <div 
                    key={key} 
                    className="agri-card"
                    style={{ padding: '16px', transition: 'all 0.2s ease', cursor: 'pointer' }}
                    onClick={() => toggleExpand(key)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                          {localize(item.name)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--dark-green)' }}>
                            {item.value} {item.unit}
                          </span>
                          <span 
                            style={{ 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              backgroundColor: colors.bg, 
                              color: colors.text,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)'
                            }}
                          >
                            {localize(item.statusLabel)}
                          </span>
                        </div>
                      </div>

                      <div style={{ color: 'var(--text-muted)' }}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Minimal Progress Range Bar */}
                    <div className="range-meter-track" style={{ marginTop: '10px' }}>
                      <div 
                        className="range-meter-fill" 
                        style={{ width: `${percent}%`, backgroundColor: colors.bar }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-light)' }}>
                      <span>{localize('Low')}</span>
                      <span>{localize('Target')}: {localize(item.range)}</span>
                      <span>{localize('High')}</span>
                    </div>

                    {/* Expandable Explanation & Recommendation */}
                    {isExpanded && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {t.soilDetails?.whatItMeans || 'What This Means for Your Crop'}
                          </span>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-main)', marginTop: '2px', lineHeight: '1.45' }}>
                            {localize(item.description)}
                          </p>
                        </div>

                        <div style={{ backgroundColor: '#F8FAF5', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--dark-green)', textTransform: 'uppercase' }}>
                            {t.soilDetails?.recommendation || 'Recommended Soil Practice'}
                          </span>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.45' }}>
                            {localize(item.recommendation)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Link to Fertilizer Advisor */}
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn-primary" 
                onClick={() => navigate('fertilizer-advisor')}
              >
                <span>View Fertilizer Dosages for this Soil</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : (
          /* When NO Soil Report Exists - Honest, Farmer-Friendly Empty & Guide State */
          <div>
            <div 
              className="agri-card" 
              style={{ 
                padding: '24px 20px', 
                textAlign: 'center', 
                backgroundColor: 'var(--surface-white)',
                border: '1.5px solid var(--border-subtle)',
                marginBottom: '20px'
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <FlaskConical size={28} />
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                {t.soilDetails?.missingDataHeader || 'Laboratory Soil Data Unavailable'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
                {t.soilDetails?.missingDataDesc || 'You have not uploaded a verified soil test report yet. Showing baseline agronomic guidelines for your region and crop.'}
              </p>

              <button 
                className="btn-primary btn-lime" 
                onClick={() => navigate('soil-report-choice')}
                style={{ marginBottom: '10px' }}
              >
                <UploadCloud size={18} />
                <span>{t.soilDetails?.uploadPrompt || 'Upload Laboratory Report Now'}</span>
              </button>

              <button 
                type="button" 
                onClick={loadSampleSoilReport}
                className="btn-link"
                style={{ fontSize: '13px' }}
              >
                ✨ Try with sample Mandya KVK Report
              </button>
            </div>

            {/* Step-by-Step Illustrated Soil Sampling Guide */}
            <div className="agri-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--dark-green)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={18} />
                <span>{t.soilDetails?.guideTitle || 'How to Collect a Proper Soil Sample'}</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--dark-green)', color: 'var(--lime-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>
                    1
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {t.soilDetails?.step1 || "Scrape surface litter. Dig a V-shaped hole (15 cm deep) at 8-10 spots across your field."}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--dark-green)', color: 'var(--lime-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>
                    2
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {t.soilDetails?.step2 || "Collect a 1-inch slice of soil from top to bottom of the V-cut."}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--dark-green)', color: 'var(--lime-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>
                    3
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {t.soilDetails?.step3 || "Thoroughly mix all slices on a clean sheet, quarter the pile to retain ~500 grams."}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--dark-green)', color: 'var(--lime-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>
                    4
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {t.soilDetails?.step4 || "Shade-dry the sample and take it to your nearest KVK or Raitha Samparka Kendra."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
