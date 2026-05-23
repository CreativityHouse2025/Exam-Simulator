import { queryOptions } from "@tanstack/react-query"
import { getAttempts } from "../services/attempt.service"

export const createAttemptsQueryOptions = () =>
  queryOptions({
    queryKey: ["attempts"],
    queryFn: getAttempts,
    staleTime: 10 * 60 * 1000, // refresh each 5m
    gcTime: 30 * 60 * 1000, // garbage data after 30m
    retry: 2 // retry 2 time on failure
  })
