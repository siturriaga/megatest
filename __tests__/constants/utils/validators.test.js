/**
 * @jest-environment node
 */
import {
  validatePass,
  validateLogEntry,
  validateBroadcast,
  validateConflictGroup,
  validateParentContact,
  validateSchool,
  validateConfig,
} from '../../utils/validators';

describe('validators.js', () => {
  describe('validatePass', () => {
    const validPass = {
      studentId: 'student-123',
      studentName: 'John Smith',
      studentGrade: 10,
      destination: 'Bathroom',
      teacherEmail: 'teacher@dadeschools.net',
      teacherName: 'Ms. Johnson',
      employeeId: 'T12345',
      status: 'ACTIVE',
    };

    test('should validate a complete pass', () => {
      const result = validatePass(validPass);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject pass without studentId', () => {
      const result = validatePass({ ...validPass, studentId: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject pass without destination', () => {
      const result = validatePass({ ...validPass, destination: '' });
      expect(result.valid).toBe(false);
    });

    test('should sanitize pass data', () => {
      const dirtyPass = {
        ...validPass,
        studentName: '<script>alert("xss")</script>John',
      };
      const result = validatePass(dirtyPass);
      expect(result.sanitized.studentName).not.toContain('<script>');
    });
  });

  describe('validateLogEntry', () => {
    const validLog = {
      type: 'PASS',
      studentId: 'student-123',
      studentName: 'John Smith',
      detail: 'Bathroom',
      byEmail: 'teacher@dadeschools.net',
      employeeId: 'T12345',
    };

    test('should validate a complete log entry', () => {
      const result = validateLogEntry(validLog);
      expect(result.valid).toBe(true);
    });

    test('should reject invalid log type', () => {
      const result = validateLogEntry({ ...validLog, type: 'INVALID' });
      expect(result.valid).toBe(false);
    });

    test('should allow valid log types', () => {
      const types = ['PASS', 'RETURN', 'INFRACTION', 'INCENTIVE', 'TARDY'];
      types.forEach(type => {
        const result = validateLogEntry({ ...validLog, type });
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateBroadcast', () => {
    const validBroadcast = {
      message: 'Important announcement',
      priority: 'normal',
      senderEmail: 'admin@dadeschools.net',
      senderName: 'Admin User',
    };

    test('should validate a complete broadcast', () => {
      const result = validateBroadcast(validBroadcast);
      expect(result.valid).toBe(true);
    });

    test('should reject empty message', () => {
      const result = validateBroadcast({ ...validBroadcast, message: '' });
      expect(result.valid).toBe(false);
    });

    test('should reject invalid priority', () => {
      const result = validateBroadcast({ ...validBroadcast, priority: 'super-urgent' });
      expect(result.valid).toBe(false);
    });

    test('should accept valid priorities', () => {
      const priorities = ['normal', 'important', 'urgent'];
      priorities.forEach(priority => {
        const result = validateBroadcast({ ...validBroadcast, priority });
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateConflictGroup', () => {
    const validGroup = {
      name: 'Conflict Group A',
      members: ['student-1', 'student-2'],
    };

    test('should validate a complete conflict group', () => {
      const result = validateConflictGroup(validGroup);
      expect(result.valid).toBe(true);
    });

    test('should reject group with less than 2 members', () => {
      const result = validateConflictGroup({ ...validGroup, members: ['student-1'] });
      expect(result.valid).toBe(false);
    });

    test('should reject group without name', () => {
      const result = validateConflictGroup({ ...validGroup, name: '' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateParentContact', () => {
    const validContact = {
      studentId: 'student-123',
      studentName: 'John Smith',
      contactType: 'phone',
      notes: 'Discussed behavior',
      byEmail: 'teacher@dadeschools.net',
    };

    test('should validate a complete contact', () => {
      const result = validateParentContact(validContact);
      expect(result.valid).toBe(true);
    });

    test('should reject invalid contact type', () => {
      const result = validateParentContact({ ...validContact, contactType: 'telepathy' });
      expect(result.valid).toBe(false);
    });

    test('should accept valid contact types', () => {
      const types = ['phone', 'email', 'conference', 'other'];
      types.forEach(contactType => {
        const result = validateParentContact({ ...validContact, contactType });
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateSchool', () => {
    const validSchool = {
      name: 'Lincoln High School',
      code: 'LINCOLN_HIGH_2024',
    };

    test('should validate a complete school', () => {
      const result = validateSchool(validSchool);
      expect(result.valid).toBe(true);
    });

    test('should reject school without name', () => {
      const result = validateSchool({ ...validSchool, name: '' });
      expect(result.valid).toBe(false);
    });

    test('should reject school without code', () => {
      const result = validateSchool({ ...validSchool, code: '' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateConfig', () => {
    test('should validate labels config', () => {
      const config = {
        infractionButtons: ['Tardy', 'Disruption'],
        incentiveButtons: ['Helping', 'Excellence'],
        passDestinations: ['Bathroom', 'Office'],
      };
      const result = validateConfig('labels', config);
      expect(result.valid).toBe(true);
    });

    test('should validate economy config', () => {
      const config = {
        studentPointRatio: 0.4,
        teamPointRatio: 0.6,
      };
      const result = validateConfig('economy', config);
      expect(result.valid).toBe(true);
    });

    test('should reject invalid point ratios', () => {
      const config = {
        studentPointRatio: 1.5, // > 1
        teamPointRatio: 0.6,
      };
      const result = validateConfig('economy', config);
      expect(result.valid).toBe(false);
    });
  });
});
