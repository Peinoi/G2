const express = require('express');
const router = express.Router();
const userInfoService = require('../services/userInfoService');

// 회원정보 갖고오기
router.post('/findInfo', async (req, res) => {
  const userData = { userId: req.body.userId, role: req.body.role };
  try {
    const result = await userInfoService.findInfo(userData);
    res.json(result);
  } catch (err) {
    console.error('[ findInfo 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: '[ findInfo 라우터 오류 ]' });
  }
});

module.exports = router;
