<!-- src/views/ResultList.vue -->
<template>
  <section class="p-6 max-w-screen-xl mx-auto">
    <!-- 상단 타이틀 + 역할 선택 -->
    <header class="flex items-center justify-between mb-2">
      <h2 class="text-2xl font-semibold">지원결과 목록</h2>

      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-600">역할 선택</span>
        <select v-model="role" class="input text-sm w-32">
          <option value="1">1. 일반 사용자</option>
          <option value="2">2. 담당자</option>
          <option value="3">3. 관리자</option>
          <option value="4">4. 시스템</option>
        </select>
      </div>
    </header>

    <!-- 선택된 역할 안내 -->
    <p class="text-xs text-gray-500 mb-2">현재 역할: {{ roleLabel }}</p>

    <!-- 카드 & 테이블 -->
    <div class="border rounded-lg overflow-hidden bg-white w-full">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 text-xs text-gray-600">
          <tr>
            <th class="px-3 py-2 text-center w-14">No</th>
            <th class="px-3 py-2 text-left">제출코드</th>
            <th class="px-3 py-2 text-left">작성자</th>
            <th class="px-3 py-2 text-left">담당자</th>
            <th class="px-3 py-2 text-left">조사지 제출일</th>
            <th class="px-3 py-2 text-left">계획 작성일</th>
            <!-- 🔹 결과 작성일 추가 -->
            <th class="px-3 py-2 text-left">결과 작성일</th>
            <th class="px-3 py-2 text-center">상태</th>
            <th class="px-3 py-2 text-center">작업</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, idx) in plans"
            :key="row.planCode"
            @click.stop="goDetail(row)"
            class="cursor-pointer hover:bg-gray-50"
          >
            <td class="px-3 py-2 text-center">
              {{ idx + 1 }}
            </td>

            <td class="px-3 py-2">
              {{ row.submitCode }}
            </td>

            <td class="px-3 py-2">
              {{ row.writerName || "-" }}
            </td>

            <td class="px-3 py-2">
              {{ row.assiName || "-" }}
            </td>

            <td class="px-3 py-2 whitespace-nowrap">
              {{ formatDate(row.submitAt) }}
            </td>

            <td class="px-3 py-2 whitespace-nowrap">
              {{ formatDate(row.writtenAt) }}
            </td>

            <!-- 🔹 결과 작성일 표시 (필드명: resultWrittenAt 가정) -->
            <td class="px-3 py-2 whitespace-nowrap">
              {{ formatDate(row.resultWrittenAt) }}
            </td>

            <td class="px-3 py-2 text-center whitespace-nowrap">
              <!-- 🔹 CD7(반려)일 때만 클릭 가능 + 모달 오픈 -->
              <span
                v-if="row.status === 'CD7' && role !== '1'"
                class="text-red-600 underline cursor-pointer"
                @click.stop="openRejectReason(row)"
              >
                {{ statusLabel(row.status) }}
              </span>

              <!-- 나머지 상태는 그냥 텍스트 -->
              <span v-else>
                {{ statusLabel(row.status) }}
              </span>
            </td>

            <!-- 작업 -->
            <td class="px-3 py-2">
              <div class="flex items-center justify-center">
                <template v-if="role === '2'">
                  <!-- 🔹 CD1, CD3 → 작성하기 -->
                  <button
                    v-if="row.status === 'CD1' || row.status === 'CD3'"
                    class="px-3 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100"
                    @click.stop="handleWrite(row)"
                  >
                    작성하기
                  </button>

                  <!-- 🔹 CD4 → 수정하기 -->
                  <button
                    v-else-if="row.status === 'CD4'"
                    class="px-3 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100"
                    @click.stop="handleEdit(row)"
                  >
                    수정하기
                  </button>

                  <!-- 🔹 CD7 → 재수정하기 (계속 사용) -->
                  <button
                    v-else-if="row.status === 'CD7'"
                    class="px-3 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100"
                    @click.stop="handleReEdit(row)"
                  >
                    재수정하기
                  </button>

                  <!-- 담당자지만 버튼 조건에 안 맞으면 대시 -->
                  <span v-else class="text-gray-400 text-xs">-</span>
                </template>

                <!-- 담당자가 아니면 항상 대시 -->
                <span v-else class="text-gray-400 text-xs">-</span>
              </div>
            </td>
          </tr>

          <tr v-if="!plans.length">
            <td colspan="9" class="px-3 py-6 text-center text-gray-500">
              등록된 지원결과가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 🔻 반려 사유 모달 -->
    <div v-if="rejectReasonModalOpen" class="modal-overlay">
      <div class="modal-container">
        <h3 class="text-lg font-semibold mb-3">반려 사유</h3>

        <div v-if="rejectReasonLoading" class="text-sm text-gray-500">
          불러오는 중...
        </div>

        <div v-else-if="rejectReasonError" class="text-sm text-red-600">
          {{ rejectReasonError }}
        </div>

        <div v-else>
          <!-- 🔹 반려일 -->
          <p class="text-sm text-gray-600 mb-2">
            반려일자:
            <span class="font-medium">
              {{ formatDate(rejectReasonDate) }}
            </span>
          </p>

          <!-- 반려 사유 텍스트 박스 -->
          <div
            class="text-sm whitespace-pre-line text-gray-800 max-h-60 overflow-y-auto border rounded px-3 py-2 bg-gray-50"
          >
            {{ rejectReasonText || "등록된 반려 사유가 없습니다." }}
          </div>
        </div>

        <div class="modal-actions mt-4 flex justify-end gap-2">
          <MaterialButton
            color="dark"
            size="sm"
            @click="closeRejectReasonModal"
          >
            닫기
          </MaterialButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();

