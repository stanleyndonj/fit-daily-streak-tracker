import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

// Define interfaces for type safety when using dynamic imports
interface LocalNotificationsPlugin {
  checkPermissions: () => Promise<{ display: string }>;
  requestPermissions: () => Promise<{ display: string }>;
  cancel: (options: any) => Promise<void>;
  schedule: (options: any) => Promise<any>;
  createChannel: (options: any) => Promise<void>;
  registerActionTypes: (options: any) => Promise<void>;
  getPending: () => Promise<{ notifications: any[] }>;
  addListener: (eventName: string, callback: any) => Promise<any>;
}

// Lazy-load the local notifications plugin
let LocalNotifications: LocalNotificationsPlugin | undefined = undefined;

// Load the notifications plugin
export const initLocalNotifications = async (): Promise<LocalNotificationsPlugin | undefined> => {
  if (Capacitor.isNativePlatform()) {
    if (!LocalNotifications && Capacitor.isPluginAvailable('LocalNotifications')) {
      try {
        const module = await import('@capacitor/local-notifications');
        LocalNotifications = module.LocalNotifications;
        console.log('LocalNotifications plugin loaded successfully');
        
        // Setup notification channel for Android with sound
        if (Capacitor.getPlatform() === 'android' && LocalNotifications) {
          await createNotificationChannel(LocalNotifications);
        }
        
        // Register notification actions
        if (LocalNotifications) {
          await registerNotificationActions(LocalNotifications);
          await setupNotificationListeners(LocalNotifications);
        }
        
        return LocalNotifications;
      } catch (error) {
        console.error('Error loading LocalNotifications plugin:', error);
        return undefined;
      }
    }
    return LocalNotifications;
  }
  console.log('Not running on a native platform, notifications not available');
  return undefined;
};

// Get the sound URI for notifications based on user preference
const getNotificationSoundUri = (): string => {
  try {
    const savedSound = localStorage.getItem('notification_sound_uri');
    if (savedSound && savedSound !== 'default') {
      return savedSound;
    }
    // Default sound - will be created in Android resources
    return 'fitdaily_reminder';
  } catch (error) {
    console.error('Error getting notification sound URI:', error);
    return 'fitdaily_reminder';
  }
};

// Create notification channel for Android with proper sound configuration
const createNotificationChannel = async (notificationsPlugin: LocalNotificationsPlugin): Promise<void> => {
  try {
    const soundUri = getNotificationSoundUri();
    
    await notificationsPlugin.createChannel({
      id: "workout-reminders",
      name: "Workout Reminders",
      description: "Daily reminders for your workout routine",
      importance: 5, // IMPORTANCE_HIGH
      visibility: 1,
      sound: soundUri,
      vibration: true,
      lights: true,
      lightColor: "#488AFF",
      enableVibration: true,
      enableLights: true
    });
    
    console.log('Notification channel created with sound URI:', soundUri);
  } catch (error) {
    console.error('Failed to create notification channel:', error);
  }
};

// Save custom notification sound URI
export const saveNotificationSoundUri = (uri: string): void => {
  try {
    localStorage.setItem('notification_sound_uri', uri);
    console.log('Notification sound URI saved:', uri);
  } catch (error) {
    console.error('Failed to save notification sound URI:', error);
  }
};

// Get current notification sound URI
export const getNotificationSoundUriForSettings = (): string => {
  return getNotificationSoundUri();
};

// Register notification action types
const registerNotificationActions = async (notificationsPlugin: LocalNotificationsPlugin): Promise<void> => {
  try {
    await notificationsPlugin.registerActionTypes({
      types: [
        {
          id: 'WORKOUT_ACTIONS',
          actions: [
            {
              id: 'open',
              title: 'Open App'
            },
            {
              id: 'snooze',
              title: 'Snooze (10 min)'
            }
          ]
        }
      ]
    });
    console.log('Notification actions registered successfully');
  } catch (error) {
    console.error('Failed to register notification actions:', error);
  }
};

