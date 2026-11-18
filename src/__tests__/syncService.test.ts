import { describe, it, expect, vi } from 'vitest';
import { syncService } from '@/services/syncService';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

describe('SyncService & Auth Rules', () => {
  describe('Monotonic Solve Status Resolution', () => {
    it('preserves solved status when remote is attempted or not_started', () => {
      expect(syncService.resolveMonotonicStatus('solved', 'attempted')).toBe('solved');
      expect(syncService.resolveMonotonicStatus('solved', 'not_started')).toBe('solved');
      expect(syncService.resolveMonotonicStatus('solved', undefined)).toBe('solved');
    });

    it('upgrades attempted to solved if remote is solved', () => {
      expect(syncService.resolveMonotonicStatus('attempted', 'solved')).toBe('solved');
      expect(syncService.resolveMonotonicStatus('not_started', 'solved')).toBe('solved');
    });

    it('resolves attempted over not_started', () => {
      expect(syncService.resolveMonotonicStatus('attempted', 'not_started')).toBe('attempted');
      expect(syncService.resolveMonotonicStatus('not_started', 'attempted')).toBe('attempted');
    });

    it('remains not_started only when both are not_started', () => {
      expect(syncService.resolveMonotonicStatus('not_started', 'not_started')).toBe('not_started');
      expect(syncService.resolveMonotonicStatus('not_started', undefined)).toBe('not_started');
    });
  });

  describe('Auth Validation Schemas', () => {
    it('validates correct email and 8+ character password', () => {
      const result = authSchema.safeParse({
        email: 'learner@example.com',
        password: 'securePassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = authSchema.safeParse({
        email: 'learner@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('rejects malformed email addresses', () => {
      const result = authSchema.safeParse({
        email: 'not-an-email',
        password: 'securePassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });
  });

  describe('Sync Status Subscription', () => {
    it('notifies subscribers upon status change', () => {
      const listener = vi.fn();
      const unsubscribe = syncService.subscribe(listener);

      expect(listener).toHaveBeenCalledWith(syncService.getStatus());
      unsubscribe();
    });
  });
});
