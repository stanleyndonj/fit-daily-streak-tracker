import { AVAILABLE_RINGTONES } from '@/context/SettingsContext';
import { Capacitor } from '@capacitor/core';
import { PRESET_SOUNDS, selectPresetSound } from './soundPickerService';

export const getRingtones = async () => {
  // Return both the old ringtones for compatibility and new preset sounds
  return AVAILABLE_RINGTONES;
};

// Get available notification sounds (includes presets)
export const getNotificationSounds = () => {
  return PRESET_SOUNDS;
};

// Audio objects cache for web playback
const audioCache: Record<string, HTMLAudioElement> = {};

// Sample tones for web preview (when no actual audio files are available)
const webTones: Record<string, number> = {
  'default': 440, // A4
  'alarm': 523.25, // C5
  'notification': 587.33, // D5
  'ringtone': 659.25, // E5
  'beep': 783.99 // G5
};

export const playRingtone = async (ringtoneId: string) => {
  console.log(`Playing ringtone: ${ringtoneId}`);
  
  // For native platforms, we could use the native audio API
  if (Capacitor.isNativePlatform()) {
    try {
      const { Haptics } = await import('@capacitor/haptics' /* webpackIgnore: true */);
      
      // Provide haptic feedback as part of the preview
      await Haptics.vibrate();
      
      // This is a placeholder for actual native audio implementation
      // In a real implementation, we would use a Capacitor plugin like @capacitor/sound
      console.log('Would play native sound on device:', ringtoneId);
    } catch (error) {
      console.error('Error playing ringtone on native device:', error);
      playWebTone(ringtoneId); // Fallback to web audio if haptics fail
    }
  } else {
    // For web, we use the Web Audio API
    playWebTone(ringtoneId);
  }
};

export const playNotificationSound = async (soundId: string) => {
  console.log(`Playing notification sound: ${soundId}`);
  if (Capacitor.isNativePlatform()) {
    try {
      // Save selection (so channel picks it up)
      selectPresetSound(soundId);

      // Use LocalNotifications to play the sound via OS (fires after 1 s and auto-clears)
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Create a one-time notification that is immediately dismissed
      const previewId = Date.now();
      await LocalNotifications.schedule({
        notifications: [{
          id: previewId,
          title: 'Sound preview',
          body: '🔊',
          schedule: { at: new Date(Date.now() + 500) },
          sound: soundId === 'default' ? 'fitdaily_reminder' : soundId,
          channelId: 'workout-reminders',
          smallIcon: 'ic_stat_directions_walk'
        }]
      });

      // Auto-cancel after 2s so it does not linger
      setTimeout(() => {
        LocalNotifications.cancel({ notifications: [{ id: previewId }] });
      }, 3000);

      return;
    } catch (err) {
      console.error('Notification preview failed, falling back to web tone', err);
      playWebTone(soundId);
    }
  } else {
    playWebTone(soundId);
  }
};

const playWebTone = (toneId: string) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      // Stop any currently playing tones
      stopAllWebTones();
      
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Set the tone type and frequency based on the selected ringtone
      oscillator.type = 'sine';
      
      // Different frequency for different ringtones
      const frequency = webTones[toneId] || 440;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Add fade-out effect
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start and stop the tone
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    }
  } catch (error) {
    console.error('Error playing web audio:', error);
  }
};

const stopAllWebTones = () => {
  // Stop any previously playing audio elements
  Object.values(audioCache).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
};
