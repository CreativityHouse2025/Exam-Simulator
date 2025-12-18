import { useState, useCallback } from "react"
import { GenerateReportRequest } from "../types"

type UseReportProps = GenerateReportRequest

/**
 * Custom hook to generate a report PDf Base64 using generate-report API
 * @returns Generated Base64 PDF
 */
export function useReport() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pdfBase64, setPdfBase64] = useState<string | null>(null)

    const generateReport = useCallback(
        async ({
            exam,
            userAnswers,
            langCode,
            userFullName,
        }: UseReportProps) => {
            setLoading(true)
            setError(null)
            setPdfBase64(null)

            try {
                const res = await fetch("/api/generate-report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ exam, userAnswers, langCode, userFullName })
                })

                if (!res.ok) {
                    throw new Error(`Server returned ${res.status}`)
                }

                const data = await res.json()
                const { pdfBase64 } = data
                setPdfBase64(pdfBase64)

                return pdfBase64
            } catch (err: any) {
                console.error(err)
                setError(err.message || "Failed to generate report")
            } finally {
                setLoading(false)
            }
        },
        []
    )

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

    return {
        loading,
        error,
        pdfBase64,
        generateReport,
        downloadReport
    }
}
