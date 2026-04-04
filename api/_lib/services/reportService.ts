import { jsPDF } from "jspdf"
import fs from "fs"
import type { GenerateReportRequestBody, LangCode } from "../types.js"

const CHOICE_LABELS: Record<LangCode, string[]> = {
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ar: "أبجدهوزحطيكلمنسعفصقرشتثخذضظغ".split(""),
}

function formatChoiceLabel(index: number, lang: LangCode): string {
  return CHOICE_LABELS[lang][index] ?? "A"
}

type TextOptions = {
  align: "left" | "right"
  isOutputRtl: boolean
  isSymmetricSwapping: boolean
}

/**
 * Inserts a ZWNJ before Arabic punctuation so jsPDF's shaper
 * correctly breaks the joining context (final-form fix).
 */
function fixArabicShaping(text: string): string {
  return text.replace(/([\u0600-\u06FF])([\u061F\u060C\u061B])/g, "$1 $2")
}

function ensurePage(doc: jsPDF, yRef: { y: number }, pageHeight: number): void {
  if (yRef.y > pageHeight - 100) {
    doc.addPage()
    yRef.y = 50
  }
}

/**
 * RTL/LTR-safe paragraph renderer.
 * IMPORTANT:
 * - Do NOT use splitTextToSize (breaks RTL width calculation)
 * - Always rely on maxWidth in doc.text
 */
function drawParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  yRef: { y: number },
  width: number,
  pageHeight: number,
  lineHeight: number,
  options: TextOptions
): void {
  ensurePage(doc, yRef, pageHeight)
  const shaped = options.isOutputRtl ? fixArabicShaping(text) : text
  // jsPDF overestimates connected Arabic glyph widths (uses isolated-form metrics),
  // so we widen maxWidth to prevent premature line wrapping in RTL text.
  const effectiveWidth = options.isOutputRtl ? width * 1.11 : width
  doc.text(shaped, x, yRef.y, { ...options, maxWidth: effectiveWidth })
  const dim = doc.getTextDimensions(shaped, { maxWidth: effectiveWidth })
  yRef.y += Math.max(dim.h, lineHeight)
}

/**
 * Generates a PDF exam report and returns it as a base64 string.
 */
export function generatePdf({ exam, userAnswers, langCode, userFullName, translations }: GenerateReportRequestBody): string {
  const doc = new jsPDF({ unit: "pt", format: "a4" })

  const isArabic = langCode === "ar"
  const baseFont = "NotoSansArabic"

  // --------------------
  // Fonts
  // --------------------

  const regularFont = fs.readFileSync(`${process.cwd()}/src/assets/fonts/NotoSansArabic-Regular.ttf`, "base64")
  doc.addFileToVFS("NotoSansArabic-Regular.ttf", regularFont)
  doc.addFont("NotoSansArabic-Regular.ttf", "NotoSansArabic", "normal")

  // Register Medium as "bold" — used for emphasis in both Arabic and English
  const mediumFont = fs.readFileSync(`${process.cwd()}/src/assets/fonts/NotoSansArabic-Medium.ttf`, "base64")
  doc.addFileToVFS("NotoSansArabic-Medium.ttf", mediumFont)
  doc.addFont("NotoSansArabic-Medium.ttf", "NotoSansArabic", "bold")

  // --------------------
  // Layout constants
  // --------------------

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 50
  const usableWidth = pageWidth - margin * 2

  const textAlign: "left" | "right" = isArabic ? "right" : "left"
  const xText = isArabic ? pageWidth - margin : margin

  const textOptions: TextOptions = {
    align: textAlign,
    isOutputRtl: isArabic,
    isSymmetricSwapping: isArabic,
  }

  // --------------------
  // Header
  // --------------------

  let headerY = 100

  doc.setFont("NotoSansArabic", "normal")
  doc.setFontSize(22)
  doc.text(translations.companyName, pageWidth / 2, headerY, { ...textOptions, align: "center" })

  headerY += 30

  const logoBuffer = fs.readFileSync(`${process.cwd()}/src/assets/logo-compressed.jpeg`)
  const logoBase64 = logoBuffer.toString("base64")
  doc.addImage(logoBase64, "JPEG", pageWidth / 2 - 40, headerY, 80, 80)

  headerY += 120

  doc.setFontSize(18)
  doc.text(translations.reportTitle, pageWidth / 2, headerY, { ...textOptions, align: "center" })

  headerY += 30

  doc.setFontSize(16)
  doc.text(`${translations.fullName}: ${userFullName}`, pageWidth / 2, headerY, { ...textOptions, align: "center" })

  headerY += 500

  const timestamp = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  doc.setFontSize(12)
  doc.text(timestamp, pageWidth / 2, headerY, { ...textOptions, align: "center" })

  // --------------------
  // Questions
  // --------------------

  doc.addPage()
  doc.setLineHeightFactor(1.35)
  const yRef = { y: 50 }

  exam.forEach((q, index) => {
    doc.setFont(baseFont, "normal")
    doc.setFontSize(12)

    drawParagraph(doc, `${index + 1}. ${q.text}`, xText, yRef, usableWidth, pageHeight, 16, textOptions)

    yRef.y += 10

    const userAnswerIndexes = userAnswers[index] ?? []
    const choiceIndent = 20
    const choiceX = isArabic ? xText - choiceIndent : xText + choiceIndent
    const choiceWidth = usableWidth - choiceIndent

    q.choices.forEach((choice, choiceIndex) => {
      const userChose = userAnswerIndexes.includes(choiceIndex)
      const isCorrect = choice.correct

      if (userChose && !isCorrect) doc.setTextColor(128, 0, 0)
      else if (isCorrect) doc.setTextColor(0, 128, 0)
      else doc.setTextColor(150, 150, 150)

      doc.setFont(baseFont, userChose ? "bold" : "normal")
      doc.setFontSize(11)

      const label = formatChoiceLabel(choiceIndex, langCode)
      drawParagraph(doc, `${label}. ${choice.text}`, choiceX, yRef, choiceWidth, pageHeight, 16, textOptions)

      yRef.y += 5
    })

    yRef.y += 4

    const missing = userAnswerIndexes.length === 0
    const userCorrect =
      !missing &&
      userAnswerIndexes.every((i) => q.choices[i]?.correct) &&
      q.choices.filter((c) => c.correct).length === userAnswerIndexes.length

    doc.setFont(baseFont, "normal")
    doc.setFontSize(11)
    doc.setTextColor(userCorrect ? 0 : 128, userCorrect ? 128 : 0, 0)

    const resultText = missing ? translations.missing : userCorrect ? translations.correct : translations.incorrect
    drawParagraph(doc, resultText, xText, yRef, usableWidth, pageHeight, 16, textOptions)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)

    drawParagraph(
      doc,
      `${translations.explanation}: ${q.explanation}`,
      xText,
      yRef,
      usableWidth,
      pageHeight,
      16,
      textOptions
    )

    yRef.y += 30
  })

  return doc.output("datauristring").split(",")[1]
}
