
import { useState, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { useSettings } from '@/context/SettingsContext';
import { Capacitor } from '@capacitor/core';

// For TypeScript support without direct imports
interface MotionPlugin {
  isAccelerometerAvailable: () => Promise<{ isAvailable: boolean }>;
  addListener: (eventName: string, callback: (event: any) => void, options?: any) => Promise<void>;
  requestPermissions: () => Promise<void>;
  removeAllListeners: () => Promise<void>;
}

// Create a simulated pedometer for web testing with improved accuracy
class SimulatedStepCounter {
  private listeners: Array<(steps: number) => void> = [];
  private interval: number | null = null;
  private steps = 0;
  private lastIncrement = 0;

  startStepCounting() {
    if (this.interval) return;
    
    // Use a more realistic step pattern - smaller, more frequent increments
    this.interval = window.setInterval(() => {
      // Only add 1-3 steps every 5 seconds for more realistic simulation
      // This avoids large jumps in step count
      if (Math.random() > 0.3) { // 70% chance to add steps (simulates idle periods)
        this.steps += Math.floor(Math.random() * 3) + 1;
        
        this.listeners.forEach(listener => {
          listener(this.steps);
        });
      }
    }, 5000) as unknown as number;
    
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

// Step detection using device motion with improved accuracy
class MotionStepCounter {
  private stepCount = 0;
  private accelerationBuffer: Array<{ x: number, y: number, z: number }> = [];
  private bufferSize = 5; // Keep track of the last 5 readings for smoothing
  private threshold = 1.2; // Increased sensitivity threshold for better accuracy
  private stepThreshold = 1.0; // Increased minimum threshold to count as a valid step
  private cooldownPeriod = 600; // Increased milliseconds to wait between steps (prevent false positives)
  private lastStepTime = 0;
  private listeners: Array<(steps: number) => void> = [];
  private calibrating = true;
  private calibrationSamples: number[] = []; // Store magnitudes during calibration
  private calibrationCount = 0;
  private motionPlugin: any = null;
  private isWalking = false; // Track if we detect a walking pattern
  private consecutiveThresholdCrossings = 0;
  
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
    this.consecutiveThresholdCrossings = 0;
    this.isWalking = false;
    
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
    
    // Improved step detection algorithm with pattern recognition
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
          
          // Set threshold higher than previous implementation
          this.threshold = Math.max(medianMagnitude * 3.0, this.stepThreshold);
          console.log("Calibration complete, threshold set to:", this.threshold);
        }
        return;
      }
      
      const now = Date.now();
      
      // Detect walking pattern using acceleration pattern analysis
      if (magnitude > this.threshold) {
        this.consecutiveThresholdCrossings++;
        
        // Require multiple threshold crossings to detect walking pattern
        if (this.consecutiveThresholdCrossings >= 3) {
          this.isWalking = true;
        }
      } else {
        // Reset counter if magnitude falls below threshold for a while
        this.consecutiveThresholdCrossings = Math.max(0, this.consecutiveThresholdCrossings - 0.5);
        
        if (this.consecutiveThresholdCrossings === 0) {
          this.isWalking = false;
        }
      }
      
      // Only count steps if walking pattern is detected and we're past the cooldown period
      if (this.isWalking && now - this.lastStepTime > this.cooldownPeriod && magnitude > this.threshold) {
        this.stepCount++;
        this.lastStepTime = now;
        this.listeners.forEach(listener => listener(this.stepCount));
      }
    };
    
    // Start listening to accelerometer data at a higher sampling rate for better accuracy
    this.motionPlugin.addListener('accel', (event: any) => {
      detectSteps(event.acceleration);
    }, { frequency: 60 }); // Increased sampling rate for better accuracy
    
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
            
            // Removed notification updating code as requested
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

  return { steps, available };
}
