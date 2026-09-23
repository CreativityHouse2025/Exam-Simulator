import React from "react";
import useToast from "../hooks/useToast";
import { translate } from "../utils/translation";
import { cn } from "./ui/utils";

const Toast: React.FC = () => {
  const { visible, translationKey, closeToast } = useToast();
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed top-17.5 left-1/2 z-9999 bg-secondary text-white py-2.5 px-5 rounded-xl shadow-4",
        "text-base font-sans flex gap-2.5 items-center pointer-events-auto -translate-x-1/2",
        visible ? "opacity-100 animate-slide-down" : "opacity-0",
      )}
    >
      <span style={{ flex: 1 }}>
        {translationKey && translate(translationKey)}
      </span>
      <button
        aria-label="Close"
        onClick={closeToast}
        className="bg-transparent border-0 text-white text-2xl cursor-pointer p-0 leading-none opacity-70 transition-opacity duration-200 pointer-events-auto hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
