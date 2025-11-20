<template>
  <div class="at-page">
    <h2 class="at-title">후원 프로그램 활동 보고서</h2>

    <div class="at-toolbar">
      <div class="at-row">
        <div class="at-field-group at-field-grow">
          <label for="program_select" class="at-label">프로그램</label>
          <select
            name="program_select"
            id="program_select"
            v-model="programCode"
            class="at-select"
          >
            <option value="">-- 프로그램 선택 --</option>
            <option
              v-for="program in sponsorList"
              :key="program.program_code"
              :value="program.program_code"
            >
              {{ program.program_name }}
            </option>
          </select>
        </div>
      </div>

      <div class="at-row">
        <div class="at-field-group at-field-grow">
          <label for="title" class="at-label">제목</label>
          <material-input
            id="title"
            placeholder="제목을 입력해주세요"
            class="at-input"
            v-model="title"
          />
        </div>
      </div>

      <div class="at-field-group">
        <label class="at-label">내용</label>
        <div class="ck-wrapper">
          <MyEditor v-model="content" />
        </div>
      </div>

      <!-- 후원금 사용 용도 -->
      <div class="at-row at-expenditure-header">
        <div class="at-field-group at-field-grow">
          <label class="at-label">후원금 사용 용도</label>
        </div>
        <div>
          <material-button @click="addExpenditure" class="at-btn-add"
            >추가</material-button
          >
        </div>
      </div>

      <!-- 동적 항목 -->
      <div
        v-for="item in expenditureList"
        :key="item.id"
        class="at-expenditure-item"
      >
        <div class="at-row at-expenditure-row">
          <div class="at-field-group at-field-half">
            <label :for="`usageItem-${item.id}`" class="at-label"
              >사용 항목</label
            >
            <material-input
              :id="`usageItem-${item.id}`"
              placeholder="예: 물품 구매"
              class="at-input"
              v-model="item.usageItem"
            />
          </div>

          <div class="at-field-group at-field-half">
            <label :for="`recipient-${item.id}`" class="at-label">사용처</label>
            <material-input
              :id="`recipient-${item.id}`"
              placeholder="예: A 보육원"
              class="at-input"
              v-model="item.recipient"
            />
          </div>
        </div>

        <div class="at-row at-expenditure-row">
          <!-- 금액 입력 (자동 콤마 적용) -->
          <div class="at-field-group at-field-half">
            <label :for="`amount-${item.id}`" class="at-label"
              >지급 금액 (원)</label
            >
            <material-input
              :id="`amount-${item.id}`"
              placeholder="지급 금액을 입력해주세요 "
              class="at-input"
              v-model="item.amountFormatted"
              @input="formatAmount(item)"
            />
          </div>

          <div class="at-field-group at-field-half at-date-field">
            <label :for="`usedAt-${item.id}`" class="at-label">사용일</label>
            <input
              :id="`usedAt-${item.id}`"
              class="at-select"
              type="date"
              v-model="item.usedAt"
            />
          </div>

          <div class="at-delete-col">
            <material-button
              class="at-btn-delete"
              @click="removeExpenditure(item.id)"
            >
              삭제
            </material-button>
          </div>
        </div>
      </div>
    </div>

    <div class="at-actions">
      <material-button class="at-btn at-btn-primary" v-on:click="activityAdd">
        제출
      </material-button>
      <material-button class="at-btn" @click="goList()">닫기</material-button>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import MaterialInput from "@/components/MaterialInput.vue";
import MaterialButton from "@/components/MaterialButton.vue";
import numberFormat from "../../../utils/numberFormat.js";
import { ref, onBeforeMount, defineEmits } from "vue";
import MyEditor from "@/components/Sponsor/Common/CkEditor.vue";
// --- [데이터 정의] ---
let sponsorList = ref([]); // 프로그램 목록
const programCode = ref("");
const title = ref("");
const content = ref("");

// 후원금 사용 내역 (동적)
const expenditureList = ref([
  {
    id: Date.now(),
    usageItem: "",
    recipient: "",
    amount: null, // 실제 숫자
    amountFormatted: "", // 콤마 포함 문자열
    usedAt: "",
  },
]);

// emit 선언
const emit = defineEmits(["goToList"]);

/**
 * 프로그램 목록 API 호출
 */
const getSponsorList = async () => {
  let result = await axios.get(`/api/sponsor`).catch((err) => console.log(err));
  if (!result || !result.data) {
    console.log("조회 결과 데이터가 유효하지 않습니다.");
    sponsorList.value = [];
    return;
  }
  const res = result.data.serviceSponsor;
  sponsorList.value = JSON.parse(JSON.stringify(res));
};

/**
 * 입력값을 콤마 포함 문자열로 변환
 */
const formatAmount = (item) => {
  // 숫자만 남기기
  let raw = item.amountFormatted.replace(/[^0-9]/g, "");

  // 실제 숫자 저장
  item.amount = raw ? Number(raw) : null;

  // 화면 표시용 문자열 포맷
  item.amountFormatted = raw ? numberFormat(raw) : "";
};

/**
 * 항목 추가
 */
