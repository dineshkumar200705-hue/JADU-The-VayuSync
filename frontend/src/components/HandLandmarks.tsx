import { useEffect, useRef } from 'react';
import type { Landmark } from '@/types';

const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

const FINGERTIP_IDS = new Set([4, 8, 12, 16, 20]);

interface Props {
  landmarks: Landmark[];
  width: number;
  height: number;
  mirrored?: boolean;
}

export function HandLandmarks({ landmarks, width, height, mirrored = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    if (!landmarks.length) return;

    const px = (lm: Landmark) => ({
      x: mirrored ? (1 - lm.x) * width : lm.x * width,
      y: lm.y * height,
    });

    // Draw connections
    ctx.strokeStyle = 'rgba(0,229,255,0.7)';
    ctx.lineWidth = 2;
    for (const [a, b] of CONNECTIONS) {
      const pa = px(landmarks[a]);
      const pb = px(landmarks[b]);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    // Draw landmarks
    for (let i = 0; i < landmarks.length; i++) {
      const p = px(landmarks[i]);
      const isTip = FINGERTIP_IDS.has(i);
      const isIndex = i === 8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, isIndex ? 8 : isTip ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isIndex ? '#00ff88' : isTip ? '#ff4444' : 'rgba(255,255,255,0.6)';
      ctx.fill();

      if (isIndex) {
        ctx.strokeStyle = 'rgba(0,255,136,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, [landmarks, width, height, mirrored]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
