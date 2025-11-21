<!-- src/views/StaffApprovals.vue -->
<template>
  <div class="apv-page">
    <h2 class="apv-title">전체 후원 내역</h2>
    <!-- 
    검색/필터
    <div class="apv-toolbar">
      <div class="apv-filters">
        <input
          v-model.trim="keyword"
          class="apv-input"
          placeholder="프로그램명 검색"
          @keyup.enter="fetchList"
        />
      </div>
      <button class="apv-btn apv-btn-outline" @click="fetchList">조회</button>
    </div> -->

    <!-- 테이블 -->
    <div class="apv-table-wrap">
      <table class="apv-table">
        <thead>
          <tr>
            <th>후원일자</th>
            <th>후원자</th>
            <th>후원 금액</th>
            <th>프로그램</th>
            <th>후원 타입</th>
            <th>상태</th>
            <th>시작일</th>
            <th>종료일</th>
            <th>목표 금액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sponsor in sponsorList" :key="sponsor.program_code">
            <td>{{ dateFormat(sponsor.deposit_date, "yyyy-MM-dd") }}</td>
            <td>{{ sponsor.userID }}</td>
            <td>{{ numberFormat(sponsor.transaction_amount) }}</td>
            <td>{{ sponsor.program_name }}</td>
            <td>{{ sponsor.sponsor_type }}</td>
            <td>{{ sponsor.status }}</td>
            <td>{{ dateFormat(sponsor.start_date, "yyyy-MM-dd") }}</td>
            <td>{{ dateFormat(sponsor.end_date, "yyyy-MM-dd") }}</td>
            <td>{{ numberFormat(sponsor.goal_amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import numberFormat from "@/utils/numberFormat";
import { ref, onBeforeMount } from "vue";
let sponsorList = ref([]); // 전체 조회 조건 조회
const getSponsorList = async () => {
  let result = await axios
    .get(`/api/sponsor/mygiving`)
    .catch((err) => console.log(err));

  // API 호출 실패 처리 추가 (이전 대화에서 논의된 부분)
  if (!result || !result.data) {
    console.log("조회 결과 데이터가 유효하지 않습니다.");
    sponsorList.value = [];
    return;
  }
  const res = result.data.serviceSponsor;
  let list = JSON.parse(JSON.stringify(res));
  sponsorList.value = list;
  console.log(JSON.parse(JSON.stringify(sponsorList.value)));
};
onBeforeMount(() => {
  getSponsorList();
});
defineExpose({
  getSponsorList,
});
</script>

<style scoped>
* {
  font-size: 15px;
}
/* === ManagerApprovals.vue 와 동일 스타일 === */
.apv-page {
  max-width: 1600px;
  margin: 24px auto;
  padding: 0 16px 40px;
}

.apv-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* 상단 툴바 */
.apv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.apv-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.apv-input,
.apv-select {
  min-width: 220px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #d7dce5;
  font-size: 13px;
  outline: none;
  background: #fff;
}

.apv-input:focus,
.apv-select:focus {
  border-color: #7ea6f6;
  box-shadow: 0 0 0 1px rgba(126, 166, 246, 0.25);
}

/* 버튼 공통 */
.apv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #d2d6e0;
  background: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition: 0.12s ease-in-out;
  white-space: nowrap;
}

.apv-btn:hover {
  filter: brightness(0.98);
}

.apv-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 사이즈 작은 버튼 */
.apv-btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}

/* 버튼 스타일 변형 */
.apv-btn-primary {
  background: #7ea6f6;
  border-color: #7ea6f6;
  color: #fff;
}

.apv-btn-primary:hover {
  filter: brightness(0.96);
}

.apv-btn-danger {
  background: #f76c6c;
  border-color: #f76c6c;
  color: #fff;
}

.apv-btn-danger:hover {
  filter: brightness(0.96);
}

.apv-btn-outline {
  background: #ffffff;
  border-color: #7ea6f6;
  color: #315fbf;
}

/* 테이블 */
.apv-table-wrap {
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  border: 1px solid #e2e7f0;
}

.apv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.apv-table thead {
  background: #f5f7fb;
}

.apv-table th,
.apv-table td {
  padding: 9px 10px;
  border-bottom: 1px solid #edf2f7;
  text-align: center;
}

.apv-table th {
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
}

.apv-table tbody tr:hover {
  background: #f9fbff;
}

.apv-empty {
  text-align: center;
  padding: 14px 0;
  color: #6b7280;
}

/* 상태 Pill */
.apv-state-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}

.apv-state-BA1 {
  background: #fff7e6;
  color: #b7791f;
  border: 1px solid #f6e3b5;
}

.apv-state-BA2 {
  background: #e6fffa;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.apv-state-BA3 {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.apv-actions-cell {
  display: flex;
  gap: 4px;
  align-items: center;
}

.apv-muted {
  color: #9ca3af;
  font-size: 12px;
}

/* 모달 */
.apv-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.apv-modal {
  width: min(460px, 92vw);
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 18px 16px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.35);
  border: 1px solid #e2e7f0;
}

.apv-modal-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.apv-modal-sub {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 10px;
}

.apv-textarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #d7dce5;
  padding: 8px 10px;
  font-size: 13px;
  resize: vertical;
  min-height: 90px;
}

.apv-textarea:focus {
  outline: none;
  border-color: #7ea6f6;
  box-shadow: 0 0 0 1px rgba(126, 166, 246, 0.25);
}

.apv-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* 페이징/에러 */
.apv-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.apv-page-text {
  font-size: 13px;
}

.apv-error {
  margin-top: 8px;
  color: #b91c1c;
  font-size: 12px;
}
.apv-table td:nth-child(9) {
  text-align: right !important;
}
</style>
