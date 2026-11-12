import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { 
  History, 
  FileText, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Layers, 
  TrendingUp,
  X,
  FileCheck
} from 'lucide-react';

export const HistoryScreen = () => {
  const { 
    historicalReports, 
    fertilizerLogs, 
    addFertilizerLog, 
    reminders, 
    farmInfo, 
    t 
  } = useApp();

  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'reports' | 'fertilizers'
  const [showLogModal, setShowLogModal] = useState(false);
  const [fertItem, setFertItem] = useState('');
  const [fertQty, setFertQty] = useState('');

  const handleAddLog = (e) => {
    e.preventDefault();
    if (fertItem && fertQty) {
      addFertilizerLog(fertItem, fertQty, farmInfo.growthStage);
      setFertItem('');
      setFertQty('');
      setShowLogModal(false);
    }
  };

  const rep1 = historicalReports[0]; // 2026
  const rep2 = historicalReports[1]; // 2025

  return (
    <div className="screen-container">
      <Header showBack={true} title={t.history?.title || 'Soil & Farm History'} />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', backgroundColor: 'var(--surface-white)', padding: '4px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('comparison')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: activeTab === 'comparison' ? 'var(--dark-green)' : 'transparent',
              color: activeTab === 'comparison' ? 'var(--lime-green)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {t.history?.tabs?.comparison || 'Comparison'}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: activeTab === 'reports' ? 'var(--dark-green)' : 'transparent',
              color: activeTab === 'reports' ? 'var(--lime-green)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {t.history?.tabs?.reports || 'Reports'}
          </button>
          <button
            onClick={() => setActiveTab('fertilizers')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: activeTab === 'fertilizers' ? 'var(--dark-green)' : 'transparent',
              color: activeTab === 'fertilizers' ? 'var(--lime-green)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {t.history?.tabs?.fertilizers || 'Fertilizer Log'}
          </button>
        </div>

        {/* TAB 1: COMPARISON VIEW */}
        {activeTab === 'comparison' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                {t.history?.compareTitle || 'Soil Health Trend Over Time'}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Comparing Kharif 2025 vs Rabi 2026 test results
              </p>
            </div>

            {/* Comparison Table Card */}
            <div className="agri-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', backgroundColor: '#F8FAF5', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>
                <span>PARAMETER</span>
                <span style={{ textAlign: 'center' }}>2025</span>
                <span style={{ textAlign: 'center' }}>2026</span>
                <span style={{ textAlign: 'right' }}>TREND</span>
              </div>

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* pH */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', padding: '12px 14px', borderBottom: '1px solid var(--border-light)', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Soil pH</span>
                  <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>6.4</span>
                  <span style={{ textAlign: 'center', fontWeight: '800', color: 'var(--dark-green)' }}>6.8</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px', color: '#10B981', fontWeight: '800' }}>
                    <ArrowUpRight size={16} />
                    <span style={{ fontSize: '11px' }}>+0.4</span>
                  </div>
                </div>

                {/* Organic Carbon */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', padding: '12px 14px', borderBottom: '1px solid var(--border-light)', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Org. Carbon</span>
                  <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>0.46%</span>
                  <span style={{ textAlign: 'center', fontWeight: '800', color: 'var(--dark-green)' }}>0.54%</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px', color: '#10B981', fontWeight: '800' }}>
                    <ArrowUpRight size={16} />
                    <span style={{ fontSize: '11px' }}>+17%</span>
                  </div>
                </div>

                {/* Nitrogen */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', padding: '12px 14px', borderBottom: '1px solid var(--border-light)', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Available N</span>
                  <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>210</span>
                  <span style={{ textAlign: 'center', fontWeight: '800', color: 'var(--dark-green)' }}>235</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px', color: '#10B981', fontWeight: '800' }}>
                    <ArrowUpRight size={16} />
                    <span style={{ fontSize: '11px' }}>+12%</span>
                  </div>
                </div>

                {/* Phosphorus */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', padding: '12px 14px', borderBottom: '1px solid var(--border-light)', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Available P</span>
                  <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>16.0</span>
                  <span style={{ textAlign: 'center', fontWeight: '800', color: 'var(--dark-green)' }}>19.5</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px', color: '#10B981', fontWeight: '800' }}>
                    <ArrowUpRight size={16} />
                    <span style={{ fontSize: '11px' }}>+22%</span>
                  </div>
                </div>

                {/* Potassium */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', padding: '12px 14px', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Available K</span>
                  <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>270</span>
                  <span style={{ textAlign: 'center', fontWeight: '800', color: 'var(--dark-green)' }}>285</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px', color: '#10B981', fontWeight: '800' }}>
                    <ArrowUpRight size={16} />
                    <span style={{ fontSize: '11px' }}>+5%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agronomic Insight from Comparison */}
            <div style={{ backgroundColor: 'var(--light-green)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--light-green-border)', marginTop: '16px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--dark-green)', textTransform: 'uppercase' }}>
                Agronomic Evaluation
              </span>
              <p style={{ fontSize: '12.5px', color: 'var(--dark-green)', marginTop: '4px', lineHeight: '1.45' }}>
                Your regular incorporation of <strong>Farmyard Manure (FYM)</strong> over the past year has successfully increased Organic Carbon from 0.46% to 0.54% and shifted pH closer to neutral 6.8. Keep up this organic practice!
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SOIL REPORTS LIST */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historicalReports.map((rep) => (
              <div key={rep.id} className="agri-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--light-green)', color: 'var(--dark-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {rep.title}
                      </h3>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {rep.date} • {rep.lab}
                      </span>
                    </div>
                  </div>
                  <span className="pill-badge pill-green" style={{ fontSize: '10px' }}>
                    {rep.status}
                  </span>
                </div>

                <div className="grid-3" style={{ marginTop: '10px', backgroundColor: '#F8FAF5', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>pH</span>
                    <strong style={{ fontSize: '14px', color: 'var(--dark-green)' }}>{rep.ph}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Available N</span>
                    <strong style={{ fontSize: '14px', color: 'var(--dark-green)' }}>{rep.nitrogen} kg/ha</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Org. Carbon</span>
                    <strong style={{ fontSize: '14px', color: 'var(--dark-green)' }}>{rep.organicCarbon}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: FERTILIZER LOGS */}
        {activeTab === 'fertilizers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--dark-green)', textTransform: 'uppercase' }}>
                Recorded Fertilizer Applications
              </span>
              <button 
                onClick={() => setShowLogModal(true)}
                className="btn-link"
                style={{ fontSize: '12px', padding: 0 }}
              >
                + Log Fertilizer
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fertilizerLogs.map((log) => (
                <div key={log.id} className="agri-card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {log.item}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--dark-green)', fontWeight: '600' }}>
                        Quantity: {log.quantity}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {log.date}
                    </span>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span className="pill-badge pill-green" style={{ fontSize: '10px' }}>
                      {log.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Log Fertilizer Modal */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>
                Log Fertilizer Application
              </h3>
              <button className="icon-btn" onClick={() => setShowLogModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLog}>
              <div className="form-group">
                <label className="form-label">Fertilizer Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Neem-Coated Urea"
                  value={fertItem}
                  onChange={(e) => setFertItem(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Quantity Applied *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 50 kg (1 bag)"
                  value={fertQty}
                  onChange={(e) => setFertQty(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowLogModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={!fertItem || !fertQty}>
                  Save to History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

