'use client';
import { useState, useRef, useEffect } from 'react';
import { QrCode, Download, Printer, Copy, Check, User, Building, Mail, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

/**
 * HallPassQRSetup Component
 * 
 * Admin/SuperAdmin QR code generator for teacher classroom passes.
 * Creates QR codes containing teacher info that students scan to get passes.
 * 
 * Props:
 * - userData: object - Current user data (auto-fills for admins)
 * - employeeId: string - Current employee ID
 * - schoolId: string - School code from SuperAdmin
 * - allTeachers: array - For SuperAdmin to select any teacher
 * - onSave: (qrData) => Promise - Save QR config
 * - isSuperAdmin: boolean - Show all teachers dropdown
 */
export default function HallPassQRSetup({
  userData,
  employeeId,
  schoolId,
  allTeachers = [],
  onSave,
  isSuperAdmin = false,
}) {
  // Form state
  const [teacherName, setTeacherName] = useState(userData?.name || '');
  const [teacherId, setTeacherId] = useState(employeeId || '');
  const [teacherEmail, setTeacherEmail] = useState(userData?.email || '');
  const [roomNumber, setRoomNumber] = useState('');
  const [includeRoom, setIncludeRoom] = useState(true);
  
  // SuperAdmin: selected teacher
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  // QR state
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const canvasRef = useRef(null);
  const downloadLinkRef = useRef(null);

  // Auto-fill from selected teacher (SuperAdmin)
  useEffect(() => {
    if (isSuperAdmin && selectedTeacherId) {
      const teacher = allTeachers.find(t => t.id === selectedTeacherId || t.email === selectedTeacherId);
      if (teacher) {
        setTeacherName(teacher.name || teacher.full_name || '');
        setTeacherId(teacher.employeeId || teacher.id || '');
        setTeacherEmail(teacher.email || '');
        setRoomNumber(teacher.room || teacher.roomNumber || '');
      }
    }
  }, [selectedTeacherId, allTeachers, isSuperAdmin]);

  // Generate QR code
  const generateQR = async () => {
    if (!teacherName) return;
    
    setIsGenerating(true);
    
    try {
      // QR data structure
      const qrData = {
        type: 'TEACHER_ROOM',
        version: '1.0',
        schoolId: schoolId,
        teacher: {
          name: teacherName,
          id: teacherId,
          email: teacherEmail,
        },
        room: includeRoom ? roomNumber : null,
        createdAt: new Date().toISOString(),
      };
      
      // Simple URL format for scanning
      const roomParam = includeRoom && roomNumber ? `/${encodeURIComponent(roomNumber)}` : '';
      const qrString = `stride://teacher/${schoolId}/${encodeURIComponent(teacherId)}${roomParam}`;
      
      setQrValue(qrString);
      
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      
      setQrDataUrl(dataUrl);
      
      // Save config
      await onSave?.({
        ...qrData,
        qrValue: qrString,
      });
      
    } catch (err) {
      console.error('QR generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download QR as PNG
  const downloadQR = async () => {
    if (!qrDataUrl) return;
    
    try {
      // Create canvas with QR + text
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const qrSize = 400;
      const padding = 40;
      const textHeight = 100;
      
      canvas.width = qrSize + (padding * 2);
      canvas.height = qrSize + (padding * 2) + textHeight;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Load and draw QR
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);
        
        // Add text
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        
        // Teacher name
        ctx.font = 'bold 24px Arial';
        ctx.fillText(teacherName, canvas.width / 2, qrSize + padding + 30);
        
        // Room number
        if (includeRoom && roomNumber) {
          ctx.font = '20px Arial';
          ctx.fillText(`Room: ${roomNumber}`, canvas.width / 2, qrSize + padding + 60);
        }
        
        // School
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(schoolId, canvas.width / 2, qrSize + padding + 85);
        
        // Trigger download
        const link = downloadLinkRef.current;
        link.href = canvas.toDataURL('image/png');
        link.download = `QR-${teacherName.replace(/\s+/g, '-')}-${roomNumber || 'pass'}.png`;
        link.click();
      };
      qrImg.src = qrDataUrl;
      
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Print QR
  const printQR = () => {
    if (!qrDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hall Pass QR - ${teacherName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #000;
              display: inline-block;
              padding: 30px;
              border-radius: 12px;
            }
            img { max-width: 300px; }
            h2 { margin: 20px 0 5px 0; font-size: 28px; }
            .room { font-size: 20px; color: #333; margin: 5px 0; }
            .school { font-size: 14px; color: #666; margin-top: 15px; }
            .instructions { 
              margin-top: 20px; 
              padding: 15px; 
              background: #f5f5f5; 
              border-radius: 8px;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
              .qr-container { border-width: 1px; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR Code" />
            <h2>${teacherName}</h2>
            ${includeRoom && roomNumber ? `<div class="room">Room: ${roomNumber}</div>` : ''}
            <div class="school">${schoolId}</div>
            <div class="instructions">
              Scan this QR code to get a hall pass to this classroom
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copy QR data to clipboard
  const copyQRData = async () => {
    if (!qrValue) return;
    
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <QrCode className="text-primary" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold">Classroom Pass QR Code</h3>
          <p className="text-sm text-muted-foreground">
            Create QR code for students to scan for hall passes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* SuperAdmin: Teacher Selector */}
          {isSuperAdmin && allTeachers.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Select Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full p-3 bg-accent border border-border rounded-xl"
              >
                <option value="">-- Select a teacher --</option>
                {allTeachers.map(teacher => (
                  <option key={teacher.id || teacher.email} value={teacher.id || teacher.email}>
                    {teacher.name || teacher.full_name} {teacher.room ? `(${teacher.room})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Teacher Name */}
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-2">
              <User size={14} />
              Teacher Name *
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g., Ms. Johnson"
              className="w-full p-3 bg-accent border border-border rounded-xl"
            />
          </div>

          {/* Employee ID */}
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-2">
              <Mail size={14} />
              Employee ID
            </label>
            <input
              type="text"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              placeholder="e.g., T12345"
              className="w-full p-3 bg-accent border border-border rounded-xl"
            />
          </div>

          {/* Room Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building size={14} />
                Room Number
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeRoom}
                  onChange={(e) => setIncludeRoom(e.target.checked)}
                  className="rounded"
                />
                Include on QR
              </label>
            </div>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g., 204, Gym, Lab 3"
              className="w-full p-3 bg-accent border border-border rounded-xl"
              disabled={!includeRoom}
            />
          </div>

          {/* School ID (read-only) */}
          <div>
            <label className="text-sm font-medium mb-1 block text-muted-foreground">
              School ID
            </label>
            <input
              type="text"
              value={schoolId || 'Not set'}
              readOnly
              className="w-full p-3 bg-accent/50 border border-border rounded-xl text-muted-foreground"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateQR}
            disabled={!teacherName || isGenerating}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Generating...
              </>
            ) : (
              <>
                <QrCode size={18} />
                {qrDataUrl ? 'Regenerate QR Code' : 'Generate QR Code'}
              </>
            )}
          </button>
        </div>

        {/* QR Preview */}
        <div className="bg-accent/50 border border-border rounded-2xl p-6 text-center">
          <AnimatePresence mode="wait">
            {qrDataUrl ? (
              <motion.div
                key="qr"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                
                <div>
                  <h4 className="font-bold text-lg">{teacherName}</h4>
                  {includeRoom && roomNumber && (
                    <p className="text-muted-foreground">Room: {roomNumber}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={downloadQR}
                    className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-500/30"
                  >
                    <Download size={16} /> Download PNG
                  </button>
                  <button
                    onClick={printQR}
                    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-500/30"
                  >
                    <Printer size={16} /> Print
                  </button>
                  <button
                    onClick={copyQRData}
                    className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-500/30"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Data'}
                  </button>
                </div>

                <div className="text-xs text-muted-foreground p-3 bg-card rounded-lg">
                  <code className="break-all">{qrValue}</code>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12"
              >
                <div className="w-48 h-48 mx-auto bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center mb-4">
                  <QrCode size={48} className="text-white/20" />
                </div>
                <p className="text-muted-foreground">
                  Fill in teacher details and click "Generate QR Code"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hidden elements for download */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Instructions */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-300">
        <p className="font-bold mb-2">How it works:</p>
        <ul className="space-y-1 text-blue-300/80">
          <li>1. Print and display the QR code in your classroom</li>
          <li>2. Students scan the QR with their phone or school device</li>
          <li>3. STRIDE automatically creates a hall pass to your room</li>
          <li>4. Pass shows in your dashboard and the student's record</li>
        </ul>
      </div>
    </div>
  );
}
