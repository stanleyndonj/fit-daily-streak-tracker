
import { useState, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { useSettings } from '@/context/SettingsContext';
import { Capacitor } from '@capacitor/core';

// For TypeScript support without direct imports
interface LocalNotificationsPlugin {
  schedule: (options: any) => Promise<any>;
  createChannel: (options: any) => Promise<void>;
  cancel: (options: any) => Promise<void>;
}

interface MotionPlugin {
  isAccelerometerAvailable: () => Promise<{ isAvailable: boolean }>;
  addListener: (eventName: string, callback: (event: any) => void, options?: any) => Promise<void>;
  requestPermissions: () => Promise<void>;
  removeAllListeners: () => Promise<void>;
}

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
  private accelerationBuffer: Array<{ x: number, y: number, z: number }> = [];
  private bufferSize = 5; // Keep track of the last 5 readings for smoothing
  private threshold = 1.0; // Lower sensitivity threshold for Samsung A02s
  private stepThreshold = 0.8; // Minimum threshold to count as a valid step
  private cooldownPeriod = 400; // Milliseconds to wait between steps (prevent double-counting)
  private lastStepTime = 0;
  private listeners: Array<(steps: number) => void> = [];
  private calibrating = true;
  private calibrationSamples: number[] = []; // Store magnitudes during calibration
  private calibrationCount = 0;
  private motionPlugin: any = null;
  
  async isAvailable() {
    try {
      if (Capacitor.isNativePlatform()) {
        // Dynamically import the Motion plugin
        try {
          const { Motion } = await import('@capacitor/motion' /* webpackIgnore: true */);
          this.motionPlugin = Motion;
          const result = await this.motionPlugin.isAccelerometerAvailable();
          return result.isAvailable;
        } catch (error) {
          console.error('Error importing Motion plugin:', error);
          return false;
        }
      }
      return false;
    } catch (e) {
      console.error('Error checking motion availability:', e);
      return false;
    }
  }
  
  startStepCounting() {
    if (!this.motionPlugin) return { addListener: () => ({ remove: () => {} }) };
    
    // Clear data and prepare for new counting session
    this.accelerationBuffer = [];
    this.calibrationSamples = [];
    this.calibrating = true;
    this.calibrationCount = 0;
    
    // Ask permission for motion sensors
    this.motionPlugin.requestPermissions();
    
    // Function to get the smoothed acceleration
    const getSmoothedAcceleration = () => {
      if (this.accelerationBuffer.length === 0) return { x: 0, y: 0, z: 0 };
      
      const sum = this.accelerationBuffer.reduce(
        (acc, curr) => ({ 
          x: acc.x + curr.x, 
          y: acc.y + curr.y, 
          z: acc.z + curr.z 
        }), 
        { x: 0, y: 0, z: 0 }
      );
      
      return {
        x: sum.x / this.accelerationBuffer.length,
        y: sum.y / this.accelerationBuffer.length,
        z: sum.z / this.accelerationBuffer.length
      };
    };
    
    const detectSteps = (acceleration: { x: number, y: number, z: number }) => {
      // Add to buffer and maintain buffer size
      this.accelerationBuffer.push(acceleration);
      if (this.accelerationBuffer.length > this.bufferSize) {
        this.accelerationBuffer.shift();
      }
      
      // Get smoothed acceleration
      const smoothedAcceleration = getSmoothedAcceleration();
      
      // Calculate magnitude (remove gravity component for better accuracy)
      const magnitude = Math.sqrt(
        Math.pow(smoothedAcceleration.x, 2) + 
        Math.pow(smoothedAcceleration.y, 2) + 
        Math.pow(smoothedAcceleration.z - 9.8, 2) // Subtract gravity from z-axis
      );
      
      // Calibration phase - collect samples to determine baseline
      if (this.calibrating) {
        this.calibrationSamples.push(magnitude);
        this.calibrationCount++;
        
        // After collecting 100 samples, finish calibration
        if (this.calibrationCount >= 100) {
          this.calibrating = false;
          
          // Calculate dynamic threshold based on calibration data
          const sortedSamples = [...this.calibrationSamples].sort((a, b) => a - b);
          const medianIndex = Math.floor(sortedSamples.length / 2);
          const medianMagnitude = sortedSamples[medianIndex];
          
          // Set threshold to be 2.5x the median value during calibration
          // This helps adapt to different phone models and user gaits
          this.threshold = Math.max(medianMagnitude * 2.5, this.stepThreshold);
          console.log("Calibration complete, threshold set to:", this.threshold);
        }
        return;
      }
      
      const now = Date.now();
      // Only count steps if we're past the cooldown period and the magnitude exceeds threshold
      if (now - this.lastStepTime > this.cooldownPeriod && magnitude > this.threshold) {
        this.stepCount++;
        this.lastStepTime = now;
        this.listeners.forEach(listener => listener(this.stepCount));
      }
    };
    
    // Start listening to accelerometer data at a higher sampling rate for Samsung A02s
    this.motionPlugin.addListener('accel', (event: any) => {
      detectSteps(event.acceleration);
    }, { frequency: 50 }); // Increase sampling rate for better accuracy
    
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
    if (this.motionPlugin) {
      this.motionPlugin.removeAllListeners();
    }
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
      
      // Dynamically import LocalNotifications
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications' /* webpackIgnore: true */);
        
        // Create a persistent channel specifically for the step counter
        await LocalNotifications.createChannel({
          id: "step-counter",
          name: "Step Counter",
          description: "Persistent notification showing your step count",
          importance: 3, // Default priority (less intrusive but visible)
          visibility: 1,
          lights: false,
          vibration: false
        });
        
        // Schedule a foreground-service-style persistent notification
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1,
              title: "Step Tracker",
              body: `${currentSteps.toLocaleString()} / ${goal.toLocaleString()} steps (${progress}%)`,
              ongoing: true, // Makes the notification persistent
              channelId: "step-counter",
              smallIcon: "ic_stat_directions_walk", // Use walking icon
              importance: 3,
              foreground: true, // Tells Android this is a foreground service notification
              actionTypeId: "",
              extra: {
                // Samsung-specific flags to keep notification visible
                lockScreenVisibility: 1,
                priority: "default",
                persistentNotification: true
              }
            }
          ]
        });
      } catch (error) {
        console.error('Error importing LocalNotifications:', error);
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  return { steps, available };
}
