import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_SERVER = 'http://192.168.1.100:3001';

export function HomeScreen() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  useEffect(() => {
    AsyncStorage.getItem('serverUrl').then(v => { if (v) setServerUrl(v); });
  }, []);

  const saveAndTest = async () => {
    await AsyncStorage.setItem('serverUrl', serverUrl);
    setStatus('checking');
    try {
      const res = await fetch(`${serverUrl}/health`, { signal: AbortSignal.timeout(3000) });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const openMobilePage = () => {
    const url = serverUrl.replace(':3001', ':5173') + '/mobile';
    Linking.openURL(url);
  };

  const statusColor = { idle: '#6b7280', checking: '#f59e0b', ok: '#10b981', error: '#ef4444' }[status];
  const statusLabel = { idle: 'Not tested', checking: 'Checking…', ok: 'Connected ✓', error: 'Failed ✗' }[status];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🖐</Text>
        <Text style={styles.heroTitle}>AirMouse AI</Text>
        <Text style={styles.heroSubtitle}>Touchless Gesture Control</Text>
      </View>

      <Text style={styles.sectionTitle}>Backend Server</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://192.168.x.x:3001"
          placeholderTextColor="#4b5563"
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity style={styles.testBtn} onPress={saveAndTest}>
          <Text style={styles.testBtnText}>Test</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>

      <Text style={styles.sectionTitle}>Modes</Text>
      <View style={styles.modeCard}>
        <Text style={styles.modeTitle}>📡 Mode 1: Mobile → Laptop</Text>
        <Text style={styles.modeDesc}>Stream your phone camera to control the laptop mouse with gestures.</Text>
        <TouchableOpacity style={styles.openBtn} onPress={openMobilePage}>
          <Text style={styles.openBtnText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeCard}>
        <Text style={styles.modeTitle}>📱 Mode 2: Mobile Self-Control</Text>
        <Text style={styles.modeDesc}>Control your phone with hand gestures. Requires Accessibility Service enabled.</Text>
        <Text style={styles.modeNote}>→ Go to Control tab</Text>
      </View>

      <Text style={styles.sectionTitle}>Gesture Reference</Text>
      {[
        ['☝️', 'Move cursor'],
        ['👌', 'Left click (Thumb+Index)'],
        ['🤏', 'Right click (Thumb+Middle)'],
        ['✌️', 'Double click (Thumb+Ring)'],
        ['✊✊', 'Drag (two fingers hold)'],
        ['☝☝', 'Scroll (two fingers move)'],
        ['👈', 'Back (swipe left)'],
        ['👉', 'Forward (swipe right)'],
        ['🖐', 'Pause tracking'],
      ].map(([icon, desc]) => (
        <View key={desc} style={styles.gestureRow}>
          <Text style={styles.gestureIcon}>{icon}</Text>
          <Text style={styles.gestureDesc}>{desc}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 24 },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  heroSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 13, fontFamily: 'monospace' },
  testBtn: { backgroundColor: '#00e5ff', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  testBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  statusText: { fontSize: 12, marginTop: 6, marginLeft: 4 },
  modeCard: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, padding: 16, marginBottom: 12 },
  modeTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 6 },
  modeDesc: { fontSize: 13, color: '#9ca3af', lineHeight: 18 },
  modeNote: { fontSize: 12, color: '#00e5ff', marginTop: 8 },
  openBtn: { marginTop: 12, backgroundColor: '#7c3aed', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  openBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  gestureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#111827' },
  gestureIcon: { fontSize: 24, width: 40 },
  gestureDesc: { fontSize: 14, color: '#d1d5db', flex: 1 },
});
