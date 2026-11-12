import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, CloudRain, Sprout, Building2, CheckCircle2 } from 'lucide-react';

export const NotificationModal = () => {
  const { showNotifications, setShowNotifications, notifications } = useApp();

  if (!showNotifications) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'weather': return <CloudRain size={20} color="#075C28" />;
      case 'crop': return <Sprout size={20} color="#075C28" />;
      case 'kvk': return <Building2 size={20} color="#075C28" />;
      default: return <CheckCircle2 size={20} color="#075C28" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
              Farm Alerts & Notifications
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Real-time weather, crop & advisory updates
            </p>
          </div>
          <button 
            className="icon-btn" 
            onClick={() => setShowNotifications(false)}
            aria-label="Close notifications"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n) => (
            <div 
              key={n.id} 
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: n.read ? '#FAFCF8' : 'var(--light-green)',
                border: '1px solid ' + (n.read ? 'var(--border-subtle)' : 'var(--light-green-border)'),
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}
            >
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {n.title}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.time}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="btn-secondary" 
          onClick={() => setShowNotifications(false)}
          style={{ marginTop: '20px' }}
        >
          Close Alerts
        </button>
      </div>
    </div>
  );
};

