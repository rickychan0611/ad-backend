const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUyMTA0NDMwfQ.xIUWJvI7jDfQF-14sh4MOslXmXvCYfhj7V96-L7hzs4';

try {
  const decoded = jwt.verify(userToken, process.env.JWT_SECRET || 'youdonotknow');
  console.log('✅ User token verification successful:', decoded);
  console.log('✅ User ID:', decoded.id);
  console.log('✅ User Role:', decoded.role);
} catch (error) {
  console.log('❌ User token verification failed:', error.message);
} 