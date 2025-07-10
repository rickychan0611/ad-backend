const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

console.log('🔍 Environment JWT_SECRET:', process.env.JWT_SECRET || 'youdonotknow');
console.log('🔍 Using secret:', process.env.JWT_SECRET || 'youdonotknow');

// Test with a sample token (you'll need to replace this with an actual token from your browser)
const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM0NzI5NjAwLCJleHAiOjE3MzQ4MTYwMDB9.example';

try {
  const decoded = jwt.verify(sampleToken, process.env.JWT_SECRET || 'youdonotknow');
  console.log('✅ Token verification successful:', decoded);
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}

// Test creating a new token
const newToken = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'youdonotknow');
console.log('🔍 New token created:', newToken);

// Verify the new token
try {
  const decodedNew = jwt.verify(newToken, process.env.JWT_SECRET || 'youdonotknow');
  console.log('✅ New token verification successful:', decodedNew);
} catch (error) {
  console.log('❌ New token verification failed:', error.message);
} 