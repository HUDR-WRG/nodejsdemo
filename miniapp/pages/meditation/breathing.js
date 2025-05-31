// 获取应用实例
const app = getApp();

Page({
  data: {
    // 呼吸练习模式
    currentMode: 'relax', // 默认模式: relax, focus, sleep
    modeTitles: {
      relax: '放松呼吸',
      focus: '专注呼吸',
      sleep: '助眠呼吸'
    },
    modeInstructions: {
      relax: '4-7-8呼吸法是一种简单有效的放松技巧，通过调节呼吸来缓解压力和焦虑。吸气4秒，屏息7秒，呼气8秒，重复多次，帮助身心放松。',
      focus: '方块呼吸法（4-4-4-4）有助于提高专注力，稳定情绪。吸气4秒，屏息4秒，呼气4秒，屏息4秒，构成一个完整循环，有助于平静心神，提升注意力。',
      sleep: '助眠呼吸通过延长呼气时间，帮助身体进入放松状态，促进褪黑素释放。吸气4秒，屏息7秒，呼气8秒，能有效缓解失眠问题。'
    },
    
    // 呼吸练习状态
    isBreathing: false,
    animationState: 'reset', // reset, inhale, hold, exhale
    breathingText: '准备',
    guidanceText: '选择模式并开始',
    circleColor: '#6EB5FF',
    
    // 时间设置
    duration: 180, // 默认3分钟
    timeLeft: 0,
    timeLeftFormatted: '00:00',
    progressPercentage: 0,
    
    // 呼吸节奏配置
    breathPatterns: {
      relax: {
        inhale: 4,
        holdAfterInhale: 7,
        exhale: 8,
        holdAfterExhale: 0,
        colors: {
          inhale: '#6EB5FF',
          hold: '#53A3FF',
          exhale: '#FF8F8F'
        }
      },
      focus: {
        inhale: 4,
        holdAfterInhale: 4,
        exhale: 4,
        holdAfterExhale: 4,
        colors: {
          inhale: '#6EB5FF',
          hold: '#53A3FF',
          exhale: '#FF8F8F'
        }
      },
      sleep: {
        inhale: 4,
        holdAfterInhale: 7,
        exhale: 8,
        holdAfterExhale: 0,
        colors: {
          inhale: '#6EB5FF',
          hold: '#53A3FF',
          exhale: '#FF8F8F'
        }
      }
    },
    
    // 计时器
    breathTimer: null,
    countdownTimer: null
  },

  onLoad: function () {
    // 初始化页面
  },
  
  onUnload: function() {
    // 清除所有计时器
    this.stopAllTimers();
  },
  
  // 切换呼吸模式
  switchMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    
    if (this.data.isBreathing) {
      wx.showToast({
        title: '请先结束当前练习',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ currentMode: mode });
  },
  
  // 设置练习时长
  setDuration: function(e) {
    const duration = parseInt(e.currentTarget.dataset.duration);
    
    if (this.data.isBreathing) {
      wx.showToast({
        title: '请先结束当前练习',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ duration });
  },
  
  // 开始/结束呼吸练习
  toggleBreathing: function() {
    const { isBreathing } = this.data;
    
    if (isBreathing) {
      this.stopBreathingPractice();
    } else {
      this.startBreathingPractice();
    }
  },
  
  // 开始呼吸练习
  startBreathingPractice: function() {
    // 初始化计时器和状态
    this.setData({
      isBreathing: true,
      timeLeft: this.data.duration,
      timeLeftFormatted: this.formatTime(this.data.duration),
      progressPercentage: 100
    });
    
    // 开始倒计时
    this.startCountdown();
    
    // 开始呼吸动画
    this.startBreathingAnimation();
    
    // 播放背景音效（可选）
    // this.playBackgroundSound();
  },
  
  // 结束呼吸练习
  stopBreathingPractice: function() {
    // 停止所有计时器
    this.stopAllTimers();
    
    // 重置状态
    this.setData({
      isBreathing: false,
      animationState: 'reset',
      breathingText: '准备',
      guidanceText: '选择模式并开始',
      circleColor: '#6EB5FF'
    });
    
    // 停止背景音效（可选）
    // this.stopBackgroundSound();
  },
  
  // 开始倒计时
  startCountdown: function() {
    const { duration } = this.data;
    let timeLeft = duration;
    
    this.setData({
      timeLeft: timeLeft,
      timeLeftFormatted: this.formatTime(timeLeft)
    });
    
    this.data.countdownTimer = setInterval(() => {
      timeLeft -= 1;
      
      if (timeLeft <= 0) {
        this.stopBreathingPractice();
        wx.showToast({
          title: '练习完成',
          icon: 'success'
        });
        return;
      }
      
      const progressPercentage = (timeLeft / duration) * 100;
      
      this.setData({
        timeLeft: timeLeft,
        timeLeftFormatted: this.formatTime(timeLeft),
        progressPercentage
      });
    }, 1000);
  },
  
  // 开始呼吸动画
  startBreathingAnimation: function() {
    const { currentMode, breathPatterns } = this.data;
    const pattern = breathPatterns[currentMode];
    
    // 呼吸循环
    const breathCycle = () => {
      // 吸气阶段
      this.setData({
        animationState: 'inhale',
        breathingText: '吸气',
        guidanceText: '缓慢吸气，感受空气进入肺部',
        circleColor: pattern.colors.inhale
      });
      
      // 吸气后屏息
      setTimeout(() => {
        if (!this.data.isBreathing) return;
        
        this.setData({
          animationState: 'hold',
          breathingText: '屏息',
          guidanceText: '保持呼吸，感受内心平静',
          circleColor: pattern.colors.hold
        });
        
        // 呼气阶段
        setTimeout(() => {
          if (!this.data.isBreathing) return;
          
          this.setData({
            animationState: 'exhale',
            breathingText: '呼气',
            guidanceText: '缓慢呼气，释放所有紧张',
            circleColor: pattern.colors.exhale
          });
          
          // 呼气后屏息（如果需要）
          setTimeout(() => {
            if (!this.data.isBreathing) return;
            
            if (pattern.holdAfterExhale > 0) {
              this.setData({
                animationState: 'reset',
                breathingText: '屏息',
                guidanceText: '保持平静，准备下一次呼吸',
                circleColor: pattern.colors.hold
              });
              
              setTimeout(() => {
                if (!this.data.isBreathing) return;
                breathCycle();
              }, pattern.holdAfterExhale * 1000);
            } else {
              breathCycle();
            }
          }, pattern.exhale * 1000);
        }, pattern.holdAfterInhale * 1000);
      }, pattern.inhale * 1000);
    };
    
    // 开始第一个呼吸循环
    breathCycle();
  },
  
  // 停止所有计时器
  stopAllTimers: function() {
    if (this.data.breathTimer) {
      clearTimeout(this.data.breathTimer);
    }
    
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  },
  
  // 格式化时间（秒 -> 分:秒）
  formatTime: function(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  },
  
  // 返回上一页
  goBack: function() {
    if (this.data.isBreathing) {
      wx.showModal({
        title: '提示',
        content: '正在进行呼吸练习，确定要退出吗？',
        success: (res) => {
          if (res.confirm) {
            this.stopBreathingPractice();
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  }
}) 