// server/mappers/counselMapper.js
const pool = require("../configs/db");
const sql = require("../sql/counselSql");

// BigInt → Number (JSON 직렬화 보호)
function safeJSON(v) {
  return JSON.parse(
    JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x))
  );
}

/**
 * 역할별 상담 목록
 * - role = 2(담당자): assi_by = userId 인 것만
 * - role = 3,4(관리자/시스템): 전체
 */
async function listCounselByRole(role, userId) {
  const conn = await pool.getConnection();
  try {
    let rows;

    if (role === 2) {
      // 담당자용: 내가 담당자로 배정된 상담만
      rows = await conn.query(sql.listCounselByAssignee, [userId]);
    } else if (role === 3 || role === 4) {
      // 관리자/시스템: 전체 상담
      rows = await conn.query(sql.listCounselAll);
    } else {
      // 기타 역할이면 일단 전체로 (필요시 정책 변경)
      rows = await conn.query(sql.listCounselAll);
    }

    return safeJSON(rows);
  } finally {
    conn.release();
  }
}

// 저장 / 수정 / 재수정
async function saveCounsel(body) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { submitCode, priority, mainForm, records } = body;

    // 1) 기존 상담 존재 여부 확인
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);

    let counsel_code;
    const now = new Date();

    if (exist.length === 0) {
      // 🔹 첫 작성: status = CB3(검토전)으로 신규 생성
      const res = await conn.query(sql.insertCounselNote, [
        submitCode, // submit_code
        "CB3",      // status
        now,        // written_at
      ]);
      counsel_code = res.insertId;
    } else {
      // 🔹 기존 상담 있음
      counsel_code = exist[0].counsel_code;
      const currentStatus = (exist[0].status || "").trim().toUpperCase();

      if (currentStatus === "CB4") {
        // ✅ 반려 상태에서 재수정하는 경우:
        //    - status는 CB4 유지
        //    - written_at만 갱신
        await conn.query(sql.updateCounselNoteKeepStatus, [
          now,          // written_at
          counsel_code, // WHERE counsel_code = ?
        ]);
      } else {
        // ✅ 일반 수정(예: CB2→CB3, CB3 수정 등):
        //    - status를 CB3(검토전)으로 맞추기
        await conn.query(sql.updateCounselNote, [
          "CB3",        // status
          now,          // written_at
          counsel_code,
        ]);
      }
    }

    // 2) 기존 상담 상세 삭제
    await conn.query(sql.deleteCounselDetails, [counsel_code]);

    // 3) 상담 상세 입력들 ... (기존 코드 그대로)
    for (const rec of records || []) {
      await conn.query(sql.insertCounselDetail, [
        counsel_code,
        rec.counselDate,
        rec.title,
        rec.content,
        null,
      ]);
    }

    if (mainForm && (mainForm.title || mainForm.content)) {
      await conn.query(sql.insertCounselDetail, [
        counsel_code,
        mainForm.counselDate,
        mainForm.title,
        mainForm.content,
        null,
      ]);
    }

    // 4) 우선순위 처리 ...
    await conn.query(sql.resetPriority, [submitCode]);
    await conn.query(sql.insertPriority, [submitCode, priority || "계획", "Y"]);

    // 5) 🔥 승인요청은 그대로 유지 (반려 재작성도 포함해서 항상 BA1 추가)
    await conn.query(sql.insertRequestApproval, [
      2,            // requester_code (담당자, 임시)
      1,            // processor_code (관리자, 임시)
      "AE3",        // approval_type
      "BA1",        // state (요청)
      "counsel_note",
      counsel_code,
    ]);

    await conn.commit();
    return safeJSON({
      counsel_code,
      mode: exist.length ? "update" : "insert",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}


// 상세보기 + 수정
async function getCounselDetail(submitCode) {
  const conn = await pool.getConnection();
  try {
    // 1) 헤더 + 기본 제출/작성자 정보
    const headerRows = await conn.query(sql.getCounselHeaderBySubmit, [
      submitCode,
    ]);

    if (!headerRows || headerRows.length === 0) {
      return null;
    }
    const h = headerRows[0];

    // 2) 상담 상세들
    const detailRows = await conn.query(sql.getCounselDetailsByCounsel, [
      h.counsel_code,
    ]);

    // 3) 우선순위
    const prRows = await conn.query(sql.getCurrentPriorityBySubmit, [
      submitCode,
    ]);
    const priority = prRows[0]?.level || "계획";

    // 메인 상담 하나 + 나머지 상세 배열로 분리 (첫 번째를 메인으로 사용)
    const mainDetail = detailRows[0] || null;
    const otherDetails = detailRows.slice(1);

    return safeJSON({
      submit_info: {
        name: h.writer_name,
        ssnFront: h.ssn_front,
        submitAt: h.submit_at,
      },
      main: mainDetail
        ? {
            counsel_date: mainDetail.counsel_date,
            title: mainDetail.title,
            content: mainDetail.content,
          }
        : {
            counsel_date: "",
            title: "",
            content: "",
          },
      details: otherDetails.map((d) => ({
        detail_code: d.detail_code,
        counsel_date: d.counsel_date,
        title: d.title,
        content: d.content,
      })),
      priority,
      status: h.status, // 여기 status는 counselSql에서 cn.status 선택한 값
    });
  } finally {
    conn.release();
  }
}

// 상담 승인 (request_approval.state = BA2 + counsel_note.status = CB5)
async function approveCounsel(submitCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) submitCode 로 counsel_code 찾기
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);
    if (!exist.length) {
      throw new Error("해당 제출코드의 상담이 존재하지 않습니다.");
    }
    const counselCode = exist[0].counsel_code;

    // 2) request_approval 상태 BA2로 업데이트
    const result = await conn.query(sql.updateApprovalApprove, [counselCode]);

    // 3) ✅ counsel_note.status = 'CB5' (검토완료) 로 변경
    await conn.query(sql.updateCounselNoteApprove, [counselCode]);

    await conn.commit();
    return safeJSON({ affectedRows: result.affectedRows });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 상담 반려 (request_approval.state = BA3 + rejection_reason + counsel_note.status = CB4)
