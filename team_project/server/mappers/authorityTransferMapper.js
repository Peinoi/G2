// server/mappers/authorityTransferMapper.js

const pool = require("../configs/db");
const authoritySQL = require("../sql/authorityTransferSQL");

function rowsFrom(ret) {
  if (Array.isArray(ret) && Array.isArray(ret[0])) return ret[0];
  return ret;
}

// 이용자 목록 조회
// - loginId : 로그인한 기관 관리자 user_id
// - managerCode : 특정 담당자(user_code) 기준으로 필터 (선택)
// - keyword : 아이디/이름/연락처 검색 (선택)
async function authorityUserList({
  loginId,
  managerCode,
  keyword,
  page,
  size,
}) {
  const conn = await pool.getConnection();
  try {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    const whereClauses = [];
    const params = [];
    const countParams = [];

    // 기본: loginId로 기관 제한 (첫 번째 파라미터)
    params.push(loginId);
    countParams.push(loginId);

    // 담당자 필터 (from / to 담당자 둘 다 이 API로 조회 가능)
    if (managerCode) {
      whereClauses.push("u.manager_code = ?");
      params.push(managerCode);
      countParams.push(managerCode);
    }

    // 검색어 (아이디 / 이름 / 연락처)
    if (keyword) {
      whereClauses.push(`
        (
             u.user_id LIKE CONCAT('%', ?, '%')
          OR u.name    LIKE CONCAT('%', ?, '%')
          OR u.phone   LIKE CONCAT('%', ?, '%')
        )
      `);
      params.push(keyword, keyword, keyword);
      countParams.push(keyword, keyword, keyword);
    }

    let whereSql = "";
    if (whereClauses.length > 0) {
      whereSql = " AND " + whereClauses.join(" AND ");
    }

    const listSql = `
      ${authoritySQL.authorityUserListBase}
      ${whereSql}
      ORDER BY u.name ASC, u.user_id ASC
      LIMIT ?, ?
    `;
    const listParams = [...params, offset, sizeNum];

    const retRows = await conn.query(listSql, listParams);
    const rows = rowsFrom(retRows);

    const countSql = `
      ${authoritySQL.authorityUserCountBase}
      ${whereSql}
    `;
    const retCount = await conn.query(countSql, countParams);
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[authorityTransferMapper] userList rows:",
      rows.length,
      "| loginId:",
      loginId,
      "| managerCode:",
      managerCode,
      "| keyword:",
      keyword,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      list: rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

// 권한 이관 (여러 이용자에 대해 담당자 변경 + 관련 테이블 담당자 코드 변경)
async function transferUsers({
  loginId,
  fromManagerCode,
  toManagerCode,
  userCodes,
}) {
  if (!Array.isArray(userCodes) || userCodes.length === 0) {
    return { affectedRows: 0 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const placeholders = userCodes.map(() => "?").join(", ");
    const baseAssiParams = [toManagerCode, fromManagerCode];

    // 1) users.manager_code 변경 (기존 로직)
    const userSql = `
      ${authoritySQL.authorityTransferUpdateBase}
        AND user_code IN (${placeholders})
    `;
    const userParams = [
      toManagerCode, // SET manager_code = ?
      fromManagerCode, // AND manager_code = ?
      loginId, // AND org_code = ( SELECT ... WHERE user_id = ? )
      ...userCodes, // IN (...)
    ];
    const userRet = await conn.query(userSql, userParams);

    // 2) survey_submission.assi_by 변경
    const surveySql = `
      ${authoritySQL.transferSurveyAssiByBase}
        AND u.user_code IN (${placeholders})
    `;
    const surveyParams = [...baseAssiParams, ...userCodes];
    const surveyRet = await conn.query(surveySql, surveyParams);

    // 3) support_plan.assi_by 변경
    const planSql = `
      ${authoritySQL.transferSupportPlanAssiByBase}
        AND u.user_code IN (${placeholders})
    `;
    const planParams = [...baseAssiParams, ...userCodes];
    const planRet = await conn.query(planSql, planParams);

    // 4) support_result.assi_by 변경
    const resultSql = `
      ${authoritySQL.transferSupportResultAssiByBase}
        AND u.user_code IN (${placeholders})
    `;
    const resultParams = [...baseAssiParams, ...userCodes];
    const resultRet = await conn.query(resultSql, resultParams);

    await conn.commit();

    const totalAffected =
      (userRet.affectedRows || 0) +
      (surveyRet.affectedRows || 0) +
      (planRet.affectedRows || 0) +
      (resultRet.affectedRows || 0);

    console.log(
      "[authorityTransferMapper] transferUsers:",
      "users:",
      userRet.affectedRows,
      "| survey:",
      surveyRet.affectedRows,
      "| plan:",
      planRet.affectedRows,
      "| result:",
      resultRet.affectedRows,
      "| from:",
      fromManagerCode,
      "-> to:",
      toManagerCode,
      "| userCodes:",
      userCodes
    );

    return { affectedRows: totalAffected };
  } catch (err) {
    await conn.rollback();
    console.error("[authorityTransferMapper] transferUsers 실패:", err);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  authorityUserList,
  transferUsers,
};
