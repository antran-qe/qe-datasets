const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonFilePath = path.join(__dirname, 'test_with_school_levels.json');
let jsonData;

try {
  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  jsonData = JSON.parse(rawData);
  console.log(`Successfully loaded ${jsonData.length} questions from test_with_school_levels.json`);
} catch (error) {
  console.error('Error loading JSON file:', error.message);
  process.exit(1);
}

// Create the HTML content with embedded JSON data
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Math Problems Collection</title>
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

    .options {
      background-color: var(--light-bg);
      padding: 1rem;
      border-radius: var(--border-radius);
      margin-top: 1rem;
    }

    .options p {
      margin-bottom: 0.5rem;
    }

    /* Answer Cards */
    .answer-card .correct-answer {
      background-color: rgba(76, 175, 80, 0.1);
      border-left: 4px solid #4caf50;
      padding: 1rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .answer-card .assessment {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--light-bg);
    }

    .difficulty, .math-level {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stars {
      color: var(--accent-color);
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
      .assessment {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
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
    <h1>Math Problems Collection</h1>
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
    <p></p>
  </footer>

  <script>
    // Embedded JSON data from challenge_test_assessed.json
    const allProblems = ${JSON.stringify(jsonData)};
    
    document.addEventListener('DOMContentLoaded', () => {
      // State variables
      let displayedProblems = 0;
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
        loadMoreProblems();
        
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
            if (entry.isIntersecting && displayedProblems < allProblems.length) {
              loadMoreProblems();
            }
          });
        }, { threshold: 1.0 });
        
        // Observe the scroll trigger element
        observer.observe(scrollObserver);
      }
      
      // Load more problems
      function loadMoreProblems() {
        const startIndex = displayedProblems;
        const endIndex = Math.min(startIndex + pageSize, allProblems.length);
        
        // Check if there are more problems to display
        if (startIndex >= allProblems.length) return;
        
        // Get the next batch of problems
        const problemsBatch = allProblems.slice(startIndex, endIndex);
        
        // Render the problems
        renderProblems(problemsBatch,startIndex);
        renderAnswers(problemsBatch,startIndex);
        
        // Update the displayed count
        displayedProblems = endIndex;
        
        // Remove loading indicators
        removeLoadingIndicators();
      }
      
      // Render problems in the questions tab
      function renderProblems(problems,startIndex) {
        problems.forEach((problem, index) => {
          const card = document.createElement('div');
          card.className = 'problem-card';
          
          //const problemId = displayedProblems - pageSize + index + 1;
          var problemId = startIndex+index + 1;
          
          card.innerHTML = \`
            <h2>Question \${problemId}</h2>
            <div class="problem-content">
              <p>\${formatProblemText(problem.Problem)}</p>
            </div>
            <div class="options">
              <p>\${formatOptions(problem.options)}</p>
            </div>
          \`;
          
          questionsContainer.appendChild(card);
        });
      }
      
      // Render answers in the answers tab
      function renderAnswers(problems,startIndex) {
        problems.forEach((problem, index) => {
          const card = document.createElement('div');
          card.className = 'answer-card';
          
          //const problemId = displayedProblems - pageSize + index + 1;
          var problemId = startIndex + index + 1;
          
          card.innerHTML = \`
            <h2>Answer for Question \${problemId}</h2>
            <div class="problem-content">
              <p>\${formatProblemText(problem.Problem)}</p>
            </div>
            <div class="correct-answer">
              <p>Answer: \${problem.correct}</p>
            </div>
            <div class="assessment">
              <div class="difficulty">
                <span>Difficulty:</span>
                <span class="stars">\${renderStars(problem.difficulty)}</span>
              </div>
              <div class="math-level">
                <span>Math Level:</span>
                <span>\${problem.school_level}</span>
              </div>
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
      
      // Format options text for better readability
      function formatOptions(options) {
        if (!options) return 'No options available';
        return options.split(',').map(option => option.trim()).join('<br>');
      }
      
      // Render stars for difficulty rating
      function renderStars(difficulty) {
        if (difficulty === undefined || difficulty === null) return 'Not rated';
        
        // Ensure difficulty is a number
        const difficultyValue = parseInt(difficulty);
        if (isNaN(difficultyValue)) return 'Not rated';
        
        // Render the stars (1-5 scale)
        const stars = [];
        for (let i = 0; i < difficultyValue; i++) {
          stars.push('<i class="fas fa-star"></i>');
        }
        
        return stars.join('');
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

// Write the HTML file
const outputPath = path.join(__dirname, 'math_problems_test.html');
fs.writeFileSync(outputPath, htmlContent);

console.log(`HTML file generated successfully at: ${outputPath}`);