// server/mappers/supportResultMapper.js
const pool = require("../configs/db");
const sql = require("../sql/supportResultSql");

function safeJSON(v) {
  return JSON.parse(
    JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x))
  );
}

function decodeOriginalName(file) {
  return file?.originalname || "";
}

// 🔹 역할별 목록 (이미 만들었으면 그대로 두고, 아니면 참고용)
async function listSupportResultsByRole(role, userId) {
  const conn = await pool.getConnection();
  try {
    let rows;

    if (role === 1) {
      const writerUserCode = 1;
      rows = await conn.query(sql.listSupportResultByWriter, [writerUserCode]);
    } else if (role === 2) {
      const assiUserCode = 2;
      rows = await conn.query(sql.listSupportResultByAssignee, [assiUserCode]);
    } else {
      rows = await conn.query(sql.listSupportResultAll);
    }

    const mapped = rows.map((r) => ({
      resultCode: r.result_code,
      planCode: r.plan_code,
      submitCode: r.submit_code,
      status: r.status,
      submitAt: r.submit_at,
      writtenAt: r.plan_written_at,
      resultWrittenAt: r.result_written_at,
      writerName: r.writer_name,
      assiName: r.assi_name,
    }));

    return safeJSON(mapped);
  } finally {
    conn.release();
  }
}

// 지원자 정보
async function getResultBasic(submitCode) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql.getResultBasicBySubmitCode, [submitCode]);
    const row = rows[0];

    if (!row) {
      throw new Error(
        "해당 submit_code의 지원결과 기본 정보를 찾을 수 없습니다."
      );
    }

    return safeJSON({
      submitCode: row.submit_code,
      name: row.writer_name,
      ssnFront: row.ssn,
      counselSubmitAt: row.counsel_submit_at,
      planSubmitAt: row.plan_submit_at,
      resultWrittenAt: row.result_written_at,
    });
  } finally {
    conn.release();
  }
}
/**
 * 🔹 결과 최종 저장
 *  - 상태: CD4(검토중) 로 저장 (임시: CD1, 초기 자동생성: CD3)
 *  - support_result_item 갈아끼우고
 *  - 첨부파일 'support_result' 로 저장
 */
async function saveResultWithItems(formJson, files = []) {
  const { submitCode, mainForm, resultItems } = formJson;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 0) submitCode → plan_code + assi_by
    const [plan] = await conn.query(sql.getPlanBySubmitCode, [submitCode]);
    if (!plan || !plan.plan_code) {
      throw new Error("해당 제출건의 지원계획을 찾을 수 없습니다.");
    }

    const planCode = plan.plan_code;
    const assiBy = plan.assi_by || null;

    // 1) plan_code 기준으로 기존 support_result 있는지 확인
    const [existing] = await conn.query(sql.getSupportResultByPlan, [planCode]);

    const actualFrom =
      mainForm.actualStart && mainForm.actualStart.length === 7
        ? mainForm.actualStart + "-01"
        : null;
    const actualTo =
      mainForm.actualEnd && mainForm.actualEnd.length === 7
        ? mainForm.actualEnd + "-01"
        : null;
    const writtenAt =
      mainForm.resultDate || new Date().toISOString().slice(0, 10);
    const status = "CD4"; // 검토중(제출완료)

    let resultCode;

    if (existing && existing.result_code) {
      // 🔁 이미 support_result 있으면 update
      resultCode = existing.result_code;

      await conn.query(sql.updateSupportResultByCode, [
        actualFrom,
        actualTo,
        status,
        writtenAt,
        resultCode,
      ]);

      // 기존 item 싹 지우고 다시 insert
      await conn.query(sql.deleteSupportResultItemsByResultCode, [resultCode]);
    } else {
      // 🆕 새로 생성
      const insertRes = await conn.query(sql.insertSupportResult, [
        planCode,
        actualFrom,
        actualTo,
        status,
        writtenAt,
        assiBy,
      ]);
      resultCode = insertRes.insertId;
    }

    // 2) 메인 결과 + 추가 결과들을 support_result_item에 insert
    const allItems = [
      {
        goal: mainForm.goal,
        publicContent: mainForm.publicContent,
        privateContent: mainForm.privateContent,
      },
      ...(resultItems || []),
    ];

    for (const item of allItems) {
      await conn.query(sql.insertSupportResultItem, [
        resultCode,
        item.goal || "",
        item.publicContent || "",
        item.privateContent || "",
        writtenAt,
      ]);
    }

    // 3) 첨부파일 → attachment에 저장
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const originalName = decodeOriginalName(file);
        const serverName = file.filename;
        const filePath = `/uploads/results/${serverName}`;

        await conn.query(sql.insertAttachmentForResult, [
          originalName,
          serverName,
          filePath,
          "support_result",
          resultCode,
        ]);
      }
    }

    await conn.commit();
    return safeJSON({ resultCode });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * 🔹 결과 임시 저장
 *  - 상태: CD1
 *  - result_items 갈아끼우기
 *  - 첨부파일 임시저장/삭제 반영
 */
