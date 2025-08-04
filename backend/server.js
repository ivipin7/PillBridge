const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log('📸 Image upload endpoint: POST /images');
  console.log('🔍 List images endpoint: GET /images');
  console.log('📥 Get image endpoint: GET /images/:id');
  console.log('🗑️  Delete image endpoint: DELETE /images/:id');
});
