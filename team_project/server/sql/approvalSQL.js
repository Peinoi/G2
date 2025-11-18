// team_project/server/sql/approvalSQL.js

//** ✅ 기관 관리자 승인 요청 목록 조회 쿼리 */
const managerApprovalList = `
SELECT
    ra.approval_code,           
    u.name        AS user_name, 
    u.user_id     AS login_id,  
    o.org_name    AS organization_name, 
    u.phone,
    u.email,
    ra.state,                   
    ra.request_date,
    ra.approval_date
FROM request_approval ra
JOIN users u
  ON u.user_code = ra.requester_code
LEFT JOIN organization o
  ON o.org_code = u.org_code    
WHERE ra.approval_type = 'AE1'
  -- 상태 필터 (전체면 무시)
  AND (? = '' OR ra.state = ?)
  -- 검색어 필터 (전체면 무시)
  AND (
    ? = '' OR
    u.name        LIKE CONCAT('%', ?, '%') OR
    u.user_id     LIKE CONCAT('%', ?, '%') OR
    o.org_name    LIKE CONCAT('%', ?, '%') OR
    u.phone       LIKE CONCAT('%', ?, '%') OR
    u.email       LIKE CONCAT('%', ?, '%')
  )
ORDER BY ra.request_date DESC, ra.approval_code DESC
LIMIT ?, ?
`;

/** ✅ 승인/반려 공통 업데이트 쿼리 */
const updateApprovalState = `
  UPDATE request_approval
     SET state = ?,
         approval_date = NOW()
   WHERE approval_code = ?
     AND state = 'BA1'   -- 요청 상태일 때만 변경
`;

const findApprovalWithUser = `
  SELECT
    ra.approval_code,
    ra.state,
    u.user_code,
    u.name        AS user_name,
    u.email
  FROM request_approval ra
  JOIN users u
    ON u.user_code = ra.requester_code
  WHERE ra.approval_code = ?
`;

// ✅ 기관 담당자 승인 요청 목록 조회 (approval_type = 'AE2')
const staffApprovalList = `
SELECT
    ra.approval_code,
    u.name        AS user_name,
    u.user_id     AS login_id,
    o.org_name    AS organization_name,
    u.phone,
    u.email,
    ra.state,
    ra.request_date,
    ra.approval_date
FROM request_approval ra
JOIN users u
  ON u.user_code = ra.requester_code
LEFT JOIN organization o
  ON o.org_code = u.org_code
WHERE ra.approval_type = 'AE2'
  -- 상태 필터 (전체면 무시)
  AND (? = '' OR ra.state = ?)
  -- 검색어 필터 (전체면 무시)
  AND (
    ? = '' OR
    u.name        LIKE CONCAT('%', ?, '%') OR
    u.user_id     LIKE CONCAT('%', ?, '%') OR
    o.org_name    LIKE CONCAT('%', ?, '%') OR
    u.phone       LIKE CONCAT('%', ?, '%') OR
    u.email       LIKE CONCAT('%', ?, '%')
  )
  -- 🔹 AA3: 자기 기관만, AA4: 전체 (orgFilterLoginId === '' 이면 필터 해제)
  AND (
    ? = '' OR
    o.org_code = (
      SELECT u2.org_code
      FROM users u2
      WHERE u2.user_id = ?
      LIMIT 1
    )
  )
ORDER BY ra.request_date DESC, ra.approval_code DESC
LIMIT ?, ?
`;

/** ✅ 승인 시, 요청자 계정 활성화 (is_active = 1) */
const activateUserByApproval = `
  UPDATE users u
  JOIN request_approval ra
    ON ra.requester_code = u.user_code
   SET u.is_active = 1
 WHERE ra.approval_code = ?
`;

