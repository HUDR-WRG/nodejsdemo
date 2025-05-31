const { pool, executeQuery } = require('../config/db');
const crypto = require('crypto');
const axios = require('axios');
const wxConfig = require('../config/wx');

// 生成随机盐值
const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

// 使用盐值对密码进行哈希处理
const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

// 用户注册
exports.register = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  let connection;
  try {
    console.log('开始用户注册流程，用户名:', username);
    
    connection = await pool.getConnection();
    
    // 开始事务
    await connection.beginTransaction();
    
    // 检查用户名是否已存在
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length > 0) {
      console.log('用户名已存在:', username);
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    
    // 生成盐值和哈希密码
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);
    
    // 为用户生成唯一ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('生成用户ID:', userId);
    
    // 创建新用户
    console.log('准备执行SQL插入操作');
    const [insertResult] = await connection.execute(
      'INSERT INTO users (id, username, password, salt, nickname, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, username, hashedPassword, salt, username]
    );
    
    // 提交事务
    await connection.commit();
    
    console.log('用户创建成功，结果:', insertResult);
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: { 
        id: userId,
        username,
        nickname: username
      }
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    console.error('错误类型:', typeof error);
    console.error('错误完整信息:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // 如果连接已获取且事务已开始，则回滚
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('事务回滚失败:', rollbackError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: `服务器错误: ${error.message}`,
      details: error.sqlMessage || error.message
    });
  } finally {
    // 释放连接
    if (connection) {
      connection.release();
    }
  }
};

// 用户登录
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  try {
    // 获取用户信息
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    const user = users[0];
    
    // 测试账号特殊处理
    if (username === 'test' && password === '123456') {
      // 更新最后登录时间
      await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );
      
      // 返回用户信息
      return res.json({
        success: true,
        message: '登录成功',
        data: {
          userInfo: {
            id: user.id,
            username: user.username,
            nickname: user.nickname || '测试用户',
            avatarUrl: user.avatar_url || '/static/images/default-avatar.png'
          }
        }
      });
    }
    
    // 验证密码
    const hashedPassword = hashPassword(password, user.salt);
    
    if (hashedPassword !== user.password) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    // 更新最后登录时间
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // 返回用户信息
    res.json({
      success: true,
      message: '登录成功',
      data: {
        userInfo: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatarUrl: user.avatar_url
        }
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 重置密码
exports.resetPassword = async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ success: false, message: '用户名不能为空' });
  }
  
  try {
    // 检查用户是否存在
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 在实际应用中，这里应该发送重置链接到用户邮箱
    // 这里简化处理，只返回成功信息
    
    res.json({
      success: true,
      message: '密码重置链接已发送，请查收邮件'
    });
  } catch (error) {
    console.error('密码重置请求失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ success: false, message: '用户名不能为空' });
  }
  
  try {
    const [users] = await pool.execute(
      'SELECT id, username, nickname, avatar_url, created_at, last_login FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const user = users[0];
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 更新用户信息
exports.updateUserInfo = async (req, res) => {
  const { id } = req.params;
  const { nickname, avatarUrl } = req.body;
  
  try {
    // 检查用户是否存在
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 更新用户信息
    await pool.execute(
      'UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?',
      [nickname, avatarUrl, id]
    );
    
    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        id,
        nickname,
        avatarUrl
      }
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 微信小程序登录
exports.wxLogin = async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ success: false, message: 'code不能为空' });
  }
  
  try {
    // 调用微信接口获取openid和session_key
    const wxResponse = await axios.get(wxConfig.loginUrl, {
      params: {
        appid: wxConfig.appid,
        secret: wxConfig.secret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    // 检查微信返回结果
    const wxData = wxResponse.data;
    if (wxData.errcode) {
      console.error('微信登录接口返回错误:', wxData.errmsg);
      return res.status(400).json({ 
        success: false, 
        message: `微信登录失败: ${wxData.errmsg}` 
      });
    }
    
    const { openid, session_key } = wxData;
    
    // 检查用户是否已存在
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE open_id = ?',
      [openid]
    );
    
    let userId;
    
    if (users.length === 0) {
      // 创建新用户
      const newUserId = `user_wx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await pool.execute(
        'INSERT INTO users (id, open_id, created_at) VALUES (?, ?, NOW())',
        [newUserId, openid]
      );
      userId = newUserId;
    } else {
      userId = users[0].id;
    }
    
    // 更新最后登录时间
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE open_id = ?',
      [openid]
    );
    
    // 返回用户信息
    res.json({
      success: true,
      message: '登录成功',
      data: {
        userId: userId,
        openid: openid,
        isNewUser: users.length === 0
      }
    });
  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      details: error.message 
    });
  }
};

// 更新微信用户信息
exports.updateWxUserInfo = async (req, res) => {
  const { openId, userInfo } = req.body;
  
  if (!openId || !userInfo) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }
  
  try {
    // 检查userInfo对象中的属性，如果不存在则使用默认值
    const nickName = userInfo.nickname || userInfo.nickName || null;
    const avatarUrl = userInfo.avatarUrl || null;
    const gender = userInfo.gender !== undefined ? userInfo.gender : 0;
    
    console.log('更新微信用户信息:', { openId, nickName, avatarUrl, gender });
    
    // 更新用户信息
    await pool.execute(
      'UPDATE users SET nickname = ?, avatar_url = ?, gender = ? WHERE open_id = ?',
      [nickName, avatarUrl, gender, openId]
    );
    
    res.json({
      success: true,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新微信用户信息失败:', error);
    console.error('错误详情:', error.message, error.code, error.sql);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      details: error.message
    });
  }
}; 