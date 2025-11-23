const express = require('express');
const router = express.Router();
const userService = require('../services/signUserService');

// 중복 확인
router.get('/checkid', async (req, res) => {
  const userId = req.query.id;
  try {
    const result = await userService.checkId(userId);
    res.json(result);
  } catch (err) {
    console.error('[ authUser.js -> checkid 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ authUser.js -> checkid 라우터 오류 ]' });
  }
});

// SMS 인증
router.post('/verifySMS', async (req, res) => {
  try {
    const result = await userService.verifyCode(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ authUser.js -> verifySMS 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ authUser.js -> verifySMS 라우터 오류 ]' });
  }
});

router.post('/sendSMS', async (req, res) => {
  try {
    const result = await userService.sendCode(req.body);
    res.send(result);
  } catch (err) {
    console.error('[ authUser.js -> sendSMS 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ authUser.js -> sendSMS 라우터 오류 ]' });
  }
});

// 개인 회원가입
router.post('/addUser', async (req, res) => {
  try {
    const result = await userService.addUser(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ authUser.js -> addUser 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ authUser.js -> addUser 라우터 오류 ]' });
  }
});

// 기관 목록 조회
router.post('/findOrg', async (req, res) => {
  const result = await userService.findOrg();
  res.json(result);
});

// 기관 회원가입
router.post('/addOrg', async (req, res) => {
  try {
    const result = await userService.addOrg(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ authUser.js -> addOrg 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ authUser.js -> addOrg 라우터 오류 ]' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const result = await userService.login(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ authUser.js -> login 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ authUser.js -> login 라우터 오류 ]' });
  }
});

// id, pw 찾기
router.post('/findIdPw', async (req, res) => {
  try {
    const { type, data } = req.body;
    const result = await userService.findIdPw(type, data);
    res.json(result);
  } catch (err) {
    console.error('[ authUser.js -> findIdPw 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ authUser.js -> findIdPw 라우터 오류 ]' });
  }
});

// pw 변경
router.put('/findIdPw', async (req, res) => {
  try {
    const { type, data } = req.body;
    const result = await userService.findIdPw(type, data);
    res.json(result);
  } catch (err) {
    console.error('[ authUser.js -> findIdPw 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ authUser.js -> findIdPw 라우터 오류 ]' });
  }
});

module.exports = router;
