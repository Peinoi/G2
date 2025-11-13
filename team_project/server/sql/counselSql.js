// server/sql/counselSql.js
module.exports = {
  /**
   * 담당자(role=2)용 상담 목록
   * - survey_submission, users(작성자/담당자), counsel_note 조인
   * - assi_by = ? 조건
   */
  listCounselByAssignee: `
    SELECT
      ss.submit_code,
      writer.name AS writer_name,
      assi.name   AS assi_name,
      ss.submit_at,
      cd.counsel_date,
      cn.written_at AS note_created_at,
      cn.status AS status
    FROM survey_submission ss
    JOIN users writer
      ON writer.user_code = ss.written_by
    LEFT JOIN users assi
      ON assi.user_code = ss.assi_by
    LEFT JOIN counsel_note cn              -- 🔵 LEFT JOIN 으로 변경
      ON cn.submit_code = ss.submit_code
    LEFT JOIN counsel_detail cd
      ON cd.counsel_code = cn.counsel_code
    WHERE ss.assi_by = ?
    ORDER BY
      ss.submit_code
  `,

  // 관리자 / 시스템용
  listCounselAll: `
    SELECT
      ss.submit_code,
      writer.name AS writer_name,
      assi.name   AS assi_name,
      ss.submit_at,
      cd.counsel_date,
      cn.written_at AS note_created_at,
      cn.status AS status  
    FROM survey_submission ss
    JOIN users writer
      ON writer.user_code = ss.written_by
    LEFT JOIN users assi
      ON assi.user_code = ss.assi_by
    LEFT JOIN counsel_note cn              -- 🔵 여기도 LEFT JOIN
      ON cn.submit_code = ss.submit_code
    LEFT JOIN counsel_detail cd
      ON cd.counsel_code = cn.counsel_code
    ORDER BY
      ss.submit_code
  `,
  // 상담 존재 여부
  getCounselBySubmit: `
    SELECT * FROM counsel_note WHERE submit_code = ?
  `,

  // 상담 메인 INSERT
  insertCounselNote: `
    INSERT INTO counsel_note (
      submit_code, status, written_at
    )
    VALUES (?, ?, ?)
  `,

  // 상담 메인 UPDATE
  updateCounselNote: `
    UPDATE counsel_note
    SET status = ?, written_at = ?
    WHERE counsel_code = ?
  `,
  
//상담 재수정 
  updateCounselNoteKeepStatus: `
    UPDATE counsel_note
    SET written_at = ?
    WHERE counsel_code = ?
  `,

  // 상담 상세 삭제
  deleteCounselDetails: `
    DELETE FROM counsel_detail WHERE counsel_code = ?
  `,

  // 상담 상세 INSERT
  insertCounselDetail: `
    INSERT INTO counsel_detail (
      counsel_code, counsel_date, title, content, attach_code
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 우선순위 초기화
  resetPriority: `
    UPDATE case_priority
    SET is_current = 'N'
    WHERE submit_code = ?
  `,

  // 우선순위 등록
  insertPriority: `
    INSERT INTO case_priority (submit_code, level, is_current)
    VALUES (?, ?, ?)
  `,

  /* ✅ 상담 상세 조회용 헤더 */
  getCounselHeaderBySubmit: `
    SELECT
      cn.counsel_code,
      cn.submit_code,
      cn.status,
      cn.written_at,
      ss.submit_at,
      writer.name AS writer_name,
      LEFT(writer.ssn, 6) AS ssn_front
    FROM counsel_note cn
    JOIN survey_submission ss
      ON ss.submit_code = cn.submit_code
    JOIN users writer
      ON writer.user_code = ss.written_by
    WHERE cn.submit_code = ?
    LIMIT 1
  `,

  /* ✅ 상담 상세들 */
  getCounselDetailsByCounsel: `
    SELECT
      detail_code,
      counsel_code,
      counsel_date,
      title,
      content,
      attach_code
    FROM counsel_detail
    WHERE counsel_code = ?
    ORDER BY counsel_date ASC, detail_code ASC
  `,

  /* ✅ 현재 우선순위 */
  getCurrentPriorityBySubmit: `
    SELECT level
    FROM case_priority
    WHERE submit_code = ?
      AND is_current = 'Y'
    ORDER BY priority_code DESC
    LIMIT 1
  `,
  // 상담 승인요청 등록
  insertRequestApproval: `
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
    ?,           -- requester_code
    ?,           -- processor_code
    ?,           -- approval_type
    CURDATE(),   -- request_date (오늘)
    NULL,        -- approval_date
    ?,           -- state
    NULL,        -- rejection_reason
    ?,           -- linked_table_name
    ?            -- linked_record_pk
  )
`,

  // 상담 승인요청 → 승인(BA2)
  updateApprovalApprove: `
  UPDATE request_approval
  SET
    state = 'BA2',          -- 승인
    approval_date = CURDATE(),
    rejection_reason = NULL
  WHERE linked_table_name = 'counsel_note'
    AND linked_record_pk = ?
    AND approval_type = 'AE3'
    AND state = 'BA1'
`,

// 승인 시 counsel_note 상태 → CB5(검토완료)
updateCounselNoteApprove: `
  UPDATE counsel_note
  SET status = 'CB5'
  WHERE counsel_code = ?
`,

  // 상담 승인요청 → 반려(BA3)
  updateApprovalReject: `
  UPDATE request_approval
  SET
    state = 'BA3',          -- 반려
    approval_date = CURDATE(),
    rejection_reason = ?
  WHERE linked_table_name = 'counsel_note'
    AND linked_record_pk = ?
    AND approval_type = 'AE3'
    AND state = 'BA1'
`,

// 반려 시 counsel_note 상태 → CB4 (반려로 사용할게오)
updateCounselNoteReject: `
  UPDATE counsel_note
  SET status = 'CB4'
  WHERE counsel_code = ?
`,

//  특정 상담(counsel_code)에 대한 반려 사유 조회
  getRejectReasonByCounsel: `
  SELECT
    rejection_reason
  FROM request_approval
  WHERE linked_table_name = 'counsel_note'
    AND linked_record_pk = ?
    AND approval_type = 'AE3'
    AND state = 'BA3'      -- 반려 상태
  ORDER BY
    approval_date DESC,
    request_date DESC
  LIMIT 1
`,

};
