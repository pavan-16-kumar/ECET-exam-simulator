# 📘 ECET Omni-Portal & Exam Simulator

A highly interactive, realistic mock examination simulator designed for ECET (Engineering Common Entrance Test) aspirants. Built to mimic the standard TCS iON computer-based test interface, this application allows students to practice dynamically generated predicted papers, upload their own PDFs/JSONs, and receive AI-driven explanations.

## ✨ Features
- **TCS iON-Like Interface:** Familiar layout with sections, timer, question palette, and navigation (Save & Next, Mark for Review, etc.).
- **Rich Rendering:** Supports rendering of complex mathematics via MathJax and code snippets.
- **AI Integration:** Optionally connect a Gemini API key to get instant, step-by-step AI explanations for any question during the post-exam review.
- **Rank Prediction System:** Integrated scaling formula to predict TS/AP ECET 2026 expected ranks based on your mock score.
- **High-Yield Prediction Scripts:** Custom algorithmic Node.js scripts that analyze past exam JSONs to assemble 200-mark "Highly Curated Guess Papers".
- **Local First Architecture:** No heavy backend required. Everything runs directly in your browser.

---

## 🚀 Getting Started

Since this application loads local JSON and PDF files dynamically, you must run it through a local development server to bypass browser CORS (Cross-Origin Resource Sharing) restrictions. Do not just double-click the `index.html` file.

### Prerequisites
* [Node.js](https://nodejs.org/) (Required for running the prediction scripts and the `serve` server).

### Installation & Setup

1. **Clone the repository (or download the folder):**
   ```bash
   git clone https://github.com/your-username/ecet-omni-portal.git
   cd ecet-omni-portal
   ```

2. **Install dependencies (if modifying prediction scripts):**
   *The core web app uses CDN links, but local scripts might require dependencies.*
   ```bash
   npm install
   ```

3. **Start a local development server:**
   You can use `npx serve` (recommended):
   ```bash
   npx serve -p 3000
   ```
   *Alternative (Python):*
   ```bash
   python3 -m http.server 3000
   ```

4. **Open the Simulator:**
   Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage

### 1. Taking a Mock Exam
1. Open the portal in your browser.
2. In the "Select an ECET Paper" dropdown, choose a paper (e.g., *🔥 TS ECET 2026 High-Weightage Guess Paper*).
3. Click **Load Selected Paper**.
4. Click **Start Exam**.
5. Once finished, click **Submit Exam** to view your score, predicted rank, and detailed review.

### 2. Enabling AI Explanations
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. On the main setup page of the portal, paste your key into the "Gemini API Key" field.
3. Complete your exam. In the post-exam report, you will see a **"✨ Ask AI for Explanation"** button next to each question.

---

## 🛠️ Generating Predicted Papers (Advanced)

This project includes custom Node.js scripts designed to mine past ECET papers and dynamically generate new 200-question mock exams based on high-weightage topics.

### Script 1: Full Exam Shuffler
Assembles a complete 200-mark exam by correctly distributing Maths (50), Physics (25), Chemistry (25), and CSE (100) from past papers.
```bash
node generate_mock.js
```
*Output: `ecet papers/ts_ecet_2026_full_prediction.json`*

### Script 2: High-Yield Topic Predictor (80% Accuracy Target)
Algorithmically filters past papers for specific high-weightage keywords (e.g., matrices, deadlock, linked lists) to construct a highly curated, probable test.
```bash
node generate_highly_curated_guess.js
```
*Output: `ecet papers/ts_ecet_2026_highly_curated_guess.json`*

---

## 📁 Project Structure

```
ecet-omni-portal/
├── index.html                   # Main application entry point
├── css/
│   ├── style.css                # Global styles and Setup view UI
│   └── exam.css                 # TCS iON exam interface styles
├── js/
│   ├── app.js                   # Application state & navigation logic
│   ├── exam.js                  # Exam interface, timer, and palette logic
│   ├── parser.js                # Document parsing (PDF, JSON)
│   ├── rank.js                  # Rank prediction algorithm based on 2026 metrics
│   └── ai.js                    # Gemini AI API integration
├── ecet papers/                 # Repository of past papers and generated JSON mocks
├── generate_mock.js             # Script to generate full 200-mark papers
└── generate_highly_curated_guess.js # Script to generate high-yield predicted papers
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to modify the rank prediction metrics in `js/rank.js` as real cutoff data evolves.

## 📄 License
This project is open-source. Use it freely for your exam preparations!
