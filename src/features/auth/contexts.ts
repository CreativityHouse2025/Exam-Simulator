import React from "react";
import type { AuthContextType } from "./types";

// Auth context
export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  enrolledTracks: [],
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  exchangeToken: async () => {},
  requestPasswordReset: async () => {},
  updatePassword: async () => {},
  signOut: async () => {},
});
