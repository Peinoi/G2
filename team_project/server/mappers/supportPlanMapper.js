const pool = require("../configs/db");
const sql = require("../sql/supportPlanSql");

function safeJSON(v) {
  return JSON.parse(
    JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x))
  );
}

// 🔹 multer가 한글 파일명을 latin1로 줄 때 대비해서 복원해주는 헬퍼
function decodeOriginalName(file) {
  return file?.originalname || "";
}

async function listSupportPlansByRole(role, userId) {
  const conn = await pool.getConnection();
  try {
    let rows;

    if (role === 1) {
      // 🔹 일반 사용자: user_code = 1 이라고 가정
      const writerUserCode = 1;
      rows = await conn.query(sql.listSupportPlanByWriter, [writerUserCode]);
    } else if (role === 2) {
      // 🔹 담당자: user_code = 2 이라고 가정
      const assiUserCode = 2;
      rows = await conn.query(sql.listSupportPlanByAssignee, [assiUserCode]);
    } else {
      // 🔹 관리자(3), 시스템(4): 전체
      rows = await conn.query(sql.listSupportPlanAll);
    }

    const mapped = rows.map((r) => ({
      planCode: r.plan_code,
      submitCode: r.submit_code,
      status: r.status,
      writtenAt: r.written_at,
      submitAt: r.submit_at,
      writerName: r.writer_name,
      assiName: r.assi_name,
    }));

    return safeJSON(mapped);
  } finally {
    conn.release();
  }
}

// 🔹 작성 화면에서 기본정보 불러오기
async function getPlanBasic(submitCode) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql.getPlanBasicBySubmitCode, [submitCode]);
    const row = rows[0];

    if (!row) {
      throw new Error("해당 submit_code의 정보를 찾을 수 없습니다.");
    }

    return safeJSON({
      submitCode: row.submit_code,
      name: row.writer_name,
      ssnFront: row.ssn,
      counselSubmitAt: row.counsel_submit_at,
    });
  } finally {
    conn.release();
  }
}

// 🔹 계획서 저장 (최초 저장 / 제출)
async function savePlanWithItems(formJson, files) {
  const { submitCode, mainForm, planItems } = formJson;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 0) 담당자 user_code 가져오기 (survey_submission.assi_by)
    const assiRow = await conn.query(sql.getAssigneeBySubmit, [submitCode]);
    const assiInfo = assiRow[0];
    const assiByFromSubmit = assiInfo ? assiInfo.assi_by : null;

    // 1) 기존 support_plan 있는지 확인
    const [existing] = await conn.query(sql.getSupportPlanBySubmitCode, [
      submitCode,
    ]);

    // YYYY-MM → YYYY-MM-01 형태로 저장
    const planFrom =
      mainForm.expectedStart && mainForm.expectedStart.length === 7
        ? mainForm.expectedStart + "-01"
        : null;
    const planTo =
      mainForm.expectedEnd && mainForm.expectedEnd.length === 7
        ? mainForm.expectedEnd + "-01"
        : null;
    const writtenAt = mainForm.planDate || new Date();
    const status = "CC3"; // 작성 완료(제출)

    let planCode;
    let assiBy = null;

    if (existing && existing.plan_code) {
      // 🔁 이미 support_plan 있으면 update
      planCode = existing.plan_code;
      // 기존에 assi_by가 있으면 유지, 없으면 submit에서 가져온 값 사용
      assiBy = existing.assi_by || assiByFromSubmit || null;

      await conn.query(sql.updateSupportPlanByCode, [
        planFrom,
        planTo,
        status,
        writtenAt,
        planCode,
      ]);

      // 기존 item 싹 지우고 다시 insert
      await conn.query(sql.deleteSupportPlanItemsByPlanCode, [planCode]);
    } else {
      // 🆕 support_plan 새로 생성
      assiBy = assiByFromSubmit || null;

      const result = await conn.query(sql.insertSupportPlan, [
        submitCode,
        planFrom,
        planTo,
        status,
        writtenAt,
        assiBy,
      ]);
      planCode = result.insertId;
    }

    // 2) 메인 계획 + 추가 계획들을 support_plan_item에 insert
    const allItems = [
      {
        goal: mainForm.goal,
        publicContent: mainForm.publicContent,
        privateContent: mainForm.privateContent,
      },
      ...(planItems || []),
    ];

    for (const item of allItems) {
      await conn.query(sql.insertSupportPlanItem, [
        planCode,
        item.goal,
        item.publicContent,
        item.privateContent,
        writtenAt,
      ]);
    }

    // 3) 첨부파일 → attachment에 저장
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const originalName = Buffer.from(file.originalname, "latin1").toString(
          "utf8"
        );
        const serverName = file.filename;
        const filePath = `/uploads/plans/${serverName}`;

        await conn.query(sql.insertAttachment, [
          originalName,
          serverName,
          filePath,
          "support_plan",
          planCode,
        ]);
      }
    }

    // 4) ✅ request_approval에 승인 요청 한 줄 넣기
    //    - requester_code : 담당자 user_code (assi_by)
    //    - processor_code : 1 (임시)
    //    - approval_type  : 'AE4'
    //    - state          : 'BA1' (요청)
    //    - linked_table_name : 'support_plan'
    //    - linked_record_pk  : planCode

    // (선택) 이미 승인요청이 있는지 체크해서 중복 방지
    const [existReq] = await conn.query(sql.getApprovalForPlan, [planCode]);

    if (!existReq) {
      const requesterCode = assiBy || assiByFromSubmit || null;

      await conn.query(sql.insertRequestApprovalForPlan, [
        requesterCode,
        1, // processor_code (임시 관리자 1)
        "AE4",
        "BA1",
        "support_plan",
        planCode,
      ]);
    }

    await conn.commit();
    return safeJSON({ planCode });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 상세 조회
