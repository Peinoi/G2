<template>
  <section class="p-6">
    <div class="page-shell space-y-6">
      <!-- 상단 타이틀 -->
      <header class="page-header">
        <h2 class="page-title text-2xl md:text-3xl font-bold tracking-tight">
          지원결과 수정
        </h2>
      </header>

      <!-- 로딩 / 에러 -->
      <p v-if="loading" class="text-sm text-gray-500">
        지원결과 정보를 불러오는 중입니다...
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
          <!-- 계획 상세 보기 -->
          <MaterialButton color="dark" size="sm" @click="openPlanDetail">
            계획서 제출일: {{ formattedPlanSubmitAt }}
          </MaterialButton>

          <!-- 결과 작성일 -->
          <div class="flex items-center gap-2 text-sm">
            <span>결과 작성일:</span>
            <span class="px-2 py-1 border rounded bg-white">
              {{ mainForm.resultDate }}
            </span>
          </div>

          <!-- 실제 진행기간: YYYY-MM ~ YYYY-MM -->
          <div class="flex items-center gap-2 text-sm">
            <span>실제 진행기간:</span>
            <input
              type="month"
              v-model="mainForm.actualStart"
              class="input h-8"
            />
            <span>~</span>
            <input
              type="month"
              v-model="mainForm.actualEnd"
              class="input h-8"
            />
          </div>
        </div>
      </div>

      <!-- 메인 결과 카드 -->
      <div class="card-block space-y-4">
        <!-- 결과 목표 -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">결과 목표</label>
          <MaterialInput
            id="result-goal"
            variant="static"
            size="default"
            v-model="mainForm.goal"
            placeholder="지원결과의 목표(또는 달성 정도)를 입력하세요"
          />
        </div>

        <!-- 결과 내용 (일반용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (일반용)
          </label>
          <MaterialTextarea
            id="result-content-public"
            variant="outline"
            :rows="4"
            placeholder="대상자/일반용 결과 내용을 입력하세요..."
            :value="mainForm.publicContent"
            @input="(e) => (mainForm.publicContent = e.target.value)"
          />
        </div>

        <!-- 결과 내용 (관리자용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (관리자용)
          </label>
          <MaterialTextarea
            id="result-content-private"
            variant="outline"
            :rows="4"
            placeholder="관계자/관리자용 내부 결과 내용을 입력하세요..."
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

          <!-- 기존 첨부파일 -->
          <ul
            v-if="existingFiles.length"
            class="mt-2 text-xs text-gray-700 space-y-1"
          >
            <li
              v-for="file in existingFiles"
              :key="file.attachCode"
              class="file-row"
            >
              <div class="file-main">
                <a
                  :href="file.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="file-link"
                >
                  {{ file.originalFilename }}
                </a>

                <!-- 삭제 예정 표시 -->
                <span
                  v-if="removedAttachCodes.includes(file.attachCode)"
                  class="file-tag-removed"
                >
                  삭제 예정
                </span>
              </div>

              <!-- 삭제 버튼 -->
              <button
                v-if="!removedAttachCodes.includes(file.attachCode)"
                type="button"
                class="chip-button"
                @click="markFileForDelete(file.attachCode)"
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

      <!-- 추가 결과 카드들 -->
      <div
        v-for="item in resultItems"
        :key="item.id"
        class="record-card space-y-4"
      >
        <div class="record-header">
          <h4 class="font-medium text-sm">추가 결과</h4>

          <MaterialButton
            color="dark"
            size="sm"
            variant="outlined"
            @click="removeResultItem(item.id)"
          >
            제거
          </MaterialButton>
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">결과 목표</label>
          <MaterialInput
            :id="`result-item-goal-${item.id}`"
            variant="static"
            size="default"
            v-model="item.goal"
            placeholder="추가 결과의 목표/내용 요약을 입력하세요"
          />
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (일반용)
          </label>
          <MaterialTextarea
            :id="`result-item-public-${item.id}`"
            variant="outline"
            :rows="3"
            placeholder="대상자/일반용 결과 내용을 입력하세요..."
            :value="item.publicContent"
            @input="(e) => (item.publicContent = e.target.value)"
          />
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (관자용)
          </label>
          <MaterialTextarea
            :id="`result-item-private-${item.id}`"
            variant="outline"
            :rows="3"
            placeholder="관계자/관리자용 결과 내용을 입력하세요..."
            :value="item.privateContent"
            @input="(e) => (item.privateContent = e.target.value)"
          />
        </div>
      </div>

      <!-- 하단 버튼 라인 -->
      <div class="action-bar">
        <div class="left-actions">
          <MaterialButton color="dark" size="sm" @click="goBack">
            수정 취소
          </MaterialButton>

          <MaterialButton color="dark" size="sm" @click="addResultItem">
            + 결과 추가
          </MaterialButton>
        </div>

        <div class="right-actions">
          <MaterialButton
            color="dark"
            size="sm"
            class="ml-auto shrink-0"
            @click="submitAll"
          >
            {{ isResubmit ? "재작성 완료" : "수정 완료" }}
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

// 라우터에서 받은 값들
const resultCode = Number(route.params.resultCode || 0);
const planCode = ref(Number(route.query.planCode || 0));
const submitCode = Number(route.query.submitCode || 0);

// 기본 정보
const submitInfo = ref({
  name: "",
  ssnFront: "",
  planSubmitAt: "",
});

const formattedPlanSubmitAt = computed(() => {
  const v = submitInfo.value.planSubmitAt;
  return v ? String(v).slice(0, 10) : "-";
});

// 메인 결과 폼
const mainForm = ref({
  resultDate: "", // 결과 작성일
  actualStart: "",
  actualEnd: "",
  goal: "",
  publicContent: "",
  privateContent: "",
});

// 첨부 파일들
const mainFiles = ref([]);
const fileInputRef = ref(null);

// 기존 첨부파일
const existingFiles = ref([]);
// 삭제 예정 첨부코드
const removedAttachCodes = ref([]);

// 추가 결과 목록
const resultItems = ref([]);

const loading = ref(false);
const error = ref("");
const status = ref("");

// 반려인 경우 재작성 모드
const isResubmit = computed(() => status.value === "CD7");

// 오늘 날짜 YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// 데이터 로딩
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    if (!submitCode) {
      throw new Error("submitCode가 없습니다. (쿼리로 전달 필요)");
    }
    if (!resultCode) {
      throw new Error("resultCode가 없습니다. (params로 전달 필요)");
    }

    // 기본 정보 + 결과 상세를 동시에 요청
    const [basicRes, detailRes] = await Promise.all([
      axios.get(`/api/result/${submitCode}`), // 🔹 submitCode 기준
      axios.get(`/api/result/detail/${resultCode}`),
    ]);

    // 1) 지원자 기본 정보
    const basic = basicRes.data;
    if (!basic?.success || !basic.result) {
      throw new Error(basic?.message || "지원자 기본 정보를 찾을 수 없습니다.");
    }
    const basicResData = basic.result;

    submitInfo.value = {
      name: basicResData.name || "",
      ssnFront: (basicResData.ssnFront || "")
        .replace(/[^0-9]/g, "")
        .slice(0, 6),
      planSubmitAt: basicResData.planSubmitAt || "",
    };

    // 2) 결과 상세 정보
    const detail = detailRes.data;
    if (!detail?.success || !detail.result) {
      throw new Error(detail?.message || "지원결과 정보를 찾을 수 없습니다.");
    }
    const d = detail.result;

    // 🔹 planCode를 응답에서 최대한 뽑아내기 (camel + snake 둘 다 대응)
    planCode.value = Number(
      d.main?.planCode ??
        d.main?.plan_code ??
        d.planCode ??
        d.plan_code ??
        planCode.value ??
        0
    );

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

    status.value = d.status || "";

    resultItems.value =
      (d.items || []).map((it, idx) => ({
        id: it.resultItemCode || Date.now() + idx,
        goal: it.goal || "",
        publicContent: it.publicContent || "",
        privateContent: it.privateContent || "",
      })) || [];

    existingFiles.value =
      (d.attachments || []).map((a) => ({
        attachCode: a.attachCode,
        originalFilename: a.originalFilename,
        url: a.url,
      })) || [];
  } catch (e) {
    console.error(e);
    error.value = e.message || "지원결과 정보 조회 중 오류";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!mainForm.value.resultDate) {
    mainForm.value.resultDate = getTodayStr();
  }
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

  if (e.target) {
    e.target.value = "";
  }
}

