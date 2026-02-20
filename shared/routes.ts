import { z } from 'zod';
import { insertGoalSchema, insertHabitSchema, insertCheckinSchema, insertWeeklyReviewSchema, insertGoalReviewSchema, insertMindsetNoteSchema, insertLagIndicatorSchema, insertLagIndicatorEntrySchema, goals, habits, dailyCheckins, habitChecks, weeklyReviews, goalReviews, mindsetNotes, lagIndicators, lagIndicatorEntries } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  dashboard: {
    get: {
      method: 'GET' as const,
      path: '/api/dashboard',
      input: z.object({
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.custom<any>(),
      },
    },
  },
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals',
      responses: {
        200: z.array(z.custom<typeof goals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals',
      input: insertGoalSchema,
      responses: {
        201: z.custom<typeof goals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/goals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/goals/:id',
      input: insertGoalSchema.partial(),
      responses: {
        200: z.custom<typeof goals.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    reorder: {
      method: 'POST' as const,
      path: '/api/goals/reorder',
      input: z.object({
        orderedIds: z.array(z.number()),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
  },
  habits: {
    list: {
      method: 'GET' as const,
      path: '/api/habits',
      responses: {
        200: z.array(z.custom<typeof habits.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/habits',
      input: insertHabitSchema,
      responses: {
        201: z.custom<typeof habits.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/habits/:id',
      responses: {
        200: z.custom<typeof habits.$inferSelect & { checks: typeof habitChecks.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/habits/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/habits/:id',
      input: insertHabitSchema.partial(),
      responses: {
        200: z.custom<typeof habits.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/habits/:id/history',
      responses: {
        200: z.array(z.custom<typeof habitChecks.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    reorder: {
      method: 'POST' as const,
      path: '/api/habits/reorder',
      input: z.object({
        orderedIds: z.array(z.number()),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
  },
  checks: {
    toggle: {
      method: 'POST' as const,
      path: '/api/checks/toggle',
      input: z.object({
        date: z.string(),
        habitId: z.number(),
        completed: z.boolean(),
      }),
      responses: {
        200: z.custom<typeof habitChecks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  checkins: {
    update: {
      method: 'POST' as const,
      path: '/api/checkins',
      input: insertCheckinSchema,
      responses: {
        200: z.custom<typeof dailyCheckins.$inferSelect>(),
      },
    },
  },
  goalReviews: {
    create: {
      method: 'POST' as const,
      path: '/api/goal-reviews',
      input: insertGoalReviewSchema,
      responses: {
        201: z.custom<typeof goalReviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/goal-reviews',
      responses: {
        200: z.array(z.custom<typeof goalReviews.$inferSelect>()),
      },
    },
  },
  mindsetNotes: {
    list: {
      method: 'GET' as const,
      path: '/api/mindset-notes',
      responses: {
        200: z.array(z.custom<typeof mindsetNotes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/mindset-notes',
      input: insertMindsetNoteSchema,
      responses: {
        201: z.custom<typeof mindsetNotes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/mindset-notes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  lagIndicators: {
    listByGoal: {
      method: 'GET' as const,
      path: '/api/goals/:goalId/lag-indicators',
      responses: {
        200: z.array(z.custom<typeof lagIndicators.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/lag-indicators',
      input: insertLagIndicatorSchema,
      responses: {
        201: z.custom<typeof lagIndicators.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/lag-indicators/:id',
      input: insertLagIndicatorSchema.partial(),
      responses: {
        200: z.custom<typeof lagIndicators.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/lag-indicators/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    addEntry: {
      method: 'POST' as const,
      path: '/api/lag-indicators/:id/entries',
      input: z.object({
        date: z.string(),
        value: z.string(),
      }),
      responses: {
        200: z.custom<typeof lagIndicatorEntries.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    getEntries: {
      method: 'GET' as const,
      path: '/api/lag-indicators/:id/entries',
      responses: {
        200: z.array(z.custom<typeof lagIndicatorEntries.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
