const { pool } = require('../config/db');

// 获取用户的情绪日记列表
exports.getDiaries = async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: '用户ID不能为空' });
  }
  
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM emotion_diaries WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    // 解析JSON数据
    const diaries = rows.map(diary => {
      if (diary.tags) {
        try {
          // 如果已经是数组，直接使用
          if (Array.isArray(diary.tags)) {
            // 已经是数组，无需解析
          } else if (typeof diary.tags === 'string') {
            // 尝试解析JSON字符串
            diary.tags = JSON.parse(diary.tags);
          }
        } catch (error) {
          console.error('解析情绪标签JSON失败:', error, '原始数据:', diary.tags);
          // 如果解析失败，设置为空数组
          diary.tags = [];
        }
      } else {
        diary.tags = [];
      }
      return diary;
    });
    
    res.json({ success: true, data: diaries });
  } catch (error) {
    console.error('获取情绪日记失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 创建新的情绪日记
exports.createDiary = async (req, res) => {
  const { userId, moodScore, content, tags = [] } = req.body;
  
  if (!userId || moodScore === undefined) {
    return res.status(400).json({ success: false, message: '用户ID和情绪评分不能为空' });
  }
  
  try {
    // 检查今天是否已经记录过心情
    const [existingDiary] = await pool.execute(
      'SELECT * FROM emotion_diaries WHERE user_id = ? AND DATE(created_at) = CURDATE()',
      [userId]
    );
    
    if (existingDiary.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '今天已经记录过心情了，明天再来吧',
        code: 'ALREADY_RECORDED_TODAY'
      });
    }
    
    // 确保tags是数组
    const tagsArray = Array.isArray(tags) ? tags : (typeof tags === 'string' ? [tags] : []);
    
    const [result] = await pool.execute(
      'INSERT INTO emotion_diaries (user_id, mood_score, content, tags) VALUES (?, ?, ?, ?)',
      [userId, moodScore, content || '', JSON.stringify(tagsArray)]
    );
    
    res.status(201).json({
      success: true,
      message: '情绪日记创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建情绪日记失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 根据ID获取特定情绪日记
exports.getDiaryById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM emotion_diaries WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '未找到该日记' });
    }
    
    // 解析JSON数据
    const diary = rows[0];
    if (diary.tags) {
      try {
        // 如果已经是数组，直接使用
        if (Array.isArray(diary.tags)) {
          // 已经是数组，无需解析
        } else if (typeof diary.tags === 'string') {
          // 尝试解析JSON字符串
          diary.tags = JSON.parse(diary.tags);
        }
      } catch (error) {
        console.error('解析情绪标签JSON失败:', error, '原始数据:', diary.tags);
        // 如果解析失败，设置为空数组
        diary.tags = [];
      }
    } else {
      diary.tags = [];
    }
    
    res.json({ success: true, data: diary });
  } catch (error) {
    console.error('获取情绪日记详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取情绪统计数据
exports.getEmotionStats = async (req, res) => {
  const { userId, timeRange = 'month' } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: '用户ID不能为空' });
  }
  
  try {
    let dateCondition = '';
    
    // 根据时间范围设置SQL条件
    if (timeRange === 'week') {
      dateCondition = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (timeRange === 'month') {
      dateCondition = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (timeRange === 'year') {
      dateCondition = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    }
    
    // 查询情绪评分统计
    const [rows] = await pool.execute(
      `SELECT 
        DATE(created_at) as date,
        AVG(mood_score) as average_mood
       FROM emotion_diaries 
       WHERE user_id = ? ${dateCondition}
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId]
    );
    
    // 查询情绪标签使用频率
    const [tagStats] = await pool.execute(
      `SELECT tags FROM emotion_diaries WHERE user_id = ? ${dateCondition}`,
      [userId]
    );
    
    // 统计标签使用频率
    const tagCounts = {};
    tagStats.forEach(entry => {
      if (entry.tags) {
        try {
          let tags;
          // 如果已经是数组，直接使用
          if (Array.isArray(entry.tags)) {
            tags = entry.tags;
          } else if (typeof entry.tags === 'string') {
            // 尝试解析JSON字符串
            tags = JSON.parse(entry.tags);
          } else {
            // 其他类型，跳过
            return;
          }
          
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        } catch (error) {
          console.error('解析情绪标签JSON失败:', error, '原始数据:', entry.tags);
          // 继续处理下一条记录，不中断循环
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        moodTrend: rows,
        tagStats: Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }))
      }
    });
  } catch (error) {
    console.error('获取情绪统计数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 删除情绪日记
exports.deleteDiary = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  
  if (!id || !userId) {
    return res.status(400).json({ success: false, message: 'ID和用户ID不能为空' });
  }
  
  try {
    // 先检查日记是否存在以及是否属于该用户
    const [diary] = await pool.execute(
      'SELECT * FROM emotion_diaries WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (diary.length === 0) {
      return res.status(404).json({ success: false, message: '未找到该日记或无权限删除' });
    }
    
    // 删除日记
    await pool.execute(
      'DELETE FROM emotion_diaries WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json({ success: true, message: '日记已成功删除' });
  } catch (error) {
    console.error('删除情绪日记失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 检查今天是否已经记录过心情
exports.checkTodayRecord = async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: '用户ID不能为空' });
  }
  
  try {
    const [existingDiary] = await pool.execute(
      'SELECT id, mood_score, created_at FROM emotion_diaries WHERE user_id = ? AND DATE(created_at) = CURDATE()',
      [userId]
    );
    
    if (existingDiary.length > 0) {
      res.json({ 
        success: true, 
        hasRecorded: true,
        message: '今天已经记录过心情了，明天再来吧',
        data: {
          id: existingDiary[0].id,
          moodScore: existingDiary[0].mood_score,
          recordTime: existingDiary[0].created_at
        }
      });
    } else {
      res.json({ 
        success: true, 
        hasRecorded: false,
        message: '今天还没有记录心情，快来记录吧'
      });
    }
  } catch (error) {
    console.error('检查今日记录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}; 