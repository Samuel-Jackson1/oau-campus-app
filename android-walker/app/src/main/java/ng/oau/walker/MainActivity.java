package ng.oau.walker;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.location.Location;
import android.graphics.Matrix;
import android.location.LocationManager;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.provider.MediaStore;
import android.provider.Settings;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/** One big button. Everything a volunteer needs is on one screen. */
public class MainActivity extends Activity {
    private static final int NAVY = 0xFF0D1B8E, GOLD = 0xFFF8C843, RED = 0xFFC62828, INK = 0xFF16182B, MUTED = 0xFF44475A, PAPER = 0xFFF6F6FB;
    private static final int ASK_LOCATION = 1, TAKE_PHOTO = 2, TAKE_VIDEO = 3;
    private static final int VIDEO_SECONDS = 20;
    private static final long VIDEO_MAX_BYTES = 15L * 1024 * 1024;
    private static final long GOOD_FIX_AGE = 60000L;   // a mark uses the last good position only if it is this recent

    private final Handler ticker = new Handler(Looper.getMainLooper());
    private TextView status, detail;
    private Button big, mark, photo, video, send, sendMedia;
    private CheckBox test;

    /** What happens after the volunteer picks a place (name and id are null if they skipped). */
    private interface Picked {
        void done(String id, String name);
    }
    private final List<Place> places = new ArrayList<>();

