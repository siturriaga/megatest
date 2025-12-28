'use client';
import { useState } from 'react';
import { X, Building2, Plus, Users, QrCode, Download, Printer, ChevronRight, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { generateBulkStudentQRs, generatePrintableIDSheet, downloadBlob } from '../../../utils/qrGenerator';

export default function SuperAdminPanel({
  onClose,
  allSchools = [],
  currentSchoolId,
  onCreateSchool,
  onSwitchSchool,
  allStudents = [],
  displaySchoolName,
  theme,
}) {
  const [activeTab, setActiveTab] = useState('schools');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);
  
  // QR Generation state
  const [qrProgress, setQrProgress] = useState(0);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrType, setQrType] = useState(null); // 'zip' or 'print'

  // Handle school creation
  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) return;
    
    setIsCreating(true);
    setCreateSuccess(null);
    
    try {
      await onCreateSchool?.(newSchoolName.trim());
      setCreateSuccess({ type: 'success', message: `School "${newSchoolName}" created successfully!` });
      setNewSchoolName('');
    } catch (err) {
      setCreateSuccess({ type: 'error', message: err.message || 'Failed to create school' });
    } finally {
      setIsCreating(false);
    }
  };

  // Generate bulk QR codes as ZIP
  const handleDownloadQRZip = async () => {
    if (allStudents.length === 0) return;
    
    setIsGeneratingQR(true);
    setQrType('zip');
    setQrProgress(0);
    
    try {
      const blob = await generateBulkStudentQRs(
        allStudents,
        currentSchoolId,
        (progress) => setQrProgress(progress)
      );
      
      const schoolName = displaySchoolName?.replace(/[^a-zA-Z0-9]/g, '_') || 'school';
      downloadBlob(blob, `${schoolName}_QR_Codes.zip`);
    } catch (err) {
      console.error('QR generation failed:', err);
    } finally {
      setIsGeneratingQR(false);
      setQrType(null);
    }
  };

  // Generate printable ID cards
  const handlePrintIDCards = async () => {
    if (allStudents.length === 0) return;
    
    setIsGeneratingQR(true);
    setQrType('print');
    setQrProgress(0);
    
    try {
      const html = await generatePrintableIDSheet(
        allStudents,
        currentSchoolId,
        displaySchoolName || 'School',
        (progress) => setQrProgress(progress)
      );
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error('ID card generation failed:', err);
    } finally {
      setIsGeneratingQR(false);
      setQrType(null);
    }
  };

  const tabs = [
    { id: 'schools', label: 'Schools', icon: Building2 },
    { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Building2 className="text-amber-400" /> Super Admin Panel
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 flex items-center gap-2 text-sm font-bold transition-colors ${
                activeTab === tab.id 
                  ? 'text-amber-400 border-b-2 border-amber-400' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Schools Tab */}
          {activeTab === 'schools' && (
            <div className="space-y-6">
              {/* Create New School */}
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
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSchool()}
                  />
                  <button
                    onClick={handleCreateSchool}
                    disabled={!newSchoolName.trim() || isCreating}
                    className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCreating ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Plus size={18} />
                    )}
                    Create
                  </button>
                </div>

                {createSuccess && (
                  <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    createSuccess.type === 'success' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {createSuccess.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                    {createSuccess.message}
                  </div>
                )}
              </div>

              {/* School List */}
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Building2 size={18} className="text-muted-foreground" />
                  All Schools ({allSchools.length})
                </h3>

                {allSchools.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No schools created yet</p>
                    <p className="text-sm mt-1">Create your first school above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allSchools.map(school => (
                      <button
                        key={school.id}
                        onClick={() => onSwitchSchool?.(school.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                          school.id === currentSchoolId
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                            : 'bg-accent/30 border-border hover:border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                            school.id === currentSchoolId
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {school.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-bold">{school.name || 'Unnamed School'}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {school.id}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {school.id === currentSchoolId && (
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded">
                              ACTIVE
                            </span>
                          )}
                          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QR Codes Tab */}
          {activeTab === 'qrcodes' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-400">
                  <strong>Current School:</strong> {displaySchoolName || 'None selected'}
                  <br />
                  <strong>Students:</strong> {allStudents.length} loaded
                </p>
              </div>

              {allStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No students loaded</p>
                  <p className="text-sm mt-1">Upload a roster in the Admin Panel first</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Download ZIP */}
                  <div className="p-6 bg-accent/50 border border-border rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Download size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold">Download QR Codes</h3>
                        <p className="text-sm text-muted-foreground">ZIP file with all student QRs</p>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadQRZip}
                      disabled={isGeneratingQR}
                      className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGeneratingQR && qrType === 'zip' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Generating... {qrProgress}%
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          Download All QR Codes
                        </>
                      )}
                    </button>

                    {isGeneratingQR && qrType === 'zip' && (
                      <div className="mt-3 h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${qrProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Print ID Cards */}
                  <div className="p-6 bg-accent/50 border border-border rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Printer size={24} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold">Print ID Cards</h3>
                        <p className="text-sm text-muted-foreground">Printable ID cards with QR</p>
                      </div>
                    </div>

                    <button
                      onClick={handlePrintIDCards}
                      disabled={isGeneratingQR}
                      className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGeneratingQR && qrType === 'print' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Generating... {qrProgress}%
                        </>
                      ) : (
                        <>
                          <Printer size={18} />
                          Generate Print View
                        </>
                      )}
                    </button>

                    {isGeneratingQR && qrType === 'print' && (
                      <div className="mt-3 h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${qrProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-accent/30 border border-border rounded-xl">
                <h4 className="font-bold mb-2">How to use QR codes:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Generate QR codes using one of the options above</li>
                  <li>Print and distribute to students</li>
                  <li>Students can scan their QR code at any kiosk or hall monitor station</li>
                  <li>QR codes contain encrypted student IDs linked to your school</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