// 우선순위 승인 요청 목록 (페이징용)
const priorityApprovalList = `
   SELECT
      ra.approval_code                         -- 승인코드
    , ss.submit_code          AS submit_code   -- 상담 상세로 갈 때 필요
    , c.child_name            AS child_name    -- 아이 이름
    , parent.name             AS parent_name   -- 보호자 이름
    , mgr.name                AS manager_name  -- 담당자 이름
    , org.org_name            AS org_name      -- 기관명
    , cn.written_at           AS counsel_date  -- 상담기록(상담일자)
    , c.disability_type       AS disability_type -- 장애유형
    , cp.level                AS priority_level  -- 우선순위 등급(BB코드)
    , ra.state                AS state         -- 상태(BA1/BA2/BA3)
    , ra.approval_date        AS approval_date -- 처리일(승인/반려 일자)
  FROM request_approval ra

  LEFT JOIN counsel_note cn
    ON ra.linked_table_name = 'counsel_note'
   AND ra.linked_record_pk = cn.counsel_code

  LEFT JOIN survey_submission ss
    ON ss.submit_code = cn.submit_code

  LEFT JOIN users parent
    ON parent.user_code = ss.written_by

  LEFT JOIN child c
    ON c.user_code = parent.user_code

  LEFT JOIN users mgr
    ON mgr.user_code = ss.assi_by

  LEFT JOIN organization org
    ON org.org_code = mgr.org_code

  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'

  WHERE ra.approval_type = 'AE3'  -- 우선순위 승인 요청

  -- 상태 필터 (전체면 무시)
  AND (? = '' OR ra.state = ?)

  -- 검색어 필터 (전체면 무시)
  AND (
      ? = '' OR
      c.child_name   LIKE CONCAT('%', ?, '%') OR
      parent.name    LIKE CONCAT('%', ?, '%') OR
      mgr.name       LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
  )

  -- 🔹 로그인한 기관 관리자와 같은 기관만 보기
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )

  -- 정렬: orderBy 값(latest, oldest, name, priority)에 따라 동작
  ORDER BY 
    CASE WHEN ? = 'latest'   THEN ra.request_date END DESC,
    CASE WHEN ? = 'oldest'   THEN ra.request_date END ASC,
    CASE WHEN ? = 'name'     THEN c.child_name    END ASC,

    /* 🔥 우선순위 정렬: BB1 → BB2 → BB3 */
    CASE WHEN ? = 'priority' THEN 
        CASE cp.level 
            WHEN 'BB1' THEN 1
            WHEN 'BB2' THEN 2
            WHEN 'BB3' THEN 3
            ELSE 4
        END
    END ASC,

    ra.request_date DESC,       -- 기본: 최신순
    ra.approval_code DESC
  LIMIT ?, ?
`;

// 우선순위 승인 요청 총 개수
const priorityApprovalTotalCount = `
  SELECT COUNT(*) AS totalCount
  FROM request_approval ra
  LEFT JOIN counsel_note cn
    ON ra.linked_table_name = 'counsel_note'
   AND ra.linked_record_pk = cn.counsel_code
  LEFT JOIN survey_submission ss
    ON ss.submit_code = cn.submit_code
  LEFT JOIN users parent
    ON parent.user_code = ss.written_by
  LEFT JOIN child c
    ON c.user_code = parent.user_code
  LEFT JOIN users mgr
    ON mgr.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = mgr.org_code
  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'
  WHERE ra.approval_type = 'AE3'
  AND (? = '' OR ra.state = ?)
  AND (
      ? = '' OR
      c.child_name   LIKE CONCAT('%', ?, '%') OR
      parent.name    LIKE CONCAT('%', ?, '%') OR
      mgr.name       LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
  )
  -- 🔹 로그인한 기관 관리자와 같은 기관만 카운트
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )
`;

