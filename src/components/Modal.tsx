import React from "react";
import { cn } from "./ui/utils";

const BUTTON_BASE =
  "flex items-center justify-center text-sm sm:text-base font-bold uppercase py-2 px-2 sm:px-2.5 rounded-xs transition-all duration-300 cursor-pointer";

const ModalComponent: React.FC<ModalProps> = ({
  title,
  message,
  buttons,
  onConfirm,
  onClose,
  variant,
}) => {
  const handleBackdropClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        (onClose || onConfirm)?.();
      }
    },
    [onClose, onConfirm],
  );

  return (
    <div
      id="modal-cover"
      className="fixed top-0 left-0 z-5 w-full h-full bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        id="modal-window"
        className="fixed top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 animate-grow"
      >
        <div
          id="modal-inner"
          className="break-card modal-inner-grid grid bg-white shadow-1"
        >
          <div
            id="title"
            className="h-10 sm:h-12.5 flex justify-center items-center px-4 text-lg sm:text-xl font-semibold bg-primary"
          >
            {title}
          </div>

          <div
            id="message"
            className="h-auto flex items-center justify-center py-5 px-4 sm:py-7.5 sm:px-5 text-xl sm:text-3xl font-semibold"
          >
            {message}
          </div>

          <div
            id="buttons"
            className="h-12.5 flex items-center justify-center gap-2.5 border-t border-grey-200 bg-grey-50"
          >
            <button
              id="button-confirm"
              className={cn(
                BUTTON_BASE,
                "no-select text-white",
                variant === "danger"
                  ? "bg-danger hover:bg-danger-hover"
                  : "bg-secondary hover:bg-secondary-hover",
              )}
              onClick={onConfirm}
            >
              {buttons[0]}
            </button>

            {onClose && (
              <button
                id="button-cancel"
                className={cn(
                  BUTTON_BASE,
                  "no-select text-grey-950 bg-grey-200 hover:bg-grey-300",
                )}
                onClick={onClose}
              >
                {buttons[1]}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalComponent;

export interface ModalProps {
  title: string;
  message: string;
  buttons: [string] | [string, string]; // ['Okay', 'Cancel']
  onConfirm?: () => void;
  onClose?: () => void;
  variant?: "danger";
}
