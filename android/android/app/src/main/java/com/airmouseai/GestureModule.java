package com.airmouseai;

import android.app.Activity;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import androidx.annotation.NonNull;

/**
 * React Native bridge — exposes gesture injection to JS/TS layer.
 *
 * Usage in JS/TS:
 *   import { NativeModules } from 'react-native';
 *   const { GestureModule } = NativeModules;
 *   GestureModule.tap(x, y);
 */
public class GestureModule extends ReactContextBaseJavaModule {

    public GestureModule(ReactApplicationContext ctx) {
        super(ctx);
    }

    @NonNull
    @Override
    public String getName() {
        return "GestureModule";
    }

    // ── Accessibility check ───────────────────────────────────────────────────

    @ReactMethod
    public void isAccessibilityEnabled(Callback callback) {
        boolean enabled = AirMouseAccessibilityService.isActive();
        if (!enabled) {
            // Double-check system setting
            String pkgName = getReactApplicationContext().getPackageName();
            String serviceName = pkgName + "/" + AirMouseAccessibilityService.class.getName();
            String enabledServices = Settings.Secure.getString(
                getReactApplicationContext().getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            enabled = enabledServices != null && enabledServices.contains(serviceName);
        }
        callback.invoke(enabled);
    }

    @ReactMethod
    public void openAccessibilitySettings() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
        }
    }

    // ── Gesture injection ─────────────────────────────────────────────────────

    @ReactMethod
    public void tap(float x, float y) {
        if (checkService()) AirMouseAccessibilityService.instance.performTap(x, y);
    }

    @ReactMethod
    public void longPress(float x, float y) {
        if (checkService()) AirMouseAccessibilityService.instance.performLongPress(x, y);
    }

    @ReactMethod
    public void doubleTap(float x, float y) {
        if (checkService()) AirMouseAccessibilityService.instance.performDoubleTap(x, y);
    }

    @ReactMethod
    public void swipe(float x1, float y1, float x2, float y2, int duration) {
        if (checkService()) AirMouseAccessibilityService.instance.performSwipe(x1, y1, x2, y2, duration);
    }

    @ReactMethod
    public void scrollUp() {
        if (checkService()) AirMouseAccessibilityService.instance.performScroll(true);
    }

    @ReactMethod
    public void scrollDown() {
        if (checkService()) AirMouseAccessibilityService.instance.performScroll(false);
    }

    @ReactMethod
    public void goBack() {
        if (checkService()) AirMouseAccessibilityService.instance.performBack();
    }

    @ReactMethod
    public void goHome() {
        if (checkService()) AirMouseAccessibilityService.instance.performHome();
    }

    @ReactMethod
    public void openRecents() {
        if (checkService()) AirMouseAccessibilityService.instance.performRecents();
    }

    @ReactMethod
    public void openNotifications() {
        if (checkService()) AirMouseAccessibilityService.instance.performNotifications();
    }

    @ReactMethod
    public void openQuickSettings() {
        if (checkService()) AirMouseAccessibilityService.instance.performQuickSettings();
    }

    @ReactMethod
    public void takeScreenshot() {
        if (checkService()) AirMouseAccessibilityService.instance.performScreenshot();
    }

    @ReactMethod
    public void startDrag(float x, float y) {
        if (checkService()) AirMouseAccessibilityService.instance.startDrag(x, y);
    }

    @ReactMethod
    public void continueDrag(float x, float y) {
        if (checkService()) AirMouseAccessibilityService.instance.continueDrag(x, y);
    }

    @ReactMethod
    public void endDrag(float x, float y) {
        if (checkService()) AirMouseAccessibilityService.instance.endDrag(x, y);
    }

    // ── High-level gesture dispatcher (called from JS with gesture name) ──────

    @ReactMethod
    public void dispatchGesture(String gestureName, ReadableMap params) {
        if (!checkService()) return;

        float x = params.hasKey("x") ? (float) params.getDouble("x") : 0;
        float y = params.hasKey("y") ? (float) params.getDouble("y") : 0;
        AirMouseAccessibilityService svc = AirMouseAccessibilityService.instance;

        switch (gestureName) {
            case "TAP":          svc.performTap(x, y); break;
            case "LONG_PRESS":   svc.performLongPress(x, y); break;
            case "DOUBLE_TAP":   svc.performDoubleTap(x, y); break;
            case "SCROLL_UP":    svc.performScroll(true); break;
            case "SCROLL_DOWN":  svc.performScroll(false); break;
            case "SWIPE_LEFT":   {
                android.util.DisplayMetrics dm = getReactApplicationContext().getResources().getDisplayMetrics();
                svc.performSwipe(dm.widthPixels * 0.8f, dm.heightPixels * 0.5f, dm.widthPixels * 0.2f, dm.heightPixels * 0.5f, 300);
                break;
            }
            case "SWIPE_RIGHT": {
                android.util.DisplayMetrics dm = getReactApplicationContext().getResources().getDisplayMetrics();
                svc.performSwipe(dm.widthPixels * 0.2f, dm.heightPixels * 0.5f, dm.widthPixels * 0.8f, dm.heightPixels * 0.5f, 300);
                break;
            }
            case "HOME":         svc.performHome(); break;
            case "BACK":         svc.performBack(); break;
            case "RECENTS":      svc.performRecents(); break;
            case "NOTIFICATIONS": svc.performNotifications(); break;
            case "QUICK_SETTINGS": svc.performQuickSettings(); break;
            case "SCREENSHOT":   svc.performScreenshot(); break;
        }
    }

    private boolean checkService() {
        return AirMouseAccessibilityService.instance != null;
    }
}
