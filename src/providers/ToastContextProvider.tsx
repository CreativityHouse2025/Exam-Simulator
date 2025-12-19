import React from "react";
import { ToastContext } from "../contexts";
import { ToastState } from "../types";

const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = React.useState<ToastState>({ message: "", visible: false });

  return (
    <ToastContext.Provider value={{ ...toast, setToast }}>
      {children}
    </ToastContext.Provider>
  );
};


export default ToastContextProvider;
