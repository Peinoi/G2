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

// 자녀 추가
router.post('/childAdd', async (req, res) => {
  const userData = { ...req.body };
  console.log(userData);
  try {
    const result = await userInfoService.childAdd(userData);
    res.json(result);
  } catch (err) {
    console.error('[ childAdd 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: '[ childAdd 라우터 오류 ]' });
  }
});

// 자녀 정보 수정
router.put('/updateChild', async (req, res) => {
  try {
    const result = await userInfoService.childUpdate(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ updateChild 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: '[ updateChild 라우터 오류 ]' });
  }
});

// 자녀 정보 삭제
router.delete('/deleteChild', async (req, res) => {
  try {
    const result = await userInfoService.childDelete(req.body.childCode);
    res.json(result);
  } catch (err) {
    console.error('[ deleteChild 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: '[ deleteChild 라우터 오류 ]' });
  }
});

module.exports = router;
