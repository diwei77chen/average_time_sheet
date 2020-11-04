const express = require("express");
const app = express();
const Database = require("./db/client");
const dbClient = new Database();

const PORT = 3000;
const DB_FILE = "./db/events.db";

app.use(function (req, res, next) {
  // remove these headers if the code needs to be depolyed to production
  res.header("Access-Control-Allow-Origin", "http://localhost:3030");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const selectRegex = /^select/i;
const isValidSelectQuery = (sql = '') => !!sql.match(selectRegex);

const readDatabase = async (db, sql = '', hasPermission = false, result = []) => {
  return new Promise((resolve, reject) => {
    if (!db) reject(new Error("Can't access to the database. [read]"));
    if (!isValidSelectQuery(sql)) reject(new Error('Invalid SQL Query. [read]'));
    if (!hasPermission) reject(new Error('Permission Denied. [read]'));
    db.serialize(() => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(new Error("Can't query the database. [read]"));
        let queryResult = [];
        rows.forEach(row => {
          queryResult.push(row);
        })
        resolve(queryResult);
      });
    });
  })
}

app.get("/report", async (req, res) => {
  const db = await dbClient.connect(DB_FILE); // we can either open one connection for all queries or one connection for one query.
  const hasPermission = true; // assuming the connected user has the permission to get the data
  let report = [];

  // seperate query for easy debugging
  const totalAttentionTimeSql =
    `SELECT SUM(total_attention_time) AS totalAttentionTime, I.format AS format
    FROM impression AS I
    INNER JOIN attention AS A ON I.impression_id = A.impression_id
    GROUP BY I.format
    HAVING A.total_attention_time >= 0;`;
  try {
    const queryResult = await readDatabase(db, totalAttentionTimeSql, hasPermission);
    report = report.concat(queryResult);
  } catch(err1) {
    console.error("/report can't read total attention time. error", err1);
  }

  const totalExecutedImpressionsSql =
    `SELECT COUNT(impression_id) AS totoalExecutedImpressions, format
    FROM impression
    WHERE executed = 1
    GROUP BY format;`;
  try {
    const queryResult = await readDatabase(db, totalExecutedImpressionsSql, hasPermission, report);
    report = report.concat(queryResult);
  } catch(err2) {
    console.error("/report can't read total executed impressions. error", err2);
  }

  const totalTimeInViewSql =
      `SELECT SUM(T.total_time_in_view) AS totalTimeInView, I.format AS format
      FROM impression AS I
      INNER JOIN time_in_view AS T ON I.impression_id = T.impression_id
      GROUP BY I.format
      HAVING T.total_time_in_view >= 0;`;
  try {
    const queryResult = await readDatabase(db, totalTimeInViewSql, hasPermission, report);
    report = report.concat(queryResult);
  } catch(err3) {
    console.error("/report can't read total time in view. error", err3);
  }

  db.close(err => {
    if (err) {
      return console.error(err.message);
    }
    console.log('/report close the database connection.');
  });

  res.json(report);
});

app.listen(PORT, () => console.log(`Api listening on port ${PORT}!`));

process.on("SIGTERM", () => {
  server.close(async () => {
    await dbClient.close();
    console.log("Http server closed.");
  });
});
