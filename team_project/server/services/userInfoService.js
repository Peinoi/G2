const userInfoMapper = require('../mappers/userInfoMapper');

// 회원정보 갖고오기
async function findInfo(userData) {
  const result = await userInfoMapper.findUserInfo(userData);
  return result;
}

// 자녀 추가
async function childAdd(userData) {
  const result = await userInfoMapper.addChild(userData);
  return result;
}

// 자녀 수정
async function childUpdate(data) {
  const result = await userInfoMapper.updateChild(data);
  return result;
}

// 자녀 삭제
async function childDelete(data) {
  const result = await userInfoMapper.deleteChild(data);
  return result;
}

module.exports = { findInfo, childAdd, childUpdate, childDelete };
