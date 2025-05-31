// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    meditations: [],
    categories: [],
    currentCategory: '',
    isLoading: false
  },

  onLoad: function () {
    this.loadCategories();
    this.loadMeditations();
  },

  onPullDownRefresh: function () {
    this.loadCategories();
    this.loadMeditations().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载冥想资源分类
  loadCategories: function () {
    request.get('/meditations/categories')
      .then(res => {
        if (res.success) {
          this.setData({ categories: res.data || [] });
        }
      })
      .catch(err => {
        console.error('获取冥想分类失败', err);
      });
  },

  // 加载冥想资源
  loadMeditations: function () {
    const { currentCategory } = this.data;
    let params = {};
    
    if (currentCategory) {
      params.category = currentCategory;
    }
    
    this.setData({ isLoading: true });
    
    return request.get('/meditations', params)
      .then(res => {
        if (res.success) {
          this.setData({
            meditations: res.data || [],
            isLoading: false
          });
        }
      })
      .catch(err => {
        console.error('获取冥想资源失败', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '获取冥想资源失败',
          icon: 'none'
        });
      });
  },

  // 切换分类
  switchCategory: function (e) {
    const category = e.currentTarget.dataset.category;
    
    if (category === this.data.currentCategory) return;
    
    this.setData({ currentCategory: category }, () => {
      this.loadMeditations();
    });
  },

  // 播放冥想音频
  playMeditation: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `./player?id=${id}`
    });
  },
  
  // 跳转到呼吸练习页面
  goToBreathing: function() {
    wx.navigateTo({
      url: './breathing'
    });
  },
  
  // 即将推出功能提示
  comingSoon: function() {
    wx.showToast({
      title: '功能即将推出',
      icon: 'none'
    });
  }
});