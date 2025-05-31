const { pool } = require('../config/db');

// 获取所有心理测试
exports.getAllTests = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, title, description, created_at FROM psychological_tests ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取心理测试列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 根据ID获取特定心理测试
exports.getTestById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM psychological_tests WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '未找到该测试' });
    }
    
    // 解析JSON数据
    const test = rows[0];
    if (test.questions) {
      test.questions = JSON.parse(test.questions);
    }
    
    res.json({ success: true, data: test });
  } catch (error) {
    console.error('获取心理测试详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 提交测试结果并返回评估
exports.submitTestResult = async (req, res) => {
  const { id } = req.params;
  const { answers, userId } = req.body;
  
  if (!answers || !userId) {
    return res.status(400).json({ success: false, message: '答案和用户ID不能为空' });
  }
  
  try {
    // 获取测试数据
    const [testRows] = await pool.execute(
      'SELECT * FROM psychological_tests WHERE id = ?',
      [id]
    );
    
    if (testRows.length === 0) {
      return res.status(404).json({ success: false, message: '未找到该测试' });
    }
    
    const test = testRows[0];
    const resultExplanation = JSON.parse(test.result_explanation);
    
    // 计算测试结果（这里是简化逻辑，根据实际测试类型可以有不同的计算方法）
    let score = 0;
    const testQuestions = JSON.parse(test.questions);
    
    for (const questionId in answers) {
      const answer = answers[questionId];
      const question = testQuestions.find(q => q.id == questionId);
      
      if (question && question.scores && question.scores[answer]) {
        score += question.scores[answer];
      }
    }
    
    // 确定结果类型
    let resultType = '';
    for (const type in resultExplanation) {
      const range = resultExplanation[type].range;
      if (score >= range[0] && score <= range[1]) {
        resultType = type;
        break;
      }
    }
    
    // 存储测试结果（可选功能，需要额外的数据表）
    
    res.json({
      success: true,
      data: {
        score,
        resultType,
        explanation: resultExplanation[resultType] || '无法确定结果'
      }
    });
  } catch (error) {
    console.error('提交测试结果失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}; 