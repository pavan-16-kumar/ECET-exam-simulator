const fs = require('fs');

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

function getHighYield(questions, keywords, count) {
    const regex = new RegExp(keywords.join('|'), 'i');
    let highYield = questions.filter(q => regex.test(q.text));
    
    // Shuffle the high yield pool
    highYield = shuffle(highYield);
    
    // If we have more than enough, slice it
    if (highYield.length >= count) {
        return highYield.slice(0, count);
    }
    
    // If we need more, fill with random other questions from the pool
    const others = shuffle(questions.filter(q => !regex.test(q.text)));
    return [...highYield, ...others.slice(0, count - highYield.length)];
}

const paper1 = readJsonFile('ecet papers/paper_1.json');
const paper2020 = readJsonFile('ecet papers/ecet_2020_cse.json');
const newMock = readJsonFile('ecet papers/ts_ecet_mock_2026.json');

const allPast = [...paper1, ...paper2020, ...newMock];
const pastClassified = classifyQuestions(allPast);

// High weightage keywords based on ECET trends
const mathKeys = ['matrix', 'matrices', 'determinant', 'sin', 'cos', 'tan', 'limit', 'derivative', 'integral', 'differential equation', 'laplace'];
const physKeys = ['dimension', 'kinematic', 'velocity', 'acceleration', 'friction', 'work', 'energy', 'power', 'thermodynamic', 'heat', 'magnetic', 'electric'];
const chemKeys = ['quantum', 'orbital', 'pH', 'acid', 'base', 'buffer', 'electrochemistry', 'polymer', 'corrosion', 'oxidation', 'reduction', 'water'];
const cseKeys = ['array', 'linked list', 'stack', 'queue', 'tree', 'sort', 'search', 'process', 'scheduling', 'deadlock', 'memory', 'page', 'segment', 'database', 'normal', 'key', 'SQL', '8086', 'microprocessor', 'java', 'object', 'class', 'network', 'OSI', 'TCP', 'IP'];

const finalMath = getHighYield(pastClassified.math, mathKeys, 50);
const finalPhys = getHighYield(pastClassified.phys, physKeys, 25);
const finalChem = getHighYield(pastClassified.chem, chemKeys, 25);
const finalCse = getHighYield(pastClassified.cse, cseKeys, 100);

let finalPaper = [...finalMath, ...finalPhys, ...finalChem, ...finalCse];

// Renumber sequentially
finalPaper = finalPaper.map((q, index) => {
    return {
        ...q,
        questionNumber: index + 1
    };
});

fs.writeFileSync('ecet papers/ts_ecet_2026_highly_curated_guess.json', JSON.stringify(finalPaper, null, 2));
console.log('Successfully created Highly Curated Guess Paper at ecet papers/ts_ecet_2026_highly_curated_guess.json');
