// 封装请求方法

// 检查是否为本地开发环境
const isDev = (baseUrl) => {
  return baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('192.168.');
};

// 基础请求方法
const request = (url, method, data, header = {}) => {
  return new Promise((resolve, reject) => {
    // 获取app实例
    const app = getApp();
    if (!app || !app.globalData) {
      reject({
        message: '应用尚未初始化完成',
        status: 0
      });
      showError('应用尚未初始化完成');
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    let isRequestComplete = false;
    
    // 确保hideLoading被调用
    const ensureHideLoading = () => {
      if (!isRequestComplete) {
        isRequestComplete = true;
        wx.hideLoading();
      }
    };
    
    // 5秒后如果请求还未完成，自动关闭loading
    setTimeout(ensureHideLoading, 5000);
    
    wx.request({
      url: `${app.globalData.baseUrl}${url}`,
      method,
      data,
      header: {
        'content-type': 'application/json',
        ...header
      },
      success: (res) => {
        ensureHideLoading();
        
        if (res.statusCode >= 200 && res.statusCode < 300 || res.statusCode === 304) {
          // 请求成功
          resolve(res.data);
        } else if (res.data && res.data.success) {
          // 有些API会在body中返回success字段
          resolve(res.data);
        } else {
          const errorMsg = {
            message: res.data.message || '请求失败',
            status: res.statusCode,
            details: res.data
          };
          console.error('请求失败:', errorMsg);
          reject(errorMsg);
          
          // 处理不同状态码的错误
          let errorText = '请求失败';
          if (res.statusCode === 401) {
            errorText = '登录失效，请重新登录';
            // 可以在这里处理登录失效逻辑，比如跳转到登录页面
            wx.navigateTo({
              url: '/pages/login/index'
            });
          } else if (res.statusCode === 403) {
            errorText = '没有权限执行此操作';
          } else if (res.statusCode === 404) {
            errorText = '请求的资源不存在';
          } else if (res.statusCode === 500) {
            errorText = '服务器错误，请稍后再试';
          }
          
          showError(res.data.message || errorText);
        }
      },
      fail: (err) => {
        ensureHideLoading();
        
        console.error('网络请求失败:', err);
        
        let errorMessage = '网络错误，请检查网络连接';
        
        // 针对本地开发环境的特殊处理
        if (isDev(app.globalData.baseUrl)) {
          if (err.errMsg && err.errMsg.includes('fail')) {
            errorMessage = '无法连接到本地服务器，请确保后端服务已启动';
            
            // 提示开发者操作建议
            wx.showModal({
              title: '本地开发提示',
              content: '无法连接到本地服务器，可能原因：\n1. 后端服务未启动\n2. 端口号配置错误\n3. 小程序开发工具未打开本地网络权限',
              showCancel: false,
              confirmText: '我知道了'
            });
          }
        }
        
        reject({
          message: errorMessage,
          status: 0,
          details: err
        });
        
        showError(errorMessage);
      }
    });
  });
};

// 显示错误提示
const showError = (message) => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};

// GET 请求
const get = (url, data = {}) => {
  return request(url, 'GET', data);
};

// POST 请求
const post = (url, data = {}) => {
  return request(url, 'POST', data);
};

// PUT 请求
const put = (url, data = {}) => {
  return request(url, 'PUT', data);
};

// DELETE 请求
const del = (url, data = {}) => {
  return request(url, 'DELETE', data);
};

module.exports = {
  get,
  post,
  put,
  delete: del
}; 