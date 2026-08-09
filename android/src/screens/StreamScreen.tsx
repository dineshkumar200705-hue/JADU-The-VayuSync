import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gesture types the backend understands
type GestureType = 'MOVE' | 'LEFT_CLICK' | 'RIGHT_CLICK' | 'DOUBLE_CLICK' | 'SCROLL_UP' | 'SCROLL_DOWN' | 'PAUSE' | 'NONE';

export function StreamScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connected, setConnected] = useState(false);
  const [fps, setFps] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const fpsRef = useRef({ n: 0, t: Date.now() });

  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'front') ?? devices[0];

  useEffect(() => {
    Camera.requestCameraPermission().then(p => setHasPermission(p === 'granted'));
  }, []);

  const connectSocket = async () => {
    const url = (await AsyncStorage.getItem('serverUrl')) || 'http://192.168.1.100:3001';
    const socket = io(url, { query: { role: 'mobile' }, transports: ['websocket'] });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socketRef.current = socket;
    return socket;
  };

  const startStream = async () => {
    await connectSocket();
    setIsStreaming(true);
    Alert.alert('Streaming', 'Your camera is now streaming to the laptop. Make gestures in front of the camera.');
  };

  const stopStream = () => {
    setIsStreaming(false);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.btn} onPress={() => Camera.requestCameraPermission()}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return <View style={styles.center}><Text style={styles.text}>No camera found</Text></View>;
  }

  return (
    <View style={styles.container}>
      {isStreaming && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isStreaming}
          video={false}
          photo={false}
        />
      )}

      <View style={styles.overlay}>
        <View style={styles.statusBar}>
          <View style={[styles.dot, { backgroundColor: connected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{connected ? 'Connected to laptop' : 'Not connected'}</Text>
          {isStreaming && <Text style={styles.fpsText}>{fps} fps</Text>}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📡 Mobile → Laptop Mode</Text>
          <Text style={styles.infoDesc}>
            Your phone camera streams to the laptop.{'\n'}
            The laptop processes gestures and moves its mouse.
          </Text>
          <Text style={styles.infoNote}>
            Make sure to open the AirMouse frontend on your laptop first (http://localhost:5173) and select "Mobile→Laptop" mode.
          </Text>
        </View>

        <View style={styles.btnRow}>
          {!isStreaming ? (
            <TouchableOpacity style={[styles.btn, styles.startBtn]} onPress={startStream}>
              <Text style={styles.btnText}>▶ Start Streaming</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.stopBtn]} onPress={stopStream}>
              <Text style={styles.btnText}>■ Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#030712', gap: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16 },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 13 },
  fpsText: { color: '#00e5ff', fontSize: 13, marginLeft: 8 },
  infoBox: { backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 16, padding: 16, marginBottom: 16 },
  infoTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoDesc: { color: '#d1d5db', fontSize: 13, lineHeight: 20 },
  infoNote: { color: '#00e5ff', fontSize: 12, marginTop: 8, lineHeight: 18 },
  btnRow: { paddingBottom: Platform.OS === 'android' ? 16 : 0 },
  btn: { backgroundColor: '#6366f1', borderRadius: 14, padding: 16, alignItems: 'center' },
  startBtn: { backgroundColor: '#10b981' },
  stopBtn: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  text: { color: '#9ca3af', fontSize: 16 },
});
