module.exports = {
  apps: [
    {
      name: 'Echopig',
      script: './src/server.js',
      wait_ready: true,
      listen_timeout: 3000
    }
  ]
};
