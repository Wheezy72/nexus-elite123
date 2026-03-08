import { z } from 'zod';

// Auth validation
export const emailSchema = z.string().trim().email('Invalid email address').max(255, 'Email too long');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long');
export const displayNameSchema = z.string().trim().max(50, 'Name must be under 50 characters');

// Task validation
export const taskTextSchema = z.string().trim().min(1, 'Task cannot be empty').max(500, 'Task too long');

// Journal validation
export const journalTextSchema = z.string().trim().min(1, 'Entry cannot be empty').max(10000, 'Entry too long');

// Note validation
export const noteTitleSchema = z.string().trim().max(200, 'Title too long');
export const noteContentSchema = z.string().max(50000, 'Content too long');

// Generic text sanitizer — strips potential XSS vectors
export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

// Validate UUID format
export const uuidSchema = z.string().uuid('Invalid ID format');
