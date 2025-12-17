import { useState, useEffect } from "react";

/**
 * Custom hook to manage localStorage with React state.
 * @param key The localStorage key
 * @param initialValue The initial value to use if nothing is in localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    // Initialize state with value from localStorage or initialValue
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Update localStorage whenever storedValue changes
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue] as const;
}
