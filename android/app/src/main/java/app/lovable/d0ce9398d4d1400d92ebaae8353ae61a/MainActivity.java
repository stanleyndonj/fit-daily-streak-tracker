package app.lovable.d0ce9398d4d1400d92ebaae8353ae61a;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import app.lovable.d0ce9398d4d1400d92ebaae8353ae61a.SoundPickerPlugin;
import app.lovable.d0ce9398d4d1400d92ebaae8353ae61a.BatteryOptimizationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register custom plugins here
        registerPlugin(SoundPickerPlugin.class);
        registerPlugin(BatteryOptimizationPlugin.class);
    }
}