async function getPlanDetail(planCode) {
  const conn = await pool.getConnection();
  try {
    // 1) 헤더
    const headers = await conn.query(sql.getSupportPlanDetailByCode, [
      planCode,
    ]);
    const header = headers[0];
    if (!header) {
      throw new Error("지원계획을 찾을 수 없습니다.");
    }

    // 2) item들 (메인 + 추가 계획)
    const items = await conn.query(sql.getSupportPlanItemsByPlanCode, [
      planCode,
    ]);

    // 3) 첨부파일
    const attachments = await conn.query(sql.getAttachmentsBySupportPlan, [
      planCode,
    ]);

    const mainItem = items[0] || null;
    const extraItems = items.slice(1).map((it) => ({
      planItemCode: it.plan_item_code,
      goal: it.item_title || "",
      publicContent: it.content_for_user || "",
      privateContent: it.content_for_org || "",
    }));

    const main = {
      planDate: header.written_at, // YYYY-MM-DD
      expectedStart: header.plan_from
        ? String(header.plan_from).slice(0, 7)
        : "",
      expectedEnd: header.plan_to ? String(header.plan_to).slice(0, 7) : "",
      goal: mainItem?.item_title || "",
      publicContent: mainItem?.content_for_user || "",
      privateContent: mainItem?.content_for_org || "",
    };

    const attachList = attachments.map((a) => ({
      attachCode: a.attach_code,
      originalFilename: a.original_filename,
      url: a.file_path, // '/uploads/plans/파일명...'
    }));

    return safeJSON({
      status: header.status,
      main,
      items: extraItems,
      attachments: attachList,
    });
  } finally {
    conn.release();
  }
}

