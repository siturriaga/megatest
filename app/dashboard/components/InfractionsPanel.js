'use client';
import { useState } from 'react';
import { AlertTriangle, FileText, Phone, Check } from 'lucide-react';
import StudentSearch from './StudentSearch';

const MTSS_INTERVENTIONS = {
  tier1: ['Verbal warning', 'Seat change', 'Teacher conference', 'Positive reinforcement'],
  tier2: ['Parent contact', 'Behavior contract', 'Check-in/Check-out', 'Counselor referral'],
  tier3: ['SST meeting', 'Admin referral', 'FBA/BIP', 'Outside agency referral'],
};

export default function InfractionsPanel({
  allStudents = [],
  selectedStudent,
  setSelectedStudent,
  onLogInfraction,
  onSaveParentContact,
  theme,
  labelsConfig,
  onOpenDetention,
  logs = [],
  parentContacts = [],
}) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({
    interventions: [],
    contactMade: false,
    contactMethod: 'phone',
    contactDate: '',
    contactTime: '',
    notes: '',
  });

  const infractionButtons = labelsConfig?.infractionButtons || ['Disruption', 'Defiance', 'Tech Misuse', 'Profanity'];

  const handleLogInfraction = async (label) => {
    if (!selectedStudent) return;
    await onLogInfraction(selectedStudent, label);
  };

  const studentsNeedingAttention = allStudents
    .filter(s => (s.mtss_score || 0) >= 3)
    .sort((a, b) => (b.mtss_score || 0) - (a.mtss_score || 0))
    .slice(0, 5);

  const getMTSSColor = (score) => {
    if (score >= 10) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (score >= 6) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (score >= 3) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
  };

  const handleSaveContact = async () => {
    if (!selectedStudent) return;
    await onSaveParentContact?.({
      studentId: selectedStudent.id,
      studentName: selectedStudent.full_name,
      ...contactData,
      teacherEmail: '', // Will be filled by hook
    });
    setShowContactForm(false);
    setContactData({ interventions: [], contactMade: false, contactMethod: 'phone', contactDate: '', contactTime: '', notes: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6">
          <h3 className="font-black text-lg flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-400" size={20} />
            Log Infraction
          </h3>

          <div data-guide="student-select">
            <StudentSearch
              allStudents={allStudents}
              selectedStudent={selectedStudent}
              onSelect={setSelectedStudent}
              showMTSS={true}
            />
          </div>

          {selectedStudent && (
            <>
              <div data-guide="infraction-buttons" className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {infractionButtons.map(label => (
                  <button
                    key={label}
                    onClick={() => handleLogInfraction(label)}
                    className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div data-guide="parent-contact" className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="flex-1 py-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Phone size={16} /> Log Parent Contact
                </button>
                <button
                  onClick={() => onOpenDetention?.(selectedStudent)}
                  className="flex-1 py-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <FileText size={16} /> Detention Doc
                </button>
              </div>
            </>
          )}
        </div>

        {/* Parent Contact Form */}
        {showContactForm && selectedStudent && (
          <div className="glass-card p-6 space-y-4">
            <h4 className="font-bold">Parent Contact Log - {selectedStudent.full_name}</h4>
            
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-2">Interventions Tried</label>
              <div className="space-y-2">
                {Object.entries(MTSS_INTERVENTIONS).map(([tier, items]) => (
                  <div key={tier} className="flex flex-wrap gap-2">
                    {items.map(item => (
                      <button
                        key={item}
                        onClick={() => setContactData(prev => ({
                          ...prev,
                          interventions: prev.interventions.includes(item)
                            ? prev.interventions.filter(i => i !== item)
                            : [...prev.interventions, item]
                        }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          contactData.interventions.includes(item)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-accent border border-border'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={contactData.contactMade}
                  onChange={(e) => setContactData(prev => ({ ...prev, contactMade: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Contact Made</span>
              </label>
              {contactData.contactMade && (
                <select
                  value={contactData.contactMethod}
                  onChange={(e) => setContactData(prev => ({ ...prev, contactMethod: e.target.value }))}
                  className="bg-accent border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="inPerson">In Person</option>
                </select>
              )}
            </div>

            <textarea
              placeholder="Notes..."
              value={contactData.notes}
              onChange={(e) => setContactData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-accent border border-border rounded-xl p-3 text-sm h-24 resize-none"
            />

            <button
              onClick={handleSaveContact}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl"
            >
              Save Contact Log
            </button>
          </div>
        )}
      </div>

      {/* Sidebar - Students Needing Attention */}
      <div className="glass-card p-6" data-guide="mtss-tier">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-amber-400" size={16} />
          Students Needing Attention
        </h4>

        {studentsNeedingAttention.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">All students within normal range</p>
        ) : (
          <div className="space-y-2">
            {studentsNeedingAttention.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="w-full p-3 bg-accent/50 border border-border rounded-xl text-left hover:bg-accent transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{student.full_name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getMTSSColor(student.mtss_score)}`}>
                    MTSS {student.mtss_score}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {student.infraction_count || 0} infractions • {student.tardy_count || 0} tardies
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
