// server/mappers/applicationMapper.js

const db = require("../configs/db");
const applicationSQL = require("../sql/applicationSQL");

// 나의 지원 신청 현황 리스트 조회
async function selectMyApplications(loginId) {
  // mysql2/promise 기준 예시: const [rows] = await db.query(...)
  const [rows] = await db.query(applicationSQL.selectMyApplications, [loginId]);
  return rows;
}

module.exports = {
  selectMyApplications,
};
