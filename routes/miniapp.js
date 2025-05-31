const express = require('express');
const router = express.Router();

// 导入各功能的控制器
const treeHoleController = require('../controllers/treeHole');
const psychTestController = require('../controllers/psychTest');
const emotionDiaryController = require('../controllers/emotionDiary');
const meditationController = require('../controllers/meditation');
const userController = require('../controllers/user');

// 用户相关路由
router.post('/user/register', userController.register);
router.post('/user/login', userController.login);
router.post('/user/reset-password', userController.resetPassword);
router.get('/user/info', userController.getCurrentUser);
router.put('/user/:id', userController.updateUserInfo);
router.post('/user/wxLogin', userController.wxLogin);
router.post('/user/updateWxUserInfo', userController.updateWxUserInfo);

// 树洞相关路由
router.get('/treeholes', treeHoleController.getTreeHoles);
router.post('/treeholes', treeHoleController.createTreeHole);
router.get('/treeholes/:id', treeHoleController.getTreeHoleById);
router.get('/treeholes/:id/comments', treeHoleController.getTreeHoleComments);
router.post('/treeholes/:id/comments', treeHoleController.createTreeHoleComment);

// 心理测试相关路由
router.get('/psychtests', psychTestController.getAllTests);
router.get('/psychtests/:id', psychTestController.getTestById);
router.post('/psychtests/:id/result', psychTestController.submitTestResult);

// 情绪日记相关路由
router.get('/emotion-diaries', emotionDiaryController.getDiaries);
router.post('/emotion-diaries', emotionDiaryController.createDiary);
router.get('/emotion-diaries/stats', emotionDiaryController.getEmotionStats);
router.get('/emotion-diaries/check-today', emotionDiaryController.checkTodayRecord);
router.get('/emotion-diaries/:id', emotionDiaryController.getDiaryById);
router.delete('/emotion-diaries/:id', emotionDiaryController.deleteDiary);

// 冥想放松相关路由
router.get('/meditations', meditationController.getAllResources);
router.get('/meditations/categories', meditationController.getCategories);
router.get('/meditations/:id', meditationController.getResourceById);
router.post('/meditation/practice', meditationController.recordPractice);
router.get('/meditation/stats/:user_id', meditationController.getUserStats);
router.get('/meditation/breathing-modes', meditationController.getBreathingModes);

module.exports = router; 