// 파일 개별 삭제
function removeMainFile(index) {
  mainFiles.value.splice(index, 1);
}

// 기존 첨부 삭제 표시
function markFileForDelete(attachCode) {
  if (!removedAttachCodes.value.includes(attachCode)) {
    removedAttachCodes.value.push(attachCode);
  }
}

// 계획 상세로 이동 (planCode + submitCode 같이 넘기기)
function openPlanDetail() {
  if (!planCode.value) {
    alert(
      "planCode가 없습니다. (결과 상세 응답에서 planCode를 내려주는지 확인 필요)"
    );
    return;
  }
  let url = `/plans/detail/${planCode.value}`;
  if (submitCode) {
    url += `?submitCode=${submitCode}`;
  }
  window.open(url, "_blank");
}

// 목록으로 돌아가기
function goBack() {
  router.push({ name: "resultList" });
}

// 추가 결과 블록 추가
function addResultItem() {
  resultItems.value.push({
    id: Date.now(),
    goal: "",
    publicContent: "",
    privateContent: "",
  });
}

// 추가 결과 삭제
function removeResultItem(id) {
  resultItems.value = resultItems.value.filter((p) => p.id !== id);
}

// 유효성 체크
function validate() {
  if (!mainForm.value.goal.trim()) return "결과 목표를 입력해주세요.";
  if (!mainForm.value.publicContent.trim())
    return "결과 내용(일반용)을 입력해주세요.";
  if (!mainForm.value.privateContent.trim())
    return "결과 내용(관자용)을 입력해주세요.";

  for (const p of resultItems.value) {
    if (!p.goal.trim()) return "추가 결과의 목표를 입력해주세요.";
    if (!p.publicContent.trim())
      return "추가 결과의 내용(일반용)을 입력해주세요.";
    if (!p.privateContent.trim())
      return "추가 결과의 내용(관자용)을 입력해주세요.";
  }

  return null;
}

