// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    treeHole: null,
    comments: [],
    commentContent: '',
    isLoading: false,
    isAnonymous: false
  },

  onLoad: function (options) {
    const { id } = options;
    if (id) {
      this.treeHoleId = id;
      this.loadTreeHoleDetail(id);
      this.loadComments(id);
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

  // 加载树洞详情
  loadTreeHoleDetail: function (id) {
    this.setData({ isLoading: true });
    
    request.get(`/treeholes/${id}`)
      .then(res => {
        if (res.success) {
          // 处理日期格式
          const treeHole = res.data;
          treeHole.created_at = this.formatDate(new Date(treeHole.created_at));
          
          this.setData({
            treeHole: treeHole,
            isLoading: false
          });
        }
      })
      .catch(err => {
        console.error('获取树洞详情失败', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '获取详情失败',
          icon: 'none'
        });
      });
  },

  // 加载评论
  loadComments: function (id) {
    this.setData({ isLoading: true });
    
    request.get(`/treeholes/${id}/comments`)
      .then(res => {
        if (res.success) {
          // 格式化日期
          const comments = res.data.map(comment => {
            comment.created_at = this.formatDate(new Date(comment.created_at));
            return comment;
          });
          
          this.setData({
            comments: comments,
            isLoading: false
          });
        }
      })
      .catch(err => {
        console.error('获取评论失败', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '获取评论失败',
          icon: 'none'
        });
      });
  },

  // 输入内容变化
  inputChange: function (e) {
    this.setData({
      commentContent: e.detail.value
    });
  },
  
  // 切换匿名状态
  toggleAnonymous: function () {
    this.setData({
      isAnonymous: !this.data.isAnonymous
    });
  },

  // 提交评论
  submitComment: function () {
    const { commentContent, isAnonymous } = this.data;
    
    if (!commentContent.trim()) {
      wx.showToast({
        title: '评论内容不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '发送中...',
      mask: true
    });
    
    // 使用nickname字段作为用户ID
    const userId = app.globalData.userInfo && app.globalData.userInfo.nickname ? 
                   app.globalData.userInfo.nickname : '匿名用户';
    
    request.post(`/treeholes/${this.treeHoleId}/comments`, {
      content: commentContent,
      userId: userId,
      isAnonymous: isAnonymous
    })
      .then(res => {
        wx.hideLoading();
        if (res.success) {
          wx.showToast({
            title: '评论成功',
            icon: 'success'
          });
          
          // 清空输入框
          this.setData({
            commentContent: ''
          });
          
          // 重新加载评论列表
          this.loadComments(this.treeHoleId);
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('评论失败', err);
        wx.showToast({
          title: '评论失败，请重试',
          icon: 'none'
        });
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
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
  }
}); 