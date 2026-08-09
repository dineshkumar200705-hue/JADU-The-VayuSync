package com.airmouseai;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.content.Intent;
import android.graphics.Path;
import android.graphics.PointF;
import android.view.accessibility.AccessibilityEvent;
import android.os.Handler;
import android.os.Looper;

/**
 * AirMouseAccessibilityService
 *
 * Injects synthetic gestures into the Android OS.
 * Called from GestureModule via LocalBroadcastManager.
 *
 * Required permission (AndroidManifest.xml):
 *   <service android:name=".AirMouseAccessibilityService"
 *            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
 *     <intent-filter>
 *       <action android:name="android.accessibilityservice.AccessibilityService"/>
 *     </intent-filter>
 *     <meta-data android:name="android.accessibilityservice"
 *                android:resource="@xml/accessibility_service_config"/>
 *   </service>
 */
public class AirMouseAccessibilityService extends AccessibilityService {

    public static AirMouseAccessibilityService instance;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public boolean onUnbind(Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // We don't need to intercept events, only inject them
    }

    @Override
    public void onInterrupt() {}

    // ── Gesture injection helpers ─────────────────────────────────────────────

    public void performTap(float x, float y) {
        Path path = new Path();
        path.moveTo(x, y);

        GestureDescription gesture = new GestureDescription.Builder()
            .addStroke(new GestureDescription.StrokeDescription(path, 0, 100))
            .build();

        dispatchGesture(gesture, null, null);
    }

    public void performLongPress(float x, float y) {
        Path path = new Path();
        path.moveTo(x, y);

        GestureDescription gesture = new GestureDescription.Builder()
            .addStroke(new GestureDescription.StrokeDescription(path, 0, 800))
            .build();

        dispatchGesture(gesture, null, null);
    }

    public void performDoubleTap(float x, float y) {
        performTap(x, y);
        handler.postDelayed(() -> performTap(x, y), 120);
    }

    public void performSwipe(float x1, float y1, float x2, float y2, long duration) {
        Path path = new Path();
        path.moveTo(x1, y1);
        path.lineTo(x2, y2);

        GestureDescription gesture = new GestureDescription.Builder()
            .addStroke(new GestureDescription.StrokeDescription(path, 0, duration))
            .build();

        dispatchGesture(gesture, null, null);
    }

    public void performScroll(boolean up) {
        android.util.DisplayMetrics dm = getResources().getDisplayMetrics();
        float cx = dm.widthPixels / 2f;
        float cy = dm.heightPixels / 2f;
        float delta = dm.heightPixels * 0.35f;

        if (up) {
            performSwipe(cx, cy + delta, cx, cy - delta, 300);
        } else {
            performSwipe(cx, cy - delta, cx, cy + delta, 300);
        }
    }

    public void performBack() {
        performGlobalAction(GLOBAL_ACTION_BACK);
    }

    public void performHome() {
        performGlobalAction(GLOBAL_ACTION_HOME);
    }

    public void performRecents() {
        performGlobalAction(GLOBAL_ACTION_RECENTS);
    }

    public void performNotifications() {
        performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS);
    }

    public void performQuickSettings() {
        performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS);
    }

    public void performScreenshot() {
        performGlobalAction(GLOBAL_ACTION_TAKE_SCREENSHOT);
    }

    public void startDrag(float x, float y) {
        Path path = new Path();
        path.moveTo(x, y);
        GestureDescription.StrokeDescription stroke = new GestureDescription.StrokeDescription(path, 0, 100, true);
        GestureDescription gesture = new GestureDescription.Builder().addStroke(stroke).build();
        dispatchGesture(gesture, null, null);
    }

    public void continueDrag(float x, float y) {
        Path path = new Path();
        path.moveTo(x, y);
        GestureDescription.StrokeDescription stroke = new GestureDescription.StrokeDescription(path, 0, 50, true);
        GestureDescription gesture = new GestureDescription.Builder().addStroke(stroke).build();
        dispatchGesture(gesture, null, null);
    }

    public void endDrag(float x, float y) {
        Path path = new Path();
        path.moveTo(x, y);
        GestureDescription.StrokeDescription stroke = new GestureDescription.StrokeDescription(path, 0, 50, false);
        GestureDescription gesture = new GestureDescription.Builder().addStroke(stroke).build();
        dispatchGesture(gesture, null, null);
    }

    public static boolean isActive() {
        return instance != null;
    }
}
