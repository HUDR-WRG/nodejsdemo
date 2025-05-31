const app = getApp();
const { questions, resultAnalysis } = require('./questions');

Page({
  data: {
    questions: questions,
    currentQuestionIndex: 0,
    answers: [],
    showResult: false,
    score: 0,
    result: null
  },

  onLoad: function () {
    const answers = new Array(questions.length).fill(null);
    this.setData({ answers });
  },

  selectAnswer: function (e) {
    const { value } = e.currentTarget.dataset;
    const { currentQuestionIndex, answers } = this.data;
    
    answers[currentQuestionIndex] = parseInt(value);
    this.setData({ answers });

    if (currentQuestionIndex < questions.length - 1) {
      this.setData({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  prevQuestion: function () {
    if (this.data.currentQuestionIndex > 0) {
      this.setData({ currentQuestionIndex: this.data.currentQuestionIndex - 1 });
    }
  },

  nextQuestion: function () {
    if (this.data.currentQuestionIndex < questions.length - 1) {
      this.setData({ currentQuestionIndex: this.data.currentQuestionIndex + 1 });
    }
  },

  submitTest: function () {
    const { answers } = this.data;
    
    if (answers.includes(null)) {
      wx.showToast({ title: '请回答所有问题', icon: 'none' });
      return;
    }

    const totalScore = answers.reduce((sum, value) => sum + value, 0);
    const maxScore = questions.length * 5;
    const score = Math.round((totalScore / maxScore) * 100);
    const result = resultAnalysis.ranges.find(range => score >= range.min && score <= range.max);

    // 存储记录
    const newRecord = {
      score: score,
      title: result.title,
      date: new Date().toLocaleString()
    };
    const records = wx.getStorageSync('testRecords') || [];
    records.unshift(newRecord);
    wx.setStorageSync('testRecords', records.slice(0, 50));

    this.setData({ score, result, showResult: true });
  },

  restartTest: function () {
    const answers = new Array(questions.length).fill(null);
    this.setData({ currentQuestionIndex: 0, answers, showResult: false, score: 0, result: null });
  },

  navToHistory: function() {
    wx.navigateTo({ url: '/pages/history/history' });
  }
});