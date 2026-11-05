module.exports = {
  apps: [
    {
      name: 'quiz-proctor-backend',
      script: './backend/server.js',
      cwd: __dirname,
      instances: 1, // Single instance preserves in-memory socket state (or use redis adapter for multi-instance)
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
