const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor() {
    this.dbInstance = null;
  };

  async connect(dbFile) {
    if (this.dbInstance && this.dbInstance.open) {
      return this.dbInstance;
    }
    try {
      let dbInstance;
      await new Promise((resolve, reject) => {
        dbInstance = new sqlite3.Database(dbFile, sqlite3.OPEN_READONLY, (err) => {
          if (err) {
            console.error(err.message);
            return reject(err.message);
          }
        return resolve();
        });
      });
      console.log(dbInstance)
      this.dbInstance = dbInstance;
      return dbInstance;
    } catch (err) {
      throw new Error(err);
    }
  }

  async close() {
    try {
      await new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) {
            console.error(err.message);
            return reject(err.message);
          }
          return resolve();
        });
      });
      this.dbInstance = null;
    } catch (err) {
      throw new Error(err);
    }
  }
}

module.exports = Database;
