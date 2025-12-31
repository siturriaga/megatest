'use client';
import { useState } from 'react';
import { Building2, Plus, Users, QrCode, Download, Printer, ChevronRight, Check, AlertTriangle, Loader2, Send, Radio, MessageSquare, Globe, Target, Shield } from 'lucide-react';
import { generateBulkStudentQRs, generatePrintableIDSheet, downloadBlob } from '../../../utils/qrGenerator';

export default function SuperAdminPanel({
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
  // Tab state
  const [activeTab, setActiveTab] = useState('schools');
  
  // School creation state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);
  
  // QR generation state
  const [qrProgress, setQrProgress] = useState(0);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrType, setQrType] = useState(null);
  
  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('global');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [broadcastPriority, setBroadcastPriority] = useState('normal');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(null);
  
  // Safety state
  const [showGlobalLockdownConfirm, setShowGlobalLockdownConfirm] = useState(false);

  // =====================
  // HANDLERS
  // =====================
  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) return;
    setIsCreating(true);
    setCreateSuccess(null);
    try {
      await onCreateSchool?.(newSchoolName.trim());
      setCreateSuccess({ type: 'success', message: `School "${newSchoolName}" created!` });
      setNewSchoolName('');
    } catch (err) {
      setCreateSuccess({ type: 'error', message: err.message || 'Failed to create school' });
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
        setSendSuccess({ type: 'success', message: 'Global broadcast sent to all schools!' });
      } else if (broadcastType === 'targeted' && selectedSchools.length > 0) {
        await onSendTargetedBroadcast?.(broadcastMessage, broadcastPriority, selectedSchools);
        setSendSuccess({ type: 'success', message: `Sent to ${selectedSchools.length} school(s)` });
      } else if (broadcastType === 'direct') {
        await onSendDirectMessage?.(broadcastMessage, broadcastPriority);
        setSendSuccess({ type: 'success', message: 'Direct message sent!' });
      }
      setBroadcastMessage('');
      setSelectedSchools([]);
    } catch (err) {
      setSendSuccess({ type: 'error', message: err.message || 'Failed to send broadcast' });
    } finally {
      setIsSending(false);
    }
  };

  const handleGlobalLockdown = async () => {
    try {
      await onGlobalLockdown?.();
      setShowGlobalLockdownConfirm(false);
    } catch (err) {
      console.error('Global lockdown failed:', err);
    }
  };

  const handleDownloadQRZip = async () => {
    if (allStudents.length === 0) return;
    setIsGeneratingQR(true);
    setQrType('zip');
    setQrProgress(0);
    try {
      const blob = await generateBulkStudentQRs(allStudents, currentSchoolId, setQrProgress);
      downloadBlob(blob, `${displaySchoolName?.replace(/\W/g, '_') || 'school'}_QRs.zip`);
    } catch (err) {
      console.error('QR generation failed:', err);
    } finally {
      setIsGeneratingQR(false);
      setQrType(null);
    }
  };

  const handlePrintIDCards = async () => {
    if (allStudents.length === 0) return;
    setIsGeneratingQR(true);
    setQrType('print');
    setQrProgress(0);
    try {
      const html = await generatePrintableIDSheet(allStudents, currentSchoolId, displaySchoolName || 'School', setQrProgress);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (err) {
      console.error('Print generation failed:', err);
    } finally {
      setIsGeneratingQR(false);
      setQrType(null);
    }
  };

  const toggleSchoolSelection = (schoolId) => {
    setSelectedSchools(prev => 
      prev.includes(schoolId) 
        ? prev.filter(id => id !== schoolId) 
        : [...prev, schoolId]
    );
  };

  // =====================
  // TABS CONFIG
  // =====================
  const tabs = [
    { id: 'schools', label: 'Schools', icon: Building2 },
    { id: 'broadcast', label: 'Broadcast', icon: Radio },
    { id: 'safety', label: 'Global Safety', icon: Shield },
    { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
  ];

  // =====================
  // RENDER
  // =====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
          <Globe size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Building2 className="text-amber-400" size={24} />
            Super Admin Panel
          </h2>
          <p className="text-sm text-muted-foreground">Manage all schools from one place</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-400'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===================== */}
      {/* SCHOOLS TAB */}
      {/* ===================== */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          {/* Create School */}
          <div className="p-6 bg-accent/50 border border-border rounded-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Plus size={18} className="text-amber-400" />
              Create New School
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Enter school name..."
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSchool()}
              />
              <button
                onClick={handleCreateSchool}
                disabled={!newSchoolName.trim() || isCreating}
                className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-amber-400 transition-all"
              >
                {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Create
              </button>
            </div>
            {createSuccess && (
              <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                createSuccess.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {createSuccess.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                {createSuccess.message}
              </div>
            )}
          </div>

          {/* School List */}
          <div>
            <h3 className="font-bold mb-4">All Schools ({allSchools.length})</h3>
            {allSchools.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-accent/30 rounded-xl border border-border">
                <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                <p>No schools created yet</p>
                <p className="text-sm mt-2">Create your first school above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allSchools.map(school => (
                  <button
                    key={school.id}
                    onClick={() => onSwitchSchool?.(school.id)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] ${
                      school.id === currentSchoolId
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                        : 'bg-accent/30 border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        school.id === currentSchoolId ? 'bg-amber-500/20' : 'bg-primary/20'
                      }`}>
                        {school.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold">{school.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {school.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {school.id === currentSchoolId && (
                        <span className="px-2 py-1 bg-amber-500/20 text-xs font-bold rounded">ACTIVE</span>
                      )}
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* BROADCAST TAB */}
      {/* ===================== */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          {/* Broadcast Type Selection */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'global', icon: Globe, label: 'Global', color: 'amber', desc: 'All schools' },
              { type: 'targeted', icon: Target, label: 'Targeted', color: 'blue', desc: 'Select schools' },
              { type: 'direct', icon: MessageSquare, label: 'Direct', color: 'purple', desc: 'Specific users' },
            ].map(({ type, icon: Icon, label, color, desc }) => (
              <button
                key={type}
                onClick={() => setBroadcastType(type)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  broadcastType === type
                    ? `bg-${color}-500/20 border-${color}-500 text-${color}-400`
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon size={24} />
                <span className="text-sm font-bold">{label}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>

          {/* Targeted School Selection */}
          {broadcastType === 'targeted' && (
            <div className="p-4 bg-accent/30 rounded-xl">
              <h4 className="font-bold mb-3 text-sm">Select Schools ({selectedSchools.length} selected)</h4>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {allSchools.map(school => (
                  <button
                    key={school.id}
                    onClick={() => toggleSchoolSelection(school.id)}
                    className={`p-2 rounded-lg text-sm text-left flex items-center gap-2 transition-all ${
                      selectedSchools.includes(school.id)
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                        : 'bg-accent/50 hover:bg-accent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedSchools.includes(school.id) ? 'bg-blue-500 border-blue-500' : 'border-border'
                    }`}>
                      {selectedSchools.includes(school.id) && <Check size={12} className="text-white" />}
                    </div>
                    {school.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <h4 className="font-bold mb-3 text-sm">Priority Level</h4>
            <div className="flex gap-2">
              {['normal', 'important', 'urgent'].map(priority => (
                <button
                  key={priority}
                  onClick={() => setBroadcastPriority(priority)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border capitalize transition-all ${
                    broadcastPriority === priority
                      ? priority === 'urgent'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : priority === 'important'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <h4 className="font-bold mb-3 text-sm">Message ({broadcastMessage.length}/500)</h4>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value.slice(0, 500))}
              placeholder="Type your broadcast message..."
              className="w-full h-32 p-4 bg-accent/50 border border-border rounded-xl resize-none focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendBroadcast}
            disabled={!broadcastMessage.trim() || isSending || (broadcastType === 'targeted' && selectedSchools.length === 0)}
            className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-amber-400 transition-all"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {broadcastType === 'global' ? 'Send to All Schools' : 
             broadcastType === 'targeted' ? `Send to ${selectedSchools.length} School(s)` : 
             'Send Direct Message'}
          </button>

          {/* Success/Error Message */}
          {sendSuccess && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              sendSuccess.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {sendSuccess.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
              {sendSuccess.message}
            </div>
          )}
        </div>
      )}

      {/* ===================== */}
      {/* SAFETY TAB */}
      {/* ===================== */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Global Lockdown */}
          <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h3 className="text-2xl font-black text-red-400 mb-2">GLOBAL LOCKDOWN</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Lock ALL {allSchools.length} schools simultaneously. This will disable hall passes system-wide.
            </p>
            
            {!showGlobalLockdownConfirm ? (
              <button
                onClick={() => setShowGlobalLockdownConfirm(true)}
                className="px-8 py-4 bg-red-500 text-white font-black rounded-xl text-lg hover:bg-red-400 transition-all"
              >
                INITIATE GLOBAL LOCKDOWN
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="font-bold text-red-400">⚠️ CONFIRM GLOBAL LOCKDOWN</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This will immediately lock down {allSchools.length} schools. All hall passes will be suspended.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowGlobalLockdownConfirm(false)}
                    className="px-6 py-3 bg-accent border border-border rounded-xl font-bold hover:bg-accent/80 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGlobalLockdown}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all"
                  >
                    CONFIRM LOCKDOWN
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-accent/50 border border-border rounded-xl text-center">
              <div className="text-3xl font-black text-amber-400">{allSchools.length}</div>
              <div className="text-sm text-muted-foreground">Schools</div>
            </div>
            <div className="p-4 bg-accent/50 border border-border rounded-xl text-center">
              <div className="text-3xl font-black text-blue-400">{allStudents.length}</div>
              <div className="text-sm text-muted-foreground">Students</div>
            </div>
            <div className="p-4 bg-accent/50 border border-border rounded-xl text-center">
              <div className="text-3xl font-black text-emerald-400">●</div>
              <div className="text-sm text-muted-foreground">System Active</div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* QR CODES TAB */}
      {/* ===================== */}
      {activeTab === 'qrcodes' && (
        <div className="space-y-6">
          {/* Current School Info */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-amber-400 font-bold">Current School:</span>
                <span className="ml-2">{displaySchoolName || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-amber-400 font-bold">Students:</span>
                <span className="ml-2">{allStudents.length}</span>
              </div>
            </div>
          </div>

          {allStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-accent/30 rounded-xl border border-border">
              <QrCode size={48} className="mx-auto mb-4 opacity-30" />
              <p>No students in current school</p>
              <p className="text-sm mt-2">Switch to a school with students to generate QR codes</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Download ZIP */}
              <div className="p-6 bg-accent/50 border border-border rounded-xl">
                <Download size={32} className="text-blue-400 mb-3" />
                <h3 className="font-bold mb-2">Download QR Codes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a ZIP file with individual QR code images for each student
                </p>
                <button
                  onClick={handleDownloadQRZip}
                  disabled={isGeneratingQR}
                  className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-blue-400 transition-all flex items-center justify-center gap-2"
                >
                  {isGeneratingQR && qrType === 'zip' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {qrProgress}%
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download ZIP
                    </>
                  )}
                </button>
              </div>

              {/* Print ID Cards */}
              <div className="p-6 bg-accent/50 border border-border rounded-xl">
                <Printer size={32} className="text-purple-400 mb-3" />
                <h3 className="font-bold mb-2">Print ID Cards</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a printable sheet with student ID cards and QR codes
                </p>
                <button
                  onClick={handlePrintIDCards}
                  disabled={isGeneratingQR}
                  className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-purple-400 transition-all flex items-center justify-center gap-2"
                >
                  {isGeneratingQR && qrType === 'print' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {qrProgress}%
                    </>
                  ) : (
                    <>
                      <Printer size={18} />
                      Print View
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isGeneratingQR && (
            <div className="p-4 bg-accent/50 border border-border rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">Generating...</span>
                <span className="text-sm text-muted-foreground">{qrProgress}%</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${qrProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