// 수정 완료
async function submitAll() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  try {
    const formJson = {
      resultCode,
      planCode: planCode.value, // 🔹 ref 말고 숫자만 전송
      submitCode,
      mainForm: mainForm.value,
      resultItems: resultItems.value,
      removedAttachCodes: removedAttachCodes.value,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("resultFiles", file);
    });

    const res = await axios.put(`/api/result/${resultCode}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!res.data?.success) {
      alert(res.data.message || "수정 실패");
      return;
    }

    // CD7(반려)에서 재작성 완료인 경우 → 재승인요청
    if (isResubmit.value) {
      await axios.post(`/api/result/${resultCode}/resubmit`, {
        requesterCode: 2, // TODO: 나중에 로그인 세션값으로 교체
      });
      alert("재작성된 지원결과가 재승인 요청으로 올라갔습니다.");
    } else {
      alert("지원결과가 수정되었습니다.");
    }

    router.push({ name: "resultList" });
  } catch (e) {
    console.error(e);
    alert(
      "수정 처리 중 서버 오류: " + (e.response?.data?.message || e.message)
    );
  }
}
</script>

<style scoped>
section {
  color: #111827;
}

/* 공통 페이지 래퍼 */
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

/* 메인 카드 (지원결과 내용) */
.card-block {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  padding: 1.25rem 1.1rem;
}

/* 그룹 간 간격 */
.form-group + .form-group {
  margin-top: 0.85rem;
}

/* 공통 인풋 스타일 */
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
  justify-content: space-between;
  gap: 0.5rem;
}

.file-main {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.file-link {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.8rem;
  color: #374151;
  text-decoration: none;
  text-underline-offset: 2px;
  word-break: break-all;
}

.file-link:hover {
  text-decoration: underline;
  color: #111827;
}

.file-tag-removed {
  font-size: 0.7rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  border: 1px solid #fecaca;
  background-color: #fef2f2;
  color: #b91c1c;
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

/* 추가 결과 카드 */
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
