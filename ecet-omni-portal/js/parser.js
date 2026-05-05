window.parser = (function() {
    let pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    function setLoading(isLoading) {
        const ind = document.getElementById('loading-indicator');
        if(isLoading) ind.classList.remove('hidden');
        else ind.classList.add('hidden');
    }

    async function extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for(let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(" ") + "\n";
        }
        return fullText;
    }

    async function extractTextFromDOCX(file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }

    function parseQuestionsFromText(fullText) {
        // Clean up common PDF extraction artifacts
        fullText = fullText.replace(/\n\s*\n/g, '\n').trim();

        // 1. Split text into question chunks
        // Matches "Question Number : 1", "Question Id : 123", "Q. 1", or "\n1. "
        // Restricted \d{1,3} to prevent matching long option IDs
        const qSplitRegex = /(?:Question\s+Number\s*:\s*\d+|Question\s+Id\s*:\s*\d+|Q\.?\s*\d+|(?:^|\n)\s*\d{1,3}\.\s+)/i;
        
        let rawChunks = fullText.split(qSplitRegex).filter(c => c.trim().length > 10);
        let questions = [];

        rawChunks.forEach((chunk, idx) => {
            // Find options inside the chunk
            // Looks for: "Option 1 :", "A.", "A)", "1)", or TCS iON long option IDs "123456789."
            const optRegex = /\s+(?:Option\s*[1-4]\s*:|[A-D1-4][\.\)]|\d{5,}\.)\s+/i;
            
            let parts = chunk.split(optRegex).map(p => p.trim()).filter(p => p.length > 0);
            
            if (parts.length >= 5) {
                // First part is the question stem. Remove residual TCS headers if any.
                let qText = parts[0].replace(/^(?:Question\s+Type.*?\n|Display\s+Question.*?\n|Options.*?\n)+/ig, '').trim(); 
                qText = qText.replace(/Options\s*:\s*$/i, '').trim();

                let options = parts.slice(1, 5); // take next 4 parts as options
                
                // Try to extract answer from the chunk
                let ansMatch = chunk.match(/(?:correct|answer|ans|Correct Answer)[\s:]*([A-D1-4])/i);
                let correctIdx = 0;
                if (ansMatch) {
                    let ansStr = ansMatch[1].toUpperCase();
                    let found = ['A','B','C','D','1','2','3','4'].indexOf(ansStr);
                    if (found !== -1) correctIdx = found % 4;
                } else {
                    let optNumMatch = chunk.match(/option\s*(\d)/i);
                    if (optNumMatch) correctIdx = (parseInt(optNumMatch[1]) - 1) % 4;
                }

                questions.push({
                    id: questions.length + 1,
                    text: qText.substring(0, 2000), // sanitize length
                    options: options.map(o => o.substring(0, 500).replace(/(?:correct|answer|ans)[\s:]*[A-D1-4].*/is, '').trim()),
                    correctAnswerNum: correctIdx,
                    userSelected: -1,
                    status: 'not-visited'
                });
            }
        });

        // Fallback: if we found zero questions, maybe it's just raw text with no obvious question markers?
        // Let's at least return the sample questions in that case so it doesn't crash.
        return questions;
    }

    async function handleFile(file, type) {
        setLoading(true);
        try {
            if (type === 'json') {
                const text = await file.text();
                let parsed = JSON.parse(text);
                
                // Assuming JSON format could be an array of objects: 
                // [{ text: "...", options: ["A", "B", "C", "D"], correctAnswerNum: 0 }, ...]
                // Normalize it
                parsed = parsed.map((q, i) => ({
                    id: q.id || (i + 1),
                    text: q.text || q.question || "Unknown Question",
                    options: q.options || ["Option A", "Option B", "Option C", "Option D"],
                    correctAnswerNum: q.correctAnswerNum !== undefined ? q.correctAnswerNum : (q.answer !== undefined ? q.answer : 0),
                    userSelected: -1,
                    status: 'not-visited'
                }));
                
                window.appState.isPdfMode = false;
                processParsed(parsed);
                setLoading(false);
                return;
            }

            let rawText = "";
            if(type === 'pdf') rawText = await extractTextFromPDF(file);
            else rawText = await extractTextFromDOCX(file);
            
            if(!rawText || rawText.trim().length < 50) throw new Error("Insufficient text extracted");
            
            let parsed = parseQuestionsFromText(rawText);
            if(parsed.length === 0) {
                // FALLBACK: Image-based PDF detected.
                console.warn("No text detected. Falling back to PDF Viewer Mode.");
                window.appState.isPdfMode = true;
                window.appState.pdfBlobUrl = URL.createObjectURL(file);
                
                // Generate 200 generic questions for the OMR sheet
                parsed = Array.from({length: 200}).map((_, i) => ({
                    id: i + 1,
                    text: `*Question text is inside the PDF viewer. Please refer to the PDF.*`,
                    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                    correctAnswerNum: -1,
                    userSelected: -1,
                    status: 'not-visited'
                }));
            } else {
                window.appState.isPdfMode = false;
            }
            
            processParsed(parsed);
        } catch(err) {
            console.error(err);
            alert("Error parsing document: " + err.message);
        }
        setLoading(false);
    }

    function processParsed(parsed) {
        window.appState.questions = parsed.map((q, idx) => ({ 
            ...q, 
            id: idx, 
            userSelected: -1, 
            status: 'not-visited',
            correctAnswerNum: q.correctAnswerNum !== -1 ? q.correctAnswerNum : 0 
        }));
        
        document.getElementById('setup-stats').innerHTML = `✅ Successfully loaded ${window.appState.questions.length} questions.`;
        document.getElementById('setup-start-area').classList.remove('hidden');
    }

    function loadSamplePaper() {
        const sampleText = `
Question Number : 1
If A = [[1,0,0],[1,0,1],[0,1,0]], then A^50 = ?
A. Identity matrix
B. [[1,0,0],[25,1,0],[25,0,1]]
C. [[1,0,0],[24,1,0],[24,0,1]]
D. [[1,0,0],[50,1,0],[50,0,1]]
Correct Answer: D

Question Number : 2
If a+b+c=0, then determinant value equals? 
A. abc 
B. 0 
C. xyz 
D. (x+y+z)
Correct: B

Question Number : 3
In photo electric effect, number of photoelectrons emitted is proportional to:
Option 1 : intensity of radiation
Option 2 : frequency
Option 3 : velocity
Option 4 : work function
Answer: 1

Question Number : 4
German silver is an alloy of:
1) Ag,Cu,Zn
2) Ag,Cu,Au
3) Cu,Zn,Ni
4) Cu,Zn,Fe
Correct: 3

Question Number : 5
Which gate acts as controlled inverter?
A. NAND
B. EX-OR
C. NOR
D. EX-NOR
Answer: B
        `;
        let parsed = parseQuestionsFromText(sampleText);
        processParsed(parsed);
    }

    return {
        handleFile,
        loadSamplePaper
    };
})();
