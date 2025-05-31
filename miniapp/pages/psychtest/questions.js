// 心理测试问题数据
const questions = [
  {
    id: 1,
    question: '我经常感到焦虑和紧张',
    options: [
      { value: 5, text: '从不' },
      { value: 4, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 2, text: '经常' },
      { value: 1, text: '总是' }
    ]
  },
  {
    id: 2,
    question: '我能很好地控制自己的情绪',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 3,
    question: '我感到生活充满希望',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 4,
    question: '我容易感到疲惫',
    options: [
      { value: 5, text: '从不' },
      { value: 4, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 2, text: '经常' },
      { value: 1, text: '总是' }
    ]
  },
  {
    id: 5,
    question: '我能很好地处理压力',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 6,
    question: '我感到孤独',
    options: [
      { value: 5, text: '从不' },
      { value: 4, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 2, text: '经常' },
      { value: 1, text: '总是' }
    ]
  },
  {
    id: 7,
    question: '我对未来充满信心',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 8,
    question: '我容易感到烦躁',
    options: [
      { value: 5, text: '从不' },
      { value: 4, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 2, text: '经常' },
      { value: 1, text: '总是' }
    ]
  },
  {
    id: 9,
    question: '我能很好地与他人沟通',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 10,
    question: '我感到生活有意义',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 11,
    question: '我容易感到紧张',
    options: [
      { value: 5, text: '从不' },
      { value: 4, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 2, text: '经常' },
      { value: 1, text: '总是' }
    ]
  },
  {
    id: 12,
    question: '我能很好地处理人际关系',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 13,
    question: '我感到生活充满乐趣',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 14,
    question: '我容易感到沮丧',
    options: [
      { value: 5, text: '从不' },
      { value: 4, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 2, text: '经常' },
      { value: 1, text: '总是' }
    ]
  },
  {
    id: 15,
    question: '我能很好地调节自己的情绪',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 16,
    question: '我感到生活有目标',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 17,
    question: '我容易感到不安',
    options: [
      { value: 5, text: '从不' },
      { value: 4, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 2, text: '经常' },
      { value: 1, text: '总是' }
    ]
  },
  {
    id: 18,
    question: '我能很好地处理压力',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 19,
    question: '我感到生活充满希望',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  },
  {
    id: 20,
    question: '我能很好地处理生活中的困难',
    options: [
      { value: 1, text: '从不' },
      { value: 2, text: '偶尔' },
      { value: 3, text: '有时' },
      { value: 4, text: '经常' },
      { value: 5, text: '总是' }
    ]
  }
];

// 测试结果分析
const resultAnalysis = {
  // 分数范围对应的分析
  ranges: [
    {
      min: 0,
      max: 40,
      title: '需要关注',
      description: '您的心理健康状况需要关注。建议您多关注自己的情绪变化，适当放松心情，必要时寻求专业帮助。'
    },
    {
      min: 41,
      max: 60,
      title: '一般',
      description: '您的心理健康状况一般。建议您多进行放松活动，保持积极乐观的心态。'
    },
    {
      min: 61,
      max: 80,
      title: '良好',
      description: '您的心理健康状况良好。继续保持积极乐观的生活态度，适当进行放松活动。'
    },
    {
      min: 81,
      max: 100,
      title: '优秀',
      description: '您的心理健康状况优秀。您有很好的心理调节能力，继续保持这种积极的生活态度。'
    }
  ]
};

module.exports = {
  questions,
  resultAnalysis
}; 