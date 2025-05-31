const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 环境变量文件路径
const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE_FILE = path.join(__dirname, 'env.example');

// 加载环境变量
function loadEnv() {
  // 如果.env文件不存在，尝试从示例文件复制
  if (!fs.existsSync(ENV_FILE) && fs.existsSync(ENV_EXAMPLE_FILE)) {
    fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
    console.log('已从示例创建环境配置文件 .env');
  }

  // 加载环境变量
  const result = dotenv.config({ path: ENV_FILE });
  if (result.error) {
    console.error('无法加载环境变量文件:', result.error);
    return false;
  }
  
  return true;
}

// 更新环境变量文件
function updateEnvFile(updates) {
  try {
    // 确保.env文件存在
    if (!fs.existsSync(ENV_FILE)) {
      if (fs.existsSync(ENV_EXAMPLE_FILE)) {
        fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
      } else {
        fs.writeFileSync(ENV_FILE, '');
      }
    }
    
    // 读取当前环境变量
    let envContent = fs.readFileSync(ENV_FILE, 'utf8');
    
    // 打印调试信息
    console.log('正在更新环境变量文件:', Object.keys(updates));
    
    // 更新环境变量
    for (const [key, value] of Object.entries(updates)) {
      // 检查变量是否已存在
      const regex = new RegExp(`^${key}=.*`, 'gm');
      if (regex.test(envContent)) {
        // 更新现有变量
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // 添加新变量
        envContent += `\n${key}=${value}`;
      }
    }
    
    // 写入更新后的内容
    fs.writeFileSync(ENV_FILE, envContent.trim());
    
    // 重新加载环境变量
    const result = dotenv.config({ path: ENV_FILE, override: true });
    if (result.error) {
      console.error('重新加载环境变量失败:', result.error);
      return false;
    }
    
    // 打印调试信息
    console.log('环境变量已更新，当前数据库名称:', process.env.DB_NAME);
    
    return true;
  } catch (error) {
    console.error('更新环境变量文件失败:', error);
    return false;
  }
}

// 获取环境变量，带默认值
function getEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

// 导出
module.exports = {
  loadEnv,
  updateEnvFile,
  getEnv
}; 