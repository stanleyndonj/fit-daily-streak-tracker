package app.lovable.d0ce9398d4d1400d92ebaae8353ae61a;

import android.app.Activity;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.database.Cursor;
import android.provider.MediaStore;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SoundPicker")
public class SoundPickerPlugin extends Plugin {

    /**
     * Opens the Android system ringtone picker so the user can choose a notification sound.
     * The chosen sound's URI and a friendly name are returned to the JavaScript side.
     */
    @PluginMethod
    public void openRingtonePicker(PluginCall call) {
        Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Select Notification Tone");
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, (Uri) null);

        // Launch the picker and handle the result in handleRingtonePickerResult
        startActivityForResult(call, intent, "handleRingtonePickerResult");
    }

    /**
     * Callback invoked after the ringtone picker is closed.
     */
    @ActivityCallback
    private void handleRingtonePickerResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK) {
            Intent data = result.getData();
            if (data == null) {
                call.reject("No data returned from ringtone picker");
                return;
            }

            Uri uri = data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);
            if (uri != null) {
                String name = getRingtoneName(uri);
                JSObject ret = new JSObject();
                ret.put("uri", uri.toString());
                ret.put("name", name);
                call.resolve(ret);
            } else {
                call.reject("No ringtone was selected.");
            }
        } else {
            call.reject("Ringtone picker was cancelled.");
        }
    }

    /**
     * Helper method to resolve a user-friendly ringtone title from its URI.
     */
    private String getRingtoneName(Uri uri) {
        String name = "Custom Sound"; // Fallback name
        Cursor cursor = null;
        try {
            cursor = getContext().getContentResolver().query(
                    uri,
                    new String[]{MediaStore.Audio.Media.TITLE},
                    null,
                    null,
                    null
            );
            if (cursor != null && cursor.moveToFirst()) {
                name = cursor.getString(0);
            }
        } catch (Exception ignored) {
            // If we can't resolve the name we'll just use the fallback
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
        return name;
    }
}