// Check notification permissions
export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const notifications = await initLocalNotifications();
    if (!notifications) return false;
    
    const { display } = await notifications.checkPermissions();
    console.log('Notification permission status:', display);
    return display === 'granted';
  } catch (error) {
    console.error('Failed to check notification permissions:', error);
    return false;
  }
};

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    console.log('Requesting notification permissions...');
    const notifications = await initLocalNotifications();
    if (!notifications) {
      console.log('Notifications plugin not available');
      return false;
    }
    
    const { display } = await notifications.requestPermissions();
    const granted = display === 'granted';
    
    if (granted) {
      console.log('Notification permissions granted');
      toast.success('Notification permissions granted');
    } else {
      console.log('Notification permissions denied');
      toast.error('Please enable notifications in your device settings to receive workout reminders');
    }
    
    return granted;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    toast.error('Failed to request notification permissions');
    return false;
  }
};

// Cancel all pending notifications
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    console.log('Cancelling all pending notifications...');
    const notifications = await initLocalNotifications();
    if (!notifications) return;
    
    const pendingNotifications = await notifications.getPending();
    if (pendingNotifications.notifications.length > 0) {
      const ids = pendingNotifications.notifications.map(n => ({ id: n.id }));
      await notifications.cancel({ notifications: ids });
      console.log('Cancelled pending notifications:', ids);
    } else {
      console.log('No pending notifications to cancel');
    }
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
};

// Send a notification when a workout is completed
export const sendWorkoutCompletedNotification = async (workoutName: string): Promise<void> => {
  try {
    const notifications = await initLocalNotifications();
    if (!notifications) return;
    
    const soundUri = getNotificationSoundUri();
    
    await notifications.schedule({
      notifications: [{
        title: "Workout Completed! 💪",
        body: `Great job completing ${workoutName}! Keep up the good work.`,
        id: Date.now(),
        schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
        sound: soundUri,
        channelId: "workout-reminders",
        smallIcon: "ic_stat_directions_walk",
        actionTypeId: 'WORKOUT_ACTIONS',
        extra: {
          type: 'workout_completed',
          workoutName
        }
      }]
    });
    
    console.log(`Workout completion notification sent for: ${workoutName} with sound: ${soundUri}`);
  } catch (error) {
    console.error('Failed to send workout completion notification:', error);
  }
};

// Send a notification when a streak milestone is reached
export const sendStreakMilestoneNotification = async (streakDays: number): Promise<void> => {
  try {
    const notifications = await initLocalNotifications();
    if (!notifications) return;
    
    let message = "";
    if (streakDays === 5) {
      message = "You've reached a 5-day streak! Amazing consistency!";
    } else if (streakDays === 10) {
      message = "10-day streak achieved! You're building a great habit!";
    } else if (streakDays === 30) {
      message = "30-day streak! You're officially a fitness warrior!";
    } else if (streakDays % 10 === 0) {
      message = `${streakDays}-day streak! Your dedication is inspiring!`;
    } else {
      message = `${streakDays}-day streak! Keep it up!`;
    }
    
    const soundUri = getNotificationSoundUri();
    
    await notifications.schedule({
      notifications: [{
        title: "Streak Milestone! 🔥",
        body: message,
        id: Date.now() + 1,
        schedule: { at: new Date(Date.now() + 2000) }, // 2 second delay
        sound: soundUri,
        channelId: "workout-reminders",
        smallIcon: "ic_stat_directions_walk",
        actionTypeId: 'WORKOUT_ACTIONS',
        extra: {
          type: 'streak_milestone',
          streakDays
        }
      }]
    });
    
    console.log(`Streak milestone notification sent for: ${streakDays} days with sound: ${soundUri}`);
  } catch (error) {
    console.error('Failed to send streak milestone notification:', error);
  }
};

