const { pool } = require('../config/db');

// 获取所有冥想资源
exports.getAllResources = async (req, res) => {
  const { category } = req.query;
  
  try {
    let query = 'SELECT * FROM meditation_resources';
    const params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取冥想资源失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 根据ID获取特定冥想资源
exports.getResourceById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM meditation_resources WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '未找到该资源' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('获取冥想资源详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取所有冥想资源分类
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT category FROM meditation_resources'
    );
    
    const categories = rows.map(row => row.category).filter(Boolean);
    
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('获取冥想资源分类失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 记录用户的冥想练习
exports.recordPractice = async (req, res) => {
  const { user_id, meditation_id, duration, completed } = req.body;
  
  if (!user_id || !duration) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }
  
  try {
    await pool.execute(
      'INSERT INTO meditation_practices (user_id, meditation_id, duration, completed, practice_time) VALUES (?, ?, ?, ?, NOW())',
      [user_id, meditation_id || null, duration, completed ? 1 : 0]
    );
    
    res.json({ success: true, message: '记录成功' });
  } catch (error) {
    console.error('记录冥想练习失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取用户冥想统计数据
exports.getUserStats = async (req, res) => {
  const { user_id } = req.params;
  
  if (!user_id) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }
  
  try {
    // 总冥想时长
    const [totalDuration] = await pool.execute(
      'SELECT SUM(duration) as total_minutes FROM meditation_practices WHERE user_id = ? AND completed = 1',
      [user_id]
    );
    
    // 总冥想次数
    const [totalSessions] = await pool.execute(
      'SELECT COUNT(*) as total_sessions FROM meditation_practices WHERE user_id = ? AND completed = 1',
      [user_id]
    );
    
    // 本周冥想次数
    const [weekSessions] = await pool.execute(
      `SELECT COUNT(*) as week_sessions FROM meditation_practices 
       WHERE user_id = ? AND completed = 1 
       AND practice_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [user_id]
    );
    
    // 最常用的冥想类型
    const [favoriteType] = await pool.execute(
      `SELECT mr.category, COUNT(*) as count 
       FROM meditation_practices mp
       JOIN meditation_resources mr ON mp.meditation_id = mr.id
       WHERE mp.user_id = ? AND mp.completed = 1 AND mp.meditation_id IS NOT NULL
       GROUP BY mr.category
       ORDER BY count DESC
       LIMIT 1`,
      [user_id]
    );
    
    const stats = {
      total_minutes: totalDuration[0].total_minutes || 0,
      total_sessions: totalSessions[0].total_sessions || 0,
      week_sessions: weekSessions[0].week_sessions || 0,
      favorite_type: favoriteType.length > 0 ? favoriteType[0].category : null
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取冥想统计数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取呼吸练习模式列表
exports.getBreathingModes = async (req, res) => {
  try {
    const modes = [
      {
        id: 'relax',
        name: '放松呼吸',
        description: '4-7-8呼吸法，缓解焦虑和压力',
        pattern: {
          inhale: 4,
          hold1: 7,
          exhale: 8,
          hold2: 0
        }
      },
      {
        id: 'focus',
        name: '专注呼吸',
        description: '4-4-4-4方块呼吸法，提升注意力',
        pattern: {
          inhale: 4,
          hold1: 4,
          exhale: 4,
          hold2: 4
        }
      },
      {
        id: 'sleep',
        name: '助眠呼吸',
        description: '4-7-8呼吸法，促进入睡和深度休息',
        pattern: {
          inhale: 4,
          hold1: 7,
          exhale: 8,
          hold2: 0
        }
      }
    ];
    
    res.json({ success: true, data: modes });
  } catch (error) {
    console.error('获取呼吸练习模式失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}; 