const addExpenditure = () => {
  expenditureList.value.push({
    id: Date.now(),
    usageItem: "",
    recipient: "",
    amount: null,
    amountFormatted: "",
    usedAt: "",
  });
};

/**
 * 항목 삭제
 */
const removeExpenditure = (id) => {
  if (expenditureList.value.length === 1) {
    alert("최소 하나의 사용 용도 항목은 유지해야 합니다.");
    return;
  }

  expenditureList.value = expenditureList.value.filter(
    (item) => item.id !== id
  );
};

/**
 * 목록 이동
 */
const goList = () => {
  emit("goToList");
};

/**
 * 제출
 */
const activityAdd = () => {
  console.log("--- 등록 데이터 확인 ---");
  console.log("프로그램 코드:", programCode.value);
  console.log("제목:", title.value);
  console.log("내용:", content.value);

  // 실제 amount 값이 숫자로 들어가 있음
  console.log(
    "후원금 사용 내역:",
    JSON.parse(JSON.stringify(expenditureList.value))
  );

  // TODO: 등록 API 호출
};

// mount
onBeforeMount(() => {
  getSponsorList();
});

defineExpose({
  getSponsorList,
});
</script>

<style scoped>
/* AuthorityTransfer.vue의 스타일 테마를 기반으로 재구성 */

.at-page {
  /* 컨테이너 역할을 하며, 기존 #container의 max-width를 유지 */
  max-width: 700px;
  margin: 0 auto;
  padding: 30px;
  background-color: #f7f9fc;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.at-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #1f2937;
  padding-bottom: 5px;
  border-bottom: 1px solid #e5e7eb;
}

.at-toolbar {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* 필드 그룹 간의 간격 */
}

.at-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
}

.at-field-group {
  /* 필드를 수직으로 배열 */
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%; /* 너비 전체 사용 */
}

.at-field-grow {
  flex: 1;
}

.at-label {
  font-size: 14px;
  color: #555;
  font-weight: 500; /* 라벨 강조 */
}

/* 일반 <select> 에만 스타일 적용 */
.at-select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
  font-size: 15px;
  color: #374151;
  background-color: #ffffff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.ck-wrapper {
  width: 100%;
  display: block;
}

/* 포커스 시 스타일 (select, textarea만) */
.at-select:focus,
.at-textarea:focus {
  border-color: #409eff; /* at-btn-primary 색상 */
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

/* 액션 버튼 그룹 */
.at-actions {
  margin-top: 30px;
  padding-top: 20px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  gap: 10px; /* 버튼 간격 */
}

.at-btn {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  margin: 0 5px;
}

/* --------------------- [추가된 스타일] --------------------- */

/* '후원금 사용 용도' 헤더와 버튼 배치 */
.at-expenditure-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 수직 정렬 */
  margin-top: 25px;
  padding-bottom: 5px;
  border-bottom: 2px solid #e5e7eb; /* 구분을 위해 진한 선 */
}

/* 항목 추가 버튼 (색상 변경) */
.at-btn-add {
  background-color: #10b981; /* Green */
  color: white;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

/* 동적으로 생성되는 각 사용 내역 항목 컨테이너 */
.at-expenditure-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.at-expenditure-row {
  gap: 20px; /* 필드 간의 수평 간격 */
  margin-bottom: 15px;
  align-items: flex-end; /* 필드 높이 정렬 */
}

/* 2개의 필드가 한 줄에 들어가도록 너비 조정 */
.at-field-half {
  flex: 1; /* 남은 공간을 균등하게 분할 */
  min-width: 40%; /* 최소 너비 설정 (모바일 대응) */
}

/* 삭제 버튼 컨테이너 (오른쪽 정렬) */
.at-delete-col {
  display: flex;
  align-items: flex-end; /* 라벨과 입력 필드 높이에 맞춤 */
  padding-left: 10px;
}

/* 삭제 버튼 스타일 */
.at-btn-delete {
  background-color: #ef4444; /* Red */
  color: white;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap; /* 버튼 내용 줄바꿈 방지 */
}

/* 날짜 입력 필드 스타일 (일반 input[type=date]에 at-select 스타일 재사용) */
.at-date-field input[type="date"] {
  height: 38px; /* MaterialInput과 높이 맞추기 */
  line-height: 38px;
  /* at-select의 스타일을 상속받으면서 높이만 재조정 */
}

/* 모바일 대응 */
@media (max-width: 600px) {
  .at-page {
    padding: 20px;
  }
  .at-actions {
    flex-direction: column;
    gap: 10px;
  }
  .at-actions .at-btn {
    width: 100%;
    margin: 0;
  }

  /* 동적 항목 모바일 대응 */
  .at-expenditure-row {
    flex-direction: column;
    gap: 10px;
  }
  .at-field-half {
    min-width: 100%;
  }
  .at-delete-col {
    /* 모바일에서 삭제 버튼을 항목의 가장 아래에 위치 */
    padding-left: 0;
    width: 100%;
    margin-top: 10px;
  }
  .at-btn-delete {
    width: 100%;
  }
}
:deep(.ck-editor__editable) {
  min-height: 200px;
}
</style>
