export interface CameraDevice {
  deviceId: string;
  label: string;
}

export async function getCameras(): Promise<CameraDevice[]> {
  try {
    // Ask for permission first
    await navigator.mediaDevices.getUserMedia({ video: true }).then(s => s.getTracks().forEach(t => t.stop()));
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(d => d.kind === 'videoinput')
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));
  } catch (_e) {
    return [];
  }
}

export async function startCamera(deviceId?: string): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: {
      deviceId: deviceId ? { ideal: deviceId } : undefined,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: deviceId ? undefined : 'user',
    },
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (_e) {
    // Fallback to any camera
    return navigator.mediaDevices.getUserMedia({ video: true });
  }
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach(t => t.stop());
}
