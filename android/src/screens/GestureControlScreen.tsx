import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Platform, NativeModules } from 'react-native';

const { GestureModule } = NativeModules;

export function GestureControlScreen() {
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState('None');

  useEffect(() => {
    checkAccessibility();
    const interval = setInterval(checkAccessibility, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkAccessibility = () => {
    if (GestureModule?.isAccessibilityEnabled) {
      GestureModule.isAccessibilityEnabled((enabled: boolean) => {
        setAccessibilityEnabled(enabled);
      });
    }
  };

  const openAccessibilitySettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  const startGestureControl = async () => {
    if (!accessibilityEnabled) {
      return;
    }
    if (GestureModule?.startGestureControl) {
      GestureModule.startGestureControl((gesture: string) => {
        setCurrentGesture(gesture);
      });
    }
    setIsActive(true);
  };

  const stopGestureControl = () => {
    if (GestureModule?.stopGestureControl) {
      GestureModule.stopGestureControl();
    }
    setIsActive(false);
    setCurrentGesture('None');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 Mobile Self-Control</Text>
        <Text style={styles.subtitle}>Control your phone with hand gestures</Text>
      </View>

      {/* Accessibility status */}
      <View style={[styles.card, { borderColor: accessibilityEnabled ? '#10b981' : '#ef4444' }]}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>Accessibility Service</Text>
          <View style={[styles.badge, { backgroundColor: accessibilityEnabled ? '#10b981' : '#ef4444' }]}>
            <Text style={styles.badgeText}>{accessibilityEnabled ? 'Enabled' : 'Disabled'}</Text>
          </View>
        </View>
        {!accessibilityEnabled && (
          <>
            <Text style={styles.cardDesc}>
              AirMouse AI needs Accessibility Service permission to inject gestures and control your phone.
            </Text>
            <TouchableOpacity style={styles.settingsBtn} onPress={openAccessibilitySettings}>
              <Text style={styles.settingsBtnText}>Open Accessibility Settings</Text>
            </TouchableOpacity>
            <Text style={styles.settingsNote}>
              Settings → Accessibility → Installed Services → AirMouse AI → Enable
            </Text>
          </>
        )}
      </View>

      {/* Current gesture */}
      <View style={styles.gestureCard}>
        <Text style={styles.gestureLabel}>Current Gesture</Text>
        <Text style={styles.gestureName}>{currentGesture}</Text>
        <View style={[styles.activeDot, { backgroundColor: isActive ? '#10b981' : '#6b7280' }]} />
      </View>

      {/* Controls */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, styles.startBtn, (!accessibilityEnabled || isActive) && styles.btnDisabled]}
          onPress={startGestureControl}
          disabled={!accessibilityEnabled || isActive}
        >
          <Text style={styles.btnText}>▶ Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.stopBtn, !isActive && styles.btnDisabled]}
          onPress={stopGestureControl}
          disabled={!isActive}
        >
          <Text style={styles.btnText}>■ Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Gesture guide for mobile nav */}
      <Text style={styles.sectionTitle}>Mobile Gesture Map</Text>
      {[
        ['☝️', 'Move virtual cursor'],
        ['👌', 'Tap'],
        ['🤏', 'Long press'],
        ['✌️✌️', 'Double tap'],
        ['✊✊', 'Drag'],
        ['⬆️⬆️', 'Scroll up'],
        ['⬇️⬇️', 'Scroll down'],
        ['👈', 'Back'],
        ['👉', 'Forward / Next'],
        ['🖐', 'Home'],
        ['✊', 'Recent Apps'],
        ['✌️', 'Notifications'],
        ['🤟', 'Quick Settings'],
        ['🤙', 'Screenshot'],
      ].map(([icon, action]) => (
        <View key={action} style={styles.row}>
          <Text style={styles.rowIcon}>{icon}</Text>
          <Text style={styles.rowText}>{action}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#111827', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#9ca3af', lineHeight: 18, marginBottom: 12 },
  settingsBtn: { backgroundColor: '#7c3aed', borderRadius: 10, padding: 12, alignItems: 'center' },
  settingsBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  settingsNote: { fontSize: 11, color: '#6b7280', marginTop: 8, lineHeight: 16 },
  gestureCard: { backgroundColor: '#111827', borderRadius: 14, padding: 20, marginBottom: 16, alignItems: 'center' },
  gestureLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  gestureName: { fontSize: 28, fontWeight: 'bold', color: '#00e5ff' },
  activeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  startBtn: { backgroundColor: '#10b981' },
  stopBtn: { backgroundColor: '#ef4444' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111827' },
  rowIcon: { fontSize: 22, width: 40 },
  rowText: { fontSize: 14, color: '#d1d5db', flex: 1 },
});
