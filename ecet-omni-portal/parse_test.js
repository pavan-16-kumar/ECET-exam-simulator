function parseQuestionsFromText(fullText) {
    const qSplitRegex = /(?:Question\s+Number\s*:\s*\d+|Question\s+Id\s*:\s*\d+|Q\.?\s*\d+|(?:^|\n)\s*\d+\.\s+)/i;
    let rawChunks = fullText.split(qSplitRegex).filter(c => c.trim().length > 10);
    let questions = [];

    rawChunks.forEach((chunk, idx) => {
        // Find options inside the chunk
        // Looks for: "Option 1 :", "A.", "A)", "1)", or TCS iON long option IDs "123456789."
        // We use lookaround or just split by it.
        const optRegex = /\s+(?:Option\s*[1-4]\s*:|[A-D1-4][\.\)]|\d{5,}\.)\s+/i;
        
        let parts = chunk.split(optRegex).map(p => p.trim()).filter(p => p.length > 0);
        console.log("Chunk", idx, "parts:", parts);
        
        if (parts.length >= 5) {
            let qText = parts[0].replace(/^Question\s+Type.*?\n/i, '').trim(); // clean up
            let options = parts.slice(1, 5); // take next 4 parts as options
            
            // Try to extract answer from the last part or original chunk
            let ansMatch = chunk.match(/(?:correct|answer|ans)[\s:]*([A-D1-4])/i);
            let correctIdx = 0;
            if (ansMatch) {
                let ansStr = ansMatch[1].toUpperCase();
                let found = ['A','B','C','D','1','2','3','4'].indexOf(ansStr);
                if (found !== -1) correctIdx = found % 4;
            }

            questions.push({
                id: questions.length + 1,
                text: qText.substring(0, 1000), // sanitize length
                options: options.map(o => o.substring(0, 300).replace(/(?:correct|answer|ans)[\s:]*[A-D1-4].*/is, '').trim()),
                correctAnswerNum: correctIdx,
                userSelected: -1,
                status: 'not-visited'
            });
        }
    });

    return questions;
}

const text = `
Question Number : 1 Question Id : 7512365287 Question Type : MCQ
If A = 1, what is B?
Options :
75123621001. 2
75123621002. 3
75123621003. 4
75123621004. 5
Answer: 2

2. What is 2+2?
A. 3
B. 4
C. 5
D. 6
correct: B
`;

console.log(JSON.stringify(parseQuestionsFromText(text), null, 2));
