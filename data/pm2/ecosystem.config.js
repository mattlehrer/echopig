module.exports = {
  apps: [
    {
      name: 'Echopig',
      script: './server.js',
      wait_ready: true,
      listen_timeout: 3000
    }
  ]
};
