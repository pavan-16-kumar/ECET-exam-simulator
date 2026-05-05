window.ai = (function() {
    async function getExplanation(qIndex) {
        const apiKey = window.appState.geminiKey;
        if(!apiKey) {
            alert('Please enter your Gemini API key on the home page before starting the exam to use this feature.');
            return;
        }

        const q = window.appState.questions[qIndex];
        const modal = document.getElementById('ai-modal');
        const loading = document.getElementById('ai-loading');
        const content = document.getElementById('ai-content');

        modal.classList.remove('hidden');
        loading.classList.remove('hidden');
        content.innerHTML = '';

        const letters = ['A', 'B', 'C', 'D'];
        let optionsText = q.options.map((opt, i) => `${letters[i]}. ${opt}`).join('\n');
        
        let correctLetter = letters[q.correctAnswerNum];
        let correctText = q.options[q.correctAnswerNum];

        const prompt = `
You are an expert tutor helping a student prepare for the ECET (Engineering Common Entrance Test).
Please explain the answer to the following multiple choice question.

Question:
${q.text}

Options:
${optionsText}

The correct answer is given as ${correctLetter} (${correctText}).
Please provide a detailed, step-by-step explanation of why this is the correct answer. Format your response in Markdown with clear headings or bullet points if necessary.
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if(!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'API request failed');
            }

            const data = await response.json();
            const mdText = data.candidates[0].content.parts[0].text;
            
            loading.classList.add('hidden');
            content.innerHTML = marked.parse(mdText);

        } catch (err) {
            loading.classList.add('hidden');
            content.innerHTML = `<div style="color: #ef4444; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
                <strong>Error fetching explanation:</strong><br>${escapeHtml(err.message)}
            </div>`;
        }
    }

    return {
        getExplanation
    };
})();
