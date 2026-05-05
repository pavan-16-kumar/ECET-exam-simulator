window.appState = {
    questions: [],
    geminiKey: '',
    examStarted: false,
    examFinished: false,
    startTime: null,
    endTime: null,
    durationSeconds: 10800 // 3 hours (standard ECET)
};

    // View Management
window.saveState = function() {
    if (!window.appState || !window.appState.questions.length) return;
    const activeView = document.querySelector('.view-container.active');
    const stateToSave = {
        appState: { ...window.appState, pdfBlobUrl: null },
        examState: window.exam.getState ? window.exam.getState() : null,
        activeViewId: activeView ? activeView.id : 'setup-view'
    };
    sessionStorage.setItem('ecetAppState', JSON.stringify(stateToSave));
};

window.loadState = async function() {
    const saved = sessionStorage.getItem('ecetAppState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            window.appState = state.appState;
            
            if (window.appState.isPdfMode && window.appState.currentPaperUrl) {
                const response = await fetch(encodeURI(window.appState.currentPaperUrl));
                const blob = await response.blob();
                window.appState.pdfBlobUrl = URL.createObjectURL(blob);
            }

            if (state.examState && window.exam.setState) {
                window.exam.setState(state.examState);
            }
            
            if (state.activeViewId) {
                showView(state.activeViewId);
                if (state.activeViewId === 'setup-view' && window.appState.questions.length > 0) {
                    document.getElementById('setup-stats').innerHTML = `✅ Successfully loaded ${window.appState.questions.length} questions.`;
                    document.getElementById('setup-start-area').classList.remove('hidden');
                } else if (state.activeViewId === 'exam-view') {
                    window.exam.resumeExam();
                } else if (state.activeViewId === 'report-view') {
                    window.rank.generateReport();
                }
            }
        } catch(e) {
            console.error('Error loading state:', e);
            sessionStorage.removeItem('ecetAppState');
        }
    }
};

function showView(viewId) {
    document.querySelectorAll('.view-container').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    const view = document.getElementById(viewId);
    if(view) {
        view.classList.remove('hidden');
        view.classList.add('active');
    }
    window.saveState();
}

// Utility to escape HTML
function escapeHtml(str) {
    if(!str) return '';
    return str.replace(/[&<>]/g, function(m){
        if(m === '&') return '&amp;';
        if(m === '<') return '&lt;';
        if(m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    window.loadState();
    
    document.getElementById('loadDefaultBtn').addEventListener('click', async () => {
        const select = document.getElementById('default-paper-select');
        const url = select.value;
        if (!url) {
            alert('Please select a paper from the dropdown.');
            return;
        }
        
        document.getElementById('loading-indicator').classList.remove('hidden');
        
        try {
            const response = await fetch(encodeURI(url));
            if (!response.ok) throw new Error('Failed to fetch the paper.');
            const blob = await response.blob();
            
            const type = url.toLowerCase().endsWith('.json') ? 'json' : 'pdf';
            window.appState.questions = [];
            window.appState.currentPaperUrl = url;
            await window.parser.handleFile(blob, type);
            window.saveState();
        } catch (err) {
            alert('Error loading local paper: ' + err.message);
            document.getElementById('loading-indicator').classList.add('hidden');
        }
    });

    document.getElementById('startExamBtn').addEventListener('click', () => {
        const key = document.getElementById('gemini-key').value.trim();
        window.appState.geminiKey = key;
        
        if(!window.appState.questions.length) {
            alert('Please load a paper first.');
            return;
        }
        
        window.exam.startExam();
        showView('exam-view');
    });

    document.getElementById('submitExamConfirmBtn').addEventListener('click', () => {
        document.getElementById('submit-modal').classList.remove('hidden');
    });

    document.getElementById('confirm-submit-btn').addEventListener('click', () => {
        document.getElementById('submit-modal').classList.add('hidden');
        window.exam.submitExam();
    });

    document.getElementById('btn-back-setup').addEventListener('click', () => {
        document.getElementById('home-modal').classList.remove('hidden');
    });

    document.getElementById('confirm-home-btn').addEventListener('click', () => {
        document.getElementById('home-modal').classList.add('hidden');
        window.appState.questions = [];
        sessionStorage.removeItem('ecetAppState');
        document.getElementById('setup-start-area').classList.add('hidden');
        document.getElementById('pdfFileInput') && (document.getElementById('pdfFileInput').value = '');
        document.getElementById('docxFileInput') && (document.getElementById('docxFileInput').value = '');
        showView('setup-view');
    });

    document.getElementById('btn-close-ai').addEventListener('click', () => {
        document.getElementById('ai-modal').classList.add('hidden');
    });
});
