import React from "react";
import styled from "styled-components";
import type { DropdownItem, ThemedStyles } from "../../types";
import { Close } from "@styled-icons/material/Close";
import { MENU_PADDING } from "../../constants";
import MenuList from "./MenuList";

type DropdownProps<TId = number, TLabel = string> = {
  title: string
  open: boolean
  setOpen: (open: boolean) => void
  onSelect: (value: TId) => void
  items: DropdownItem<TId, TLabel>[]
  buttonRef?: React.RefObject<HTMLButtonElement | null>
  emptyMessage?: string
};

// overlay for blur effect
const Overlay = styled.div<{ open: boolean }>`
  position: fixed;
  inset: 0;
  backdrop-filter: ${(p) => (p.open ? "blur(6px)" : "none")};
  background: ${(p) => (p.open ? "rgba(0,0,0,0.15)" : "transparent")};
  pointer-events: ${(p) => (p.open ? "auto" : "none")};
  transition: backdrop-filter 0.25s ease, background 0.25s ease;
  z-index: 40;
`;

// center wrapper
const MenuStyles = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  padding: 1rem;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const Menu = styled.div<{ open: boolean } & ThemedStyles>`
  font-family: ${({ theme }) => theme.fontFamily};
  position: relative;
  background: ${({ theme }) => theme.white};
  color: ${({ theme }) => theme.black};
  border-radius: 10px;
  width: clamp(45rem, 50vw, 70rem);
  box-shadow: 0 8px 20px rgba(0,0,0,0.18);
  opacity: ${(p) => (p.open ? 1 : 0)};
  transform: translateY(${(p) => (p.open ? "0" : "10px")});
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: ${(p) => (p.open ? "auto" : "none")};
`;

const MenuHeader = styled.div<ThemedStyles>`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  border-radius: 10px 10px 0 0;
  padding: ${MENU_PADDING};
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.white};
`;

const Title = styled.div<ThemedStyles>`
  font-size: 2rem;
  font-weight: 700;
`;

const CloseButton = styled.button<ThemedStyles>`
  color: ${({ theme }) => theme.white};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.1s ease;
  &:hover {
    color: ${({ theme }) => theme.grey[2]};
  }
`;

const Dropdown = <TId, TLabel>({
  buttonRef,
  open,
  setOpen,
  title,
  onSelect,
  items,
  emptyMessage
}: DropdownProps<TId, TLabel>) => {
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!buttonRef?.current || !buttonRef.current.contains(target))
      ) {
        setTimeout(() => setOpen(false), 100);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [buttonRef, setOpen]);

  return (
    <>
      <Overlay open={open} />

      <MenuStyles id="menu" style={{ pointerEvents: open ? "auto" : "none" }}>
        <Menu ref={menuRef} open={open}>
          <MenuHeader>
            <Title>{title}</Title>
            <CloseButton onClick={() => setOpen(false)}>
              <Close size={25} />
            </CloseButton>
          </MenuHeader>
          <MenuList
            items={items}
            onSelect={(value) => {
              onSelect(value);
              setOpen(false);
            }}
            emptyMessage={emptyMessage}
          />
        </Menu>
      </MenuStyles>
    </>
  );
};

export default Dropdown;
