import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_SESSION } from '../constants';
import type { Session } from '../types';

/**
 * Custom hook to manage session state with localStorage persistence.
 * @returns [session, setSession]
 */
export function useSession() {
	return useLocalStorage<Session>('session', DEFAULT_SESSION);
}
