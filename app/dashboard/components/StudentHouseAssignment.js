'use client';
import { useState, useMemo } from 'react';
import { Users, Home, Search, Check, Loader2, Shuffle, Filter, ChevronDown, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMascotById, fuzzySearchStudents } from '@/constants/defaults';
import { getMascotSVG } from './HouseStandings';

/**
 * StudentHouseAssignment Component
 * 
 * Admin interface for:
 * - Viewing all students and house assignments
 * - Assigning individual students to houses
 * - Bulk assigning students by grade
 * - Auto-balancing houses
 * - Reassigning students between houses
 * 
 * Props:
 * - students: array - All students
 * - houses: array - All houses
 * - onAssignStudent: (studentId, houseId) => Promise
 * - onBulkAssign: (assignments) => Promise - [{studentId, houseId}]
 * - onUpdateHouseName: (houseId, newName) => Promise - Edit house label
 */
export default function StudentHouseAssignment({
  students = [],
  houses = [],
  onAssignStudent,
  onBulkAssign,
  onUpdateHouseName,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterHouse, setFilterHouse] = useState('all');
  const [filterAssignment, setFilterAssignment] = useState('all');
  
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [targetHouse, setTargetHouse] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStudent, setProcessingStudent] = useState(null);
  
  const [editingHouse, setEditingHouse] = useState(null);
  const [editHouseName, setEditHouseName] = useState('');

  const grades = useMemo(() => {
    const gradeSet = new Set(students.map(s => s.grade_level).filter(Boolean));
    return [...gradeSet].sort((a, b) => a - b);
  }, [students]);

  const filteredStudents = useMemo(() => {
    let results = students;
    
    if (searchQuery.length >= 2) {
      results = fuzzySearchStudents(students, searchQuery, 100);
    }
    
    return results.filter(student => {
      if (filterGrade !== 'all' && student.grade_level !== parseInt(filterGrade)) return false;
      if (filterHouse !== 'all' && student.houseId !== filterHouse) return false;
      if (filterAssignment === 'assigned' && !student.houseId) return false;
      if (filterAssignment === 'unassigned' && student.houseId) return false;
      return true;
    });
  }, [students, searchQuery, filterGrade, filterHouse, filterAssignment]);

  const stats = useMemo(() => {
    const total = students.length;
    const assigned = students.filter(s => s.houseId).length;
    const unassigned = total - assigned;
    
    const byHouse = {};
    houses.forEach(h => {
      byHouse[h.id] = students.filter(s => s.houseId === h.id).length;
    });
    
    return { total, assigned, unassigned, byHouse };
  }, [students, houses]);

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
    setSelectAll(!selectAll);
  };

  const assignStudent = async (studentId, houseId) => {
    setProcessingStudent(studentId);
    try {
      await onAssignStudent?.(studentId, houseId || null);
    } catch (err) {
      console.error('Assignment error:', err);
    } finally {
      setProcessingStudent(null);
    }
  };

  const bulkAssignSelected = async () => {
    if (!targetHouse || selectedStudents.size === 0) return;
    
    setIsProcessing(true);
    try {
      const assignments = [...selectedStudents].map(studentId => ({
        studentId,
        houseId: targetHouse,
      }));
      await onBulkAssign?.(assignments);
      setSelectedStudents(new Set());
      setShowBulkAssign(false);
      setTargetHouse(null);
    } catch (err) {
      console.error('Bulk assignment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const autoBalance = async () => {
    const unassigned = students.filter(s => !s.houseId);
    if (unassigned.length === 0 || houses.length === 0) return;
    
    setIsProcessing(true);
    try {
      const shuffled = [...unassigned].sort(() => Math.random() - 0.5);
      const assignments = shuffled.map((student, i) => ({
        studentId: student.id,
        houseId: houses[i % houses.length].id,
      }));
      await onBulkAssign?.(assignments);
    } catch (err) {
      console.error('Auto-balance error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveHouseName = async () => {
    if (!editingHouse || !editHouseName.trim()) return;
    try {
      await onUpdateHouseName?.(editingHouse, editHouseName.trim());
      setEditingHouse(null);
      setEditHouseName('');
    } catch (err) {
      console.error('Update house name error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-accent rounded-xl text-center">
          <div className="text-2xl font-black text-primary">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Students</div>
        </div>
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
          <div className="text-2xl font-black text-emerald-400">{stats.assigned}</div>
          <div className="text-xs text-muted-foreground">Assigned</div>
        </div>
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
          <div className="text-2xl font-black text-amber-400">{stats.unassigned}</div>
          <div className="text-xs text-muted-foreground">Unassigned</div>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
          <div className="text-2xl font-black text-purple-400">{houses.length}</div>
          <div className="text-xs text-muted-foreground">Houses</div>
        </div>
      </div>

      <div className="p-4 bg-accent border border-border rounded-xl">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <Home size={16} className="text-primary" />
          House Distribution
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {houses.map(house => {
            const mascot = getMascotById(house.mascotId);
            const MascotSVG = getMascotSVG(house.mascotId);
            const isEditing = editingHouse === house.id;
            
            return (
              <div 
                key={house.id}
                className="p-3 rounded-xl border text-center relative group"
                style={{ backgroundColor: `${house.color}10`, borderColor: `${house.color}30` }}
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${house.color}20` }}>
                  <MascotSVG color={house.color} size={40} isLeader={false} isCelebrating={false} />
                </div>
                
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editHouseName}
                      onChange={(e) => setEditHouseName(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-center"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveHouseName()}
                    />
                    <button onClick={saveHouseName} className="p-1 hover:bg-white/10 rounded">
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="font-bold text-sm cursor-pointer hover:underline flex items-center justify-center gap-1"
                    style={{ color: house.color }}
                    onClick={() => { setEditingHouse(house.id); setEditHouseName(house.name); }}
                  >
                    {house.name}
                    <Edit3 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">Grade {house.gradeLevel}</div>
                <div className="text-xl font-black mt-1">{stats.byHouse[house.id] || 0}</div>
                <div className="text-xs text-muted-foreground">students</div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          💡 Click house name to edit. Mascot SVGs are permanent.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={autoBalance}
          disabled={isProcessing || stats.unassigned === 0}
          className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-500/30 disabled:opacity-50"
        >
          <Shuffle size={14} /> Auto-Balance ({stats.unassigned} unassigned)
        </button>
        {selectedStudents.size > 0 && (
          <button
            onClick={() => setShowBulkAssign(true)}
            className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-500/30"
          >
            <Users size={14} /> Assign {selectedStudents.size} Selected
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students (fuzzy)..."
            className="w-full pl-10 pr-4 py-2 bg-accent border border-border rounded-lg text-sm"
          />
        </div>

        <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="px-3 py-2 bg-accent border border-border rounded-lg text-sm">
          <option value="all">All Grades</option>
          {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>

        <select value={filterHouse} onChange={(e) => setFilterHouse(e.target.value)} className="px-3 py-2 bg-accent border border-border rounded-lg text-sm">
          <option value="all">All Houses</option>
          {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>

        <select value={filterAssignment} onChange={(e) => setFilterAssignment(e.target.value)} className="px-3 py-2 bg-accent border border-border rounded-lg text-sm">
          <option value="all">All Students</option>
          <option value="assigned">Assigned Only</option>
          <option value="unassigned">Unassigned Only</option>
        </select>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="p-3 bg-accent border-b border-border flex items-center gap-3">
          <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-4 h-4 rounded" />
          <span className="text-sm font-bold">{filteredStudents.length} students {selectedStudents.size > 0 && `(${selectedStudents.size} selected)`}</span>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>No students match your filters</p>
            </div>
          ) : (
            filteredStudents.map(student => {
              const house = houses.find(h => h.id === student.houseId);
              const isSelected = selectedStudents.has(student.id);
              const isProcessingThis = processingStudent === student.id;
              const MascotSVG = house ? getMascotSVG(house.mascotId) : null;
              
              return (
                <div 
                  key={student.id}
                  className={`p-3 border-b border-border flex items-center gap-3 hover:bg-accent/50 ${isSelected ? 'bg-primary/5' : ''}`}
                >
                  <input type="checkbox" checked={isSelected} onChange={() => toggleStudent(student.id)} className="w-4 h-4 rounded" />
                  
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                    {student.full_name?.charAt(0)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{student.full_name}</div>
                    <div className="text-xs text-muted-foreground">ID: {student.student_id_number} • Grade {student.grade_level || '-'}</div>
                  </div>

                  {house ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${house.color}20`, color: house.color }}>
                      <div className="w-5 h-5">{MascotSVG && <MascotSVG color={house.color} size={20} isLeader={false} isCelebrating={false} />}</div>
                      {house.name}
                    </div>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">Unassigned</span>
                  )}

                  <div className="relative">
                    {isProcessingThis ? (
                      <Loader2 size={18} className="animate-spin text-primary" />
                    ) : (
                      <select
                        value={student.houseId || ''}
                        onChange={(e) => assignStudent(student.id, e.target.value || null)}
                        className="px-2 py-1 bg-accent border border-border rounded-lg text-xs appearance-none pr-6 cursor-pointer min-w-[100px]"
                      >
                        <option value="">No House</option>
                        {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {showBulkAssign && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowBulkAssign(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="text-primary" size={20} />
                Assign {selectedStudents.size} Students
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {houses.map(house => {
                  const MascotSVG = getMascotSVG(house.mascotId);
                  return (
                    <button
                      key={house.id}
                      onClick={() => setTargetHouse(house.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${targetHouse === house.id ? 'border-primary bg-primary/20' : 'border-border hover:border-primary/50'}`}
                    >
                      <div className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${house.color}20` }}>
                        <MascotSVG color={house.color} size={40} isLeader={false} isCelebrating={false} />
                      </div>
                      <div className="font-bold text-sm" style={{ color: house.color }}>{house.name}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowBulkAssign(false)} className="flex-1 py-3 bg-accent border border-border rounded-xl font-bold" disabled={isProcessing}>Cancel</button>
                <button onClick={bulkAssignSelected} disabled={!targetHouse || isProcessing} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {isProcessing ? <><Loader2 className="animate-spin" size={18} />Assigning...</> : <><Check size={18} />Assign All</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