// 지원계획 승인 요청 목록 (페이징용)
const supportPlanApprovalList = `
    SELECT
      ra.approval_code,                    -- 승인코드
      c.child_name        AS child_name,   -- 아이 이름
      parent.name         AS parent_name,  -- 보호자 이름
      mgr.name            AS manager_name, -- 담당자 이름
      org.org_name        AS org_name,     -- 기관명

      sp.written_at       AS written_at,   -- 계획 작성일

      c.disability_type   AS disability_type, -- 장애유형
      cp.level            AS priority_level,  -- 우선순위(BB코드)
      ra.state            AS state,           -- 상태(BA코드)
      ra.approval_date    AS approval_date,    -- 처리일(승인/반려 일자)

      sp.plan_code        AS plan_code,
      sp.submit_code      AS submit_code
  FROM request_approval ra

  LEFT JOIN support_plan sp
    ON ra.linked_table_name = 'support_plan'
   AND ra.linked_record_pk  = sp.plan_code

  LEFT JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code

  LEFT JOIN users parent
    ON parent.user_code = ss.written_by

  LEFT JOIN child c
    ON c.user_code = parent.user_code

  LEFT JOIN users mgr
    ON mgr.user_code = sp.assi_by

  LEFT JOIN organization org
    ON org.org_code = mgr.org_code

  LEFT JOIN case_priority cp
    ON cp.submit_code = sp.submit_code
   AND cp.is_current = 'Y'

  WHERE ra.approval_type = 'AE4'           -- 지원계획 승인요청

  -- 상태 필터
  AND (? = '' OR ra.state = ?)

  -- 검색어 필터
  AND (
      ? = '' OR
      c.child_name   LIKE CONCAT('%', ?, '%') OR
      parent.name    LIKE CONCAT('%', ?, '%') OR
      mgr.name       LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
  )

  -- 🔹 로그인한 기관 관리자와 같은 기관만 보기
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )

  ORDER BY 
    CASE WHEN ? = 'latest'   THEN ra.request_date END DESC,
    CASE WHEN ? = 'oldest'   THEN ra.request_date END ASC,
    CASE WHEN ? = 'name'     THEN c.child_name    END ASC,

    /* 🔥 우선순위 정렬: BB1 → BB3 */
    CASE WHEN ? = 'priority' THEN 
        CASE cp.level 
            WHEN 'BB1' THEN 1
            WHEN 'BB2' THEN 2
            WHEN 'BB3' THEN 3
            ELSE 4
        END
    END ASC,

    ra.request_date DESC,
    ra.approval_code DESC
  LIMIT ?, ?
`;

// 🔢 지원계획 승인 요청 총 개수
const supportPlanApprovalTotalCount = `
  SELECT COUNT(*) AS totalCount
  FROM request_approval ra
  LEFT JOIN support_plan sp
    ON ra.linked_table_name = 'support_plan'
   AND ra.linked_record_pk  = sp.plan_code
  LEFT JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  LEFT JOIN users parent
    ON parent.user_code = ss.written_by
  LEFT JOIN child c
    ON c.user_code = parent.user_code
  LEFT JOIN users mgr
    ON mgr.user_code = sp.assi_by
  LEFT JOIN organization org
    ON org.org_code = mgr.org_code
  LEFT JOIN case_priority cp
    ON cp.submit_code = sp.submit_code
   AND cp.is_current = 'Y'
  WHERE ra.approval_type = 'AE4'
  AND (? = '' OR ra.state = ?)
  AND (
      ? = '' OR
      c.child_name   LIKE CONCAT('%', ?, '%') OR
      parent.name    LIKE CONCAT('%', ?, '%') OR
      mgr.name       LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
  )
  -- 🔹 로그인한 기관 관리자와 같은 기관만 카운트
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )
`;

