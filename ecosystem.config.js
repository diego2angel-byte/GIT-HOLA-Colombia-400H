module.exports = {
  apps: [
    {
      name: "hola-colombia",
      cwd: __dirname + "/backend",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "250M",
      node_args: "--max-old-space-size=200",
      env: { NODE_ENV: "production" },
      time: true,
    },
  ],
};
