// server/services/applicationService.js

const applicationMapper = require("../mappers/applicationMapper");

// 나의 지원 신청 현황 조회 서비스
async function getMyApplications({ loginId }) {
  if (!loginId) {
    throw new Error("loginId가 필요합니다.");
  }

  const list = await applicationMapper.selectMyApplications(loginId);
  return list;
}

module.exports = {
  getMyApplications,
};
