import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { FERTILIZER_SCHEDULES } from '../constants/agronomyData';
import { 
  Sprout, 
  HelpCircle, 
  AlertTriangle, 
  Info, 
  IndianRupee, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  X,
  Droplets
} from 'lucide-react';

export const FertilizerAdvisorScreen = () => {
  const { farmInfo, soilReport, addFertilizerLog, t } = useApp();
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const cropKey = farmInfo.crop || 'paddy';
  const scheduleData = FERTILIZER_SCHEDULES[cropKey] || FERTILIZER_SCHEDULES.paddy;
  const areaNumber = parseFloat(farmInfo.farmArea) || 1.0;

  const handleLogApplication = (fertName, dose) => {
    const totalDose = `${Math.round(dose * areaNumber)} kg (${fertName})`;
    addFertilizerLog(fertName, totalDose, farmInfo.growthStage);
    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 3000);
  };

  return (
    <div className="screen-container">
      <Header showBack={true} title={t.fertilizerAdvisor?.title || 'Fertilizer Advisor'} />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Crop & Field Context Bar */}
        <div 
          className="agri-card" 
          style={{ 
            padding: '16px 18px', 
            background: 'linear-gradient(135deg, #171632 0%, #201E42 100%)', 
            color: 'var(--surface-white)' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--lime-green)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.6px' }}>
                Stage-Wise Nutrient Plan
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--surface-white)', marginTop: '2px' }}>
                {scheduleData.cropName} • {farmInfo.farmArea || '2.5'} Acres
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'block' }}>Soil Status</span>
              <span className="pill-badge pill-lime" style={{ fontSize: '10px', padding: '2px 8px' }}>
                {soilReport.hasReport ? 'Lab Calibrated' : 'State Package Baseline'}
              </span>
            </div>
          </div>
        </div>

        {/* Logged notification toast */}
        {loggedSuccess && (
          <div style={{ backgroundColor: 'var(--light-green)', border: '1px solid var(--dark-green)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dark-green)', fontSize: '13px', fontWeight: '700' }}>
            <CheckCircle2 size={18} />
            <span>Successfully logged to Soil & Farming History!</span>
          </div>
        )}

        {/* Weather Precaution Banner */}
        <div style={{ backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid #FDE68A', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#92400E', display: 'block' }}>
              Weather & Application Caution
            </span>
            <p style={{ fontSize: '12px', color: '#B45309', lineHeight: '1.4' }}>
              {t.fertilizerAdvisor?.applyTip || 'Never apply nitrogen fertilizers in waterlogged fields with flowing water. Broadcast only on moist soil.'}
            </p>
          </div>
        </div>

        {/* SECTION 1: STAGE-WISE APPLICATION SCHEDULE */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--dark-green)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {t.fertilizerAdvisor?.scheduleTitle || 'CROP NUTRIENT SCHEDULE'}
            </span>
            <button 
              onClick={() => setShowSourceModal(true)} 
              className="btn-link"
              style={{ fontSize: '12px', padding: 0 }}
            >
              Why this advice?
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {scheduleData.schedule.map((stg, idx) => {
              const isCurrent = stg.isCurrent;
              return (
                <div 
                  key={idx} 
                  className="agri-card" 
                  style={{ 
                    padding: '16px',
                    border: isCurrent ? '2px solid var(--dark-green)' : '1px solid var(--border-subtle)',
                    backgroundColor: isCurrent ? '#FAFDF6' : 'var(--surface-white)',
                    boxShadow: isCurrent ? '0 8px 24px rgba(7, 92, 40, 0.1)' : 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      {isCurrent && (
                        <span className="pill-badge pill-lime" style={{ fontSize: '10px', marginBottom: '4px' }}>
                          ⚡ CURRENT ACTIVE STAGE
                        </span>
                      )}
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {stg.stageName}
                      </h3>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {stg.timing}
                      </span>
                    </div>
                  </div>

                  {/* Fertilizers List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
                    {stg.fertilizers.map((fert, fIdx) => {
                      const totalScaled = Math.round(fert.dosePerAcre * areaNumber);
                      return (
                        <div 
                          key={fIdx} 
                          style={{
                            padding: '10px 12px',
                            backgroundColor: 'var(--surface-white)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block' }}>
                              {fert.name}
                            </span>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              {fert.dosePerAcre} kg / acre ({fert.bagEquivalent})
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '15px', color: 'var(--dark-green)' }}>
                              {totalScaled} kg
                            </strong>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-light)', display: 'block' }}>
                              For {farmInfo.farmArea || '2.5'} acres
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Precaution */}
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
                    💡 {stg.precautions}
                  </p>

                  {/* Log button for current stage */}
                  {isCurrent && (
                    <button 
                      className="btn-secondary" 
                      onClick={() => handleLogApplication(stg.fertilizers[0]?.name || 'Neem Coated Urea', stg.fertilizers[0]?.dosePerAcre || 35)}
                      style={{ marginTop: '12px', minHeight: '40px', fontSize: '13px' }}
                    >
                      <span>Mark Applied & Save to History</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: ESTIMATED INPUT COSTS (Subsidized MRP) */}
        <div className="agri-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <IndianRupee size={18} color="#075C28" />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
              {t.fertilizerAdvisor?.estimatedCostTitle || 'Estimated Input Cost (Govt Subsidized MRP)'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {scheduleData.costEstimates.map((cost, cIdx) => (
              <div 
                key={cIdx} 
                style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-light)',
                  fontSize: '13px'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{cost.item}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{cost.qtyNeeded}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: 'var(--dark-green)' }}>₹{Math.round(cost.totalPerAcre * areaNumber)}</strong>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-light)', display: 'block' }}>₹{cost.totalPerAcre}/acre</span>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '12px', lineHeight: '1.4' }}>
            {t.fertilizerAdvisor?.costDisclaimer || 'Based on official Indian Govt subsidized fertilizer maximum retail prices (Urea ₹266/bag, DAP ₹1,350/bag, MOP ₹1,700/bag).'}
          </p>
        </div>

        {/* Button to open source explanation */}
        <button 
          className="btn-secondary" 
          onClick={() => setShowSourceModal(true)}
          style={{ minHeight: '48px' }}
        >
          <Info size={17} color="#075C28" />
          <span>{t.fertilizerAdvisor?.viewSourceBtn || 'View Agronomic Source & Formula'}</span>
        </button>

      </div>

      {/* Agronomic Source & Formula Modal */}
      {showSourceModal && (
        <div className="modal-overlay" onClick={() => setShowSourceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>
                {t.fertilizerAdvisor?.sourceModalTitle || 'Agronomic Recommendation Source'}
              </h3>
              <button className="icon-btn" onClick={() => setShowSourceModal(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
              {t.fertilizerAdvisor?.sourceModalContent || 
                'Calculated based on ICAR & State Agricultural University Package of Practices. Doses are split according to physiological crop demand to avoid nutrient leaching and maximize nutrient use efficiency (NUE).'}
            </p>

            <div style={{ backgroundColor: '#F8FAF5', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--dark-green)', textTransform: 'uppercase' }}>
                Key Agronomic Principles
              </span>
              <ul style={{ paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.5' }}>
                <li>Basal Phosphorus (DAP) supports early root development.</li>
                <li>Split Nitrogen (Urea) at Tillering & Panicle ensures grain number.</li>
                <li>Potash (MOP) strengthens stalks against lodging and drought.</li>
              </ul>
            </div>

            <button className="btn-primary" onClick={() => setShowSourceModal(false)}>
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

