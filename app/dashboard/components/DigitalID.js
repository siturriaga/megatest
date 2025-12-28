'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Download, Share2, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function DigitalID({ student, schoolName, onClose }) {
  const [timestamp, setTimestamp] = useState(Date.now());
  const cardRef = useRef(null);

  // Refresh timestamp periodically for security
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (!student) return null;

  // QR Data payload - matches expected format: Name|ID|Grade
  const qrData = `${student.full_name}|${student.student_id_number}|${student.grade_level}`;
  
  // JSON payload for advanced scanning
  const jsonPayload = JSON.stringify({
    id: student.id,
    sid: student.student_id_number,
    name: student.full_name,
    grade: student.grade_level,
    ts: timestamp
  });

  const handleDownload = () => {
    // Create a canvas from the card and download
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 600;
    
    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 400, 600);
    
    // Draw gradient header
    const gradient = ctx.createLinearGradient(0, 0, 400, 100);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 100);
    
    // Draw text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(student.full_name, 200, 150);
    
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`ID: ${student.student_id_number}`, 200, 180);
    ctx.fillText(`Grade ${student.grade_level}`, 200, 205);
    ctx.fillText(schoolName || 'STRIDE', 200, 230);
    
    // Get QR code as data URL and draw it
    const qrSvg = document.querySelector('#digital-id-qr svg');
    if (qrSvg) {
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 100, 260, 200, 200);
        
        // Download
        const link = document.createElement('a');
        link.download = `${student.full_name.replace(/\s+/g, '_')}_ID.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${student.full_name} - Digital ID`,
          text: `STRIDE Digital ID for ${student.full_name}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  const handleRefresh = () => {
    setTimestamp(Date.now());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Holographic Card */}
        <div 
          ref={cardRef}
          className="relative w-[320px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl"
          style={{
            boxShadow: '0 0 60px rgba(59, 130, 246, 0.3), 0 0 100px rgba(139, 92, 246, 0.2)'
          }}
        >
          {/* Holographic shimmer overlay */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          />

          {/* Corner brackets (scanning guide) */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-blue-400/50" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-blue-400/50" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-blue-400/50" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-blue-400/50" />

          {/* Header gradient */}
          <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
            <div className="text-center">
              <div className="text-white/80 text-xs font-medium tracking-widest">STRIDE</div>
              <div className="text-white font-black text-lg tracking-tight">DIGITAL ID</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Avatar */}
            <div className="w-20 h-20 mx-auto -mt-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white border-4 border-slate-900 shadow-xl">
              {student.full_name?.charAt(0) || '?'}
            </div>

            {/* Name */}
            <h2 className="mt-4 text-xl font-black text-white">{student.full_name}</h2>
            
            {/* Details */}
            <div className="mt-2 space-y-1 text-slate-400 text-sm">
              <p>ID: <span className="text-white font-mono">{student.student_id_number}</span></p>
              <p>Grade: <span className="text-white">{student.grade_level}</span></p>
              {schoolName && <p className="text-xs">{schoolName}</p>}
            </div>

            {/* QR Code */}
            <div id="digital-id-qr" className="mt-6 p-4 bg-white rounded-2xl inline-block">
              <QRCodeSVG 
                value={qrData}
                size={160}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>

            {/* Status indicator */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">VALID</span>
            </div>

            {/* Timestamp */}
            <div className="mt-2 text-[10px] text-slate-500 font-mono">
              Generated: {new Date(timestamp).toLocaleString()}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-700/50 flex justify-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
            {navigator.share && (
              <button
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Share"
              >
                <Share2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <p className="mt-4 text-center text-white/50 text-xs max-w-[320px]">
          Scan this QR code with a hall monitor device to verify student status
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%) rotate(45deg); }
          50% { transform: translateX(100%) rotate(45deg); }
        }
      `}</style>
    </div>
  );
}
