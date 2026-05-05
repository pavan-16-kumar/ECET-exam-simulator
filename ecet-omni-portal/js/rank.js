window.rank = (function() {
    function computeRank(score, totalMarks) {
        if(totalMarks === 0) return 50000;
        
        // Scale score to 200 (ECET Standard)
        let s = (score / totalMarks) * 200;
        
        if (s >= 180) return Math.floor(1 + (200 - s) * (9 / 20));
        if (s >= 170) return Math.floor(11 + (180 - s) * (39 / 10));
        if (s >= 160) return Math.floor(51 + (170 - s) * (149 / 10));
        if (s >= 150) return Math.floor(201 + (160 - s) * (299 / 10));
        if (s >= 140) return Math.floor(501 + (150 - s) * (499 / 10));
        if (s >= 130) return Math.floor(1001 + (140 - s) * (999 / 10));
        if (s >= 120) return Math.floor(2001 + (130 - s) * (999 / 10));
        if (s >= 110) return Math.floor(3001 + (120 - s) * (1999 / 10));
        if (s >= 100) return Math.floor(5001 + (110 - s) * (1999 / 10));
        if (s >= 90) return Math.floor(7001 + (100 - s) * (3999 / 10));
        if (s >= 80) return Math.floor(11001 + (90 - s) * (1999 / 10));
        if (s >= 70) return Math.floor(13001 + (80 - s) * (6999 / 10));
        return Math.floor(20001 + (70 - s) * 1000);
    }

    function generateReport() {
        const questions = window.appState.questions;
        let score = 0;
        
        questions.forEach(q => {
            if(q.userSelected === q.correctAnswerNum) {
                score++;
            }
        });

        let rank = computeRank(score, questions.length);
        let percentage = ((score / questions.length) * 100).toFixed(1);

        const reportArea = document.getElementById('report-content-area');
        reportArea.innerHTML = `
            <div class="rank-card">
                <h3>🏆 Your Score</h3>
                <h2>${score} / ${questions.length} (${percentage}%)</h2>
                <div style="margin: 1.5rem 0; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 1.5rem;">
                    <h3>🎓 Predicted ECET Rank</h3>
                    <h2>#${rank}</h2>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem; color: #cbd5e1;">(Based on 200 marks scaled standard)</p>
                </div>
            </div>
        `;

        const reviewList = document.getElementById('review-questions-list');
        reviewList.innerHTML = '';

        const letters = ['A', 'B', 'C', 'D'];

        questions.forEach((q, idx) => {
            const isCorrect = q.userSelected === q.correctAnswerNum;
            const isUnanswered = q.userSelected === -1;
            
            let statusClass = 'status-unanswered';
            let statusText = 'Not Answered';
            if(!isUnanswered) {
                statusClass = isCorrect ? 'status-correct' : 'status-incorrect';
                statusText = isCorrect ? '✅ Correct' : '❌ Incorrect';
            }

            const item = document.createElement('div');
            item.className = 'review-item';
            
            let optionsHtml = q.options.map((opt, oIdx) => {
                let classes = 'review-opt';
                if(oIdx === q.correctAnswerNum) classes += ' actual-correct';
                if(oIdx === q.userSelected && !isCorrect) classes += ' user-picked';
                
                return `<div class="${classes}"><strong>${letters[oIdx]}.</strong> ${escapeHtml(opt)}</div>`;
            }).join('');

            item.innerHTML = `
                <div class="review-header">
                    <div class="review-q-num">Question ${idx + 1}</div>
                    <div class="status-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="review-question">${escapeHtml(q.text)}</div>
                <div class="review-options">
                    ${optionsHtml}
                </div>
                <div class="review-actions">
                    <button class="btn-ai" onclick="window.ai.getExplanation(${idx})">
                        ✨ Ask AI for Explanation
                    </button>
                </div>
            `;
            
            reviewList.appendChild(item);
        });

        // Trigger MathJax after rendering the report
        if (window.MathJax) {
            MathJax.typesetPromise([document.getElementById('review-questions-list')]).catch((err) => console.log(err.message));
        }
    }

    return {
        computeRank,
        generateReport
    };
})();
