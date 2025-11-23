const pool = require('../configs/db');
const signUserSQL = require('../sql/signUserSQL');

// 중복 확인
async function findUserId(id) {
  try {
    const rows = await pool.query(signUserSQL.FIND_ID, [id]);
    if (rows.length > 0) {
      return { ok: false, message: '이미 사용중인 아이디입니다.' };
    }
    return { ok: true, message: '사용 가능한 아이디입니다.' };
  } catch (err) {
    console.error('[ findUserId 실패 ] : ', err);
  }
}

// 개인 회원가입
async function addUser(conn, dataParams) {
  try {
    const result = await conn.query(signUserSQL.INSERT_USER, dataParams);
    return result;
  } catch (err) {
    console.error('[ addUser 실패 ] : ', err);
  }
}

// 기관 목록 조회
async function findOrgList() {
  try {
    return await pool.query(signUserSQL.FIND_ORG_LIST);
  } catch (err) {
    console.error('[ findOrgList 찾기 실패 ] : ', err);
  }
}

// 기관 code 가져오기
async function findOrgCode(conn, orgName) {
  try {
    return await conn.query(signUserSQL.FIND_ORG_CODE, [orgName]);
  } catch (err) {
    console.error('[ findOrgCode 찾기 실패 ] : ', err);
  }
}

// 기관 회원가입
async function addOrg(conn, dataParams) {
  try {
    const result = await conn.query(signUserSQL.INSERT_USER, dataParams);
    return result;
  } catch (err) {
    console.error('[ insertOrgUser 실패 ]', err);
  }
}

// 승인 요청 테이블 기입
async function requestApproval(conn, data) {
  try {
    const { user_code, approval_type, request_date, state } = data;
    return await conn.query(signUserSQL.REQUEST_USER, [
      user_code,
      approval_type,
      request_date,
      state,
    ]);
  } catch (err) {
    console.error('[ requestApproval 실패 ]', err);
  }
}

// 로그인
async function authLogin(data) {
  try {
    const result = await pool.query(signUserSQL.AUTH_LOGIN, [data]);
    return result;
  } catch (err) {
    console.error('[ authLogin 실패 ]', err);
  }
}

// id 찾기
async function findId(data) {
  try {
    const result = await pool.query(signUserSQL.FIND_USER_ID, [
      data.name,
      data.phone,
    ]);
    if (result.length == 0) {
      return { ok: false, message: '조건에 맞는 ID가 없습니다' };
    }
    return { ok: true, message: 'ID 찾기 성공', ...result[0] };
  } catch (err) {
    console.error('[ findId 실패 ]', err);
  }
}

// pw 찾기
async function findPw(data) {
  try {
    const result = await pool.query(signUserSQL.FIND_USER_PW, [
      data.user_id,
      data.name,
      data.phone,
    ]);
    if (result.length == 0) {
      return { ok: false, message: '조건에 맞는 데이터가 없습니다' };
    }
    return { ok: true, message: 'PW 찾기 성공' };
  } catch (err) {
    console.error('[ findPw 실패 ]', err);
  }
}

// pw 변경
async function updatePw(data) {
  try {
    return await pool.query(signUserSQL.FIND_RESET_PW, [
      data.newHashPw,
      data.user_id,
    ]);
  } catch (err) {
    console.error('[ updatePw 실패 ]', err);
  }
}

module.exports = {
  findUserId,
  addUser,
  findOrgList,
  findOrgCode,
  addOrg,
  requestApproval,
  authLogin,
  findId,
  findPw,
  updatePw,
};
