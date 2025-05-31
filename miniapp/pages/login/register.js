// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    isLoading: false,
    // 表单验证状态
    validation: {
      username: { valid: true, message: '' },
      password: { valid: true, message: '' },
      confirmPassword: { valid: true, message: '' }
    }
  },

  onLoad: function (options) {
    // 页面加载完成后的初始化
    this.initPage();
  },

  onShow: function () {
    // 页面显示时重置表单
    this.resetForm();
  },

  // 初始化页面
  initPage: function () {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '注册账号'
    });
  },

  // 重置表单
  resetForm: function () {
    this.setData({
      username: '',
      password: '',
      confirmPassword: '',
      isLoading: false,
      validation: {
        username: { valid: true, message: '' },
        password: { valid: true, message: '' },
        confirmPassword: { valid: true, message: '' }
      }
    });
  },

  // 监听用户名输入
  onUsernameInput: function (e) {
    const username = e.detail.value;
    this.setData({
      username: username
    });
    // 实时验证用户名
    this.validateUsername(username);
  },

  // 监听密码输入
  onPasswordInput: function (e) {
    const password = e.detail.value;
    this.setData({
      password: password
    });
    // 实时验证密码
    this.validatePassword(password);
    // 如果确认密码已输入，也需要重新验证
    if (this.data.confirmPassword) {
      this.validateConfirmPassword(this.data.confirmPassword);
    }
  },

  // 监听确认密码输入
  onConfirmPasswordInput: function (e) {
    const confirmPassword = e.detail.value;
    this.setData({
      confirmPassword: confirmPassword
    });
    // 实时验证确认密码
    this.validateConfirmPassword(confirmPassword);
  },

  // 验证用户名
  validateUsername: function (username) {
    let validation = this.data.validation;
    
    if (!username || username.trim().length === 0) {
      validation.username = { valid: false, message: '请输入用户名' };
    } else if (username.length < 3) {
      validation.username = { valid: false, message: '用户名至少3个字符' };
    } else if (username.length > 20) {
      validation.username = { valid: false, message: '用户名不能超过20个字符' };
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      validation.username = { valid: false, message: '用户名只能包含字母、数字、下划线和中文' };
    } else {
      validation.username = { valid: true, message: '' };
    }
    
    this.setData({ validation });
    return validation.username.valid;
  },

  // 验证密码
  validatePassword: function (password) {
    let validation = this.data.validation;
    
    if (!password || password.length === 0) {
      validation.password = { valid: false, message: '请输入密码' };
    } else if (password.length < 6) {
      validation.password = { valid: false, message: '密码至少6位' };
    } else if (password.length > 20) {
      validation.password = { valid: false, message: '密码不能超过20位' };
    } else {
      validation.password = { valid: true, message: '' };
    }
    
    this.setData({ validation });
    return validation.password.valid;
  },

  // 验证确认密码
  validateConfirmPassword: function (confirmPassword) {
    let validation = this.data.validation;
    
    if (!confirmPassword || confirmPassword.length === 0) {
      validation.confirmPassword = { valid: false, message: '请确认密码' };
    } else if (confirmPassword !== this.data.password) {
      validation.confirmPassword = { valid: false, message: '两次输入的密码不一致' };
    } else {
      validation.confirmPassword = { valid: true, message: '' };
    }
    
    this.setData({ validation });
    return validation.confirmPassword.valid;
  },

  // 验证整个表单
  validateForm: function () {
    const { username, password, confirmPassword } = this.data;
    
    const usernameValid = this.validateUsername(username);
    const passwordValid = this.validatePassword(password);
    const confirmPasswordValid = this.validateConfirmPassword(confirmPassword);
    
    return usernameValid && passwordValid && confirmPasswordValid;
  },

  // 注册
  register: function () {
    if (this.data.isLoading) return;
    
    // 验证表单
    if (!this.validateForm()) {
      const validation = this.data.validation;
      let errorMessage = '';
      
      if (!validation.username.valid) {
        errorMessage = validation.username.message;
      } else if (!validation.password.valid) {
        errorMessage = validation.password.message;
      } else if (!validation.confirmPassword.valid) {
        errorMessage = validation.confirmPassword.message;
      }
      
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ isLoading: true });

    const { username, password } = this.data;

    // 调用后端注册接口
    request.post('/user/register', { 
      username: username.trim(), 
      password: password 
    })
      .then(res => {
        if (res.success) {
          wx.showToast({
            title: '注册成功',
            icon: 'success',
            duration: 2000
          });
          
          // 延迟返回，让用户看到成功提示
          setTimeout(() => {
            wx.navigateBack({
              success: () => {
                // 可以通过事件或者全局变量通知登录页面
                const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
                if (eventChannel) {
                  eventChannel.emit('registerSuccess', { username: username.trim() });
                }
              }
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.message || '注册失败，请重试',
            icon: 'none',
            duration: 3000
          });
        }
      })
      .catch(err => {
        console.error('注册失败', err);
        
        let errorMessage = '网络连接失败，请检查网络后重试';
        if (err && err.message) {
          if (err.message.includes('用户名已存在')) {
            errorMessage = '用户名已存在，请换一个试试';
          } else if (err.message.includes('密码')) {
            errorMessage = '密码格式不正确';
          } else {
            errorMessage = err.message;
          }
        }
        
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        });
      })
      .finally(() => {
        this.setData({ isLoading: false });
      });
  },

  // 返回登录页
  goBack: function () {
    wx.navigateBack({
      fail: () => {
        // 如果没有上一页，则跳转到登录页
        wx.redirectTo({
          url: '/pages/login/index'
        });
      }
    });
  }
}); 