// team_project/server/mappers/approvalMapper.js

const pool = require("../configs/db.js");
const approvalSQL = require("../sql/approvalSQL");

function rowsFrom(ret) {
  if (Array.isArray(ret) && Array.isArray(ret[0])) return ret[0];
  return ret;
}

async function managerApprovalList({ state, keyword, page, size }) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    const params = [
      st,
      st, // 상태 필터
      kw,
      kw,
      kw,
      kw,
      kw,
      kw, // (검색까지 이미 구현해뒀다면 이 부분 유지)
      offset,
      sizeNum,
    ];

    const ret = await conn.query(approvalSQL.managerApprovalList, params);
    const rows = rowsFrom(ret);
    console.log(
      "[approvalMapper] managerApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| page:",
      pageNum
    );
    return rows;
  } finally {
    conn.release();
  }
}

/** ✅ 승인/반려 공통 업데이트 + 승인 시 사용자 활성화(is_active=1) */
async function updateApprovalState({ approvalCode, nextState }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const params = [nextState, approvalCode];

    console.log(
      "[approvalMapper] updateApprovalState SQL:",
      approvalSQL.updateApprovalState,
      "params:",
      params
    );

    const ret = await conn.query(approvalSQL.updateApprovalState, params);
    const result = ret[0] || ret;

    console.log(
      "[approvalMapper] updateApprovalState result:",
      result.affectedRows
    );

    // ✅ 승인(BA2)일 때만 사용자 계정 활성화
    if (nextState === "BA2" && result.affectedRows > 0) {
      console.log(
        "[approvalMapper] activateUserByApproval SQL:",
        approvalSQL.activateUserByApproval,
        "params:",
        [approvalCode]
      );
      await conn.query(approvalSQL.activateUserByApproval, [approvalCode]);
    }

    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** ✅ approvalCode로 요청자 정보 조회 (이메일, 이름 등) */
async function findApprovalWithUser({ approvalCode }) {
  const conn = await pool.getConnection();
  try {
    const ret = await conn.query(approvalSQL.findApprovalWithUser, [
      approvalCode,
    ]);
    const rows = rowsFrom(ret);
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

// 기관 담당자 승인 요청 목록 조회
async function staffApprovalList({
  state,
  keyword,
  page,
  size,
  loginId,
  role,
}) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    // 🔹 시스템 관리자(AA4)는 기관 필터 없이 전체 조회
    const isSystemAdmin = role === "AA4";
    const orgFilterLoginId = isSystemAdmin ? "" : loginId || "";

    const params = [
      st,
      st, // 상태 필터

      kw,
      kw,
      kw,
      kw,
      kw,
      kw, // 검색어 필터 (이름/아이디/기관명/연락처/이메일)

      // 🔹 기관 필터용 파라미터 2개
      orgFilterLoginId, // '' 이면 필터 해제 (AA4)
      orgFilterLoginId, // 기관 관리자면 실제 loginId

      offset,
      sizeNum,
    ];

    const ret = await conn.query(approvalSQL.staffApprovalList, params);
    const rows = rowsFrom(ret);

    console.log(
      "[approvalMapper] staffApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| page:",
      pageNum
    );
    return rows;
  } finally {
    conn.release();
  }
}

/** ✅ 기관 담당자 승인/반려 공통 업데이트 (BA2 / BA3) + 승인 시 사용자 활성화 */
async function updateApprovalStateForStaff({ approvalCode, nextState }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const params = [nextState, approvalCode];

    console.log(
      "[approvalMapper] updateApprovalStateForStaff SQL:",
      approvalSQL.updateApprovalState,
      "params:",
      params
    );

    const ret = await conn.query(approvalSQL.updateApprovalState, params);
    const result = ret[0] || ret;

    console.log(
      "[approvalMapper] updateApprovalStateForStaff result:",
      result.affectedRows
    );

    // ✅ 승인(BA2)일 때만 사용자 계정 활성화
    if (nextState === "BA2" && result.affectedRows > 0) {
      console.log(
        "[approvalMapper] activateUserByApproval SQL:",
        approvalSQL.activateUserByApproval,
        "params:",
        [approvalCode]
      );
      await conn.query(approvalSQL.activateUserByApproval, [approvalCode]);
    }

    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// 우선순위 승인 요청 목록 조회 (페이징 + 검색/정렬)
async function priorityApprovalList({
  page,
  size,
  keyword,
  state,
  orderBy,
  loginId,
  role, // 🔹 추가
}) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const ob = orderBy || "latest";

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    // 🔹 시스템 관리자(AA4)는 기관 필터 없이 전체 조회
    const isSystemAdmin = role === "AA4";
    const orgFilterLoginId = isSystemAdmin ? "" : loginId || "";

    const params = [
      st,
      st, // 상태 필터

      kw,
      kw,
      kw,
      kw,
      kw, // 검색어 필터 (child, parent, mgr, org)

      orgFilterLoginId, // 🔹 org 필터용 ('': 필터 해제)
      orgFilterLoginId, // 🔹 org 필터용 (실제 loginId)

      ob, // latest
      ob, // oldest
      ob, // name
      ob, // priority

      offset,
      sizeNum,
    ];

    const retRows = await conn.query(approvalSQL.priorityApprovalList, params);
    const rows = rowsFrom(retRows);

    // totalCount도 동일한 기관 필터 적용
    const countParams = [
      st,
      st,
      kw,
      kw,
      kw,
      kw,
      kw,
      orgFilterLoginId,
      orgFilterLoginId,
    ];

    const retCount = await conn.query(
      approvalSQL.priorityApprovalTotalCount,
      countParams
    );
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[approvalMapper] priorityApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| orderBy:",
      ob,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| orgFilterLoginId:",
      orgFilterLoginId,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

// 지원계획 승인 요청 목록 조회 (페이징 + 검색/정렬)
async function supportPlanApprovalList({
  page,
  size,
  keyword,
  state,
  orderBy,
  loginId,
  role,
}) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const ob = orderBy || "latest";

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    // 🔹 시스템 관리자(AA4)는 기관 필터 없이 전체 조회
    const isSystemAdmin = role === "AA4";
    const orgFilterLoginId = isSystemAdmin ? "" : loginId || "";

    const params = [
      st,
      st,

      kw,
      kw,
      kw,
      kw,
      kw,

      // 🔹 기관 필터 ('' 이면 필터 해제)
      orgFilterLoginId,
      orgFilterLoginId,

      ob,
      ob,
      ob,
      ob,

      offset,
      sizeNum,
    ];

    const retRows = await conn.query(
      approvalSQL.supportPlanApprovalList,
      params
    );
    const rows = rowsFrom(retRows);

    const countParams = [
      st,
      st,
      kw,
      kw,
      kw,
      kw,
      kw,
      orgFilterLoginId,
      orgFilterLoginId,
    ];

    const retCount = await conn.query(
      approvalSQL.supportPlanApprovalTotalCount,
      countParams
    );
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[approvalMapper] supportPlanApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| orderBy:",
      ob,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| orgFilterLoginId:",
      orgFilterLoginId,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

// 🔹 지원결과 승인 요청 목록 조회 (페이징 + 검색/정렬)
async function supportResultApprovalList({
  page,
  size,
  keyword,
  state,
  orderBy,
  loginId,
  role,
}) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const ob = orderBy || "latest";

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    // 🔹 시스템 관리자(AA4)는 기관 필터 없이 전체, 기관 관리자(AA3)는 자기 기관만
    const isSystemAdmin = role === "AA4";
    const orgFilterLoginId = isSystemAdmin ? "" : loginId || "";

    const params = [
      st,
      st, // 상태 필터

      kw,
      kw,
      kw,
      kw,
      kw, // 검색어 필터 (child, parent, mgr, org)

      // 🔹 기관 필터 ('' 이면 필터 해제 => AA4)
      orgFilterLoginId,
      orgFilterLoginId,

      ob, // latest
      ob, // oldest
      ob, // name
      ob, // priority

      offset,
      sizeNum,
    ];

    const retRows = await conn.query(
      approvalSQL.supportResultApprovalList,
      params
    );
    const rows = rowsFrom(retRows);

    const countParams = [
      st,
      st,
      kw,
      kw,
      kw,
      kw,
      kw,
      orgFilterLoginId,
      orgFilterLoginId,
    ];

    const retCount = await conn.query(
      approvalSQL.supportResultApprovalTotalCount,
      countParams
    );
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[approvalMapper] supportResultApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| orderBy:",
      ob,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| orgFilterLoginId:",
      orgFilterLoginId,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

// 🔹 이벤트 계획 승인 요청 목록 조회 (페이징 + 검색/정렬)
async function eventPlanApprovalList({
  page,
  size,
  keyword,
  state,
  orderBy,
  loginId,
  role,
}) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const ob = orderBy || "latest";

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    // 🔹 시스템 관리자(AA4)는 기관 필터 없이 전체, 기관 관리자(AA3)는 자기 기관만
    const isSystemAdmin = role === "AA4";
    const orgFilterLoginId = isSystemAdmin ? "" : loginId || "";

    const params = [
      st,
      st, // 상태 필터

      kw,
      kw,
      kw,
      kw, // 검색어 필터 (이벤트명 / 담당자 / 기관명)

      // 🔹 기관 필터 ('' 이면 필터 해제 => AA4)
      orgFilterLoginId,
      orgFilterLoginId,

      ob, // latest
      ob, // oldest
      ob, // name

      offset,
      sizeNum,
    ];

    const retRows = await conn.query(approvalSQL.eventPlanApprovalList, params);
    const rows = rowsFrom(retRows);

    const countParams = [
      st,
      st,
      kw,
      kw,
      kw,
      kw,
      orgFilterLoginId,
      orgFilterLoginId,
    ];

    const retCount = await conn.query(
      approvalSQL.eventPlanApprovalTotalCount,
      countParams
    );
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[approvalMapper] eventPlanApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| orderBy:",
      ob,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| orgFilterLoginId:",
      orgFilterLoginId,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

// 🔹 이벤트 결과 승인 요청 목록 조회 (페이징 + 검색/정렬)
async function eventResultApprovalList({
  page,
  size,
  keyword,
  state,
  orderBy,
  loginId,
  role,
}) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const ob = orderBy || "latest";

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    // 🔹 시스템 관리자(AA4)는 기관 필터 없이 전체, 기관 관리자(AA3)는 자기 기관만
    const isSystemAdmin = role === "AA4";
    const orgFilterLoginId = isSystemAdmin ? "" : loginId || "";

    const params = [
      st,
      st, // 상태 필터

      kw,
      kw,
      kw,
      kw, // 검색어 필터 (이벤트명 / 담당자 / 기관명)

      // 🔹 기관 필터 ('' 이면 필터 해제 => AA4)
      orgFilterLoginId,
      orgFilterLoginId,

      ob, // latest
      ob, // oldest
      ob, // name

      offset,
      sizeNum,
    ];

    const retRows = await conn.query(
      approvalSQL.eventResultApprovalList,
      params
    );
    const rows = rowsFrom(retRows);

    const countParams = [
      st,
      st,
      kw,
      kw,
      kw,
      kw,
      orgFilterLoginId,
      orgFilterLoginId,
    ];

    const retCount = await conn.query(
      approvalSQL.eventResultApprovalTotalCount,
      countParams
    );
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[approvalMapper] eventResultApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| orderBy:",
      ob,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| orgFilterLoginId:",
      orgFilterLoginId,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

// 🔹 후원 계획 승인 요청 목록 조회 (AE8, 페이징 + 검색/정렬)
async function sponsorshipPlanApprovalList({
  page,
  size,
  keyword,
  state,
  orderBy,
  loginId,
  role,
}) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const ob = orderBy || "latest";

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    // 🔹 시스템 관리자(AA4): 전체, 기관 관리자(AA3): 자기 기관만
    const isSystemAdmin = role === "AA4";
    const orgFilterLoginId = isSystemAdmin ? "" : loginId || "";

    // 💡 approvalSQL.sponsorshipPlanApprovalList 에 맞춘 파라미터
    const params = [
      st,
      st, // 상태 필터

      kw,
      kw,
      kw,
      kw, // 프로그램명 / 후원유형명 / 기관명

      // 기관 필터
      orgFilterLoginId,
      orgFilterLoginId,

      ob, // latest
      ob, // oldest
      ob, // name
      ob, // goal

      offset,
      sizeNum,
    ];

    const retRows = await conn.query(
      approvalSQL.sponsorshipPlanApprovalList,
      params
    );
    const rows = rowsFrom(retRows);

    const countParams = [
      st,
      st,
      kw,
      kw,
      kw,
      kw,
      orgFilterLoginId,
      orgFilterLoginId,
    ];

    const retCount = await conn.query(
      approvalSQL.sponsorshipPlanApprovalTotalCount,
      countParams
    );
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[approvalMapper] sponsorshipPlanApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| orderBy:",
      ob,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| orgFilterLoginId:",
      orgFilterLoginId,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

// 🔹 후원 결과 승인 요청 목록 조회 (AE9, 페이징 + 검색/정렬)
async function sponsorshipResultApprovalList({
  page,
  size,
  keyword,
  state,
  orderBy,
  loginId,
  role,
}) {
  const conn = await pool.getConnection();
  try {
    const st = state || "";
    const kw = keyword || "";
    const ob = orderBy || "latest";

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    // 시스템 관리자(AA4): 전체, 기관 관리자(AA3): 자기 기관만
    const isSystemAdmin = role === "AA4";
    const orgFilterLoginId = isSystemAdmin ? "" : loginId || "";

    // approvalSQL.sponsorshipResultApprovalList 의 ? 순서에 맞춘 파라미터
    const params = [
      st,
      st, // 상태 필터

      kw,
      kw,
      kw,
      kw, // 프로그램명 / 후원유형명 / 기관명

      // 기관 필터
      orgFilterLoginId,
      orgFilterLoginId,

      ob, // latest
      ob, // oldest
      ob, // name
      ob, // goal

      offset,
      sizeNum,
    ];

    const retRows = await conn.query(
      approvalSQL.sponsorshipResultApprovalList,
      params
    );
    const rows = rowsFrom(retRows);

    const countParams = [
      st,
      st,
      kw,
      kw,
      kw,
      kw,
      orgFilterLoginId,
      orgFilterLoginId,
    ];

    const retCount = await conn.query(
      approvalSQL.sponsorshipResultApprovalTotalCount,
      countParams
    );
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[approvalMapper] sponsorshipResultApprovalList rows:",
      rows.length,
      "| state:",
      st,
      "| keyword:",
      kw,
      "| orderBy:",
      ob,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| orgFilterLoginId:",
      orgFilterLoginId,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

module.exports = {
  managerApprovalList,
  updateApprovalState,
  findApprovalWithUser,
  staffApprovalList,
  updateApprovalStateForStaff,
  priorityApprovalList,
  supportPlanApprovalList,
  supportResultApprovalList,
  eventPlanApprovalList,
  eventResultApprovalList,
  sponsorshipPlanApprovalList,
  sponsorshipResultApprovalList,
};
