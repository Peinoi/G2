<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- 상단 타이틀 -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">상담서 작성</h2>

      <div class="space-x-2 flex items-center">
        <MaterialButton color="dark" size="sm" @click="handleLoad">
          불러오기
        </MaterialButton>
        <MaterialButton color="dark" size="sm" @click="handleTempSave">
          임시 저장
        </MaterialButton>
      </div>
    </header>

    <!-- 기본정보 -->
    <div class="border rounded p-4 bg-gray-50 space-y-3">
      <div class="grid grid-cols-2 text-sm gap-2">
        <div>
          이름: <strong>{{ submitInfo.name }}</strong>
        </div>
        <div>생년월일: {{ submitInfo.ssnFront }}</div>
      </div>

      <div class="flex items-center gap-6 text-sm">
        <MaterialButton color="dark" size="sm" @click="openSubmissionDetail">
          조사지 제출일: {{ formattedSubmitAt }}
        </MaterialButton>

        <label class="flex items-center gap-2">
          상담일:
          <input type="date" v-model="mainForm.counselDate" class="input" />
        </label>
      </div>
    </div>

    <!-- 상담 제목 / 내용 -->
    <div class="space-y-4">
      <!-- 상담 제목: MaterialInput -->
      <div>
        <label class="block text-sm mb-1 font-medium">상담 제목</label>
        <MaterialInput
          id="main-title"
          variant="outline"
          size="default"
          v-model="mainForm.title"
          placeholder="상담 제목을 입력하세요"
        />
      </div>

      <!-- 상담 내용: MaterialTextarea -->
      <div>
        <label class="block text-sm mb-1 font-medium">상담 내용</label>
        <MaterialTextarea
          id="main-content"
          variant="outline"
          :rows="5"
          placeholder="상담 내용을 입력하세요..."
          :value="mainForm.content"
          @input="(e) => (mainForm.content = e.target.value)"
        />
      </div>
    </div>

    <!-- 버튼 3종 (상담기록추가 / 우선순위 / 작성완료) -->
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <MaterialButton color="dark" size="sm" @click="goBack">
          작성 취소
        </MaterialButton>

        <MaterialButton color="dark" size="sm" @click="addRecord">
          + 상담 기록 추가
        </MaterialButton>

        <!-- 우선순위 선택 -->
        <select v-model="priority" class="input w-28">
          <option value="긴급">긴급</option>
          <option value="중점">중점</option>
          <option value="계획">계획</option>
        </select>

        <!-- 작성 완료 -->
        <MaterialButton color="dark" size="sm" @click="submitAll">
          작성 완료
        </MaterialButton>
      </div>
    </div>

    <!-- 생성된 상담 기록 입력칸들 -->
    <div
      v-for="record in records"
      :key="record.id"
      class="border rounded p-4 bg-white space-y-4"
    >
      <div class="flex justify-between items-start">
        <h4 class="font-medium text-sm">추가 상담 기록</h4>

        <MaterialButton color="dark" size="sm" @click="removeRecord(record.id)">
          -
        </MaterialButton>
      </div>

      <div>
        <label class="block text-sm mb-1 font-medium">상담일</label>
        <input type="date" v-model="record.counselDate" class="input" />
      </div>

      <div>
        <!-- ✅ 여기 v-model 수정: record.title 로 -->
        <label class="block text-sm mb-1 font-medium">상담 제목</label>
        <MaterialInput
          :id="`record-title-${record.id}`"
          variant="outline"
          size="default"
          v-model="record.title"
          placeholder="상담 제목을 입력하세요"
        />
      </div>

      <div>
        <label class="block text-sm mb-1 font-medium">상담 내용</label>
        <MaterialTextarea
          :id="`record-content-${record.id}`"
          variant="outline"
          :rows="3"
          placeholder="상담 내용을 입력하세요..."
          :value="record.content"
          @input="(e) => (record.content = e.target.value)"
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
const submitCode = Number(route.params.submitCode);

// 기본 정보
const submitInfo = ref({
  name: "",
  ssnFront: "",
  submitAt: "",
});

const formattedSubmitAt = computed(() => {
  const v = submitInfo.value.submitAt;
  return v ? v.slice(0, 10) : "-";
});

// 메인 폼
const mainForm = ref({
  counselDate: "",
  title: "",
  content: "",
});

// 추가 기록들
const records = ref([]);
const priority = ref("계획");

const loading = ref(false);
const error = ref("");

// 🔹 상담/제출 기본정보 불러오기 (상담 상세 화면에서 쓰는 API 재사용)
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await axios.get(`/api/counsel/${submitCode}`);

    if (!data?.success || !data.result) {
      throw new Error(data?.message || "상담 기본 정보를 찾을 수 없습니다.");
    }

    const res = data.result;

    // submit_info: { name, ssnFront, submitAt }
    if (res.submit_info) {
      submitInfo.value = res.submit_info;
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "상담 기본 정보 조회 중 오류";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

function handleLoad() {
  console.log("불러오기");
}
function handleTempSave() {
  console.log("임시 저장");
}
function openSubmissionDetail() {
  window.open(`/survey/submission/${submitCode}`, "_blank");
}
function goBack() {
  router.push({ name: "counselList" });
}

function addRecord() {
  records.value.push({
    id: Date.now(),
    counselDate: "",
    title: "",
    content: "",
  });
}

function removeRecord(id) {
  records.value = records.value.filter((r) => r.id !== id);
}

// 유효성
function validate() {
  if (!mainForm.value.counselDate) return "상담일을 입력해주세요.";
  if (!mainForm.value.title.trim()) return "상담 제목을 입력해주세요.";
  if (!mainForm.value.content.trim()) return "상담 내용을 입력해주세요.";

  for (const r of records.value) {
    if (!r.counselDate) return "추가 상담 기록의 상담일을 입력해주세요.";
    if (!r.title.trim()) return "추가 상담 기록의 제목을 입력해주세요.";
    if (!r.content.trim()) return "추가 상담 기록의 내용을 입력해주세요.";
  }
  return null;
}

async function submitAll() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  try {
    const payload = {
      submitCode,
      priority: priority.value,
      mainForm: mainForm.value,
      records: records.value,
    };

    const res = await axios.post("/api/counsel/new", payload);

    if (res.data?.success) {
      alert("상담 저장 완료!");
      router.push({ name: "counselList" });
    } else {
      alert(res.data.message || "저장 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}
</script>