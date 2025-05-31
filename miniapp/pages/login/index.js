// 获取应用实例
const app = getApp();
// 移除对request模块的引用，避免循环依赖
// const request = require('../../utils/request');

Page({
  data: {
    username: '',
    password: '',
    isLoading: false,
    rememberPassword: false
  },

  onLoad: function () {
    // 判断是否有本地保存的用户信息
    const storedUser = wx.getStorageSync('loginUser');
    if (storedUser) {
      this.setData({
        username: storedUser.username,
        password: storedUser.password,
        rememberPassword: true
      });
    }
  },

  // 监听用户名输入
  onUsernameInput: function (e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 监听密码输入
  onPasswordInput: function (e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 切换记住密码状态
  toggleRememberPassword: function () {
    this.setData({
      rememberPassword: !this.data.rememberPassword
    });
  },

  // 登录
  login: function () {
    const { username, password, rememberPassword } = this.data;
    const that = this;

    // 简单的表单验证
    if (!username.trim() || !password.trim()) {
      wx.showToast({
        title: '用户名和密码不能为空',
        icon: 'none'
      });
      return;
    }

    this.setData({ isLoading: true });
    
    // 检查是否为本地开发环境
    const isDev = app.globalData.baseUrl.includes('localhost') || app.globalData.baseUrl.includes('127.0.0.1') || app.globalData.baseUrl.includes('192.168.');
    
    // 调用后端登录接口
    wx.request({
      url: `${app.globalData.baseUrl}/user/login`,
      method: 'POST',
      data: { username, password },
      header: {
        'content-type': 'application/json'
      },
      success: function(resp) {
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          const res = resp.data;
          if (res.success) {
            // 保存登录信息
            if (rememberPassword) {
              wx.setStorageSync('loginUser', { username, password });
            } else {
              wx.removeStorageSync('loginUser');
            }

            // 设置全局用户信息
            app.globalData.userInfo = res.data.userInfo;
            app.globalData.isLoggedIn = true;

            // 保存用户信息到本地存储
            wx.setStorageSync('userInfo', res.data.userInfo);

            // 设置需要刷新情绪日记列表的标记
            app.globalData.shouldRefreshEmotionList = true;

            // 跳转到首页
            wx.switchTab({
              url: '/pages/index/index'
            });
          } else {
            wx.showToast({
              title: res.message || '登录失败',
              icon: 'none'
            });
          }
        } else {
          wx.showToast({
            title: `请求失败(${resp.statusCode})`,
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('登录失败', err);
        
        // 显示具体错误信息
        let errorMessage = '登录失败，请重试';
        if (err && err.errMsg) {
          errorMessage = err.errMsg;
        }
        
        // 本地开发环境特殊处理
        if (isDev && err && err.errMsg && err.errMsg.includes('fail')) {
          // 本地服务器连接错误提示
          wx.showModal({
            title: '本地服务器连接失败',
            content: '无法连接到本地后端服务器\n\n请检查:\n1. 后端服务是否已启动\n2. 确保小程序开发工具已勾选"不校验合法域名"',
            showCancel: false
          });
          return;
        }
        
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        });
      },
      complete: function() {
        that.setData({ isLoading: false });
      }
    });
  },

  // 忘记密码
  forgotPassword: function () {
    wx.navigateTo({
      url: '/pages/login/forget'
    });
  },

  // 注册
  register: function () {
    wx.navigateTo({
      url: '/pages/login/register'
    });
  },
  
  // 微信登录
  wxLogin: function() {
    this.setData({ isLoading: true });
    
    // 调用全局应用中的微信登录方法
    app.login()
      .then(loginData => {
        // 用户已经通过微信登录，获取用户基本信息
        // 此时应该获取并上传用户详细信息
        wx.showModal({
          title: '授权提示',
          content: '需要获取您的微信头像和昵称等信息，请点击确定授权',
          success: (res) => {
            if (res.confirm) {
              // 用户点击确定，尝试获取用户信息
              app.getUserInfo()
                .then(userInfo => {
                  // 成功获取用户信息，存储全局用户状态
                  app.globalData.isLoggedIn = true;
                  
                  // 设置需要刷新情绪日记列表的标记
                  app.globalData.shouldRefreshEmotionList = true;
                  
                  // 跳转到首页
                  wx.switchTab({
                    url: '/pages/index/index'
                  });
                })
                .catch(err => {
                  console.error('获取用户信息失败', err);
                  // 即使获取用户信息失败，也认为用户已登录，只是没有完善资料
                  app.globalData.isLoggedIn = true;
                  wx.switchTab({
                    url: '/pages/index/index'
                  });
                });
            } else {
              // 用户点击取消，仍然认为登录成功，但没有用户详细信息
              app.globalData.isLoggedIn = true;
              wx.switchTab({
                url: '/pages/index/index'
              });
            }
          }
        });
      })
      .catch(err => {
        console.error('微信登录失败', err);
        wx.showToast({
          title: '微信登录失败，请重试',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ isLoading: false });
      });
  }
}); 