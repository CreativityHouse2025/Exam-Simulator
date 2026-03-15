/** Parses a Cookie header string into a key-value record. */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  for (const pair of cookieHeader.split(";")) {
    const eqIndex = pair.indexOf("=")
    if (eqIndex === -1) continue
    const key = pair.slice(0, eqIndex).trim()
    const value = pair.slice(eqIndex + 1).trim()
    if (key) cookies[key] = value
  }
  return cookies
}

/** Returns Set-Cookie header strings for access and refresh tokens. */
export function serializeAuthCookies(accessToken: string, refreshToken: string): string[] {
  const accessTokenAge = process.env.SB_ACCESS_TOKEN_AGE ?? "3600"
  const shared = "HttpOnly; Secure; SameSite=Strict; Path=/api"
  return [
    `access_token=${accessToken}; ${shared}; Max-Age=${accessTokenAge}`,
    `refresh_token=${refreshToken}; ${shared}`,
  ]
}
