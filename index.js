const express = require('express');
const path = require('path');
const { loadEnv, getEnv } = require('./config/env');

// 加载环境变量
loadEnv();

const app = express();
const PORT = getEnv('PORT', 3000);

// 导入数据库配置
const { testConnection } = require('./config/db');
const { createDatabase } = require('./config/dbinit');

// 导入路由
const miniappRoutes = require('./routes/miniapp');

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件路径
app.use(express.static(path.join(__dirname, 'public')));

// 使用路由
app.use('/api/miniapp', miniappRoutes);

// 基础路由
app.get('/', (req, res) => {
  res.send('微信小程序后端服务器正在运行');
});

// 初始化应用
async function initializeApp() {
  try {
    console.log('正在测试数据库连接...');
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('数据库连接测试失败，请检查数据库配置和状态');
      console.error('请先运行 npm run setup 初始化项目');
      process.exit(1);
    }
    
    console.log('数据库连接成功，启动服务器...');
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('服务器启动失败：', err);
    process.exit(1);
  }
}

// 启动应用
initializeApp(); 