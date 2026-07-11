import React, { useRef, useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  onError?: () => void;
  facingMode: 'user' | 'environment';
  title: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, onError, facingMode: initialFacingMode, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
      if (onError) {
        // Give a moment for the error to be logged/seen if needed, or immediately trigger fallback
        // The user wants "langsung ... jika gagal ... diarahkan"
        // So we call onError immediately or after a short timeout?
        // Let's call it immediately so the parent can decide.
        onError();
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentFacingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        // For front camera ('user'), we might want to mirror the image horizontally if it feels more natural,
        // but usually for ID verification raw is better. Let's keep it raw for now.
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to file
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `capture_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            onCapture(file);
            onClose(); // Close automatically after capture
          }
          setIsCapturing(false);
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const toggleCamera = () => {
    setCurrentFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video Viewport */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {error ? (
          <div className="text-white text-center p-4">
            <p className="mb-4">{error}</p>
            <button onClick={startCamera} className="bg-emerald-600 px-4 py-2 rounded-lg">Coba Lagi</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`max-w-full max-h-full object-contain ${currentFacingMode === 'user' ? 'scale-x-[-1]' : ''}`} // Mirror preview for user facing
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-around items-center bg-gradient-to-t from-black/80 to-transparent">
        
        {/* Switch Camera */}
        <button 
          onClick={toggleCamera} 
          className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 backdrop-blur-sm"
        >
          <RefreshCw className="w-6 h-6" />
        </button>

        {/* Capture Button */}
        <button 
          onClick={handleCapture} 
          disabled={!!error || isCapturing}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:scale-105 transition active:scale-95"
        >
          <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10"></div>
        </button>

        {/* Placeholder for balance */}
        <div className="w-12"></div> 
      </div>
    </div>
  );
};
