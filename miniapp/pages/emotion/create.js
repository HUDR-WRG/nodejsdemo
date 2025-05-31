// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    moodScore: 5,
    content: '',
    tags: [],
    customTag: '',
    commonTags: ['开心', '悲伤', '愤怒', '焦虑', '平静', '疲惫', '兴奋', '满足', '担忧', '感恩'],
    isSubmitting: false
  },

  onLoad: function (options) {
    // 如果从情绪打分页面传来了心情值，则使用传来的值
    if (options.mood) {
      this.setData({
        moodScore: parseInt(options.mood)
      });
    }
  },

  // 输入框内容变化
  onContentInput: function (e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 选择标签
  selectTag: function (e) {
    const tag = e.currentTarget.dataset.tag;
    const tags = [...this.data.tags];
    
    // 如果标签已存在，则移除
    const index = tags.indexOf(tag);
    if (index > -1) {
      tags.splice(index, 1);
    } else {
      // 最多添加5个标签
      if (tags.length >= 5) {
        wx.showToast({
          title: '最多添加5个标签',
          icon: 'none'
        });
        return;
      }
      tags.push(tag);
    }
    
    this.setData({ tags });
  },

  // 自定义标签输入变化
  onCustomTagInput: function (e) {
    this.setData({
      customTag: e.detail.value
    });
  },

  // 添加自定义标签
  addCustomTag: function () {
    if (!this.data.customTag.trim()) {
      return;
    }
    
    const tags = [...this.data.tags];
    const customTag = this.data.customTag.trim();
    
    // 检查标签是否已存在
    if (tags.includes(customTag)) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
      return;
    }
    
    // 最多添加5个标签
    if (tags.length >= 5) {
      wx.showToast({
        title: '最多添加5个标签',
        icon: 'none'
      });
      return;
    }
    
    tags.push(customTag);
    this.setData({
      tags,
      customTag: ''
    });
  },

  // 提交日记
  submitDiary: function () {
    if (this.data.isSubmitting) {
      return;
    }

    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isSubmitting: true });
    
    // 获取用户ID (优先使用openId，如果没有则使用id)
    const userId = app.globalData.userInfo.openId || app.globalData.userInfo.id;
    
    if (!userId) {
      wx.showToast({
        title: '用户信息有误，请重新登录',
        icon: 'none'
      });
      this.setData({ isSubmitting: false });
      return;
    }
    
    // 创建请求数据
    const data = {
      userId: userId,
      moodScore: this.data.moodScore,
      content: this.data.content,
      // 直接发送数组，让后端处理JSON转换
      tags: this.data.tags
    };
    
    // 发送请求
    request.post('/emotion-diaries', data)
      .then(res => {
        if (res.success) {
          // 设置全局刷新标记
          app.globalData.shouldRefreshEmotionList = true;
          
          wx.showToast({
            title: '记录成功',
            icon: 'success'
          });
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      })
      .catch(err => {
        console.error('提交情绪日记失败', err);
        
        // 显示错误信息
        wx.showToast({
          title: err.message || '提交失败，请重试',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  }
}); 