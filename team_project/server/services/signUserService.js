const pool = require('../configs/db');
const signUserMapper = require('../mappers/signUserMapper');

// 전체 목록 조회 test
async function checkId(id) {
  try {
    const result = await signUserMapper.findUserId(id);
    return result;
  } catch (err) {
    console.error('[ checkId 오류 ] : ', err);
  }
}

// 개인 회원
async function addUser(userData) {
  try {
    const result = await signUserMapper.addUser(userData);
    return result;
  } catch (err) {
    console.error('[ addUser 오류 ] : ', err);
  }
}

// 기관 목록 조회
async function findOrg() {
  try {
    const result = await signUserMapper.findOrgList();
    return result;
  } catch (err) {
    console.error('[ findOrg 오류 ] : ', err);
  }
}

// 기관 회원
// 헷갈릴까봐 작동 순서 주석 달아둠
// 1. 프론트에서 회원가입 완료를 진행 -> /api/user/addOrg으로 이동
// 2. findOrgCode 실행
//    -> 회원가입 시 작성한 기관명(userData.org_name)으로 기관 코드(orgCode)를 찾음
// 3. 기관 코드가 없으면 ok: false 반환
// 4. 기관 코드가 있으면 매퍼에 있는 addOrg를 실행하여 DB 기입
async function addOrg(userData) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // 기관명 조회 -> 가입
    const orgCodeResult = await signUserMapper.findOrgCode(
      conn,
      userData.org_name
    );
    const orgCode = orgCodeResult[0].org_code;
    await signUserMapper.addOrg(conn, {
      ...userData,
      org_code: orgCode,
    });

    const userCode = await signUserMapper.findUserCode(conn, userData.userId);
    let reqData = {};
    if (userData.role == 'AA2') {
      reqData = {
        user_code: userCode[0].user_code,
        approval_type: 'AE2',
        request_date: userData.joinDate,
        state: 'BA1',
      };
    } else {
      reqData = {
        user_code: userCode[0].user_code,
        approval_type: 'AE1',
        request_date: userData.joinDate,
        state: 'BA1',
      };
    }
    const result = await signUserMapper.requestApproval(conn, reqData);
    if (result.affectedRows == 0) {
      conn.rollback();
      return { ok: false, message: '등록 실패' };
    }
    conn.commit();
    return { ok: true, message: '등록 성공' };
  } catch (err) {
    console.error('[ addOrg 오류 ] : ', err);
    conn.rollback();
  } finally {
    conn.release();
  }
}

// 로그인
async function login(data) {
  try {
    const result = await signUserMapper.authLogin(data);
    return result;
  } catch (err) {
    console.error('[ login Service 오류 ]', err);
  }
}

// id, pw 찾기
async function findIdPw(type, data) {
  try {
    switch (type) {
      case 'findId':
        return await signUserMapper.findId(data);
      case 'findPw':
        return await signUserMapper.findPw(data);
      case 'findResetPw':
        return await signUserMapper.updatePw(data);
      default:
        return { ok: false, message: 'service findIdPw type 오류' };
    }
  } catch (err) {
    console.error('[ service findIdPw 오류 ]', err);
  }
}

module.exports = { checkId, addUser, findOrg, addOrg, login, findIdPw };
