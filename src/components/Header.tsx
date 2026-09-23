import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Globe, Menu, X } from "lucide-react";
// @ts-expect-error -- pre-existing, unrelated to this change
import Logo from "../assets/logo.png";
import { translate } from "../utils/translation";
import useSettings from "../hooks/useSettings";
import useAuth from "../hooks/useAuth";
import { roleOf } from "../config/roles";
import { ROUTES } from "../config/routes";
import { getNavItems } from "../config/nav";
import { cn } from "./ui/utils";

const NAV_ITEM_BASE =
  "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer";

/** App header — brand mark, language toggle and role-driven navigation. */
const HeaderComponent: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { settings, updateLanguage } = useSettings();
  const { user } = useAuth();
  const navItems = getNavItems(roleOf(user));
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // The toggle names the language it switches TO, so the label is the action rather than the state.
  const nextLanguage = settings.language === "ar" ? "en" : "ar";
  const nextLanguageLabel = nextLanguage === "ar" ? "العربية" : "English";

  // Exam content is fetched per language, so switching mid-session would need a refetch that could
  // discard unsaved answers. Locked here; the copy tells them to save, leave and come back, which
  // reloads the attempt in the language picked afterwards.
  const isInExam =
    pathname === ROUTES.exam.pattern || pathname.endsWith("/preview");
  const languageHint = isInExam
    ? translate("header.language-locked")
    : translate("header.changeLanguage");

  const toggleLanguage = React.useCallback(() => {
    if (isInExam) return;
    updateLanguage(nextLanguage);
  }, [isInExam, nextLanguage, updateLanguage]);

  function handleMenuAction(action: () => void) {
    setIsMenuOpen(false);
    action();
  }

  React.useEffect(() => {
    function handlePointerOutside(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerOutside);
    return () =>
      document.removeEventListener("pointerdown", handlePointerOutside);
  }, []);

  return (
    <header className="sticky top-0 z-100 w-full border-b border-primary/30 bg-tertiary">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 md:h-20 md:px-6">
        <button
          onClick={() => navigate(ROUTES.home)}
          aria-label={translate("about.title")}
          className="no-select flex cursor-pointer items-center bg-transparent"
        >
          {/* brightness-0 + invert forces any source colour to flat white against the plum bar. */}
          <img
            src={Logo}
            alt=""
            className="h-11 w-auto brightness-0 invert md:h-14"
          />
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ icon: Icon, path, labelKey }) => {
            const isActive = pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  NAV_ITEM_BASE,
                  // Active fill reuses the same quatro the label carries when unfilled.
                  isActive
                    ? "bg-quatro text-tertiary"
                    : "text-quatro hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon size={18} />
                {translate(labelKey)}
              </button>
            );
          })}

          <button
            onClick={toggleLanguage}
            disabled={isInExam}
            title={languageHint}
            aria-label={languageHint}
            className={cn(
              NAV_ITEM_BASE,
              "ms-1 border border-primary/40 text-quatro",
              isInExam
                ? "cursor-not-allowed opacity-45"
                : "hover:bg-white/10 hover:text-white",
            )}
          >
            <Globe size={18} />
            {nextLanguageLabel}
          </button>
        </nav>

        <div ref={menuRef} className="relative md:hidden">
          <button
            aria-label={translate("header.menu")}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-transparent text-quatro transition-colors duration-200 hover:bg-white/10"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div
            className={cn(
              "absolute end-0 top-full z-200 mt-2 min-w-48 origin-top overflow-hidden rounded-xl border border-primary/25 bg-tertiary shadow-8",
              "transition duration-200",
              isMenuOpen
                ? "pointer-events-auto scale-y-100 opacity-100"
                : "pointer-events-none scale-y-90 opacity-0",
            )}
          >
            {navItems.map(({ icon: Icon, path, labelKey }) => (
              <button
                key={path}
                onClick={() => handleMenuAction(() => navigate(path))}
                className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 bg-transparent px-3.5 text-start text-sm font-semibold text-quatro transition-colors duration-150 hover:bg-secondary [&>svg]:shrink-0 [&>svg]:text-primary"
              >
                <Icon size={20} />
                {translate(labelKey)}
              </button>
            ))}

            <button
              onClick={() => handleMenuAction(toggleLanguage)}
              disabled={isInExam}
              title={languageHint}
              className={cn(
                "flex min-h-11 w-full items-center gap-2.5 border-t border-primary/20 bg-transparent px-3.5 text-start text-sm font-semibold text-quatro transition-colors duration-150 [&>svg]:shrink-0 [&>svg]:text-primary",
                isInExam
                  ? "cursor-not-allowed opacity-45"
                  : "cursor-pointer hover:bg-secondary",
              )}
            >
              <Globe size={20} />
              {nextLanguageLabel}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent;
