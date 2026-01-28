import { useLocalStorage } from "@mantine/hooks";
import { DEFAULT_SESSION } from '../constants';
import type { Session } from '../types';

/**
 * Custom hook to manage session state with localStorage persistence.
 * @returns [session, setSession]
 */
export function useSession() {
	return useLocalStorage<Session>({
		key: 'session',
		defaultValue: DEFAULT_SESSION,
		getInitialValueInEffect: false,
	});
}
