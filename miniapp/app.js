// app.js
// 移除对request模块的循环依赖
// const { post } = require('./utils/request');

App({
  globalData: {
    userInfo: null,
    baseUrl: 'http://localhost:3000/api/miniapp', // 后端接口基础URL
    isLoggedIn: false, // 添加登录状态标识
    shouldRefreshEmotionList: false // 是否需要刷新情绪日记列表
  },
  
  onLaunch: function () {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 检查本地存储中的登录状态和用户信息
    const storedUser = wx.getStorageSync('loginUser');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (userInfo) {
      // 已有存储的用户信息，恢复到全局数据
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      // 设置需要刷新情绪日记列表的标记
      this.globalData.shouldRefreshEmotionList = true;
    } else if (storedUser) {
      // 有存储的登录凭据，但需要重新登录获取最新的用户信息
      this.globalData.isLoggedIn = false;
    } else {
      this.globalData.isLoggedIn = false;
    }
    
    // 设置默认测试用户信息，仅开发环境使用
    if (!this.globalData.userInfo) {
      this.globalData.userInfo = {
        nickname: '测试用户',
        avatarUrl: '/static/images/default-avatar.png',
        id: 'test_user_id'
      };
      this.globalData.isLoggedIn = true;
      // 设置需要刷新情绪日记列表的标记
      this.globalData.shouldRefreshEmotionList = true;
      // 存储到本地，以便下次使用
      wx.setStorageSync('userInfo', this.globalData.userInfo);
    }
  },
  
  // 微信登录，获取openId
  login: function() {
    const that = this;
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          if (res.code) {
            console.log('微信登录成功，code:', res.code);
            
            // 发送code到服务器换取openid
            wx.request({
              url: `${that.globalData.baseUrl}/user/wxLogin`,
              method: 'POST',
              data: { code: res.code },
              header: {
                'content-type': 'application/json'
              },
              success: function(res) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  const response = res.data;
                  if (response.success) {
                    // 保存登录信息
                    that.globalData.isLoggedIn = true;
                    
                    // 将openid和用户ID保存到本地
                    wx.setStorageSync('loginUser', {
                      userId: response.data.userId,
                      openid: response.data.openid
                    });
                    
                    // 是否为新用户
                    if (response.data.isNewUser) {
                      console.log('新用户登录，需要获取用户信息');
                      // 如果是新用户，可以在这里处理额外逻辑
                    }
                    
                    resolve(response.data);
                  } else {
                    console.error('服务器登录失败:', response.message);
                    reject(response.message);
                  }
                } else {
                  reject('服务器响应错误: ' + res.statusCode);
                }
              },
              fail: function(err) {
                console.error('微信登录请求失败:', err);
                reject(err);
              }
            });
          } else {
            console.log('微信登录失败：' + res.errMsg);
            reject(res.errMsg);
          }
        },
        fail: err => {
          console.error('微信登录失败', err);
          reject(err);
        }
      });
    });
  },
  
  // 获取用户信息
  getUserInfo: function() {
    const that = this;
    return new Promise((resolve, reject) => {
      // 检查是否已授权
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称
            wx.getUserProfile({
              desc: '用于完善会员资料',
              success: res => {
                // 获取登录用户信息
                const loginUser = wx.getStorageSync('loginUser');
                if (!loginUser || !loginUser.openid) {
                  reject(new Error('未检测到登录信息，请先登录'));
                  return;
                }
                
                // 将微信的用户信息转换为我们系统中使用的格式
                const userInfo = {
                  nickname: res.userInfo.nickName,
                  avatarUrl: res.userInfo.avatarUrl,
                  gender: res.userInfo.gender || 0
                };
                
                console.log('准备发送用户信息:', userInfo);
                
                // 发送用户信息到后端保存
                wx.request({
                  url: `${that.globalData.baseUrl}/user/updateWxUserInfo`,
                  method: 'POST',
                  data: {
                    openId: loginUser.openid,
                    userInfo: userInfo
                  },
                  header: {
                    'content-type': 'application/json'
                  },
                  success: function(res) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                      const response = res.data;
                      if (response.success) {
                        // 更新全局数据
                        userInfo.id = loginUser.userId;
                        that.globalData.userInfo = userInfo;
                        // 保存到本地
                        wx.setStorageSync('userInfo', userInfo);
                        resolve(userInfo);
                      } else {
                        reject(new Error(response.message || '更新用户信息失败'));
                      }
                    } else {
                      reject(new Error('服务器响应错误: ' + res.statusCode));
                    }
                  },
                  fail: function(err) {
                    console.error('更新用户信息失败:', err);
                    reject(err);
                  }
                });
              },
              fail: err => {
                reject(err);
              }
            });
          } else {
            // 未授权
            reject(new Error('用户未授权获取个人信息'));
          }
        },
        fail: err => {
          reject(err);
        }
      });
    });
  }
}); 