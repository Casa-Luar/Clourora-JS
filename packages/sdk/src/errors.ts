import type { ClouroraErrorCode } from './types';

const HINTS: Partial<Record<ClouroraErrorCode, string>> = {
  invalid_key: 'The API key is wrong or was revoked. Create one in Clourora: My Business → Negocio → Pet adoption.',
  origin_not_allowed: "This site's origin isn't in the API key's allowed origins. Add it to the key in Clourora.",
  scope_not_allowed: "The API key doesn't have the scope this call needs.",
  module_off: 'The business turned off this module for the location.'
};

/** Any failed call. `code` is stable and meant for code; `message` is for people. */
export class ClouroraError extends Error {
  override readonly name = 'ClouroraError';

  constructor(
    readonly code: ClouroraErrorCode,
    /** HTTP status, 0 when the request never got an answer */
    readonly status: number,
    message?: string,
    options?: { cause?: unknown }
  ) {
    super(message ?? HINTS[code] ?? `Clourora API error: ${code} (HTTP ${status})`, options);
  }
}

export function isClouroraError(value: unknown): value is ClouroraError {
  return value instanceof ClouroraError;
}
