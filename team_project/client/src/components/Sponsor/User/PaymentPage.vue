<template>
  <div class="payment-container">
    <h2 class="page-title">후원 결제</h2>
    
    <div v-if="isLoading" class="loading-message">
      <p>프로그램 정보를 불러오는 중입니다...</p>
    </div>

    <div v-else class="content-wrapper">
      <div class="program-summary">
        <h3>선택한 프로그램</h3>
        <p v-if="programName"><strong>프로그램 이름:</strong> {{ programName }}</p>
        <p v-else style="color: red;">프로그램 정보를 불러올 수 없습니다.</p>
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
            <option v-if="donationUnitOptions.length === 0" :value="1000">
              금액 옵션 없음 (최소 1,000원)
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
          <input type="text" id="name" v-model="sponsorName" placeholder="후원자 이름을 적어주세요" />
        </div>

        <div class="input-group">
          <label for="method">결제 수단 </label>
       
            <button> 실시간 계좌 이체</button>
   
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
          {{ formatCurrency(sponsorAmount) }}원 결제하기 (계좌 이체)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref, computed, onMounted, watch } from "vue"; // watch import
// import { useRouter } from "vue-router"; 

// -------------------------------
// Props 정의 (programCode를 받음)
// -------------------------------
const props = defineProps({
  programCode: {
    type: String,
    required: true
  }
});

// -------------------------------
// 상태값
// -------------------------------
const programName = ref("");
const programDetail = ref(null); 
const donationUnit = ref(""); 
const sponsorAmount = ref(10000); 
const sponsorName = ref("");
//   결제 수단을 'transfer' (실시간 계좌 이체)로 고정
const paymentMethod = ref("transfer"); 
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
        .split(',')
        .map(unit => parseInt(unit.trim()))
        .filter(amount => !isNaN(amount) && amount >= 1000)
        .sort((a, b) => a - b);
});

// -------------------------------
//   Watcher: sponsorAmount 초기화 및 조정 (Side Effect 분리)
// -------------------------------
watch(donationUnitOptions, (newOptions) => {
    // 옵션이 존재할 경우
    if (newOptions.length > 0) {
        // 현재 금액이 옵션에 포함되지 않은 경우, 첫 번째 옵션 금액으로 변경
        if (!newOptions.includes(sponsorAmount.value)) {
            sponsorAmount.value = newOptions[0];
        }
    } 
    // 옵션이 전혀 없을 경우, 기본값(1000)으로 설정
    else {
        sponsorAmount.value = 1000;
    }
}, { immediate: true }); // 즉시 실행하여 초기 로딩 시에도 적용되도록 설정


// -------------------------------
// Computed: 폼 유효성 검사
// -------------------------------
const isFormValid = computed(() => {
    // 결제 수단은 고정되었으므로, 금액과 이름만 확인
    return sponsorAmount.value >= 1000 && sponsorName.value.trim() !== '';
});

// -------------------------------
// 함수: 통화 포맷
// -------------------------------
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
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
const processPayment = () => {
    if (!isFormValid.value) {
        alert("모든 필수 항목을 입력해주세요.");
        return;
    }
    
    // 결제 정보 로그
    console.log(`[${props.programCode}] 프로그램에 ${formatCurrency(sponsorAmount.value)}원 결제 시도.`);
    console.log(`후원자 이름: ${sponsorName.value}, 결제 수단: ${paymentMethod.value} (실시간 계좌 이체)`);
    
    alert(`실시간 계좌 이체로 ${formatCurrency(sponsorAmount.value)}원 결제 요청을 진행합니다. (실제 결제 모듈 연동 필요)`); 
    // 실제 구현: 은행/결제사 API 호출 및 후원 정보 서버 저장 로직 추가
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