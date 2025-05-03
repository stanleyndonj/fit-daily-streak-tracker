
import { useState, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { useSettings } from '@/context/SettingsContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Pedometer } from '@awesome-cordova-plugins/pedometer';

// Create a simulated pedometer for web testing
class SimulatedPedometer {
  private listeners: Array<(data: {numberOfSteps: number}) => void> = [];
  private interval: number | null = null;
  private steps = 0;

  startPedometerUpdates() {
    if (this.interval) return;
    
    this.interval = window.setInterval(() => {
      // Add 5-15 steps every 10 seconds
      this.steps += Math.floor(Math.random() * 10) + 5;
      
      this.listeners.forEach(listener => {
        listener({ numberOfSteps: this.steps });
      });
    }, 10000) as unknown as number;
    
    // Return an observable-like object with subscribe method
    return {
      subscribe: (callback: (data: {numberOfSteps: number}) => void) => {
        this.listeners.push(callback);
        return {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        };
      }
    };
  }

  stopPedometerUpdates() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  isAvailable() {
    return Promise.resolve(false);
  }
}

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const { settings } = useSettings();
  const [available, setAvailable] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

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
        // New day, reset step data
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

    const startPedometerTracking = async () => {
      try {
        let stepCounter: any;
        
        // Use appropriate pedometer based on platform
        if (Capacitor.isNativePlatform()) {
          // Check if Cordova Pedometer is available
          try {
            const isAvailable = await Pedometer.isAvailable();
            setAvailable(isAvailable);
            
            if (!isAvailable) {
              console.warn('Native pedometer not available, using simulated pedometer');
              stepCounter = new SimulatedPedometer();
            } else {
              stepCounter = Pedometer;
            }
          } catch (e) {
            console.warn('Error checking pedometer availability:', e);
            stepCounter = new SimulatedPedometer();
          }
        } else {
          // Web environment - use simulated
          stepCounter = new SimulatedPedometer();
        }
        
        if (stepCounter) {
          // Start pedometer and subscribe to updates
          const sub = stepCounter.startPedometerUpdates().subscribe((data: { numberOfSteps: number }) => {
            const currentSteps = Math.max(0, data.numberOfSteps - baselineCount);
            setSteps(currentSteps);
            
            const updatedStepData = {
              date: today,
              count: data.numberOfSteps,
              baselineCount
            };
            localStorage.setItem('fit-daily-steps', JSON.stringify(updatedStepData));
            updateStepNotification(currentSteps, settings.dailyStepGoal);
          });
          
          setSubscription(sub);
        }
      } catch (error) {
        console.error('Error setting up pedometer:', error);
        setAvailable(false);
      }
    };

    startPedometerTracking();
    
    return () => {
      // Clean up subscription when component unmounts
      if (subscription) {
        subscription.unsubscribe();
      }
      if (Capacitor.isNativePlatform()) {
        try {
          Pedometer.stopPedometerUpdates();
        } catch (e) {
          console.warn('Error stopping pedometer:', e);
        }
      }
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
