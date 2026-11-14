import { z } from 'zod';

/**
 * Metadata schema accompanying all successful and error API responses.
 */
export const ApiMetaSchema = z
  .object({
    timestamp: z.string().datetime({ message: 'Timestamp must be a valid ISO 8601 string' }),
  })
  .catchall(z.unknown());

export type ApiMeta = z.infer<typeof ApiMetaSchema>;

/**
 * Standard error detail schema.
 */
export const ApiErrorDetailSchema = z.object({
  code: z.string().min(1, 'Error code is required'),
  message: z.string().min(1, 'Error message is required'),
  details: z.unknown().optional(),
});

export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>;

/**
 * Standard error response envelope schema.
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorDetailSchema,
  meta: ApiMetaSchema,
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/**
 * Creates a type-safe Zod schema for successful API responses with data payload.
 */
export function createApiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: ApiMetaSchema,
  });
}

/**
 * Successful response type envelope.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    [key: string]: unknown;
  };
}

/**
 * Standard union response type for all API communication.
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard system and application error codes.
 */
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
