const userInfoMapper = require('../mappers/userInfoMapper');

// 회원정보 갖고오기
async function findInfo(userData) {
  try {
    const result = await userInfoMapper.findUserInfo(userData);
    return result;
  } catch (err) {
    console.error('[ findInfo 실패 ] : ', err);
  }
}

// 사용자, 기관, 자녀 수정
async function infoUpdate(type, data) {
  try {
    switch (type) {
      case 'user':
        return await userInfoMapper.updateUser(data);
      case 'org':
        return await userInfoMapper.updateOrg(data);
      case 'child':
        return await userInfoMapper.updateChild(data);
      default:
        return { ok: false, message: 'service infoUpdate type 오류' };
    }
  } catch (err) {
    console.error('[ infoUpdate 실패 ] : ', err);
  }
}

// 자녀 추가
async function childAdd(userData) {
  try {
    const result = await userInfoMapper.addChild(userData);
    return result;
  } catch (err) {
    console.error('[ childAdd 실패 ] : ', err);
  }
}

// 자녀 삭제
async function childDelete(data) {
  try {
    const result = await userInfoMapper.deleteChild(data);
    return result;
  } catch (err) {
    console.error('[ childDelete 실패 ] : ', err);
  }
}

module.exports = { findInfo, childAdd, infoUpdate, childDelete };
