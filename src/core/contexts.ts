import React from "react";
import type { SettingsContextType, ToastContextType } from "./types";

// Settings context
export const SettingsContext = React.createContext<SettingsContextType>(
  {} as SettingsContextType,
);
// Toast context
export const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined,
);
