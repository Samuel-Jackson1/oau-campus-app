package ng.oau.walker;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/** Lets WhatsApp or email read the one file the volunteer chose to send, and nothing else. */
public class ShareProvider extends ContentProvider {
    static final String AUTHORITY = "ng.oau.walker.share";

    static Uri uriFor(File f) {
        return new Uri.Builder().scheme("content").authority(AUTHORITY).appendPath(f.getName()).build();
    }

    /** Where the camera app saves a new photo or video. */
    static Uri mediaUri(File f) {
        return new Uri.Builder().scheme("content").authority(AUTHORITY).appendPath("media").appendPath(f.getName()).build();
    }

    private File fileFor(Uri uri) throws FileNotFoundException {
        String name = uri.getLastPathSegment();
        if (name == null || name.contains("/") || name.contains("..")) throw new FileNotFoundException();
        boolean media = uri.getPathSegments().size() == 2 && "media".equals(uri.getPathSegments().get(0));
        File f = new File(media ? WalkStore.mediaDir(getContext()) : getContext().getCacheDir(), name);
        if (!media && !f.exists()) throw new FileNotFoundException();
        return f;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        boolean write = mode != null && mode.contains("w");
        if (write && !(uri.getPathSegments().size() == 2)) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(fileFor(uri), write
                ? ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_TRUNCATE
                : ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] args, String sort) {
        MatrixCursor c = new MatrixCursor(new String[] {OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        try {
            File f = fileFor(uri);
            c.addRow(new Object[] {f.getName(), f.length()});
        } catch (FileNotFoundException ignored) {
            // An empty answer tells the other app the file has gone.
        }
        return c;
    }

    @Override
    public String getType(Uri uri) {
        String n = uri.getLastPathSegment() == null ? "" : uri.getLastPathSegment();
        return n.endsWith(".zip") ? "application/zip" : n.endsWith(".jpg") ? "image/jpeg" : n.endsWith(".mp4") ? "video/mp4" : "text/plain";
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] args) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] args) {
        return 0;
    }
}
