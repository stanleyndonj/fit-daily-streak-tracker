
import { useState, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { Pedometer } from '@capacitor-community/pedometer';
import { useSettings } from '@/context/SettingsContext';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const { settings } = useSettings();
  
  useEffect(() => {
    // Load steps from localStorage
    const storedStepData = localStorage.getItem('fit-daily-steps');
    let baselineCount = 0;
    let today = formatDateToYYYYMMDD(new Date());
    
    if (storedStepData) {
      const stepData = JSON.parse(storedStepData);
      
      // If we have data for today
      if (stepData.date === today) {
        setSteps(stepData.count - stepData.baselineCount);
        baselineCount = stepData.baselineCount;
      } else {
        // New day, reset
        const newStepData = {
          date: today,
          count: 0,
          baselineCount: 0
        };
        localStorage.setItem('fit-daily-steps', JSON.stringify(newStepData));
      }
    } else {
      // First time tracking steps
      const newStepData = {
        date: today,
        count: 0,
        baselineCount: 0
      };
      localStorage.setItem('fit-daily-steps', JSON.stringify(newStepData));
    }
    
    const startPedometerTracking = async () => {
      try {
        // Request permission
        const permissionResult = await Pedometer.requestPermission();
        
        if (permissionResult && permissionResult.granted) {
          // Set up pedometer event listener
          await Pedometer.startPedometerUpdates();
          
          // Get the initial step count as baseline if needed
          if (baselineCount === 0) {
            const initialSteps = await Pedometer.getCurrentStepCount();
            baselineCount = initialSteps.numberOfSteps;
            
            // Save the baseline
            const newStepData = {
              date: today,
              count: baselineCount,
              baselineCount
            };
            localStorage.setItem('fit-daily-steps', JSON.stringify(newStepData));
          }
          
          // Listen for step updates
          Pedometer.addListener('pedometerdata', (data) => {
            const currentSteps = data.numberOfSteps - baselineCount;
            setSteps(currentSteps);
            
            // Update storage
            const updatedStepData = {
              date: today,
              count: data.numberOfSteps,
              baselineCount
            };
            localStorage.setItem('fit-daily-steps', JSON.stringify(updatedStepData));
            
            // Update notifications if needed
            updateStepNotification(currentSteps, settings.dailyStepGoal);
          });
        } else {
          console.log('Pedometer permission not granted');
          simulateStepsInDev();
        }
      } catch (error) {
        console.error('Error setting up pedometer:', error);
        simulateStepsInDev();
      }
    };
    
    // For development/web testing, simulate step counting
    const simulateStepsInDev = () => {
      if (import.meta.env.DEV) {
        const stepSimulator = setInterval(() => {
          setSteps(prev => {
            const newSteps = prev + Math.floor(Math.random() * 10);
            updateStoredSteps(newSteps);
            return newSteps;
          });
        }, 10000); // Add steps every 10 seconds
        
        return () => clearInterval(stepSimulator);
      }
    };
    
    // Start tracking steps
    startPedometerTracking();
    
    // Cleanup function
    return () => {
      Pedometer.removeAllListeners();
      Pedometer.stopPedometerUpdates();
    };
  }, []);
  
  // Update notification with step count
  const updateStepNotification = async (currentSteps: number, goal: number) => {
    try {
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
  
  // Update steps in localStorage
  const updateStoredSteps = (newSteps: number) => {
    const storedStepData = localStorage.getItem('fit-daily-steps');
    if (storedStepData) {
      const stepData = JSON.parse(storedStepData);
      stepData.count = stepData.baselineCount + newSteps;
      localStorage.setItem('fit-daily-steps', JSON.stringify(stepData));
    }
  };
  
  return { steps };
}
