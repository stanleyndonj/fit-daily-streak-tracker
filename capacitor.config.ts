
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d0ce9398d4d1400d92ebaae8353ae61a',
  appName: 'fit-daily-streak-tracker',
  webDir: 'dist',
  // Configure for offline use with bundled web assets
  server: {
    androidScheme: "https",
    cleartext: true,
    hostname: "localhost"
  },
  // Enable permissions for notifications and step counter
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    // Cordova plugins configuration
    PermissionsAndroid: {
      permissions: [
        "android.permission.ACTIVITY_RECOGNITION"
      ]
    }
  },
  cordova: {
    preferences: {
      ScrollEnabled: "false",
      BackupWebStorage: "none",
      SplashMaintainAspectRatio: "true",
      FadeSplashScreenDuration: "300",
      SplashShowOnlyFirstTime: "false",
      SplashScreen: "screen",
      SplashScreenDelay: "3000"
    }
  }
};

export default config;