async function saveResultTemp(formJson, files = []) {
  const {
    submitCode,
    mainForm,
    resultItems,
    removedAttachCodes = [],
  } = formJson;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) submitCode → plan_code + assi_by
    const [plan] = await conn.query(sql.getPlanBySubmitCode, [submitCode]);
    if (!plan || !plan.plan_code) {
      throw new Error("해당 제출건의 지원계획을 찾을 수 없습니다.");
    }

    const planCode = plan.plan_code;
    const assiBy = plan.assi_by || null;

    // 2) plan_code 기준 기존 support_result 확인
    const [existing] = await conn.query(sql.getSupportResultByPlan, [planCode]);

    const actualFrom =
      mainForm.actualStart && mainForm.actualStart.length === 7
        ? mainForm.actualStart + "-01"
        : null;
    const actualTo =
      mainForm.actualEnd && mainForm.actualEnd.length === 7
        ? mainForm.actualEnd + "-01"
        : null;

    const writtenAt = null;
    const status = "CD1"; // 임시저장

    let resultCode;

    if (existing && existing.result_code) {
      // 이미 결과 있음 → 임시저장 상태로 갱신
      resultCode = existing.result_code;

      await conn.query(sql.updateSupportResultByCode, [
        actualFrom,
        actualTo,
        status,
        writtenAt,
        resultCode,
      ]);

      await conn.query(sql.deleteSupportResultItemsByResultCode, [resultCode]);
    } else {
      // 처음 임시저장 → support_result 생성
      const insertRes = await conn.query(sql.insertSupportResult, [
        planCode,
        actualFrom,
        actualTo,
        status,
        writtenAt,
        assiBy,
      ]);
      resultCode = insertRes.insertId;
    }

    // 3) 메인 + 추가 결과 item 저장
    const allItems = [
      {
        goal: mainForm.goal,
        publicContent: mainForm.publicContent,
        privateContent: mainForm.privateContent,
      },
      ...(resultItems || []),
    ];

    for (const item of allItems) {
      await conn.query(sql.insertSupportResultItem, [
        resultCode,
        item.goal || "",
        item.publicContent || "",
        item.privateContent || "",
        writtenAt,
      ]);
    }

    // 4) 삭제 예정 첨부 삭제
    if (Array.isArray(removedAttachCodes) && removedAttachCodes.length > 0) {
      for (const code of removedAttachCodes) {
        const id = Number(code);
        if (!id) continue;
        await conn.query(sql.deleteAttachmentByCodeForResult, [id]);
      }
    }

    // 5) 첨부파일 INSERT (새로 선택한 것들)
    if (Array.isArray(files) && files.length > 0) {
      const basePath = "/uploads/results";

      for (const f of files) {
        const originalName = decodeOriginalName(f);
        await conn.query(sql.insertAttachmentForResult, [
          originalName,
          f.filename,
          basePath + "/" + f.filename,
          "support_result",
          resultCode,
        ]);
      }
    }

    await conn.commit();
    return safeJSON({
      resultCode,
      status,
      mode: existing && existing.result_code ? "update-temp" : "insert-temp",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * 🔹 작성 화면 "불러오기" 데이터
 *  - submitCode → plan_code → support_result 헤더/아이템/첨부 조회
 */
async function getResultFormDataBySubmit(submitCode) {
  const conn = await pool.getConnection();
  try {
    // 1) submitCode → plan_code
    const [plan] = await conn.query(sql.getPlanBySubmitCode, [submitCode]);
    if (!plan || !plan.plan_code) {
      // 아직 계획/결과가 전혀 없을 때
      return safeJSON({
        main: null,
        items: [],
        attachments: [],
      });
    }
    const planCode = plan.plan_code;

    // 2) plan_code → support_result 헤더 (마지막 1건)
    const headers = await conn.query(sql.getSupportResultHeaderByPlan, [
      planCode,
    ]);
    const header = headers[0];

    if (!header) {
      // 결과 자체가 아직 없으면 빈 값
      return safeJSON({
        main: null,
        items: [],
        attachments: [],
      });
    }

    const resultCode = header.result_code;

    // 3) item들
    const items = await conn.query(sql.getSupportResultItemsByResultCode, [
      resultCode,
    ]);

    // 4) 첨부파일
    const attachments = await conn.query(sql.getAttachmentsBySupportResult, [
      resultCode,
    ]);

    const mainItem = items[0] || null;
    const extraItems = items.slice(1).map((it) => ({
      resultItemCode: it.result_item_code,
      goal: it.item_title || "",
      publicContent: it.content_for_user || "",
      privateContent: it.content_for_org || "",
    }));

    const main = {
      resultDate: header.written_at,
      actualStart: header.actual_from
        ? String(header.actual_from).slice(0, 7)
        : "",
      actualEnd: header.actual_to ? String(header.actual_to).slice(0, 7) : "",
      goal: mainItem?.item_title || "",
      publicContent: mainItem?.content_for_user || "",
      privateContent: mainItem?.content_for_org || "",
    };

    const attachList = attachments.map((a) => ({
      attachCode: a.attach_code,
      originalFilename: a.original_filename,
      url: a.file_path,
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

/**
 * 🔹 지원결과 상세 조회 (수정 화면)
 *  - header(support_result)
 *  - items(support_result_item)
 *  - attachments(attachment, linked_table_name='support_result')
 */
async function getResultDetail(resultCode) {
  const conn = await pool.getConnection();
  try {
    // 1) 헤더
    const headers = await conn.query(sql.getSupportResultDetailByCode, [
      resultCode,
    ]);
    const header = headers[0];
    if (!header) {
      throw new Error("지원결과를 찾을 수 없습니다.");
    }

    // 2) item들 (메인 + 추가 결과)
    const items = await conn.query(sql.getSupportResultItemsByResultCode, [
      resultCode,
    ]);

    // 3) 첨부파일
    const attachments = await conn.query(sql.getAttachmentsBySupportResult, [
      resultCode,
    ]);

    const mainItem = items[0] || null;
    const extraItems = items.slice(1).map((it) => ({
      resultItemCode: it.result_item_code,
      goal: it.item_title || "",
      publicContent: it.content_for_user || "",
      privateContent: it.content_for_org || "",
    }));

    const main = {
      resultDate: header.written_at, // YYYY-MM-DD
      actualStart: header.actual_from
        ? String(header.actual_from).slice(0, 7)
        : "",
      actualEnd: header.actual_to ? String(header.actual_to).slice(0, 7) : "",
      goal: mainItem?.item_title || "",
      publicContent: mainItem?.content_for_user || "",
      privateContent: mainItem?.content_for_org || "",
    };

    const attachList = attachments.map((a) => ({
      attachCode: a.attach_code,
      originalFilename: a.original_filename,
      url: a.file_path, // '/uploads/results/파일명...'
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

/**
 * 🔹 지원결과 수정 + 항목 + 첨부 업데이트
 *  - ResultEdit.vue 에서 넘어오는 formJson 구조 기준:
 *    { resultCode, planCode, submitCode, mainForm, resultItems, removedAttachCodes }
 */
async function updateResultWithItems(formJson, files) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { resultCode, mainForm, resultItems, removedAttachCodes } = formJson;

    const resultId = Number(resultCode);
    if (!resultId) {
      throw new Error("resultCode가 유효하지 않습니다.");
    }

    // 실제 진행기간 → actual_from / actual_to
    let actualFrom = null;
    let actualTo = null;

    if (mainForm?.actualStart && mainForm.actualStart.length === 7) {
      actualFrom = `${mainForm.actualStart}-01`;
    }
    if (mainForm?.actualEnd && mainForm.actualEnd.length === 7) {
      actualTo = `${mainForm.actualEnd}-01`;
    }

    // 1) support_result 기간만 업데이트 (status, written_at은 수정하지 않음)
    await conn.query(sql.updateSupportResultPeriodByCode, [
      actualFrom,
      actualTo,
      resultId,
    ]);

    // 2) 기존 item 전부 삭제
    await conn.query(sql.deleteSupportResultItemsByResultCode, [resultId]);

    // written_at
    const writtenAt =
      (mainForm?.resultDate && mainForm.resultDate.slice(0, 10)) ||
      new Date().toISOString().slice(0, 10);

    // 2-1) 메인 결과 insert
    await conn.query(sql.insertSupportResultItem, [
      resultId,
      mainForm?.goal || "",
      mainForm?.publicContent || "",
      mainForm?.privateContent || "",
      writtenAt,
    ]);

    // 2-2) 추가 결과들 insert
    if (Array.isArray(resultItems)) {
      for (const item of resultItems) {
        await conn.query(sql.insertSupportResultItem, [
          resultId,
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
        await conn.query(sql.deleteAttachmentByCodeForResult, [id]);
      }
    }

    // 4) 새로 업로드된 파일들 attachment에 insert
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const originalName = decodeOriginalName(file);
        const serverName = file.filename;
        const filePath = `/uploads/results/${serverName}`;

        await conn.query(sql.insertAttachment, [
          originalName,
          serverName,
          filePath,
          "support_result",
          resultId,
        ]);
      }
    }

    await conn.commit();
    return safeJSON({ resultCode: resultId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  listSupportResultsByRole,
  getResultBasic,
  saveResultWithItems,
  saveResultTemp,
  getResultFormDataBySubmit,
  getResultDetail,
  updateResultWithItems,
};
