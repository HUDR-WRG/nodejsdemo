// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    diary: null,
    isLoading: true,
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
    ]
  },

  onLoad: function (options) {
    if (options.id) {
      this.loadDiaryDetail(options.id);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载日记详情
  loadDiaryDetail: function (id) {
    this.setData({ isLoading: true });
    
    request.get(`/emotion-diaries/${id}`)
      .then(res => {
        if (res.success) {
          // 格式化日期
          if (res.data.created_at) {
            const date = new Date(res.data.created_at);
            res.data.formatted_date = date.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          
          this.setData({
            diary: res.data,
            isLoading: false
          });
        }
      })
      .catch(err => {
        console.error('获取日记详情失败', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '获取详情失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      });
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  },

  // 分享日记
  shareDiary: function () {
    // 微信小程序的分享功能
  },

  // 删除日记
  deleteDiary: function () {
    const that = this;
    if (!that.data.diary || !that.data.diary.id) {
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条情绪日记吗？删除后无法恢复。',
      success(res) {
        if (res.confirm) {
          that.performDelete();
        }
      }
    });
  },

  // 执行删除操作
  performDelete: function () {
    const that = this;
    wx.showLoading({
      title: '删除中...',
      mask: true
    });

    const diaryId = this.data.diary.id;
    const userId = app.globalData.userInfo.id;

    request.delete(`/emotion-diaries/${diaryId}?userId=${userId}`)
      .then(res => {
        if (res.success) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 设置全局刷新标记，返回列表页后刷新列表
          app.globalData.shouldRefreshEmotionList = true;
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      })
      .catch(err => {
        console.error('删除日记失败', err);
        wx.showToast({
          title: err.message || '删除失败，请重试',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onShareAppMessage: function () {
    return {
      title: '我的心情记录',
      path: `/pages/emotion/detail?id=${this.data.diary.id}`,
      imageUrl: '/static/images/share-emotion.png'
    };
  }
}); 