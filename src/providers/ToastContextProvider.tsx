import React from "react";
import { ToastContext } from "../contexts";
import Toast from "../components/Toast";
import { ToastState } from "../types";

const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = React.useState<ToastState>({ message: "", visible: false });

  return (
    <ToastContext.Provider value={{ ...toast, setToast }}>
      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
      {children}
    </ToastContext.Provider>
  );
};


export default ToastContextProvider;
