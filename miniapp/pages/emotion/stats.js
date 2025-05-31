// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    timeRange: 'month', // week, month, year
    moodTrend: [],
    tagStats: [],
    isLoading: true,
    averageMood: 0,
    highestMood: 0,
    lowestMood: 0
  },

  onLoad: function () {
    this.loadStats();
  },

  // 格式化日期显示
  formatDate: function(dateStr) {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  },

  // 加载统计数据
  loadStats: function () {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    if (!app.globalData.userInfo.id) {
      console.error('用户ID不存在');
      wx.showToast({
        title: '无法获取用户信息，请重新登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
      return;
    }
    
    this.setData({ isLoading: true });
    
    request.get('/emotion-diaries/stats', { 
      userId: app.globalData.userInfo.id,
      timeRange: this.data.timeRange
    })
      .then(res => {
        if (res.success) {
          // 计算统计数据
          let sum = 0;
          let max = 0;
          let min = 10;
          
          if (res.data.moodTrend && res.data.moodTrend.length > 0) {
            // 格式化日期并计算统计数据
            const formattedMoodTrend = res.data.moodTrend.map(item => {
              const score = parseFloat(item.average_mood);
              sum += score;
              max = Math.max(max, score);
              min = Math.min(min, score);
              
              return {
                ...item,
                date: this.formatDate(item.date),
                average_mood: score.toFixed(1)
              };
            });
            
            // 计算平均值，保留一位小数
            const avg = (sum / res.data.moodTrend.length).toFixed(1);
            
            this.setData({
              moodTrend: formattedMoodTrend,
              tagStats: res.data.tagStats || [],
              averageMood: avg,
              highestMood: max.toFixed(1),
              lowestMood: min.toFixed(1),
              isLoading: false
            });
          } else {
            this.setData({
              moodTrend: [],
              tagStats: res.data.tagStats || [],
              averageMood: 0,
              highestMood: 0,
              lowestMood: 0,
              isLoading: false
            });
          }
        }
      })
      .catch(err => {
        console.error('获取统计数据失败', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '获取统计数据失败',
          icon: 'none'
        });
      });
  },

  // 切换时间范围
  changeTimeRange: function (e) {
    const timeRange = e.currentTarget.dataset.range;
    this.setData({ timeRange });
    this.loadStats();
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
}); 