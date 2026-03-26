const fs = require('fs');
const { strict: assert } = require('assert');

// Read the file content
const content = fs.readFileSync('api-docs.json', 'utf8');

console.log('Validating JSON with assert.strict...');

try {
  const parsed = JSON.parse(content);
  console.log('JSON is valid!');
  console.log('Top-level keys:', Object.keys(parsed));
  console.log('Paths key exists:', 'paths' in parsed);
  console.log('Components key exists:', 'components' in parsed);
} catch (error) {
  console.error('JSON validation failed:', error.message);
  console.error('Error name:', error.name);
  console.error('Error stack:', error.stack);
  
  // Try to get more details using a different approach
  console.log('\nTrying with JSON5 parser for more tolerant parsing...');
  try {
    // Try to parse with a more tolerant approach
    const lines = content.split('\n');
    let currentObject = '';
    let bracketCount = 0;
    let errorLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentObject += line + '\n';
      
      // Count brackets
      for (const char of line) {
        if (char === '{') bracketCount++;
        if (char === '}') bracketCount--;
      }
      
      // Try to parse at each line to find where it fails
      try {
        JSON.parse(currentObject);
        console.log(`Line ${i + 1}: Still valid`);
      } catch (e) {
        if (errorLine === -1) {
          errorLine = i + 1;
          console.log(`First error at line ${errorLine}: ${e.message}`);
          console.log(`Current bracket count: ${bracketCount}`);
          console.log(`Line content: ${line}`);
          break;
        }
      }
    }
  } catch (e) {
    console.error('Secondary validation failed:', e.message);
  }
}
