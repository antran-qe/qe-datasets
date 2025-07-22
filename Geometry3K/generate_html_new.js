const fs = require("fs");
const path = require("path");

const baseDir = __dirname;
const folders = fs.readdirSync(baseDir).filter(f => fs.existsSync(path.join(baseDir, f, "data.json")));

const problems = [];

// Load problems from folders
for (const folder of folders) {
  const dataPath = path.join(baseDir, folder, "data.json");
  const imgPath = path.join(baseDir, folder, "img_diagram.png");

  if (fs.existsSync(dataPath) && fs.existsSync(imgPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    data.folderId = folder;
    problems.push(data);
  }
}

// Create the enhanced HTML with modern CSS
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Question & Answer Collection</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --primary-color: #4a6fa5;
      --secondary-color: #166d67;
      --accent-color: #f9a825;
      --light-bg: #f5f7fa;
      --dark-bg: #2c3e50;
      --text-color: #333;
      --light-text: #f5f5f5;
      --border-radius: 8px;
      --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      --transition: all 0.3s ease;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--light-bg);
      padding-bottom: 2rem;
    }

    header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: var(--light-text);
      padding: 1.5rem 2rem;
      text-align: center;
      box-shadow: var(--shadow);
    }

    h1 {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }

    /* Tabs */
    .tabs {
      display: flex;
      justify-content: center;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .tab-btn {
      padding: 1rem 2rem;
      font-size: 1.1rem;
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      color: var(--text-color);
      transition: var(--transition);
    }

    .tab-btn:hover {
      color: var(--primary-color);
    }

    .tab-btn.active {
      color: var(--primary-color);
      font-weight: 600;
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background-color: var(--primary-color);
    }

    main {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    /* Problem Cards */
    .problem-card, .answer-card {
      background-color: #fff;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      transition: var(--transition);
    }

    .problem-card:hover, .answer-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }

    .problem-card h2, .answer-card h2 {
      color: var(--primary-color);
      margin-bottom: 1rem;
      border-bottom: 2px solid var(--light-bg);
      padding-bottom: 0.5rem;
    }

    .problem-content {
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
    }

    .diagram-container {
      text-align: center;
      margin: 1.5rem 0;
    }

    .diagram {
      max-width: 100%;
      height: auto;
      border-radius: var(--border-radius);
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .choices {
      background-color: var(--light-bg);
      padding: 1rem;
      border-radius: var(--border-radius);
      margin-top: 1rem;
    }

    .choice {
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .choice:last-child {
      border-bottom: none;
    }

    /* Answer Cards */
    .answer-card .correct-answer {
      background-color: rgba(76, 175, 80, 0.1);
      border-left: 4px solid #4caf50;
      padding: 1rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    /* Loading spinner */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(74, 111, 165, 0.2);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Footer */
    footer {
      text-align: center;
      padding: 1rem;
      background-color: var(--dark-bg);
      color: var(--light-text);
      position: fixed;
      bottom: 0;
      width: 100%;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .tab-btn {
        padding: 0.8rem 1.2rem;
        font-size: 1rem;
      }
    }

    /* Scroll observer */
    #scrollObserver {
      height: 10px;
      width: 100%;
    }
  </style>
</head>
<body>
  <header>
    <h1>Question & Answer Collection</h1>
  </header>
  
  <div class="tabs">
    <button class="tab-btn active" data-tab="questions">Questions</button>
    <button class="tab-btn" data-tab="answers">Answers</button>
  </div>
  
  <main>
    <div class="tab-content active" id="questions">
      <div class="problems-container">
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    </div>
    
    <div class="tab-content" id="answers">
      <div class="answers-container">
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading answers...</p>
        </div>
      </div>
    </div>
  </main>
  
  <div id="scrollObserver"></div>
  
  <footer>
    <p>&copy; 2025 Question & Answer Collection</p>
  </footer>

  <script>
    // Embedded JSON data
    const allProblems = ${JSON.stringify(problems)};
    
    document.addEventListener('DOMContentLoaded', () => {
      // State variables
      let displayedQuestionProblems = 0;
      let displayedAnswerProblems = 0;
      let activeTab = 'questions';
      const pageSize = 10;
      
      // DOM elements
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('.tab-content');
      const questionsContainer = document.querySelector('.problems-container');
      const answersContainer = document.querySelector('.answers-container');
      const scrollObserver = document.getElementById('scrollObserver');
      
      // Initialize the app
      init();
      
      // Initialize the app
      function init() {
        // Set up tab switching
        setupTabs();
        
        // Clear containers
        questionsContainer.innerHTML = '';
        answersContainer.innerHTML = '';
        
        // Load initial problems
        loadMoreQuestions();
        loadMoreAnswers();
        
        // Set up infinite scroll
        setupInfiniteScroll();
      }
      
      // Set up tab switching
      function setupTabs() {
        tabButtons.forEach(button => {
          button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show selected tab content
            tabContents.forEach(content => {
              content.classList.remove('active');
              if (content.id === tabName) {
                content.classList.add('active');
              }
            });
            
            activeTab = tabName;
          });
        });
      }
      
      // Set up infinite scroll
      function setupInfiniteScroll() {
        // Create an Intersection Observer
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (activeTab === 'questions' && displayedQuestionProblems < allProblems.length) {
                loadMoreQuestions();
              } else if (activeTab === 'answers' && displayedAnswerProblems < allProblems.length) {
                loadMoreAnswers();
              }
            }
          });
        }, { threshold: 1.0 });
        
        // Observe the scroll trigger element
        observer.observe(scrollObserver);
      }
      
      // Load more questions
      function loadMoreQuestions() {
        const startIndex = displayedQuestionProblems;
        const endIndex = Math.min(startIndex + pageSize, allProblems.length);
        
        // Check if there are more problems to display
        if (startIndex >= allProblems.length) return;
        
        // Get the next batch of problems
        const problemsBatch = allProblems.slice(startIndex, endIndex);
        
        // Render the problems
        renderQuestions(problemsBatch);
        
        // Update the displayed count
        displayedQuestionProblems = endIndex;
        
        // Remove loading indicators if all problems are loaded
        if (displayedQuestionProblems >= allProblems.length) {
          removeLoadingIndicators();
        }
      }
      
      // Load more answers
      function loadMoreAnswers() {
        const startIndex = displayedAnswerProblems;
        const endIndex = Math.min(startIndex + pageSize, allProblems.length);
        
        // Check if there are more problems to display
        if (startIndex >= allProblems.length) return;
        
        // Get the next batch of problems
        const problemsBatch = allProblems.slice(startIndex, endIndex);
        
        // Render the answers
        renderAnswers(problemsBatch);
        
        // Update the displayed count
        displayedAnswerProblems = endIndex;
        
        // Remove loading indicators if all problems are loaded
        if (displayedAnswerProblems >= allProblems.length) {
          removeLoadingIndicators();
        }
      }
      
      // Render questions in the questions tab
      function renderQuestions(problems) {
        // Remove loading indicator if present
        const loadingElement = questionsContainer.querySelector('.loading');
        if (loadingElement) {
          loadingElement.remove();
        }
        
        problems.forEach(problem => {
          const card = document.createElement('div');
          card.className = 'problem-card';
          
          // Create HTML for choices
          const choicesHTML = problem.choices.map((choice, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, etc.
            return \`<div class="choice">\${letter}. \${choice}</div>\`;
          }).join('');
          
          card.innerHTML = \`
            <h2>Question \${problem.folderId}</h2>
            <div class="problem-content">
              <p>\${formatProblemText(problem.problem_text)}</p>
            </div>
            <div class="diagram-container">
              <img src="./\${problem.folderId}/img_diagram.png" class="diagram" alt="Problem Diagram">
            </div>
            <div class="choices">
              <h3>Answer Choices:</h3>
              \${choicesHTML}
            </div>
          \`;
          
          questionsContainer.appendChild(card);
        });
      }
      
      // Render answers in the answers tab
      function renderAnswers(problems) {
        // Remove loading indicator if present
        const loadingElement = answersContainer.querySelector('.loading');
        if (loadingElement) {
          loadingElement.remove();
        }
        
        problems.forEach(problem => {
          const card = document.createElement('div');
          card.className = 'answer-card';
          
          card.innerHTML = \`
            <h2>Answer for Question \${problem.folderId}</h2>
            <div class="problem-content">
              <p>\${formatProblemText(problem.problem_text)}</p>
            </div>
            <div class="diagram-container">
              <img src="./\${problem.folderId}/img_diagram.png" class="diagram" alt="Problem Diagram">
            </div>
            <div class="correct-answer">
              <p>Answer: \${problem.answer}</p>
            </div>
          \`;
          
          answersContainer.appendChild(card);
        });
      }
      
      // Format problem text with line breaks
      function formatProblemText(text) {
        if (!text) return 'No problem statement available';
        return text.replace(/\\n/g, '<br>');
      }
      
      // Remove loading indicators
      function removeLoadingIndicators() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
          element.remove();
        });
      }
    });
  </script>
</body>
</html>`;

// Output HTML
fs.writeFileSync(path.join(baseDir, "index.html"), html, "utf8");
console.log("✅ HTML generated: index.html");