// 🔹 지원결과 승인 요청 목록 (페이징용)
const supportResultApprovalList = `
  SELECT
      ra.approval_code,                    -- 승인코드
      c.child_name        AS child_name,   -- 아이 이름
      parent.name         AS parent_name,  -- 보호자 이름
      mgr.name            AS manager_name, -- 담당자 이름
      org.org_name        AS org_name,     -- 기관명

      sr.written_at       AS written_at,   -- 결과 작성일

      c.disability_type   AS disability_type, -- 장애유형
      cp.level            AS priority_level,  -- 우선순위(BB코드)
      ra.state            AS state,           -- 상태(BA코드)

      ra.approval_date    AS approval_date,    -- 처리일(승인/반려 일자)

      sr.result_code      AS result_code,     -- 결과코드 (상세 이동용)
      sr.plan_code        AS plan_code
  FROM request_approval ra

  /* 지원결과 헤더 */
  LEFT JOIN support_result sr
    ON ra.linked_table_name = 'support_result'
   AND ra.linked_record_pk  = sr.result_code

  /* 지원계획 헤더 */
  LEFT JOIN support_plan sp
    ON sp.plan_code = sr.plan_code

  /* 조사지 헤더 */
  LEFT JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code

  /* 보호자(조사지 작성자) */
  LEFT JOIN users parent
    ON parent.user_code = ss.written_by

  /* 아이: 보호자(user_code) 기준으로 연결 */
  LEFT JOIN child c
    ON c.user_code = parent.user_code

  /* 담당자 & 기관 (지원결과 담당자 코드 사용) */
  LEFT JOIN users mgr
    ON mgr.user_code = sr.assi_by

  LEFT JOIN organization org
    ON org.org_code = mgr.org_code

  /* 우선순위 (현재 값만) */
  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'

  WHERE ra.approval_type = 'AE5'           -- 지원결과 승인요청

  -- 상태 필터
  AND (? = '' OR ra.state = ?)

  -- 검색어 필터
  AND (
      ? = '' OR
      c.child_name   LIKE CONCAT('%', ?, '%') OR
      parent.name    LIKE CONCAT('%', ?, '%') OR
      mgr.name       LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
  )

  -- 🔹 로그인한 기관 관리자와 같은 기관만 보기 (AA3), AA4는 전체
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )

  ORDER BY 
    CASE WHEN ? = 'latest'   THEN ra.request_date END DESC,
    CASE WHEN ? = 'oldest'   THEN ra.request_date END ASC,
    CASE WHEN ? = 'name'     THEN c.child_name    END ASC,

    /* 우선순위 정렬: BB1 → BB2 → BB3 */
    CASE WHEN ? = 'priority' THEN 
        CASE cp.level 
            WHEN 'BB1' THEN 1
            WHEN 'BB2' THEN 2
            WHEN 'BB3' THEN 3
            ELSE 4
        END
    END ASC,

    ra.request_date DESC,
    ra.approval_code DESC
  LIMIT ?, ?
`;

// 🔢 지원결과 승인 요청 총 개수
const supportResultApprovalTotalCount = `
  SELECT COUNT(*) AS totalCount
  FROM request_approval ra
  LEFT JOIN support_result sr
    ON ra.linked_table_name = 'support_result'
   AND ra.linked_record_pk  = sr.result_code
  LEFT JOIN support_plan sp
    ON sp.plan_code = sr.plan_code
  LEFT JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  LEFT JOIN users parent
    ON parent.user_code = ss.written_by
  LEFT JOIN child c
    ON c.user_code = parent.user_code
  LEFT JOIN users mgr
    ON mgr.user_code = sr.assi_by
  LEFT JOIN organization org
    ON org.org_code = mgr.org_code
  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'
  WHERE ra.approval_type = 'AE5'
  AND (? = '' OR ra.state = ?)
  AND (
      ? = '' OR
      c.child_name   LIKE CONCAT('%', ?, '%') OR
      parent.name    LIKE CONCAT('%', ?, '%') OR
      mgr.name       LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
  )

  -- 🔹 로그인한 기관 관리자와 같은 기관만 카운트 (AA3), AA4는 전체
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )
`;

