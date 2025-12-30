'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Star, Trophy, Sparkles, Zap, Target, Search, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HouseStandings, { PointsAnimation } from './HouseStandings';
import MascotBattle from './MascotBattle';
import { BATTLE_MILESTONES, fuzzySearchStudents } from '@/constants/defaults';

/**
 * IncentivesPanel Component
 * 
 * Main incentive/points awarding interface with:
 * - Fuzzy student search
 * - Quick award buttons  
 * - House standings with SVG mascots
 * - Mascot battle animations (milestone + sandbox triggers)
 * - Debounced battle triggering to prevent duplicates
 */
export default function IncentivesPanel({
  allStudents = [],
  selectedStudent,
  setSelectedStudent,
  onAwardPoints,
  theme,
  labelsConfig,
  economyConfig,
  houses = [],
  sandboxMode = false,
  botRef,
}) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  
  // Battle state
  const [battleActive, setBattleActive] = useState(false);
  const [battleWinner, setBattleWinner] = useState(null);
  const [battleMilestone, setBattleMilestone] = useState(null);
  
  // Track previous scores for milestone detection
  const [previousScores, setPreviousScores] = useState({});
  const [celebratingHouseId, setCelebratingHouseId] = useState(null);
  
  // Battle debounce tracking - prevents duplicate triggers
  const battleTriggeredRef = useRef(new Set());
  
  // Points animation state
  const [pointsAnimation, setPointsAnimation] = useState(null);
  
  // Config
  const incentiveButtons = labelsConfig?.incentiveButtons || [
    'Helping Others', 
    'Participation', 
    'Excellence', 
    'Leadership', 
    'Kindness'
  ];
  const studentRatio = economyConfig?.studentPointRatio || 0.4;
  const teamRatio = economyConfig?.teamPointRatio || 0.6;

  // Initialize previous scores on mount
  useEffect(() => {
    const scores = {};
    houses.forEach(h => {
      scores[h.id] = h.score || 0;
    });
    setPreviousScores(scores);
  }, []);

  // Fuzzy search effect
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = fuzzySearchStudents(allStudents, searchQuery, 8);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allStudents]);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Trigger battle animation with debouncing
  const triggerBattle = useCallback((houseId, milestone = null) => {
    const house = houses.find(h => h.id === houseId);
    if (!house || battleActive) return;
    
    // Debounce check - prevent duplicate triggers
    const triggerKey = `${houseId}-${milestone}`;
    if (battleTriggeredRef.current.has(triggerKey)) {
      return;
    }
    battleTriggeredRef.current.add(triggerKey);
    
    // Clear the debounce after battle completes
    setTimeout(() => {
      battleTriggeredRef.current.delete(triggerKey);
    }, 15000); // Clear after 15 seconds (battle duration + buffer)
    
    setBattleWinner(house);
    setBattleMilestone(milestone);
    setBattleActive(true);
    
    botRef?.current?.push?.('battle', { house: house.name });
  }, [houses, battleActive, botRef]);

  // Handle battle completion
  const handleBattleComplete = useCallback(() => {
    setBattleActive(false);
    setBattleWinner(null);
    setBattleMilestone(null);
  }, []);

  // Award points handler
  const handleAwardPoints = async (label) => {
    if (!selectedStudent) return;
    
    // Show celebration on the student's house
    if (selectedStudent.houseId) {
      setCelebratingHouseId(selectedStudent.houseId);
      setTimeout(() => setCelebratingHouseId(null), 2000);
    }
    
    // Show floating points animation
    setPointsAnimation({
      points: 1,
      type: 'add',
      key: Date.now(),
    });
    setTimeout(() => setPointsAnimation(null), 1000);
    
    // Actually award the points
    await onAwardPoints?.(selectedStudent, label, 1);
    
    // Bot feedback
    botRef?.current?.push?.('points', { student: selectedStudent.full_name, label });
  };

  // Handle student selection
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Get selected student's house
  const selectedHouse = useMemo(() => {
    if (!selectedStudent?.houseId) return null;
    return houses.find(h => h.id === selectedStudent.houseId);
  }, [selectedStudent, houses]);

  // Next milestone for selected house
  const nextMilestone = useMemo(() => {
    if (!selectedHouse) return null;
    const currentScore = selectedHouse.score || 0;
    return BATTLE_MILESTONES.find(m => m > currentScore);
  }, [selectedHouse]);

  return (
    <>
      {/* Mascot Battle Overlay */}
      <AnimatePresence>
        {battleActive && (
          <MascotBattle
            isActive={battleActive}
            winnerHouse={battleWinner}
            allHouses={houses}
            milestone={battleMilestone}
            onComplete={handleBattleComplete}
          />
        )}
      </AnimatePresence>

      {/* Points Animation */}
      <AnimatePresence>
        {pointsAnimation && (
          <PointsAnimation
            key={pointsAnimation.key}
            points={pointsAnimation.points}
            type={pointsAnimation.type}
            position={{ x: '50%', y: '40%' }}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl">
            <h3 className="font-black text-lg flex items-center gap-2 mb-4">
              <Star className="text-amber-400" size={20} />
              Award Points
            </h3>

            {/* Student Search */}
            <div className="relative" data-guide="student-select">
              <div 
                onClick={() => setShowSearch(true)}
                className="p-4 bg-accent border border-border rounded-xl cursor-pointer hover:bg-accent/80 transition-colors"
              >
                {selectedStudent ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-lg font-bold text-primary">
                      {selectedStudent.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{selectedStudent.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {selectedStudent.student_id_number} • Grade {selectedStudent.grade_level}
                        {selectedHouse && (
                          <span style={{ color: selectedHouse.color }}> • {selectedHouse.name}</span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedStudent(null); }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Search size={20} />
                    <span>Search for a student (fuzzy matching enabled)...</span>
                  </div>
                )}
              </div>

              {/* Search Dropdown */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="p-3 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Type name or ID (typos OK!)..."
                          className="w-full pl-10 pr-4 py-2 bg-accent border border-border rounded-lg text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Fuzzy search: "jonathn" finds "Jonathan", "smth" finds "Smith"
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.map(student => {
                          const house = houses.find(h => h.id === student.houseId);
                          return (
                            <button
                              key={student.id}
                              onClick={() => handleSelectStudent(student)}
                              className="w-full p-3 hover:bg-accent text-left flex items-center gap-3 transition-colors border-b border-border/50 last:border-0"
                            >
                              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                                {student.full_name?.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{student.full_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {student.student_id_number} • Gr {student.grade_level}
                                  {house && (
                                    <span style={{ color: house.color }}> • {house.name}</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : searchQuery.length >= 2 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          <User size={24} className="mx-auto mb-2 opacity-50" />
                          No students found matching "{searchQuery}"
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          Type at least 2 characters to search...
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-border bg-accent/50">
                      <button
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Click outside to close */}
              {showSearch && (
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                />
              )}
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
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: selectedHouse.color }}
                      />
                      <span>House: {selectedHouse.name}</span>
                      <span className="text-muted-foreground">
                        • Current: {selectedHouse.score?.toLocaleString() || 0} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Award Buttons */}
                <div data-guide="incentive-buttons" className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {incentiveButtons.map(label => (
                    <button
                      key={label}
                      onClick={() => handleAwardPoints(label)}
                      className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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

                {/* Next Milestone Info */}
                {selectedHouse && nextMilestone && (
                  <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-sm">
                      <Target size={14} className="text-purple-400" />
                      <span className="text-muted-foreground">Next Battle:</span>
                      <span className="font-bold text-purple-400">
                        {nextMilestone.toLocaleString()} pts
                      </span>
                      <span className="text-muted-foreground">
                        ({(nextMilestone - (selectedHouse.score || 0)).toLocaleString()} to go)
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sandbox Controls */}
          {sandboxMode && (
            <div className="p-4 bg-amber-500/5 border border-dashed border-amber-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Zap size={16} />
                  <span className="text-sm font-bold">Sandbox Mode</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Triple-click mascots or use button below
                </p>
              </div>
              {houses.length > 0 && (
                <button
                  onClick={() => triggerBattle(houses[0].id, 'SANDBOX_TEST')}
                  className="mt-3 w-full py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-bold hover:bg-amber-500/30 transition-colors"
                >
                  🎮 Test Battle Animation
                </button>
              )}
            </div>
          )}
        </div>

        {/* House Standings Sidebar */}
        <div className="p-6 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl" data-guide="house-standings">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-amber-400" size={16} />
            House Standings
          </h4>
          
          <HouseStandings 
            houses={houses} 
            theme={theme}
            sandboxMode={sandboxMode}
            onTriggerBattle={triggerBattle}
            celebratingHouseId={celebratingHouseId}
            previousScores={previousScores}
          />

          {/* Milestones Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Battle Milestones:</div>
            <div className="flex flex-wrap gap-1">
              {BATTLE_MILESTONES.map((milestone) => {
                const maxHouseScore = Math.max(...houses.map(h => h.score || 0), 0);
                const reached = maxHouseScore >= milestone;
                return (
                  <span 
                    key={milestone}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      reached 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-white/5 text-muted-foreground'
                    }`}
                  >
                    {milestone >= 1000 ? `${milestone/1000}k` : milestone}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
