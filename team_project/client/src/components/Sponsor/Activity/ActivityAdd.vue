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
          />
        </div>
      </div>

      <div class="at-row">
        <div class="at-field-group at-field-grow">
          <label for="content" class="at-label">내용</label>
          <textarea
            id="content"
            placeholder="내용을 입력해주세요"
            class="at-textarea"
          />
        </div>
      </div>

      <div class="at-row">
        <div class="at-field-group at-field-grow">
          <label for="amount" class="at-label">사용 금액</label>
          <material-input
            id="amount"
            placeholder="금액을 입력해주세요"
            class="at-input"
          />
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
import { ref, onBeforeMount, defineEmits } from "vue";
let sponsorList = ref([]);
const emit = defineEmits(["goToList"]);

const getSponsorList = async () => {
  let result = await axios.get(`/api/sponsor`).catch((err) => console.log(err));
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
const goList = () => {
  emit("goToList");
};
const activityAdd = () => {
  console.log("등록");
};
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

/* 일반 <textarea> 스타일 추가 */
.at-textarea {
  width: 100%;
  height: 120px; /* 높이 지정 */
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
  font-size: 15px;
  color: #374151;
  background-color: #ffffff;
  resize: vertical; /* 수직 크기 조절 허용 */
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

/* 포커스 시 스타일 (select, textarea만) */
.at-select:focus,
.at-textarea:focus {
  border-color: #409eff; /* at-btn-primary 색상 */
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

/* MaterialButton이 아닌 일반 버튼처럼 보이도록 클래스 재정의 (컴포넌트 자체 스타일이 적용되므로, 여기서는 레이아웃만 조정) */
/* .at-btn, .at-btn-primary 스타일은 MaterialButton이 레이아웃에 맞게 보이도록 유지합니다. */

.at-btn {
  /* MaterialButton의 크기와 모양을 AuthorityTransfer 테마에 맞춤 */
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  margin: 0 5px;
  /* border, background, color 등은 MaterialButton의 스타일을 따름 */
}

.at-btn-primary {
  /* MaterialButton의 primary 스타일이 AuthorityTransfer의 primary와 다르다면, 이 클래스를 이용해 오버라이드할 수 있습니다. */
  /* 현재는 MaterialButton이 잘 적용된다고 가정하고 추가 스타일은 최소화 */
}

.at-actions {
  /* 버튼 그룹 컨테이너 스타일 */
  margin-top: 30px;
  padding-top: 20px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  gap: 10px; /* 버튼 간격 */
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
}
</style>
