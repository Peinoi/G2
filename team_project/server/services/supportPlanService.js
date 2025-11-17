const supportPlanMapper = require("../mappers/supportPlanMapper.js");

module.exports = {
  // 목록보기
  listPlans(role, userId) {
    return supportPlanMapper.listSupportPlansByRole(
      Number(role),
      Number(userId)
    );
  },
  // 지원자 정보 불러오기
  getPlanBasic(submitCode) {
    return supportPlanMapper.getPlanBasic(Number(submitCode));
  },
  // 계획서 저장하기
  savePlanWithItems(formJson, files) {
    return supportPlanMapper.savePlanWithItems(formJson, files);
  },

  // 수정화면 조회
  getPlanDetail(planCode) {
    return supportPlanMapper.getPlanDetail(Number(planCode));
  },
  // 수정
  updatePlanWithItems(formJson, files) {
    return supportPlanMapper.updatePlanWithItems(formJson, files);
  },
  // 계획 임시저장
  async savePlanTemp(formJson, files) {
    return supportPlanMapper.savePlanTemp(formJson, files);
  },
  // 불러오기
  getPlanFormData(submitCode) {
    return supportPlanMapper.getPlanFormDataBySubmit(submitCode);
  },
  // 승인
  async approveSupportPlan(planCode) {
    return supportPlanMapper.approveSupportPlan(planCode);
  },

  // 반려
  async rejectSupportPlan(planCode, reason) {
    return supportPlanMapper.rejectSupportPlan(planCode, reason);
  },
  // 반려사유 조회
  async getRejectionReason(planCode) {
    return await supportPlanMapper.getRejectionReason(planCode);
  },
  //재승인요청
  async resubmitPlan(planCode, requesterCode) {
    return await supportPlanMapper.resubmitPlan(planCode, requesterCode);
  },
};