// Schedule a daily workout notification with proper sound
export const scheduleDailyNotification = async (
  time: string,
  weekdaysOnly: boolean,
  selectedRingtone: string,
  vibrationEnabled: boolean,
  specificDate?: string
): Promise<boolean> => {
  try {
    console.log(`Scheduling notification for time: ${time}, weekdaysOnly: ${weekdaysOnly}`);
    
    const notifications = await initLocalNotifications();
    if (!notifications) {
      console.error("Notifications aren't available on this device");
      toast.error("Notifications aren't available on this device");
      return false;
    }
    
    // Clear existing notifications first
    await cancelAllNotifications();
    
    // Parse reminder time
    const [hours, minutes] = time.split(':').map(Number);
    
    // Calculate trigger time
    const now = new Date();
    let triggerDate: Date;
    
    if (specificDate) {
      triggerDate = new Date(specificDate);
      triggerDate.setHours(hours, minutes, 0, 0);
      
      if (triggerDate < now) {
        console.error("The selected date has already passed");
        toast.error("The selected date has already passed");
        return false;
      }
    } else {
      triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);
      
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
        console.log('Time already passed today, scheduling for tomorrow:', triggerDate);
      }
      
      if (weekdaysOnly) {
        const day = triggerDate.getDay();
        if (day === 0) {
          triggerDate.setDate(triggerDate.getDate() + 1);
        } else if (day === 6) {
          triggerDate.setDate(triggerDate.getDate() + 2);
        }
      }
    }
    
    console.log('Final trigger date calculated:', triggerDate.toLocaleString());
    
    // Get the sound URI for this notification
    const soundUri = getNotificationSoundUri();
    
    const isRepeating = !specificDate;
    const notificationId = 100;
    
    await notifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: "Time to work out!",
          body: "Don't break your streak! It's time for your daily workout.",
          schedule: {
            at: triggerDate,
            repeats: isRepeating,
            every: weekdaysOnly ? 'weekday' : 'day',
            allowWhileIdle: true,
            precise: true
          },
          sound: soundUri,
          smallIcon: "ic_stat_directions_walk",
          largeIcon: "notification_icon",
          channelId: "workout-reminders",
          ongoing: false,
          autoCancel: true,
          actionTypeId: "WORKOUT_ACTIONS"
        }
      ]
    });
    
    console.log('Notification scheduled successfully for:', triggerDate.toLocaleString(), 'with sound:', soundUri);
    
    let message = '';
    if (isRepeating) {
      message = weekdaysOnly ? 
        `Workout reminder set for ${hours}:${minutes < 10 ? '0' + minutes : minutes} on weekdays` :
        `Daily workout reminder set for ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    } else {
      message = `One-time workout reminder set for ${triggerDate.toLocaleDateString()} at ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    }
    
    toast.success(message);
    return true;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    toast.error("Failed to set reminder. Please try again.");
    return false;
  }
};

// Setup notification listeners to handle actions
export const setupNotificationListeners = async (notificationsPlugin?: LocalNotificationsPlugin): Promise<void> => {
  try {
    const notifications = notificationsPlugin || await initLocalNotifications();
    if (!notifications) return;
    
    console.log('Setting up notification listeners...');
    
    notifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
    });
    
    notifications.addListener('localNotificationActionPerformed', (notificationData) => {
      console.log('Notification action performed:', notificationData);
      
      const actionId = notificationData.actionId;
      
      if (actionId === 'snooze') {
        const snoozeTime = new Date();
        snoozeTime.setMinutes(snoozeTime.getMinutes() + 10);
        
        const soundUri = getNotificationSoundUri();
        
        notifications.schedule({
          notifications: [
            {
              id: 101,
              title: "Workout Reminder",
              body: "This is your snoozed reminder. Time to work out now!",
              schedule: { at: snoozeTime },
              sound: soundUri,
              channelId: "workout-reminders",
              smallIcon: "ic_stat_directions_walk"
            }
          ]
        });
        
        console.log('Notification snoozed for 10 minutes with sound:', soundUri);
      }
    });
    
    console.log('Notification listeners setup complete');
  } catch (error) {
    console.error('Failed to setup notification listeners:', error);
  }
};
