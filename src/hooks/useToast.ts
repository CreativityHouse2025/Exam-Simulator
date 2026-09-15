import { useContext, useRef, useCallback } from "react";
import { ToastContext } from "../contexts";
import { ToastContextType } from "../types";

export default function useToast() {
  const context = useContext(ToastContext);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!context) {
    throw new Error("useToast must be used within ToastContextProvider");
  }

  const { translationKey, visible, setToast } = context as ToastContextType;

  /** @param key - a translation key; the toast resolves it to copy when it renders */
  const showToast = useCallback((key: string, duration: number = 3000) => {
    setToast({ translationKey: key, visible: true });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast({ translationKey: "", visible: false });
    }, duration);
  }, [setToast]);

  const closeToast = useCallback(() => {
    setToast({ translationKey: "", visible: false });
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [setToast]);

  return {
    translationKey,
    visible,
    showToast,
    closeToast,
  };
}
