// server/sql/authorityTransferSQL.js

// 기관 관리자(로그인 아이디 기준)의 기관 안에 있는 이용자(AA1) 목록 조회
// - 뒤에서 WHERE 절을 더 붙일 수 있게 기본 구조만 정의
const authorityUserListBase = `
  SELECT
      u.user_code,
      u.user_id,
      u.name,
      u.phone,
      u.manager_code,
      m.name AS manager_name
  FROM users u
  LEFT JOIN users m
    ON m.user_code = u.manager_code   -- 담당자 이름
  WHERE u.role = 'AA1'
    AND u.org_code = (
      SELECT u2.org_code
      FROM users u2
      WHERE u2.user_id = ?
      LIMIT 1
    )
`;

// 카운트용
const authorityUserCountBase = `
  SELECT
      COUNT(*) AS totalCount
  FROM users u
  WHERE u.role = 'AA1'
    AND u.org_code = (
      SELECT u2.org_code
      FROM users u2
      WHERE u2.user_id = ?
      LIMIT 1
    )
`;

// 🔹 권한 이관용 UPDATE 기본
// - IN (?,?,...) 은 mapper에서 동적으로 붙임
const authorityTransferUpdateBase = `
  UPDATE users
     SET manager_code = ?
   WHERE role = 'AA1'
     AND manager_code = ?
     AND org_code = (
       SELECT u2.org_code
       FROM users u2
       WHERE u2.user_id = ?
       LIMIT 1
     )
`;

/* 🔹 조사지 담당자(assi_by) 이관용
   - written_by = 일반회원(user_code)
   - assi_by     = 담당자(user_code)
*/
const transferSurveyAssiByBase = `
  UPDATE survey_submission ss
  JOIN users u
    ON u.user_code = ss.written_by
   SET ss.assi_by = ?
 WHERE ss.assi_by = ?
`;

/* 🔹 지원계획 담당자(assi_by) 이관용
   - support_plan.submit_code -> survey_submission.submit_code
   - survey_submission.written_by = 일반회원(user_code)
*/
const transferSupportPlanAssiByBase = `
  UPDATE support_plan sp
  JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  JOIN users u
    ON u.user_code = ss.written_by
   SET sp.assi_by = ?
 WHERE sp.assi_by = ?
`;

/* 🔹 지원결과 담당자(assi_by) 이관용
   - support_result.plan_code -> support_plan.plan_code
   - support_plan.submit_code -> survey_submission.submit_code
   - survey_submission.written_by = 일반회원(user_code)
*/
const transferSupportResultAssiByBase = `
  UPDATE support_result sr
  JOIN support_plan sp
    ON sp.plan_code = sr.plan_code
  JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  JOIN users u
    ON u.user_code = ss.written_by
   SET sr.assi_by = ?
 WHERE sr.assi_by = ?
`;

module.exports = {
  authorityUserListBase,
  authorityUserCountBase,
  authorityTransferUpdateBase,
  transferSurveyAssiByBase,
  transferSupportPlanAssiByBase,
  transferSupportResultAssiByBase,
};
