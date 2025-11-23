const pool = require('../configs/db');
const code = require('../configs/code');
const smsUtils = require('../utils/sms');
const signUserMapper = require('../mappers/signUserMapper');
const { hashPw, checkPw } = require('../utils/crypto');

// 전체 목록 조회 test
async function checkId(id) {
  try {
    const result = await signUserMapper.findUserId(id);
    return result;
  } catch (err) {
    console.error('[ checkId 오류 ] : ', err);
  }
}

// sms 인증
function getSmsCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

async function sendCode(phone) {
  try {
    const code = getSmsCode();
    if (phone.data.length < 10) {
      return {
        ok: false,
        message: '인증코드 전송 실패 : 연락처는 10~11자로 입력하셔야 됩니다.',
      };
    }
    smsUtils.makeCode(phone.data, code);
    console.log(`[ Test SMS Code : ${code} ]`);
    return { ok: true, message: '인증코드 전송 완료' };
  } catch (err) {
    console.error('[ sendCode 오류 ] : ', err);
  }
}

async function verifyCode(data) {
  try {
    const result = smsUtils.verifiedCode(data.phone, data.code);
    if (!result) {
      return {
        ok: false,
        message: '전화번호 인증 실패 : 올바른 인증코드를 입력해주세요.',
      };
    }
    return { ok: true, message: '전화번호 인증 완료' };
  } catch (err) {
    console.error('[ verifyCode 오류 ] : ', err);
  }
}

// 개인 회원
async function addUser(userData) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hashedPw = await hashPw(userData.userPw);
    const resOrgCode = await signUserMapper.findOrgCode(
      conn,
      userData.org_name
    );
    // 기관 선택 안 하면 null 반환
    const orgCode = resOrgCode.length == 0 ? null : orgCode[0].org_code;
    const result = await signUserMapper.addUser(conn, {
      ...userData,
      hashedPw,
      org_code: orgCode,
    });
    if (result.insertId == 0) {
      conn.rollback();
      return { ok: false, message: '등록 실패' };
    }
    conn.commit();
    return { ok: true, message: '등록 성공' };
  } catch (err) {
    console.error('[ addUser 오류 ] : ', err);
    conn.rollback();
  } finally {
    conn.release();
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
    const hashedPw = await hashPw(userData.userPw);
    const orgCode = await signUserMapper.findOrgCode(conn, userData.org_name);
    const userCode = await signUserMapper.addOrg(conn, {
      ...userData,
      hashedPw,
      org_code: orgCode[0].org_code,
    });

    // approval 테이블에 입력할 파라미터
    const reqData = {
      user_code: userCode.insertId,
      approval_type: code.APPROVAL_USER_ROLE[userData.role],
      request_date: userData.joinDate,
      state: 'BA1',
    };
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
    const result = await signUserMapper.authLogin(data.userId);
    const isPw = await checkPw(data.userPw, result[0].password_hash);
    if (!isPw) {
      return { ok: false, message: '로그인 실패' };
    }
    return { ok: true, message: '로그인 성공', ...result[0] };
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
        const newHashPw = await hashPw(data.newPw);
        const { user_id } = data;
        const result = await signUserMapper.updatePw({ user_id, newHashPw });
        if (result.affectedRows == 0) {
          return { ok: false, message: '변경 실패' };
        }
        return { ok: true, message: '변경 성공' };
      default:
        return { ok: false, message: 'service findIdPw type 오류' };
    }
  } catch (err) {
    console.error('[ service findIdPw 오류 ]', err);
  }
}

module.exports = {
  checkId,
  sendCode,
  verifyCode,
  addUser,
  findOrg,
  addOrg,
  login,
  findIdPw,
};
