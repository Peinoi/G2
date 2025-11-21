<template>
  <div class="apv-page">
    <h2 class="apv-title">후원 프로그램 관리</h2>

    <div class="apv-toolbar apv-toolbar-top">
      <button class="apv-btn apv-btn-primary" @click="programAdd()">
        후원 프로그램 등록
      </button>
    </div>

    <div class="apv-toolbar">
      <div class="apv-filters">
        <div class="apv-date-range">
          <input
            type="date"
            v-model="startDate"
            class="apv-input apv-input-date"
          />
          <span class="apv-date-separator">~</span>
          <input
            type="date"
            v-model="endDate"
            class="apv-input apv-input-date"
          />
        </div>

        <select
          name="program_select"
          id="program_select"
          v-model="programCode"
          class="apv-select"
        >
          <option value="">프로그램 명</option>
          <option
            v-for="program in programList"
            :key="program.program_code"
            :value="program.program_code"
          >
            {{ program.program_name }}
          </option>
        </select>

        <select name="" id="" v-model="sponsorType" class="apv-select">
          <option value="">후원 방법</option>
          <option value="단기">단기</option>
          <option value="정기">정기</option>
        </select>

        <select name="" id="" v-model="status" class="apv-select">
          <option value="">진행 상태</option>
          <option value="진행전">진행전</option>
          <option value="진행중">진행중</option>
          <option value="완료">완료</option>
          <option value="중단">중단</option>
        </select>

        <select name="" id="" v-model="approval_status" class="apv-select">
          <option value="">승인 상태</option>
          <option value="승인대기">승인대기</option>
          <option value="승인완료">승인완료</option>
          <option value="반려">반려</option>
        </select>
      </div>

      <div class="apv-actions-group">
        <button class="apv-btn apv-btn-outline" @click="search()">검색</button>
        <button class="apv-btn" @click="clear()">조건 초기화</button>
      </div>
    </div>

    <div class="apv-table-wrap">
      <table class="apv-table">
        <thead>
          <tr>
            <th>프로그램</th>
            <th>후원 종류</th>
            <th>상태</th>
            <th>시작일</th>
            <th>종료일</th>
            <th>목표 금액</th>
            <th>현재 금액</th>
            <th>승인</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="program in sponsorList"
            @click="selectProgram(program)"
            :key="program.program_code"
          >
            <td>{{ program.program_name }}</td>
            <td>{{ program.sponsor_type }}</td>
            <td>
              <span class="apv-state-pill" :class="statusClass(program.status)">
                {{ program.status }}
              </span>
            </td>
            <td>{{ dateFormat(program.start_date, "yyyy-MM-dd") }}</td>
            <td>{{ dateFormat(program.end_date, "yyyy-MM-dd") }}</td>
            <td>{{ numberFormat(program.goal_amount) }}원</td>
            <td>{{ numberFormat(program.current_amount) }}원</td>
            <td>
              <button
                class="apv-btn apv-btn-xs"
                :class="approvalClass(program.approval_status)"
                @click.stop="Approval(program)"
              >
                {{ program.approval_status }}
              </button>
            </td>
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
import { ref, onBeforeMount } from "vue";
const emit = defineEmits(["go-to-add", "selectProgram"]);
let startDate = ref("");
let endDate = ref("");
let programCode = ref(""); // 프로그램 Select의 값
let sponsorType = ref(""); // 후원 방법 Select의 값
// let amount = ref(null); // 금액 Input의 값
let status = ref(""); // 진행 상태 Select의 값
let approval_status = ref(""); // 승인 상태 Select의 값
let sponsorList = ref([]); // 전체 조회 조건 조회
let programList = ref([]); // 검색창 프로그램 명 리스트 불러오기

// 헬퍼 함수 추가: 상태 클래스 매핑
const statusClass = (statusValue) => {
  switch (statusValue) {
    case "진행전":
      return "apv-state-BA1"; // 노란색 계열
    case "진행중":
      return "apv-state-BA2"; // 녹색 계열
    case "완료":
      return "apv-state-BA3"; // 빨간색 계열 (완료 상태는 다른 색으로 변경 필요 시 수정)
    case "중단":
      return "apv-state-BA3"; // 빨간색 계열
    default:
      return "";
  }
};

