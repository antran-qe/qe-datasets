const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonFilePath = path.join(__dirname, 'data_output.json'); // Change this to your JSON file name
let jsonData;

try {
  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  jsonData = JSON.parse(rawData);
  
  // Handle both single object and array
  if (!Array.isArray(jsonData)) {
    jsonData = [jsonData];
  }
  
  console.log(`Successfully loaded ${jsonData.length} questions from ${path.basename(jsonFilePath)}`);
} catch (error) {
  console.error('Error loading JSON file:', error.message);
  console.log('Creating HTML with sample data instead...');
  
  // Fallback to sample data if file doesn't exist
  jsonData = [
    {
      "id": 12,
      "question_img": "Math/Functional/function_12.png",
      "question_text": "",
      "answer": "A. 106, B. 48",
      "math_type": "Geometry",
      "math_level": "",
      "grade_level": "Grade 10–12",
      "difficulty_level": "4",
      "note": "chat gpt 5 give wrong answer at the first and second times."
    },
    {
      "id": 15,
      "question_img": "Math/Algebra/equation_15.png",
      "question_text": "Solve the quadratic equation",
      "answer": "x = 3, x = -2",
      "math_type": "Algebra",
      "math_level": "Advanced",
      "grade_level": "Grade 9–11",
      "difficulty_level": "3",
      "note": "Multiple solutions possible."
    },
    {
      "id": 23,
      "question_img": "Math/Calculus/integral_23.png",
      "question_text": "Calculate the definite integral",
      "answer": "π/2",
      "math_type": "Calculus",
      "math_level": "Advanced",
      "grade_level": "Grade 12",
      "difficulty_level": "5",
      "note": "Requires substitution method."
    }
  ];
}

// Create the HTML content with embedded JSON data
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Question Viewer - Math Problems Collection</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --primary-color: #667eea;
      --secondary-color: #764ba2;
      --accent-color: #f093fb;
      --light-bg: #f5f7fa;
      --dark-bg: #2c3e50;
      --text-color: #333;
      --light-text: #f5f5f5;
      --border-radius: 6px;
      --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      --transition: all 0.3s ease;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      color: var(--text-color);
      background-color: var(--light-bg);
      padding-bottom: 0.5rem;
    }

    header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: var(--light-text);
      padding: 0.8rem 1rem;
      text-align: center;
      box-shadow: var(--shadow);
    }

    h1 {
      font-size: 1.2rem;
      margin-bottom: 0.2rem;
    }

    .subtitle {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    /* Tabs */
    .tabs {
      display: flex;
      justify-content: center;
      background-color: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .tab-btn {
      padding: 0.8rem 1.5rem;
      font-size: 0.9rem;
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      color: var(--text-color);
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 0.4rem;
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
      height: 2px;
      background-color: var(--primary-color);
    }

    main {
      max-width: 1000px;
      margin: 1rem auto;
      padding: 0 0.8rem;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .stats-bar {
      background: white;
      padding: 0.8rem 1rem;
      margin-bottom: 1rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      text-align: center;
      font-size: 0.85rem;
      color: var(--primary-color);
      font-weight: 600;
    }

    /* Question Cards */
    .question-card, .answer-card {
      background-color: #fff;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      padding: 0.8rem;
      margin-bottom: 0.8rem;
      transition: var(--transition);
    }

    .question-card:hover, .answer-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
    }

    .card-title {
      color: var(--primary-color);
      margin-bottom: 0.6rem;
      padding: 0.4rem 0.6rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: var(--border-radius);
      border-left: 2px solid var(--primary-color);
      font-size: 0.8rem;
      font-weight: 600;
    }

    .question-image {
      text-align: center;
      margin: 0.6rem 0;
    }

    .question-image img {
      max-width: 100%;
      max-height: 200px;
      border: 1px solid #ddd;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
    }

    .question-text {
      font-size: 0.75rem;
      line-height: 1.4;
      margin: 0.6rem 0;
      padding: 0.6rem;
      background: #f8f9fa;
      border-radius: var(--border-radius);
    }

    /* Answer Details */
    .answer-section {
      margin-top: 1rem;
    }

    .answer-details {
      display: grid;
      gap: 0.6rem;
      margin-top: 1rem;
    }

    .detail-item {
      display: flex;
      padding: 0.6rem 0.8rem;
      background: #f8f9fa;
      border-radius: var(--border-radius);
      border-left: 3px solid #28a745;
      font-size: 0.85rem;
    }

    .detail-label {
      font-weight: bold;
      min-width: 100px;
      color: #495057;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .detail-value {
      color: #333;
      flex: 1;
    }

    .answer-value {
      background: linear-gradient(135deg, rgba(0, 123, 255, 0.1), rgba(0, 123, 255, 0.05));
      border-left-color: #007bff;
      font-weight: 600;
    }

    .difficulty-value {
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05));
      border-left-color: #ffc107;
    }

    .note-value {
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05));
      border-left-color: #ffc107;
    }

    .stars {
      color: var(--accent-color);
      margin-left: 0.3rem;
      font-size: 0.8rem;
    }

    /* Loading */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(102, 126, 234, 0.2);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 0.8rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* No data */
    .no-data {
      text-align: center;
      color: #6c757d;
      font-style: italic;
      padding: 2rem;
      font-size: 0.9rem;
    }

    /* Footer */
    footer {
      text-align: center;
      padding: 0.8rem;
      background-color: var(--dark-bg);
      color: var(--light-text);
      margin-top: 2rem;
      font-size: 0.8rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      body {
        font-size: 12px;
      }

      .question-image img {
        max-height: 250px;
      }
      
      .tab-btn {
        padding: 0.6rem 1rem;
        font-size: 0.8rem;
      }

      .detail-item {
        flex-direction: column;
        gap: 0.3rem;
      }

      .detail-label {
        min-width: auto;
        font-size: 0.8rem;
      }

      .detail-value {
        font-size: 0.8rem;
      }

      .card-title {
        font-size: 0.85rem;
      }
    }

    /* Scroll styling */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--primary-color);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--secondary-color);
    }
  </style>
