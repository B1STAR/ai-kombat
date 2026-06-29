module.exports = {
  apps: [{
    name: 'ai-kombat-web',
    script: 'bun',
    args: 'run start',
    cwd: '/home/ubuntu/ai-kombat/ai-kombat/apps/web',
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
};
