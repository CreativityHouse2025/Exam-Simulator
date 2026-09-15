import React from "react"
import ReactDOM from "react-dom"
import { X } from "lucide-react"
import type { DropdownItem } from "../../types"
import { MENU_PADDING } from "../../constants"
import MenuList from "./MenuList"
import { cn } from "../ui/utils"

type DropdownProps<TId = number, TLabel = string> = {
  title: string
  open: boolean
  setOpen: (open: boolean) => void
  onSelect: (value: TId) => void
  items: DropdownItem<TId, TLabel>[]
  buttonRef?: React.RefObject<HTMLButtonElement | null>
  emptyMessage?: string
}

const Dropdown = <TId, TLabel>({
  buttonRef,
  open,
  setOpen,
  title,
  onSelect,
  items,
  emptyMessage,
}: DropdownProps<TId, TLabel>) => {
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!buttonRef?.current || !buttonRef.current.contains(target))
      ) {
        setTimeout(() => setOpen(false), 100)
      }
    }

    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)

    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [buttonRef, setOpen])

  return ReactDOM.createPortal(
    <>
      {/* Rendered via portal so position: fixed is always relative to the viewport,
          regardless of any ancestor transform/overflow in the component tree. */}
      <div
        data-open={open}
        className={cn(
          "exam-dropdown-overlay fixed inset-0 z-1000",
          open ? "backdrop-blur-xs bg-black/15 pointer-events-auto visible" : "backdrop-blur-none bg-transparent pointer-events-none invisible",
        )}
      />

      <div
        data-open={open}
        className={cn(
          "exam-dropdown-wrapper fixed inset-0 flex p-2.5 items-center justify-center z-1001",
          open ? "pointer-events-auto visible" : "pointer-events-none invisible",
        )}
      >
        <div
          ref={menuRef}
          className={cn(
            "exam-dropdown-menu font-sans relative bg-white text-black rounded-xl overflow-y-auto transition duration-200",
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2.5",
          )}
        >
          <div className="flex justify-between gap-2.5 items-center rounded-t-xl bg-primary text-white" style={{ padding: MENU_PADDING }}>
            <div className="text-xl font-bold">{title}</div>
            <button
              onClick={() => setOpen(false)}
              className="text-white bg-transparent border-0 cursor-pointer transition-colors duration-100 hover:text-grey-200"
            >
              <X size={25} />
            </button>
          </div>
          <MenuList
            items={items}
            onSelect={(value) => {
              onSelect(value)
              setOpen(false)
            }}
            emptyMessage={emptyMessage}
          />
        </div>
      </div>
    </>,
    document.body
  )
}

export default Dropdown
