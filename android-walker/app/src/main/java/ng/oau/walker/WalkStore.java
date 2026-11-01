package ng.oau.walker;

import android.content.Context;
import android.content.SharedPreferences;
import android.location.Location;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
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
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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

    /** A photo or video: the file, when it was taken, where the phone was, and which place it shows (if the volunteer said). */
    static void addMedia(File f, String kind, String file, String placeId, String name, Location fix, long now) {
        try {
            JSONObject o = new JSONObject();
            o.put("mark", true);
            o.put("media", kind);
            o.put("file", file);
            if (placeId != null) o.put("place", placeId);
            if (name != null) o.put("name", name);
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

    /** What the camera app answered, kept only so a failed photo or video can be traced from the walk file. */
    static void addCameraNote(File f, String kind, int result, long bytes, boolean returned, long now) {
        try {
            JSONObject o = new JSONObject();
            o.put("event", "camera");
            o.put("kind", kind);
            o.put("result", result);
            o.put("bytes", bytes);
            o.put("returnedFile", returned);
            o.put("t", now);
            append(f, o.toString());
        } catch (JSONException ignored) {
            // Only a note.
        }
    }

    static File mediaDir(Context c) {
        File d = new File(c.getFilesDir(), "media");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private static Set<String> sentMedia(Context c) {
        return new HashSet<>(prefs(c).getStringSet("sentMedia", new HashSet<String>()));
    }

    /** Photos and videos not yet sent. */
    static List<File> unsentMedia(Context c) {
        Set<String> done = sentMedia(c);
        List<File> out = new ArrayList<>();
        File[] all = mediaDir(c).listFiles();
        if (all != null) {
            Arrays.sort(all);
            for (File f : all) if (f.length() > 0 && !done.contains(f.getName())) out.add(f);
        }
        return out;
    }

    /** One zip with the unsent photos and videos, and where each was taken (so it still works if the walk file is lost). */
    static File exportMedia(Context c) throws IOException, JSONException {
        List<File> files = unsentMedia(c);
        if (files.isEmpty()) return null;
        JSONArray info = new JSONArray();
        Set<String> names = new HashSet<>();
        for (File f : files) names.add(f.getName());
        for (File w : walks(c)) {
            try (BufferedReader r = new BufferedReader(new FileReader(w))) {
                String line;
                while ((line = r.readLine()) != null) {
                    if (!line.startsWith("{")) continue;
                    try {
                        JSONObject o = new JSONObject(line);
                        if (names.contains(o.optString("file"))) info.put(o);
                    } catch (JSONException cutOff) {
                        // A line cut off by a dead battery.
                    }
                }
            }
        }
        String stamp = new SimpleDateFormat("yyyyMMdd-HHmm", Locale.US).format(new Date());
        File out = new File(c.getCacheDir(), "oau-media-" + deviceCode(c) + "-" + stamp + ".zip");
        byte[] buf = new byte[65536];
        try (ZipOutputStream z = new ZipOutputStream(new FileOutputStream(out))) {
            JSONObject head = new JSONObject();
            head.put("kind", "oau-media");
            head.put("device", deviceCode(c));
            head.put("media", info);
            z.putNextEntry(new ZipEntry("media.json"));
            z.write(head.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            z.closeEntry();
            for (File f : files) {
                z.putNextEntry(new ZipEntry(f.getName()));
                try (FileInputStream in = new FileInputStream(f)) {
                    int n;
                    while ((n = in.read(buf)) > 0) z.write(buf, 0, n);
                }
                z.closeEntry();
            }
        }
        Set<String> done = sentMedia(c);
        done.addAll(names);
        prefs(c).edit().putStringSet("sentMedia", done).apply();
        return out;
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
        JSONArray marks = new JSONArray(), events = new JSONArray();
        boolean test = false;
        try (BufferedReader r = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = r.readLine()) != null) {
                if (line.isEmpty()) continue;
                try {
                    if (line.charAt(0) == '[') points.add(new JSONArray(line));
                    else {
                        JSONObject o = new JSONObject(line);
                        if (o.optBoolean("test")) test = true;
                        else if (o.has("event")) events.put(o);
                        else marks.put(o);
                    }
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
        if (test) walk.put("test", true);
        walk.put("points", kept);
        walk.put("marks", marks);
        if (events.length() > 0) walk.put("events", events);
        return walk;
    }

    private static float metres(JSONArray a, JSONArray b) throws JSONException {
        float[] out = new float[1];
        Location.distanceBetween(a.getDouble(0), a.getDouble(1), b.getDouble(0), b.getDouble(1), out);
        return out[0];
    }
}