// 🔹 이벤트 계획 승인 요청 목록 (페이징용)
const eventPlanApprovalList = `
  SELECT
      ra.approval_code                      -- 승인코드
    , e.event_name          AS event_name   -- 이벤트명
    , mgrUser.name          AS manager_name -- 담당자(메인 매니저, DA1)
    , org.org_name          AS org_name     -- 기관명

    , e.event_register_date AS written_at   -- ✅ 작성일(이벤트 등록 신청 일자)

    , e.max_participants    AS max_participants  -- 모집 인원
    , e.recruit_start_date  AS recruit_start_date
    , e.recruit_end_date    AS recruit_end_date  -- 모집 기간

    , e.event_start_date    AS event_start_date
    , e.event_end_date      AS event_end_date    -- 시행 기간

    , ra.state              AS state        -- 요청 상태(BA 코드)
    , ra.approval_date      AS approval_date -- 처리일(승인/반려 일자)
    , e.event_code          AS event_code   -- 상세 이동용
  FROM request_approval ra

  /* 이벤트 계획(헤더) */
  LEFT JOIN event e
    ON ra.linked_table_name = 'event'
   AND ra.linked_record_pk  = e.event_code

  /* 기관 */
  LEFT JOIN organization org
    ON org.org_code = e.org_code

  /* 메인 매니저(이벤트 담당, DA1) */
  LEFT JOIN manager m
    ON m.manager_category      = 'DB2'          -- 이벤트
   AND m.manager_type          = 'DA1'          -- 메인 매니저
   AND m.manager_category_code = e.event_code   -- 담당 코드 = 이벤트 코드

  LEFT JOIN users mgrUser
    ON mgrUser.user_code = m.user_code

  WHERE ra.approval_type = 'AE6'           -- 이벤트 계획 승인요청

  -- 상태 필터
  AND (? = '' OR ra.state = ?)

  -- 검색어 필터 (이벤트명 / 담당자 / 기관명)
  AND (
      ? = '' OR
      e.event_name   LIKE CONCAT('%', ?, '%') OR
      mgrUser.name   LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
  )

  -- 🔹 로그인한 기관 관리자와 같은 기관만 보기 (AA3), AA4는 전체
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )

  ORDER BY 
    CASE WHEN ? = 'latest' THEN ra.request_date END DESC,
    CASE WHEN ? = 'oldest' THEN ra.request_date END ASC,
    CASE WHEN ? = 'name'   THEN e.event_name    END ASC,

    ra.request_date DESC,
    ra.approval_code DESC
  LIMIT ?, ?
`;

// 🔢 이벤트 계획 승인 요청 총 개수
const eventPlanApprovalTotalCount = `
  SELECT COUNT(*) AS totalCount
  FROM request_approval ra
  LEFT JOIN event e
    ON ra.linked_table_name = 'event'
   AND ra.linked_record_pk  = e.event_code
  LEFT JOIN organization org
    ON org.org_code = e.org_code
  LEFT JOIN manager m
    ON m.manager_category      = 'DB2'
   AND m.manager_type          = 'DA1'
   AND m.manager_category_code = e.event_code
  LEFT JOIN users mgrUser
    ON mgrUser.user_code = m.user_code
  WHERE ra.approval_type = 'AE6'
    AND (? = '' OR ra.state = ?)
    AND (
      ? = '' OR
      e.event_name   LIKE CONCAT('%', ?, '%') OR
      mgrUser.name   LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
    )
    -- 🔹 로그인한 기관 관리자와 같은 기관만 카운트 (AA3), AA4는 전체
    AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
    )
`;

