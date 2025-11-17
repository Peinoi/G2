// server/sql/supportResultSql.js
module.exports = {
  // 🔹 목록: 전체
  listSupportResultAll: `
    SELECT
      sr.result_code,
      sr.plan_code,
      sp.submit_code,
      sr.status,
      ss.submit_at,
      sp.written_at  AS plan_written_at,
      sr.written_at  AS result_written_at,
      writer.name    AS writer_name,
      assi.name      AS assi_name
    FROM support_result sr
    JOIN support_plan sp
      ON sp.plan_code = sr.plan_code
    JOIN survey_submission ss
      ON ss.submit_code = sp.submit_code
    JOIN users writer
      ON writer.user_code = ss.written_by
    LEFT JOIN users assi
      ON assi.user_code = sr.assi_by
    ORDER BY sr.result_code DESC
  `,

  // 🔹 목록: 담당자용
  listSupportResultByAssignee: `
    SELECT
      sr.result_code,
      sr.plan_code,
      sp.submit_code,
      sr.status,
      ss.submit_at,
      sp.written_at  AS plan_written_at,
      sr.written_at  AS result_written_at,
      writer.name    AS writer_name,
      assi.name      AS assi_name
    FROM support_result sr
    JOIN support_plan sp
      ON sp.plan_code = sr.plan_code
    JOIN survey_submission ss
      ON ss.submit_code = sp.submit_code
    JOIN users writer
      ON writer.user_code = ss.written_by
    LEFT JOIN users assi
      ON assi.user_code = sr.assi_by
    WHERE sr.assi_by = ?
    ORDER BY sr.result_code DESC
  `,

  // 🔹 목록: 일반 사용자용
  listSupportResultByWriter: `
    SELECT
      sr.result_code,
      sr.plan_code,
      sp.submit_code,
      sr.status,
      ss.submit_at,
      sp.written_at  AS plan_written_at,
      sr.written_at  AS result_written_at,
      writer.name      AS writer_name,
      assi.name        AS assi_name
    FROM support_result sr
    JOIN support_plan sp
      ON sp.plan_code = sr.plan_code
    JOIN survey_submission ss
      ON ss.submit_code = sp.submit_code
    JOIN users writer
      ON writer.user_code = ss.written_by
    LEFT JOIN users assi
      ON assi.user_code = sr.assi_by
    WHERE ss.written_by = ?
    ORDER BY sr.result_code DESC
  `,

  // 🔹 submit_code → plan_code, assi_by
  getPlanBySubmitCode: `
    SELECT
      sp.plan_code,
      sp.assi_by
    FROM support_plan sp
    WHERE sp.submit_code = ?
    ORDER BY sp.plan_code DESC
    LIMIT 1
  `,

  // 🔹 plan_code → support_result 한 건 (존재 여부 확인)
  getSupportResultByPlan: `
    SELECT
      result_code,
      plan_code,
      status,
      actual_from,
      actual_to,
      written_at,
      assi_by
    FROM support_result
    WHERE plan_code = ?
    ORDER BY result_code DESC
    LIMIT 1
  `,

  // 🔹 support_result 새로 insert
  insertSupportResult: `
    INSERT INTO support_result (
      plan_code,
      actual_from,
      actual_to,
      status,
      written_at,
      assi_by
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,

  // 🔹 support_result update (기존 행 있을 때)
  updateSupportResultByCode: `
    UPDATE support_result
    SET
      actual_from = ?,
      actual_to   = ?,
      status      = ?,
      written_at  = ?
    WHERE result_code = ?
  `,

  // 🔹 result_code 기준 기존 item 삭제
  deleteSupportResultItemsByResultCode: `
    DELETE FROM support_result_item
    WHERE result_code = ?
  `,

  // 🔹 새 결과 item insert
  insertSupportResultItem: `
    INSERT INTO support_result_item (
      result_code,
      item_title,
      content_for_user,
      content_for_org,
      written_at
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 🔹 첨부파일 insert (support_result용)
  insertAttachmentForResult: `
    INSERT INTO attachment (
      original_filename,
      server_filename,
      file_path,
      linked_table_name,
      linked_record_pk
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 🔹 첨부파일 한 건 삭제 (support_result용)
  deleteAttachmentByCodeForResult: `
    DELETE FROM attachment
    WHERE attach_code = ?
      AND linked_table_name = 'support_result'
  `,

  // 🔹 plan_code → support_result 헤더 (마지막 한 건)
  getSupportResultHeaderByPlan: `
    SELECT
      sr.result_code,
      sr.plan_code,
      sr.actual_from,
      sr.actual_to,
      sr.status,
      sr.written_at
    FROM support_result sr
    WHERE sr.plan_code = ?
    ORDER BY sr.result_code DESC
    LIMIT 1
  `,

  // 🔹 result_code → 결과 item들
  getSupportResultItemsByResultCode: `
    SELECT
      result_item_code,
      item_title,
      content_for_user,
      content_for_org,
      written_at
    FROM support_result_item
    WHERE result_code = ?
    ORDER BY result_item_code ASC
  `,

  // 🔹 result_code 기준 첨부파일 목록
  getAttachmentsBySupportResult: `
    SELECT
      attach_code,
      original_filename,
      server_filename,
      file_path
    FROM attachment
    WHERE linked_table_name = 'support_result'
      AND linked_record_pk = ?
    ORDER BY attach_code ASC
  `,

  // 🔹 resultCode로 지원결과 헤더 조회
  getSupportResultDetailByCode: `
    SELECT
      sr.result_code,
      sr.plan_code,
      sr.actual_from,
      sr.actual_to,
      sr.status,
      sr.written_at
    FROM support_result sr
    WHERE sr.result_code = ?
  `,

  // 🔹 resultCode로 지원결과 item들 조회 (메인 + 추가 결과)
  getSupportResultItemsByResultCode: `
    SELECT
      result_item_code,
      item_title,
      content_for_user,
      content_for_org,
      written_at
    FROM support_result_item
    WHERE result_code = ?
    ORDER BY result_item_code ASC
  `,

  // 🔹 resultCode 기준 첨부파일 목록 조회
  getAttachmentsBySupportResult: `
    SELECT
      attach_code,
      original_filename,
      server_filename,
      file_path
    FROM attachment
    WHERE linked_table_name = 'support_result'
      AND linked_record_pk = ?
    ORDER BY attach_code ASC
  `,

  // 🔹 result_code 기준으로 실제 진행기간만 수정 (수정 화면에서 사용)
  updateSupportResultPeriodByCode: `
    UPDATE support_result
    SET
      actual_from = ?,
      actual_to   = ?
    WHERE result_code = ?
  `,

  // 🔹 기존 결과 item들 삭제
  deleteSupportResultItemsByResultCode: `
    DELETE FROM support_result_item
    WHERE result_code = ?
  `,

  // 🔹 결과 item insert
  insertSupportResultItem: `
    INSERT INTO support_result_item (
      result_code,
      item_title,
      content_for_user,
      content_for_org,
      written_at
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 🔹 첨부파일 insert (plan과 공용으로 써도 됨)
  insertAttachment: `
    INSERT INTO attachment (
      original_filename,
      server_filename,
      file_path,
      linked_table_name,
      linked_record_pk
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 🔹 첨부파일 한 건 삭제 (support_result용)
  deleteAttachmentByCodeForResult: `
    DELETE FROM attachment
    WHERE attach_code = ?
      AND linked_table_name = 'support_result'
  `,
  // submit_code 기준으로 기본 정보 + 계획/결과 작성일 조회
  getResultBasicBySubmitCode: `
    SELECT
      ss.submit_code,
      u.name             AS writer_name,
      u.ssn              AS ssn,
      MIN(cn.written_at) AS counsel_submit_at,  -- 상담지 제출일 (옵션)
      MAX(sp.written_at) AS plan_submit_at,     -- 계획서 작성일
      MAX(sr.written_at) AS result_written_at   -- 결과 작성일(있다면)
    FROM survey_submission ss
    JOIN users u
      ON u.user_code = ss.written_by
    LEFT JOIN counsel_note cn
      ON cn.submit_code = ss.submit_code
    LEFT JOIN support_plan sp
      ON sp.submit_code = ss.submit_code
    LEFT JOIN support_result sr
      ON sr.plan_code = sp.plan_code
    WHERE ss.submit_code = ?
    GROUP BY
      ss.submit_code,
      u.name,
      u.ssn
  `,
};
