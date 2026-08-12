import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  ssl: {
    rejectUnauthorized: false,
  },
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute query helper
// Execute query helper
export async function query(sql: string, params: any[] = []) {
  try {
    console.log("========== SQL ==========");
    console.log(sql);
    console.log("========== PARAMS ==========");
    console.log(params);

    const [results] = await pool.execute(sql, params);

    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Transaction helper
export async function transaction(callback: (connection: mysql.PoolConnection) => Promise<any>) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;