    private static final class Place {
        String id, name, search;
        double lat, lng;
    }

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            refresh();
            ticker.postDelayed(this, 1000);
        }
    };

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        loadPlaces();
        if (WalkStore.prefs(this).getBoolean("agreed", false)) showMain();
        else showConsent();
    }

    @Override
    protected void onResume() {
        super.onResume();
        ticker.post(tick);
    }

    @Override
    protected void onPause() {
        super.onPause();
        ticker.removeCallbacks(tick);
    }

    // ---------- the agreement, shown once before anything is recorded ----------
    private void showConsent() {
        LinearLayout page = page();
        page.addView(text("Help map OAU", 30, INK, true));
        page.addView(gap(12));
        page.addView(text("This app records the route you walk on campus to improve the OAU map for freshers and visitors.", 19, INK, false));
        page.addView(gap(12));
        page.addView(text("• It records only after you tap Start, and you can tap Stop at any time.\n"
                + "• A notification shows the whole time it is recording.\n"
                + "• It uses GPS, not your data, and it cannot send anything by itself. You choose when to send your walk.\n"
                + "• It does not ask for your name. Places outside OAU are not saved, and the first and last 100 m of each walk are removed before sending.\n"
                + "• Photos and short videos are only taken when you choose. Please film buildings and places, not people.", 17, MUTED, false));
        page.addView(gap(24));
        Button agree = button("I agree", NAVY, Color.WHITE);
        agree.setOnClickListener(v -> {
            WalkStore.prefs(this).edit().putBoolean("agreed", true).apply();
            showMain();
            askPermissions();
        });
        page.addView(agree, wide());
        page.addView(gap(8));
        Button no = button("No, thanks", PAPER, MUTED);
        no.setOnClickListener(v -> finish());
        page.addView(no, wide());
        setContentView(scroll(page));
    }

    // ---------- the main screen ----------
    private void showMain() {
        LinearLayout page = page();
        page.addView(text("OAU Walk", 28, NAVY, true));
        page.addView(text("Thank you for helping to map the campus.", 16, MUTED, false));
        page.addView(gap(20));

        big = button("Start", NAVY, Color.WHITE);
        big.setTextSize(30);
        big.setOnClickListener(v -> toggle());
        page.addView(big, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(140)));
        page.addView(gap(16));

        status = text("", 20, INK, true);
        status.setGravity(Gravity.CENTER);
        page.addView(status);
        detail = text("", 16, MUTED, false);
        detail.setGravity(Gravity.CENTER);
        page.addView(detail);
        page.addView(gap(16));

        mark = button("I am at a place", GOLD, 0xFF1A1300);
        mark.setOnClickListener(v -> {
            if (allowedHere()) pickPlace(false, this::saveMark);
        });
        page.addView(mark, wide());
        page.addView(gap(10));

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        photo = button("Take a photo", PAPER, NAVY);
        photo.setOnClickListener(v -> capture(TAKE_PHOTO));
        video = button("Short video", PAPER, NAVY);
        video.setOnClickListener(v -> capture(TAKE_VIDEO));
        LinearLayout.LayoutParams half = new LinearLayout.LayoutParams(0, dp(60), 1f);
        row.addView(photo, half);
        View between = new View(this);
        row.addView(between, new LinearLayout.LayoutParams(dp(10), 1));
        row.addView(video, new LinearLayout.LayoutParams(0, dp(60), 1f));
        page.addView(row);
        page.addView(gap(10));

        send = button("Send my walks", PAPER, NAVY);
        send.setOnClickListener(v -> sendWalks(false));
        page.addView(send, wide());
        page.addView(gap(10));
        sendMedia = button("Send photos and videos", PAPER, NAVY);
        sendMedia.setOnClickListener(v -> sendMediaFiles());
        page.addView(sendMedia, wide());
        page.addView(gap(4));
        TextView again = text("Send all my walks again", 15, MUTED, false);
        again.setGravity(Gravity.CENTER);
        again.setPadding(0, dp(12), 0, dp(12));
        again.setOnClickListener(v -> sendWalks(true));
        page.addView(again);
        test = new CheckBox(this);
        test.setText("Test mode (team only): keep walks outside OAU. They are marked as tests and never used.");
        test.setTextSize(14);
        test.setTextColor(MUTED);
        test.setChecked(WalkStore.prefs(this).getBoolean("testMode", false));
        test.setOnCheckedChangeListener((b, on) -> WalkStore.prefs(this).edit().putBoolean("testMode", on).apply());
        page.addView(test);

        if (isTranssion()) {
            page.addView(gap(8));
            page.addView(text("On this phone, please set OAU Walk to \"No restriction\" or \"Allow background activity\" under Battery, or the phone may stop it while you walk.", 15, RED, false));
            Button open = button("Open battery settings for this app", PAPER, NAVY);
            open.setOnClickListener(v -> openAppSettings());
            page.addView(gap(6));
            page.addView(open, wide());
        }
        setContentView(scroll(page));
        refresh();
    }

    private static boolean isTranssion() {
        String m = (Build.MANUFACTURER + " " + Build.BRAND).toLowerCase(Locale.US);
        return m.contains("tecno") || m.contains("infinix") || m.contains("itel");
    }

    private void refresh() {
        if (big == null) return;
        boolean on = WalkService.running;
        big.setText(on ? "Stop" : "Start");
        tint(big, on ? RED : NAVY);
        for (Button b : new Button[] {mark, photo, video}) {
            b.setEnabled(on);
            b.setAlpha(on ? 1f : 0.45f);
        }
        test.setEnabled(!on);
        List<File> media = WalkStore.unsentMedia(this);
        long bytes = 0;
        for (File f : media) bytes += f.length();
        sendMedia.setVisibility(media.isEmpty() ? View.GONE : View.VISIBLE);
        sendMedia.setText(String.format(Locale.US, "Send photos and videos (%d, %.1f MB)", media.size(), bytes / 1048576.0));
        int waiting = WalkStore.unsentCount(this, WalkService.current);
        send.setText(waiting > 0 ? "Send my walks (" + waiting + ")" : "Send my walks");
        if (!on) {
            status.setText("Not recording");
            detail.setText(waiting > 0 ? "You have walks to send when you have data." : "Tap Start, then put your phone in your pocket.");
            return;
        }
        long sinceFix = WalkService.lastFixAt == 0 ? -1 : SystemClock.elapsedRealtime() - WalkService.lastFixAt;
        if (WalkService.testMode) status.setText("TEST walk: it will not be used");
        else if (WalkService.outside) status.setText("Outside OAU: not saving");
        else if (sinceFix < 0 || sinceFix > 30000) status.setText("Looking for GPS: go outside");
        else status.setText("Recording. You can lock your phone.");
        long minutes = (SystemClock.elapsedRealtime() - WalkService.startedAt) / 60000;
        String acc = WalkService.accuracy >= 0 ? " · GPS ±" + Math.round(WalkService.accuracy) + " m" : "";
        detail.setText(String.format(Locale.US, "%d min · %d m%s", minutes, Math.round(WalkService.metres), acc));
    }

    // ---------- start and stop ----------
    private void toggle() {
        if (WalkService.running) {
            startService(new Intent(this, WalkService.class).setAction(WalkService.ACTION_STOP));
            Toast.makeText(this, "Walk saved. Send it when you have data.", Toast.LENGTH_LONG).show();
            return;
        }
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            askPermissions();
            return;
        }
        LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE);
        if (lm == null || !lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            new AlertDialog.Builder(this)
                    .setMessage("Please turn on Location (GPS). It does not use your data.")
                    .setPositiveButton("Turn on", (d, w) -> startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)))
                    .setNegativeButton("Not now", null).show();
            return;
        }
        askToStayAwake();
        Intent i = new Intent(this, WalkService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(i);
        else startService(i);
    }

    private void askPermissions() {
        List<String> ask = new ArrayList<>();
        ask.add(Manifest.permission.ACCESS_FINE_LOCATION);
        ask.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        if (Build.VERSION.SDK_INT >= 33) ask.add(Manifest.permission.POST_NOTIFICATIONS);
        requestPermissions(ask.toArray(new String[0]), ASK_LOCATION);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (code == ASK_LOCATION && checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, "OAU Walk needs Location to record your route.", Toast.LENGTH_LONG).show();
        }
    }

    /** Asks Android not to stop the app to save battery. */
    private void askToStayAwake() {
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm == null || pm.isIgnoringBatteryOptimizations(getPackageName())) return;
        try {
            startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
        } catch (ActivityNotFoundException ignored) {
            // Some phones do not have this screen.
        }
    }

    private void openAppSettings() {
        try {
            startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
        } catch (ActivityNotFoundException ignored) {
            Toast.makeText(this, "Open your phone's Settings, then Apps, then OAU Walk.", Toast.LENGTH_LONG).show();
        }
    }

    // ---------- "I am at a place": pick from the list ----------
    private void loadPlaces() {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(getAssets().open("places.json"), StandardCharsets.UTF_8))) {
            StringBuilder b = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) b.append(line);
            JSONArray a = new JSONArray(b.toString());
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.getJSONObject(i);
                Place p = new Place();
                p.id = o.optString("id", null);   // names the team knows but nobody has located yet have no id
                p.name = o.getString("name");
                p.search = o.optString("search", p.name).toLowerCase(Locale.US);
                p.lat = o.optDouble("lat", Double.NaN);
                p.lng = o.optDouble("lng", Double.NaN);
                places.add(p);
            }
        } catch (Exception bad) {
            places.clear();   // the volunteer can still type a name
        }
    }

    /** The last good position, only if it is recent. Otherwise the place is located later from the walk's times. */
    private static Location freshFix() {
        Location l = WalkService.lastGood;
        if (l == null || System.currentTimeMillis() - l.getTime() > GOOD_FIX_AGE) return null;
        return l;
    }

    /** Outside OAU nothing is marked or filmed, unless this is a team test. */
    private boolean allowedHere() {
        if (!WalkService.outside || WalkService.testMode) return true;
        Toast.makeText(this, "You are outside OAU, so this is not saved.", Toast.LENGTH_LONG).show();
        return false;
    }

    private void pickPlace(boolean canSkip, final Picked then) {
        final Location here = freshFix();
        final List<Place> sorted = new ArrayList<>(places);
        if (here != null) {
            Collections.sort(sorted, (a, b) -> Float.compare(distance(here, a), distance(here, b)));
        } else {
            Collections.sort(sorted, (a, b) -> a.name.compareToIgnoreCase(b.name));
        }
        final List<Place> shown = new ArrayList<>();
        final List<String> rows = new ArrayList<>();
        final ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, rows);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(16), dp(4), dp(16), 0);
        TextView hint = text("Anywhere inside the place counts: any spot on Motion Ground is still Motion Ground.", 14, MUTED, false);
        box.addView(hint);
        final EditText find = new EditText(this);
        find.setHint("Type a name");
        find.setInputType(InputType.TYPE_CLASS_TEXT);
        box.addView(find);
        ListView list = new ListView(this);
        list.setAdapter(adapter);
        box.addView(list, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(320)));

        AlertDialog.Builder builder = new AlertDialog.Builder(this)
                .setTitle("Where are you now?")
                .setView(box);
        if (canSkip) builder.setCancelable(false).setNegativeButton("Skip: I don't know", (d, w) -> then.done(null, null));
        else builder.setNegativeButton("Cancel", null);
        final AlertDialog dialog = builder.create();

        final Runnable fill = () -> {
            String q = find.getText().toString().trim().toLowerCase(Locale.US);
            shown.clear();
            rows.clear();
            rows.add("Not on the list: type the name");
            for (Place p : sorted) {
                if (!q.isEmpty() && !p.search.contains(q)) continue;
                shown.add(p);
                rows.add(here != null && !Double.isNaN(p.lat) ? p.name + "  ·  " + away(distance(here, p)) : p.name);
            }
            adapter.notifyDataSetChanged();
        };
        find.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int a, int b, int c) {}
            @Override public void onTextChanged(CharSequence s, int a, int b, int c) {}
            @Override public void afterTextChanged(Editable s) { fill.run(); }
        });
        list.setOnItemClickListener((parent, view, position, id) -> {
            dialog.dismiss();
            if (position == 0) typeName(find.getText().toString().trim(), canSkip, then);
            else then.done(shown.get(position - 1).id, shown.get(position - 1).name);
        });
        fill.run();
        dialog.show();
    }

    private void typeName(String start, boolean canSkip, final Picked then) {
        final EditText name = new EditText(this);
        name.setHint("Name of this place");
        name.setText(start);
        name.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        new AlertDialog.Builder(this)
                .setTitle("What is this place called?")
                .setView(name)
                .setCancelable(!canSkip)
                .setPositiveButton("Save", (d, w) -> {
                    String n = name.getText().toString().trim();
                    if (!n.isEmpty()) then.done(null, n);
                    else if (canSkip) then.done(null, null);
                })
                .setNegativeButton(canSkip ? "Skip" : "Cancel", (d, w) -> {
                    if (canSkip) then.done(null, null);
                }).show();
    }

    private void saveMark(String id, String name) {
        File f = WalkService.current;
        if (f == null) return;
        Location fix = freshFix();
        WalkStore.addMark(f, id, name, fix, System.currentTimeMillis());
        Toast.makeText(this, fix != null ? "Saved: " + name : "Saved: " + name + ". We will find the spot from your walk.", Toast.LENGTH_LONG).show();
    }

    // ---------- photos and short videos, each saved with where the phone was when it was taken ----------
    private void capture(int kind) {
        if (!allowedHere()) return;
        boolean isPhoto = kind == TAKE_PHOTO;
        File f = new File(WalkStore.mediaDir(this), (isPhoto ? "photo-" : "video-") + WalkStore.deviceCode(this) + "-" + System.currentTimeMillis() + (isPhoto ? ".jpg" : ".mp4"));
        Location fix = freshFix();
        android.content.SharedPreferences.Editor e = WalkStore.prefs(this).edit().putString("pendingFile", f.getPath()).putLong("pendingAt", System.currentTimeMillis());
        if (fix != null) {
            e.putString("pendingLat", String.valueOf(fix.getLatitude())).putString("pendingLng", String.valueOf(fix.getLongitude())).putFloat("pendingAcc", fix.getAccuracy());
        } else {
            e.remove("pendingLat").remove("pendingLng").remove("pendingAcc");
        }
        e.apply();
        Uri uri = ShareProvider.mediaUri(f);
        Intent i = new Intent(isPhoto ? MediaStore.ACTION_IMAGE_CAPTURE : MediaStore.ACTION_VIDEO_CAPTURE);
        i.putExtra(MediaStore.EXTRA_OUTPUT, uri);
        i.setClipData(ClipData.newRawUri("", uri));
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        if (!isPhoto) {
            i.putExtra(MediaStore.EXTRA_DURATION_LIMIT, VIDEO_SECONDS);
            i.putExtra(MediaStore.EXTRA_VIDEO_QUALITY, 0);   // small files: videos are sent over mobile data
            i.putExtra(MediaStore.EXTRA_SIZE_LIMIT, VIDEO_MAX_BYTES);
        }
        try {
            startActivityForResult(i, kind);
        } catch (ActivityNotFoundException none) {
            Toast.makeText(this, "This phone has no camera app we can open.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code != TAKE_PHOTO && code != TAKE_VIDEO) return;
        android.content.SharedPreferences p = WalkStore.prefs(this);
        String path = p.getString("pendingFile", null);
        p.edit().remove("pendingFile").apply();
        if (path == null) return;
        final File f = new File(path);
        if (result != RESULT_OK) {
            f.delete();
            return;
        }
        // Some camera apps ignore where we asked them to save, and hand the file back instead.
        if (f.length() == 0 && data != null && data.getData() != null) copyFrom(data.getData(), f);
        if (f.length() == 0) {
            f.delete();
            Toast.makeText(this, "The camera did not give us the file. Please try again.", Toast.LENGTH_LONG).show();
            return;
        }
        final Location fix = pendingFix(p);
        final long at = p.getLong("pendingAt", System.currentTimeMillis());
        if (code == TAKE_PHOTO) shrinkPhoto(f, fix);
        pickPlace(true, (id, name) -> {
            File walk = WalkService.current;
            if (walk != null) WalkStore.addMedia(walk, code == TAKE_PHOTO ? "photo" : "video", f.getName(), id, name, fix, at);
            Toast.makeText(this, (fix != null ? "Saved with its location." : "Saved. We will find the spot from your walk."), Toast.LENGTH_LONG).show();
        });
    }

    private static Location pendingFix(android.content.SharedPreferences p) {
        String lat = p.getString("pendingLat", null), lng = p.getString("pendingLng", null);
        Location l = lat == null || lng == null ? freshFix() : new Location("gps");
        if (l != null && lat != null && lng != null) {
            l.setLatitude(Double.parseDouble(lat));
            l.setLongitude(Double.parseDouble(lng));
            l.setAccuracy(p.getFloat("pendingAcc", 0f));
        }
        return l;
    }

    private void copyFrom(Uri from, File to) {
        try (InputStream in = getContentResolver().openInputStream(from); OutputStream out = new FileOutputStream(to)) {
            byte[] buf = new byte[65536];
            int n;
            while (in != null && (n = in.read(buf)) > 0) out.write(buf, 0, n);
        } catch (Exception ignored) {
            // The caller sees an empty file and tells the volunteer.
        }
    }

    /** Photos go over mobile data: at most 1600 px, upright, with the position written inside the file too. */
    private static void shrinkPhoto(File f, Location fix) {
        try {
            String path = f.getPath();
            int turn = new ExifInterface(path).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            int degrees = turn == ExifInterface.ORIENTATION_ROTATE_90 ? 90 : turn == ExifInterface.ORIENTATION_ROTATE_180 ? 180 : turn == ExifInterface.ORIENTATION_ROTATE_270 ? 270 : 0;
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(path, o);
            int longest = Math.max(o.outWidth, o.outHeight), sample = 1;
            while (longest / (sample * 2) >= 1600) sample *= 2;
            o = new BitmapFactory.Options();
            o.inSampleSize = sample;
            Bitmap b = BitmapFactory.decodeFile(path, o);
            if (b == null) return;
            if (degrees != 0) {
                Matrix m = new Matrix();
                m.postRotate(degrees);
                b = Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
            }
            try (FileOutputStream out = new FileOutputStream(f)) {
                b.compress(Bitmap.CompressFormat.JPEG, 72, out);
            }
            if (fix != null) {
                ExifInterface x = new ExifInterface(path);
                x.setAttribute(ExifInterface.TAG_GPS_LATITUDE, dms(fix.getLatitude()));
                x.setAttribute(ExifInterface.TAG_GPS_LATITUDE_REF, fix.getLatitude() >= 0 ? "N" : "S");
                x.setAttribute(ExifInterface.TAG_GPS_LONGITUDE, dms(fix.getLongitude()));
                x.setAttribute(ExifInterface.TAG_GPS_LONGITUDE_REF, fix.getLongitude() >= 0 ? "E" : "W");
                x.saveAttributes();
            }
        } catch (Exception keepTheOriginal) {
            // The full-size photo is still there; it is just bigger.
        }
    }

    /** A coordinate the way photo files store it: degrees, minutes, seconds. */
    private static String dms(double v) {
        v = Math.abs(v);
        int deg = (int) v;
        double rest = (v - deg) * 60;
        int min = (int) rest;
        long sec = Math.round((rest - min) * 60 * 10000);
        return deg + "/1," + min + "/1," + sec + "/10000";
    }

    private void sendMediaFiles() {
        Toast.makeText(this, "Preparing the file...", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            File out = null;
            try {
                out = WalkStore.exportMedia(this);
            } catch (Exception ignored) {
                // Told below.
            }
            final File ready = out;
            runOnUiThread(() -> {
                if (ready == null) {
                    Toast.makeText(this, "No new photos or videos to send.", Toast.LENGTH_LONG).show();
                    return;
                }
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("application/zip");
                i.putExtra(Intent.EXTRA_STREAM, ShareProvider.uriFor(ready));
                i.putExtra(Intent.EXTRA_SUBJECT, ready.getName());
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(i, "Send photos and videos (WhatsApp works)"));
            });
        }).start();
    }

    /** Places with no position yet sort after the located ones. */
    private static float distance(Location here, Place p) {
        if (Double.isNaN(p.lat) || Double.isNaN(p.lng)) return Float.MAX_VALUE;
        float[] out = new float[1];
        Location.distanceBetween(here.getLatitude(), here.getLongitude(), p.lat, p.lng, out);
        return out[0];
    }

    private static String away(float m) {
        return m < 1000 ? Math.round(m / 10) * 10 + " m" : String.format(Locale.US, "%.1f km", m / 1000);
    }

    // ---------- send, when the volunteer has data ----------
    private void sendWalks(boolean everything) {
        try {
            File out = WalkStore.export(this, WalkService.current, everything);
            if (out == null) {
                Toast.makeText(this, WalkService.running ? "Tap Stop first, then send." : "No new walks to send.", Toast.LENGTH_LONG).show();
                return;
            }
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_STREAM, ShareProvider.uriFor(out));
            i.putExtra(Intent.EXTRA_SUBJECT, out.getName());
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(i, "Send your walk (WhatsApp works)"));
        } catch (Exception bad) {
            Toast.makeText(this, "Could not prepare the file. Please try again.", Toast.LENGTH_LONG).show();
        }
    }

    // ---------- small helpers for building the screen in code ----------
    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private LinearLayout page() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setPadding(dp(20), dp(28), dp(20), dp(28));
        return l;
    }

    private View scroll(View inner) {
        ScrollView s = new ScrollView(this);
        s.setFillViewport(true);
        s.setBackgroundColor(Color.WHITE);
        s.addView(inner);
        return s;
    }

    private TextView text(String t, int sp, int color, boolean bold) {
        TextView v = new TextView(this);
        v.setText(t);
        v.setTextSize(sp);
        v.setTextColor(color);
        if (bold) v.setTypeface(Typeface.DEFAULT_BOLD);
        return v;
    }

    private Button button(String t, int back, int color) {
        Button b = new Button(this);
        b.setText(t);
        b.setAllCaps(false);
        b.setTextSize(19);
        b.setTextColor(color);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        tint(b, back);
        return b;
    }

    private void tint(Button b, int color) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(18));
        b.setBackground(d);
    }

    private LinearLayout.LayoutParams wide() {
        return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(60));
    }

    private View gap(int h) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(1, dp(h)));
        return v;
    }
}
