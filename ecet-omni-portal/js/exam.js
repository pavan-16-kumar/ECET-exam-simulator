window.exam = (function() {
    let currentQIndex = 0;
    let currentSectionIndex = 0;
    let timerInterval = null;
    let sections = [];

    function setupSections() {
        const total = window.appState.questions.length;
        sections = [];
        
        // Typical ECET has ~200 questions. 
        // We will strictly enforce Math (50), Physics (25), Chemistry (25), Core (Rest) if > 120
        if (total >= 120) {
            const mathEnd = Math.min(49, total - 1);
            const physEnd = Math.min(74, total - 1);
            const chemEnd = Math.min(99, total - 1);
            
            if (mathEnd >= 0) sections.push({ name: 'Mathematics', start: 0, end: mathEnd });
            if (physEnd > mathEnd) sections.push({ name: 'Physics', start: mathEnd + 1, end: physEnd });
            if (chemEnd > physEnd) sections.push({ name: 'Chemistry', start: physEnd + 1, end: chemEnd });
            if (total - 1 > chemEnd) sections.push({ name: 'Core Subject', start: chemEnd + 1, end: total - 1 });
        } else if (total > 0) {
            // Very small paper or sample paper
            sections.push({ name: 'General', start: 0, end: total - 1 });
        }
    }

    function startExam() {
        window.appState.examStarted = true;
        window.appState.examFinished = false;
        window.appState.startTime = Date.now();
        currentQIndex = 0;
        currentSectionIndex = 0;
        
        setupSections();

        if(window.appState.questions.length > 0 && window.appState.questions[0].status === 'not-visited') {
            window.appState.questions[0].status = 'not-answered';
        }

        if (window.appState.isPdfMode) {
            document.getElementById('pdf-viewer-container').classList.remove('hidden');
            document.getElementById('question-content-area').style.flex = 'none';
            document.getElementById('question-content-area').style.height = '180px';
            document.getElementById('pdf-iframe').src = window.appState.pdfBlobUrl + "#view=FitH";
        } else {
            document.getElementById('pdf-viewer-container').classList.add('hidden');
            document.getElementById('question-content-area').style.flex = '1';
            document.getElementById('question-content-area').style.height = 'auto';
        }

        renderSectionsBar();
        renderPalette();
        renderQuestion();
        startTimer();
    }

    function renderSectionsBar() {
        const bar = document.getElementById('sections-bar');
        bar.innerHTML = '';
        sections.forEach((sec, idx) => {
            const tab = document.createElement('div');
            tab.className = `section-tab ${idx === currentSectionIndex ? 'active' : ''}`;
            tab.innerText = sec.name;
            tab.addEventListener('click', () => {
                saveCurrentResponse();
                currentSectionIndex = idx;
                currentQIndex = sections[currentSectionIndex].start;
                if(window.appState.questions[currentQIndex].status === 'not-visited') {
                    window.appState.questions[currentQIndex].status = 'not-answered';
                }
                renderSectionsBar();
                renderPalette();
                renderQuestion();
            });
            bar.appendChild(tab);
        });
    }

    function startTimer() {
        if(timerInterval) clearInterval(timerInterval);
        
        const timeEl = document.getElementById('time-left');
        if (window.appState.remainingSeconds === undefined) {
            window.appState.remainingSeconds = window.appState.durationSeconds;
        }

        timerInterval = setInterval(() => {
            window.appState.remainingSeconds--;
            let timeLeft = window.appState.remainingSeconds;
            if(timeLeft <= 0) {
                clearInterval(timerInterval);
                submitExam();
                return;
            }
            
            const h = Math.floor(timeLeft / 3600);
            const m = Math.floor((timeLeft % 3600) / 60);
            const s = timeLeft % 60;
            timeEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            if (timeLeft % 5 === 0 && window.saveState) window.saveState();
        }, 1000);
    }

    function renderPalette() {
        const grid = document.getElementById('palette-grid');
        grid.innerHTML = '';
        
        let stats = { answered: 0, notAnswered: 0, notVisited: 0, marked: 0 };
        const sec = sections[currentSectionIndex];

        // Overall stats (TCS iON typically shows overall or section specific, we'll show overall)
        window.appState.questions.forEach((q) => {
            if(q.status === 'answered') stats.answered++;
            else if(q.status === 'not-answered') stats.notAnswered++;
            else if(q.status === 'marked') stats.marked++;
            else stats.notVisited++;
        });

        // Render buttons for current section
        for (let i = sec.start; i <= sec.end; i++) {
            const q = window.appState.questions[i];
            const btn = document.createElement('div');
            btn.className = `q-btn ${q.status}`;
            if(i === currentQIndex) btn.classList.add('active-q');
            btn.innerText = i + 1; // 1-based index overall
            
            btn.addEventListener('click', () => {
                saveCurrentResponse();
                currentQIndex = i;
                if(window.appState.questions[currentQIndex].status === 'not-visited') {
                    window.appState.questions[currentQIndex].status = 'not-answered';
                }
                renderQuestion();
                renderPalette();
            });

            grid.appendChild(btn);
        }

        // Update Legend
        const badges = document.querySelectorAll('.palette-legend .badge');
        if(badges.length >= 4) {
            badges[0].innerText = stats.answered;
            badges[1].innerText = stats.notAnswered;
            badges[2].innerText = stats.notVisited;
            badges[3].innerText = stats.marked;
        }
    }

    function renderQuestion() {
        const q = window.appState.questions[currentQIndex];
        document.getElementById('q-no').innerText = `Question ${currentQIndex + 1}`;
        
        if (window.appState.isPdfMode) {
            document.getElementById('q-text').innerHTML = `<em>Please view the question in the PDF above, and select your answer below.</em>`;
        } else {
            document.getElementById('q-text').innerHTML = escapeHtml(q.text);
        }
        
        const optsContainer = document.getElementById('options-container');
        optsContainer.innerHTML = '';
        
        // In PDF mode, options are displayed horizontally
        if (window.appState.isPdfMode) {
            optsContainer.style.display = 'flex';
            optsContainer.style.flexDirection = 'row';
            optsContainer.style.gap = '15px';
        } else {
            optsContainer.style.display = 'flex';
            optsContainer.style.flexDirection = 'column';
            optsContainer.style.gap = '1rem';
        }

        const letters = ['A', 'B', 'C', 'D'];
        q.options.forEach((opt, i) => {
            const lbl = document.createElement('label');
            lbl.className = 'opt-radio';
            if(q.userSelected === i) lbl.classList.add('selected');
            
            lbl.innerHTML = `
                <input type="radio" name="q_opt" value="${i}" ${q.userSelected === i ? 'checked' : ''}>
                <strong>${letters[i]}.</strong> ${window.appState.isPdfMode ? '' : escapeHtml(opt)}
            `;
            
            lbl.querySelector('input').addEventListener('change', () => {
                document.querySelectorAll('.opt-radio').forEach(el => el.classList.remove('selected'));
                lbl.classList.add('selected');
            });
            
            optsContainer.appendChild(lbl);
        });

        // Trigger MathJax after rendering
        if (window.MathJax) {
            MathJax.typesetPromise([document.getElementById('q-text'), document.getElementById('options-container')]).catch((err) => console.log(err.message));
        }
    }

    function saveCurrentResponse() {
        const q = window.appState.questions[currentQIndex];
        const selected = document.querySelector('input[name="q_opt"]:checked');
        
        if(selected) {
            q.userSelected = parseInt(selected.value);
            if(q.status !== 'marked') q.status = 'answered';
        } else {
            q.userSelected = -1;
            if(q.status !== 'marked') q.status = 'not-answered';
        }
    }

    function updateSectionOnNavigate() {
        const sec = sections[currentSectionIndex];
        if (currentQIndex > sec.end) {
            if (currentSectionIndex < sections.length - 1) {
                currentSectionIndex++;
            }
        } else if (currentQIndex < sec.start) {
            if (currentSectionIndex > 0) {
                currentSectionIndex--;
            }
        }
        renderSectionsBar();
    }

    function navigate(action) {
        if(action === 'save-next') {
            saveCurrentResponse();
            const q = window.appState.questions[currentQIndex];
            if(q.userSelected !== -1) q.status = 'answered';
            else q.status = 'not-answered';
        } else if(action === 'mark-review') {
            saveCurrentResponse();
            window.appState.questions[currentQIndex].status = 'marked';
        } else if(action === 'clear') {
            window.appState.questions[currentQIndex].userSelected = -1;
            window.appState.questions[currentQIndex].status = 'not-answered';
            renderQuestion();
            renderPalette();
            return;
        } else if(action === 'prev') {
            saveCurrentResponse();
        }

        if(action === 'prev') {
            if(currentQIndex > 0) currentQIndex--;
        } else {
            if(currentQIndex < window.appState.questions.length - 1) currentQIndex++;
        }

        updateSectionOnNavigate();

        if(window.appState.questions[currentQIndex].status === 'not-visited') {
            window.appState.questions[currentQIndex].status = 'not-answered';
        }

        renderQuestion();
        renderPalette();
        if (window.saveState) window.saveState();
    }

    function submitExam() {
        if(timerInterval) clearInterval(timerInterval);
        saveCurrentResponse();
        window.appState.examFinished = true;
        
        window.rank.generateReport();
        showView('report-view');
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('btn-save-next').addEventListener('click', () => navigate('save-next'));
        document.getElementById('btn-mark-review').addEventListener('click', () => navigate('mark-review'));
        document.getElementById('btn-clear').addEventListener('click', () => navigate('clear'));
        document.getElementById('btn-prev').addEventListener('click', () => navigate('prev'));
    });

    function getState() {
        return {
            currentQIndex,
            currentSectionIndex,
            sections
        };
    }

    function setState(state) {
        currentQIndex = state.currentQIndex || 0;
        currentSectionIndex = state.currentSectionIndex || 0;
        sections = state.sections || [];
    }

    function resumeExam() {
        if (window.appState.isPdfMode) {
            document.getElementById('pdf-viewer-container').classList.remove('hidden');
            document.getElementById('question-content-area').style.flex = 'none';
            document.getElementById('question-content-area').style.height = '180px';
            document.getElementById('pdf-iframe').src = window.appState.pdfBlobUrl + "#view=FitH";
        } else {
            document.getElementById('pdf-viewer-container').classList.add('hidden');
            document.getElementById('question-content-area').style.flex = '1';
            document.getElementById('question-content-area').style.height = 'auto';
        }
        renderSectionsBar();
        renderPalette();
        renderQuestion();
        startTimer();
    }

    return {
        startExam,
        submitExam,
        getState,
        setState,
        resumeExam
    };
})();