// 🔹 이벤트 결과 승인 요청 목록 (페이징용)
const eventResultApprovalList = `
  SELECT
      ra.approval_code                      -- 승인코드
    , e.event_name          AS event_name   -- 이벤트명
    , mgrUser.name          AS manager_name -- 담당자(메인 매니저, DA1)
    , org.org_name          AS org_name     -- 기관명

    , e.max_participants    AS max_participants  -- 모집 인원
    , e.recruit_start_date  AS recruit_start_date
    , e.recruit_end_date    AS recruit_end_date  -- 모집 기간

    , e.event_start_date    AS event_start_date
    , e.event_end_date      AS event_end_date    -- 시행 기간

    , er.report_register_date AS written_at  -- ✅ 작성일(결과보고서 등록일)

    , ra.state              AS state        -- 요청 상태(BA 코드)
    , ra.approval_date      AS approval_date -- 처리일(승인/반려 일자)
    , er.event_result_code  AS result_code  -- 이벤트 결과 코드 (상세 이동용)
  FROM request_approval ra

  /* 이벤트 결과 헤더 */
  LEFT JOIN event_result er
    ON ra.linked_table_name = 'event_result'
   AND ra.linked_record_pk  = er.event_result_code

  /* 이벤트 헤더 */
  LEFT JOIN event e
    ON e.event_code = er.event_code

  /* 기관 */
  LEFT JOIN organization org
    ON org.org_code = e.org_code

  /* 메인 매니저(이벤트 담당, DA1) */
  LEFT JOIN manager m
    ON m.manager_category      = 'DB2'          -- 이벤트
   AND m.manager_type          = 'DA1'          -- 메인 매니저
   AND m.manager_category_code = e.event_code   -- 담당 코드 = 이벤트 코드

  LEFT JOIN users mgrUser
    ON mgrUser.user_code = m.user_code

  WHERE ra.approval_type = 'AE7'           -- 이벤트 결과 승인요청

  -- 상태 필터
  AND (? = '' OR ra.state = ?)

  -- 검색어 필터 (이벤트명 / 담당자 / 기관명)
  AND (
      ? = '' OR
      e.event_name   LIKE CONCAT('%', ?, '%') OR
      mgrUser.name   LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
  )

  -- 🔹 로그인한 기관 관리자와 같은 기관만 보기 (AA3), AA4는 전체
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )

  ORDER BY 
    CASE WHEN ? = 'latest' THEN ra.request_date END DESC,
    CASE WHEN ? = 'oldest' THEN ra.request_date END ASC,
    CASE WHEN ? = 'name'   THEN e.event_name    END ASC,

    ra.request_date DESC,
    ra.approval_code DESC
  LIMIT ?, ?
`;

// 🔢 이벤트 결과 승인 요청 총 개수
const eventResultApprovalTotalCount = `
  SELECT COUNT(*) AS totalCount
  FROM request_approval ra
  LEFT JOIN event_result er
    ON ra.linked_table_name = 'event_result'
   AND ra.linked_record_pk  = er.event_result_code
  LEFT JOIN event e
    ON e.event_code = er.event_code
  LEFT JOIN organization org
    ON org.org_code = e.org_code
  LEFT JOIN manager m
    ON m.manager_category      = 'DB2'
   AND m.manager_type          = 'DA1'
   AND m.manager_category_code = e.event_code
  LEFT JOIN users mgrUser
    ON mgrUser.user_code = m.user_code
  WHERE ra.approval_type = 'AE7'
    AND (? = '' OR ra.state = ?)
    AND (
      ? = '' OR
      e.event_name   LIKE CONCAT('%', ?, '%') OR
      mgrUser.name   LIKE CONCAT('%', ?, '%') OR
      org.org_name   LIKE CONCAT('%', ?, '%')
    )
    -- 🔹 로그인한 기관 관리자와 같은 기관만 카운트 (AA3), AA4는 전체
    AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
    )
`;

