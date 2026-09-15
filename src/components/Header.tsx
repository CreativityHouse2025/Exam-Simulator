import { useNavigate } from "react-router-dom"
import React from 'react'
import { Languages, Menu } from 'lucide-react'
// @ts-expect-error -- pre-existing, unrelated to this change
import Logo from '../assets/logo.png'
import { translate } from '../utils/translation'
import useSettings from '../hooks/useSettings'
import useAuth from '../hooks/useAuth'
import { roleOf } from '../config/roles'
import { ROUTES } from '../config/routes'
import { getNavItems } from '../config/nav'
import { cn } from './ui/utils'

/** App header with language toggle and role-driven navigation icons. */
const HeaderComponent: React.FC = () => {
  const title = translate('about.title')
  const navigate = useNavigate()
  const { settings, updateLanguage } = useSettings()
  const { user } = useAuth()
  const navItems = getNavItems(roleOf(user))
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const toggleLanguage = React.useCallback(() => {
    const nextCode = settings.language === "ar" ? "en" : "ar"
    updateLanguage(nextCode)
  }, [settings.language, updateLanguage])

  function handleHomepage() {
    navigate(ROUTES.home)
  }

  function handleMenuAction(action: () => void) {
    setIsMenuOpen(false)
    action()
  }

  React.useEffect(() => {
    function handlePointerOutside(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerOutside)
    return () => document.removeEventListener('pointerdown', handlePointerOutside)
  }, [])

  return (
    <div
      id="header"
      className="flex flex-row items-center justify-between sticky top-0 w-full bg-primary px-3 md:px-7.5 z-100"
    >
      <img
        title="Creativity House"
        alt="Creativity House Logo"
        id="image"
        className="no-select cursor-pointer justify-self-center w-11.25 md:w-15"
        src={Logo}
        onClick={handleHomepage}
      />

      <div
        id="title"
        className="no-select absolute left-1/2 -translate-x-1/2 text-lg md:text-xl font-bold text-black cursor-pointer whitespace-nowrap"
        onClick={handleHomepage}
      >
        {title}
      </div>

      <div className="hidden md:flex flex-row items-center gap-2.5">
        <div
          title="Change language"
          aria-label="Language Icon"
          id="language"
          className="no-select justify-self-center cursor-pointer [&>svg]:text-black"
          onClick={toggleLanguage}
        >
          <Languages size={38} />
        </div>
        {navItems.map(({ icon: Icon, path, labelKey }) => (
          <div
            key={path}
            title={translate(labelKey)}
            aria-label={translate(labelKey)}
            className="no-select justify-self-center cursor-pointer [&>svg]:text-black"
            onClick={() => navigate(path)}
          >
            <Icon size={35} />
          </div>
        ))}
      </div>

      <div ref={menuRef} className="relative md:hidden">
        <button
          aria-label="Open menu"
          className="flex items-center justify-center bg-transparent cursor-pointer p-1 text-black"
          onClick={() => setIsMenuOpen(prev => !prev)}
        >
          <Menu size={32} />
        </button>
        <div
          className={cn(
            "flex flex-col absolute top-full mt-1.25 end-0 bg-tertiary rounded-md shadow-8 min-w-45 overflow-hidden",
            "z-200 origin-top transition duration-180",
            isMenuOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-85 pointer-events-none",
          )}
        >
          <button
            className="flex items-center gap-2.25 bg-transparent cursor-pointer py-2.25 px-2.75 text-quatro text-xs font-semibold text-start w-full transition-colors duration-150 hover:bg-secondary [&>svg]:text-primary [&>svg]:shrink-0"
            onClick={() => handleMenuAction(toggleLanguage)}
          >
            <Languages size={22} />
            {translate('header.changeLanguage')}
          </button>
          {navItems.map(({ icon: Icon, path, labelKey }) => (
            <button
              key={path}
              className="flex items-center gap-2.25 bg-transparent cursor-pointer py-2.25 px-2.75 text-quatro text-xs font-semibold text-start w-full transition-colors duration-150 hover:bg-secondary disabled:hidden [&>svg]:text-primary [&>svg]:shrink-0"
              onClick={() => handleMenuAction(() => navigate(path))}
            >
              <Icon size={22} />
              {translate(labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HeaderComponent
