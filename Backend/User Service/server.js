require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const { app } = require("./app");

const port = process.env.SERVER_PORT || 5000;

app.listen(port, () => {
  console.log("Server is running on port" + port + "on pid" + process.pid);
});