// 역할 선택 (기본: 담당자)
const role = ref("2");

// 역할 라벨
const roleLabel = computed(() => {
  switch (role.value) {
    case "1":
      return "1. 일반 사용자";
    case "2":
      return "2. 담당자";
    case "3":
      return "3. 관리자";
    case "4":
      return "4. 시스템";
    default:
      return role.value;
  }
});

// 목록 데이터
const plans = ref([]);

// 날짜 포맷터 (YYYY-MM-DD만 보여주고 null 이면 '-')
const formatDate = (v) => {
  if (!v) return "-";
  return String(v).slice(0, 10);
};

// 🔹 결과 상태 코드 라벨
function statusLabel(code) {
  switch (code) {
    case "CD1":
      return "지원중";
    case "CD3":
      return "지원중";
    case "CD4":
      return "검토중";
    case "CD5":
      return "지원완료";
    case "CD6":
      return "재승인요청";
    case "CD7":
      return "반려";
    default:
      return code || "-";
  }
}

// 🔹 목록조회 (api/result)
const loadList = async () => {
  const res = await axios.get("api/result", {
    params: { role: role.value },
  });
  plans.value = res.data.result || [];
};

// 역할 바뀔 때마다 다시 조회
watch(role, () => {
  loadList();
});

// 첫 로딩 때 호출
onMounted(() => {
  loadList();
});

// 🔹 작성하기: result-write 로 이동
const handleWrite = (row) => {
  console.log("지원결과 작성하기 클릭:", row);
  router.push({
    name: "result-write",
    params: { submitcode: row.submitCode },
  });
};

// 🔹 수정하기: result-edit 로 이동
const handleEdit = (row) => {
  console.log("지원결과 수정하기 클릭:", row);
  router.push({
    name: "result-edit",
    params: { resultCode: row.resultCode },
    query: { planCode: row.planCode, submitCode: row.submitCode },
  });
};

// 🔹 재수정하기: result-edit 로 이동 (동일)
const handleReEdit = (row) => {
  console.log("지원결과 재수정하기 클릭:", row);
  router.push({
    name: "result-edit",
    params: { resultCode: row.resultCode },
    query: { planCode: row.planCode, submitCode: row.submitCode },
  });
};

// 🔹 상세: resultDetail 로 이동
function goDetail(row) {
  router.push({
    name: "resultDetail",
    params: { resultCode: row.resultCode },
    query: { submitCode: row.submitCode, role: role.value },
  });
}

// 🔻 반려 사유 모달 상태
const rejectReasonModalOpen = ref(false);
const rejectReasonText = ref("");
const rejectReasonDate = ref("");
const rejectReasonLoading = ref(false);
const rejectReasonError = ref("");

// 🔹 반려 사유 모달 열기 + 서버에서 내용 조회 (api/result)
async function openRejectReason(row) {
  rejectReasonModalOpen.value = true;
  rejectReasonText.value = "";
  rejectReasonDate.value = "";
  rejectReasonError.value = "";
  rejectReasonLoading.value = true;

  try {
    const { data } = await axios.get(
      `/api/result/${row.resultCode}/rejection-reason`
    );

    if (data?.success === false) {
      throw new Error(data.message || "반려 사유를 불러오지 못했습니다.");
    }

    rejectReasonText.value =
      data?.result?.rejection_reason ?? data?.rejection_reason ?? "";

    rejectReasonDate.value = data?.result?.approval_date ?? "";
  } catch (e) {
    console.error(e);
    rejectReasonError.value =
      e.response?.data?.message || e.message || "반려 사유 조회 중 오류";
  } finally {
    rejectReasonLoading.value = false;
  }
}

function closeRejectReasonModal() {
  rejectReasonModalOpen.value = false;
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-container {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.35);
}
</style>
