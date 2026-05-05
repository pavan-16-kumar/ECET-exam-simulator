const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractTextFromPDF(pdfPath) {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    const pdf = await loadingTask.promise;
    let fullText = "";
    // Only get first 10 pages for debugging
    for(let i = 1; i <= Math.min(10, pdf.numPages); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(" ") + "\n";
    }
    return fullText;
}

extractTextFromPDF("ecet papers/TS_ECET_2024_Computer_Science_and_Engineering_Question_Paper_712e6253037dee5a8a639f5f7171939a.pdf")
    .then(text => console.log(text.substring(0, 3000)))
    .catch(console.error);
