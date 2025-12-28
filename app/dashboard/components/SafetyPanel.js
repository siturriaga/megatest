'use client';
import { Shield, Lock, Users, AlertTriangle, Plus, X } from 'lucide-react';
import { useState } from 'react';

export default function SafetyPanel({
  conflictGroups = [],
  allStudents = [],
  activePasses = [],
  onAddConflictGroup,
  onRemoveConflictGroup,
  lockdown,
  onToggleLockdown,
  isSchoolAdmin,
  theme,
}) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const handleAddGroup = async () => {
    if (newGroupName.trim() && selectedMembers.length >= 2) {
      await onAddConflictGroup(newGroupName, selectedMembers);
      setNewGroupName('');
      setSelectedMembers([]);
      setShowAddGroup(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lockdown Control */}
      <div className="glass-card p-6">
        <h3 className="font-black text-lg flex items-center gap-2 mb-4">
          <Shield className="text-red-400" size={20} />
          Lockdown Control
        </h3>

        <div data-guide="lockdown-toggle" className={`p-6 rounded-2xl text-center ${lockdown ? 'bg-red-500/20 border-2 border-red-500' : 'bg-accent border border-border'}`}>
          <div className={`text-6xl mb-4 ${lockdown ? 'animate-pulse' : ''}`}>
            {lockdown ? '🚨' : '✅'}
          </div>
          <div className={`text-2xl font-black mb-2 ${lockdown ? 'text-red-400' : 'text-emerald-400'}`}>
            {lockdown ? 'LOCKDOWN ACTIVE' : 'All Clear'}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {lockdown ? 'All hall passes are suspended' : 'Normal operations'}
          </p>

          {isSchoolAdmin && (
            <button
              onClick={onToggleLockdown}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                lockdown 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {lockdown ? 'LIFT LOCKDOWN' : 'ACTIVATE LOCKDOWN'}
            </button>
          )}
        </div>

        {/* Students Currently Out */}
        <div className="mt-4 p-4 bg-accent/50 border border-border rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">Students Currently Out</span>
            <span className={`text-2xl font-black ${activePasses.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activePasses.length}
            </span>
          </div>
          {activePasses.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {activePasses.slice(0, 5).map(pass => (
                <div key={pass.id} className="text-xs text-muted-foreground flex justify-between">
                  <span>{pass.studentName}</span>
                  <span className="text-primary">{pass.destination}</span>
                </div>
              ))}
              {activePasses.length > 5 && (
                <div className="text-xs text-muted-foreground">+{activePasses.length - 5} more</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conflict Groups */}
      <div className="glass-card p-6" data-guide="conflict-groups">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg flex items-center gap-2">
            <Users className="text-amber-400" size={20} />
            Conflict Groups
          </h3>
          {isSchoolAdmin && (
            <button
              onClick={() => setShowAddGroup(!showAddGroup)}
              className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
              data-guide="add-conflict"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {showAddGroup && (
          <div className="mb-4 p-4 bg-accent/50 border border-border rounded-xl space-y-3">
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            />
            <select
              multiple
              value={selectedMembers}
              onChange={(e) => setSelectedMembers(Array.from(e.target.selectedOptions, o => o.value))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm h-32"
            >
              {allStudents.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim() || selectedMembers.length < 2}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50"
              >
                Create Group
              </button>
              <button
                onClick={() => setShowAddGroup(false)}
                className="px-4 py-2 bg-accent border border-border rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}}

        {conflictGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No conflict groups defined
          </div>
        ) : (
          <div className="space-y-3">
            {conflictGroups.map(group => {
              const members = group.members?.map(id => allStudents.find(s => s.id === id)?.full_name || id) || [];
              return (
                <div key={group.id} className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{group.name}</span>
                    {isSchoolAdmin && (
                      <button
                        onClick={() => onRemoveConflictGroup(group.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {members.join(' • ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
