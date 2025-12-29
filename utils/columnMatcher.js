/**
 * Fuzzy Column Matcher for Excel/CSV uploads
 * Automatically detects and maps column names to expected fields
 */

/**
 * Column name variations for each field
 * Includes common variations, typos, and multilingual options
 */
const COLUMN_MAPPINGS = {
  studentId: [
    // Standard
    'id', 'ID', 'Id',
    'student_id', 'studentid', 'StudentId', 'StudentID', 'STUDENT_ID',
    'student_id_number', 'studentidnumber', 'StudentIdNumber',
    // Variations
    'stu_id', 'stuid', 'StuId', 'StuID', 'Stu ID', 'Stu_ID',
    'sid', 'SID', 'Sid',
    'student #', 'student#', 'Student #', 'Student#',
    'student number', 'studentnumber', 'Student Number', 'StudentNumber', 'STUDENT NUMBER',
    'student no', 'studentno', 'Student No', 'StudentNo', 'Student No.',
    'pupil id', 'pupilid', 'Pupil ID', 'PupilID', 'Pupil Id',
    'enrollment id', 'enrollmentid', 'Enrollment ID', 'EnrollmentID',
    'school id', 'schoolid', 'School ID',
    'student identifier', 'studentidentifier', 'Student Identifier',
    'unique id', 'uniqueid', 'Unique ID', 'UniqueID', 'UID', 'uid',
    'student code', 'studentcode', 'Student Code', 'StudentCode',
    'code', 'Code', 'CODE',
    'number', 'Number', 'NUMBER', 'num', 'Num', 'NUM',
    'no', 'No', 'NO', 'no.', 'No.',
    '#', 'identifier', 'Identifier',
    'local_id', 'localid', 'Local ID', 'LocalID',
    'state_id', 'stateid', 'State ID', 'StateID',
    'district_id', 'districtid', 'District ID', 'DistrictID',
    'student id number', 'Student ID Number',
    'id number', 'ID Number', 'idnumber', 'IDNumber',
    'osis', 'OSIS', 'Osis', // NYC specific
    'ssid', 'SSID', // State Student ID
    'local id', 'Local Id',
  ],
  
  fullName: [
    // Standard
    'name', 'Name', 'NAME',
    'full_name', 'fullname', 'FullName', 'Full Name', 'FULL_NAME', 'FULL NAME',
    'student_name', 'studentname', 'StudentName', 'Student Name', 'STUDENT_NAME', 'STUDENT NAME',
    // Variations
    'pupil_name', 'pupilname', 'PupilName', 'Pupil Name',
    'complete_name', 'completename', 'CompleteName', 'Complete Name',
    'legal_name', 'legalname', 'LegalName', 'Legal Name',
    'display_name', 'displayname', 'DisplayName', 'Display Name',
    'student', 'Student', 'STUDENT',
    'pupil', 'Pupil', 'PUPIL',
    'child name', 'Child Name', 'childname', 'ChildName',
    'learner name', 'Learner Name', 'learnername', 'LearnerName',
    // Spanish
    'nombre', 'Nombre', 'NOMBRE',
    'nombre completo', 'Nombre Completo', 'nombrecompleto',
    // Combined indicators
    'student full name', 'Student Full Name',
  ],
  
  firstName: [
    'first', 'First', 'FIRST',
    'first_name', 'firstname', 'FirstName', 'First Name', 'FIRST_NAME', 'FIRST NAME',
    'fname', 'FName', 'FNAME', 'f_name', 'F_Name',
    'given_name', 'givenname', 'GivenName', 'Given Name',
    'forename', 'Forename', 'FORENAME',
    // Spanish
    'primer nombre', 'Primer Nombre', 'primernombre',
    'nombre de pila', 'Nombre de Pila',
  ],
  
  lastName: [
    'last', 'Last', 'LAST',
    'last_name', 'lastname', 'LastName', 'Last Name', 'LAST_NAME', 'LAST NAME',
    'lname', 'LName', 'LNAME', 'l_name', 'L_Name',
    'surname', 'Surname', 'SURNAME',
    'family_name', 'familyname', 'FamilyName', 'Family Name',
    // Spanish
    'apellido', 'Apellido', 'APELLIDO',
    'apellidos', 'Apellidos',
  ],
  
  middleName: [
    'middle', 'Middle', 'MIDDLE',
    'middle_name', 'middlename', 'MiddleName', 'Middle Name', 'MIDDLE_NAME',
    'mname', 'MName', 'MNAME', 'm_name',
    'middle initial', 'Middle Initial', 'middleinitial',
    'mi', 'MI', 'Mi',
  ],
  
  grade: [
    'grade', 'Grade', 'GRADE',
    'gr', 'Gr', 'GR',
    'grade_level', 'gradelevel', 'GradeLevel', 'Grade Level', 'GRADE_LEVEL', 'GRADE LEVEL',
    'year', 'Year', 'YEAR',
    'class', 'Class', 'CLASS',
    'form', 'Form', 'FORM',
    'level', 'Level', 'LEVEL',
    'lvl', 'Lvl', 'LVL',
    'grade lvl', 'Grade Lvl', 'gradelvl', 'GradeLvl',
    'school_year', 'schoolyear', 'SchoolYear', 'School Year',
    'grade level', 'Grade Level',
    'yr', 'Yr', 'YR',
    'current grade', 'Current Grade', 'currentgrade',
    'student grade', 'Student Grade', 'studentgrade',
    // Spanish
    'grado', 'Grado', 'GRADO',
    'nivel', 'Nivel', 'NIVEL',
  ],
  
  email: [
    'email', 'Email', 'EMAIL', 'e-mail', 'E-mail', 'E-Mail',
    'email_address', 'emailaddress', 'EmailAddress', 'Email Address',
    'student_email', 'studentemail', 'StudentEmail', 'Student Email',
    'mail', 'Mail', 'MAIL',
    'correo', 'Correo', // Spanish
  ],
  
  homeroom: [
    'homeroom', 'Homeroom', 'HOMEROOM',
    'home_room', 'home room', 'Home Room',
    'hr', 'HR', 'Hr',
    'advisory', 'Advisory', 'ADVISORY',
    'section', 'Section', 'SECTION',
    'class', 'Class',
    'classroom', 'Classroom',
    'room', 'Room',
    'period', 'Period',
  ],
};

