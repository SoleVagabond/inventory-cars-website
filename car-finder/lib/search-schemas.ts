import { z } from 'zod';

export const searchFiltersSchema = z.object({
  make: z.string().trim().optional().default(''),
  model: z.string().trim().optional().default(''),
  minYear: z.number().int().min(1900).max(2100),
  maxPrice: z.number().int().min(0),
  maxMiles: z.number().int().min(0),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export const defaultSearchFilters: SearchFilters = {
  make: '',
  model: '',
  minYear: 2015,
  maxPrice: 25000,
  maxMiles: 120000,
};

export const saveSearchPayloadSchema = z.object({
  filters: searchFiltersSchema,
  zip: z.string().trim().min(3).max(10).optional(),
  radiusMiles: z.number().int().min(1).max(1000).optional().default(50),
  notify: z.enum(['daily', 'weekly', 'off']).optional().default('daily'),
});

export type SaveSearchPayload = z.infer<typeof saveSearchPayloadSchema>;
