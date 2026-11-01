package ng.oau.walker;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/** The real OAU boundary (assets/campus.json, from OpenStreetMap), with a small margin because maps and GPS are not exact. */
final class Campus {
    private static double[] lats, lngs;
    private static double margin = 60;

    private Campus() {}

    static synchronized void load(Context c) {
        if (lats != null) return;
        try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getAssets().open("campus.json"), StandardCharsets.UTF_8))) {
            StringBuilder b = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) b.append(line);
            JSONObject o = new JSONObject(b.toString());
            margin = o.optDouble("margin", margin);
            JSONArray ring = o.getJSONArray("ring");
            double[] la = new double[ring.length()], lo = new double[ring.length()];
            for (int i = 0; i < ring.length(); i++) {
                la[i] = ring.getJSONArray(i).getDouble(0);
                lo[i] = ring.getJSONArray(i).getDouble(1);
            }
            lats = la;
            lngs = lo;
        } catch (Exception bad) {
            lats = new double[0];   // no boundary: nothing counts as campus, so nothing is saved by mistake
            lngs = new double[0];
        }
    }

    static boolean contains(double lat, double lng) {
        double[] la = lats, lo = lngs;
        if (la == null || la.length < 3) return false;
        boolean in = false;
        double kx = Math.cos(Math.toRadians(lat)) * 111320, ky = 110540, best = Double.MAX_VALUE;
        for (int i = 0, j = la.length - 1; i < la.length; j = i++) {
            if ((la[i] > lat) != (la[j] > lat) && lng < (lo[j] - lo[i]) * (lat - la[i]) / (la[j] - la[i]) + lo[i]) in = !in;
            double ax = (lo[j] - lng) * kx, ay = (la[j] - lat) * ky, dx = (lo[i] - lo[j]) * kx, dy = (la[i] - la[j]) * ky;
            double l2 = dx * dx + dy * dy, u = l2 == 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2));
            best = Math.min(best, Math.hypot(ax + u * dx, ay + u * dy));
        }
        return in || best <= margin;
    }
}
