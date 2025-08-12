const fs = require('fs');
const path = require('path');

// Allowed file types
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.pdf'];

/**
 * Recursively get all files from a directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Generate JSON metadata from files in the root directory and subdirectories
 */
function generateJSONFromFiles(rootDir = '.') {
  const allFiles = getAllFiles(rootDir);

  const data = allFiles
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return allowedExtensions.includes(ext);
    })
    .map((file, index) => ({
      id: index + 1,
      question_img: path.relative(rootDir, file),
      question_text: '',
      answer: '',
      math_type: '',
      math_level: '',
      grade_level: '',
      difficulty_level: '',
      note: ''
    }));

  const outputPath = path.join(rootDir, 'data_output.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`✅ JSON file generated at: ${outputPath}`);
}

// Run the function
generateJSONFromFiles();
