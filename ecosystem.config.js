const path = require('path');

module.exports = {
  apps: [
    {
      name: 'hours-tracker',
      cwd: __dirname,
      script: path.join(__dirname, 'node_modules/.bin/next'),
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        DB_PATH: process.env.DB_PATH || './data/timetracker.db'
      }
    }
  ]
};