</head>
<body>
  <header>
    <h1><i class="fas fa-graduation-cap"></i> Question Viewer</h1>
    <p class="subtitle">Math Problems Collection</p>
  </header>
  
  <div class="tabs">
    <button class="tab-btn active" data-tab="questions">
      <i class="fas fa-question-circle"></i> Questions
    </button>
    <button class="tab-btn" data-tab="answers">
      <i class="fas fa-check-circle"></i> Answers
    </button>
  </div>
  
  <main>
    <div class="stats-bar">
      <i class="fas fa-list-ol"></i> Total Questions: <span id="totalQuestions">0</span> | 
      <i class="fas fa-scroll"></i> Scroll down to browse all questions
    </div>

    <div class="tab-content active" id="questions">
      <div class="questions-container">
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
  
  <footer>
    <p><i class="fas fa-code"></i> Generated Question Viewer</p>
  </footer>

  <script>
    // Embedded JSON data
    const allQuestions = ${JSON.stringify(jsonData)};
    
    document.addEventListener('DOMContentLoaded', () => {
      // DOM elements
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('.tab-content');
      const questionsContainer = document.querySelector('.questions-container');
      const answersContainer = document.querySelector('.answers-container');
      const totalQuestionsSpan = document.getElementById('totalQuestions');
      
      // Initialize the app
      init();
      
      function init() {
        setupTabs();
        updateTotalQuestions();
        
        if (allQuestions.length > 0) {
          renderAllQuestions();
          renderAllAnswers();
        } else {
          showNoData();
        }
      }
      
      function setupTabs() {
        tabButtons.forEach(button => {
          button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            tabContents.forEach(content => {
              content.classList.remove('active');
              if (content.id === tabName) {
                content.classList.add('active');
              }
            });
          });
        });
      }

      function updateTotalQuestions() {
        totalQuestionsSpan.textContent = allQuestions.length;
      }

      function extractFilename(imagePath) {
        if (!imagePath) return '';
        const parts = imagePath.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace(/\\.[^/.]+$/, ''); // Remove extension
      }

      function renderAllQuestions() {
        questionsContainer.innerHTML = '';
        
        allQuestions.forEach((question, index) => {
          const filename = extractFilename(question.question_img);
          const title = \`\${question.id}_\${filename}\`;
          
          const questionCard = document.createElement('div');
          questionCard.className = 'question-card';
          questionCard.innerHTML = \`
            <h2 class="card-title">
              <i class="fas fa-question-circle"></i> \${title}
            </h2>
            \${question.question_img ? \`
              <div class="question-image">
                <img src="\${question.question_img}" alt="Question \${question.id}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='; this.alt='Image not found';" />
              </div>
            \` : ''}
            \${question.question_text ? \`
              <div class="question-text">
                <i class="fas fa-align-left"></i> \${question.question_text}
              </div>
            \` : ''}
          \`;
          
          questionsContainer.appendChild(questionCard);
        });
      }

      function renderAllAnswers() {
        answersContainer.innerHTML = '';
        
        allQuestions.forEach((question, index) => {
          const filename = extractFilename(question.question_img);
          const title = \`\${question.id}_\${filename}\`;
          
          const answerCard = document.createElement('div');
          answerCard.className = 'answer-card';
          answerCard.innerHTML = \`
            <h2 class="card-title">
              <i class="fas fa-check-circle"></i> \${title}
            </h2>
            \${question.question_img ? \`
              <div class="question-image">
                <img src="\${question.question_img}" alt="Question \${question.id}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='; this.alt='Image not found';" />
              </div>
            \` : ''}
            \${question.question_text ? \`
              <div class="question-text">
                <i class="fas fa-align-left"></i> \${question.question_text}
              </div>
            \` : ''}
            <div class="answer-section">
              <div class="answer-details">
                <div class="detail-item answer-value">
                  <span class="detail-label">
                    <i class="fas fa-lightbulb"></i> Answer:
                  </span>
                  <span class="detail-value">\${question.answer || 'Not provided'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">
                    <i class="fas fa-calculator"></i> Math Type:
                  </span>
                  <span class="detail-value">\${question.math_type || 'Not specified'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">
                    <i class="fas fa-layer-group"></i> Math Level:
                  </span>
                  <span class="detail-value">\${question.math_level || 'Not specified'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">
                    <i class="fas fa-graduation-cap"></i> Grade Level:
                  </span>
                  <span class="detail-value">\${question.grade_level || 'Not specified'}</span>
                </div>
                <div class="detail-item difficulty-value">
                  <span class="detail-label">
                    <i class="fas fa-chart-bar"></i> Difficulty:
                  </span>
                  <span class="detail-value">
                    \${question.difficulty_level || 'Not specified'}
                    \${renderStars(question.difficulty_level)}
                  </span>
                </div>
                \${question.note ? \`
                <div class="detail-item note-value">
                  <span class="detail-label">
                    <i class="fas fa-sticky-note"></i> Note:
                  </span>
                  <span class="detail-value">\${question.note}</span>
                </div>
                \` : ''}
              </div>
            </div>
          \`;
          
          answersContainer.appendChild(answerCard);
        });
      }

      function renderStars(difficulty) {
        if (!difficulty) return '';
        
        const difficultyValue = parseInt(difficulty);
        if (isNaN(difficultyValue)) return '';
        
        const stars = [];
        for (let i = 0; i < Math.min(difficultyValue, 5); i++) {
          stars.push('<i class="fas fa-star"></i>');
        }
        
        return \`<span class="stars">\${stars.join('')}</span>\`;
      }

      function showNoData() {
        questionsContainer.innerHTML = '<div class="no-data">No questions available</div>';
        answersContainer.innerHTML = '<div class="no-data">No answers available</div>';
      }
    });
  </script>
</body>
</html>`;

// Write the HTML file
const outputPath = path.join(__dirname, 'question_viewer.html');
fs.writeFileSync(outputPath, htmlContent);

console.log(`HTML file generated successfully at: ${outputPath}`);
console.log(`Total questions embedded: ${jsonData.length}`);