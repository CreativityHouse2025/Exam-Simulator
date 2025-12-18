import type { VercelRequest, VercelResponse } from '@vercel/node'
import { jsPDF } from "jspdf"
import { LangCode, GenerateReportRequest } from "../src/types"
import fs from "fs"
import reshaper from "arabic-persian-reshaper"

import bidiFactory from "bidi-js";
const bidi: any = bidiFactory(); // do this once

function shapeArabic(text: string): string {
    if (!text) return text;

    // 1. Reshape the characters (joining logic)
    const reshaped = reshaper.ArabicShaper.convertArabic(text);

    // 2. Compute embedding levels for the reshaped text (treat overall as RTL)
    const embeddingLevels = bidi.getEmbeddingLevels(reshaped, "rtl");

    // 3. Get the ranges that need visual reversal
    const flips = bidi.getReorderSegments(reshaped, embeddingLevels);

    // 4. Apply reversals to get visual order
    const chars = reshaped.split("");
    // @ts-ignore
    flips.forEach(([start, end]) => {
        const segment = chars.slice(start, end + 1).reverse();
        chars.splice(start, segment.length, ...segment);
    });

    const visual = chars.join("");

    return visual;
}

function prepareText(text: string, langCode: LangCode): string {
    return langCode === "ar" ? shapeArabic(text) : text
}

// --------------------------
// Main API
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" })
        return
    }

    try {
        const { exam, userAnswers, langCode, userFullName } = req.body as GenerateReportRequest

        if (exam.length === 0 || userAnswers.length === 0) {
            throw new Error("Cannot generate PDF: invalid input")
        }

        const doc = new jsPDF({ unit: "pt", format: "a4" })

        const isArabic = langCode === "ar"
        const baseFont = isArabic ? "Amiri" : "Helvetica"

        if (isArabic) {
            // Load TTF font from disk (or bundle)
            const fontData = fs.readFileSync(`${process.cwd()}/src/assets/fonts/Amiri-Regular.ttf`, "base64")
            doc.addFileToVFS("Amiri-Regular.ttf", fontData)
            doc.addFont("Amiri-Regular.ttf", "Amiri", "normal")
        }

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 50
        const textAlign = isArabic ? "right" : "left"
        const xStart = isArabic ? pageWidth - margin : margin

        // Header placeholders
        const companyName = "My Company Name"
        const categoryName = "Category Placeholder"
        const examTypeName = "Exam Type Placeholder"
        const timestamp = new Date().toLocaleString()

        doc.setFont(baseFont, "normal")
        doc.setFontSize(22)
        doc.text(prepareText(companyName, langCode), pageWidth / 2, 50, { align: "center" })

        const fileBuffer = fs.readFileSync(`${process.cwd()}/src/assets/logo-compressed.jpeg`)
        const logoBase64 = fileBuffer.toString("base64")

        doc.addImage(logoBase64, "JPEG", pageWidth / 2 - 40, 60, 80, 80, "", "FAST")

        doc.setFontSize(18)
        doc.text(prepareText(`Exam report for ${userFullName}`, langCode), pageWidth / 2, 170, { align: "center" })

        // Session info
        doc.setFontSize(12)
        let y = 210
        doc.text(prepareText(`Exam Type: ${examTypeName}`, langCode), xStart, y, { align: textAlign })
        y += 20
        doc.text(prepareText(`Category: ${categoryName}`, langCode), xStart, y, { align: textAlign })
        y += 20
        doc.text(prepareText(`Timestamp: ${timestamp}`, langCode), xStart, y, { align: textAlign })
        y += 30

        // Questions
        doc.addPage()
        y = 50
       

        exam.forEach((q, index) => {
            if (y > pageHeight - 120) { doc.addPage(); y = 50 }

            doc.setFontSize(14)
            doc.text(prepareText(`Q${index + 1}. ${q.text}`, langCode), xStart, y, { align: textAlign, maxWidth: pageWidth - margin * 2 })
            y += 25

            doc.setFontSize(12)
            const userAnswerIndexes = userAnswers[index] ?? []

            q.choices.forEach((choice, choiceIndex) => {
                const isCorrect = choice.correct
                const userChose = userAnswerIndexes.includes(choiceIndex)
                if (isCorrect) doc.setTextColor(0, 128, 0)
                else if (userChose) doc.setTextColor(128, 0, 0)
                else doc.setTextColor(0, 0, 0)

                doc.text(
                    prepareText(`• ${choice.text}`, langCode),
                    isArabic ? xStart - 20 : xStart + 20,
                    y,
                    { align: textAlign, maxWidth: pageWidth - margin * 2 - 20 }
                )
                y += 18
            })

            doc.setTextColor(0, 0, 0)
            y += 10
            doc.setFontSize(11)
            doc.text(prepareText(`Explanation: ${q.explanation}`, langCode), xStart, y, { align: textAlign, maxWidth: pageWidth - margin * 2 })
            y += 35
        })

        const pdfBase64 = doc.output("datauristring").split(",")[1]

        res.status(200).json({ pdfBase64 })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to generate PDF" })
    }
}
