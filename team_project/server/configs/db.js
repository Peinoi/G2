const mariadb = require('mariadb');
const dotenv = require('dotenv');
dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

// 연결 테스트
pool
  .getConnection()
  .then((conn) => {
    console.log('[ db.js || 성공 ]');
    conn.release();
  })
  .catch((err) => {
    console.error('[ db.js || 실패 ]', err.message);
  });

module.exports = pool;