/**
 * Normalize a string for comparison
 * @param {string} str - Input string
 * @returns {string} Normalized string
 */
function normalize(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Find the best matching field for a column name
 * @param {string} columnName - Column name from spreadsheet
 * @returns {string|null} Matched field name or null
 */
function findFieldMatch(columnName) {
  const normalizedColumn = normalize(columnName);
  
  for (const [fieldName, variations] of Object.entries(COLUMN_MAPPINGS)) {
    for (const variation of variations) {
      if (normalize(variation) === normalizedColumn) {
        return fieldName;
      }
    }
  }
  
  // Fuzzy partial matching as fallback
  for (const [fieldName, variations] of Object.entries(COLUMN_MAPPINGS)) {
    for (const variation of variations) {
      const normalizedVariation = normalize(variation);
      if (normalizedColumn.includes(normalizedVariation) || 
          normalizedVariation.includes(normalizedColumn)) {
        return fieldName;
      }
    }
  }
  
  return null;
}

/**
 * Detect column mappings from spreadsheet headers
 * @param {Object} firstRow - First row of data (used for header detection)
 * @returns {Object} Mapping of detected fields to column names
 */
export function detectColumnMappings(firstRow) {
  const mappings = {};
  const columns = Object.keys(firstRow);
  
  for (const column of columns) {
    const field = findFieldMatch(column);
    if (field && !mappings[field]) {
      mappings[field] = column;
    }
  }
  
  return mappings;
}

/**
 * Check if required columns are present
 * @param {Object} mappings - Detected column mappings
 * @returns {Object} Validation result with isValid and missing fields
 */
export function validateRequiredColumns(mappings) {
  const hasName = mappings.fullName || (mappings.firstName && mappings.lastName);
  const hasId = !!mappings.studentId;
  
  const missing = [];
  if (!hasName) missing.push('name (full_name, or first_name + last_name)');
  if (!hasId) missing.push('student ID');
  
  return {
    isValid: hasName && hasId,
    missing,
    hasFirstLastSeparate: !mappings.fullName && mappings.firstName && mappings.lastName,
  };
}

/**
 * Extract and normalize student data from a row
 * @param {Object} row - Data row
 * @param {Object} mappings - Column mappings
 * @returns {Object} Normalized student object
 */
export function extractStudentData(row, mappings) {
  // Build full name from first/last if needed
  let fullName = '';
  if (mappings.fullName) {
    fullName = String(row[mappings.fullName] || '').trim();
  } else if (mappings.firstName || mappings.lastName) {
    const first = String(row[mappings.firstName] || '').trim();
    const middle = mappings.middleName ? String(row[mappings.middleName] || '').trim() : '';
    const last = String(row[mappings.lastName] || '').trim();
    fullName = [first, middle, last].filter(Boolean).join(' ');
  }
  
  // Extract and normalize student ID
  let studentId = '';
  if (mappings.studentId) {
    studentId = String(row[mappings.studentId] || '').trim();
    // Remove common prefixes/formatting
    studentId = studentId.replace(/^(stu|student|id|#|:|\s)+/i, '').trim();
  }
  
  // Extract grade level
  let gradeLevel = 9; // Default
  if (mappings.grade) {
    const gradeValue = row[mappings.grade];
    if (gradeValue !== undefined && gradeValue !== null) {
      // Handle various grade formats
      const gradeStr = String(gradeValue).trim().toLowerCase();
      
      // Check for kindergarten
      if (gradeStr === 'k' || gradeStr === 'kg' || gradeStr === 'kindergarten') {
        gradeLevel = 0;
      } else if (gradeStr === 'pk' || gradeStr === 'pre-k' || gradeStr === 'prek') {
        gradeLevel = -1;
      } else {
        // Extract number from grade (handles "9th", "Grade 9", "9", etc.)
        const numMatch = gradeStr.match(/\d+/);
        if (numMatch) {
          gradeLevel = parseInt(numMatch[0], 10);
        }
      }
    }
  }
  
  // Extract optional fields
  const email = mappings.email ? String(row[mappings.email] || '').trim() : '';
  const homeroom = mappings.homeroom ? String(row[mappings.homeroom] || '').trim() : '';
  
  return {
    full_name: fullName,
    student_id_number: studentId,
    grade_level: gradeLevel,
    email: email || null,
    homeroom: homeroom || null,
    // Initialize tracking fields
    status: 'IN',
    houseId: null,
    mtss_score: 0,
    infraction_count: 0,
    tardy_count: 0,
    tardy_streak: 0,
    incentive_points_student: 0,
    incentive_points_team: 0,
  };
}

/**
 * Process spreadsheet data into normalized student objects
 * @param {Array} rows - Array of data rows
 * @returns {Object} Result with students array and metadata
 */
export function processSpreadsheetData(rows) {
  if (!rows || rows.length === 0) {
    return {
      success: false,
      error: 'No data found in file',
      students: [],
    };
  }
  
  // Detect column mappings from first row
  const mappings = detectColumnMappings(rows[0]);
  
  // Validate required columns
  const validation = validateRequiredColumns(mappings);
  if (!validation.isValid) {
    return {
      success: false,
      error: `Missing required columns: ${validation.missing.join(', ')}`,
      students: [],
      detectedColumns: Object.keys(mappings),
    };
  }
  
  // Process all rows
  const students = [];
  const errors = [];
  const grades = new Set();
  
  for (let i = 0; i < rows.length; i++) {
    try {
      const student = extractStudentData(rows[i], mappings);
      
      // Validate extracted data
      if (!student.full_name || !student.student_id_number) {
        errors.push(`Row ${i + 2}: Missing name or ID`);
        continue;
      }
      
      students.push(student);
      grades.add(student.grade_level);
    } catch (err) {
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }
  
  return {
    success: true,
    students,
    grades: Array.from(grades).sort((a, b) => a - b),
    mappings,
    errors: errors.length > 0 ? errors : null,
    stats: {
      total: rows.length,
      processed: students.length,
      skipped: rows.length - students.length,
    },
  };
}

export default {
  detectColumnMappings,
  validateRequiredColumns,
  extractStudentData,
  processSpreadsheetData,
};
