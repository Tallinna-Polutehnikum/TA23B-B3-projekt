const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'absolute-cinema-main',
      script: './app.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        HOST: process.env.HOST || '',
        PORT: process.env.PORT || '8080',
        DB_PATH:
          process.env.DB_PATH || path.resolve(__dirname, '..', 'database', 'db.sqlite'),
      },
    },
  ],
};
