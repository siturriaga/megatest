/**
 * @jest-environment node
 */
import {
  getMTSSTier,
  getEstimatedDuration,
  formatDuration,
  getMascotById,
  getRandomMascot,
  getRandomMascots,
  levenshteinDistance,
  stringSimilarity,
  normalizeString,
  areNamesSimilar,
  findBestColumnMatch,
  fuzzySearchStudents,
  generateHousesFromGrades,
  assignHouseByGrade,
  autoBalanceHouses,
  ALERT_LEVELS,
  DEFAULT_HOUSES,
  MASCOT_POOL,
  MTSS_TIERS,
} from '../../constants/defaults';

describe('defaults.js exports', () => {
  describe('ALERT_LEVELS', () => {
    test('should have NORMAL, HOLD, and LOCKDOWN levels', () => {
      expect(ALERT_LEVELS.NORMAL).toBeDefined();
      expect(ALERT_LEVELS.HOLD).toBeDefined();
      expect(ALERT_LEVELS.LOCKDOWN).toBeDefined();
    });

    test('NORMAL should allow passes', () => {
      expect(ALERT_LEVELS.NORMAL.passesAllowed).toBe(true);
    });

    test('LOCKDOWN should not allow passes', () => {
      expect(ALERT_LEVELS.LOCKDOWN.passesAllowed).toBe(false);
    });
  });

  describe('getMTSSTier', () => {
    test('should return Tier 1 for score 0-5', () => {
      expect(getMTSSTier(0).label).toBe('Tier 1');
      expect(getMTSSTier(3).label).toBe('Tier 1');
      expect(getMTSSTier(5).label).toBe('Tier 1');
    });

    test('should return Tier 2 for score 6-9', () => {
      expect(getMTSSTier(6).label).toBe('Tier 2');
      expect(getMTSSTier(9).label).toBe('Tier 2');
    });

    test('should return Tier 3 for score 10+', () => {
      expect(getMTSSTier(10).label).toBe('Tier 3');
      expect(getMTSSTier(100).label).toBe('Tier 3');
    });
  });

  describe('getEstimatedDuration', () => {
    test('should return correct duration for known destinations', () => {
      expect(getEstimatedDuration('Bathroom')).toBe(5);
      expect(getEstimatedDuration('Water')).toBe(2);
      expect(getEstimatedDuration('Library')).toBe(15);
    });

    test('should return default duration for unknown destination', () => {
      expect(getEstimatedDuration('Unknown Place')).toBe(10);
    });
  });

  describe('formatDuration', () => {
    test('should format seconds as MM:SS', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(125)).toBe('2:05');
    });
  });

  describe('getMascotById', () => {
    test('should return correct mascot', () => {
      const phoenix = getMascotById('phoenix');
      expect(phoenix.name).toBe('Blazing Phoenix');
      expect(phoenix.emoji).toBe('🔥');
    });

    test('should return first mascot for invalid ID', () => {
      const fallback = getMascotById('invalid');
      expect(fallback).toBe(MASCOT_POOL[0]);
    });
  });

  describe('getRandomMascot', () => {
    test('should return a mascot from the pool', () => {
      const mascot = getRandomMascot();
      expect(MASCOT_POOL).toContainEqual(mascot);
    });
  });

  describe('getRandomMascots', () => {
    test('should return requested number of mascots', () => {
      const mascots = getRandomMascots(3);
      expect(mascots).toHaveLength(3);
    });

    test('should exclude specified IDs', () => {
      const mascots = getRandomMascots(5, ['phoenix', 'wolf']);
      const ids = mascots.map(m => m.id);
      expect(ids).not.toContain('phoenix');
      expect(ids).not.toContain('wolf');
    });
  });

  describe('levenshteinDistance', () => {
    test('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    test('should calculate correct distance', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('cat', 'hat')).toBe(1);
    });
  });

  describe('stringSimilarity', () => {
    test('should return 1 for identical strings', () => {
      expect(stringSimilarity('hello', 'hello')).toBe(1);
    });

    test('should return high similarity for similar strings', () => {
      expect(stringSimilarity('hello', 'hallo')).toBeGreaterThan(0.7);
    });

    test('should return 0 for null/undefined inputs', () => {
      expect(stringSimilarity(null, 'test')).toBe(0);
      expect(stringSimilarity('test', undefined)).toBe(0);
    });
  });

  describe('normalizeString', () => {
    test('should lowercase and remove special chars', () => {
      expect(normalizeString('Hello World!')).toBe('helloworld');
      expect(normalizeString('José García')).toBe('josegarcia');
    });

    test('should handle empty/null input', () => {
      expect(normalizeString('')).toBe('');
      expect(normalizeString(null)).toBe('');
    });
  });

  describe('areNamesSimilar', () => {
    test('should match identical names', () => {
      expect(areNamesSimilar('John Smith', 'John Smith')).toBe(true);
    });

    test('should match with different case', () => {
      expect(areNamesSimilar('JOHN SMITH', 'john smith')).toBe(true);
    });

    test('should match similar names', () => {
      expect(areNamesSimilar('John Smith', 'Jon Smith')).toBe(true);
    });

    test('should not match different names', () => {
      expect(areNamesSimilar('John Smith', 'Jane Doe')).toBe(false);
    });
  });

  describe('findBestColumnMatch', () => {
    test('should match exact column names', () => {
      const result = findBestColumnMatch('full_name', 'full_name');
      expect(result.match).toBe(true);
      expect(result.confidence).toBe(1);
    });

    test('should match fuzzy column names', () => {
      const result = findBestColumnMatch('Student Name', 'full_name');
      expect(result.match).toBe(true);
    });

    test('should not match unrelated columns', () => {
      const result = findBestColumnMatch('Address', 'full_name');
      expect(result.match).toBe(false);
    });
  });

  describe('fuzzySearchStudents', () => {
    const students = [
      { id: '1', full_name: 'John Smith', student_id_number: '12345' },
      { id: '2', full_name: 'Jane Doe', student_id_number: '67890' },
      { id: '3', full_name: 'Bob Johnson', student_id_number: '11111' },
    ];

    test('should find exact name match', () => {
      const results = fuzzySearchStudents(students, 'John Smith');
      expect(results).toHaveLength(1);
      expect(results[0].full_name).toBe('John Smith');
    });

    test('should find partial name match', () => {
      const results = fuzzySearchStudents(students, 'John');
      expect(results.length).toBeGreaterThan(0);
    });

    test('should find by student ID', () => {
      const results = fuzzySearchStudents(students, '12345');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    test('should return empty for short queries', () => {
      const results = fuzzySearchStudents(students, 'J');
      expect(results).toHaveLength(0);
    });
  });

  describe('generateHousesFromGrades', () => {
    test('should generate houses for valid grades', () => {
      const houses = generateHousesFromGrades([9, 10, 11, 12]);
      expect(houses).toHaveLength(4);
      expect(houses[0].gradeLevel).toBe(9);
    });

    test('should return defaults for empty input', () => {
      const houses = generateHousesFromGrades([]);
      expect(houses).toHaveLength(4);
    });

    test('should generate unique house IDs', () => {
      const houses = generateHousesFromGrades([6, 7, 8]);
      const ids = houses.map(h => h.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('assignHouseByGrade', () => {
    const houses = [
      { id: 'house-9', gradeLevel: 9 },
      { id: 'house-10', gradeLevel: 10 },
      { id: 'house-11', gradeLevel: 11 },
    ];

    test('should assign to matching grade house', () => {
      expect(assignHouseByGrade(9, houses)).toBe('house-9');
      expect(assignHouseByGrade(10, houses)).toBe('house-10');
    });

    test('should return first house if no match', () => {
      expect(assignHouseByGrade(12, houses)).toBe('house-9');
    });

    test('should return null for empty houses', () => {
      expect(assignHouseByGrade(9, [])).toBeNull();
    });
  });

  describe('autoBalanceHouses', () => {
    const houses = [
      { id: 'house-1' },
      { id: 'house-2' },
    ];

    test('should balance unassigned students', () => {
      const students = [
        { id: '1' },
        { id: '2' },
        { id: '3' },
        { id: '4' },
      ];
      const assignments = autoBalanceHouses(students, houses);
      expect(assignments).toHaveLength(4);
    });

    test('should skip already assigned students', () => {
      const students = [
        { id: '1', houseId: 'house-1' },
        { id: '2' },
      ];
      const assignments = autoBalanceHouses(students, houses);
      expect(assignments).toHaveLength(1);
    });

    test('should return empty for invalid input', () => {
      expect(autoBalanceHouses([], houses)).toEqual([]);
      expect(autoBalanceHouses(null, houses)).toEqual([]);
    });
  });
});
