/**
 * Reads an environment variable and checks if the value is missing
 * @param name - Name of the variable in .env
 * @returns The variable's value
 * @throws Missing required environment variables
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}