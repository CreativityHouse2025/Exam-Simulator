import { translate } from "./translation";
import type { AppErrorCode } from "../types";

/**
 * Builds a `translateErrorCode` function from a domain-specific error-code → translation-key
 * map. Codes absent from the map (or not in this domain's subset) fall back to `fallbackKey`.
 */
export function createErrorCodeTranslator<TCode extends AppErrorCode>(
  errorCodeToTranslationKey: Record<TCode, string>,
  fallbackKey: string,
) {
  return function translateErrorCode(code: AppErrorCode): string {
    const key = errorCodeToTranslationKey[code as TCode];
    return key ? translate(key) : translate(fallbackKey);
  };
}
