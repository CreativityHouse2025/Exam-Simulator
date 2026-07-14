import type { ReactNode } from "react"
// @ts-expect-error
import Logo from "@/assets/logo.png"
import { translate } from "@/utils/translation"

type DashboardProps = {
  subtitle: string
  children: ReactNode
}

/** Shared dashboard shell — Creativity House logo + title (100% shared), subtitle and action buttons injected per role. */
const Dashboard = ({ subtitle, children }: DashboardProps) => {
  return (
    <div
      id="dashboard"
      className="tailwind-page flex flex-1 flex-col items-center justify-center justify-self-center p-2.5"
    >
      <img
        id="image"
        src={Logo}
        alt={translate("cover.logo-alt")}
        className="m-1 max-h-[25vh] animate-[fadeIn_0.5s_ease-out_0s_both] border border-grey-200 p-2 md:m-2.5 md:max-h-[40vh] md:p-2.5"
      />

      <div className="text-center">
        <h1
          id="title"
          className="mb-1 animate-[fadeIn_0.5s_ease-out_0.1s_both] text-2xl font-bold text-black md:text-3xl"
        >
          {translate("about.title")}
        </h1>

        <p
          id="subtitle"
          className="mb-4 animate-[fadeIn_0.5s_ease-out_0.2s_both] p-1 text-base md:mb-8 md:p-2.5 md:text-2xl"
        >
          {subtitle}
        </p>
      </div>

      <div
        id="button-container"
        className="flex w-full animate-[fadeIn_0.5s_ease-out_0.3s_both] flex-col items-stretch gap-1.5 md:w-auto"
      >
        {children}
      </div>
    </div>
  )
}

export default Dashboard
