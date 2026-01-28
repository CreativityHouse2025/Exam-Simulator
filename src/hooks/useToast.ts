import { useContext, useRef, useCallback } from "react";
import { ToastContext } from "../contexts";
import { ToastContextType } from "../types";

export default function useToast() {
  const context = useContext(ToastContext);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!context) {
    throw new Error("useToast must be used within ToastContextProvider");
  }

  const { message, visible, setToast } = context as ToastContextType;

  const showToast = useCallback((msg: string, duration: number = 3000) => {
    setToast({ message: msg, visible: true });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast({ message: "", visible: false });
    }, duration);
  }, [setToast]);

  const closeToast = useCallback(() => {
    setToast({ message: "", visible: false });
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [setToast]);

  return {
    message,
    visible,
    showToast,
    closeToast,
  };
}
