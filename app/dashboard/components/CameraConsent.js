'use client';
import { useState, useEffect } from 'react';
import { Camera, Shield, X, Check } from 'lucide-react';

export default function CameraConsent({ onGranted, onDenied, onClose }) {
  const [status, setStatus] = useState('pending'); // pending, requesting, granted, denied
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if permission was already granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' }).then(result => {
        if (result.state === 'granted') {
          setStatus('granted');
          onGranted?.();
        } else if (result.state === 'denied') {
          setStatus('denied');
        }
        
        // Listen for changes
        result.onchange = () => {
          if (result.state === 'granted') {
            setStatus('granted');
            onGranted?.();
          } else if (result.state === 'denied') {
            setStatus('denied');
          }
        };
      }).catch(() => {
        // permissions API not supported, proceed with request
      });
    }
  }, [onGranted]);

  const requestPermission = async () => {
    setStatus('requesting');
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Immediately stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setStatus('granted');
      onGranted?.();
    } catch (err) {
      console.error('Camera permission error:', err);
      setStatus('denied');
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access was denied. Please enable it in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application.');
      } else {
        setError('Unable to access camera. Please try again.');
      }
      
      onDenied?.();
    }
  };

  if (status === 'granted') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-8 max-w-sm text-center animate-squish-land">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-foreground">Camera Ready!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            You can now scan student QR codes
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full py-3 bg-emerald-500 text-white font-bold rounded-xl"
          >
            Start Scanning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera size={40} className="text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground">Camera Access Needed</h2>
          <p className="text-muted-foreground text-sm mt-2">
            STRIDE needs camera access to scan student QR codes for quick pass verification.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-accent/50 border border-border rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-sm">Privacy First</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your camera feed is processed locally and never recorded or sent to any server. 
                STRIDE only reads QR code data.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              You may need to go to browser settings to enable camera permissions for this site.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={requestPermission}
            disabled={status === 'requesting'}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === 'requesting' ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Requesting Access...
              </>
            ) : (
              <>
                <Camera size={20} />
                Allow Camera Access
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 bg-accent border border-border text-foreground font-medium rounded-xl"
          >
            Maybe Later
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          You can change this permission anytime in your browser settings
        </p>
      </div>
    </div>
  );
}