// 헬퍼 함수 추가: 승인 상태 클래스 매핑
const approvalClass = (approvalStatus) => {
  switch (approvalStatus) {
    case "승인대기":
    case "승인대기중":
      return "apv-btn-outline";
    case "승인완료":
    case "승인":
      return "apv-btn-primary";
    case "반려":
      return "apv-btn-danger";
    default:
      return "";
  }
};
const getSponsorList = async (params = {}) => {
  let result = await axios
    .get(`/api/sponsor`, { params: params })
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
  const userJsonString = localStorage.getItem("user");

  let userId = null;

  const userObject = JSON.parse(userJsonString);

  userId = String(userObject.user_id);

  let list = JSON.parse(JSON.stringify(res));

  // filter의 반환값을 list에 다시 할당 (재할당)
  list = list.filter((item) => {
    // 승인된 프로그램은 전체 공개
    if (
      item.approval_status === "승인" ||
      item.approval_status === "승인완료"
    ) {
      return true;
    }

    // 그 외 상태는 작성자 본인만 조회 가능
    return String(item.writer) === userId;
  });

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
const search = () => {
  const searchParams = {
    startDate: startDate.value,
    endDate: endDate.value,
    programCode: programCode.value,
    sponsorType: sponsorType.value,
    // amount: amount.value,
    status: status.value,
    approval_status: approval_status.value,
  };

  // getSponsorList 함수를 검색 파라미터와 함께 호출
  console.log(searchParams);
  getSponsorList(searchParams);
};

const programAdd = () => {
  emit("go-to-add"); // 'go-to-add' 이벤트를 발생시킴
};

const clear = () => {
  startDate.value = "";
  endDate.value = "";
  programCode.value = "";
  sponsorType.value = "";
  // amount.value = null;
  status.value = "";
  approval_status.value = "";
  getSponsorList(); // 전체 리스트 다시 조회
};
// client/comments/Sponsor/ProgramList.vue

const selectProgram = async (program) => {
  console.log("선택된 프로그램:", program);

  let result;
  try {
    result = await axios.get(`/api/sponsor/${program.program_code}`);
  } catch (err) {
    console.error("단건 조회 API 호출 실패:", err);
    alert("프로그램 상세 정보를 불러오는 데 실패했습니다.");
    return;
  }

  // 1. 응답 데이터 처리
  // ProgramList.vue에서는 sponsorRows[0]와 attachments를 분리하여 받아야 합니다.
  const programDetail = result.data.serviceSponsor.sponsorRows[0];
  const attachments = result.data.serviceSponsor.attachments; // ✨ 첨부파일 데이터 추출

  // 2. 상위 컴포넌트로 데이터와 함께 이벤트 발생
  if (programDetail) {
    // 프로그램 상세 정보에 첨부파일 목록을 합쳐서 전달합니다.
    const fullDetail = {
      ...programDetail,
      attachments: attachments, // ✨ 첨부파일 목록을 추가
    };
    emit("select-program", fullDetail); // 'select-program' 이벤트를 상세 데이터와 함께 발생시킵니다.
  }
};

const Approval = async (program) => {
  if (program.approval_status === "승인대기중") {
    alert("이미 승인 요청 중입니다.");
    return;
  }
  if (program.approval_status === "승인") {
    alert("승인이 완료된 건입니다.");
    return;
  }
  if (!confirm("승인 요청 하시겠습니까?")) return;

  try {
    const userJson = localStorage.getItem("user");
    const user = JSON.parse(userJson);
    const requesterCode = user.user_code;

    await axios.post(`/api/sponsor/${program.program_code}/request-approval`, {
      requesterCode,
    });

    alert("승인 요청을 발송했습니다.");
    getSponsorList(); // 목록 새로고침
  } catch (err) {
    console.error(err);
    alert("승인 요청 중 오류가 발생했습니다.");
  }
};
</script>

<!-- ============================================================= -->
<style scoped>
* {
  font-size: 15px;
}
/* === ManagerApprovals.vue 와 동일 스타일 적용 === */
.apv-page {
  max-width: 1700px;
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
  justify-content: flex-start;
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
.apv-table td:nth-child(6),
.apv-table td:nth-child(7) {
  text-align: right !important;
}
</style>
