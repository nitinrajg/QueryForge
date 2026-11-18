import { describe, it, expect } from 'vitest';
import { formatSetLabel, deriveSetOptions, filterProblems } from '@/pages/Practice';

describe('Set Dropdown Formatting & Natural Ordering', () => {
  it('formats various module identifiers into friendly labels', () => {
    expect(formatSetLabel('leetcode-set-1')).toBe('LeetCode Set 1');
    expect(formatSetLabel('leetcode-set-10')).toBe('LeetCode Set 10');
    expect(formatSetLabel('interview-set-3')).toBe('Interview Set 3');
    expect(formatSetLabel('company-1')).toBe('Company Set 1');
    expect(formatSetLabel('bonus-set-1')).toBe('Bonus Set 1');
  });

  it('sorts set options naturally (1, 2, ... 9, 10, not 1, 10, 2)', () => {
    const mockProblems = [
      { id: 'q10', trackId: 'leetcode-sql-50', moduleId: 'leetcode-set-10' },
      { id: 'q1', trackId: 'leetcode-sql-50', moduleId: 'leetcode-set-1' },
      { id: 'q2', trackId: 'leetcode-sql-50', moduleId: 'leetcode-set-2' },
      { id: 'q9', trackId: 'leetcode-sql-50', moduleId: 'leetcode-set-9' },
    ];

    const options = deriveSetOptions(mockProblems, 'all');

    // First option should always be 'All Sets'
    expect(options[0]).toEqual({
      id: 'all',
      label: 'All Sets',
      count: 4,
    });

    // Following options should be naturally sorted: 1, 2, 9, 10
    const setIds = options.slice(1).map((o) => o.id);
    expect(setIds).toEqual([
      'leetcode-set-1',
      'leetcode-set-2',
      'leetcode-set-9',
      'leetcode-set-10',
    ]);
  });

  it('scopes set options when a specific track is active', () => {
    const mockProblems = [
      { id: 'q1', trackId: 'leetcode-sql-50', moduleId: 'leetcode-set-1' },
      { id: 'q2', trackId: 'leetcode-sql-50', moduleId: 'leetcode-set-1' },
      { id: 'q3', trackId: 'interview-questions', moduleId: 'interview-set-1' },
    ];

    const leetcodeOptions = deriveSetOptions(mockProblems, 'leetcode-sql-50');
    expect(leetcodeOptions.length).toBe(2); // 'all' + 'leetcode-set-1'
    expect(leetcodeOptions[0].count).toBe(2);
    expect(leetcodeOptions[1]).toEqual({
      id: 'leetcode-set-1',
      label: 'LeetCode Set 1',
      count: 2,
    });
  });
});

describe('Practice Problem Filtering Pipeline', () => {
  const sampleProblems = [
    {
      id: 'p1',
      number: 1,
      title: 'Recyclable Products',
      trackId: 'leetcode-sql-50',
      moduleId: 'leetcode-set-1',
      difficulty: 'easy',
      tags: ['Select', 'leetcode-set-1'],
    },
    {
      id: 'p2',
      number: 2,
      title: 'Find Customer Referee',
      trackId: 'leetcode-sql-50',
      moduleId: 'leetcode-set-1',
      difficulty: 'medium',
      tags: ['Filtering', 'leetcode-set-1'],
    },
    {
      id: 'p3',
      number: 3,
      title: 'Big Countries',
      trackId: 'leetcode-sql-50',
      moduleId: 'leetcode-set-2',
      difficulty: 'easy',
      tags: ['Select', 'leetcode-set-2'],
    },
    {
      id: 'p4',
      number: 4,
      title: 'Active Users',
      trackId: 'interview-questions',
      moduleId: 'interview-set-1',
      difficulty: 'hard',
      tags: ['Window Functions', 'interview-set-1'],
    },
  ];

  const emptyProgress = {};

  it('filters by set correctly', () => {
    const res = filterProblems(
      sampleProblems,
      {
        track: 'all',
        set: 'leetcode-set-1',
        difficulty: 'all',
        status: 'all',
        searchQuery: '',
      },
      emptyProgress
    );

    expect(res.length).toBe(2);
    expect(res.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('combines set, difficulty, and search filters', () => {
    const res = filterProblems(
      sampleProblems,
      {
        track: 'all',
        set: 'leetcode-set-1',
        difficulty: 'easy',
        status: 'all',
        searchQuery: 'recyclable',
      },
      emptyProgress
    );

    expect(res.length).toBe(1);
    expect(res[0].id).toBe('p1');
  });

  it('returns empty array when combined filters have no match', () => {
    const res = filterProblems(
      sampleProblems,
      {
        track: 'all',
        set: 'leetcode-set-1',
        difficulty: 'hard',
        status: 'all',
        searchQuery: '',
      },
      emptyProgress
    );

    expect(res.length).toBe(0);
  });
});
