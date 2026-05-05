const fs = require('fs');
const path = require('path');

function readJsonFile(filepath) {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function classifyQuestions(questions) {
    const math = [];
    const phys = [];
    const chem = [];
    const cse = [];

    questions.forEach(q => {
        let code = q.questionCode || "";
        let num = q.questionNumber;
        
        if (code.includes('MATH') || (num >= 1 && num <= 50)) {
            math.push(q);
        } else if (code.includes('PHYS') || (num >= 51 && num <= 75)) {
            phys.push(q);
        } else if (code.includes('CHEM') || (num >= 76 && num <= 100)) {
            chem.push(q);
        } else {
            cse.push(q);
        }
    });

    return { math, phys, chem, cse };
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const paper1 = readJsonFile('ecet papers/paper_1.json');
const paper2020 = readJsonFile('ecet papers/ecet_2020_cse.json');
const newMock = readJsonFile('ecet papers/ts_ecet_mock_2026.json');

const allPast = [...paper1, ...paper2020];
const pastClassified = classifyQuestions(allPast);
const newClassified = classifyQuestions(newMock);

// Math: we need 50. New mock has some, past has many.
const finalMath = [...newClassified.math, ...shuffle(pastClassified.math).slice(0, 50 - newClassified.math.length)];
const finalPhys = [...newClassified.phys, ...shuffle(pastClassified.phys).slice(0, 25 - newClassified.phys.length)];
const finalChem = [...newClassified.chem, ...shuffle(pastClassified.chem).slice(0, 25 - newClassified.chem.length)];
const finalCse = [...newClassified.cse, ...shuffle(pastClassified.cse).slice(0, 100 - newClassified.cse.length)];

let finalPaper = [...finalMath, ...finalPhys, ...finalChem, ...finalCse];

// Renumber sequentially
finalPaper = finalPaper.map((q, index) => {
    return {
        ...q,
        questionNumber: index + 1
    };
});

fs.writeFileSync('ecet papers/ts_ecet_2026_full_prediction.json', JSON.stringify(finalPaper, null, 2));
console.log('Successfully created full 200-mark predicted paper at ecet papers/ts_ecet_2026_full_prediction.json');
