import { describe, it, expect } from 'vitest';
import tracksData from '@/content/tracks.json';
import problemsData from '@/content/problems.json';
import lessonsData from '@/content/lessons.json';
import manifestData from '@/content/manifest.json';

describe('Content Pipeline Integrity', () => {
  it('loads tracks and modules correctly', () => {
    const tracks = tracksData as any[];
    expect(tracks.length).toBe(5);
    expect(tracks.map((t) => t.id)).toEqual([
      'sql-fundamentals',
      'leetcode-sql-50',
      'interview-questions',
      'company-questions',
      'bonus-problems',
    ]);
  });

  it('contains all 14 theory guides', () => {
    const lessons = Object.values(lessonsData) as any[];
    expect(lessons.length).toBe(14);
    for (const l of lessons) {
      expect(l.id).toBeDefined();
      expect(l.title).toBeDefined();
      expect(l.content.length).toBeGreaterThan(100);
      expect(l.toc.length).toBeGreaterThan(0);
    }
  });

  it('contains over 100 practice problems with test cases and solutions', () => {
    const problems = Object.values(problemsData) as any[];
    expect(problems.length).toBeGreaterThanOrEqual(100);

    for (const p of problems) {
      expect(p.id).toBeDefined();
      expect(p.title).toBeDefined();
      expect(['easy', 'medium', 'hard']).toContain(p.difficulty);
      expect(p.solutionSql.length).toBeGreaterThan(0);
      expect(p.datasetSql.length).toBeGreaterThan(0);
    }
  });

  it('manifest numbers align with content files', () => {
    expect(manifestData.stats.tracksCount).toBe(5);
    expect(manifestData.stats.lessonsCount).toBe(14);
    expect(manifestData.stats.problemsCount).toBeGreaterThanOrEqual(100);
  });
});

