'use client';
import { useState, useRef, useMemo } from 'react';
import { 
  Upload, FileSpreadsheet, Check, X, AlertCircle, Users, Home, 
  Loader2, Download, HelpCircle, AlertTriangle, ChevronDown, 
  ChevronRight, Sparkles, RefreshCw 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FUZZY_COLUMNS, 
  MASCOT_POOL, 
  findBestColumnMatch, 
  normalizeString, 
  stringSimilarity, 
  areNamesSimilar,
  getRandomMascots 
} from '@/constants/defaults';

/**
 * StudentRosterUpload Component
 * 
 * Complete upload system with:
 * - Extensive fuzzy column matching (100+ variations)
 * - Fuzzy duplicate detection
 * - Auto house creation based on grades
 * - School ID tagging
 * - Preview & validation
 * 
 * Props:
 * - schoolId: string - School code from SuperAdmin (tags all students)
 * - houses: array - Existing houses for the school
 * - existingStudents: array - For duplicate detection
 * - existingMascotIds: array - Mascots already used by this school
 * - onUpload: (students, newHouses) => Promise - Upload handler
 * - onCreateHouses: (houses) => Promise - Create houses handler
 */
export default function StudentRosterUpload({
  schoolId,
  houses = [],
  existingStudents = [],
  existingMascotIds = [],
  onUpload,
  onCreateHouses,
}) {
  // File state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [columnMappings, setColumnMappings] = useState({});
  const [columnSuggestions, setColumnSuggestions] = useState({});
  const [unmappedHeaders, setUnmappedHeaders] = useState([]);
  
  // Duplicate detection
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicateDecisions, setDuplicateDecisions] = useState({});
  
  // House creation
  const [detectedGrades, setDetectedGrades] = useState([]);
  const [housesToCreate, setHousesToCreate] = useState([]);
  const [showHousePreview, setShowHousePreview] = useState(false);
  
  // Results
  const [uploadResult, setUploadResult] = useState(null);
  
  const fileInputRef = useRef(null);

  /**
   * Detect column mappings from headers using fuzzy matching
   */
  const detectColumnMappings = (headers) => {
    const mappings = {};
    const suggestions = {};
    const unmapped = [];
    
    const fieldPriority = [
      'full_name', 'first_name', 'last_name', 
      'student_id_number', 'grade_level', 'email', 'house_id', 'homeroom'
    ];
    
    headers.forEach((header, index) => {
      if (!header || typeof header !== 'string') return;
      
      let bestMatch = null;
      let bestConfidence = 0;
      let bestField = null;
      
      for (const fieldName of fieldPriority) {
        if (mappings[fieldName] !== undefined) continue;
        
        const result = findBestColumnMatch(header, fieldName);
        if (result.match && result.confidence > bestConfidence) {
          bestMatch = result;
          bestConfidence = result.confidence;
          bestField = fieldName;
        }
      }
      
      if (bestField && bestConfidence >= 0.6) {
        mappings[bestField] = index;
        if (bestConfidence < 1.0) {
          suggestions[bestField] = {
            originalHeader: header,
            confidence: bestConfidence,
            method: bestMatch.method,
          };
        }
      } else {
        unmapped.push({ header, index });
      }
    });
    
    return { mappings, suggestions, unmapped };
  };

  /**
   * Find potential duplicates using fuzzy matching
   */
  const findDuplicates = (newStudents) => {
    const duplicates = [];
    
    newStudents.forEach((newStudent, newIndex) => {
      for (const existing of existingStudents) {
        if (newStudent.student_id_number && 
            existing.student_id_number === newStudent.student_id_number) {
          duplicates.push({
            type: 'exact_id',
            newStudent,
            newIndex,
            existingStudent: existing,
            confidence: 1.0,
            reason: 'Exact ID match - will update existing',
          });
          break;
        }
        
        if (areNamesSimilar(newStudent.full_name, existing.full_name, 0.85)) {
          const sameGrade = newStudent.grade_level === existing.grade_level;
          const nameSimilarity = stringSimilarity(newStudent.full_name, existing.full_name);
          
          if (nameSimilarity >= 0.85 || (nameSimilarity >= 0.75 && sameGrade)) {
            duplicates.push({
              type: sameGrade ? 'likely_duplicate' : 'possible_duplicate',
              newStudent,
              newIndex,
              existingStudent: existing,
              confidence: nameSimilarity,
              reason: sameGrade 
                ? `Similar name (${Math.round(nameSimilarity * 100)}%), same grade` 
                : `Similar name (${Math.round(nameSimilarity * 100)}%), different grade`,
            });
            break;
          }
        }
        
        if (newStudent.student_id_number && existing.student_id_number) {
          const idSimilarity = stringSimilarity(
            newStudent.student_id_number, 
            existing.student_id_number
          );
          if (idSimilarity >= 0.85 && idSimilarity < 1.0) {
            duplicates.push({
              type: 'similar_id',
              newStudent,
              newIndex,
              existingStudent: existing,
              confidence: idSimilarity,
              reason: `Similar ID (${Math.round(idSimilarity * 100)}% match) - possible typo`,
            });
            break;
          }
        }
      }
      
      for (let otherIndex = 0; otherIndex < newIndex; otherIndex++) {
        const other = newStudents[otherIndex];
        if (areNamesSimilar(newStudent.full_name, other.full_name, 0.9)) {
          duplicates.push({
            type: 'batch_duplicate',
            newStudent,
            newIndex,
            existingStudent: other,
            existingIndex: otherIndex,
            confidence: stringSimilarity(newStudent.full_name, other.full_name),
            reason: 'Duplicate within upload file',
          });
          break;
        }
      }
    });
    
    return duplicates;
  };

  /**
   * Determine houses needed based on grades
   */
  const determineHousesNeeded = (grades) => {
    const existingGradeHouses = new Map();
    houses.forEach(h => {
      if (h.gradeLevel) existingGradeHouses.set(h.gradeLevel, h);
    });
    
    const gradesNeedingHouses = grades.filter(g => !existingGradeHouses.has(g));
    
    if (gradesNeedingHouses.length === 0) {
      return [];
    }
    
    const usedMascotIds = [
      ...existingMascotIds,
      ...houses.map(h => h.mascotId).filter(Boolean)
    ];
    
    const availableMascots = getRandomMascots(gradesNeedingHouses.length, usedMascotIds);
    
    return gradesNeedingHouses.map((grade, index) => {
      const mascot = availableMascots[index] || MASCOT_POOL[index % MASCOT_POOL.length];
      return {
        id: `house-${schoolId}-grade${grade}-${Date.now()}`,
        name: mascot.name,
        mascotId: mascot.id,
        color: mascot.color,
        gradeLevel: grade,
        score: 0,
        schoolId: schoolId,
      };
    });
  };

  /**
   * Parse uploaded file
   */
  const parseFile = async (file) => {
    setIsProcessing(true);
    setValidationErrors([]);
    setPreviewData(null);
    setUploadResult(null);
    setPotentialDuplicates([]);
    setDuplicateDecisions({});
    setHousesToCreate([]);
    setDetectedGrades([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 2) {
        throw new Error('File must have at least a header row and one data row');
      }

      const headers = rows[0].map(h => String(h || '').trim());
      
      const { mappings, suggestions, unmapped } = detectColumnMappings(headers);
      setColumnMappings(mappings);
      setColumnSuggestions(suggestions);
      setUnmappedHeaders(unmapped);
      
      const errors = [];
      
      const hasFullName = mappings.full_name !== undefined;
      const hasFirstLast = mappings.first_name !== undefined && mappings.last_name !== undefined;
      
      if (!hasFullName && !hasFirstLast) {
        errors.push('Could not detect name column. Expected: full_name, name, student_name, first_name+last_name, nombre, etc.');
      }
      
      if (mappings.grade_level === undefined) {
        errors.push('Could not detect grade column. Expected: grade, grade_level, gr, level, year, grado, etc.');
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsProcessing(false);
        return;
      }

      const students = [];
      const gradeSet = new Set();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        let fullName = '';
        if (hasFullName && row[mappings.full_name]) {
          fullName = String(row[mappings.full_name] || '').trim();
        } else if (hasFirstLast) {
          const first = String(row[mappings.first_name] || '').trim();
          const last = String(row[mappings.last_name] || '').trim();
          fullName = `${first} ${last}`.trim();
        }
        
        if (!fullName) continue;

        const gradeRaw = mappings.grade_level !== undefined ? row[mappings.grade_level] : null;
        let gradeLevel = null;
        if (gradeRaw !== null && gradeRaw !== undefined && gradeRaw !== '') {
          const parsed = parseInt(String(gradeRaw).replace(/[^0-9]/g, ''));
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
            gradeLevel = parsed;
            gradeSet.add(parsed);
          }
        }

        const student = {
          full_name: fullName,
          student_id_number: mappings.student_id_number !== undefined
            ? String(row[mappings.student_id_number] || '').trim() || `AUTO-${Date.now()}-${i}`
            : `AUTO-${Date.now()}-${i}`,
          grade_level: gradeLevel,
          email: mappings.email !== undefined
            ? String(row[mappings.email] || '').trim().toLowerCase() || null
            : null,
          schoolId: schoolId,
          houseId: null,
          infraction_count: 0,
          tardy_count: 0,
          tardy_streak: 0,
          incentive_points_student: 0,
          incentive_points_team: 0,
          status: 'IN',
          _rowNumber: i + 1,
        };

        students.push(student);
      }

      const duplicates = findDuplicates(students);
      setPotentialDuplicates(duplicates);
      
      const decisions = {};
      duplicates.forEach((dup, i) => {
        decisions[i] = dup.type === 'exact_id' ? 'update' : 'review';
      });
      setDuplicateDecisions(decisions);

      const grades = [...gradeSet].sort((a, b) => a - b);
      setDetectedGrades(grades);
      
      const newHouses = determineHousesNeeded(grades);
      setHousesToCreate(newHouses);
      if (newHouses.length > 0) {
        setShowHousePreview(true);
      }

      setPreviewData({
        students,
        grades,
        totalRows: rows.length - 1,
        headers,
        fileName: file.name,
      });

    } catch (err) {
      console.error('Parse error:', err);
      setValidationErrors([err.message || 'Failed to parse file']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  /**
   * Get grade-to-house mapping (existing + new)
   */
  const getGradeHouseMap = useMemo(() => {
    const map = new Map();
    
    houses.forEach(h => {
      if (h.gradeLevel) map.set(h.gradeLevel, h.id);
    });
    
    housesToCreate.forEach(h => {
      if (h.gradeLevel) map.set(h.gradeLevel, h.id);
    });
    
    return map;
  }, [houses, housesToCreate]);

  /**
   * Get students to upload (with house assignments, excluding skipped)
   */
  const getStudentsToUpload = () => {
    if (!previewData?.students) return [];
    
    const skipIndices = new Set();
    potentialDuplicates.forEach((dup, i) => {
      if (duplicateDecisions[i] === 'skip') {
        skipIndices.add(dup.newIndex);
      }
    });
    
    return previewData.students
      .filter((_, i) => !skipIndices.has(i))
      .map(student => ({
        ...student,
        houseId: student.grade_level ? getGradeHouseMap.get(student.grade_level) || null : null,
      }));
  };

  /**
   * Refresh house mascot assignments
   */
  const refreshHouseMascots = () => {
    const newHouses = determineHousesNeeded(detectedGrades);
    setHousesToCreate(newHouses);
  };

  /**
   * Upload students
   */
  const handleUpload = async () => {
    const studentsToUpload = getStudentsToUpload();
    if (studentsToUpload.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (housesToCreate.length > 0) {
        setUploadProgress(10);
        await onCreateHouses?.(housesToCreate);
        setUploadProgress(30);
      }

      const cleanStudents = studentsToUpload.map(({ _rowNumber, ...s }) => s);

      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 5, 90));
      }, 200);

      await onUpload?.(cleanStudents, housesToCreate);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const skipped = potentialDuplicates.filter((_, i) => duplicateDecisions[i] === 'skip').length;
      const withHouses = cleanStudents.filter(s => s.houseId).length;
      
      setUploadResult({
        success: true,
        imported: cleanStudents.length,
        skipped,
        withHouses,
        housesCreated: housesToCreate.length,
      });

      setTimeout(() => {
        setPreviewData(null);
        setUploadResult(null);
        setHousesToCreate([]);
      }, 5000);

    } catch (err) {
      console.error('Upload error:', err);
      setUploadResult({ success: false, error: err.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['full_name', 'student_id_number', 'grade_level', 'email'],
      ['John Smith', '12345', '6', 'jsmith@school.edu'],
      ['Jane Doe', '12346', '7', 'jdoe@school.edu'],
      ['Bob Wilson', '12347', '8', 'bwilson@school.edu'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_roster_template.xlsx');
  };

  const studentsToUpload = getStudentsToUpload();
  const allHouses = [...houses, ...housesToCreate];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Upload className="text-primary" size={20} />
            Upload Student Roster
          </h3>
          <p className="text-sm text-muted-foreground">
            Smart column detection • Auto house creation • School: <strong>{schoolId}</strong>
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 bg-accent border border-border rounded-lg text-sm flex items-center gap-2 hover:bg-accent/80"
        >
          <Download size={14} /> Template
        </button>
      </div>

      {/* Upload Area */}
      {!previewData && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          
          {isProcessing ? (
            <div className="py-8">
              <Loader2 size={40} className="mx-auto mb-4 text-primary animate-spin" />
              <p className="text-muted-foreground">Processing file with smart detection...</p>
            </div>
          ) : (
            <>
              <FileSpreadsheet size={40} className="mx-auto mb-4 text-muted-foreground" />
              <p className="font-bold mb-2">Drag & drop your roster file</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <p className="text-xs text-muted-foreground">
                Supports: .xlsx, .xls, .csv • Columns auto-detected
              </p>
            </>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-red-400">
            <AlertCircle size={18} />
            <span className="font-bold">Could Not Process File</span>
          </div>
          <ul className="text-sm text-red-300 space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {previewData && !uploadResult?.success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Column Detection Summary */}
            {Object.keys(columnSuggestions).length > 0 && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Sparkles size={18} />
                  <span className="font-bold">Smart Column Detection</span>
                </div>
                <div className="text-sm text-emerald-300 space-y-1">
                  {Object.entries(columnSuggestions).map(([col, info]) => (
                    <div key={col} className="flex items-center gap-2">
                      <span className="opacity-60">"{info.originalHeader}"</span>
                      <span>→</span>
                      <strong>{col.replace(/_/g, ' ')}</strong>
                      <span className="px-2 py-0.5 bg-emerald-500/20 rounded-full text-xs">
                        {Math.round(info.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 bg-accent rounded-xl text-center">
                <div className="text-2xl font-black text-primary">{studentsToUpload.length}</div>
                <div className="text-xs text-muted-foreground">To Import</div>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                <div className="text-2xl font-black text-amber-400">{potentialDuplicates.length}</div>
                <div className="text-xs text-muted-foreground">Duplicates</div>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
                <div className="text-2xl font-black text-purple-400">{detectedGrades.length}</div>
                <div className="text-xs text-muted-foreground">Grades</div>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
                <div className="text-2xl font-black text-blue-400">{houses.length}</div>
                <div className="text-xs text-muted-foreground">Existing Houses</div>
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-400">{housesToCreate.length}</div>
                <div className="text-xs text-muted-foreground">New Houses</div>
              </div>
            </div>

            {/* New Houses Preview */}
            {housesToCreate.length > 0 && (
              <div className="border border-emerald-500/30 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowHousePreview(!showHousePreview)}
                  className="w-full p-4 bg-emerald-500/10 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Home size={18} />
                    <span className="font-bold">
                      {housesToCreate.length} New Houses Will Be Created
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); refreshHouseMascots(); }}
                      className="p-1 hover:bg-emerald-500/20 rounded"
                      title="Shuffle mascots"
                    >
                      <RefreshCw size={16} />
                    </button>
                    {showHousePreview ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {showHousePreview && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {housesToCreate.map((house) => {
                          const mascot = MASCOT_POOL.find(m => m.id === house.mascotId);
                          return (
                            <div 
                              key={house.id}
                              className="p-4 rounded-xl border text-center"
                              style={{ 
                                backgroundColor: `${house.color}15`,
                                borderColor: `${house.color}40`,
                              }}
                            >
                              <div className="text-3xl mb-2">{mascot?.emoji || '🏠'}</div>
                              <div className="font-bold text-sm" style={{ color: house.color }}>
                                {house.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Grade {house.gradeLevel}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="px-4 pb-4">
                        <p className="text-xs text-muted-foreground text-center">
                          Mascot SVGs are permanent. House names can be edited later by admins.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Duplicates Review */}
            {potentialDuplicates.length > 0 && (
              <div className="border border-amber-500/30 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowDuplicates(!showDuplicates)}
                  className="w-full p-4 bg-amber-500/10 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle size={18} />
                    <span className="font-bold">
                      {potentialDuplicates.length} Potential Duplicates
                    </span>
                  </div>
                  {showDuplicates ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                
                <AnimatePresence>
                  {showDuplicates && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                        {potentialDuplicates.map((dup, i) => (
                          <div key={i} className="p-3 bg-card rounded-lg border border-border">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-amber-400">{dup.reason}</div>
                                <div className="text-sm mt-1">
                                  <span className="text-muted-foreground">New:</span>{' '}
                                  {dup.newStudent.full_name} 
                                  <span className="text-muted-foreground ml-1">
                                    (ID: {dup.newStudent.student_id_number}, Gr {dup.newStudent.grade_level})
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Existing:</span>{' '}
                                  {dup.existingStudent.full_name}
                                  <span className="text-muted-foreground ml-1">
                                    (ID: {dup.existingStudent.student_id_number}, Gr {dup.existingStudent.grade_level})
                                  </span>
                                </div>
                              </div>
                              <select
                                value={duplicateDecisions[i] || 'review'}
                                onChange={(e) => setDuplicateDecisions(prev => ({
                                  ...prev,
                                  [i]: e.target.value
                                }))}
                                className="px-3 py-1 bg-accent border border-border rounded-lg text-sm min-w-[140px]"
                              >
                                <option value="skip">Skip</option>
                                <option value="update">Update existing</option>
                                <option value="import">Import as new</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="p-3 bg-accent border-b border-border flex items-center justify-between">
                <span className="font-bold text-sm">Preview (first 10)</span>
                <span className="text-xs text-muted-foreground">
                  All students tagged with school: {schoolId}
                </span>
              </div>
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Grade</th>
                      <th className="p-2 text-left">House</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsToUpload.slice(0, 10).map((student, i) => {
                      const house = allHouses.find(h => h.id === student.houseId);
                      return (
                        <tr key={i} className="border-b border-border hover:bg-accent/30">
                          <td className="p-2">{student.full_name}</td>
                          <td className="p-2 font-mono text-xs">{student.student_id_number}</td>
                          <td className="p-2">{student.grade_level || '-'}</td>
                          <td className="p-2">
                            {house ? (
                              <span 
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ backgroundColor: `${house.color}20`, color: house.color }}
                              >
                                {house.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPreviewData(null);
                  setValidationErrors([]);
                  setPotentialDuplicates([]);
                  setHousesToCreate([]);
                }}
                className="flex-1 py-3 bg-accent border border-border rounded-xl font-bold"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || studentsToUpload.length === 0}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {uploadProgress < 30 ? 'Creating houses...' : `Uploading... ${uploadProgress}%`}
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Import {studentsToUpload.length} Students
                    {housesToCreate.length > 0 && ` + ${housesToCreate.length} Houses`}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Result */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-6 rounded-xl text-center ${
              uploadResult.success
                ? 'bg-emerald-500/20 border border-emerald-500/50'
                : 'bg-red-500/20 border border-red-500/50'
            }`}
          >
            {uploadResult.success ? (
              <>
                <Check size={48} className="mx-auto mb-4 text-emerald-400" />
                <h4 className="text-xl font-black text-emerald-400 mb-2">Upload Complete!</h4>
                <p className="text-emerald-300">
                  {uploadResult.imported} students imported
                  {uploadResult.housesCreated > 0 && ` • ${uploadResult.housesCreated} houses created`}
                  {uploadResult.withHouses > 0 && ` • ${uploadResult.withHouses} assigned to houses`}
                  {uploadResult.skipped > 0 && ` • ${uploadResult.skipped} skipped`}
                </p>
              </>
            ) : (
              <>
                <X size={48} className="mx-auto mb-4 text-red-400" />
                <h4 className="text-xl font-black text-red-400 mb-2">Upload Failed</h4>
                <p className="text-red-300">{uploadResult.error}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-300">
        <div className="flex items-start gap-3">
          <HelpCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-2">Smart Features</p>
            <ul className="space-y-1 text-blue-300/80">
              <li>• <strong>Auto Column Detection:</strong> Recognizes 100+ variations (name, nombre, student_name, etc.)</li>
              <li>• <strong>Fuzzy Duplicate Check:</strong> Catches "Jon Smith" vs "John Smith" typos</li>
              <li>• <strong>Auto House Creation:</strong> Creates houses based on grades found in data</li>
              <li>• <strong>Random Mascots:</strong> Each grade gets a unique mascot (12 available)</li>
              <li>• <strong>School Tagging:</strong> All students tagged with school ID: {schoolId}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
