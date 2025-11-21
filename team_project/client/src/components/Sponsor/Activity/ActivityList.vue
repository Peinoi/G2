<template>
  <div class="apv-page">
    <h2 class="apv-title">후원 활동 보고서</h2>

    <div class="apv-toolbar apv-toolbar-top">
      <button
        class="apv-btn apv-btn-primary"
        @click="programAdd()"
        v-if="userRole !== 'AA1'"
      >
        후원 활동 보고서 등록
      </button>
      <div class="search-box">
        <input
          type="text"
          placeholder="프로그램명 입력"
          v-model="searchKeyword"
        />
      </div>
    </div>

    <div class="apv-table-wrap">
      <table class="apv-table">
        <thead>
          <tr>
            <th>프로그램</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>목표 금액</th>
            <th>사용 금액</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="program in finalList"
            @click="selectProgram(program)"
            :key="program.program_code"
          >
            <td>{{ program.program_name }}</td>
            <td>{{ program.title }}</td>
            <td>{{ program.writer }}</td>
            <td>{{ dateFormat(program.create_date, "yyyy-MM-dd") }}</td>
            <td>{{ numberFormat(program.goal_amount) }}원</td>
            <td>{{ numberFormat(program.used_amount) }}원</td>
          </tr>
        </tbody>
      </table>

      <div v-if="sponsorList.length === 0" class="apv-empty">
        조회된 후원 프로그램이 없습니다.
      </div>
    </div>
  </div>
</template>

<!-- ============================================================= -->

<script setup>
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import numberFormat from "@/utils/numberFormat";
import { ref, onBeforeMount, computed } from "vue";
const userJsonString = localStorage.getItem("user");
const userObject = JSON.parse(userJsonString);
const userRole = userObject.role;

const emit = defineEmits(["go-to-add", "select-program"]);

let sponsorList = ref([]); // 전체 조회 조건 조회
let programList = ref([]); // 검색창 프로그램 명 리스트 불러오기
const searchKeyword = ref("");
const getSponsorList = async (params = {}) => {
  let result = await axios
    .get(`/api/sponsor/activity`, { params: params })
    .catch((err) => console.log(err));

  // API 호출 실패 처리 추가 (이전 대화에서 논의된 부분)
  if (!result || !result.data) {
    console.log("조회 결과 데이터가 유효하지 않습니다.");
    sponsorList.value = [];
    return;
  }
  const res = result.data.serviceSponsor;

  // // 1. 테이블 목록 갱신
  // const list = JSON.parse(JSON.stringify(res));
  // sponsorList.value = JSON.parse(JSON.stringify(res));
  // console.log(list);
  //const userJsonString = localStorage.getItem("user");

  // let userId = null;

  // const userObject = JSON.parse(userJsonString);

  // userId = String(userObject.user_id);

  let list = JSON.parse(JSON.stringify(res));

  // filter의 반환값을 list에 다시 할당 (재할당)
  // list = list.filter((item) => {
  //   // 안정성을 위해 String() 변환을 유지
  //   return String(item.writer) === userId;
  // });

  sponsorList.value = list;
  // 2. 검색 조건이 없는 최초 로딩 시에만 programList를 갱신
  //    (검색 결과는 programList에 영향을 주지 않아야 함)
  if (Object.keys(params).length === 0) {
    programList.value = list;
  }
  console.log(JSON.parse(JSON.stringify(sponsorList.value)));
};

onBeforeMount(() => {
  getSponsorList();
});
defineExpose({
  getSponsorList,
});

const programAdd = () => {
  emit("go-to-add"); // 'go-to-add' 이벤트를 발생시킴
};
// -------------------------------
// 검색 기능
// -------------------------------
const finalList = computed(() => {
  const kw = searchKeyword.value.trim();
  if (!kw) return sponsorList.value; // 검색어 없으면 전체 리턴

  // 검색어 있을 때만 필터
  return sponsorList.value.filter((item) => item.program_name.includes(kw));
});
// client/comments/Sponsor/ProgramList.vue
const selectProgram = async (item) => {
  const res = await axios.get(`/api/sponsor/activity/${item.activity_code}`);

  emit("select-program", {
    ...res.data.activity[0],
    history: res.data.history,
  });
};
</script>

<!-- ============================================================= -->
<style scoped>
/* === ManagerApprovals.vue 와 동일 스타일 적용 === */
.apv-page {
  max-width: 1100px;
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

/* 등록 버튼 상단 툴바 */
.apv-toolbar-top {
  justify-content: space-between;
  margin-bottom: 8px; /* 제목과 검색창 사이 간격 조절 */
}

.apv-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1; /* 검색 영역이 충분한 공간을 차지하도록 */
}

/* 기간 선택 그룹 */
.apv-date-range {
  display: flex;
  align-items: center;
  gap: 4px;
}

.apv-date-separator {
  color: #6b7280;
}

/* 검색/초기화 버튼 그룹 */
.apv-actions-group {
  display: flex;
  gap: 8px;
}

.apv-input,
.apv-select {
  /* input[type="date"]와 select에 공통 적용 */
  min-width: 130px; /* 너비 조정 */
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #d7dce5;
  font-size: 13px;
  outline: none;
  background: #fff;
}

/* 날짜 입력 필드의 너비 조정 */
.apv-input-date {
  min-width: 100px;
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

/* 사이즈 작은 버튼 (테이블 내부의 승인 버튼에 사용) */
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
  /* 검색 버튼 스타일 */
  background: #ffffff;
  border-color: #7ea6f6;
  color: #315fbf;
}
.apv-btn-outline:hover {
  background: #f9fbff;
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
/* 검색 */
.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #bbb;
  padding: 5px 10px;
  border-radius: 10px;
  background-color: white;
}

.search-box input {
  border: none;
  outline: none;
  border-radius: 5px;
}

/* 테이블 행 호버 시 스타일 */
.apv-table tbody tr {
  cursor: pointer;
}
.apv-table tbody tr:hover {
  background: #f9fbff;
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
  white-space: nowrap;
}

/* 진행 상태별 색상 (BA1~BA3는 임시로 매핑) */
/* 진행전: 노란색 */
.apv-state-BA1 {
  background: #fff7e6;
  color: #b7791f;
  border: 1px solid #f6e3b5;
}

/* 진행중: 초록색 */
.apv-state-BA2 {
  background: #e6fffa;
  color: #047857;
  border: 1px solid #a7f3d0;
}

/* 완료/중단: 빨간색 계열 */
.apv-state-BA3 {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.apv-empty {
  text-align: center;
  padding: 14px 0;
  color: #6b7280;
}

/* 미사용된 스타일 제거 (모달, 페이징 등은 목록 페이지에 없으므로) */

/* 모바일 대응 */
@media (max-width: 800px) {
  .apv-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .apv-filters {
    flex-direction: column;
    gap: 12px;
  }
  .apv-actions-group {
    justify-content: stretch;
    gap: 8px;
  }
  .apv-actions-group button {
    flex: 1;
  }
  .apv-input,
  .apv-select,
  .apv-input-date {
    min-width: unset;
    width: 100%;
  }
}
</style>
