
import { useState, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { useSettings } from '@/context/SettingsContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Create a simulated pedometer for testing
class SimulatedPedometer {
  private listeners: Array<(event: {numberOfSteps: number}) => void> = [];
  private interval: number | null = null;
  private steps = 0;

  isAvailable() {
    return Promise.resolve({ isAvailable: true });
  }

  startStepCountUpdates() {
    if (this.interval) return Promise.resolve();
    
    this.interval = window.setInterval(() => {
      // Add 5-15 steps every 10 seconds
      this.steps += Math.floor(Math.random() * 10) + 5;
      
      this.listeners.forEach(listener => {
        listener({ numberOfSteps: this.steps });
      });
    }, 10000) as unknown as number;
    
    return Promise.resolve();
  }

  stopStepCountUpdates() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    return Promise.resolve();
  }

  addListener(event: string, callback: (event: {numberOfSteps: number}) => void) {
    this.listeners.push(callback);
    return { remove: () => this.removeListener(callback) };
  }

  removeListener(callback: (event: {numberOfSteps: number}) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  removeAllListeners() {
    this.listeners = [];
  }
}

// Get the appropriate pedometer based on environment
const getPedometer = () => {
  // If in native mobile environment and pedometer is available
  if (Capacitor.isNativePlatform()) {
    try {
      // Try to import the Capacitor pedometer
      const { Pedometer } = require('@capacitor/pedometer');
      return Pedometer;
    } catch (e) {
      console.warn('Native pedometer not available, using simulated pedometer');
      return new SimulatedPedometer();
    }
  }
  
  // If in web environment or pedometer not available, use simulated
  return new SimulatedPedometer();
};

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const { settings } = useSettings();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Load steps from localStorage
    const storedStepData = localStorage.getItem('fit-daily-steps');
    let baselineCount = 0;
    let today = formatDateToYYYYMMDD(new Date());

    if (storedStepData) {
      const stepData = JSON.parse(storedStepData);
      if (stepData.date === today) {
        setSteps(stepData.count - stepData.baselineCount);
        baselineCount = stepData.baselineCount;
      } else {
        const newStepData = {
          date: today,
          count: 0,
          baselineCount: 0
        };
        localStorage.setItem('fit-daily-steps', JSON.stringify(newStepData));
      }
    } else {
      const newStepData = {
        date: today,
        count: 0,
        baselineCount: 0
      };
      localStorage.setItem('fit-daily-steps', JSON.stringify(newStepData));
    }

    const Pedometer = getPedometer();
    let cleanup = () => {};

    const startPedometerTracking = async () => {
      try {
        const { isAvailable } = await Pedometer.isAvailable();
        setAvailable(isAvailable);

        if (isAvailable) {
          await Pedometer.startStepCountUpdates();
          const listener = Pedometer.addListener('stepChanges', (event: { numberOfSteps: number }) => {
            const currentSteps = event.numberOfSteps - baselineCount;
            setSteps(currentSteps);
            const updatedStepData = {
              date: today,
              count: event.numberOfSteps,
              baselineCount
            };
            localStorage.setItem('fit-daily-steps', JSON.stringify(updatedStepData));
            updateStepNotification(currentSteps, settings.dailyStepGoal);
          });
          
          cleanup = () => {
            listener.remove();
            Pedometer.stopStepCountUpdates();
          };
        }
      } catch (error) {
        console.error('Error setting up pedometer:', error);
        setAvailable(false);
      }
    };

    startPedometerTracking();
    
    return () => {
      cleanup();
    };
  }, [settings.dailyStepGoal]);

  const updateStepNotification = async (currentSteps: number, goal: number) => {
    try {
      if (!Capacitor.isNativePlatform()) return;
      
      const progress = Math.min(Math.round((currentSteps / goal) * 100), 100);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: "Step Tracker",
            body: `${currentSteps.toLocaleString()} / ${goal.toLocaleString()} steps (${progress}%)`,
            ongoing: true,
            actionTypeId: "",
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  return { steps, available };
}
