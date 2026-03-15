# Todo

## Completed

- [x] Refactor `api/send-email.ts` to use `withErrorHandler` and `AppError` instead of inline error responses

## Next Steps

- [ ] `withAuth` doesn't check account expiry — expired users with valid JWTs can access protected routes. Extract expiry check into a reusable function shared by `signin` and `withAuth`
- [ ] `setMonth` date overflow bug in `authService.signup` — month-end dates roll over (e.g. Aug 31 + 6 months = Mar 3 instead of Feb 28)
- [ ] `withAuth` response re-creation on token refresh discards original headers and assumes `{ data }` envelope — use response cloning instead
- [ ] Modify signup to use PKCE flow
- [ ] Set up testing mode using env variables
- [ ] Create a withLogger middleware to be used in critical endpoints
- [ ] Add remaining API endpoints for v2.0 backend features
