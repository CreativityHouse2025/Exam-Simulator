import { AttemptPageSchema } from "@shared/attempt.schema";
import type { AttemptPage } from "@/core/api/apiTypes";

const { page, per_page } = AttemptPageSchema.parse({});

/**
 * The first page at the default size. The track page's recent attempts request it too, so they
 * share one cache entry with the history page's default view.
 */
export const DEFAULT_ATTEMPT_PAGE: AttemptPage = { page, perPage: per_page };
