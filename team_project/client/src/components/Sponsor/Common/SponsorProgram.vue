<template>
  <div class="p-6">
    <div>
      <div>
        <span class="text-xl font-bold mb-2">진행 중인 캠페인</span>
        <span class="text-xl font-bold mb-2">종료 된 캠페인</span>

        <hr class="clear-fix" />
      </div>
      <div id="search">
        <span>프로그램 명</span>
        <select name="program_select" id="program_select" v-model="programCode">
          <option value="" selected>-- 전체 프로그램 --</option>
          <option
            v-for="program in programList"
            :key="program.program_code"
            :value="program.program_code"
          >
            {{ program.program_name }}
          </option>
        </select>

        <span>진행</span>
        <select name="" id="" v-model="status">
          <option value="" selected>-- 전체 --</option>
          <option value="집행전">집행전</option>
          <option value="집행 중">집행 중</option>
          <option value="집행 완료">집행 완료</option>
          <option value="집행 불가">집행 불가</option>
        </select>

        <button v-on:click="search()">검색</button>
        <button v-on:click="clear()">조건 초기화</button>
      </div>
      <hr />
      <table border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th>프로그램</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="program in sponsorList"
            @click="selectProgram(program)"
            :key="program.program_code"
          >
            <td>{{ program.program_name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<!-- ============================================================= -->

<script setup>
import axios from "axios";
import { ref, onBeforeMount } from "vue";
let programCode = ref(""); // 프로그램 Select의 값
let status = ref(""); // 승인 Select의 값
let sponsorList = ref([]); // 전체 조회 조건 조회
let programList = ref([]); // 검색창 프로그램 명 리스트 불러오기
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

  // 1. 테이블 목록 갱신
  sponsorList.value = JSON.parse(JSON.stringify(res));

  console.log(sponsorList.value);
  // 2. 검색 조건이 없는 최초 로딩 시에만 programList를 갱신
  //    (검색 결과는 programList에 영향을 주지 않아야 함)
  if (Object.keys(params).length === 0) {
    programList.value = JSON.parse(JSON.stringify(res));
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
    programCode: programCode.value,
    status: status.value,
  };

  // getSponsorList 함수를 검색 파라미터와 함께 호출
  console.log(searchParams);
  getSponsorList(searchParams);
};

const clear = () => {
  programCode.value = "";
  status.value = "";
  getSponsorList(); // 전체 리스트 다시 조회
};
</script>

<!-- ============================================================= -->

<style scoped>
/* div#search에 Flexbox 적용 */
#search {
  display: flex; /* 자식 요소들을 유연하게 배치 */
  align-items: center; /* 수직 중앙 정렬 */
  gap: 15px; /* 요소들 사이의 기본 간격 설정 */
  flex-wrap: wrap; /* 창 크기가 줄어들면 줄바꿈 허용 (안전성) */
}

/* 금액 입력 input의 너비 유지 */
.inputBox {
  width: 100px;
}
.clear-fix {
  clear: both; /* float된 요소 아래에서 시작하도록 강제 */
  /* 필요하다면 hr의 기본 margin을 제거/조정하여 간격 제어 */
  margin-top: 0;
  margin-bottom: 20px;
}

#proAdd {
  float: left; /* 이 스타일은 유지 */
  margin-left: 0;
  margin-bottom: 10px; /* hr이 clear 되었으므로 이 간격은 버튼과 다음 요소 사이에 생깁니다. */
  padding: 8px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Select와 Input 요소의 기본 너비를 조절하여 보기 좋게 만듭니다. */
#search input[type="date"],
#search select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* 금액 input 뒤의 '승인' 텍스트를 Input과 붙여주기 위해 약간 조정 */
#search input[type="number"] {
  margin-right: -10px;
}

/* 검색 버튼 스타일 조정 */
#search button {
  padding: 6px 15px;
  background-color: #007bff; /* 파란색 배경 (예시) */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
tbody tr:hover {
  cursor: pointer;
  background-color: gray;
  opacity: 0.5;
  color: white;
}
</style>
