// server/services/supportResultService.js
const supportResultMapper = require("../mappers/supportResultMapper.js");

module.exports = {
  // (이미 있을 수 있는) 목록보기
  listResults(role, userId) {
    return supportResultMapper.listSupportResultsByRole(
      Number(role),
      Number(userId)
    );
  },

  // 기본정보 (이름/생년월일/계획서 작성일)
  getResultBasic(submitCode) {
    return supportResultMapper.getResultBasic(Number(submitCode));
  },

  // 결과 최종 저장
  saveResultWithItems(formJson, files) {
    return supportResultMapper.saveResultWithItems(formJson, files);
  },

  // 결과 임시저장
  saveResultTemp(formJson, files) {
    return supportResultMapper.saveResultTemp(formJson, files);
  },

  // 임시저장/작성내용 불러오기
  getResultFormData(submitCode) {
    return supportResultMapper.getResultFormDataBySubmit(Number(submitCode));
  },

  // 수정 화면 조회
  getResultDetail(resultCode) {
    return supportResultMapper.getResultDetail(Number(resultCode));
  },

  // 수정
  updateResultWithItems(formJson, files) {
    return supportResultMapper.updateResultWithItems(formJson, files);
  },
};
