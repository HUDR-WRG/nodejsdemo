// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  
  onLoad: function () {
    // 检查是否已登录
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
    } else {
      // 未登录，检查是否有缓存的登录信息
      const storedUser = wx.getStorageSync('loginUser');
      if (storedUser && storedUser.username && storedUser.password) {
        // 尝试自动登录
        this.autoLogin(storedUser.username, storedUser.password);
      } else {
        // 引导用户登录
        wx.redirectTo({
          url: '/pages/login/index'
        });
      }
    }
  },
  
  // 自动登录
  autoLogin: function(username, password) {
    request.post('/user/login', { username, password })
      .then(res => {
        if (res.success) {
          // 设置全局用户信息
          app.globalData.userInfo = res.data.userInfo;
          app.globalData.isLoggedIn = true;
          
          // 保存用户信息到本地存储
          wx.setStorageSync('userInfo', res.data.userInfo);
          
          // 设置需要刷新情绪日记列表的标记
          app.globalData.shouldRefreshEmotionList = true;
          
          this.setData({
            userInfo: app.globalData.userInfo,
            hasUserInfo: true
          });
        } else {
          throw new Error(res.message || '自动登录失败');
        }
      })
      .catch(err => {
        console.error('自动登录失败', err);
        // 登录失败，引导用户手动登录
        wx.redirectTo({
          url: '/pages/login/index'
        });
      });
  },
  
  onShow: function() {
    // 每次页面显示时检查登录状态
    if (!app.globalData.userInfo) {
      wx.redirectTo({
        url: '/pages/login/index'
      });
    }
  },
  
  getUserInfo: function(e) {
    console.log(e);
    app.globalData.userInfo = e.detail.userInfo;
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    });
  },
  
  // 页面导航
  navigateTo: function(e) {
    const path = e.currentTarget.dataset.path;
    // 判断是否是tabBar页面
    if (path === '/pages/treehole/index' || 
        path === '/pages/emotion/index' || 
        path === '/pages/meditation/index') {
      wx.switchTab({
        url: path
      });
    } else {
      wx.navigateTo({
        url: path
      });
    }
  },
  
  // 退出登录
  logout: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          app.globalData.userInfo = null;
          app.globalData.isLoggedIn = false;
          
          // 清除本地存储
          wx.removeStorageSync('loginUser');
          wx.removeStorageSync('userInfo');
          
          // 设置需要刷新情绪日记列表的标记
          app.globalData.shouldRefreshEmotionList = true;
          
          // 跳转到登录页
          wx.redirectTo({
            url: '/pages/login/index'
          });
        }
      }
    });
  }
}); 