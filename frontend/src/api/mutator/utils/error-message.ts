const DEFAULT_API_ERROR_MESSAGE = 'Something went wrong'

/**
 * Parses API error `response.data` (or equivalent) and returns a user-facing message.
 */
export function getErrorMessageFromErrorResponse(
  errorResponse: unknown,
  fallbackMessage: string = DEFAULT_API_ERROR_MESSAGE,
): string {
  if (!errorResponse || typeof errorResponse !== 'object') {
    return fallbackMessage
  }

  const message = (errorResponse as Record<string, unknown>).error
  if (message != null && message !== '') {
    return String(message)
  }

  return fallbackMessage
}