// 🔹 지원계획 수정 + 항목 + 첨부 업데이트
async function updatePlanWithItems(formJson, files) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { planCode, mainForm, planItems, removedAttachCodes } = formJson;

    const planId = Number(planCode);
    if (!planId) {
      throw new Error("planCode가 유효하지 않습니다.");
    }

    // 예상 진행기간 → plan_from / plan_to
    let planFrom = null;
    let planTo = null;

    if (mainForm?.expectedStart && mainForm.expectedStart.length === 7) {
      planFrom = `${mainForm.expectedStart}-01`;
    }
    if (mainForm?.expectedEnd && mainForm.expectedEnd.length === 7) {
      planTo = `${mainForm.expectedEnd}-01`;
    }

    // 1) support_plan 기간 업데이트
    await conn.query(sql.updateSupportPlanPeriodByCode, [
      planFrom,
      planTo,
      planId,
    ]);

    // 2) 기존 item 전부 삭제
    await conn.query(sql.deleteSupportPlanItemsByPlanCode, [planId]);

    // written_at
    const writtenAt =
      (mainForm?.planDate && mainForm.planDate.slice(0, 10)) ||
      new Date().toISOString().slice(0, 10);

    // 2-1) 메인 계획 insert
    await conn.query(sql.insertSupportPlanItem, [
      planId,
      mainForm?.goal || "",
      mainForm?.publicContent || "",
      mainForm?.privateContent || "",
      writtenAt,
    ]);

    // 2-2) 추가 계획들 insert
    if (Array.isArray(planItems)) {
      for (const item of planItems) {
        await conn.query(sql.insertSupportPlanItem, [
          planId,
          item.goal || "",
          item.publicContent || "",
          item.privateContent || "",
          writtenAt,
        ]);
      }
    }

    // 3) 삭제 예정 첨부 삭제
    if (Array.isArray(removedAttachCodes) && removedAttachCodes.length > 0) {
      for (const code of removedAttachCodes) {
        const id = Number(code);
        if (!id) continue;
        await conn.query(sql.deleteAttachmentByCode, [id]);
      }
    }

    // 4) 새로 업로드된 파일들 attachment에 insert
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const originalName = decodeOriginalName(file);
        const serverName = file.filename;
        const filePath = `/uploads/plans/${serverName}`;

        await conn.query(sql.insertAttachment, [
          originalName,
          serverName,
          filePath,
          "support_plan",
          planId,
        ]);
      }
    }

    await conn.commit();
    return safeJSON({ planCode: planId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 계획서 임시 저장 (작성 화면)
async function savePlanTemp(formJson, files = []) {
  const {
    submitCode,
    mainForm,
    planItems,
    removedAttachCodes = [], // 🔥 추가 : 작성 화면에서 삭제한 첨부들
  } = formJson;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 기존 support_plan 있는지 확인
    const [existing] = await conn.query(sql.getSupportPlanBySubmitCode, [
      submitCode,
    ]);

    // YYYY-MM → YYYY-MM-01
    const planFrom =
      mainForm.expectedStart && mainForm.expectedStart.length === 7
        ? mainForm.expectedStart + "-01"
        : null;
    const planTo =
      mainForm.expectedEnd && mainForm.expectedEnd.length === 7
        ? mainForm.expectedEnd + "-01"
        : null;

    const writtenAt = mainForm.planDate || new Date();
    const status = "CC1"; // 임시저장 상태

    let planCode;
    let assiBy = null;

    if (existing && existing.plan_code) {
      // 🔁 이미 계획 있음 → 임시저장 상태로 덮어쓰기
      planCode = existing.plan_code;
      assiBy = existing.assi_by || null;

      await conn.query(sql.updateSupportPlanByCode, [
        planFrom,
        planTo,
        status,
        writtenAt,
        planCode,
      ]);

      // 기존 item 싹 지우고 다시 넣기
      await conn.query(sql.deleteSupportPlanItemsByPlanCode, [planCode]);
    } else {
      // 🆕 처음 임시저장할 때 support_plan 생성
      const result = await conn.query(sql.insertSupportPlan, [
        submitCode,
        planFrom,
        planTo,
        status,
        writtenAt,
        assiBy,
      ]);
      planCode = result.insertId;
    }

    // 2) 메인 + 추가 계획 item 저장
    const allItems = [
      {
        goal: mainForm.goal,
        publicContent: mainForm.publicContent,
        privateContent: mainForm.privateContent,
      },
      ...(planItems || []),
    ];

    for (const item of allItems) {
      await conn.query(sql.insertSupportPlanItem, [
        planCode,
        item.goal,
        item.publicContent,
        item.privateContent,
        writtenAt,
      ]);
    }

    // 3) 🔥 작성 화면에서 삭제한 기존 첨부 삭제
    if (Array.isArray(removedAttachCodes) && removedAttachCodes.length > 0) {
      for (const code of removedAttachCodes) {
        const id = Number(code);
        if (!id) continue;
        await conn.query(sql.deleteAttachmentByCode, [id]);
      }
    }

    // 4) 첨부파일 INSERT (새로 선택한 것들)
    if (Array.isArray(files) && files.length > 0) {
      const basePath = "/uploads/plans";

      for (const f of files) {
        const originalName = decodeOriginalName(f);
        await conn.query(sql.insertAttachment, [
          originalName,
          f.filename,
          basePath + "/" + f.filename,
          "support_plan",
          planCode,
        ]);
      }
    }

    await conn.commit();
    return safeJSON({
      planCode,
      status,
      mode: existing && existing.plan_code ? "update-temp" : "insert-temp",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 작성 화면에서 "불러오기" 할 때 사용하는 데이터
async function getPlanFormDataBySubmit(submitCode) {
  const conn = await pool.getConnection();
  try {
    // 1) submit_code 로 support_plan 헤더 찾기 (임시저장/작성 완료 통합)
    const headers = await conn.query(sql.getSupportPlanHeaderBySubmit, [
      submitCode,
    ]);
    const header = headers[0];

    if (!header) {
      // 아직 작성/임시저장된 계획이 없는 경우
      return safeJSON({
        main: null,
        items: [],
        attachments: [],
      });
    }

    const planCode = header.plan_code;

    // 2) item들
    const items = await conn.query(sql.getSupportPlanItemsByPlanCode, [
      planCode,
    ]);

    // 3) 첨부파일
    const attachments = await conn.query(sql.getAttachmentsBySupportPlan, [
      planCode,
    ]);

    const mainItem = items[0] || null;
    const extraItems = items.slice(1).map((it) => ({
      planItemCode: it.plan_item_code,
      goal: it.item_title || "",
      publicContent: it.content_for_user || "",
      privateContent: it.content_for_org || "",
    }));

    const main = {
      planDate: header.written_at,
      expectedStart: header.plan_from
        ? String(header.plan_from).slice(0, 7)
        : "",
      expectedEnd: header.plan_to ? String(header.plan_to).slice(0, 7) : "",
      goal: mainItem?.item_title || "",
      publicContent: mainItem?.content_for_user || "",
      privateContent: mainItem?.content_for_org || "",
    };

    const attachList = attachments.map((a) => ({
      attachCode: a.attach_code,
      originalFilename: a.original_filename,
      url: a.file_path, // '/uploads/plans/파일명_날짜.hwp'
    }));

    return safeJSON({
      main,
      items: extraItems,
      attachments: attachList,
    });
  } finally {
    conn.release();
  }
}

// 🔹 지원계획 승인 (CC4 + request_approval BA2 + support_result 생성)
async function approveSupportPlan(planCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const planId = Number(planCode);
    if (!planId) {
      throw new Error("유효한 planCode가 아닙니다.");
    }

    // 1) support_plan 상태 CC4(승인)로 변경
    await conn.query(sql.updateSupportPlanStatus, ["CC4", planId]);

    // 2) request_approval 상태 BA2(승인)로 변경
    const result = await conn.query(sql.updateApprovalApproveForPlan, [planId]);

    // 3) ✅ support_result 헤더 자동 생성 (이미 있으면 생성 안 함)
    const [existingResult] = await conn.query(sql.getSupportResultByPlan, [
      planId,
    ]);

    if (!existingResult) {
      // plan 정보에서 assi_by 가져오기
      const [planRow] = await conn.query(sql.getSupportPlanByCode, [planId]);
      if (!planRow) {
        throw new Error("지원계획 정보를 찾을 수 없습니다.");
      }

      const assiBy = planRow.assi_by || null;

      // support_result 에 CD3 상태로 한 줄 생성
      await conn.query(sql.insertSupportResultFromPlan, [planId, assiBy]);
    }

    await conn.commit();
    return safeJSON({
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 지원계획 반려 (CC7 + request_approval BA3 + 사유)
async function rejectSupportPlan(planCode, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const planId = Number(planCode);
    if (!planId) {
      throw new Error("유효한 planCode가 아닙니다.");
    }

    // 1) support_plan 상태 CC7(반려)로 변경
    await conn.query(sql.updateSupportPlanStatus, ["CC7", planId]);

    // 2) request_approval 상태 BA3(반려) + 사유 업데이트
    const result = await conn.query(sql.updateApprovalRejectForPlan, [
      reason || "",
      planId,
    ]);

    await conn.commit();
    return safeJSON({
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 지원계획(plan)에 대한 반려 사유 조회
async function getRejectionReason(planCode) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql.getRejectReasonByPlan, [planCode]);

    if (!rows || rows.length === 0) {
      // 반려 이력이 없으면 null
      return null;
    }

    // { rejection_reason: '...' } 형태
    return safeJSON(rows[0]);
  } finally {
    conn.release();
  }
}

//재승인 신청
async function resubmitPlan(planCode, requesterCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 현재 support_plan 확인 (상태/submit_code 등 필요하면 여기서 확인)
    const [plan] = await conn.query(sql.getSupportPlanByCode, [planCode]);
    if (!plan) {
      throw new Error("해당 plan_code의 지원계획을 찾을 수 없습니다.");
    }

    // (옵션) 진짜 반려 상태(CC7)일 때만 허용하고 싶으면 체크
    if ((plan.status || "").trim().toUpperCase() !== "CC7") {
      // 필요 없으면 이 if 블록 삭제해도 됨
      console.warn(
        "[resubmitPlan] CC7이 아닌 상태에서 재승인요청 시도:",
        plan.status
      );
    }

    // 2) support_plan 상태를 CC6(재승인요청)으로 변경
    await conn.query(sql.updateSupportPlanStatus, ["CC6", planCode]);

    // 3) request_approval에 새 승인요청 INSERT
    await conn.query(sql.insertRequestApprovalForPlan, [
      requesterCode, // requester_code (담당자)
      1, // processor_code (관리자, 임시)
      "AE4", // approval_type
      "BA1", // state: 요청
      "support_plan",
      planCode, // linked_record_pk = plan_code
    ]);

    await conn.commit();
    return safeJSON({
      planCode,
      status: "CC6",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  listSupportPlansByRole,
  getPlanBasic,
  savePlanWithItems,
  getPlanDetail,
  updatePlanWithItems,
  savePlanTemp,
  getPlanFormDataBySubmit,
  rejectSupportPlan,
  approveSupportPlan,
  getRejectionReason,
  resubmitPlan,
};
