
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d0ce9398d4d1400d92ebaae8353ae61a',
  appName: 'fit-daily-streak-tracker',
  webDir: 'dist',
  server: {
    url: "https://d0ce9398-d4d1-400d-92eb-aae8353ae61a.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  // Enable permissions for notifications
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;
