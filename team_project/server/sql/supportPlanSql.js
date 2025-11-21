// server/sql/supportPlanSql.js
module.exports = {
  //시스템
  listSupportPlanAll: `
  SELECT
    sp.plan_code,
    sp.submit_code,
    sp.status,
    sp.written_at,
    ss.submit_at,
    c.child_name      AS child_name,     -- 🔥 지원자(자녀)
    writer.name       AS writer_name,    -- 보호자 이름
    assi.name         AS assi_name,
    org.org_name      AS org_name        -- 기관명
  FROM support_plan sp
  JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  LEFT JOIN child c                      -- 🔥 child join
    ON c.child_code = ss.child_code
  JOIN users writer
    ON writer.user_code = ss.written_by
  LEFT JOIN users assi
    ON assi.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = writer.org_code
  ORDER BY sp.plan_code DESC
`,

  //담당자 목록
  listSupportPlanByAssignee: `
  SELECT
    sp.plan_code,
    sp.submit_code,
    sp.status,
    sp.written_at,
    ss.submit_at,
    c.child_name      AS child_name,     -- 🔥 지원자(자녀)
    writer.name       AS writer_name,    -- 보호자 이름
    assi.name         AS assi_name,
    org.org_name      AS org_name
  FROM support_plan sp
  JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  LEFT JOIN child c
    ON c.child_code = ss.child_code
  JOIN users writer
    ON writer.user_code = ss.written_by
  LEFT JOIN users assi
    ON assi.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = writer.org_code
  WHERE ss.assi_by = ?
  ORDER BY sp.plan_code DESC
`,

  // 일반사용자
  listSupportPlanByWriter: `
  SELECT
    sp.plan_code,
    sp.submit_code,
    sp.status,
    sp.written_at,
    ss.submit_at,
    c.child_name      AS child_name,     -- 🔥 지원자(자녀)
    writer.name       AS writer_name,    -- 보호자 이름
    assi.name         AS assi_name,
    org.org_name      AS org_name
  FROM support_plan sp
  JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  LEFT JOIN child c
    ON c.child_code = ss.child_code
  JOIN users writer
    ON writer.user_code = ss.written_by
  LEFT JOIN users assi
    ON assi.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = writer.org_code
  WHERE ss.written_by = ?
  ORDER BY sp.plan_code DESC
`,

  //기관관리자
  listSupportPlanByOrg: `
  SELECT
    sp.plan_code,
    sp.submit_code,
    sp.status,
    sp.written_at,
    ss.submit_at,
    c.child_name      AS child_name,     -- 🔥 지원자(자녀)
    writer.name       AS writer_name,    -- 보호자 이름
    assi.name         AS assi_name,
    org.org_name      AS org_name
  FROM support_plan sp
  JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  LEFT JOIN child c
    ON c.child_code = ss.child_code
  JOIN users writer
    ON writer.user_code = ss.written_by
  LEFT JOIN users assi
    ON assi.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = writer.org_code
  WHERE org.org_code = ?
  ORDER BY sp.plan_code DESC
`,

  // 🔹 담당자 상단 테이블용 (counsel_note.status = 'CB5')
  listAssigneePlanCandidates: `
    SELECT
      ss.submit_code,
      ss.child_code,
      ss.submit_at,
      c.child_name           AS child_name,
      writer.name            AS writer_name
    FROM survey_submission ss
    JOIN counsel_note cn
      ON cn.submit_code = ss.submit_code
    LEFT JOIN child c
      ON c.child_code = ss.child_code
    JOIN users writer
      ON writer.user_code = ss.written_by
    WHERE
      ss.assi_by = ?
      AND cn.status = 'CB5'
    GROUP BY
      ss.submit_code,
      ss.child_code,
      ss.submit_at,
      c.child_name,
      writer.name
    ORDER BY
      ss.submit_at DESC
  `,

  //기본정보
  getPlanBasicBySubmitCode: `
SELECT
  ss.submit_code,

  -- 작성자(보호자/본인)
  writer.name AS writer_name,

  -- 아동(지원자)
  child.child_name AS child_name,
  COALESCE(child.disability_type, writer.disability_type) AS disability_type,

  -- 담당자
  assi.name AS assignee_name,

  -- 상담지 제출일
  MIN(cn.written_at) AS counsel_submit_at

FROM survey_submission ss
JOIN users writer
  ON writer.user_code = ss.written_by

LEFT JOIN child
  ON child.child_code = ss.child_code

LEFT JOIN users assi
  ON assi.user_code = ss.assi_by   -- ⭐ 담당자 조인 추가

LEFT JOIN counsel_note cn
  ON cn.submit_code = ss.submit_code

WHERE ss.submit_code = ?

GROUP BY
  ss.submit_code,
  writer.name,
  child.child_name,
  COALESCE(child.disability_type, writer.disability_type),
  assi.name;
`,

  // submit_code로 support_plan 있는지 확인
  getSupportPlanBySubmitCode: `
    SELECT
      plan_code,
      assi_by
    FROM support_plan
    WHERE submit_code = ?
    LIMIT 1
  `,

  // support_plan 새로 insert
  insertSupportPlan: `
    INSERT INTO support_plan (
      submit_code,
      plan_from,
      plan_to,
      status,
      written_at,
      assi_by
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,

  // support_plan update (기존 행 있을 때)
  updateSupportPlanByCode: `
    UPDATE support_plan
    SET
      plan_from = ?,
      plan_to   = ?,
      status    = ?,
      written_at = ?
    WHERE plan_code = ?
  `,

  // 기존 item들 삭제 (간단하게 전체 갈아끼우는 방식)
  deleteSupportPlanItemsByPlanCode: `
    DELETE FROM support_plan_item
    WHERE plan_code = ?
  `,

  // 새 item insert
  insertSupportPlanItem: `
    INSERT INTO support_plan_item (
      plan_code,
      item_title,
      content_for_user,
      content_for_org,
      written_at
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 첨부파일 insert
  insertAttachment: `
    INSERT INTO attachment (
      original_filename,
      server_filename,
      file_path,
      linked_table_name,
      linked_record_pk
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 🔹 planCode로 지원계획 헤더 조회
  getSupportPlanDetailByCode: `
    SELECT
      sp.plan_code,
      sp.submit_code,
      sp.plan_from,
      sp.plan_to,
      sp.status,
      sp.written_at
    FROM support_plan sp
    WHERE sp.plan_code = ?
  `,

  // 🔹 planCode로 지원계획 item들 조회 (메인 + 추가 계획)
  getSupportPlanItemsByPlanCode: `
    SELECT
      plan_item_code,
      item_title,
      content_for_user,
      content_for_org,
      written_at
    FROM support_plan_item
    WHERE plan_code = ?
    ORDER BY plan_item_code ASC
  `,

  // 🔹 planCode 기준 첨부파일 목록 조회
  getAttachmentsBySupportPlan: `
    SELECT
      attach_code,
      original_filename,
      server_filename,
      file_path
    FROM attachment
    WHERE linked_table_name = 'support_plan'
      AND linked_record_pk = ?
    ORDER BY attach_code ASC
  `,

  // 🔹 plan_code 기준으로 계획 기간만 조회 (history before/after용)
  getSupportPlanPeriodByCode: `
    SELECT
      plan_from,
      plan_to
    FROM support_plan
    WHERE plan_code = ?
    LIMIT 1
  `,

  // 🔹 plan_code 기준으로 계획 기간만 수정 (수정 화면에서 사용)
  updateSupportPlanPeriodByCode: `
    UPDATE support_plan
    SET
      plan_from = ?,
      plan_to   = ?
    WHERE plan_code = ?
  `,

  // 🔹 첨부파일 한 건 삭제 (삭제 예정 처리된 것)
  deleteAttachmentByCode: `
    DELETE FROM attachment
    WHERE attach_code = ?
      AND linked_table_name = 'support_plan'
  `,

  //임시저장 불러오기
  getSupportPlanHeaderBySubmit: `
    SELECT
      plan_code,
      submit_code,
      plan_from,
      plan_to,
      status,
      written_at
    FROM support_plan
    WHERE submit_code = ?
    ORDER BY plan_code DESC
    LIMIT 1
  `,

  // 🔹 임시저장 상태의 첨부 한 건 삭제 (예전 로직용 - 현재는 안 쓸 수도 있음)
  deleteTempAttachmentByCode: `
  DELETE FROM attachment
  WHERE linked_table_name = 'support_plan_temp'
    AND linked_record_pk = ?
    AND attach_code = ?
`,

  getSupportPlanByCode: `
    SELECT *
    FROM support_plan
    WHERE plan_code = ?
    LIMIT 1
  `,

  // 지원계획 상태변경
  updateSupportPlanStatus: `
    UPDATE support_plan
    SET status = ?
    WHERE plan_code = ?
  `,

  // 🔹 submit_code로 survey_submission의 assi_by(담당자) 조회
  getAssigneeBySubmit: `
    SELECT assi_by
    FROM survey_submission
    WHERE submit_code = ?
    LIMIT 1
  `,

  // 🔹 해당 support_plan(plan_code)에 대한 승인요청이 이미 있는지 체크
  getApprovalForPlan: `
    SELECT approval_code
    FROM request_approval
    WHERE linked_table_name = 'support_plan'
      AND linked_record_pk = ?
      AND approval_type = 'AE4'
      AND state IN ('BA1', 'BA2', 'BA3')
    LIMIT 1
  `,

  // 🔹 지원계획(support_plan) 승인요청 INSERT
  insertRequestApprovalForPlan: `
    INSERT INTO request_approval (
      requester_code,
      processor_code,
      approval_type,
      request_date,
      approval_date,
      state,
      rejection_reason,
      linked_table_name,
      linked_record_pk
    ) VALUES (
      ?,          -- requester_code (담당자 user_code)
      ?,          -- processor_code (임시: 1)
      ?,          -- approval_type (AE4)
      CURDATE(),  -- request_date
      NULL,       -- approval_date
      ?,          -- state (BA1: 요청)
      NULL,       -- rejection_reason
      ?,          -- linked_table_name ('support_plan')
      ?           -- linked_record_pk (plan_code)
    )
  `,

  // 🔹 지원계획 승인요청 → 승인(BA2)
  updateApprovalApproveForPlan: `
  UPDATE request_approval
  SET
    state = 'BA2',              -- 승인
    approval_date = CURDATE(),
    processor_code = ?,         
    rejection_reason = NULL
  WHERE linked_table_name = 'support_plan'
    AND linked_record_pk = ?
    AND approval_type = 'AE4'
    AND state = 'BA1'
`,

  // 🔹 지원계획 승인요청 → 반려(BA3)
  updateApprovalRejectForPlan: `
    UPDATE request_approval
    SET
      state = 'BA3',          -- 반려
      approval_date = CURDATE(),
      rejection_reason = ?
    WHERE linked_table_name = 'support_plan'
      AND linked_record_pk = ?
      AND approval_type = 'AE4'
      AND state = 'BA1'
  `,

  // 반려사유 + 반려일자
  getRejectReasonByPlan: `
  SELECT
    rejection_reason,
    approval_date AS rejection_date
  FROM request_approval
  WHERE linked_table_name = 'support_plan'
    AND linked_record_pk = ?
    AND approval_type = 'AE4'
    AND state = 'BA3'      -- 반려 상태
  ORDER BY
    approval_date DESC,
    request_date DESC,
    approval_code DESC
  LIMIT 1
`,

  // 🔹 plan_code 로 support_result 이미 있는지 확인
  getSupportResultByPlan: `
    SELECT
      result_code
    FROM support_result
    WHERE plan_code = ?
    LIMIT 1
  `,

  // 🔹 지원계획 승인 시 support_result 헤더 자동 생성
  insertSupportResultFromPlan: `
    INSERT INTO support_result (
      plan_code,
      actual_from,
      actual_to,
      status,
      written_at,
      assi_by
    ) VALUES (
      ?,          -- plan_code
      NULL,       -- actual_from (추후 결과작성 시 채움)
      NULL,       -- actual_to   (추후 결과작성 시 채움)
      'CD3',      -- 초기 상태: 지원중(작성 중)
      NULL,  
      ?           -- assi_by: support_plan.assi_by
    )
  `,
};
