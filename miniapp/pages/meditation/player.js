// 获取应用实例
const app = getApp();
const request = require('../../utils/request');

// 全局音频上下文，确保整个应用只有一个音频实例
let globalAudioContext = null;

Page({
  data: {
    meditationData: {}, // 冥想资源数据
    audioContext: null, // 音频上下文
    isPlaying: false,   // 是否正在播放
    duration: 0,        // 音频总时长（秒）
    currentTime: 0,     // 当前播放位置（秒）
    durationFormat: '00:00', // 格式化后的总时长
    currentTimeFormat: '00:00', // 格式化后的当前时间
    id: null,           // 当前播放的冥想资源ID
    playbackRate: 1.0,  // 播放速率
    isLooping: false    // 是否循环播放
  },

  onLoad: function (options) {
    const { id } = options;
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({ id });

    // 确保在创建新的音频上下文前停止现有的音频播放
    this.stopAllAudio();
    
    // 创建音频上下文
    this.createAudioContext();
    
    // 加载冥想资源详情
    this.loadMeditationDetail(id);
  },
  
  onShow: function() {
    // 页面显示时，确保数据和UI状态一致
    const { audioContext, isPlaying } = this.data;
    if (audioContext && !isPlaying && audioContext.paused === false) {
      // 如果音频正在播放但UI状态不是播放中，则更新UI
      this.setData({ isPlaying: true });
    }
  },
  
  onHide: function() {
    // 可选：页面隐藏时暂停播放
    // 如果希望后台继续播放，则注释掉这段代码
    /*
    const { audioContext, isPlaying } = this.data;
    if (audioContext && isPlaying) {
      audioContext.pause();
      this.setData({ isPlaying: false });
    }
    */
  },
  
  onUnload: function() {
    // 页面卸载时停止播放并释放资源
    this.stopAllAudio();
  },
  
  // 停止所有音频并释放资源
  stopAllAudio: function() {
    // 停止当前页面的音频上下文
    if (this.data.audioContext) {
      this.data.audioContext.stop();
      this.data.audioContext.offTimeUpdate();
      this.data.audioContext.offEnded();
      this.data.audioContext.offError();
      this.data.audioContext.destroy();
      this.setData({ 
        audioContext: null,
        isPlaying: false
      });
    }
    
    // 停止全局音频上下文（如果存在）
    if (globalAudioContext) {
      globalAudioContext.stop();
      globalAudioContext.offTimeUpdate();
      globalAudioContext.offEnded();
      globalAudioContext.offError();
      globalAudioContext.destroy();
      globalAudioContext = null;
    }
    
    // 停止后台音频（兼容性处理）
    if (wx.getBackgroundAudioManager) {
      const bgAudio = wx.getBackgroundAudioManager();
      bgAudio.stop();
    }
  },
  
  // 加载冥想资源详情
  loadMeditationDetail: function(id) {
    wx.showLoading({
      title: '加载中...',
    });
    
    request.get(`/meditations/${id}`)
      .then(res => {
        wx.hideLoading();
        if (res.success) {
          // 如果服务器返回的数据中没有播放次数，则添加默认值
          if (!res.data.play_count) {
            res.data.play_count = Math.floor(Math.random() * 1000) + 100; // 随机播放次数
          }
          
          this.setData({ meditationData: res.data });
          
          // 设置音频源
          if (this.data.audioContext && res.data.audio_url) {
            this.data.audioContext.src = res.data.audio_url;
            
            // 监听 onCanplay 事件，避免自动播放策略阻止播放
            this.data.audioContext.onCanplay(() => {
              // 延迟执行自动播放，确保UI已准备就绪
              setTimeout(() => {
                this.startAutoPlay();
              }, 300);
            });
          }
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('获取冥想资源详情失败', err);
        wx.showToast({
          title: '获取资源失败',
          icon: 'none'
        });
      });
  },
  
  // 创建音频上下文
  createAudioContext: function() {
    // 确保先销毁现有音频上下文
    this.stopAllAudio();
    
    // 创建新的音频上下文
    const audioContext = wx.createInnerAudioContext();
    
    // 设置音频属性
    audioContext.obeyMuteSwitch = false; // 忽略系统静音开关
    audioContext.autoplay = false; // 禁止自动播放，由代码控制
    
    audioContext.onTimeUpdate(() => {
      this.setData({
        currentTime: audioContext.currentTime,
        currentTimeFormat: this.formatTime(audioContext.currentTime),
        duration: audioContext.duration,
        durationFormat: this.formatTime(audioContext.duration)
      });
    });
    
    audioContext.onEnded(() => {
      // 处理循环播放
      if (this.data.isLooping) {
        audioContext.seek(0);
        audioContext.play();
      } else {
        this.setData({ isPlaying: false });
      }
    });
    
    audioContext.onError((res) => {
      console.error('音频播放错误', res);
      wx.showToast({
        title: '音频播放失败',
        icon: 'none'
      });
      this.setData({ isPlaying: false });
    });
    
    // 保存音频上下文到数据和全局变量
    this.setData({ audioContext });
    globalAudioContext = audioContext;
  },
  
  // 自动播放（加载完成后）
  startAutoPlay: function() {
    if (!this.data.isPlaying) {
      this.togglePlay();
    }
  },
  
  // 切换播放/暂停
  togglePlay: function() {
    const { audioContext, isPlaying } = this.data;
    
    if (!audioContext) return;
    
    if (isPlaying) {
      audioContext.pause();
    } else {
      // 确保在播放前停止其他可能的音频
      wx.stopBackgroundAudio && wx.stopBackgroundAudio();
      
      // 开始播放
      audioContext.play();
    }
    
    this.setData({ isPlaying: !isPlaying });
  },
  
  // 快退15秒
  rewind15: function() {
    const { audioContext, currentTime } = this.data;
    if (!audioContext) return;
    
    const newTime = Math.max(0, currentTime - 15);
    audioContext.seek(newTime);
  },
  
  // 快进15秒
  forward15: function() {
    const { audioContext, currentTime, duration } = this.data;
    if (!audioContext) return;
    
    const newTime = Math.min(duration, currentTime + 15);
    audioContext.seek(newTime);
  },
  
  // 进度条拖动事件
  onSliderChange: function(e) {
    const { audioContext } = this.data;
    if (!audioContext) return;
    
    const newTime = e.detail.value;
    audioContext.seek(newTime);
  },
  
  // 设置播放速率
  setPlaybackRate: function(e) {
    const { audioContext } = this.data;
    if (!audioContext) return;
    
    const rate = parseFloat(e.currentTarget.dataset.rate);
    
    if (audioContext.playbackRate) {
      audioContext.playbackRate = rate;
    }
    
    this.setData({ playbackRate: rate });
    
    wx.showToast({
      title: `速度 ${rate}x`,
      icon: 'none'
    });
  },
  
  // 切换循环播放
  toggleLoop: function() {
    const { isLooping } = this.data;
    
    this.setData({ isLooping: !isLooping });
    
    wx.showToast({
      title: !isLooping ? '已开启循环' : '已关闭循环',
      icon: 'none'
    });
  },
  
  // 返回上一页
  goBack: function() {
    // 确保在返回时停止播放
    this.stopAllAudio();
    wx.navigateBack();
  },
  
  // 格式化时间（秒 -> 分:秒）
  formatTime: function(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
}) 