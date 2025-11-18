<template>
  <section class="p-6">
    <div class="page-shell space-y-6">
      <!-- 상단 타이틀 -->
      <header class="page-header">
        <h2 class="page-title text-2xl md:text-3xl font-bold tracking-tight">
          지원계획 작성
        </h2>

        <div class="header-actions">
          <MaterialButton color="dark" size="sm" @click="handleLoad">
            불러오기
          </MaterialButton>
          <MaterialButton color="dark" size="sm" @click="handleTempSave">
            임시 저장
          </MaterialButton>
        </div>
      </header>

      <!-- 로딩 / 에러 -->
      <p v-if="loading" class="text-sm text-gray-500">
        기본 정보를 불러오는 중입니다...
      </p>
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <!-- 기본정보 카드 -->
      <div class="meta-card space-y-3">
        <div class="grid grid-cols-2 text-sm gap-2">
          <div>
            이름: <strong>{{ submitInfo.name || "-" }}</strong>
          </div>
          <div>생년월일: {{ submitInfo.ssnFront || "-" }}</div>
        </div>

        <div class="meta-bottom">
          <!-- 상담지 제출일 버튼 -->
          <MaterialButton color="dark" size="sm" @click="openCounselDetail">
            상담지 제출일: {{ formattedCounselSubmitAt }}
          </MaterialButton>

          <!-- 계획 작성일 (오늘 날짜 표시) -->
          <label class="flex items-center gap-2 text-sm">
            계획 작성일:
            <span class="px-2 py-1 border rounded bg-white">
              {{ mainForm.planDate }}
            </span>
          </label>

          <!-- 예상 진행기간: YYYY-MM ~ YYYY-MM -->
          <div class="flex items-center gap-2 text-sm">
            <span>예상 진행기간:</span>
            <input
              type="month"
              v-model="mainForm.expectedStart"
              class="input h-8"
            />
            <span>~</span>
            <input
              type="month"
              v-model="mainForm.expectedEnd"
              class="input h-8"
            />
          </div>
        </div>
      </div>

      <!-- 메인 지원계획 카드 -->
      <div class="card-block space-y-4">
        <!-- 계획 목표 -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">계획 목표</label>
          <MaterialInput
            id="plan-goal"
            variant="static"
            size="default"
            v-model="mainForm.goal"
            placeholder="지원계획의 목표를 입력하세요"
          />
        </div>

        <!-- 계획 내용 (일반용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            계획 내용 (일반용)
          </label>
          <MaterialTextarea
            id="plan-content-public"
            variant="outline"
            :rows="4"
            placeholder="대상자/일반용 계획 내용을 입력하세요..."
            :value="mainForm.publicContent"
            @input="(e) => (mainForm.publicContent = e.target.value)"
          />
        </div>

        <!-- 계획 내용 (관계자/관리자용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            계획 내용 (관리자용)
          </label>
          <MaterialTextarea
            id="plan-content-private"
            variant="outline"
            :rows="4"
            placeholder="관계자/관리자용 내부 계획 내용을 입력하세요..."
            :value="mainForm.privateContent"
            @input="(e) => (mainForm.privateContent = e.target.value)"
          />
        </div>

        <!-- 첨부 파일 -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">첨부 파일</label>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            @change="onMainFilesChange"
            class="file-input"
          />
          <p class="mt-1 text-xs text-gray-500">
            * 여러 개 파일을 한 번에 선택하거나, 나눠서 여러 번 선택할 수
            있습니다.
          </p>

          <ul
            v-if="existingFiles.length"
            class="mt-2 text-xs text-gray-700 space-y-1"
          >
            <li
              v-for="(file, idx) in existingFiles"
              :key="file.attachCode"
              class="file-row"
            >
              <a
                :href="file.url"
                target="_blank"
                rel="noopener noreferrer"
                class="file-link"
              >
                {{ file.originalFilename }}
              </a>
              <button
                type="button"
                class="chip-button"
                @click="removeExistingFile(idx, file.attachCode)"
              >
                삭제
              </button>
            </li>
          </ul>

          <!-- 새로 선택한 파일 목록 -->
          <ul
            v-if="mainFiles.length"
            class="mt-2 text-xs text-gray-700 space-y-1"
          >
            <li
              v-for="(file, idx) in mainFiles"
              :key="file.name + '_' + file.lastModified + '_' + idx"
              class="file-row"
            >
              <span class="file-link">
                {{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)
              </span>
              <button
                type="button"
                class="chip-button"
                @click="removeMainFile(idx)"
              >
                삭제
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 추가 계획 카드들 -->
      <div
        v-for="item in planItems"
        :key="item.id"
        class="record-card space-y-4"
      >
        <div class="record-header">
          <h4 class="font-medium text-sm">추가 계획</h4>

          <MaterialButton
            color="dark"
            size="sm"
            variant="outlined"
            @click="removePlanItem(item.id)"
          >
            제거
          </MaterialButton>
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">계획 목표</label>
          <MaterialInput
            :id="`plan-item-goal-${item.id}`"
            variant="static"
            size="default"
            v-model="item.goal"
            placeholder="추가 계획의 목표를 입력하세요"
          />
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            계획 내용 (일반용)
          </label>
          <MaterialTextarea
            :id="`plan-item-public-${item.id}`"
            variant="outline"
            :rows="3"
            placeholder="대상자/일반용 내용을 입력하세요..."
            :value="item.publicContent"
            @input="(e) => (item.publicContent = e.target.value)"
          />
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            계획 내용 (관리자용)
          </label>
          <MaterialTextarea
            :id="`plan-item-private-${item.id}`"
            variant="outline"
            :rows="3"
            placeholder="관계자/관리자용 내용을 입력하세요..."
            :value="item.privateContent"
            @input="(e) => (item.privateContent = e.target.value)"
          />
        </div>
      </div>

      <!-- 하단 버튼 라인 -->
      <div class="action-bar">
        <div class="left-actions">
          <MaterialButton color="dark" size="sm" @click="goBack">
            작성 취소
          </MaterialButton>

          <MaterialButton color="dark" size="sm" @click="addPlanItem">
            + 계획 추가
          </MaterialButton>
        </div>

        <div class="right-actions">
          <MaterialButton
            color="dark"
            size="sm"
            class="ml-auto shrink-0"
            @click="submitAll"
          >
            제출하기
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
import MaterialInput from "@/components/MaterialInput.vue";

const route = useRoute();
const router = useRouter();

const submitCode = Number(route.params.submitcode || 0);

// 기본 정보
const submitInfo = ref({
  name: "",
  ssnFront: "",
  counselSubmitAt: "", // 상담지 제출일
});

const formattedCounselSubmitAt = computed(() => {
  const v = submitInfo.value.counselSubmitAt;
  return v ? v.slice(0, 10) : "-";
});

// 메인 계획 폼
const mainForm = ref({
  planDate: "", // 계획 작성일 (오늘 날짜)
  expectedStart: "", // 실제 진행기간 시작 (YYYY-MM)
  expectedEnd: "", // 실제 진행기간 종료 (YYYY-MM)
  goal: "",
  publicContent: "",
  privateContent: "",
});

// 첨부 파일들
const mainFiles = ref([]); // File[]
const fileInputRef = ref(null);

// 임시저장된 파일
const existingFiles = ref([]);
// 삭제할 첨부
const removedAttachCodes = ref([]);

// 추가 계획 목록
const planItems = ref([]); // { id, goal, publicContent, privateContent }[]

const loading = ref(false);
const error = ref("");

// 오늘 날짜 YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// 기본정보 로딩 (이름/생년월일/상담지 제출일 등)
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    // 백엔드: GET /api/plans/:submitCode
    const { data } = await axios.get(`/api/plans/${submitCode}`);

    if (!data?.success || !data.result) {
      throw new Error(data?.message || "기본 정보를 찾을 수 없습니다.");
    }

    const res = data.result;

    submitInfo.value = {
      name: res.name || "",
      ssnFront: (res.ssnFront || "").slice(0, 6),
      counselSubmitAt: res.counselSubmitAt || "",
    };

    // 계획 작성일 기본값이 없으면 오늘 날짜
    if (!mainForm.value.planDate) {
      mainForm.value.planDate = getTodayStr();
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "기본 정보 조회 중 오류";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  mainForm.value.planDate = getTodayStr();
  loadData();
});

// 파일 변경 핸들러
function onMainFilesChange(e) {
  const files = Array.from(e.target.files || []);

  const newOnes = files.filter(
    (f) =>
      !mainFiles.value.some(
        (ex) =>
          ex.name === f.name &&
          ex.size === f.size &&
          ex.lastModified === f.lastModified
      )
  );

  mainFiles.value = [...mainFiles.value, ...newOnes];

  // 같은 파일 다시 선택할 수 있도록 초기화
  if (e.target) {
    e.target.value = "";
  }
}

// 파일 개별 삭제
function removeMainFile(index) {
  mainFiles.value.splice(index, 1);
}

// 임시저장으로 있던 파일 삭제
function removeExistingFile(index, attachCode) {
  if (attachCode && !removedAttachCodes.value.includes(attachCode)) {
    removedAttachCodes.value.push(attachCode);
  }
  existingFiles.value.splice(index, 1);
}

// 임시 저장
async function handleTempSave() {
  try {
    const formJson = {
      submitCode,
      mainForm: mainForm.value,
      planItems: planItems.value,
      removedAttachCodes: removedAttachCodes.value,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("planFiles", file);
    });

    const res = await axios.post("/api/plans/temp", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data?.success) {
      alert("임시 저장이 완료되었습니다.");
    } else {
      alert(res.data.message || "임시 저장 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

// 임시 저장 불러오기
async function handleLoad() {
  try {
    const { data } = await axios.get(`/api/plans/form/${submitCode}`);

    if (!data?.success || !data.result) {
      alert(data?.message || "불러올 지원계획 내용이 없습니다.");
      return;
    }

    const res = data.result;

    // 메인 계획
    mainForm.value = {
      planDate: res.main?.planDate
        ? String(res.main.planDate).slice(0, 10)
        : getTodayStr(),
      expectedStart: res.main?.expectedStart || "",
      expectedEnd: res.main?.expectedEnd || "",
      goal: res.main?.goal || "",
      publicContent: res.main?.publicContent || "",
      privateContent: res.main?.privateContent || "",
    };

    // 추가 계획
    planItems.value =
      (res.items || []).map((d, idx) => ({
        id: d.planItemCode || Date.now() + idx,
        goal: d.goal || "",
        publicContent: d.publicContent || "",
        privateContent: d.privateContent || "",
      })) || [];

    // 기존 첨부파일
    existingFiles.value =
      (res.attachments || []).map((a) => ({
        attachCode: a.attachCode,
        originalFilename: a.originalFilename,
        url: a.url,
      })) || [];

    removedAttachCodes.value = [];

    alert("임시 저장된 지원계획을 불러왔습니다.");
  } catch (e) {
    console.error(e);
    alert(
      "지원계획 불러오기 중 오류: " + (e.response?.data?.message || e.message)
    );
  }
}

// 상담 상세로 연결
function openCounselDetail() {
  window.open(`/counsel/detail/${submitCode}`, "_blank");
}

// 목록으로 돌아가기
function goBack() {
  router.push({ name: "planList" });
}

// 추가 계획 한 블록 추가
function addPlanItem() {
  planItems.value.push({
    id: Date.now(),
    goal: "",
    publicContent: "",
    privateContent: "",
  });
}

// 추가 계획 삭제
function removePlanItem(id) {
  planItems.value = planItems.value.filter((p) => p.id !== id);
}

// 유효성 체크
function validate() {
  if (!mainForm.value.expectedStart) {
    return "예상 진행기간 시작 월을 선택해주세요.";
  }
  if (!mainForm.value.expectedEnd) {
    return "예상 진행기간 종료 월을 선택해주세요.";
  }
  if (mainForm.value.expectedStart > mainForm.value.expectedEnd) {
    return "예상 진행기간의 시작 월이 종료 월보다 늦을 수 없습니다.";
  }
  if (!mainForm.value.goal.trim()) return "계획 목표를 입력해주세요.";
  if (!mainForm.value.publicContent.trim())
    return "계획 내용(일반용)을 입력해주세요.";
  if (!mainForm.value.privateContent.trim())
    return "계획 내용(관자용)을 입력해주세요.";

  for (const p of planItems.value) {
    if (!p.goal.trim()) return "추가 계획의 목표를 입력해주세요.";
    if (!p.publicContent.trim())
      return "추가 계획의 내용(일반용)을 입력해주세요.";
    if (!p.privateContent.trim())
      return "추가 계획의 내용(관자용)을 입력해주세요.";
  }

  return null;
}

// 제출하기
async function submitAll() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  try {
    const formJson = {
      submitCode,
      mainForm: mainForm.value,
      planItems: planItems.value,
      removedAttachCodes: removedAttachCodes.value,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("planFiles", file);
    });

    const res = await axios.post("/api/plans/new", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data?.success) {
      alert("지원계획이 저장되었습니다.");
      router.push({ name: "planList" });
    } else {
      alert(res.data.message || "저장 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}
</script>

<style scoped>
section {
  color: #111827;
}

/* 페이지 폭 통일 */
.page-shell {
  max-width: 960px;
  margin: 0 auto;
}

/* 헤더 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  letter-spacing: -0.02em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 기본정보 카드 */
.meta-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem 1rem;
  font-size: 0.85rem;
}

.meta-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.1rem;
  margin-top: 0.25rem;
}

/* 메인 카드 (지원계획 내용) */
.card-block {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  padding: 1.25rem 1.1rem;
}

/* 그룹 간 간격 (label + input/textarea 묶음) */
.form-group + .form-group {
  margin-top: 0.85rem;
}

/* 공통 인풋 스타일 (date, month, select 등) */
.input {
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.35rem 0.6rem;
  font-size: 0.875rem;
  outline: none;
  min-width: 8rem;
  background-color: #ffffff;
}

.input:focus {
  border-color: #111827;
}

/* 파일 인풋 */
.file-input {
  display: block;
  width: 100%;
  font-size: 0.8rem;
}

/* 파일 리스트 */
.file-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}

.file-link {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.8rem;
  color: #374151; /* 무채색 회색 */
  text-decoration: none; /* 기본 밑줄 제거 */
  text-underline-offset: 2px;
  word-break: break-all;
}

/* 호버 시 티 나게 */
.file-link:hover {
  text-decoration: underline;
  color: #111827; /* 조금 더 진한 회색 */
}

/* 작은 칩 버튼 */
.chip-button {
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  font-size: 0.7rem;
  color: #4b5563;
  cursor: pointer;
  white-space: nowrap;
}

.chip-button:hover {
  background-color: #e5e7eb;
}

/* 하단 액션 바 */
.action-bar {
  margin-top: 10px;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 추가 계획 카드 */
.record-card {
  margin-top: 10px;
  border-radius: 0.8rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.1rem 1rem;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 공통 폰트 */
section,
label,
input,
textarea {
  font-family:
    "Noto Sans KR",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
</style>
