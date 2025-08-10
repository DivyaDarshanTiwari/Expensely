require("dotenv").config();

const cluster = require("cluster");
const os = require("os");
const { app } = require("./app");

const cpu = os.cpus().length;

cluster.schedulingPolicy = cluster.SCHED_RR;

if (cluster.isPrimary) {
  for (let i = 0; i < cpu; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const port = process.env.SERVER_PORT || 5000;

  app.listen(port, () => {
    console.log("Server is running on port" + port + "on pid" + process.pid);
  });
}
