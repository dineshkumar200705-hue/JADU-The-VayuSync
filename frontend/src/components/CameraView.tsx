import { useRef, useEffect, forwardRef } from 'react';
import { HandLandmarks } from './HandLandmarks';
import type { Landmark } from '@/types';

interface Props {
  stream: MediaStream | null;
  landmarks: Landmark[];
  mirrored?: boolean;
  className?: string;
}

export const CameraView = forwardRef<HTMLVideoElement, Props>(
  ({ stream, landmarks, mirrored = true, className = '' }, ref) => {
    const internalRef = useRef<HTMLVideoElement>(null);
    const videoEl = (ref as React.RefObject<HTMLVideoElement>) ?? internalRef;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const video = videoEl.current;
      if (!video) return;
      if (stream) {
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play().catch(() => {});
      } else {
        video.srcObject = null;
      }
    }, [stream, videoEl]);

    const w = containerRef.current?.clientWidth ?? 640;
    const h = containerRef.current?.clientHeight ?? 480;

    return (
      <div ref={containerRef} className={`relative overflow-hidden rounded-xl bg-gray-900 ${className}`}>
        {stream ? (
          <>
            <video
              ref={videoEl}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
            />
            {landmarks.length > 0 && (
              <HandLandmarks
                landmarks={landmarks}
                width={w}
                height={h}
                mirrored={false} // already mirrored by CSS
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <div className="w-16 h-16 rounded-full border-2 border-gray-600 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm">Camera not active</p>
          </div>
        )}
      </div>
    );
  }
);

CameraView.displayName = 'CameraView';
