const selectMyApplications = `
  SELECT
      ss.submit_code                              AS submit_code
    , c.child_name                                AS child_name
    , parent.name                                 AS name          -- 보호자 이름
    , mgr.name                                    AS assi_name     -- 담당자 이름
    , org.org_name                                AS org_name
    , ss.submit_at                                AS survey_date
    , cp.level                                    AS priority_level

    , MAX(sp.plan_code)                           AS plan_code
    , MAX(sp.status)                              AS plan_status

    , MAX(sr.result_code)                         AS result_code
    , MAX(sr.status)                              AS result_status
  FROM survey_submission ss

  -- 보호자(일반 회원)
  JOIN users parent
    ON parent.user_code = ss.written_by

  -- ✅ 자녀: survey_submission.child_code 로 1:1 조인
  LEFT JOIN child c
    ON c.child_code = ss.child_code

  -- 담당자 & 기관
  LEFT JOIN users mgr
    ON mgr.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = parent.org_code

  -- 우선순위(현재값만)
  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'

  -- 지원 계획 (여러 개일 수 있어 MAX로 대표값 1개만)
  LEFT JOIN support_plan sp
    ON sp.submit_code = ss.submit_code

  -- 지원 결과 (여러 개일 수 있어 MAX로 대표값 1개만)
  LEFT JOIN support_result sr
    ON sr.plan_code = sp.plan_code

  -- 🔑 로그인한 일반회원의 신청만 (로그인 ID: user_id)
  WHERE parent.user_id = ?

  -- ✅ submit_code 기준으로 한 줄만 남기기
  GROUP BY
      ss.submit_code,
      c.child_name,
      parent.name,
      mgr.name,
      org.org_name,
      ss.submit_at,
      cp.level

  ORDER BY
    ss.submit_at DESC,
    ss.submit_code DESC
`;

module.exports = {
  selectMyApplications,
};
