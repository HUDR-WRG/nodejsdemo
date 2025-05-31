// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    moodScore: 5,
    diaries: [],
    moodDescriptions: [
      "情绪低落，需要关爱",
      "有些难过，想静静",
      "略感失落，但在调整",
      "平静中带点失落",
      "平静且平衡",
      "平静中带点愉悦",
      "心情不错，有活力",
      "开心，充满希望",
      "非常愉快，充满活力",
      "狂喜，十分满足"
    ],
    isLoading: false
  },

  onLoad: function () {
    this.loadDiaries();
  },

  onShow: function () {
    // 检查是否需要刷新列表
    if (app.globalData.shouldRefreshEmotionList) {
      // 清空当前日记数据，防止用户切换时数据残留
      this.setData({ diaries: [] });
      this.loadDiaries();
      // 重置刷新标记
      app.globalData.shouldRefreshEmotionList = false;
    }
  },

  onPullDownRefresh: function () {
    this.loadDiaries().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载日记列表
  loadDiaries: function () {
    if (!app.globalData.userInfo) {
      this.setData({ diaries: [] });
      return Promise.resolve();
    }
    
    // 在开始加载前清空数据，确保数据隔离
    this.setData({ diaries: [], isLoading: true });
    
    return request.get('/emotion-diaries', { userId: app.globalData.userInfo.id })
      .then(res => {
        if (res.success) {
          // 格式化日期显示
          const formattedDiaries = (res.data || []).map(diary => ({
            ...diary,
            created_at: this.formatDate(diary.created_at)
          }));
          
          this.setData({
            diaries: formattedDiaries,
            isLoading: false
          });
        }
      })
      .catch(err => {
        console.error('获取情绪日记失败', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '获取日记失败',
          icon: 'none'
        });
      });
  },

  // 心情值改变
  onMoodChange: function (e) {
    this.setData({
      moodScore: e.detail.value
    });
  },

  // 跳转到日记详情
  viewDiaryDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/emotion/detail?id=${id}`
    });
  },

  // 跳转到统计页面
  goToStats: function () {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/emotion/stats'
    });
  },

  // 显示日记录入弹窗
  showDiaryModal: function () {
    // 检查用户是否登录
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 检查今天是否已经记录过心情
    const userId = app.globalData.userInfo.openId || app.globalData.userInfo.id;
    
    request.get(`/emotion-diaries/check-today?userId=${userId}`)
      .then(res => {
        if (res.success && res.hasRecorded) {
          // 今天已经记录过心情，显示提示
          wx.showModal({
            title: '温馨提示',
            content: res.message,
            showCancel: false,
            confirmText: '知道了'
          });
        } else {
          // 今天还没有记录，可以跳转到创建页面
          wx.navigateTo({
            url: `/pages/emotion/create?mood=${this.data.moodScore}`
          });
        }
      })
      .catch(err => {
        console.error('检查今日记录失败:', err);
        // 如果检查失败，仍然允许跳转（降级处理）
        wx.navigateTo({
          url: `/pages/emotion/create?mood=${this.data.moodScore}`
        });
      });
  },

  // 格式化日期显示
  formatDate: function(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // 返回格式：2025-05-23 14:30
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
});