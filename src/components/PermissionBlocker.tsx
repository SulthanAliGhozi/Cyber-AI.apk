import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Camera as CameraIcon, MapPin, Mic, Loader2 } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

interface PermissionBlockerProps {
  onGranted: () => void;
}

export const PermissionBlocker: React.FC<PermissionBlockerProps> = ({ onGranted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  const checkPermissions = async () => {
    // Check if user has ever passed this screen
    const hasPassedBefore = localStorage.getItem('hasPassedPermissionBlocker');
    
    // Enforce HTML5 checks even on web
    if (!Capacitor.isNativePlatform()) {
      if (!hasPassedBefore) {
        setIsInitialCheck(false);
        return;
      }
      
      try {
         const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
         const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
         
         if (geoStatus.state === 'granted' && camStatus.state === 'granted') {
           onGranted();
         } else {
           setIsInitialCheck(false);
         }
      } catch(err) {
         setIsInitialCheck(false);
      }
      return;
    }

    if (!hasPassedBefore) {
      setIsInitialCheck(false);
      return;
    }

    try {
      const geoStatus = await Geolocation.checkPermissions();
      const camStatus = await Camera.checkPermissions();
      
      // On some platforms, microphone is checked implicitly or we can just rely on camera & geo
      if (geoStatus.location === 'granted' && camStatus.camera === 'granted') {
        onGranted();
      } else {
        setIsInitialCheck(false);
      }
    } catch (e) {
      // Ignored for non-supported platforms, fallback to showing blocker
      setIsInitialCheck(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestAllPermissions = async () => {
    setLoading(true);
    setError('');
    try {
      let allGranted = true;

      if (Capacitor.isNativePlatform()) {
        const geoStatus = await Geolocation.requestPermissions();
        if (geoStatus.location !== 'granted') allGranted = false;

        const camStatus = await Camera.requestPermissions();
        if (camStatus.camera !== 'granted') allGranted = false;
      }

      // Also request via standard HTML5 as backup for Mic & generic WebView handling
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (mediaErr) {
        allGranted = false;
        console.warn("Camera/Mic permission denied via HTML5", mediaErr);
      }

      if (allGranted) {
        localStorage.setItem('hasPassedPermissionBlocker', 'true');
        toast.success("Semua perizinan berhasil diizinkan!");
        onGranted();
      } else {
        setError("Anda harus mengizinkan SEMUA akses (Lokasi, Kamera, Mikrofon) untuk menggunakan aplikasi ini.");
        toast.error("Perizinan ditolak.");
      }
    } catch (err: any) {
      setError(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isInitialCheck) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-center p-6 font-mono">
        <Loader2 className="w-12 h-12 text-[#a78bfa] animate-spin mb-4" />
        <p className="text-xs text-[#a78bfa] tracking-widest uppercase animate-pulse">Memverifikasi Keamanan Sistem...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-center p-6 font-mono text-center">
      <ShieldAlert className="w-20 h-20 text-red-500 mb-6 animate-pulse" />
      <h1 className="text-2xl font-bold font-sans tracking-widest text-red-500 uppercase mb-4">
        AKSES DITOLAK
      </h1>
      <p className="text-xs opacity-70 max-w-md mb-8 leading-relaxed">
        Sistem mendeteksi bahwa aplikasi ini belum memiliki izin akses yang diperlukan. Demi keamanan dan pemantauan aktivitas, Anda diwajibkan untuk mengizinkan akses ke perangkat Anda.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs mb-8 text-left">
        <div className="flex items-center gap-3 p-3 border border-neutral-800 rounded bg-neutral-900/50">
          <MapPin className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-bold uppercase">Akses Lokasi (GPS)</span>
        </div>
        <div className="flex items-center gap-3 p-3 border border-neutral-800 rounded bg-neutral-900/50">
          <CameraIcon className="w-5 h-5 text-green-400" />
          <span className="text-xs font-bold uppercase">Akses Kamera</span>
        </div>
        <div className="flex items-center gap-3 p-3 border border-neutral-800 rounded bg-neutral-900/50">
          <Mic className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-bold uppercase">Akses Mikrofon</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-950/40 border border-red-500/50 text-red-400 text-[10px] max-w-sm rounded">
          {error}
        </div>
      )}

      <button
        onClick={requestAllPermissions}
        disabled={loading}
        className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest text-sm rounded shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all flex items-center gap-2"
      >
        {loading ? (
          <span className="animate-pulse">MEMPROSES...</span>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            IZINKAN SEMUA AKSES
          </>
        )}
      </button>
    </div>
  );
};
