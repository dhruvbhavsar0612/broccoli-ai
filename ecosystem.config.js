module.exports = {
  apps: [{
    name: 'voice-chat-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/voice-chat-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/voice-chat-app-error.log',
    out_file: '/var/log/pm2/voice-chat-app-out.log',
    log_file: '/var/log/pm2/voice-chat-app-combined.log',
    time: true
  }]
}
