const userInfoMapper = require('../mappers/userInfoMapper');

// 회원정보 갖고오기
async function findInfo(userData) {
  const result = await userInfoMapper.findUserInfo(userData);
  return result;
}

module.exports = { findInfo };
