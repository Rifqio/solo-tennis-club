export type ApiErrorCode = 'NOT_FOUND' | 'INTERNAL' | 'INVALID_DATE' | 'DATE_OUT_OF_RANGE' | 'UNAUTHENTICATED' | 'CSRF_FAILED' | 'ORIGIN_REJECTED' | 'UNSUPPORTED_MEDIA_TYPE' | 'PAYLOAD_TOO_LARGE' | 'SIGN_IN_FAILED' | 'SIGN_IN_THROTTLED' | 'VALIDATION_FAILED' | 'STALE_VERSION' | 'DUPLICATE_NAME'
export type FieldErrorCode = 'REQUIRED' | 'INVALID_FORMAT' | 'INVALID_INTEGER' | 'OUT_OF_RANGE' | 'TOO_LONG' | 'MIN_EXCEEDS_MAX' | 'CAPACITY_BELOW_OCCUPIED' | 'COACH_REQUIRED' | 'COACH_DUPLICATE' | 'REFERENCE_NOT_FOUND' | 'DATE_IN_PAST' | 'DATE_TOO_FAR' | 'DUPLICATE_NAME'
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    fields?: Record<string, FieldErrorCode>
    latest?: unknown
    retryAfterSeconds?: number
  }
}
