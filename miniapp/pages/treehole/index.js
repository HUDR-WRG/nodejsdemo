// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    treeHoles: [],
    isLoading: false,
    showModal: false,
    inputContent: '',
    isAnonymous: true,
    page: 1,
    hasMore: true
  },

  onLoad: function () {
    this.loadTreeHoles();
  },

  onPullDownRefresh: function () {
    this.setData({
      treeHoles: [],
      page: 1,
      hasMore: true
    });
    this.loadTreeHoles().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadMoreTreeHoles();
    }
  },

  // 加载树洞列表
  loadTreeHoles: function () {
    this.setData({ isLoading: true });
    
    return request.get('/treeholes', { page: 1 })
      .then(res => {
        if (res.success) {
          // 处理日期格式并确保每个项目有唯一id
          const treeHoles = res.data.map(item => {
            if (!item.id) item.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            item.created_at = this.formatDate(new Date(item.created_at));
            return item;
          });
          
          this.setData({
            treeHoles: treeHoles,
            isLoading: false,
            hasMore: treeHoles.length >= 10,
            page: 1
          });
        }
      })
      .catch(err => {
        console.error('获取树洞列表失败', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '获取树洞列表失败',
          icon: 'none'
        });
      });
  },

  // 加载更多树洞
  loadMoreTreeHoles: function () {
    if (!this.data.hasMore || this.data.isLoading) return;
    
    const nextPage = this.data.page + 1;
    this.setData({ isLoading: true });
    
    request.get('/treeholes', { page: nextPage })
      .then(res => {
        if (res.success) {
          // 处理日期格式并确保每个项目有唯一id
          const newTreeHoles = res.data.map(item => {
            if (!item.id) item.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            item.created_at = this.formatDate(new Date(item.created_at));
            return item;
          });
          
          // 检查是否有重复数据
          const existingIds = new Set(this.data.treeHoles.map(item => item.id));
          const uniqueNewTreeHoles = newTreeHoles.filter(item => !existingIds.has(item.id));
          
          if (uniqueNewTreeHoles.length === 0) {
            this.setData({
              isLoading: false,
              hasMore: false
            });
            return;
          }
          
          this.setData({
            treeHoles: [...this.data.treeHoles, ...uniqueNewTreeHoles],
            page: nextPage,
            isLoading: false,
            hasMore: newTreeHoles.length >= 10
          });
        } else {
          this.setData({
            isLoading: false,
            hasMore: false
          });
        }
      })
      .catch(err => {
        console.error('加载更多树洞失败', err);
        this.setData({ 
          isLoading: false,
          hasMore: false
        });
      });
  },

  // 显示发布弹窗
  showPostModal: function () {
    // 检查用户是否登录
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showModal: true,
      inputContent: '',
      isAnonymous: true
    });
  },

  // 隐藏弹窗
  hideModal: function () {
    this.setData({
      showModal: false
    });
  },

  // 防止滑动穿透
  preventTouchMove: function () {
    return;
  },

  // 输入内容变化
  inputChange: function (e) {
    this.setData({
      inputContent: e.detail.value
    });
  },

  // 切换匿名状态
  toggleAnonymous: function () {
    this.setData({
      isAnonymous: !this.data.isAnonymous
    });
  },

  // 提交发布
  submitPost: function () {
    const { inputContent, isAnonymous } = this.data;
    
    if (!inputContent.trim()) {
      wx.showToast({
        title: '内容不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 检查用户是否登录
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '发布中...',
      mask: true
    });
    
    // 使用nickname字段作为用户ID
    const userId = app.globalData.userInfo && app.globalData.userInfo.nickname ? 
                   app.globalData.userInfo.nickname : '匿名用户';
    
    request.post('/treeholes', {
      content: inputContent,
      userId: userId,
      isAnonymous: isAnonymous
    })
      .then(res => {
        wx.hideLoading();
        if (res.success) {
          this.hideModal();
          wx.showToast({
            title: '发布成功',
            icon: 'success'
          });
          
          // 重新加载树洞列表
          setTimeout(() => {
            this.setData({
              treeHoles: [],
              page: 1
            });
            this.loadTreeHoles();
          }, 500);
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('发布树洞失败', err);
        wx.showToast({
          title: '发布失败，请重试',
          icon: 'none'
        });
      });
  },

  // 查看详情
  viewDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/treehole/detail?id=${id}`
    });
  },

  // 格式化日期
  formatDate: function (date) {
    const now = new Date();
    const diff = now - date; // 毫秒差
    
    // 今天内
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      return `今天 ${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`;
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      return `昨天 ${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`;
    }
    
    // 一周内
    if (diff < 604800000) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days[date.getDay()];
    }
    
    // 更早
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
}); 