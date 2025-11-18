// server/sql/applicationSQL.js

// 나의 지원 신청 현황 조회
// - 기준: 조사지 제출본(survey_submission)에서 written_by = 로그인 사용자
// - child_name : 자녀 이름 (child 테이블, 부모 user_code 기준)
// - parent_name: 보호자 이름 (users)
// - manager_name: 담당자 이름 (assI_by → users)
// - org_name: 담당자 소속 기관명 (organization)
// - survey_date: 조사지 제출일
// - priority_level: 우선순위(BB1/BB2/BB3, case_priority.is_current = 'Y')
// - plan_code / plan_status: 지원계획 헤더 (support_plan)
// - result_code / result_status: 지원결과 헤더 (support_result)

const selectMyApplications = `
  SELECT
      ss.submit_code                              AS submit_code
    , c.child_name                               AS child_name
    , parent.name                                AS parent_name
    , mgr.name                                   AS manager_name
    , org.org_name                               AS org_name
    , ss.submit_at                               AS survey_date
    , cp.level                                   AS priority_level

    , sp.plan_code                               AS plan_code
    , sp.status                                  AS plan_status

    , sr.result_code                             AS result_code
    , sr.status                                  AS result_status
  FROM survey_submission ss

  -- 보호자(일반 회원)
  JOIN users parent
    ON parent.user_code = ss.written_by

  -- 자녀 (부모 user_code 기준, 여러 명이면 row가 여러 개 나올 수 있음)
  LEFT JOIN child c
    ON c.user_code = parent.user_code

  -- 담당자 & 기관
  LEFT JOIN users mgr
    ON mgr.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = mgr.org_code

  -- 우선순위(현재값만)
  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'

  -- 지원 계획 (해당 조사지에 연결된 계획; 여러개면 모두 나옴)
  LEFT JOIN support_plan sp
    ON sp.submit_code = ss.submit_code

  -- 지원 결과 (계획에 연결된 결과; 여러개면 모두 나옴)
  LEFT JOIN support_result sr
    ON sr.plan_code = sp.plan_code

  -- 로그인한 일반회원의 신청만
  WHERE parent.user_id = ?

  ORDER BY
    ss.submit_at DESC,
    ss.submit_code DESC
`;

module.exports = {
  selectMyApplications,
};
