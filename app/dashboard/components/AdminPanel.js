'use client';
import { useState, useRef } from 'react';
import { X, Upload, Save, Plus, Trash2, Settings, Clock, DollarSign, Home, Tag, Users, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminPanel({
  onClose,
  labelsConfig,
  bellSchedule,
  economyConfig,
  housesConfig,
  settingsConfig,
  houses,
  allStudents,
  onUpdateConfig,
  onUpdateHouses,
  onHandleFileUpload,
  isSchoolAdmin,
  isSuperAdmin,
  theme,
}) {
  const [activeTab, setActiveTab] = useState('labels');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Local state for editing
  const [localLabels, setLocalLabels] = useState({
    infractionButtons: labelsConfig?.infractionButtons || ['Disruption', 'Defiance', 'Tech Misuse', 'Profanity'],
    incentiveButtons: labelsConfig?.incentiveButtons || ['Helping Others', 'Participation', 'Excellence', 'Leadership', 'Kindness'],
    passDestinations: labelsConfig?.passDestinations || ['Bathroom', 'Water', 'Office', 'Library', 'Clinic', 'Counselor'],
    maxDisplayedDestinations: labelsConfig?.maxDisplayedDestinations || 8,
  });

  const [localBellSchedule, setLocalBellSchedule] = useState({
    periods: bellSchedule?.periods || [
      { id: '1', name: 'Period 1', start: '08:00', end: '08:50' },
      { id: '2', name: 'Period 2', start: '08:55', end: '09:45' },
      { id: '3', name: 'Period 3', start: '09:50', end: '10:40' },
      { id: '4', name: 'Period 4', start: '10:45', end: '11:35' },
      { id: '5', name: 'Lunch', start: '11:35', end: '12:05' },
      { id: '6', name: 'Period 5', start: '12:10', end: '13:00' },
      { id: '7', name: 'Period 6', start: '13:05', end: '13:55' },
      { id: '8', name: 'Period 7', start: '14:00', end: '14:50' },
    ],
    passingTime: bellSchedule?.passingTime || 5,
    gracePeriodMinutes: bellSchedule?.gracePeriodMinutes || 3,
  });

  const [localEconomy, setLocalEconomy] = useState({
    studentPointRatio: economyConfig?.studentPointRatio || 0.4,
    teamPointRatio: economyConfig?.teamPointRatio || 0.6,
  });

  const [localSettings, setLocalSettings] = useState({
    passOvertimeMinutes: settingsConfig?.passOvertimeMinutes || 10,
    maxCapacityPerDestination: settingsConfig?.maxCapacityPerDestination || 5,
    conflictAlertsEnabled: settingsConfig?.conflictAlertsEnabled !== false,
    tardyStreakThreshold: settingsConfig?.tardyStreakThreshold || 4,
  });

  const [localHouses, setLocalHouses] = useState(
    houses?.length > 0 ? houses : [
      { id: 'phoenix', name: 'Phoenix', mascot: '🔥', color: '#ef4444', score: 0 },
      { id: 'wolf', name: 'Wolf', mascot: '🐺', color: '#3b82f6', score: 0 },
      { id: 'hawk', name: 'Hawk', mascot: '🦅', color: '#22c55e', score: 0 },
      { id: 'panther', name: 'Panther', mascot: '🐆', color: '#a855f7', score: 0 },
    ]
  );

  // Save handlers
  const handleSaveLabels = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig?.('labels', localLabels);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBellSchedule = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig?.('bell_schedule', localBellSchedule);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEconomy = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig?.('economy', localEconomy);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig?.('settings', localSettings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHouses = async () => {
    setIsSaving(true);
    try {
      await onUpdateHouses?.(localHouses);
    } finally {
      setIsSaving(false);
    }
  };

  // Label array helpers
  const addLabel = (type) => {
    setLocalLabels(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const updateLabel = (type, index, value) => {
    setLocalLabels(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  const removeLabel = (type, index) => {
    setLocalLabels(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Period helpers
  const addPeriod = () => {
    const newId = String(localBellSchedule.periods.length + 1);
    setLocalBellSchedule(prev => ({
      ...prev,
      periods: [...prev.periods, { id: newId, name: `Period ${newId}`, start: '08:00', end: '08:50' }]
    }));
  };

  const updatePeriod = (index, field, value) => {
    setLocalBellSchedule(prev => ({
      ...prev,
      periods: prev.periods.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const removePeriod = (index) => {
    setLocalBellSchedule(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index)
    }));
  };

  // House helpers
  const updateHouse = (index, field, value) => {
    setLocalHouses(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  // File upload handler with actual parsing
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus({ type: 'loading', message: 'Processing file...' });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setUploadStatus({ type: 'error', message: 'No data found in file' });
        return;
      }

      // Validate required columns
      const firstRow = jsonData[0];
      const hasName = 'full_name' in firstRow || 'name' in firstRow || 'Name' in firstRow || 'Full Name' in firstRow;
      const hasId = 'student_id' in firstRow || 'id' in firstRow || 'ID' in firstRow || 'Student ID' in firstRow || 'student_id_number' in firstRow;

      if (!hasName || !hasId) {
        setUploadStatus({ 
          type: 'error', 
          message: 'File must have columns: full_name (or Name), student_id (or ID), grade (optional)' 
        });
        return;
      }

      // Normalize data
      const students = jsonData.map(row => ({
        full_name: row.full_name || row.name || row.Name || row['Full Name'] || '',
        student_id_number: String(row.student_id || row.id || row.ID || row['Student ID'] || row.student_id_number || ''),
        grade_level: parseInt(row.grade || row.Grade || row.grade_level || row['Grade Level'] || 9, 10),
        status: 'IN',
        houseId: null,
        mtss_score: 0,
        infraction_count: 0,
        tardy_count: 0,
        tardy_streak: 0,
        incentive_points_student: 0,
        incentive_points_team: 0,
      })).filter(s => s.full_name && s.student_id_number);

      // Call the upload handler with parsed data
      await onHandleFileUpload?.(students);

      setUploadStatus({ 
        type: 'success', 
        message: `Successfully imported ${students.length} students` 
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('File upload error:', err);
      setUploadStatus({ type: 'error', message: 'Failed to parse file. Ensure it is a valid Excel or CSV file.' });
    }
  };

  const tabs = [
    { id: 'labels', label: 'Labels', icon: Tag },
    { id: 'schedule', label: 'Bell Schedule', icon: Clock },
    { id: 'economy', label: 'Economy', icon: DollarSign },
    { id: 'houses', label: 'Houses', icon: Home },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'roster', label: 'Roster', icon: Users },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Settings className="text-primary" /> Admin Panel - The Box
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'text-primary border-b-2 border-primary' 
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
          {/* Labels Tab */}
          {activeTab === 'labels' && (
            <div className="space-y-6">
              {/* Infraction Buttons */}
              <div data-guide="labels-config">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-bold">Infraction Buttons</label>
                  <button onClick={() => addLabel('infractionButtons')} className="p-1 bg-primary/20 text-primary rounded">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {localLabels.infractionButtons.map((label, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => updateLabel('infractionButtons', i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        placeholder="Button label..."
                      />
                      <button onClick={() => removeLabel('infractionButtons', i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incentive Buttons */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-bold">Incentive Buttons</label>
                  <button onClick={() => addLabel('incentiveButtons')} className="p-1 bg-primary/20 text-primary rounded">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {localLabels.incentiveButtons.map((label, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => updateLabel('incentiveButtons', i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        placeholder="Button label..."
                      />
                      <button onClick={() => removeLabel('incentiveButtons', i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pass Destinations */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-bold">Pass Destinations</label>
                  <button onClick={() => addLabel('passDestinations')} className="p-1 bg-primary/20 text-primary rounded">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {localLabels.passDestinations.map((label, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => updateLabel('passDestinations', i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        placeholder="Destination..."
                      />
                      <button onClick={() => removeLabel('passDestinations', i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Max Displayed */}
              <div>
                <label className="font-bold block mb-2">Max Displayed Destinations</label>
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={localLabels.maxDisplayedDestinations}
                  onChange={(e) => setLocalLabels(prev => ({ ...prev, maxDisplayedDestinations: parseInt(e.target.value) || 8 }))}
                  className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>

              <button 
                onClick={handleSaveLabels} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Labels'}
              </button>
            </div>
          )}

          {/* Bell Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-bold">Periods</label>
                  <button onClick={addPeriod} className="p-1 bg-primary/20 text-primary rounded">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {localBellSchedule.periods.map((period, i) => (
                    <div key={period.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={period.name}
                        onChange={(e) => updatePeriod(i, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        placeholder="Period name..."
                      />
                      <input
                        type="time"
                        value={period.start}
                        onChange={(e) => updatePeriod(i, 'start', e.target.value)}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                      <span className="text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={period.end}
                        onChange={(e) => updatePeriod(i, 'end', e.target.value)}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                      <button onClick={() => removePeriod(i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-2">Passing Time (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={localBellSchedule.passingTime}
                    onChange={(e) => setLocalBellSchedule(prev => ({ ...prev, passingTime: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-2">Tardy Grace Period (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={localBellSchedule.gracePeriodMinutes}
                    onChange={(e) => setLocalBellSchedule(prev => ({ ...prev, gracePeriodMinutes: parseInt(e.target.value) || 3 }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveBellSchedule} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Bell Schedule'}
              </button>
            </div>
          )}

          {/* Economy Tab */}
          {activeTab === 'economy' && (
            <div className="space-y-6" data-guide="economy-config">
              <div className="p-4 bg-accent/50 border border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-4">
                  Configure how points are split between individual students and their houses.
                  The two ratios must add up to 1.0 (100%).
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold block mb-2">Student Ratio</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localEconomy.studentPointRatio * 100}
                        onChange={(e) => {
                          const studentRatio = parseInt(e.target.value) / 100;
                          setLocalEconomy({ studentPointRatio: studentRatio, teamPointRatio: 1 - studentRatio });
                        }}
                        className="flex-1"
                      />
                      <span className="font-bold text-lg w-16 text-right">{Math.round(localEconomy.studentPointRatio * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-2">House Ratio</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localEconomy.teamPointRatio * 100}
                        onChange={(e) => {
                          const teamRatio = parseInt(e.target.value) / 100;
                          setLocalEconomy({ teamPointRatio: teamRatio, studentPointRatio: 1 - teamRatio });
                        }}
                        className="flex-1"
                      />
                      <span className="font-bold text-lg w-16 text-right">{Math.round(localEconomy.teamPointRatio * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-sm text-muted-foreground">
                    When awarding 10 points: Student gets {Math.round(10 * localEconomy.studentPointRatio)}, 
                    House gets {Math.round(10 * localEconomy.teamPointRatio)}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSaveEconomy} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Economy Settings'}
              </button>
            </div>
          )}

          {/* Houses Tab */}
          {activeTab === 'houses' && (
            <div className="space-y-6" data-guide="houses-config">
              <div className="space-y-4">
                {localHouses.map((house, i) => (
                  <div key={house.id} className="p-4 bg-accent/50 border border-border rounded-xl">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Name</label>
                        <input
                          type="text"
                          value={house.name}
                          onChange={(e) => updateHouse(i, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Mascot Emoji</label>
                        <input
                          type="text"
                          value={house.mascot}
                          onChange={(e) => updateHouse(i, 'mascot', e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-center text-2xl"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Color</label>
                        <input
                          type="color"
                          value={house.color}
                          onChange={(e) => updateHouse(i, 'color', e.target.value)}
                          className="w-full h-10 bg-background border border-border rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Current Score</label>
                        <div className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-center font-bold">
                          {house.score || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSaveHouses} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Houses'}
              </button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-2">Pass Overtime Warning (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={localSettings.passOvertimeMinutes}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, passOvertimeMinutes: parseInt(e.target.value) || 10 }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">StrideBot warns when a pass exceeds this duration</p>
                </div>
                <div>
                  <label className="font-bold block mb-2">Max Capacity per Destination</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={localSettings.maxCapacityPerDestination}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, maxCapacityPerDestination: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Students join waitlist when destination is full</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-2">Tardy Streak Threshold</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={localSettings.tardyStreakThreshold}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, tardyStreakThreshold: parseInt(e.target.value) || 4 }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Alert when student hits this many consecutive tardies</p>
                </div>
                <div>
                  <label className="font-bold block mb-2">Conflict Alerts</label>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, conflictAlertsEnabled: !prev.conflictAlertsEnabled }))}
                    className={`w-full py-3 rounded-lg font-bold transition-colors ${
                      localSettings.conflictAlertsEnabled 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {localSettings.conflictAlertsEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">Block passes when conflict group members are out</p>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* Roster Tab */}
          {activeTab === 'roster' && (
            <div className="space-y-6">
              <div className="p-6 border-2 border-dashed border-border rounded-xl text-center" data-guide="upload-roster">
                <FileSpreadsheet className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="font-bold mb-2">Upload Student Roster</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload an Excel (.xlsx) or CSV file with columns:<br />
                  <strong>full_name</strong> (or Name), <strong>student_id</strong> (or ID), <strong>grade</strong> (optional)
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="roster-upload"
                />
                <label
                  htmlFor="roster-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Upload size={18} /> Select File
                </label>

                {uploadStatus && (
                  <div className={`mt-4 p-3 rounded-lg flex items-center justify-center gap-2 ${
                    uploadStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    uploadStatus.type === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {uploadStatus.type === 'error' && <AlertTriangle size={16} />}
                    {uploadStatus.message}
                  </div>
                )}
              </div>

              <div className="p-4 bg-accent/50 border border-border rounded-xl">
                <h4 className="font-bold mb-2">Current Roster</h4>
                <p className="text-sm text-muted-foreground">
                  {allStudents?.length || 0} students loaded
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
