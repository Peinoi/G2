<template>
  <div class="payment-container">
    <h2 class="page-title">후원 결제</h2>

    <div v-if="isLoading" class="loading-message">
      <p>프로그램 정보를 불러오는 중입니다...</p>
    </div>

    <div v-else class="content-wrapper">
      <div class="program-summary">
        <h3>선택한 프로그램</h3>
        <p v-if="programName">
          <strong>프로그램 이름:</strong> {{ programName }}
        </p>
        <p v-else style="color: red">프로그램 정보를 불러올 수 없습니다.</p>
      </div>

      <hr class="payment-divider" />

      <div class="payment-form">
        <div class="input-group">
          <label for="amount">후원 금액 (원)</label>
          <select
            id="amount"
            v-model.number="sponsorAmount"
            :disabled="donationUnitOptions.length === 0"
          >
            <option v-if="donationUnitOptions.length === 0" :value="1">
              금액 옵션 (최소 1원)
            </option>
            <option
              v-for="amount in donationUnitOptions"
              :key="amount"
              :value="amount"
            >
              {{ formatCurrency(amount) }}원
            </option>
          </select>
        </div>

        <div class="input-group">
          <label for="name">후원자 이름</label>
          <input type="text" id="name" v-model="sponsorName" disabled />
        </div>

        <div class="input-group">
          <label for="method">결제 수단 </label>

          <button>카카오 페이</button>
        </div>

        <div class="total-amount">
          최종 결제 금액: <strong>{{ formatCurrency(sponsorAmount) }}원</strong>
        </div>
      </div>

      <div class="payment-button-area">
        <button
          class="pay-button"
          @click="processPayment"
          :disabled="!isFormValid"
        >
          {{ formatCurrency(sponsorAmount) }}원 결제하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref, computed, onMounted, watch } from "vue"; // watch import

// import { useRouter } from "vue-router";
const getUserIdFromLocalStorage = () => {
  try {
    const userString = localStorage.getItem("user");
    if (userString) {
      const userData = JSON.parse(userString);
      console.log(userData.user);
      // 'user_id' 키로 값을 가져옴
      return userData.user_id || "";
    }
  } catch (e) {
    console.error("Local Storage 'user' 파싱 오류:", e);
    return "";
  }
  return ""; // 'user' 항목이 없을 경우
};
// -------------------------------
// Props 정의 (programCode를 받음)
// -------------------------------
const props = defineProps({
  programCode: {
    type: String,
    required: true,
  },
});

// -------------------------------
// 상태값
// -------------------------------
const programName = ref("");
const programDetail = ref(null);
const donationUnit = ref("");
const sponsorAmount = ref(1);
const sponsorName = ref(getUserIdFromLocalStorage());
//   결제 수단을 'transfer' (실시간 계좌 이체)로 고정
// const paymentMethod = ref("transfer");
const isLoading = ref(true);

// -------------------------------
// Computed: 후원 금액 옵션 생성 (순수 계산 함수)
// -------------------------------
const donationUnitOptions = computed(() => {
  if (!donationUnit.value) {
    return [];
  }
  // 상태 변경 로직 제거, 순수하게 계산만 수행
  return donationUnit.value
    .split(",")
    .map((unit) => parseInt(unit.trim()))
    .filter((amount) => !isNaN(amount) && amount >= 1)
    .sort((a, b) => a - b);
});

// -------------------------------
//   Watcher: sponsorAmount 초기화 및 조정 (Side Effect 분리)
// -------------------------------
watch(
  donationUnitOptions,
  (newOptions) => {
    // 옵션이 존재할 경우
    if (newOptions.length > 0) {
      // 현재 금액이 옵션에 포함되지 않은 경우, 첫 번째 옵션 금액으로 변경
      if (!newOptions.includes(sponsorAmount.value)) {
        sponsorAmount.value = newOptions[0];
      }
    }
    // 옵션이 전혀 없을 경우, 기본값(1000)으로 설정
    else {
      sponsorAmount.value = 1;
    }
  },
  { immediate: true }
); // 즉시 실행하여 초기 로딩 시에도 적용되도록 설정

// -------------------------------
// Computed: 폼 유효성 검사
// -------------------------------
const isFormValid = computed(() => {
  // 결제 수단은 고정되었으므로, 금액과 이름만 확인
  return sponsorAmount.value >= 1 && sponsorName.value.trim() !== "";
});

// -------------------------------
// 함수: 통화 포맷
// -------------------------------
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("ko-KR").format(amount);
};

// -------------------------------
// 함수: 상세 정보 조회 (Program Name, donation_unit 획득)
// -------------------------------
const getProgramInfo = async (programCode) => {
  isLoading.value = true;
  try {
    const res = await axios.get(`/api/sponsor/${programCode}`);

    programDetail.value = res.data.serviceSponsor.sponsorRows[0];

    if (programDetail.value) {
      programName.value = programDetail.value.program_name;
      donationUnit.value = programDetail.value.donation_unit || "";
    }
  } catch (e) {
    console.error("결제 정보 로딩 실패:", e);
    programName.value = "정보 로딩 실패";
  } finally {
    isLoading.value = false;
  }
};

// -------------------------------
// 함수: 결제 처리
// -------------------------------
const processPayment = async () => {
  try {
    const res = await axios.post("/api/pay/kakao/ready", {
      program_code: programDetail.value.program_code,
      userID: sponsorName.value,
      amount: sponsorAmount.value,
      item_name: programName.value,
    });
    console.log("카카오페이 ready 응답:", res.data);

    // tid 저장 → approve 때 필요
    localStorage.setItem(
      "kakao_tid", // 키 이름을 'data'를 추가하여 명확히 구분
      JSON.stringify({
        tid: res.data.tid,
        code: programDetail.value.program_code,
      })
    );

    // 카카오페이 결제창으로 이동
    const redirectUrl = res.data.next_redirect_pc_url;
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      alert("카카오페이 결제창 URL을 불러올 수 없습니다.");
    }
  } catch (error) {
    console.error("카카오페이 결제 준비 오류:", error);
    alert("결제 준비 중 오류가 발생했습니다.");
  }
};

// -------------------------------
// mount 시 초기 데이터 로딩
// -------------------------------
onMounted(() => {
  getProgramInfo(props.programCode);
});
</script>

<style scoped>
.payment-container {
  max-width: 600px;
  margin: 30px auto;
  padding: 30px;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.page-title {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
  font-size: 24px;
  border-bottom: 3px solid #007bff;
  display: inline-block;
  padding-bottom: 5px;
}

.program-summary {
  background: #eef;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.program-summary h3 {
  margin-top: 0;
  font-size: 18px;
  color: #007bff;
}

.payment-divider {
  border: none;
  height: 1px;
  background: #ddd;
  margin: 20px 0;
}

.payment-form .input-group {
  margin-bottom: 20px;
}

.payment-form label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #555;
}

.payment-form input[type="number"],
.payment-form input[type="text"],
.payment-form select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 16px;
}

/* 실시간 계좌 이체 고정 스타일 */
.payment-method-fixed {
  padding: 12px;
  border: 1px solid #007bff;
  background-color: #e6f0ff;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #007bff;
  text-align: center;
}

.total-amount {
  text-align: right;
  font-size: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  margin-top: 20px;
}

.payment-button-area {
  text-align: center;
  margin-top: 40px;
}

.pay-button {
  width: 100%;
  padding: 15px 0;
  font-size: 20px;
  font-weight: bold;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pay-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pay-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
