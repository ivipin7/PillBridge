import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test script to verify upload functionality
console.log('Testing upload functionality...');

// Check if uploads directory exists
const uploadsDir = path.join(__dirname, 'backend/public/uploads');
console.log('Uploads directory:', uploadsDir);
console.log('Directory exists:', fs.existsSync(uploadsDir));

if (fs.existsSync(uploadsDir)) {
  const contents = fs.readdirSync(uploadsDir);
  console.log('Uploads directory contents:', contents);
  
  // Check each subdirectory
  contents.forEach(item => {
    const itemPath = path.join(uploadsDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const subContents = fs.readdirSync(itemPath);
      console.log(`${item}/ contents:`, subContents);
    }
  });
} else {
  console.log('Uploads directory does not exist');
}

console.log('Test completed'); 