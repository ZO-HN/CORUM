import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QrScannerModalProps {
  title: string;
  instructions: string;
  onDetect: (value: string) => void;
  onClose: () => void;
}

// Camera-based QR scanner: grabs video frames onto a hidden canvas and decodes them with jsQR.
// Used both by the desktop Attendance Logger (scanning a resident's personal QR) and the web
// youth portal (scanning a program's QR poster to self check-in).
export const QrScannerModal: React.FC<QrScannerModalProps> = ({ title, instructions, onDetect, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectedRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err) {
        console.error('Camera access failed:', err);
        setError('Camera access denied or unavailable. Check your browser/OS camera permissions.');
      }
    };

    const tick = () => {
      if (detectedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            detectedRef.current = true;
            onDetect(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onDetect]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-container-low border border-[#353535]/20 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-black text-lg text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-xl leading-none px-1"
            aria-label="Close scanner"
          >
            &times;
          </button>
        </div>

        <p className="text-xs text-on-surface-variant">{instructions}</p>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl p-4">
            {error}
          </div>
        ) : (
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border border-outline-variant/10">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-6 border-2 border-primary/60 rounded-lg pointer-events-none" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <button
          onClick={onClose}
          className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-[#353535]/15 text-on-surface text-xs font-bold py-3 rounded-xl transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
