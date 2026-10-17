import { useSearchParams } from "react-router-dom";
import { AttemptPageSchema } from "@shared/attempt.schema";
import { DEFAULT_ATTEMPT_PAGE } from "../constants";
import type { AttemptPage } from "@/core/api/apiTypes";

/**
 * The history page and page size, kept in the URL as `page` and `per_page`.
 *
 * Validated with the API's own schema: a hand-edited invalid value falls back to the defaults here,
 * so it never reaches the API as a 400. Changing the page size returns to the first page.
 */
export default function useAttemptPageParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const parsed = AttemptPageSchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    per_page: searchParams.get("per_page") ?? undefined,
  });
  const attemptPage: AttemptPage = parsed.success
    ? { page: parsed.data.page, perPage: parsed.data.per_page }
    : DEFAULT_ATTEMPT_PAGE;

  const setPage = (page: number) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("page", String(page));
      return next;
    });

  const setPerPage = (perPage: number) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("per_page", String(perPage));
      next.delete("page");
      return next;
    });

  return { attemptPage, setPage, setPerPage };
}
