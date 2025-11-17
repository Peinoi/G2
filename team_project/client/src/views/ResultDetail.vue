<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- 상단 타이틀 -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">지원결과 상세</h2>

      <div class="space-x-2 flex items-center">
        <!-- ← 목록으로 -->
        <MaterialButton color="dark" size="sm" @click="goBack">
          ← 목록으로
        </MaterialButton>

        <!-- 작성하기 (담당자만 / CD1, CD3) -->
        <MaterialButton
          v-if="role === 2 && (status === 'CD1' || status === 'CD3')"
          color="dark"
          size="sm"
          @click="goWrite"
        >
          작성하기
        </MaterialButton>

        <!-- 수정하기 (담당자만 / CD4) -->
        <MaterialButton
          v-else-if="role === 2 && status === 'CD4'"
          color="dark"
          size="sm"
          @click="goEdit"
        >
          수정하기
        </MaterialButton>

        <!-- 재수정하기 (담당자만 / CD7) -->
        <MaterialButton
          v-else-if="role === 2 && status === 'CD7'"
          color="dark"
          size="sm"
          @click="goEdit"
        >
          재수정하기
        </MaterialButton>
      </div>
    </header>

    <!-- 로딩 / 에러 -->
    <p v-if="loading" class="text-sm text-gray-500">
      지원결과 정보를 불러오는 중입니다...
    </p>
    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

    <!-- 기본정보 -->
    <div
      class="border rounded p-4 bg-gray-50 space-y-3"
      v-if="!loading && !error"
    >
      <div class="grid grid-cols-2 text-sm gap-2">
        <div>
          이름:
          <strong>{{ basicInfo.name || "-" }}</strong>
        </div>
        <div>생년월일: {{ basicInfo.ssnFront || "-" }}</div>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-sm mt-2">
        <!-- 계획서 제출일 -->
        <MaterialButton
          color="dark"
          size="sm"
          @click="openPlanDetail"
          v-if="basicInfo.planSubmitAt"
        >
          계획서 제출일: {{ formattedPlanSubmitAt }}
        </MaterialButton>

        <!-- 결과 작성일 -->
        <div class="flex items-center gap-2">
          <span>결과 작성일:</span>
          <span class="px-2 py-1 border rounded bg-white">
            {{ mainForm.resultDate || "-" }}
          </span>
        </div>

        <!-- 실제 진행기간 -->
        <div class="flex items-center gap-2">
          <span>실제 진행기간:</span>
          <span class="px-2 py-1 border rounded bg-white">
            {{ mainForm.actualStart || "미지정" }}
          </span>
          <span>~</span>
          <span class="px-2 py-1 border rounded bg-white">
            {{ mainForm.actualEnd || "미지정" }}
          </span>
        </div>
      </div>
    </div>

    <!-- 메인 결과 내용 -->
    <div v-if="!loading && !error">
      <!-- CD1 / CD3 안내 문구 -->
      <div
        v-if="isTemp"
        class="border rounded p-4 bg-yellow-50 text-xs text-gray-700 mb-4"
      >
        <template v-if="status === 'CD1'">
          이 지원결과는 <strong>임시저장</strong> 상태입니다.<br />
          목표, 내용 및 첨부파일은 작성 화면에서만 확인할 수 있습니다.
        </template>

        <template v-else>
          이 지원결과는 <strong>작성 전</strong> 상태입니다.<br />
          목표, 내용 및 첨부파일은 작성 화면에서만 확인할 수 있습니다.
        </template>
      </div>

      <!-- 실제 내용: 임시/작성전이 아닐 때만 -->
      <div v-if="!isTemp" class="space-y-4">
        <div>
          <h3 class="text-sm font-medium mb-1">결과 목표</h3>
          <div class="border rounded p-3 bg-white text-sm min-h-[40px]">
            {{ mainForm.goal || "-" }}
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium mb-1">결과 내용 (일반용)</h3>
          <div
            class="border rounded p-3 bg-white text-sm whitespace-pre-line min-h-[60px]"
          >
            {{ mainForm.publicContent || "-" }}
          </div>
        </div>

        <!-- 관리자용 내용: role !== 1 일 때만 -->
        <div v-if="role !== 1">
          <h3 class="text-sm font-medium mb-1">결과 내용 (관리자용)</h3>
          <div
            class="border rounded p-3 bg-white text-sm whitespace-pre-line min-h-[60px]"
          >
            {{ mainForm.privateContent || "-" }}
          </div>
        </div>

        <!-- 첨부 파일: role !== 1 일 때만 -->
        <div v-if="role !== 1">
          <h3 class="text-sm font-medium mb-1">첨부 파일</h3>

          <p v-if="!attachments.length" class="text-xs text-gray-500">
            첨부된 파일이 없습니다.
          </p>

          <ul v-else class="mt-1 text-xs text-gray-700 space-y-1">
            <li
              v-for="file in attachments"
              :key="file.attachCode"
              class="flex items-center justify-between gap-2"
            >
              <a
                :href="file.url"
                target="_blank"
                rel="noopener noreferrer"
                class="truncate underline"
              >
                {{ file.originalFilename }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 추가 결과들 -->
        <div
          v-if="!loading && !error && !isTemp && resultItems.length"
          class="space-y-4"
        >
          <h3 class="text-sm font-semibold">추가 결과</h3>

          <div
            v-for="item in resultItems"
            :key="item.id"
            class="border rounded p-4 bg-white space-y-3"
          >
            <div>
              <h4 class="text-sm font-medium mb-1">결과 목표</h4>
              <div class="border rounded p-2 text-sm bg-gray-50 min-h-[32px]">
                {{ item.goal || "-" }}
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium mb-1">결과 내용 (일반용)</h4>
              <div
                class="border rounded p-2 text-sm bg-gray-50 whitespace-pre-line min-h-[40px]"
              >
                {{ item.publicContent || "-" }}
              </div>
            </div>

            <!-- 관리자용 내용: role !== 1 일 때만 -->
            <div v-if="role !== 1">
              <h4 class="text-sm font-medium mb-1">결과 내용 (관리자용)</h4>
              <div
                class="border rounded p-2 text-sm bg-gray-50 whitespace-pre-line min-h-[40px]"
              >
                {{ item.privateContent || "-" }}
              </div>
            </div>
          </div>
        </div>

        <!-- 🔥 관리자(3) 전용 승인/반려 영역 -->
        <div
          v-if="role === 3 && (status === 'CD4' || status === 'CD6')"
          class="pt-4 border-t mt-4 space-y-3"
        >
          <!-- ⛔ 이전 반려 이력 표시 박스 (있을 때만) -->
          <div
            v-if="rejectionInfo && rejectionInfo.reason"
            class="border rounded p-3 bg-red-50 text-xs text-red-800"
          >
            <div class="font-semibold mb-1">반려 이력</div>

            <div class="flex items-center gap-2 mb-1">
              <span>{{ formattedRejectionDate }}</span>
            </div>

            <div>
              <div class="font-medium">사유:</div>
              <p class="whitespace-pre-line mt-1">
                {{ rejectionInfo.reason }}
              </p>
            </div>
          </div>

          <!-- 승인/반려 버튼 -->
          <div class="flex justify-end gap-3">
            <MaterialButton color="dark" size="sm" @click="handleApprove">
              승인
            </MaterialButton>
            <MaterialButton color="dark" size="sm" @click="handleReject">
              반려
            </MaterialButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔻 반려 사유 입력 모달 -->
    <div v-if="rejectModalOpen" class="modal-overlay">
      <div class="modal-container">
        <h3 class="text-lg font-semibold mb-3">반려 사유 입력</h3>

        <MaterialTextarea
          id="result-reject-reason"
          variant="outline"
          :rows="4"
          placeholder="반려 사유를 입력하세요..."
          :value="rejectReason"
          @input="(e) => (rejectReason = e.target.value)"
        />

        <div class="modal-actions">
          <MaterialButton color="dark" size="sm" @click="closeRejectModal">
            취소
          </MaterialButton>
          <MaterialButton color="dark" size="sm" @click="confirmReject">
            반려
          </MaterialButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

import MaterialButton from "@/components/MaterialButton.vue";
import MaterialTextarea from "@/components/MaterialTextarea.vue";

const route = useRoute();
const router = useRouter();

// 라우터에서 받은 값들
const resultCode = Number(route.params.resultCode || 0);
const submitCode = Number(route.query.submitCode || 0);

// 쿼리로 넘어온 role (1: 일반, 2: 담당자, 3: 관리자, 4: 시스템)
const role = computed(() => Number(route.query.role || 0));

// 상태 저장
const status = ref("");
// CD1(임시), CD3(작성전) 둘 다 isTemp 로 처리
const isTemp = computed(() => status.value === "CD1" || status.value === "CD3");

// 기본 정보 (이름/생년월일/계획서 작성일 등)
const basicInfo = ref({
  name: "",
  ssnFront: "",
  counselSubmitAt: "",
  planSubmitAt: "",
  resultWrittenAt: "",
});

const formattedPlanSubmitAt = computed(() => {
  const v = basicInfo.value.planSubmitAt;
  return v ? String(v).slice(0, 10) : "-";
});

// 메인 결과 폼
const mainForm = ref({
  resultDate: "",
  actualStart: "",
  actualEnd: "",
  goal: "",
  publicContent: "",
  privateContent: "",
});

// 추가 결과
const resultItems = ref([]);

// 첨부파일
const attachments = ref([]);

const loading = ref(false);
const error = ref("");

// 🔻 반려 모달 상태
const rejectModalOpen = ref(false);
const rejectReason = ref("");

// 🔻 상세 화면에서 보여줄 마지막 반려 이력
const rejectionInfo = ref({
  reason: "",
  date: "",
});

const formattedRejectionDate = computed(() => {
  const v = rejectionInfo.value?.date;
  return v ? String(v).slice(0, 10) : "-";
});

// 오늘 YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// 기본 정보 불러오기 (결과용 API)
async function loadBasicInfo() {
  if (!submitCode) return;

  const { data } = await axios.get(`/api/result/${submitCode}`);

  if (!data?.success || !data.result) {
    throw new Error(data?.message || "지원결과 기본 정보를 찾을 수 없습니다.");
  }

  const res = data.result;

  basicInfo.value = {
    name: res.name || "",
    ssnFront: (res.ssnFront || "").replace(/[^0-9]/g, "").slice(0, 6),
    counselSubmitAt: res.counselSubmitAt || "",
    planSubmitAt: res.planSubmitAt || "",
    resultWrittenAt: res.resultWrittenAt || "",
  };
}

// 결과 상세 불러오기
async function loadDetail() {
  const { data } = await axios.get(`/api/result/detail/${resultCode}`);

  if (!data?.success || !data.result) {
    throw new Error(data?.message || "지원결과 정보를 찾을 수 없습니다.");
  }

  const d = data.result;

  status.value = d.status || "";

  mainForm.value = {
    resultDate: d.main?.resultDate
      ? String(d.main.resultDate).slice(0, 10)
      : getTodayStr(),
    actualStart: d.main?.actualStart || "",
    actualEnd: d.main?.actualEnd || "",
    goal: d.main?.goal || "",
    publicContent: d.main?.publicContent || "",
    privateContent: d.main?.privateContent || "",
  };

  resultItems.value =
    (d.items || []).map((it, idx) => ({
      id: it.resultItemCode || Date.now() + idx,
      goal: it.goal || "",
      publicContent: it.publicContent || "",
      privateContent: it.privateContent || "",
    })) || [];

  attachments.value =
    (d.attachments || []).map((a) => ({
      attachCode: a.attachCode,
      originalFilename: a.originalFilename,
      url: a.url,
    })) || [];
}

// 🔹 마지막 반려 이력 조회 (관리자용 표시)
async function loadRejectionInfo() {
  try {
    const { data } = await axios.get(
      `/api/result/${resultCode}/rejection-reason`
    );

    if (data?.success && data.result) {
      const r = data.result;
      rejectionInfo.value = {
        reason: r.rejection_reason || "",
        // sql 에서 approval_date AS rejection_date 로 넘겨주고 있다고 가정
        date: r.rejection_date || r.approval_date || "",
      };
    } else {
      rejectionInfo.value = { reason: "", date: "" };
    }
  } catch (e) {
    console.error("[loadRejectionInfo]", e);
    // 오류 나도 화면 망가지지 않게만 처리
    rejectionInfo.value = { reason: "", date: "" };
  }
}

onMounted(async () => {
  try {
    loading.value = true;

    if (!resultCode) {
      throw new Error("resultCode가 없습니다. (라우터 params 확인 필요)");
    }

    // 1) 상세 먼저 로드 (status 세팅)
    await loadDetail();

    // 2) 기본정보는 submitCode 있을 때만
    if (submitCode) {
      await loadBasicInfo();
    }

    // 3) 관리자라면 반려 이력도 같이 조회
    if (role.value === 3) {
      await loadRejectionInfo();
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "지원결과 조회 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
});

function openPlanDetail() {
  if (!submitCode) return;
  window.open(`/plans/detail/${submitCode}`, "_blank");
}

// 목록으로
function goBack() {
  router.push({ name: "resultList" });
}

// 수정 화면으로 이동
function goEdit() {
  if (!resultCode) return;

  router.push({
    name: "plan-edit",
    params: { resultCode },
    query: submitCode ? { submitCode, role: role.value } : { role: role.value },
  });
}

// 작성 화면으로 이동
function goWrite() {
  if (!submitCode) return;

  router.push({
    name: "result-write",
    params: { submitcode: submitCode },
    query: { role: role.value },
  });
}

// ✅ 승인 (결과용 엔드포인트)
async function handleApprove() {
  try {
    const { data } = await axios.post(`/api/result/${resultCode}/approve`);
    if (data?.success) {
      alert("지원결과가 승인되었습니다.");
      await loadDetail();
    } else {
      alert(data.message || "승인 처리 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

// ✅ 반려 버튼 클릭 → 모달 열기
function handleReject() {
  rejectReason.value = "";
  rejectModalOpen.value = true;
}

// ✅ 모달 안에서 '반려' 확정 (결과용 엔드포인트)
async function confirmReject() {
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력해주세요.");
    return;
  }

  try {
    const { data } = await axios.post(`/api/result/${resultCode}/reject`, {
      reason: rejectReason.value,
    });
    if (data?.success) {
      alert("지원결과가 반려되었습니다.");
      rejectModalOpen.value = false;
      await loadDetail();
    } else {
      alert(data.message || "반려 처리 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

function closeRejectModal() {
  rejectModalOpen.value = false;
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

.modal-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