async function rejectCounsel(submitCode, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) submitCode 로 counsel_code 찾기
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);
    if (!exist.length) {
      throw new Error("해당 제출코드의 상담이 존재하지 않습니다.");
    }
    const counselCode = exist[0].counsel_code;

    // 2) request_approval 상태 BA3로 + 반려사유
    const result = await conn.query(sql.updateApprovalReject, [
      reason || "",
      counselCode,
    ]);

    // 3) ✅ counsel_note.status = 'CB4' (반려) 로 변경
    await conn.query(sql.updateCounselNoteReject, [counselCode]);

    await conn.commit();
    return safeJSON({ affectedRows: result.affectedRows });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

//  반려 사유 조회
async function getRejectionReason(submitCode) {
  const conn = await pool.getConnection();
  try {
    // 1) submitCode 로 counsel_note 찾기
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);
    if (!exist || exist.length === 0) {
      // 해당 제출코드에 상담 자체가 없으면 null
      return null;
    }

    const counselCode = exist[0].counsel_code;

    // 2) request_approval 에서 반려 사유 조회
    const rows = await conn.query(sql.getRejectReasonByCounsel, [counselCode]);

    if (!rows || rows.length === 0) {
      // 반려 이력이 없으면 null
      return null;
    }

    // { rejection_reason: '...' } 형태로 리턴
    return safeJSON(rows[0]);
  } finally {
    conn.release();
  }
}

module.exports = {
  listCounselByRole,
  saveCounsel,
  getCounselDetail,
  approveCounsel,
  rejectCounsel,
  getRejectionReason,
};
