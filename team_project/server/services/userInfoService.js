const userInfoMapper = require('../mappers/userInfoMapper');

// 회원정보 갖고오기
async function findInfo(userData) {
  const result = await userInfoMapper.findUserInfo(userData);
  return result;
}
// 사용자, 기관, 자녀 수정
async function infoUpdate(type, role, data) {
  console.log(data);
  if (role === 'AA1') {
    if (type === 'org') {
      return { ok: false, message: '권한 안 맞음' };
    }
  }

  if (role === 'AA2' || role === 'AA3') {
    if (type === 'child') {
      return { ok: false, message: '기관 회원은 자녀 정보 수정 불가' };
    }
  }
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
}

// 자녀 추가
async function childAdd(userData) {
  const result = await userInfoMapper.addChild(userData);
  return result;
}

// 자녀 삭제
async function childDelete(data) {
  const result = await userInfoMapper.deleteChild(data);
  return result;
}

module.exports = { findInfo, childAdd, infoUpdate, childDelete };
