const userInfoMapper = require('../mappers/userInfoMapper');
const { createChild } = require('./factories/userFactory');
const { makeParams } = require('../utils/sqlParamUtil');
const { INSERT_CHILD_DATA } = require('../configs/insertData');
const { encryptSsn, decryptSsn } = require('../utils/ssnCrypto');

// 회원정보 갖고오기
async function findInfo(userData) {
  try {
    const result = await userInfoMapper.findUserInfo(userData);
    if (result[0].ssn == null) {
      return result;
    }
    const dec = decryptSsn(result[0]);
    const replaceDec = dec.replace(/^(.{8})(.*)$/, (match, visible, hidden) => {
      return visible + '*'.repeat(hidden.length);
    });

    const returnData = result.map((item) => {
      const { ssn_iv, ...rest } = item;
      return {
        ...rest,
        ssn: replaceDec,
      };
    });

    return returnData;
  } catch (err) {
    throw err;
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
      case 'child': {
        const result = encryptSsn(data.ssn);
        const res = { ...data, ssn: result.ssn, ssn_iv: result.ssn_iv };
        return await userInfoMapper.updateChild(res);
      }
      default:
        return { ok: false, message: 'service infoUpdate type 오류' };
    }
  } catch (err) {
    console.error('[ infoUpdate 실패 ] : ', err);
  }
}

// pw 변경
async function pwUpdate(data) {
  try {
    const result = await userInfoMapper.updatePw(data);
    return result;
  } catch (err) {
    console.error('[ pwUpdate 실패 ] : ', err);
  }
}

// 자녀 추가
async function childAdd(childData) {
  try {
    const enc = encryptSsn(childData.ssn);
    const tempData = createChild(childData, enc);
    const params = makeParams(INSERT_CHILD_DATA, tempData);

    await userInfoMapper.addChild(params);
    return { ok: true, message: '자녀 등록 성공' };
  } catch (err) {
    throw err;
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

module.exports = { findInfo, childAdd, infoUpdate, pwUpdate, childDelete };