// 🔹 후원 계획 승인 요청 목록 (AE8, 페이징용)
const sponsorshipPlanApprovalList = `
  SELECT
      ra.approval_code                  -- 승인코드
    , sp.program_code                   -- 프로그램코드
    , sp.program_name                   -- 프로그램명
    , sp.sponsor_type                   -- 후원유형 코드(EB1/EB2)
    , sp.start_date                     -- 목표 시작일
    , sp.end_date                       -- 목표 종료일
    , sp.goal_amount                    -- 목표금액
    , sp.create_date                    -- 작성일(프로그램 생성일)
    , org.org_name      AS org_name     -- 기관명
    , ra.state          AS state        -- 요청 상태(BA1/BA2/BA3)
    , ra.approval_date  AS approval_date -- 처리일(승인/반려 일자)
  FROM request_approval ra
  JOIN support_program sp
    ON ra.linked_table_name = 'support_program'
   AND ra.linked_record_pk  = sp.program_code

  /* 후원유형명 검색용 공통코드 조인(EB) */
  LEFT JOIN common_code cc
    ON cc.group_code = 'EB'
   AND cc.code_id    = sp.sponsor_type

  /* 작성자 (회원) */
  LEFT JOIN users u
    ON u.user_id = sp.writer

  /* 기관 */
  LEFT JOIN organization org
    ON org.org_code = u.org_code

  WHERE ra.approval_type = 'AE8'   -- 후원 계획 승인 요청

  -- 상태 필터 (전체면 무시)
  AND (? = '' OR ra.state = ?)

  -- 검색어 필터: 프로그램명 / 후원유형명 / 기관명
  AND (
      ? = '' OR
      sp.program_name LIKE CONCAT('%', ?, '%') OR
      cc.code_name    LIKE CONCAT('%', ?, '%') OR
      org.org_name    LIKE CONCAT('%', ?, '%')
  )

  -- 🔹 로그인한 기관 관리자와 같은 기관만 보기 (AA3), AA4는 전체
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )

  ORDER BY
    CASE WHEN ? = 'latest' THEN ra.request_date END DESC,
    CASE WHEN ? = 'oldest' THEN ra.request_date END ASC,
    CASE WHEN ? = 'name'   THEN sp.program_name END ASC,
    CASE WHEN ? = 'goal'   THEN sp.goal_amount  END DESC,

    ra.request_date DESC,
    ra.approval_code DESC
  LIMIT ?, ?
`;

// 🔢 후원 계획 승인 요청 총 개수
const sponsorshipPlanApprovalTotalCount = `
  SELECT COUNT(*) AS totalCount
  FROM request_approval ra
  JOIN support_program sp
    ON ra.linked_table_name = 'support_program'
   AND ra.linked_record_pk  = sp.program_code
  LEFT JOIN common_code cc
    ON cc.group_code = 'EB'
   AND cc.code_id    = sp.sponsor_type
  LEFT JOIN users u
    ON u.user_id = sp.writer
  LEFT JOIN organization org
    ON org.org_code = u.org_code
  WHERE ra.approval_type = 'AE8'
    AND (? = '' OR ra.state = ?)
    AND (
      ? = '' OR
      sp.program_name LIKE CONCAT('%', ?, '%') OR
      cc.code_name    LIKE CONCAT('%', ?, '%') OR
      org.org_name    LIKE CONCAT('%', ?, '%')
    )
    -- 🔹 기관 관리자(AA3)는 자기 기관만, AA4는 전체
    AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
    )
`;

