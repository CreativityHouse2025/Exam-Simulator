import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jsPDF } from "jspdf";
import fs from "fs";
import { GenerateReportRequest } from "../src/types.js";
import { formatChoiceLabel } from "../src/utils/format.js";

// --------------------
// Layout helpers (RTL-safe)
// --------------------

function ensurePage(doc: jsPDF, yRef: { y: number }, pageHeight: number) {
    if (yRef.y > pageHeight - 100) {
        doc.addPage();
        yRef.y = 50;
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
    options: any
) {
    ensurePage(doc, yRef, pageHeight);

    doc.text(text, x, yRef.y, {
        ...options,
        maxWidth: width,
    });

    const dim = doc.getTextDimensions(text, { maxWidth: width });
    yRef.y += Math.max(dim.h, lineHeight);
}

// --------------------
// API handler
// --------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { exam, userAnswers, langCode, userFullName, translations } =
            req.body as GenerateReportRequest;

        if (!exam?.length || !userAnswers?.length) {
            throw new Error("Cannot generate PDF: invalid input");
        }

        const doc = new jsPDF({ unit: "pt", format: "a4" });

        const isArabic = langCode === "ar";
        const baseFont = isArabic ? "Amiri" : "Helvetica";

        // --------------------
        // Fonts
        // --------------------

        const regularFont = fs.readFileSync(
            `${process.cwd()}/src/assets/fonts/Amiri-Regular.ttf`,
            "base64"
        );
        doc.addFileToVFS("Amiri-Regular.ttf", regularFont);
        doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");

        if (isArabic) {
            const boldFont = fs.readFileSync(
                `${process.cwd()}/src/assets/fonts/Amiri-Bold.ttf`,
                "base64"
            );
            doc.addFileToVFS("Amiri-Bold.ttf", boldFont);
            doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
        }

        // --------------------
        // Layout constants
        // --------------------

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 50;
        const usableWidth = pageWidth - margin * 2;

        const textAlign: "left" | "right" = isArabic ? "right" : "left";
        const xText = isArabic ? pageWidth - margin : margin;

        const textOptions = {
            align: textAlign,
            isOutputRtl: isArabic,
            isSymmetricSwapping: isArabic,
        };

        // --------------------
        // Header
        // --------------------

        let headerY = 100;

        doc.setFont("Amiri", "normal");
        doc.setFontSize(22);
        doc.text(translations.companyName, pageWidth / 2, headerY, {
            ...textOptions,
            align: "center",
        });

        headerY += 30;

        const logoBuffer = fs.readFileSync(
            `${process.cwd()}/src/assets/logo-compressed.jpeg`
        );
        const logoBase64 = logoBuffer.toString("base64");

        doc.addImage(logoBase64, "JPEG", pageWidth / 2 - 40, headerY, 80, 80);

        headerY += 120;

        doc.setFontSize(18);
        doc.text(translations.reportTitle, pageWidth / 2, headerY, {
            ...textOptions,
            align: "center",
        });

        headerY += 30;

        doc.setFontSize(16);
        doc.text(
            `${translations.fullName}: ${userFullName}`,
            pageWidth / 2,
            headerY,
            { ...textOptions, align: "center" }
        );

        headerY += 500;

        const timestamp = new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        doc.setFontSize(12);
        doc.text(timestamp, pageWidth / 2, headerY, {
            ...textOptions,
            align: "center",
        });

        // --------------------
        // Questions
        // --------------------

        doc.addPage();
        const yRef = { y: 50 };

        exam.forEach((q, index) => {
            doc.setFont(baseFont, "normal");
            doc.setFontSize(14);

            drawParagraph(
                doc,
                `${index + 1}. ${q.text}`,
                xText,
                yRef,
                usableWidth,
                pageHeight,
                16,
                textOptions
            );

            yRef.y += 10;

            const userAnswerIndexes = userAnswers[index] ?? [];
            const choiceIndent = 20;
            const choiceX = isArabic ? xText - choiceIndent : xText + choiceIndent;
            const choiceWidth = usableWidth - choiceIndent;

            q.choices.forEach((choice, choiceIndex) => {
                const userChose = userAnswerIndexes.includes(choiceIndex);
                const isCorrect = choice.correct;

                if (userChose && !isCorrect) doc.setTextColor(128, 0, 0);
                else if (isCorrect) doc.setTextColor(0, 128, 0);
                else doc.setTextColor(150, 150, 150);

                doc.setFont(baseFont, userChose ? "bold" : "normal");
                doc.setFontSize(12);

                const label = formatChoiceLabel(choiceIndex, langCode);

                drawParagraph(
                    doc,
                    `${label}. ${choice.text}`,
                    choiceX,
                    yRef,
                    choiceWidth,
                    pageHeight,
                    16,
                    textOptions
                );

                yRef.y += 5;
            });

            yRef.y += 4;

            const missing = userAnswerIndexes.length === 0;
            const userCorrect =
                !missing &&
                userAnswerIndexes.every((i) => q.choices[i]?.correct) &&
                q.choices.filter((c) => c.correct).length ===
                userAnswerIndexes.length;

            doc.setFont(baseFont, "normal");
            doc.setFontSize(12);
            doc.setTextColor(userCorrect ? 0 : 128, userCorrect ? 128 : 0, 0);

            const resultText = missing
                ? translations.missing
                : userCorrect
                    ? translations.correct
                    : translations.incorrect;

            drawParagraph(
                doc,
                resultText,
                xText,
                yRef,
                usableWidth,
                pageHeight,
                16,
                textOptions
            );

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);

            drawParagraph(
                doc,
                `${translations.explanation}: ${q.explanation}`,
                xText,
                yRef,
                usableWidth,
                pageHeight,
                14,
                textOptions
            );

            yRef.y += 30;
        });

        const pdfBase64 = doc.output("datauristring").split(",")[1];
        doc.save("report.pdf")
        res.status(200).json({ pdfBase64 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
}
