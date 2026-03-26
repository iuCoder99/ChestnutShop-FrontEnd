const fs = require('fs');

// Read the original file
const content = fs.readFileSync('api-docs.json', 'utf8');

// Find the end of paths section and beginning of components section
const pathsEndIndex = content.indexOf('  "components": {');
if (pathsEndIndex === -1) {
  console.error('Could not find components section');
  process.exit(1);
}

// Extract the paths section and a bit of components
const pathsSection = content.substring(0, pathsEndIndex);
const componentsStart = content.substring(pathsEndIndex, pathsEndIndex + 500);

// Create a test file with just the paths section ending and components beginning
const testContent = pathsSection + componentsStart + '\n  }\n}';

fs.writeFileSync('paths-components-test.json', testContent);

console.log('Created test file: paths-components-test.json');
console.log('Paths section ends at position:', pathsEndIndex);
console.log('Paths section length:', pathsSection.length);

// Try to parse it
try {
  JSON.parse(testContent);
  console.log('Test content is valid JSON!');
} catch (error) {
  console.error('Test content JSON error:', error.message);
  
  // Get the error position
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const position = parseInt(match[1], 10);
    const start = Math.max(0, position - 50);
    const end = Math.min(testContent.length, position + 50);
    console.log('Error context:', testContent.substring(start, end));
    console.log('Pointer:', ' '.repeat(position - start) + '^');
  }
}
