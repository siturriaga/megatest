'use client';
import { useState } from 'react';
import { Star, Trophy, Sparkles } from 'lucide-react';
import StudentSearch from './StudentSearch';
import HouseStandings from './HouseStandings';

export default function IncentivesPanel({
  allStudents = [],
  selectedStudent,
  setSelectedStudent,
  onAwardPoints,
  theme,
  labelsConfig,
  economyConfig,
  houses = [],
  botRef,
}) {
  const incentiveButtons = labelsConfig?.incentiveButtons || ['Helping Others', 'Participation', 'Excellence', 'Leadership', 'Kindness'];
  const studentRatio = economyConfig?.studentPointRatio || 0.4;
  const teamRatio = economyConfig?.teamPointRatio || 0.6;

  const handleAwardPoints = async (label) => {
    if (!selectedStudent) return;
    await onAwardPoints(selectedStudent, label, 1);
  };

  const selectedHouse = selectedStudent?.houseId 
    ? houses.find(h => h.id === selectedStudent.houseId) 
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6">
          <h3 className="font-black text-lg flex items-center gap-2 mb-4">
            <Star className="text-amber-400" size={20} />
            Award Points
          </h3>

          <div data-guide="student-select">
            <StudentSearch
              allStudents={allStudents}
              selectedStudent={selectedStudent}
              onSelect={setSelectedStudent}
            />
          </div>

          {selectedStudent && (
            <>
              {/* Point Split Info */}
              <div className="mt-4 p-3 bg-accent/50 border border-border rounded-xl text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Point Split</span>
                  <span className="font-bold">
                    {Math.round(studentRatio * 100)}% Student / {Math.round(teamRatio * 100)}% House
                  </span>
                </div>
                {selectedHouse && (
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span>House: {selectedHouse.mascot} {selectedHouse.name}</span>
                    <span className="text-muted-foreground">• Current Score: {selectedHouse.score}</span>
                  </div>
                )}
              </div>

              {/* Quick Award Buttons */}
              <div data-guide="incentive-buttons" className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {incentiveButtons.map(label => (
                  <button
                    key={label}
                    onClick={() => handleAwardPoints(label)}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Student Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                  <div className="text-3xl font-black text-amber-400">
                    {selectedStudent.incentive_points_student || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Personal Points</div>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                  <div className="text-3xl font-black text-emerald-400">
                    {selectedStudent.incentive_points_team || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Team Contribution</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* House Standings */}
      <div className="glass-card p-6" data-guide="house-standings">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Trophy className="text-amber-400" size={16} />
          House Standings
        </h4>
        <HouseStandings houses={houses} theme={theme} />
      </div>
    </div>
  );
}
