<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- 상단 타이틀 -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">지원계획 작성</h2>

      <div class="space-x-2 flex items-center">
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

    <!-- 기본정보 -->
    <div class="border rounded p-4 bg-gray-50 space-y-3">
      <div class="grid grid-cols-2 text-sm gap-2">
        <div>
          이름: <strong>{{ submitInfo.name || "-" }}</strong>
        </div>
        <div>생년월일: {{ submitInfo.ssnFront || "-" }}</div>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-sm">
        <!-- 상담지 제출일 -->
        <MaterialButton color="dark" size="sm" @click="openCounselDetail">
          상담지 제출일: {{ formattedCounselSubmitAt }}
        </MaterialButton>

        <!-- 계획 작성일 (오늘 날짜 표시) -->
        <div class="flex items-center gap-2">
          <span>계획 작성일:</span>
          <span class="px-2 py-1 border rounded bg-white">
            {{ mainForm.planDate }}
          </span>
        </div>

        <!-- 예상 진행기간: YYYY-MM ~ YYYY-MM -->
        <div class="flex items-center gap-2">
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

    <!-- 메인 계획 입력 -->
    <div class="space-y-4">
      <!-- 계획 목표 -->
      <div>
        <label class="block text-sm mb-1 font-medium">계획 목표</label>
        <MaterialInput
          id="plan-goal"
          variant="outline"
          size="default"
          v-model="mainForm.goal"
          placeholder="지원계획의 목표를 입력하세요"
        />
      </div>

      <!-- 계획 내용 (일반용) -->
      <div>
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

      <!-- 계획 내용 (관자용 / 관리자용) -->
      <div>
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

        <!-- 임시저장 첨부파일 목록 -->
        <ul
          v-if="existingFiles.length"
          class="mt-2 text-xs text-gray-700 space-y-1"
        >
          <li
            v-for="(file, idx) in existingFiles"
            :key="file.attachCode"
            class="flex items-center justify-between gap-2"
          >
            <span class="truncate">{{ file.originalFilename }} </span>
            <button
              type="button"
              class="shrink-0 px-2 py-0.5 border rounded text-[11px] text-gray-600 hover:bg-gray-100"
              @click="removeExistingFile(idx, file.attachCode)"
            >
              삭제
            </button>
          </li>
        </ul>

        <!-- 선택된 파일 목록 -->
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
        작성 취소
      </MaterialButton>

      <MaterialButton color="dark" size="sm" @click="addPlanItem">
        + 계획 추가
      </MaterialButton>

      <MaterialButton
        color="dark"
        size="sm"
        class="ml-auto shrink-0"
        @click="submitAll"
      >
        제출하기
      </MaterialButton>
    </div>

    <!-- 추가 계획 기록들 -->
    <div
      v-for="item in planItems"
      :key="item.id"
      class="border rounded p-4 bg-white space-y-4"
    >
      <div class="flex justify-between items-start">
        <h4 class="font-medium text-sm">추가 계획</h4>

        <MaterialButton color="dark" size="sm" @click="removePlanItem(item.id)">
          -
        </MaterialButton>
      </div>

      <div>
        <label class="block text-sm mb-1 font-medium">계획 목표</label>
        <MaterialInput
          :id="`plan-item-goal-${item.id}`"
          variant="outline"
          size="default"
          v-model="item.goal"
          placeholder="추가 계획의 목표를 입력하세요"
        />
      </div>

      <div>
        <label class="block text-sm mb-1 font-medium">계획 내용 (일반용)</label>
        <MaterialTextarea
          :id="`plan-item-public-${item.id}`"
          variant="outline"
          :rows="3"
          placeholder="대상자/일반용 내용을 입력하세요..."
          :value="item.publicContent"
          @input="(e) => (item.publicContent = e.target.value)"
        />
      </div>

      <div>
        <label class="block text-sm mb-1 font-medium">계획 내용 (관자용)</label>
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
  expectedStart: "", // 예상 진행기간 시작 (YYYY-MM)
  expectedEnd: "", // 예상 진행기간 종료 (YYYY-MM)
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

// // 기본정보 로딩 (이름/생년월일/상담지 제출일 등)
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    // ✅ 백엔드 라우터: GET /plans/:submitCode 기준
    const { data } = await axios.get(`/api/plans/${submitCode}`);

    if (!data?.success || !data.result) {
      throw new Error(data?.message || "기본 정보를 찾을 수 없습니다.");
    }

    const res = data.result;

    // ✅ 백엔드에서 이렇게 내려준다고 가정:
    // { submitCode, name, ssnFront, counselSubmitAt }
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

// 파일 변경 핸들러 (기존 + 새 파일 누적)
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
  // 백엔드에서 지울 수 있도록 코드만 따로 보관
  if (attachCode && !removedAttachCodes.value.includes(attachCode)) {
    removedAttachCodes.value.push(attachCode);
  }

  // 화면에서는 바로 지워버리기
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

    // 🔹 지금 화면에서 선택한 파일들 같이 보냄
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

    // ✅ 기존 첨부파일 (임시저장 때 올라간 것들)
    existingFiles.value =
      (res.attachments || []).map((a) => ({
        attachCode: a.attachCode,
        originalFilename: a.originalFilename,
        url: a.url, // 백엔드에서 file_path + server_filename으로 만들어둔 것
      })) || [];

    // 삭제리스트 초기화
    removedAttachCodes.value = [];

    alert("임시 저장된 지원계획을 불러왔습니다.");
  } catch (e) {
    console.error(e);
    alert(
      "지원계획 불러오기 중 오류: " + (e.response?.data?.message || e.message)
    );
  }
}

//상담 상세로 연결
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
    return "실제 진행기간 시작 월을 선택해주세요.";
  }
  if (!mainForm.value.expectedEnd) {
    return "실제 진행기간 종료 월을 선택해주세요.";
  }
  if (mainForm.value.expectedStart > mainForm.value.expectedEnd) {
    return "실제 진행기간의 시작 월이 종료 월보다 늦을 수 없습니다.";
  }
  if (!mainForm.value.goal.trim()) return "계획 목표를 입력해주세요.";
  if (!mainForm.value.publicContent.trim())
    return "계획 내용(일반용)을 입력해주세요.";
  if (!mainForm.value.privateContent.trim())
    return "계획 내용(관자용)을 입력해주세요.";

  // 예상 기간은 선택 옵션으로 둘 거면 아래는 주석 처리
  // if (!mainForm.value.expectedStart || !mainForm.value.expectedEnd)
  //   return "예상 진행기간을 선택해주세요.";

  for (const p of planItems.value) {
    if (!p.goal.trim()) return "추가 계획의 목표를 입력해주세요.";
    if (!p.publicContent.trim())
      return "추가 계획의 내용(일반용)을 입력해주세요.";
    if (!p.privateContent.trim())
      return "추가 계획의 내용(관자용)을 입력해주세요.";
  }

  return null;
}

// 제출하기: JSON + 파일 FormData로 전송
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
