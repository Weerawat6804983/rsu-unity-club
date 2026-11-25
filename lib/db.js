import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE || 'rsu_unity_club',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const globalForDb = globalThis;
const pool = globalForDb.mysqlPool || mysql.createPool(dbConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.mysqlPool = pool;
}

export default pool;