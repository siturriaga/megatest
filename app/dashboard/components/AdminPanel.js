'use client';
import { useState } from 'react';
import { X, Save, Plus, Trash2, Settings, Clock, DollarSign, Home, Tag, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Label management
  const addLabel = (key) => {
    setLocalLabels(prev => ({
      ...prev,
      [key]: [...prev[key], 'New Item']
    }));
  };

  const updateLabel = (key, index, value) => {
    setLocalLabels(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === index ? value : item)
    }));
  };

  const removeLabel = (key, index) => {
    setLocalLabels(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  // House management
  const updateHouse = (index, field, value) => {
    setLocalHouses(prev => prev.map((house, i) => 
      i === index ? { ...house, [field]: value } : house
    ));
  };

  const addHouse = () => {
    const newHouse = {
      id: `house-${Date.now()}`,
      name: 'New House',
      mascot: '🏠',
      color: '#6366f1',
      score: 0
    };
    setLocalHouses(prev => [...prev, newHouse]);
  };

  const removeHouse = (index) => {
    setLocalHouses(prev => prev.filter((_, i) => i !== index));
  };

  // Roster upload logic moved to StudentRosterUpload component

  const tabs = [
    { id: 'labels', label: 'Labels', icon: Tag },
    { id: 'schedule', label: 'Bell Schedule', icon: Clock },
    { id: 'economy', label: 'Economy', icon: DollarSign },
    { id: 'houses', label: 'Houses', icon: Home },
    { id: 'settings', label: 'Settings', icon: Settings },
    // Roster upload moved to dedicated StudentRosterUpload component
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Settings className="text-primary" /> Admin Panel - The Box
          </h2>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose} 
            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <X size={20} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 flex items-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-primary border-b-2 border-primary bg-primary/5' 
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
              <div className="p-4 bg-accent/50 border border-border rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold">Infraction Buttons</label>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addLabel('infractionButtons')} 
                    className="p-1 bg-primary/20 text-primary rounded"
                  >
                    <Plus size={16} />
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {localLabels.infractionButtons.map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => updateLabel('infractionButtons', i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                      <button onClick={() => removeLabel('infractionButtons', i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incentive Buttons */}
              <div className="p-4 bg-accent/50 border border-border rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold">Incentive Buttons</label>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addLabel('incentiveButtons')} 
                    className="p-1 bg-primary/20 text-primary rounded"
                  >
                    <Plus size={16} />
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {localLabels.incentiveButtons.map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => updateLabel('incentiveButtons', i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                      <button onClick={() => removeLabel('incentiveButtons', i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pass Destinations */}
              <div className="p-4 bg-accent/50 border border-border rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold">Pass Destinations</label>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addLabel('passDestinations')} 
                    className="p-1 bg-primary/20 text-primary rounded"
                  >
                    <Plus size={16} />
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {localLabels.passDestinations.map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => updateLabel('passDestinations', i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                      <button onClick={() => removeLabel('passDestinations', i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="font-bold block mb-2">Max Displayed Destinations</label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    value={localLabels.maxDisplayedDestinations}
                    onChange={(e) => setLocalLabels(prev => ({ ...prev, maxDisplayedDestinations: parseInt(e.target.value) || 8 }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveLabels} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Labels'}
              </motion.button>
            </div>
          )}

          {/* Bell Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="space-y-3">
                {localBellSchedule.periods.map((period, i) => (
                  <div key={period.id} className="grid grid-cols-4 gap-3 p-3 bg-accent/50 border border-border rounded-xl">
                    <input
                      type="text"
                      value={period.name}
                      onChange={(e) => {
                        const newPeriods = [...localBellSchedule.periods];
                        newPeriods[i] = { ...newPeriods[i], name: e.target.value };
                        setLocalBellSchedule(prev => ({ ...prev, periods: newPeriods }));
                      }}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold"
                      placeholder="Period name"
                    />
                    <input
                      type="time"
                      value={period.start}
                      onChange={(e) => {
                        const newPeriods = [...localBellSchedule.periods];
                        newPeriods[i] = { ...newPeriods[i], start: e.target.value };
                        setLocalBellSchedule(prev => ({ ...prev, periods: newPeriods }));
                      }}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      value={period.end}
                      onChange={(e) => {
                        const newPeriods = [...localBellSchedule.periods];
                        newPeriods[i] = { ...newPeriods[i], end: e.target.value };
                        setLocalBellSchedule(prev => ({ ...prev, periods: newPeriods }));
                      }}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <button
                      onClick={() => {
                        setLocalBellSchedule(prev => ({
                          ...prev,
                          periods: prev.periods.filter((_, idx) => idx !== i)
                        }));
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg justify-self-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const newPeriod = {
                    id: `p${Date.now()}`,
                    name: 'New Period',
                    start: '08:00',
                    end: '08:50'
                  };
                  setLocalBellSchedule(prev => ({ ...prev, periods: [...prev.periods, newPeriod] }));
                }}
                className="w-full py-3 bg-accent border border-border rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add Period
              </motion.button>

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
                  <label className="font-bold block mb-2">Grace Period (minutes)</label>
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

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveBellSchedule} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Bell Schedule'}
              </motion.button>
            </div>
          )}

          {/* Economy Tab */}
          {activeTab === 'economy' && (
            <div className="space-y-6">
              <div className="p-6 bg-accent/50 border border-border rounded-xl">
                <h3 className="font-bold mb-4">Point Distribution</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  When incentive points are awarded, they are split between the student and their house.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="font-bold block mb-2">Student Points</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localEconomy.studentPointRatio * 100}
                        onChange={(e) => {
                          const student = parseInt(e.target.value) / 100;
                          setLocalEconomy({ studentPointRatio: student, teamPointRatio: 1 - student });
                        }}
                        className="flex-1"
                      />
                      <span className="font-black text-xl text-primary">{Math.round(localEconomy.studentPointRatio * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-2">House Points</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localEconomy.teamPointRatio * 100}
                        onChange={(e) => {
                          const team = parseInt(e.target.value) / 100;
                          setLocalEconomy({ teamPointRatio: team, studentPointRatio: 1 - team });
                        }}
                        className="flex-1"
                      />
                      <span className="font-black text-xl text-emerald-400">{Math.round(localEconomy.teamPointRatio * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveEconomy} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Economy Settings'}
              </motion.button>
            </div>
          )}

          {/* Houses Tab */}
          {activeTab === 'houses' && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Houses are automatically created based on grade levels when you upload a roster. You can also manually configure them here.
              </p>

              <div className="space-y-3">
                {localHouses.map((house, i) => (
                  <motion.div 
                    key={house.id}
                    layout
                    className="grid grid-cols-5 gap-3 p-4 bg-accent/50 border border-border rounded-xl items-center"
                  >
                    <input
                      type="text"
                      value={house.name}
                      onChange={(e) => updateHouse(i, 'name', e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold"
                      placeholder="House name"
                    />
                    <input
                      type="text"
                      value={house.mascot}
                      onChange={(e) => updateHouse(i, 'mascot', e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-center text-2xl"
                      placeholder="🏠"
                      maxLength={2}
                    />
                    <input
                      type="color"
                      value={house.color}
                      onChange={(e) => updateHouse(i, 'color', e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                    <div className="text-center font-black" style={{ color: house.color }}>
                      {house.score || 0} pts
                    </div>
                    <button
                      onClick={() => removeHouse(i)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg justify-self-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addHouse}
                className="w-full py-3 bg-accent border border-border rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add House
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveHouses} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Houses'}
              </motion.button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-2">Pass Overtime Alert (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={localSettings.passOvertimeMinutes}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, passOvertimeMinutes: parseInt(e.target.value) || 10 }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Alert when student exceeds this time</p>
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLocalSettings(prev => ({ ...prev, conflictAlertsEnabled: !prev.conflictAlertsEnabled }))}
                    className={`w-full py-3 rounded-lg font-bold transition-colors ${
                      localSettings.conflictAlertsEnabled 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {localSettings.conflictAlertsEnabled ? 'Enabled' : 'Disabled'}
                  </motion.button>
                  <p className="text-xs text-muted-foreground mt-1">Block passes when conflict group members are out</p>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Settings'}
              </motion.button>
            </div>
          )}
          
          {/* Roster upload available via Smart Upload section in sidebar */}
        </div>
      </motion.div>
    </motion.div>
  );
}
