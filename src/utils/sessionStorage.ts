import type { Session, StoredSession } from '../session'

// Session storage manager
export class SessionStorageManager {
  private static readonly STORAGE_KEY = 'exam-sessions'
  private static readonly MAX_SESSIONS = 100

  // Get all stored sessions
  static getAllSessions(): StoredSession[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const sessions: StoredSession[] = JSON.parse(stored)
      // Sort by most recently updated first
      return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (error) {
      console.error('Error loading sessions:', error)
      return []
    }
  }

  // Save or update a session
  static saveSession(session: Session): StoredSession {
    try {
      const sessions = this.getAllSessions()
      const now = new Date().toISOString()

      // Find existing session or create new one
      let existingSessionIndex = -1
      let sessionId: string

      if (session.examID) {
        existingSessionIndex = sessions.findIndex((s) => s.examID === session.examID && s.examState !== 'completed')
      }

      if (existingSessionIndex >= 0) {
        // Update existing session
        sessionId = sessions[existingSessionIndex].id
        const createdAt = sessions[existingSessionIndex].createdAt

        sessions[existingSessionIndex] = {
          ...session,
          id: sessionId,
          createdAt,
          updatedAt: now
        }
      } else {
        // Create new session
        sessionId = this.generateSessionId()
        const newSession: StoredSession = {
          ...session,
          id: sessionId,
          createdAt: now,
          updatedAt: now
        }

        sessions.unshift(newSession)

        // Keep only the most recent MAX_SESSIONS
        if (sessions.length > this.MAX_SESSIONS) {
          sessions.splice(this.MAX_SESSIONS)
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions))
      return sessions.find((s) => s.id === sessionId)!
    } catch (error) {
      console.error('Error saving session:', error)
      throw error
    }
  }

  // Get a specific session by ID
  static getSession(sessionId: string): StoredSession | null {
    try {
      const sessions = this.getAllSessions()
      return sessions.find((s) => s.id === sessionId) || null
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  // Delete a session
  static deleteSession(sessionId: string): void {
    try {
      const sessions = this.getAllSessions()
      const filteredSessions = sessions.filter((s) => s.id !== sessionId)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions))
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  // Get sessions that can be continued (not completed)
  static getContinuableSessions(): StoredSession[] {
    return this.getAllSessions().filter((s) => s.examState !== 'completed')
  }

  // Get completed sessions
  static getCompletedSessions(): StoredSession[] {
    return this.getAllSessions().filter((s) => s.examState === 'completed')
  }

  // Clear all sessions
  static clearAllSessions(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing sessions:', error)
    }
  }

  // Generate unique session ID
  private static generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  // Migrate old single session to new format
  static migrateOldSession(): void {
    try {
      const oldSessionKey = 'session'
      const oldSession = localStorage.getItem(oldSessionKey)

      if (oldSession && !localStorage.getItem(this.STORAGE_KEY)) {
        const session: Session = JSON.parse(oldSession)
        if (session.examID) {
          this.saveSession(session)
          localStorage.removeItem(oldSessionKey)
          console.log('Migrated old session to new multi-session format')
        }
      }
    } catch (error) {
      console.error('Error migrating old session:', error)
    }
  }
}
