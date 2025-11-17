<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- 상단 타이틀 -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">지원결과 수정</h2>
    </header>

    <!-- 로딩 / 에러 -->
    <p v-if="loading" class="text-sm text-gray-500">
      지원결과 정보를 불러오는 중입니다...
    </p>
    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

    <!-- 기본정보 -->
    <div class="border rounded p-4 bg-gray-50 space-y-3">
      <div class="grid grid-cols-2 text-sm gap-2">
        <div>
          이름: <strong>{{ submitInfo.name || "-" }}</strong>
        </div>
        <div>생년월일: {{ submitInfo.ssnFront || "-" }}</div>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-sm">
        <!-- (계획 기준) 상담지 → 계획 상세로 연결하고 싶으면 나중에 openPlanDetail로 바꿔도 됨 -->
        <MaterialButton color="dark" size="sm" @click="openPlanDetail">
          계획서 제출일: {{ formattedPlanSubmitAt }}
        </MaterialButton>

        <!-- 결과 작성일 -->
        <div class="flex items-center gap-2">
          <span>결과 작성일:</span>
          <span class="px-2 py-1 border rounded bg-white">
            {{ mainForm.resultDate }}
          </span>
        </div>

        <!-- 실제 진행기간: YYYY-MM ~ YYYY-MM -->
        <div class="flex items-center gap-2">
          <span>실제 진행기간:</span>
          <input
            type="month"
            v-model="mainForm.actualStart"
            class="input h-8"
          />
          <span>~</span>
          <input type="month" v-model="mainForm.actualEnd" class="input h-8" />
        </div>
      </div>
    </div>

    <!-- 메인 결과 입력 -->
    <div class="space-y-4">
      <!-- 결과 목표 -->
      <div>
        <label class="block text-sm mb-1 font-medium">결과 목표</label>
        <MaterialInput
          id="result-goal"
          variant="outline"
          size="default"
          v-model="mainForm.goal"
          placeholder="지원결과의 목표(또는 달성 정도)를 입력하세요"
        />
      </div>

      <!-- 결과 내용 (일반용) -->
      <div>
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

      <!-- 결과 내용 (관자용 / 관리자용) -->
      <div>
        <label class="block text-sm mb-1 font-medium">
          결과 내용 (관자용)
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
      <div>
        <label class="block text-sm mb-1 font-medium">첨부 파일</label>
        <input
          ref="fileInputRef"
          type="file"
          multiple
          @change="onMainFilesChange"
          class="block w-full text-sm"
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
            class="flex items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2 truncate">
              <a
                :href="file.url"
                target="_blank"
                rel="noopener noreferrer"
                class="truncate underline"
              >
                {{ file.originalFilename }}
              </a>

              <!-- 삭제 예정 표시 -->
              <span
                v-if="removedAttachCodes.includes(file.attachCode)"
                class="text-red-500 text-[11px]"
              >
                (삭제 예정)
              </span>
              <!-- 삭제 버튼 -->
              <button
                v-if="!removedAttachCodes.includes(file.attachCode)"
                type="button"
                class="shrink-0 px-2 py-0.5 border rounded text-[11px] text-gray-600 hover:bg-gray-100"
                @click="markFileForDelete(file.attachCode)"
              >
                삭제
              </button>
            </div>
          </li>
        </ul>

        <!-- 이번에 새로 선택한 파일 목록 -->
        <ul
          v-if="mainFiles.length"
          class="mt-2 text-xs text-gray-700 space-y-1"
        >
          <li
            v-for="(file, idx) in mainFiles"
            :key="file.name + '_' + file.lastModified + '_' + idx"
            class="flex items-center justify-between gap-2"
          >
            <span class="truncate">
              {{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)
            </span>
            <button
              type="button"
              class="shrink-0 px-2 py-0.5 border rounded text-[11px] text-gray-600 hover:bg-gray-100"
              @click="removeMainFile(idx)"
            >
              삭제
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- 버튼 영역 -->
    <div class="flex items-center gap-3">
      <MaterialButton color="dark" size="sm" @click="goBack">
        수정 취소
      </MaterialButton>

      <MaterialButton color="dark" size="sm" @click="addResultItem">
        + 결과 추가
      </MaterialButton>

      <MaterialButton color="dark" size="sm" @click="submitAll">
        결과 수정 완료
      </MaterialButton>
    </div>

    <!-- 추가 결과 기록들 -->
    <div
      v-for="item in resultItems"
      :key="item.id"
      class="border rounded p-4 bg-white space-y-4"
    >
      <div class="flex justify-between items-start">
        <h4 class="font-medium text-sm">추가 결과</h4>

        <MaterialButton
          color="dark"
          size="sm"
          @click="removeResultItem(item.id)"
        >
          -
        </MaterialButton>
      </div>

      <div>
        <label class="block text-sm mb-1 font-medium">결과 목표</label>
        <MaterialInput
          :id="`result-item-goal-${item.id}`"
          variant="outline"
          size="default"
          v-model="item.goal"
          placeholder="추가 결과의 목표/내용 요약을 입력하세요"
        />
      </div>

      <div>
        <label class="block text-sm mb-1 font-medium">결과 내용 (일반용)</label>
        <MaterialTextarea
          :id="`result-item-public-${item.id}`"
          variant="outline"
          :rows="3"
          placeholder="대상자/일반용 결과 내용을 입력하세요..."
          :value="item.publicContent"
          @input="(e) => (item.publicContent = e.target.value)"
        />
      </div>

      <div>
        <label class="block text-sm mb-1 font-medium">결과 내용 (관자용)</label>
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
const planCode = Number(route.query.planCode || 0);
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
      axios.get(`/api/result/${resultCode}`), // 🔁 여기 변경
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

// (지금은 상담지 상세, 나중에 계획 상세로 바꾸고 싶으면 openPlanDetail로 교체)
function openPlanDetail() {
  if (!submitCode) return;
  const url = `/plans/detail/${submitCode}`;
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
      planCode,
      submitCode,
      mainForm: mainForm.value,
      resultItems: resultItems.value,
      removedAttachCodes: removedAttachCodes.value,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("resultFiles", file); // 서버에서 field명에 맞춰 수정
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

    alert("지원결과가 수정되었습니다.");
    router.push({ name: "resultList" });
  } catch (e) {
    console.error(e);
    alert(
      "수정 처리 중 서버 오류: " + (e.response?.data?.message || e.message)
    );
  }
}
</script>
