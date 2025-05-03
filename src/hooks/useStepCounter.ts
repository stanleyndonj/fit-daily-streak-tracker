import { useState, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/workout-utils';
import { Pedometer } from '@capacitor/pedometer'; // Updated import
import { useSettings } from '@/context/SettingsContext';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const { settings } = useSettings();
  const [available, setAvailable] = useState(false); // Added state for pedometer availability

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

    const startPedometerTracking = async () => {
      try {
        const { isAvailable } = await Pedometer.isAvailable();
        setAvailable(isAvailable);

        if (isAvailable) {
          await Pedometer.startStepCountUpdates();
          Pedometer.addListener('stepChanges', (event) => {
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
        } else {
          console.log('Pedometer not available');
          simulateStepsInDev();
        }
      } catch (error) {
        console.error('Error setting up pedometer:', error);
        simulateStepsInDev();
      }
    };

    const simulateStepsInDev = () => {
      if (import.meta.env.DEV) {
        const stepSimulator = setInterval(() => {
          setSteps(prev => {
            const newSteps = prev + Math.floor(Math.random() * 10);
            updateStoredSteps(newSteps);
            return newSteps;
          });
        }, 10000);
        return () => clearInterval(stepSimulator);
      }
    };

    startPedometerTracking();
    return () => {
      if(available) {
        Pedometer.removeAllListeners();
        Pedometer.stopStepCountUpdates();
      }
    };
  }, []);

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

  const updateStoredSteps = (newSteps: number) => {
    const storedStepData = localStorage.getItem('fit-daily-steps');
    if (storedStepData) {
      const stepData = JSON.parse(storedStepData);
      stepData.count = stepData.baselineCount + newSteps;
      localStorage.setItem('fit-daily-steps', JSON.stringify(stepData));
    }
  };

  return { steps, available };
}