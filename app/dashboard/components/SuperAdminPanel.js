'use client';
import { useState } from 'react';
import { X, Building2, Plus, Users, QrCode, Download, Printer, ChevronRight, Check, AlertTriangle, Loader2, Send, Radio, MessageSquare, Globe, Target, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateBulkStudentQRs, generatePrintableIDSheet, downloadBlob } from '../../../utils/qrGenerator';

export default function SuperAdminPanel({
  onClose,
  allSchools = [],
  currentSchoolId,
  onCreateSchool,
  onSwitchSchool,
  onSendGlobalBroadcast,
  onSendTargetedBroadcast,
  onSendDirectMessage,
  onGlobalLockdown,
  allStudents = [],
  displaySchoolName,
  theme,
}) {
  const [activeTab, setActiveTab] = useState('schools');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [qrProgress, setQrProgress] = useState(0);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrType, setQrType] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('global');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [broadcastPriority, setBroadcastPriority] = useState('normal');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [showGlobalLockdownConfirm, setShowGlobalLockdownConfirm] = useState(false);

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) return;
    setIsCreating(true);
    setCreateSuccess(null);
    try {
      await onCreateSchool?.(newSchoolName.trim());
      setCreateSuccess({ type: 'success', message: `School "${newSchoolName}" created!` });
      setNewSchoolName('');
    } catch (err) {
      setCreateSuccess({ type: 'error', message: err.message || 'Failed' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsSending(true);
    setSendSuccess(null);
    try {
      if (broadcastType === 'global') {
        await onSendGlobalBroadcast?.(broadcastMessage, broadcastPriority);
        setSendSuccess({ type: 'success', message: 'Global broadcast sent!' });
      } else if (broadcastType === 'targeted' && selectedSchools.length > 0) {
        await onSendTargetedBroadcast?.(broadcastMessage, broadcastPriority, selectedSchools);
        setSendSuccess({ type: 'success', message: `Sent to ${selectedSchools.length} school(s)` });
      }
      setBroadcastMessage('');
      setSelectedSchools([]);
    } catch (err) {
      setSendSuccess({ type: 'error', message: 'Failed to send' });
    } finally {
      setIsSending(false);
    }
  };

  const handleGlobalLockdown = async () => {
    await onGlobalLockdown?.();
    setShowGlobalLockdownConfirm(false);
  };

  const handleDownloadQRZip = async () => {
    if (allStudents.length === 0) return;
    setIsGeneratingQR(true);
    setQrType('zip');
    try {
      const blob = await generateBulkStudentQRs(allStudents, currentSchoolId, setQrProgress);
      downloadBlob(blob, `${displaySchoolName?.replace(/\W/g, '_') || 'school'}_QRs.zip`);
    } finally {
      setIsGeneratingQR(false);
      setQrType(null);
    }
  };

  const handlePrintIDCards = async () => {
    if (allStudents.length === 0) return;
    setIsGeneratingQR(true);
    setQrType('print');
    try {
      const html = await generatePrintableIDSheet(allStudents, currentSchoolId, displaySchoolName || 'School', setQrProgress);
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
    } finally {
      setIsGeneratingQR(false);
      setQrType(null);
    }
  };

  const tabs = [
    { id: 'schools', label: 'Schools', icon: Building2 },
    { id: 'broadcast', label: 'Broadcast', icon: Radio },
    { id: 'safety', label: 'Global Safety', icon: Shield },
    { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Building2 className="text-amber-400" /> Super Admin Panel
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose}
            className="p-2 bg-red-500/20 text-red-400 rounded-lg"><X size={20} /></motion.button>
        </div>

        <div className="flex border-b border-white/10 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 flex items-center gap-2 text-sm font-bold whitespace-nowrap ${
                activeTab === tab.id ? 'text-amber-400 border-b-2 border-amber-400' : 'text-muted-foreground'
              }`}>
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'schools' && (
            <div className="space-y-6">
              <div className="p-6 bg-accent/50 border border-border rounded-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18} className="text-amber-400" />Create School</h3>
                <div className="flex gap-3">
                  <input type="text" value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="School name..." className="flex-1 px-4 py-3 bg-background border border-border rounded-xl"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSchool()} />
                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleCreateSchool} disabled={!newSchoolName.trim() || isCreating}
                    className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl disabled:opacity-50 flex items-center gap-2">
                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}Create
                  </motion.button>
                </div>
                {createSuccess && (
                  <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${createSuccess.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {createSuccess.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}{createSuccess.message}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold mb-4">All Schools ({allSchools.length})</h3>
                <div className="space-y-2">
                  {allSchools.map(school => (
                    <motion.button key={school.id} whileHover={{ scale: 1.01 }} onClick={() => onSwitchSchool?.(school.id)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between ${
                        school.id === currentSchoolId ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-accent/30 border-border'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${school.id === currentSchoolId ? 'bg-amber-500/20' : 'bg-primary/20'}`}>
                          {school.name?.charAt(0) || '?'}
                        </div>
                        <div><div className="font-bold">{school.name}</div><div className="text-xs text-muted-foreground">ID: {school.id}</div></div>
                      </div>
                      {school.id === currentSchoolId && <span className="px-2 py-1 bg-amber-500/20 text-xs font-bold rounded">ACTIVE</span>}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {[{ t: 'global', i: Globe, l: 'Global', c: 'amber' }, { t: 'targeted', i: Target, l: 'Targeted', c: 'blue' }, { t: 'direct', i: MessageSquare, l: 'Direct', c: 'purple' }].map(({ t, i: I, l, c }) => (
                  <motion.button key={t} whileTap={{ scale: 0.98 }} onClick={() => setBroadcastType(t)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${broadcastType === t ? `bg-${c}-500/20 border-${c}-500 text-${c}-400` : 'border-border'}`}>
                    <I size={24} /><span className="text-sm font-bold">{l}</span>
                  </motion.button>
                ))}
              </div>
              {broadcastType === 'targeted' && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-accent/30 rounded-xl max-h-32 overflow-y-auto">
                  {allSchools.map(s => (
                    <button key={s.id} onClick={() => setSelectedSchools(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])}
                      className={`p-2 rounded-lg text-sm text-left flex items-center gap-2 ${selectedSchools.includes(s.id) ? 'bg-blue-500/20 text-blue-400' : 'bg-accent/50'}`}>
                      <div className={`w-4 h-4 rounded border ${selectedSchools.includes(s.id) ? 'bg-blue-500' : 'border-border'}`}>
                        {selectedSchools.includes(s.id) && <Check size={12} className="text-white" />}
                      </div>{s.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {['normal', 'important', 'urgent'].map(p => (
                  <button key={p} onClick={() => setBroadcastPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border capitalize ${broadcastPriority === p ? (p === 'urgent' ? 'bg-red-500/20 border-red-500 text-red-400' : p === 'important' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-blue-500/20 border-blue-500 text-blue-400') : 'border-border'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value.slice(0, 500))}
                placeholder="Message..." className="w-full h-32 p-3 bg-accent/50 border border-border rounded-xl resize-none" />
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleSendBroadcast} disabled={!broadcastMessage.trim() || isSending}
                className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}Send
              </motion.button>
              {sendSuccess && <div className={`p-3 rounded-lg ${sendSuccess.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{sendSuccess.message}</div>}
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-6">
              <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-center">
                <div className="text-6xl mb-4">🚨</div>
                <h3 className="text-2xl font-black text-red-400 mb-2">GLOBAL LOCKDOWN</h3>
                <p className="text-sm text-muted-foreground mb-6">Lock ALL {allSchools.length} schools simultaneously</p>
                {!showGlobalLockdownConfirm ? (
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowGlobalLockdownConfirm(true)}
                    className="px-8 py-4 bg-red-500 text-white font-black rounded-xl text-lg">INITIATE GLOBAL LOCKDOWN</motion.button>
                ) : (
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => setShowGlobalLockdownConfirm(false)} className="px-6 py-3 bg-accent border border-border rounded-xl font-bold">Cancel</button>
                    <button onClick={handleGlobalLockdown} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl">CONFIRM</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'qrcodes' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
                <strong>School:</strong> {displaySchoolName} | <strong>Students:</strong> {allStudents.length}
              </div>
              {allStudents.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-accent/50 border border-border rounded-xl">
                    <Download size={32} className="text-blue-400 mb-3" />
                    <h3 className="font-bold">Download QRs</h3>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleDownloadQRZip} disabled={isGeneratingQR}
                      className="w-full mt-3 py-3 bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50">
                      {isGeneratingQR && qrType === 'zip' ? `${qrProgress}%` : 'Download ZIP'}
                    </motion.button>
                  </div>
                  <div className="p-6 bg-accent/50 border border-border rounded-xl">
                    <Printer size={32} className="text-purple-400 mb-3" />
                    <h3 className="font-bold">Print IDs</h3>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handlePrintIDCards} disabled={isGeneratingQR}
                      className="w-full mt-3 py-3 bg-purple-500 text-white font-bold rounded-xl disabled:opacity-50">
                      {isGeneratingQR && qrType === 'print' ? `${qrProgress}%` : 'Print View'}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
