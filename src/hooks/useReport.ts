import { useState, useCallback } from "react"
import type { ApiResponse, GenerateReportRequestBody } from "../types"
import { translate } from "../utils/translation"
import { apiFetch } from "../utils/apiFetch"

type GenerateReportProps = Omit<GenerateReportRequestBody, "translations">

/**
 * Hook that generates a PDF exam report via the authenticated API.
 *
 * The caller is responsible for sending the email — use `useEmail` in the
 * component and pass `pdfBase64` as an attachment after `generateReport` resolves.
 */
export function useReport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)

  const generateReport = useCallback(async ({ exam, userAnswers, langCode, userFullName }: GenerateReportProps) => {
    setLoading(true)
    setError(null)
    setPdfBase64(null)

    try {
      const translations = {
        companyName: translate("about.title"),
        reportTitle: translate("report.title"),
        missing: translate("content.explain.yours") + translate("content.explain.missing"),
        correct: translate("content.explain.yours") + translate("content.explain.correct"),
        incorrect: translate("content.explain.yours") + translate("content.explain.incorrect"),
        explanation: translate("content.explain.explain"),
        fullName: translate("report.full-name"),
      }

      const res = await apiFetch("/api/report/pdf-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, userAnswers, langCode, userFullName, translations }),
      })

      const result: ApiResponse<{ pdfBase64: string }> = await res.json()

      if (!result.success) {
        throw new Error(result.error.message)
      }

      setPdfBase64(result.data.pdfBase64)
      return result.data.pdfBase64
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : translate("report.error")
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const downloadReport = useCallback(() => {
    if (!pdfBase64) return

    const byteCharacters = atob(pdfBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: "application/pdf" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "exam-report.pdf"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
  }, [pdfBase64])

  return { loading, error, pdfBase64, generateReport, downloadReport }
}
