package ng.oau.walker;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.provider.Settings;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
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
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/** One big button. Everything a volunteer needs is on one screen. */
public class MainActivity extends Activity {
    private static final int NAVY = 0xFF0D1B8E, GOLD = 0xFFF8C843, RED = 0xFFC62828, INK = 0xFF16182B, MUTED = 0xFF44475A, PAPER = 0xFFF6F6FB;
    private static final int ASK_LOCATION = 1;
    private static final long GOOD_FIX_AGE = 60000L;   // a mark uses the last good position only if it is this recent

    private final Handler ticker = new Handler(Looper.getMainLooper());
    private TextView status, detail;
    private Button big, mark, send;
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
                + "• It does not ask for your name. Places outside OAU are not saved, and the first and last 100 m of each walk are removed before sending.", 17, MUTED, false));
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
        mark.setOnClickListener(v -> pickPlace());
        page.addView(mark, wide());
        page.addView(gap(10));

        send = button("Send my walks", PAPER, NAVY);
        send.setOnClickListener(v -> sendWalks(false));
        page.addView(send, wide());
        page.addView(gap(4));
        TextView again = text("Send all my walks again", 15, MUTED, false);
        again.setGravity(Gravity.CENTER);
        again.setPadding(0, dp(12), 0, dp(12));
        again.setOnClickListener(v -> sendWalks(true));
        page.addView(again);

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
        mark.setEnabled(on);
        mark.setAlpha(on ? 1f : 0.45f);
        int waiting = WalkStore.unsentCount(this, WalkService.current);
        send.setText(waiting > 0 ? "Send my walks (" + waiting + ")" : "Send my walks");
        if (!on) {
            status.setText("Not recording");
            detail.setText(waiting > 0 ? "You have walks to send when you have data." : "Tap Start, then put your phone in your pocket.");
            return;
        }
        long sinceFix = WalkService.lastFixAt == 0 ? -1 : SystemClock.elapsedRealtime() - WalkService.lastFixAt;
        if (WalkService.outside) status.setText("Outside OAU: not saving");
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
                p.id = o.getString("id");
                p.name = o.getString("name");
                p.search = o.optString("search", p.name).toLowerCase(Locale.US);
                p.lat = o.getDouble("lat");
                p.lng = o.getDouble("lng");
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

    private void pickPlace() {
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

        final AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Where are you now?")
                .setView(box)
                .setNegativeButton("Cancel", null)
                .create();

        final Runnable fill = () -> {
            String q = find.getText().toString().trim().toLowerCase(Locale.US);
            shown.clear();
            rows.clear();
            rows.add("Not on the list: type the name");
            for (Place p : sorted) {
                if (!q.isEmpty() && !p.search.contains(q)) continue;
                shown.add(p);
                rows.add(here != null ? p.name + "  ·  " + away(distance(here, p)) : p.name);
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
            if (position == 0) typeName(find.getText().toString().trim());
            else saveMark(shown.get(position - 1).id, shown.get(position - 1).name);
        });
        fill.run();
        dialog.show();
    }

    private void typeName(String start) {
        final EditText name = new EditText(this);
        name.setHint("Name of this place");
        name.setText(start);
        name.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        new AlertDialog.Builder(this)
                .setTitle("What is this place called?")
                .setView(name)
                .setPositiveButton("Save", (d, w) -> {
                    String n = name.getText().toString().trim();
                    if (!n.isEmpty()) saveMark(null, n);
                })
                .setNegativeButton("Cancel", null).show();
    }

    private void saveMark(String id, String name) {
        File f = WalkService.current;
        if (f == null) return;
        Location fix = freshFix();
        WalkStore.addMark(f, id, name, fix, System.currentTimeMillis());
        Toast.makeText(this, fix != null ? "Saved: " + name : "Saved: " + name + ". We will find the spot from your walk.", Toast.LENGTH_LONG).show();
    }

    private static float distance(Location here, Place p) {
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
