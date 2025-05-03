
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/types';

// Default settings
const defaultSettings: AppSettings = {
  reminderEnabled: false,
  reminderTime: "07:00",
  voiceCuesEnabled: false,
  vibrationEnabled: true,
  dailyStepGoal: 5000
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('fit-daily-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Update settings and save to localStorage
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('fit-daily-settings', JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
