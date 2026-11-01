package ng.oau.walker;

import android.content.Context;
import android.content.SharedPreferences;
import android.location.Location;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Saves walks on the phone, one line at a time, so a crash or a flat battery loses at most the last point. */
final class WalkStore {
    private static final String PREFS = "walker";
    /** The first and last 100 m of each walk are cut when sending, so hostel rooms and homes are not shared. */
    private static final float TRIM_METRES = 100f;

    private WalkStore() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** A random code for this phone. No name, no phone number. */
    static String deviceCode(Context c) {
        SharedPreferences p = prefs(c);
        String code = p.getString("device", null);
        if (code == null) {
            String letters = "abcdefghjkmnpqrstuvwxyz23456789";
            SecureRandom r = new SecureRandom();
            StringBuilder b = new StringBuilder();
            for (int i = 0; i < 6; i++) b.append(letters.charAt(r.nextInt(letters.length())));
            code = b.toString();
            p.edit().putString("device", code).apply();
        }
        return code;
    }

    static File dir(Context c) {
        File d = new File(c.getFilesDir(), "walks");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    static File newWalk(Context c, long time) {
        return new File(dir(c), "walk-" + time + ".jsonl");
    }

    static synchronized void append(File f, String line) {
        try (FileWriter w = new FileWriter(f, true)) {
            w.write(line);
            w.write('\n');
        } catch (IOException ignored) {
            // The phone is out of space: nothing useful can be done in the middle of a walk.
        }
    }

    static void addPoint(File f, Location l) {
        try {
            JSONArray a = new JSONArray();
            a.put(round(l.getLatitude()));
            a.put(round(l.getLongitude()));
            a.put(Math.round(l.getAccuracy()));
            a.put(l.getTime());
            append(f, a.toString());
        } catch (JSONException ignored) {
            // A position that is not a number: skip it.
        }
    }

    /** A place the volunteer picked. With no recent GPS the position stays empty; the walk's times locate it later. */
    static void addMark(File f, String placeId, String name, Location fix, long now) {
        try {
            JSONObject o = new JSONObject();
            o.put("mark", true);
            if (placeId != null) o.put("place", placeId);
            o.put("name", name);
            o.put("t", now);
            if (fix != null) {
                o.put("lat", round(fix.getLatitude()));
                o.put("lng", round(fix.getLongitude()));
                o.put("acc", Math.round(fix.getAccuracy()));
            }
            append(f, o.toString());
        } catch (JSONException ignored) {
            // Nothing to save.
        }
    }

    private static double round(double v) {
        return Math.round(v * 1e6) / 1e6;
    }

    private static Set<String> sent(Context c) {
        return new HashSet<>(prefs(c).getStringSet("sent", new HashSet<String>()));
    }

    /** Walks saved on this phone, oldest first. */
    static List<File> walks(Context c) {
        File[] all = dir(c).listFiles();
        List<File> out = new ArrayList<>();
        if (all != null) {
            Arrays.sort(all);
            out.addAll(Arrays.asList(all));
        }
        return out;
    }

    static int unsentCount(Context c, File current) {
        Set<String> done = sent(c);
        int n = 0;
        for (File f : walks(c)) if (!done.contains(f.getName()) && !f.equals(current)) n++;
        return n;
    }

    /**
     * Puts the finished walks into one small text file for WhatsApp or email (.txt, because many phones refuse to share
     * .json). Returns null when there is nothing to send.
     */
    static File export(Context c, File current, boolean everything) throws IOException, JSONException {
        Set<String> done = sent(c);
        JSONArray walks = new JSONArray();
        Set<String> names = new HashSet<>(done);
        for (File f : walks(c)) {
            if (f.equals(current) || (!everything && done.contains(f.getName()))) continue;
            walks.put(readWalk(f));
            names.add(f.getName());
        }
        if (walks.length() == 0) return null;
        JSONObject root = new JSONObject();
        root.put("kind", "oau-walk");
        root.put("version", 1);
        root.put("device", deviceCode(c));
        root.put("exportedAt", System.currentTimeMillis());
        root.put("walks", walks);
        String stamp = new SimpleDateFormat("yyyyMMdd-HHmm", Locale.US).format(new Date());
        File out = new File(c.getCacheDir(), "oau-walk-" + deviceCode(c) + "-" + stamp + ".txt");
        try (FileWriter w = new FileWriter(out, false)) {
            w.write(root.toString());
        }
        prefs(c).edit().putStringSet("sent", names).apply();
        return out;
    }

    private static JSONObject readWalk(File f) throws IOException, JSONException {
        List<JSONArray> points = new ArrayList<>();
        JSONArray marks = new JSONArray();
        try (BufferedReader r = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = r.readLine()) != null) {
                if (line.isEmpty()) continue;
                try {
                    if (line.charAt(0) == '[') points.add(new JSONArray(line));
                    else marks.put(new JSONObject(line));
                } catch (JSONException cutOff) {
                    // The last line of a walk can be cut off if the phone died while writing it.
                }
            }
        }
        JSONArray kept = new JSONArray();
        if (!points.isEmpty()) {
            JSONArray first = points.get(0), last = points.get(points.size() - 1);
            for (JSONArray p : points) {
                if (metres(p, first) > TRIM_METRES && metres(p, last) > TRIM_METRES) kept.put(p);
            }
        }
        JSONObject walk = new JSONObject();
        walk.put("id", f.getName().replace(".jsonl", ""));
        walk.put("points", kept);
        walk.put("marks", marks);
        return walk;
    }

    private static float metres(JSONArray a, JSONArray b) throws JSONException {
        float[] out = new float[1];
        Location.distanceBetween(a.getDouble(0), a.getDouble(1), b.getDouble(0), b.getDouble(1), out);
        return out[0];
    }
}
