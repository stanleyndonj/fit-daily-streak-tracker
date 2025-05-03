
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
  // Enable permissions for notifications and motion sensors
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_directions_walk",
      iconColor: "#488AFF",
      sound: "notification",
      importance: 4, // High priority for Samsung devices
    },
    // Android permissions - expanded for Samsung compatibility
    PermissionsAndroid: {
      permissions: [
        "android.permission.ACTIVITY_RECOGNITION",
        "android.permission.HIGH_SAMPLING_RATE_SENSORS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.ACCESS_NOTIFICATION_POLICY",
        "android.permission.POST_NOTIFICATIONS"
      ]
    },
    // Motion settings
    Motion: {
      samplingRate: 40 // Optimized for Samsung A02s
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
      SplashScreenDelay: "3000",
      // Samsung A02s optimizations
      AndroidPersistentFileLocation: "Compatibility",
      AndroidExtraFilesystems: "files,cache,root",
      KeepRunning: "true",
      android_headerColor: "#488AFF",
      AndroidLaunchMode: "singleInstance",
      LoadUrlTimeoutValue: "60000"
    }
  }
};

export default config;
