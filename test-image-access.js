import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing image access...');

// Check uploads directory
const uploadsDir = path.join(__dirname, 'backend/public/uploads');
console.log('Uploads directory:', uploadsDir);

if (fs.existsSync(uploadsDir)) {
  const contents = fs.readdirSync(uploadsDir);
  console.log('Uploads directory contents:', contents);
  
  contents.forEach(item => {
    const itemPath = path.join(uploadsDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const subContents = fs.readdirSync(itemPath);
      console.log(`${item}/ contents:`, subContents);
      
      // Test if files are accessible via HTTP
      subContents.forEach(file => {
        const testUrl = `http://localhost:3000/uploads/${item}/${file}`;
        console.log(`Test URL: ${testUrl}`);
      });
    }
  });
} else {
  console.log('Uploads directory does not exist');
}

console.log('Test completed'); 