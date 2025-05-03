
import { useState, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { useSettings } from '@/context/SettingsContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Motion } from '@capacitor/motion';

// Create a simulated pedometer for web testing
class SimulatedStepCounter {
  private listeners: Array<(steps: number) => void> = [];
  private interval: number | null = null;
  private steps = 0;

  startStepCounting() {
    if (this.interval) return;
    
    this.interval = window.setInterval(() => {
      // Add 5-15 steps every 10 seconds
      this.steps += Math.floor(Math.random() * 10) + 5;
      
      this.listeners.forEach(listener => {
        listener(this.steps);
      });
    }, 10000) as unknown as number;
    
    return {
      addListener: (callback: (steps: number) => void) => {
        this.listeners.push(callback);
        return {
          remove: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        };
      }
    };
  }

  stopStepCounting() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// Step detection using device motion 
class MotionStepCounter {
  private stepCount = 0;
  private lastAcceleration = { x: 0, y: 0, z: 0 };
  private threshold = 1.2; // Sensitivity threshold
  private listeners: Array<(steps: number) => void> = [];
  private subscriptionId: string | null = null;
  
  async isAvailable() {
    try {
      // Check if accelerometer is available
      const result = await Motion.isAccelerometerAvailable();
      return result.isAvailable;
    } catch (e) {
      console.error('Error checking motion availability:', e);
      return false;
    }
  }
  
  startStepCounting() {
    // Ask permission for motion sensors
    Motion.requestPermissions();
    
    const detectSteps = (acceleration: { x: number, y: number, z: number }) => {
      // Simple step detection algorithm based on acceleration magnitude change
      const magnitude = Math.sqrt(
        Math.pow(acceleration.x, 2) + 
        Math.pow(acceleration.y, 2) + 
        Math.pow(acceleration.z, 2)
      );
      
      const lastMagnitude = Math.sqrt(
        Math.pow(this.lastAcceleration.x, 2) + 
        Math.pow(this.lastAcceleration.y, 2) + 
        Math.pow(this.lastAcceleration.z, 2)
      );
      
      // If there's a significant change in acceleration, count as a step
      if (Math.abs(magnitude - lastMagnitude) > this.threshold) {
        this.stepCount++;
        this.listeners.forEach(listener => listener(this.stepCount));
      }
      
      this.lastAcceleration = acceleration;
    };
    
    // Start listening to accelerometer data
    Motion.addListener('accel', (event) => {
      detectSteps(event.acceleration);
    });
    
    return {
      addListener: (callback: (steps: number) => void) => {
        this.listeners.push(callback);
        return {
          remove: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        };
      }
    };
  }
  
  stopStepCounting() {
    Motion.removeAllListeners();
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

    const startStepTracking = async () => {
      try {
        let stepCounter: any;
        
        // Use appropriate step counter based on platform
        if (Capacitor.isNativePlatform()) {
          // Try to use Motion API
          const motionCounter = new MotionStepCounter();
          const isAvailable = await motionCounter.isAvailable();
          setAvailable(isAvailable);
          
          if (!isAvailable) {
            console.warn('Native motion sensors not available, using simulated step counter');
            stepCounter = new SimulatedStepCounter();
          } else {
            stepCounter = motionCounter;
          }
        } else {
          // Web environment - use simulated
          stepCounter = new SimulatedStepCounter();
        }
        
        if (stepCounter) {
          // Start step counter and subscribe to updates
          const stepService = stepCounter.startStepCounting();
          const listenerHandle = stepService.addListener((currentSteps: number) => {
            const steps = Math.max(0, currentSteps - baselineCount);
            setSteps(steps);
            
            const updatedStepData = {
              date: today,
              count: currentSteps,
              baselineCount
            };
            localStorage.setItem('fit-daily-steps', JSON.stringify(updatedStepData));
            updateStepNotification(steps, settings.dailyStepGoal);
          });
          
          setSubscription(listenerHandle);
        }
      } catch (error) {
        console.error('Error setting up step counter:', error);
        setAvailable(false);
      }
    };

    startStepTracking();
    
    return () => {
      // Clean up subscription when component unmounts
      if (subscription) {
        subscription.remove();
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
