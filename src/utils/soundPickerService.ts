
import { Capacitor } from '@capacitor/core';
import { saveNotificationSoundUri } from './notificationUtils';
import { toast } from 'sonner';

// Interface for a hypothetical native sound picker plugin
interface SoundPickerPlugin {
  openRingtonePicker: () => Promise<{ uri: string; name: string } | null>;
}

// Available preset sounds with their Android resource URIs
export const PRESET_SOUNDS = [
  { 
    id: 'default', 
    name: 'FitDaily Default',
    uri: 'android.resource://app.lovable.d0ce9398d4d1400d92ebaae8353ae61a/raw/fitdaily_reminder'
  },
  { 
    id: 'system_notification', 
    name: 'System Notification',
    uri: 'content://settings/system/notification_sound'
  },
  { 
    id: 'system_alarm', 
    name: 'System Alarm',
    uri: 'content://settings/system/alarm_alert'
  },
  { 
    id: 'system_ringtone', 
    name: 'System Ringtone',
    uri: 'content://settings/system/ringtone'
  }
];

// Get the current selected sound info
export const getCurrentSoundInfo = (): { id: string; name: string; uri: string } => {
  try {
    const savedUri = localStorage.getItem('notification_sound_uri');
    const savedName = localStorage.getItem('notification_sound_name');
    
    if (savedUri && savedName) {
      return {
        id: 'custom',
        name: savedName,
        uri: savedUri
      };
    }
    
    // Return default sound
    return PRESET_SOUNDS[0];
  } catch (error) {
    console.error('Error getting current sound info:', error);
    return PRESET_SOUNDS[0];
  }
};

// Select a preset sound
export const selectPresetSound = (soundId: string): boolean => {
  try {
    const sound = PRESET_SOUNDS.find(s => s.id === soundId);
    if (!sound) {
      console.error('Preset sound not found:', soundId);
      return false;
    }
    
    saveNotificationSoundUri(sound.uri);
    localStorage.setItem('notification_sound_name', sound.name);
    
    console.log('Preset sound selected:', sound);
    toast.success(`Sound changed to: ${sound.name}`);
    return true;
  } catch (error) {
    console.error('Error selecting preset sound:', error);
    toast.error('Failed to select sound');
    return false;
  }
};

// Open native ringtone picker (requires custom Capacitor plugin or implementation)
export const openNativeRingtonePicker = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    toast.error('Ringtone picker is only available on native devices');
    return false;
  }
  
  try {
    // This would require a custom Capacitor plugin to access Android's RingtoneManager
    // For now, we'll show a message about this feature being in development
    toast.info('Custom ringtone picker will be available in a future update. Please use preset sounds for now.');
    
    // Placeholder for future implementation:
    // const result = await SoundPicker.openRingtonePicker();
    // if (result) {
    //   saveNotificationSoundUri(result.uri);
    //   localStorage.setItem('notification_sound_name', result.name);
    //   toast.success(`Sound changed to: ${result.name}`);
    //   return true;
    // }
    
    return false;
  } catch (error) {
    console.error('Error opening native ringtone picker:', error);
    toast.error('Failed to open ringtone picker');
    return false;
  }
};

// Test the currently selected notification sound
export const testNotificationSound = async (): Promise<void> => {
  try {
    if (!Capacitor.isNativePlatform()) {
      toast.info('Sound testing is only available on native devices');
      return;
    }
    
    // Import the notification function to test the sound
    const { sendWorkoutCompletedNotification } = await import('./notificationUtils');
    await sendWorkoutCompletedNotification('Sound Test');
    
    toast.success('Test notification sent');
  } catch (error) {
    console.error('Error testing notification sound:', error);
    toast.error('Failed to test notification sound');
  }
};
