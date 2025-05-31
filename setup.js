/**
 * 项目初始化脚本
 * 用于初始化项目环境、数据库等
 */

const inquirer = require('inquirer');
const { spawn } = require('child_process');
const { loadEnv, updateEnvFile, getEnv } = require('./config/env');
const { initDatabase, createDatabase } = require('./config/dbinit');

// 加载环境变量
loadEnv();

// 执行命令行命令
function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`执行命令: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

// 询问数据库配置
async function promptDatabaseConfig() {
  console.log('请配置数据库连接信息：');
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'DB_HOST',
      message: '数据库主机地址:',
      default: getEnv('DB_HOST', 'localhost')
    },
    {
      type: 'input',
      name: 'DB_PORT',
      message: '数据库端口:',
      default: getEnv('DB_PORT', '3306'),
      validate: value => {
        const port = parseInt(value);
        return !isNaN(port) && port > 0 && port < 65536 ? true : '请输入有效的端口号 (1-65535)';
      }
    },
    {
      type: 'input',
      name: 'DB_USER',
      message: '数据库用户名:',
      default: getEnv('DB_USER', 'root')
    },
    {
      type: 'password',
      name: 'DB_PASSWORD',
      message: '数据库密码:',
      default: getEnv('DB_PASSWORD', '')
    },
    {
      type: 'input',
      name: 'DB_NAME',
      message: '数据库名称:',
      default: getEnv('DB_NAME', 'miniapp_db')
    }
  ]);
  
  // 打印调试信息
  console.log('用户输入的数据库配置:', {
    host: answers.DB_HOST,
    port: answers.DB_PORT,
    user: answers.DB_USER,
    dbName: answers.DB_NAME
  });
  
  // 更新环境变量文件
  const updated = updateEnvFile(answers);
  if (!updated) {
    console.error('更新环境变量配置失败');
    return false;
  }
  
  console.log('数据库配置已保存');
  
  // 确保环境变量已更新
  process.env.DB_HOST = answers.DB_HOST;
  process.env.DB_PORT = answers.DB_PORT;
  process.env.DB_USER = answers.DB_USER;
  process.env.DB_PASSWORD = answers.DB_PASSWORD;
  process.env.DB_NAME = answers.DB_NAME;
  
  // 尝试创建数据库
  console.log('尝试创建数据库...');
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    console.error('数据库创建失败，请检查数据库连接信息');
    return false;
  }
  
  return true;
}

// 询问服务器配置
async function promptServerConfig() {
  console.log('\n请配置服务器信息：');
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'PORT',
      message: '服务器端口:',
      default: getEnv('PORT', '3000'),
      validate: value => {
        const port = parseInt(value);
        return !isNaN(port) && port > 0 && port < 65536 ? true : '请输入有效的端口号 (1-65535)';
      }
    },
    {
      type: 'list',
      name: 'NODE_ENV',
      message: '运行环境:',
      choices: ['development', 'production', 'test'],
      default: getEnv('NODE_ENV', 'development')
    }
  ]);
  
  // 更新环境变量文件
  const updated = updateEnvFile(answers);
  if (!updated) {
    console.error('更新环境变量配置失败');
    return false;
  }
  
  console.log('服务器配置已保存');
  return true;
}

// 项目初始化主函数
async function setupProject() {
  console.log('======================================');
  console.log('开始初始化心灵伴侣微信小程序项目环境...');
  console.log('======================================');
  
  // 配置环境变量
  console.log('\n[1/3] 配置数据库连接信息...');
  const dbConfigured = await promptDatabaseConfig();
  if (!dbConfigured) {
    console.error('\n❌ 数据库配置失败，请检查错误信息并重试');
    process.exit(1);
  }
  
  console.log('\n[2/3] 配置服务器信息...');
  const serverConfigured = await promptServerConfig();
  if (!serverConfigured) {
    console.error('\n❌ 服务器配置失败，请检查错误信息并重试');
    process.exit(1);
  }
  
  // 初始化数据库
  console.log('\n[3/3] 初始化数据库表和测试数据...');
  const dbInitialized = await initDatabase();
  
  if (!dbInitialized) {
    console.error('\n❌ 数据库初始化失败，请检查错误信息并重试');
    process.exit(1);
  }
  
  console.log('\n✅ 数据库初始化成功');
  
  console.log('\n======================================');
  console.log('项目初始化完成！');
  console.log('可以通过以下命令启动项目：');
  console.log('npm start');
  console.log('======================================');
}

// 执行项目初始化
setupProject().catch(error => {
  console.error('项目初始化过程中出错:', error);
  process.exit(1);
}); 
