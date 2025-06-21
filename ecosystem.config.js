module.exports = {
  apps: [{
    name: "lindas-nut-butter",
    script: "server/index.js",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "500M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "logs/error.log",
    out_file: "logs/out.log"
  }]
};
