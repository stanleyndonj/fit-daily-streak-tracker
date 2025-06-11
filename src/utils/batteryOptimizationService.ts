import { Capacitor, registerPlugin } from '@capacitor/core';
import { toast } from 'sonner';

interface BatteryOptimizationPlugin {
  openBatteryOptimizationSettings: () => Promise<void>;
}

// Register native plugin – available only on native runtime
const BatteryOptimization = registerPlugin<BatteryOptimizationPlugin>('BatteryOptimization');

/**
 * Opens the system screen where the user can exclude the app from battery optimisation.
 * Falls back gracefully on web.
 */
export const promptDisableBatteryOptimization = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    toast.info('Battery-optimization settings are only available on a real device.');
    return;
  }

  try {
    await (BatteryOptimization as any).openBatteryOptimizationSettings();
  } catch (err) {
    console.error('Failed to open battery optimisation settings', err);
    toast.error('Unable to open battery optimisation settings');
  }
};
