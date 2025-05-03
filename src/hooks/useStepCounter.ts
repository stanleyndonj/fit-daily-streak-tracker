
import { useState, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';

// This is a mock implementation for web
// In real Capacitor app, this would use native plugins
export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  
  useEffect(() => {
    // Load steps from localStorage
    const storedStepData = localStorage.getItem('fit-daily-steps');
    if (storedStepData) {
      const stepData = JSON.parse(storedStepData);
      const today = formatDateToYYYYMMDD(new Date());
      
      // If we have data for today
      if (stepData.date === today) {
        setSteps(stepData.count - stepData.baselineCount);
      } else {
        // New day, reset
        const newStepData = {
          date: today,
          count: 0,
          baselineCount: 0
        };
        localStorage.setItem('fit-daily-steps', JSON.stringify(newStepData));
        setSteps(0);
      }
    } else {
      // First time tracking steps
      const newStepData = {
        date: formatDateToYYYYMMDD(new Date()),
        count: 0,
        baselineCount: 0
      };
      localStorage.setItem('fit-daily-steps', JSON.stringify(newStepData));
    }
    
    // For the web implementation, simulate step counting
    let stepSimulator: ReturnType<typeof setInterval>;
    
    if (import.meta.env.DEV) {
      // Add steps every few seconds in development for testing
      stepSimulator = setInterval(() => {
        setSteps(prev => {
          const newSteps = prev + Math.floor(Math.random() * 10);
          updateStoredSteps(newSteps);
          return newSteps;
        });
      }, 10000); // Add steps every 10 seconds
    }
    
    return () => {
      if (stepSimulator) clearInterval(stepSimulator);
    };
  }, []);
  
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
