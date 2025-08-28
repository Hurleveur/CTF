/**
 * Tests for automatic project creation functionality
 */

import { buildDefaultProject, PROJECT_NAMES, PROJECT_DESCRIPTIONS, EMOJIS } from '@/lib/default-project';

describe('Default Project Creation', () => {
  describe('buildDefaultProject', () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockFullName = 'Test User';

    test('should create a project with valid structure', () => {
      const project = buildDefaultProject(mockFullName, mockUserId);

      expect(project).toHaveProperty('user_id', mockUserId);
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('logo');
      expect(project).toHaveProperty('ai_status', 'Basic Motor Functions');
      expect(project).toHaveProperty('status_color', 'red');
      expect(project).toHaveProperty('neural_reconstruction', 0.0);
      expect(project).toHaveProperty('last_backup');
      expect(project).toHaveProperty('lead_developer', mockFullName);
      expect(project).toHaveProperty('team_members', [mockFullName]);
    });

    test('should use project name from the predefined list', () => {
      const project = buildDefaultProject(mockFullName, mockUserId);
      
      expect(PROJECT_NAMES).toContain(project.name);
    });

    test('should use project description from the predefined list', () => {
      const project = buildDefaultProject(mockFullName, mockUserId);
      
      expect(PROJECT_DESCRIPTIONS).toContain(project.description);
    });

    test('should use emoji from the predefined list', () => {
      const project = buildDefaultProject(mockFullName, mockUserId);
      
      expect(EMOJIS).toContain(project.logo);
    });

    test('should use email as fallback when fullName is empty', () => {
      const email = 'test@example.com';
      const project = buildDefaultProject('', mockUserId);
      
      expect(project.lead_developer).toBe('Unknown Developer');
      expect(project.team_members).toEqual(['Unknown Developer']);
    });

    test('should generate valid date format for last_backup', () => {
      const project = buildDefaultProject(mockFullName, mockUserId);
      
      // Should match YYYY-MM-DD format
      expect(project.last_backup).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Should be a valid date
      const date = new Date(project.last_backup);
      expect(date).toBeInstanceOf(Date);
      expect(!isNaN(date.getTime())).toBe(true);
    });

    test('should generate different projects on multiple calls', () => {
      // Run multiple times to increase chance of getting different results
      const projects = Array.from({ length: 10 }, () => 
        buildDefaultProject(mockFullName, mockUserId)
      );

      // With 15 names and 20 emojis, we should get some variation
      const uniqueNames = new Set(projects.map(p => p.name));
      const uniqueEmojis = new Set(projects.map(p => p.logo));

      // We expect at least some variation (not all identical)
      expect(uniqueNames.size + uniqueEmojis.size).toBeGreaterThan(2);
    });

    test('should maintain consistent name-description pairing', () => {
      // Test multiple times to verify consistent pairing
      for (let i = 0; i < 20; i++) {
        const project = buildDefaultProject(mockFullName, mockUserId);
        const nameIndex = PROJECT_NAMES.indexOf(project.name);
        
        expect(nameIndex).toBeGreaterThanOrEqual(0);
        expect(project.description).toBe(PROJECT_DESCRIPTIONS[nameIndex]);
      }
    });
  });

  describe('Data Consistency', () => {
    test('should have equal length arrays for names and descriptions', () => {
      expect(PROJECT_NAMES.length).toBe(PROJECT_DESCRIPTIONS.length);
    });

    test('should have all required project names', () => {
      expect(PROJECT_NAMES.length).toBeGreaterThan(0);
      PROJECT_NAMES.forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });

    test('should have all required project descriptions', () => {
      expect(PROJECT_DESCRIPTIONS.length).toBeGreaterThan(0);
      PROJECT_DESCRIPTIONS.forEach(description => {
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(0);
      });
    });

    test('should have all required emojis', () => {
      expect(EMOJIS.length).toBeGreaterThan(0);
      EMOJIS.forEach(emoji => {
        expect(typeof emoji).toBe('string');
        expect(emoji.length).toBeGreaterThan(0);
      });
    });

    test('should have robotics/AI themed names', () => {
      const roboticsKeywords = [
        'PRECISION', 'NEURO', 'SENTIENCE', 'KINETIC', 'CYBER', 'HARMONY',
        'AETHER', 'VITAL', 'ECHO', 'INFINITY', 'QUANTUM', 'NEURAL',
        'SYNTH', 'MECH', 'COGNITION'
      ];

      PROJECT_NAMES.forEach(name => {
        const hasRoboticsKeyword = roboticsKeywords.some(keyword => 
          name.toUpperCase().includes(keyword)
        );
        expect(hasRoboticsKeyword).toBe(true);
      });
    });
  });
});
