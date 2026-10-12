const express = require('express');
const app = express();

const PORT = process.env.APP_PORT || 8080;

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend service is connected and running with Docker Compose!',
    db_config: {
      host: process.env.DB_HOST || 'database',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'mydb',
      user: process.env.DB_USER || 'postgres'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server is running on port ${PORT}`);
});
