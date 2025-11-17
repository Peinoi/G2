const pool = require('../configs/db');
const userInfoSQL = require('../sql/userInfoSQL');

// 권한에 따라 회원정보 갖고 오기
async function findUserInfo(userData) {
  try {
    let result;
    if (userData.role == 'AA1') {
      [result] = await pool.query(userInfoSQL.FIND_USER_INFO, [
        userData.userId,
      ]);
    } else {
      [result] = await pool.query(userInfoSQL.FIND_ORG_INFO, [userData.userId]);
    }
    if (result.length < 1) {
      return { ok: false, message: '값 없음' };
    }
    return result[0];
  } catch (err) {
    console.error('[ findUserInfo 실패 ] : ', err);
    throw err;
  }
}

module.exports = { findUserInfo };
