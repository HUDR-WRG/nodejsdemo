const mysql = require('mysql2/promise');
const crypto = require('crypto');
const { rootPool, pool } = require('./db');
const { getEnv } = require('./env');

// 生成随机盐值
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// 使用盐值和密码生成哈希密码
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// 创建数据库
async function createDatabase() {
  try {
    // 重新加载环境变量，确保获取最新的配置
    const host = getEnv('DB_HOST', 'localhost');
    const port = parseInt(getEnv('DB_PORT', '3306'));
    const user = getEnv('DB_USER', 'root');
    const password = getEnv('DB_PASSWORD', '');
    const dbName = getEnv('DB_NAME', 'miniapp_db');
    
    // 创建临时连接池，使用最新的配置
    const tempPool = mysql.createPool({
      host,
      port,
      user,
      password,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    
    console.log(`尝试以用户 ${user} 连接到 MySQL 服务器 ${host}:${port}...`);
    const connection = await tempPool.getConnection();
    console.log('连接到MySQL服务器成功');
    
    try {
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`数据库 ${dbName} 创建成功或已存在`);
      return true;
    } catch (error) {
      console.error('创建数据库失败:', error);
      return false;
    } finally {
      connection.release();
      await tempPool.end();
    }
  } catch (error) {
    console.error('连接MySQL服务器失败:', error);
    return false;
  }
}

// 初始化数据库表结构
async function initTables() {
  let connection;
  try {
    // 重新加载环境变量，确保获取最新的配置
    const host = getEnv('DB_HOST', 'localhost');
    const port = parseInt(getEnv('DB_PORT', '3306'));
    const user = getEnv('DB_USER', 'root');
    const password = getEnv('DB_PASSWORD', '');
    const dbName = getEnv('DB_NAME', 'miniapp_db');
    
    // 创建临时连接池，使用最新的配置
    const tempPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
      multipleStatements: true
    });
    
    connection = await tempPool.getConnection();
    console.log('开始初始化数据库表...');
    
    // 开始事务
    await connection.beginTransaction();
    
    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(128),
        salt VARCHAR(32),
        nickname VARCHAR(255),
        avatar_url VARCHAR(255),
        gender TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        open_id VARCHAR(50)
      )
    `);
    
    // 创建树洞表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tree_holes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_anonymous BOOLEAN DEFAULT FALSE
      )
    `);
    
    // 创建情绪日记表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS emotion_diaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        mood_score INT NOT NULL,
        content TEXT,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建冥想放松资源表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS meditation_resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL COMMENT '标题',
        description TEXT COMMENT '描述',
        audio_url VARCHAR(255) NOT NULL COMMENT '音频URL',
        cover_url VARCHAR(255) COMMENT '封面图URL',
        duration INT DEFAULT 5 COMMENT '时长（分钟）',
        category VARCHAR(50) COMMENT '分类',
        play_count INT DEFAULT 0 COMMENT '播放次数',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) 
    `);
    
    // 提交事务
    await connection.commit();
    console.log('数据库表初始化成功');
    await tempPool.end();
    return true;
  } catch (error) {
    // 如果出错，回滚事务
    if (connection) await connection.rollback();
    console.error('数据库表初始化失败:', error);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

// 添加测试用户
async function addTestUser() {
  let connection;
  let tempPool;
  try {
    // 重新加载环境变量，确保获取最新的配置
    const host = getEnv('DB_HOST', 'localhost');
    const port = parseInt(getEnv('DB_PORT', '3306'));
    const user = getEnv('DB_USER', 'root');
    const password = getEnv('DB_PASSWORD', '');
    const dbName = getEnv('DB_NAME', 'miniapp_db');
    
    // 创建临时连接池，使用最新的配置
    tempPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    
    connection = await tempPool.getConnection();
    console.log('开始添加测试用户...');
    
    // 检查测试用户是否已存在
    const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', ['test']);
    
    if (users.length > 0) {
      console.log('测试用户已存在，跳过创建');
      return true;
    }
    
    // 生成盐值和哈希密码
    const salt = generateSalt();
    const hashedPassword = hashPassword('123456', salt);
    
    // 创建测试用户
    await connection.execute(
      'INSERT INTO users (id, username, password, salt, nickname, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      ['test_user_id', 'test', hashedPassword, salt, '测试用户', '/static/images/default-avatar.png']
    );
    
    console.log('测试用户创建成功');
    return true;
  } catch (error) {
    console.error('添加测试用户失败:', error);
    return false;
  } finally {
    if (connection) connection.release();
    if (tempPool) await tempPool.end();
  }
}

// 添加冥想资源初始数据
async function addMeditationResources() {
  let connection;
  let tempPool;
  try {
    // 重新加载环境变量，确保获取最新的配置
    const host = getEnv('DB_HOST', 'localhost');
    const port = parseInt(getEnv('DB_PORT', '3306'));
    const user = getEnv('DB_USER', 'root');
    const password = getEnv('DB_PASSWORD', '');
    const dbName = getEnv('DB_NAME', 'miniapp_db');
    
    // 创建临时连接池，使用最新的配置
    tempPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    
    connection = await tempPool.getConnection();
    console.log('开始添加冥想资源初始数据...');
    
    // 检查是否已有冥想资源数据
    const [resources] = await connection.execute('SELECT COUNT(*) as count FROM meditation_resources');
    
    if (resources[0].count > 0) {
      console.log('冥想资源数据已存在，跳过添加');
      return true;
    }
    
    // 添加冥想资源初始数据
    const meditationResources = [
      {
        title: '五分钟呼吸冥想',
        description: '通过专注于呼吸，帮助你平静心情，缓解压力和焦虑。适合初学者和快速放松。',
        audio_url: '/static/audio/breathing-meditation-5min.mp3',
        cover_url: '/static/images/meditation-breathing.jpg',
        duration: 5,
        category: '呼吸冥想'
      },
      {
        title: '十分钟正念冥想',
        description: '通过正念练习，培养当下觉知能力，改善注意力和情绪管理能力。',
        audio_url: '/static/audio/mindfulness-meditation-10min.mp3',
        cover_url: '/static/images/meditation-mindfulness.jpg',
        duration: 10,
        category: '正念冥想'
      },
      {
        title: '睡前放松冥想',
        description: '帮助你放松身心，缓解一天的疲劳和压力，为良好的睡眠做准备。',
        audio_url: '/static/audio/sleep-meditation-15min.mp3',
        cover_url: '/static/images/meditation-sleep.jpg',
        duration: 15,
        category: '睡眠冥想'
      },
      {
        title: '减压冥想',
        description: '专为缓解压力和焦虑设计的冥想练习，帮助你找回内心的平静与平衡。',
        audio_url: '/static/audio/stress-relief-meditation-8min.mp3',
        cover_url: '/static/images/meditation-stress.jpg',
        duration: 8,
        category: '减压冥想'
      },
      {
        title: '感恩冥想',
        description: '培养感恩之心，增强幸福感和积极情绪，改善心理健康和人际关系。',
        audio_url: '/static/audio/gratitude-meditation-12min.mp3',
        cover_url: '/static/images/meditation-gratitude.jpg',
        duration: 12,
        category: '主题冥想'
      }
    ];
    
    // 开始事务
    await connection.beginTransaction();
    
    for (const resource of meditationResources) {
      await connection.execute(
        'INSERT INTO meditation_resources (title, description, audio_url, cover_url, duration, category) VALUES (?, ?, ?, ?, ?, ?)',
        [resource.title, resource.description, resource.audio_url, resource.cover_url, resource.duration, resource.category]
      );
    }
    
    // 提交事务
    await connection.commit();
    console.log('冥想资源初始数据添加成功');
    return true;
  } catch (error) {
    // 如果出错，回滚事务
    if (connection) await connection.rollback();
    console.error('添加冥想资源初始数据失败:', error);
    return false;
  } finally {
    if (connection) connection.release();
    if (tempPool) await tempPool.end();
  }
}

// 完整的数据库初始化流程
async function initDatabase() {
  try {
    console.log('开始数据库初始化流程...');
    
    // 初始化表结构
    const tablesInitialized = await initTables();
    if (!tablesInitialized) {
      console.error('表结构初始化失败，初始化终止');
      return false;
    }
    
    // 添加测试用户
    const testUserAdded = await addTestUser();
    if (!testUserAdded) {
      console.error('测试用户添加失败，初始化终止');
      return false;
    }
    
    // 添加冥想资源初始数据
    const meditationResourcesAdded = await addMeditationResources();
    if (!meditationResourcesAdded) {
      console.error('冥想资源初始数据添加失败，初始化终止');
      return false;
    }
    
    console.log('数据库初始化完成！');
    return true;
  } catch (error) {
    console.error('数据库初始化过程中出错:', error);
    return false;
  }
}

module.exports = {
  initDatabase,
  createDatabase,
  initTables,
  addTestUser,
  addMeditationResources
}; 