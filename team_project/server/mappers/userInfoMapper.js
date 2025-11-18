const pool = require('../configs/db');
const userInfoSQL = require('../sql/userInfoSQL');

// 권한에 따라 회원정보 갖고 오기
async function findUserInfo(userData) {
  try {
    let result;
    if (userData.role == 'AA1') {
      result = await pool.query(userInfoSQL.FIND_USER_INFO, [userData.userId]);
    } else {
      result = await pool.query(userInfoSQL.FIND_ORG_INFO, [userData.userId]);
    }
    if (!result) {
      return { false: true, message: '값 없음' };
    }
    return result;
  } catch (err) {
    console.error('[ findUserInfo 실패 ] : ', err);
    throw err;
  }
}

// 자녀 추가
async function addChild(data) {
  try {
    const childData = [
      data.user_code,
      data.child_name,
      data.ssn,
      data.gender,
      data.disability_type,
      data.registered_date,
    ];
    await pool.query(userInfoSQL.CHILD_ADD, childData);
    return { ok: true, message: '자녀 추가 성공' };
  } catch (err) {
    console.error('[ addChild 실패 ] : ', err);
    throw err;
  }
}

module.exports = { findUserInfo, addChild };
