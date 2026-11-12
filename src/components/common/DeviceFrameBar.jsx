import React from 'react';
import { useApp } from '../../context/AppContext';
import { Smartphone, Monitor, Globe } from 'lucide-react';

export const DeviceFrameBar = () => {
  const { deviceFrameMode, setDeviceFrameMode, language, changeLanguage } = useApp();

  return (
    <div className="preview-control-bar" style={{ display: 'none' }}>
      {/* Handled via CSS media query below */}
    </div>
  );
};

