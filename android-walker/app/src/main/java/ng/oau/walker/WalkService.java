package ng.oau.walker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;

import java.io.File;

/**
 * Records the walk with the screen off. GPS comes from satellites, so no mobile data is needed. Android shows a
 * notification the whole time, so the volunteer can always see that it is recording.
 */
public class WalkService extends Service implements LocationListener {
    static final String ACTION_STOP = "ng.oau.walker.STOP";
    private static final String CHANNEL = "walk";

    // The OAU road network from data/places.json. Positions outside it are never saved.
    private static final double LAT_MIN = 7.4838, LAT_MAX = 7.5500, LNG_MIN = 4.4531, LNG_MAX = 4.5458;
    private static final float MAX_ACCURACY = 40f;   // weaker readings are not worth keeping
    private static final float MIN_MOVE = 8f;        // metres between saved points
    private static final long HEARTBEAT = 60000L;    // also save while standing still: long stops show where places are

    // Read by the screen once a second.
    static volatile boolean running = false;
    static volatile int saved = 0;
    static volatile float metres = 0;
    static volatile float accuracy = -1;
    static volatile long lastFixAt = 0;      // SystemClock time of the last GPS reading of any quality
    static volatile long startedAt = 0;      // SystemClock time
    static volatile boolean outside = false;
    static volatile Location lastGood = null;
    static volatile File current = null;

    private LocationManager manager;
    private PowerManager.WakeLock wake;
    private Location lastSaved;

    static boolean inCampus(double lat, double lng) {
        return lat >= LAT_MIN && lat <= LAT_MAX && lng >= LNG_MIN && lng <= LNG_MAX;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            WalkStore.prefs(this).edit().remove("current").apply();
            finish();
            return START_NOT_STICKY;
        }
        begin();
        return START_STICKY;
    }

    private void begin() {
        if (running) return;
        // If Android stopped the service in the middle of a walk, carry on in the same file.
        String path = WalkStore.prefs(this).getString("current", null);
        File f = path != null ? new File(path) : null;
        if (f == null || !f.exists()) {
            f = WalkStore.newWalk(this, System.currentTimeMillis());
            WalkStore.prefs(this).edit().putString("current", f.getPath()).apply();
            saved = 0;
            metres = 0;
        }
        current = f;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(1, notification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            } else {
                startForeground(1, notification());
            }
            manager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            manager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000L, 0f, this, Looper.getMainLooper());
        } catch (RuntimeException noPermissionOrNoGps) {
            finish();
            return;
        }
        PowerManager power = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wake = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "oauwalk:walk");
        wake.acquire(12 * 60 * 60 * 1000L);
        running = true;
        startedAt = SystemClock.elapsedRealtime();
        lastFixAt = 0;
        lastSaved = null;
    }

    private void finish() {
        running = false;
        current = null;
        if (manager != null) {
            try {
                manager.removeUpdates(this);
            } catch (RuntimeException ignored) {
                // Already stopped.
            }
        }
        if (wake != null && wake.isHeld()) wake.release();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        if (running) finish();
        super.onDestroy();
    }

    @Override
    public void onLocationChanged(Location l) {
        lastFixAt = SystemClock.elapsedRealtime();
        accuracy = l.getAccuracy();
        outside = !inCampus(l.getLatitude(), l.getLongitude());
        if (outside || l.getAccuracy() > MAX_ACCURACY) return;
        lastGood = l;
        File f = current;
        if (f == null) return;
        float moved = lastSaved == null ? 0f : lastSaved.distanceTo(l);
        boolean due = lastSaved == null || moved >= MIN_MOVE || l.getTime() - lastSaved.getTime() >= HEARTBEAT;
        if (!due) return;
        WalkStore.addPoint(f, l);
        metres += moved;
        saved++;
        lastSaved = l;
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private Notification notification() {
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Recording your walk", NotificationManager.IMPORTANCE_LOW));
            b = new Notification.Builder(this, CHANNEL);
        } else {
            b = new Notification.Builder(this);
        }
        return b.setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentTitle("OAU Walk is recording your route")
                .setContentText("Tap to open the app or stop.")
                .setContentIntent(open)
                .setOngoing(true)
                .build();
    }
}