// 🔹 후원 결과 승인 요청 목록 (AE9, 페이징용)
const sponsorshipResultApprovalList = `
  SELECT
      ra.approval_code                  -- 승인코드
    , sp.program_code                   -- 프로그램코드
    , sp.program_name                   -- 프로그램명
    , sp.sponsor_type                   -- 후원유형 코드(EB1/EB2)
    , sp.start_date                     -- 목표 시작일
    , sp.end_date                       -- 목표 종료일
    , sp.goal_amount                    -- 목표금액
    , sr.create_date                    -- 작성일(후원 결과 보고서 생성일)
    , org.org_name      AS org_name     -- 기관명
    , ra.state          AS state        -- 요청 상태(BA1/BA2/BA3)
    , ra.approval_date  AS approval_date -- 처리일(승인/반려 일자)
  FROM request_approval ra

  /* 후원 결과 보고서 */
  JOIN support_report sr
    ON ra.linked_table_name = 'support_report'
   AND ra.linked_record_pk  = sr.report_code

  /* 후원 프로그램 */
  JOIN support_program sp
    ON sp.program_code = sr.program_code

  /* 후원유형명 검색용 공통코드 (EB) */
  LEFT JOIN common_code cc
    ON cc.group_code = 'EB'
   AND cc.code_id    = sp.sponsor_type

  /* 작성자 (회원) */
  LEFT JOIN users u
    ON u.user_id = sp.writer

  /* 기관 */
  LEFT JOIN organization org
    ON org.org_code = u.org_code

  WHERE ra.approval_type = 'AE9'   -- 후원 결과 승인 요청

  -- 상태 필터 (전체면 무시)
  AND (? = '' OR ra.state = ?)

  -- 검색어 필터: 프로그램명 / 후원유형명 / 기관명
  AND (
      ? = '' OR
      sp.program_name LIKE CONCAT('%', ?, '%') OR
      cc.code_name    LIKE CONCAT('%', ?, '%') OR
      org.org_name    LIKE CONCAT('%', ?, '%')
  )

  -- 기관 필터: AA3는 자기 기관만, AA4는 전체
  AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
  )

  ORDER BY
    CASE WHEN ? = 'latest' THEN ra.request_date END DESC,
    CASE WHEN ? = 'oldest' THEN ra.request_date END ASC,
    CASE WHEN ? = 'name'   THEN sp.program_name END ASC,
    CASE WHEN ? = 'goal'   THEN sp.goal_amount  END DESC,

    ra.request_date DESC,
    ra.approval_code DESC
  LIMIT ?, ?
`;

// 🔢 후원 결과 승인 요청 총 개수
const sponsorshipResultApprovalTotalCount = `
  SELECT COUNT(*) AS totalCount
  FROM request_approval ra
  JOIN support_report sr
    ON ra.linked_table_name = 'support_report'
   AND ra.linked_record_pk  = sr.report_code
  JOIN support_program sp
    ON sp.program_code = sr.program_code
  LEFT JOIN common_code cc
    ON cc.group_code = 'EB'
   AND cc.code_id    = sp.sponsor_type
  LEFT JOIN users u
    ON u.user_id = sp.writer
  LEFT JOIN organization org
    ON org.org_code = u.org_code
  WHERE ra.approval_type = 'AE9'
    AND (? = '' OR ra.state = ?)
    AND (
      ? = '' OR
      sp.program_name LIKE CONCAT('%', ?, '%') OR
      cc.code_name    LIKE CONCAT('%', ?, '%') OR
      org.org_name    LIKE CONCAT('%', ?, '%')
    )
    AND (
      ? = '' OR
      org.org_code = (
          SELECT u2.org_code
          FROM users u2
          WHERE u2.user_id = ?
          LIMIT 1
      )
    )
`;

module.exports = {
  managerApprovalList,
  updateApprovalState,
  findApprovalWithUser,
  staffApprovalList,
  activateUserByApproval,
  priorityApprovalList,
  supportPlanApprovalList,
  supportPlanApprovalTotalCount,
  priorityApprovalTotalCount,
  supportResultApprovalList,
  supportResultApprovalTotalCount,
  eventPlanApprovalList,
  eventPlanApprovalTotalCount,
  eventResultApprovalList,
  eventResultApprovalTotalCount,
  sponsorshipPlanApprovalList,
  sponsorshipPlanApprovalTotalCount,
  sponsorshipResultApprovalList,
  sponsorshipResultApprovalTotalCount,
};
