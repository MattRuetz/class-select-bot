module.exports = {
    apps: [{
      name: "usherbot",
      script: "node bot.js",
      watch: true,
      env: {
        NODE_ENV: "production",
      }
    }]
  }
  