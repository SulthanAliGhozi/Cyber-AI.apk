import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Camera, MapPin, Mic, HardDrive } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

interface PermissionBlockerProps {
  onGranted: () => void;
}

export const PermissionBlocker: React.FC<PermissionBlockerProps> = ({ onGranted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      onGranted();
      return;
    }

    try {
      const geoStatus = await Geolocation.checkPermissions();
      if (geoStatus.location === 'granted') {
        onGranted();
      }
    } catch (e) {
      // Ignored for non-supported platforms
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

      // Request Location (Capacitor Geolocation)
      if (Capacitor.isNativePlatform()) {
        const geoStatus = await Geolocation.requestPermissions();
        if (geoStatus.location !== 'granted') {
          allGranted = false;
        }
      }

      // Request Camera & Mic (HTML5 triggers Android native prompt)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately
      } catch (mediaErr) {
        allGranted = false;
        console.warn("Camera/Mic permission denied or not available", mediaErr);
      }

      if (allGranted) {
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
          <Camera className="w-5 h-5 text-green-400" />
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
