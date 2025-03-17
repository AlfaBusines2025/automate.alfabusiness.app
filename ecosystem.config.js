module.exports = {
  apps: [
    {
      name: 'flowise',
      script: 'pnpm',
      args: 'start',
      cwd: '/var/www/vhosts/alfabusiness.app/automate.alfabusiness.app', // directorio donde está el package.json
      interpreter: 'none', // importante para que ejecute pnpm sin intentar usar otro intérprete
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
