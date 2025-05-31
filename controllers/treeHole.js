const { pool } = require('../config/db');

// 获取所有树洞帖子
exports.getTreeHoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    
    // 直接使用字符串拼接的方式处理LIMIT和OFFSET (MySQL2在预处理语句中对这些有限制)
    const [rows] = await pool.execute(
      `SELECT * FROM tree_holes ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`
    );
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取树洞失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 创建新的树洞帖子
exports.createTreeHole = async (req, res) => {
  const { content, userId, isAnonymous = false } = req.body;
  
  // 打印接收到的数据
  console.log('接收到的树洞发布数据:', { content, userId, isAnonymous });
  
  if (!content || !userId) {
    return res.status(400).json({ success: false, message: '内容和用户ID不能为空' });
  }
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO tree_holes (content, user_id, is_anonymous) VALUES (?, ?, ?)',
      [content, userId, isAnonymous]
    );
    
    console.log('树洞创建成功:', { id: result.insertId, userId });
    
    res.status(201).json({ 
      success: true, 
      message: '树洞创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建树洞失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 根据ID获取特定树洞帖子
exports.getTreeHoleById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tree_holes WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '未找到该树洞' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('获取树洞详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取树洞评论
exports.getTreeHoleComments = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tree_hole_comments WHERE tree_hole_id = ? ORDER BY created_at DESC',
      [id]
    );
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 创建树洞评论
exports.createTreeHoleComment = async (req, res) => {
  const { id } = req.params;
  const { content, userId, isAnonymous = false } = req.body;
  
  if (!content || !userId) {
    return res.status(400).json({ success: false, message: '评论内容和用户ID不能为空' });
  }
  
  try {
    // 先检查树洞是否存在
    const [treeHoles] = await pool.execute(
      'SELECT id FROM tree_holes WHERE id = ?',
      [id]
    );
    
    if (treeHoles.length === 0) {
      return res.status(404).json({ success: false, message: '未找到该树洞' });
    }
    
    // 创建评论
    const [result] = await pool.execute(
      'INSERT INTO tree_hole_comments (tree_hole_id, content, user_id, is_anonymous) VALUES (?, ?, ?, ?)',
      [id, content, userId, isAnonymous]
    );
    
    res.status(201).json({ 
      success: true, 
      message: '评论发表成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}; 