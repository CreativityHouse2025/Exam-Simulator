import type { VercelRequest, VercelResponse } from '@vercel/node'
import { jsPDF } from "jspdf"
import { GenerateReportRequest } from "../src/types"
import fs from "fs"
import { formatChoiceLabel } from '../src/utils/format.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const { exam, userAnswers, langCode, userFullName, translations } = req.body as GenerateReportRequest;

        if (exam.length === 0 || userAnswers.length === 0) {
            throw new Error("Cannot generate PDF: invalid input");
        }
        

        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const isArabic = langCode === "ar";
        const baseFont = isArabic ? "Amiri" : "Helvetica";

        if (isArabic) {
            const regularFontData = fs.readFileSync(`${process.cwd()}/src/assets/fonts/Amiri-Regular.ttf`, "base64");
            doc.addFileToVFS("Amiri-Regular.ttf", regularFontData);
            doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");

            const boldFontData = fs.readFileSync(`${process.cwd()}/src/assets/fonts/Amiri-Bold.ttf`, "base64");
            doc.addFileToVFS("Amiri-Bold.ttf", boldFontData);
            doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 50;
        const textAlign = isArabic ? "right" : "left";
        const xStart = isArabic ? pageWidth - margin : margin;

        // --- HEADER ---
        let headerY = 150;
        const fileBuffer = fs.readFileSync(`${process.cwd()}/src/assets/logo-compressed.jpeg`);
        const logoBase64 = fileBuffer.toString("base64");
        doc.setFont(baseFont, "normal");
        doc.setFontSize(22);
        doc.text(translations.companyName, pageWidth / 2, headerY, { align: "center", isOutputRtl: isArabic, isSymmetricSwapping: isArabic });
        headerY += 10;
        doc.addImage(logoBase64, "JPEG", pageWidth / 2 - 40, headerY, 80, 80, "", "FAST");
        headerY += 100;

        // Report title
        doc.setFontSize(18);
        doc.text(translations.reportTitle, pageWidth / 2, headerY, { align: "center", isOutputRtl: isArabic, isSymmetricSwapping: isArabic });
        headerY += 30;
        doc.setFontSize(16);
        doc.text(translations.fullName + ": " + userFullName, pageWidth / 2, headerY, { align: "center", isOutputRtl: isArabic, isSymmetricSwapping: isArabic });

        headerY += 500;

        const now = new Date();
        const timestamp = now.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        doc.setFontSize(12);
        doc.text(timestamp, pageWidth / 2, headerY, { align: "center", isOutputRtl: isArabic, isSymmetricSwapping: isArabic })

        // --- QUESTIONS START ON NEW PAGE ---
        doc.addPage();
        let y = 50;

        exam.forEach((q, index) => {
            // Split question text
            const questionLines = doc.splitTextToSize(`${index + 1}. ${q.text}`, pageWidth - margin * 2);
            questionLines.forEach(line => {
                if (y > pageHeight - 100) {
                    doc.addPage();
                    y = 50;
                }
                doc.setFont(baseFont, "normal");
                doc.setFontSize(14);
                doc.text(line, xStart, y, { align: textAlign, isOutputRtl: isArabic, isSymmetricSwapping: isArabic });
                y += 16;
            });
            y += 10;

            const userAnswerIndexes = userAnswers[index] ?? [];

            // --- Choices ---
            const choiceX = isArabic ? xStart - 20 : xStart + 20; // fixed x for all choices
            q.choices.forEach((choice, choiceIndex) => {
                const userChose = userAnswerIndexes.includes(choiceIndex);
                const isCorrect = choice.correct;

                // Color logic
                if (userChose && !isCorrect) doc.setTextColor(128, 0, 0);
                else if (isCorrect) doc.setTextColor(0, 128, 0);
                else doc.setTextColor(150, 150, 150);

                // Bold if chosen
                doc.setFont(baseFont, userChose ? "bold" : "normal");
                doc.setFontSize(12);

                const label = formatChoiceLabel(choiceIndex, langCode);
                const choiceLines = doc.splitTextToSize(`${label}. ${choice.text}`, pageWidth - margin * 2 - 20);
                choiceLines.forEach(line => {
                    if (y > pageHeight - 100) {
                        doc.addPage();
                        y = 50;
                    }
                    doc.text(line, choiceX, y, { align: textAlign, isOutputRtl: isArabic, isSymmetricSwapping: isArabic });
                    y += 16;
                });

                y += 5; // increased spacing between choices
            });

            // --- Gap before "Your answer..." ---
            y += 4; // extra margin to separate from choices

            // Your answer result
            const missingAnswer = userAnswerIndexes.length === 0;
            const userCorrect =
                !missingAnswer &&
                userAnswerIndexes.every((i) => q.choices[i]?.correct) &&
                q.choices.filter(c => c.correct).length === userAnswerIndexes.length;

            doc.setFont(baseFont, "normal");
            doc.setFontSize(12);
            if (userCorrect) doc.setTextColor(0, 128, 0);
            else doc.setTextColor(128, 0, 0);

            let resultText;
            if (missingAnswer) resultText = translations.missing;
            else if (userCorrect) resultText = translations.correct;
            else resultText = translations.incorrect;

            const resultLines = doc.splitTextToSize(resultText, pageWidth - margin * 2);
            resultLines.forEach(line => {
                if (y > pageHeight - 100) {
                    doc.addPage();
                    y = 50;
                }
                doc.text(line, xStart, y, { align: textAlign, isOutputRtl: isArabic, isSymmetricSwapping: isArabic });
                y += 16;
            });
            y += 4;

            // Explanation
            const explanation = translations.explanation + ": " + q.explanation;
            const explanationLines = doc.splitTextToSize(explanation, pageWidth - margin * 2);
            explanationLines.forEach(line => {
                if (y > pageHeight - 100) {
                    doc.addPage();
                    y = 50;
                }
                doc.setTextColor(0, 0, 0);
                doc.setFont(baseFont, "normal");
                doc.setFontSize(11);
                doc.text(line, xStart, y, { align: textAlign, isOutputRtl: isArabic, isSymmetricSwapping: isArabic });
                y += 14;
            });
            y += 30; // gap before next question
        });

        const pdfBase64 = doc.output("datauristring").split(",")[1];
        doc.save("report.pdf")
        res.status(200).json({ pdfBase64 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
}
