import jsPDF from "jspdf"
import { Exam, Question, Answers } from "../types"
import { getExamByQuestionIds } from "./exam"


function getBase64Image(
    url: string,
    quality: number = 0.8
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;

        img.onload = () => {
            let { width, height } = img;

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Cannot get canvas context");

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG with quality
            resolve(canvas.toDataURL("image/jpeg", quality));
        };

        img.onerror = (err) => reject(err);
    });
}


export async function generateExamReportBase64Pdf(
    questionIds: Question['id'][],
    userAnswers: Answers,
    lang: string,
    userFullName: string,
    logoURL: string
): Promise<string> {
    const doc = new jsPDF({ unit: "pt" })

    // ---------------------------------------------------------------------------
    // 📌 Fake placeholders – replace with your actual data retrieval later
    const companyName = "My Company Name"
    const categoryName = "Category Placeholder"
    const examTypeName = "Exam Type Placeholder"
    const timestamp = new Date().toLocaleString()

    // Build header
    doc.setFontSize(22)
    doc.setFont("Helvetica", "bold")

    const pageWidth = doc.internal.pageSize.getWidth()
    doc.text(companyName, pageWidth / 2, 50, { align: "center" })

    // Put logo
    const logoBase64 = await getBase64Image(logoURL);
    doc.addImage(logoBase64, "PNG", pageWidth / 2 - 40, 60, 80, 80, '', "FAST")

    // Build title
    doc.setFontSize(18)
    doc.text(`Exam report for ${userFullName}`, pageWidth / 2, 170, {
        align: "center"
    })

    // Session details
    doc.setFontSize(12)
    let y = 210

    doc.text(`Exam Type: ${examTypeName}`, 50, y); y += 20
    doc.text(`Category: ${categoryName}`, 50, y); y += 20
    doc.text(`Language: ${lang}`, 50, y); y += 20
    doc.text(`Timestamp: ${timestamp}`, 50, y); y += 30

    // Questions
    doc.addPage()
    y = 50

    const exam: Exam = getExamByQuestionIds(questionIds)

    exam.forEach((q, index) => {
        // Add new page if near bottom
        if (y > doc.internal.pageSize.getHeight() - 120) {
            doc.addPage()
            y = 50
        }

        // -------------------------------
        // Question number and text
        doc.setFont("Helvetica", "bold")
        doc.setFontSize(14)
        doc.text(`Q${index + 1}. ${q.text}`, 40, y)
        y += 25

        doc.setFont("Helvetica", "normal")
        doc.setFontSize(12)

        // Get the user answer indexes for this question
        const userAnswerIndexes = userAnswers[index]

        // -------------------------------
        // List choices
        q.choices.forEach((choice, choiceIndex) => {
            const isCorrect = choice.correct
            const userChose = userAnswerIndexes.includes(choiceIndex)

            // Highlight correct in green
            doc.setTextColor(0, isCorrect ? 128 : 0, 0)

            // highlight in green, if user chose but wrong, highlight in red

            let label = `• ${choice.text}`
            if (userChose && !isCorrect) {
                doc.setTextColor(128, 0, 0)
            }

            doc.text(label, 60, y)
            y += 18
        })

        // Reset color for explanation
        doc.setTextColor(0, 0, 0)

        // -------------------------------
        // Explanation
        y += 10
        doc.setFont("Helvetica", "italic")
        doc.text(`Explanation: ${q.explanation}`, 50, y)
        doc.setFont("Helvetica", "normal")
        y += 35
    })


    const pdfBase64 = doc.output("datauristring").split(",")[1]
    doc.save("report.pdf")
    return pdfBase64
}
