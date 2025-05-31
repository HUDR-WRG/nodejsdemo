const mysql = require('mysql2/promise');
const { getEnv } = require('./env');

// 获取数据库配置
function getDbConfig(includeDb = true) {
  const config = {
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '3306')),
    user: getEnv('DB_USER', 'root'),
    password: getEnv('DB_PASSWORD', ''),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // 允许多条SQL语句
  };

  // 如果需要包含数据库名称
  if (includeDb) {
    config.database = getEnv('DB_NAME', 'miniapp_db');
  }

  return config;
}

// 创建数据库连接池 - 无需指定数据库名称，因为可能还不存在
const rootPool = mysql.createPool(getDbConfig(false));

// 创建应用数据库连接池
const pool = mysql.createPool(getDbConfig(true));

// 测试数据库连接
async function testConnection() {
  try {
    // 重新创建连接池，确保使用最新的环境变量
    const rootConfig = getDbConfig(false);
    const appConfig = getDbConfig(true);
    
    const tempRootPool = mysql.createPool(rootConfig);
    
    // 首先尝试连接到MySQL服务器（不指定数据库）
    const rootConnection = await tempRootPool.getConnection();
    console.log('MySQL服务器连接成功');
    rootConnection.release();
    await tempRootPool.end();
    
    try {
      // 然后尝试连接到应用数据库
      const tempAppPool = mysql.createPool(appConfig);
      const connection = await tempAppPool.getConnection();
      console.log('应用数据库连接成功');
      connection.release();
      await tempAppPool.end();
      return true;
    } catch (dbError) {
      console.log('应用数据库不存在或无法连接');
      return false;
    }
  } catch (error) {
    console.error('MySQL服务器连接失败:', error);
    return false;
  }
}

// 执行SQL查询的辅助函数，自动处理错误和连接释放
async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    return [results, null];
  } catch (error) {
    console.error('SQL执行错误:', error);
    return [null, error];
  } finally {
    if (connection) connection.release();
  }
}

// 导出
module.exports = {
  pool,
  rootPool,
  testConnection,
  executeQuery,
  getDbConfig
}; 

