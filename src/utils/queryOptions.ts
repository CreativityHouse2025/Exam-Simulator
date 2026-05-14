import { queryOptions } from "@tanstack/react-query"
import { getAttempts } from "../services/attempt.service"

export const createAttemptsQueryOptions = () =>
  queryOptions({
    queryKey: ["attempts"],
    queryFn: getAttempts,
    staleTime: 10 * 60 * 1000, // refresh each 10m
    gcTime: 30 * 60 * 1000, // garbage data after 30m
  })
