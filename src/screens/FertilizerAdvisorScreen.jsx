
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { Sprout, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export const FertilizerAdvisorScreen = () => {
  const { farmInfo, t } = useApp();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const crop = farmInfo.crop || '';
  const irrigation =
    farmInfo.irrigation === 'rainfed' ? 'rainfed' : 'irrigated';

  const getAdvice = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/advisory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crop,
          irrigation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to get advisory.');
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message || 'Cannot connect to the advisory server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const genericRate = result?.outputs?.generic_package_of_practice;
  const soilStatus = result?.outputs?.soil_nutrient_status;

  return (
    <div className="screen-container">
      <Header
        showBack={true}
        title={t.fertilizerAdvisor?.title || 'Fertilizer Advisor'}
      />

      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div
          className="agri-card"
          style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #171632, #201E42)',
            color: 'white',
          }}
        >
          <Sprout size={28} color="#B8E986" />

          <h2 style={{ fontSize: '19px', marginTop: '10px' }}>
            Agricultural Nutrient Advisory
          </h2>

          <p style={{ fontSize: '13px', marginTop: '8px', opacity: 0.85 }}>
            Crop: {crop || 'Not specified'}
            <br />
            Farm area: {farmInfo.farmArea || 'Not specified'} acres
            <br />
            Irrigation: {farmInfo.irrigation || 'Not specified'}
          </p>
        </div>

        <div
          style={{
            padding: '14px',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '12px',
            display: 'flex',
            gap: '10px',
          }}
        >
          <AlertTriangle size={20} color="#B45309" />

          <p style={{ fontSize: '12px', color: '#92400E' }}>
            Soil-test-based personalised fertilizer quantities are not
            currently supported. The system will not invent missing
            measurements or fertilizer doses.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={getAdvice}
          disabled={loading}
          style={{ minHeight: '48px' }}
        >
          {loading ? 'Generating advisory...' : 'Generate AI Advisory'}
        </button>

        {error && (
          <div
            style={{
              padding: '14px',
              background: '#FEE2E2',
              borderRadius: '10px',
              color: '#991B1B',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="agri-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckCircle2 color="#075C28" size={20} />
                <h3 style={{ fontSize: '15px' }}>Advisory generated</h3>
              </div>

              <p style={{ fontSize: '13px', marginTop: '10px' }}>
                Crop: {result.input_crop}
              </p>

              <p style={{ fontSize: '13px', marginTop: '6px' }}>
                Assessment level: {result.tier_reached}
              </p>
            </div>

            {genericRate && (
              <div className="agri-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800' }}>
                  Generic Crop-Level Nutrient Rate
                </h3>

                <p style={{ fontSize: '12px', color: '#B45309', marginTop: '8px' }}>
                  {genericRate.label}
                </p>

                <p style={{ fontSize: '14px', marginTop: '12px' }}>
                  Nitrogen: {genericRate.N_kg_ha} kg/ha
                </p>
                <p style={{ fontSize: '14px', marginTop: '6px' }}>
                  Phosphorus (P₂O₅): {genericRate.P2O5_kg_ha} kg/ha
                </p>
                <p style={{ fontSize: '14px', marginTop: '6px' }}>
                  Potassium (K₂O): {genericRate.K2O_kg_ha} kg/ha
                </p>

                <p style={{ fontSize: '12px', marginTop: '10px' }}>
                  Record: {genericRate.record}
                </p>

                <p style={{ fontSize: '12px', color: '#B45309', marginTop: '8px' }}>
                  Status: {genericRate.farmer_use_status}
                </p>
              </div>
            )}

            {soilStatus && (
              <div className="agri-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800' }}>
                  Soil Measurements
                </h3>

                {Object.entries(soilStatus).map(([name, item]) => (
                  <p key={name} style={{ fontSize: '13px', marginTop: '10px' }}>
                    {name}: {item.value} {item.unit}
                    {' — '}
                    {item.interpretation}
                  </p>
                ))}
              </div>
            )}

            {result.missing_critical?.length > 0 && (
              <div className="agri-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800' }}>
                  Information Still Required
                </h3>

                {result.missing_critical.map((item, index) => (
                  <div key={index} style={{ marginTop: '12px' }}>
                    <strong style={{ fontSize: '13px' }}>
                      {item[0]}
                    </strong>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item[1]}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {result.refusals?.length > 0 && (
              <div className="agri-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800' }}>
                  Validation Notes
                </h3>

                {result.refusals.map((note, index) => (
                  <p key={index} style={{ fontSize: '12px', marginTop: '10px' }}>
                    {note}
                  </p>
                ))}
              </div>
            )}

            {result.messages?.map((message, index) => (
              <p key={index} style={{ fontSize: '12px' }}>
                <Info size={14} style={{ verticalAlign: 'middle' }} /> {message}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
