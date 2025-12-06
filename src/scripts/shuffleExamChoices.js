/*
 Script to shuffle choices of each question (single-choice MCQs),
 apply the same order to the Arabic version
 */

import fs from "fs";
import path from "path";

if (process.argv.length < 5) {
    console.error('Usage: node shuffleExamChoices.js <english_file> <arabic_file> <output_directory>');
    process.exit(1);
}

// Shuffle function
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate a shuffled index order
function generateIndexOrder(length) {
    return shuffleArray([...Array(length).keys()]);
}

// Apply a specific order to choices
function applyOrder(choices, order) {
    return order.map(i => choices[i]);
}

// Shuffle exam and apply same order to Arabic
function shuffleExamSync(examEn, examAr) {
    if (examEn.length !== examAr.length) {
        throw new Error("English and Arabic exams must have the same number of questions");
    }

    const shuffledEn = [];
    const shuffledAr = [];

    for (let i = 0; i < examEn.length; i++) {
        const qEn = examEn[i];
        const qAr = examAr[i];

        const order = generateIndexOrder(qEn.choices.length);

        shuffledEn.push({
            ...qEn,
            choices: applyOrder(qEn.choices, order)
        });

        shuffledAr.push({
            ...qAr,
            choices: applyOrder(qAr.choices, order)
        });
    }

    return { shuffledEn, shuffledAr };
}

const enPath = process.argv[2];
const arPath = process.argv[3];
const outputDir = process.argv[4];

// creata output directories for EN and AR
const enOutputDir = path.join(outputDir, "en");
const arOutputDir = path.join(outputDir, "ar");

fs.mkdirSync(enOutputDir, { recursive: true });
fs.mkdirSync(arOutputDir, { recursive: true });

// Read files
const examEn = JSON.parse(fs.readFileSync(enPath, "utf8"));
const examAr = JSON.parse(fs.readFileSync(arPath, "utf8"));

// Shuffle and sync
const { shuffledEn, shuffledAr } = shuffleExamSync(examEn, examAr);

// Save files in language-specific subfolders using original filenames
const enFilename = path.basename(enPath);
const arFilename = path.basename(arPath);

fs.writeFileSync(path.join(enOutputDir, enFilename), JSON.stringify(shuffledEn, null, 2), "utf8");
fs.writeFileSync(path.join(arOutputDir, arFilename), JSON.stringify(shuffledAr, null, 2), "utf8");

console.log(`Shuffling complete Files saved in:
- English: ${path.join(enOutputDir, enFilename)}
- Arabic: ${path.join(arOutputDir, arFilename)}`);
