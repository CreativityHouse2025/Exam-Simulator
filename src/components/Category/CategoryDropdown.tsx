import React from "react";
import styled from "styled-components";
import type { Category, Lang, LangCode, ThemedStyles } from "../../types";
import { Close } from '@styled-icons/material/Close'
import { GENERAL_CATEGORY_ID, MENU_PADDING } from "../../constants";
import MenuList from "./MenuList";
import rawCategories from '../../data/exam-data/categories.json'
import useCategoryLabel from "../../hooks/useCategoryLabel";
import useSettings from "../../hooks/useSettings";

type DropdownProps = {
  title: string
  open: boolean
  setOpen: (open: boolean) => void
  onSelect: (value: Category['id']) => void
  buttonRef?: React.RefObject<HTMLButtonElement | null>
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
  width: clamp(28rem, 30vw, 40rem);
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

const CategoryDropdown: React.FC<DropdownProps> = ({ buttonRef, open, setOpen, title, onSelect }) => {

  const { settings } = useSettings();
  const langCode: LangCode = settings.language;

  const menuRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) && // click is outside menu
        (!buttonRef?.current || !buttonRef.current.contains(target)) // and outside button
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


  const generalCategory: Category = {
    id: GENERAL_CATEGORY_ID,
    label: useCategoryLabel(GENERAL_CATEGORY_ID) as string
  }
  const categories: Category[] = [generalCategory, ...rawCategories.map(c => ({
    id: c.id,
    label: c['name'][langCode]
  }))]

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
          <MenuList categories={categories} onSelect={(value) => { onSelect(value); setOpen(false)} }/>
        </Menu>
      </MenuStyles>
    </>
  );
};

export default CategoryDropdown;
