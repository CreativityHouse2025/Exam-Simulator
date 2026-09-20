import React from "react"
import { useNavigate } from "react-router-dom"
import { RefreshCw } from "lucide-react"
import AttemptHistoryTable from "../components/attempt-history/AttemptHistoryTable"
import Loading from "../components/Loading"
import { translate } from "../utils/translation"
import { ROUTES } from "../config/routes"
import { useQuery } from "@tanstack/react-query"
import { createAttemptsQueryOptions } from "../utils/queryOptions"
import { useSessionControl } from "../contexts"
import useAuth from "../hooks/useAuth"
import useToast from "../hooks/useToast"
import { cn } from "../components/ui/utils"

/** Displays the user's last exam attempts in a full-page editorial table. */
const AttemptHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { resumeAttempt, startRevision } = useSessionControl()
  const { showToast } = useToast()
  // The user's own first enrolled track — this page has no track picker.
  const { enrolledTracks } = useAuth()
  const trackId = enrolledTracks[0]?.id ?? ""
  const { data: attempts = [], isPending, isFetching, refetch, error } = useQuery({
    ...createAttemptsQueryOptions(trackId),
    enabled: trackId !== "",
  })
  const [isStarting, setIsStarting] = React.useState(false)

  React.useEffect(() => {
    if (error) showToast("history.fetchError")
  }, [error])

  const handleContinue = async (id: string) => {
    setIsStarting(true)
    const attemptId = await resumeAttempt(id)
    if (attemptId) navigate(ROUTES.exam.to(attemptId))
    else setIsStarting(false)
  }

  const handleReview = async (id: string) => {
    setIsStarting(true)
    const attemptId = await resumeAttempt(id)
    if (attemptId) navigate(ROUTES.exam.to(attemptId))
    else setIsStarting(false)
  }

  const handleRetry = async (id: string) => {
    setIsStarting(true)
    const attemptId = await startRevision(id)
    if (attemptId) navigate(ROUTES.exam.to(attemptId, true))
    else setIsStarting(false)
  }

  if (isStarting) return <Loading size={100} />

  return (
    // Extends PageWrapper — same gradient background, content starts top-left.
    <div className="flex box-border items-start justify-start justify-self-start pt-0 px-5 pb-20">
      <div className="max-w-265 w-full mx-auto">
        <div className="flex items-start justify-between mt-5 mb-7.5">
          <div>
            <h1 className="font-sans text-2xl md:text-3xl font-bold text-tertiary mb-1 tracking-tight animate-in fade-in slide-in-from-top-2.5 animation-duration-500 ease-out fill-mode-both">
              {translate("history.title")}
            </h1>
            <p className="font-sans text-base text-grey-900 m-0 max-w-120 leading-relaxed animate-in fade-in animation-duration-500 ease-out delay-150 fill-mode-both">
              {translate("history.subtitle")}
            </p>
          </div>
          <RefreshCw
            onClick={() => refetch()}
            className={cn(
              "size-6.25 text-grey-900 cursor-pointer shrink-0 self-center transition-opacity duration-150 md:hidden",
              isFetching ? "animate-spin-fast opacity-50" : "opacity-100",
            )}
          />
        </div>

        <AttemptHistoryTable
          attempts={attempts}
          loading={isPending}
          isFetching={isFetching}
          onRefresh={refetch}
          onContinue={handleContinue}
          onReview={handleReview}
          onRetry={handleRetry}
        />
      </div>
    </div>
  )
}

export default AttemptHistoryPage
