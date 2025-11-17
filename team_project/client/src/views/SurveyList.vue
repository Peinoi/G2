<template>
  <section class="p-6 max-w-6xl mx-auto">
    <!-- 헤더 -->
    <header class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-semibold">조사지 지원 목록</h2>

      <!-- 🔹 로그인 정보 / 역할 표시 (읽기 전용) -->
      <div class="flex flex-col items-end text-sm text-gray-600">
        <span class="px-2 py-1 rounded-full bg-gray-100">
          역할: {{ roleLabel }} ({{ role }})
        </span>
        <span v-if="userId" class="text-xs text-gray-500 mt-1">
          USER_CODE: {{ userId }}
        </span>
      </div>
    </header>

    <!-- 액션 버튼 영역 -->
    <div class="mb-3 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <!-- 목록 새로고침 -->
        <MaterialButton color="dark" size="sm" @click="fetchList">
          새로고침
        </MaterialButton>

        <!-- 🔹 일반 사용자(ROLE=1)만 노출: 조사지 작성하기 -->
        <MaterialButton
          v-if="role === 1"
          color="dark"
          size="sm"
          @click="$router.push('/survey/write')"
        >
          조사지 작성하기
        </MaterialButton>
      </div>
    </div>

    <!-- 상태 표시 -->
    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>

    <!-- 담당자(2)인데 목록이 비었을 때 -->
    <div
      v-else-if="role === 2 && list.length === 0"
      class="text-gray-600 border rounded-lg p-6 bg-gray-50"
    >
      아직 배정받지 않았습니다.
    </div>

    <!-- 테이블 카드 -->
    <div
      v-else
      class="mt-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
    >
      <table class="min-w-full text-sm">
        <thead
          class="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide"
        >
          <!-- 1: 일반 -->
          <tr v-if="role === 1">
            <th class="px-4 py-2 text-left">지원자 이름</th>
            <th class="px-4 py-2 text-left">담당자 이름</th>
            <th class="px-4 py-2 text-center">제출일</th>
            <th class="px-4 py-2 text-center">상태</th>
          </tr>

          <!-- 2: 담당자 -->
          <tr v-else-if="role === 2">
            <th class="px-4 py-2 text-left">지원자 이름</th>
            <th class="px-4 py-2 text-left">담당자(본인)</th>
            <th class="px-4 py-2 text-center">제출일</th>
            <th class="px-4 py-2 text-center">상태</th>
          </tr>

          <!-- 3: 관리자 -->
          <tr v-else-if="role === 3">
            <th class="px-4 py-2 text-left">지원자 이름</th>
            <th class="px-4 py-2 text-left">담당자 이름</th>
            <th class="px-4 py-2 text-center">제출일</th>
            <th class="px-4 py-2 text-center">상태</th>
          </tr>

          <!-- 4: 시스템 -->
          <tr v-else>
            <th class="px-4 py-2 text-left">조사지 세부버전</th>
            <th class="px-4 py-2 text-left">지원자 이름</th>
            <th class="px-4 py-2 text-left">담당자 이름</th>
            <th class="px-4 py-2 text-left">기관명</th>
            <th class="px-4 py-2 text-center">제출일</th>
            <th class="px-4 py-2 text-center">상태</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="row in list"
            :key="row.submit_code"
            class="hover:bg-gray-50 cursor-pointer"
            @click="goToDetail(row.submit_code)"
          >
            <!-- 1: 일반 -->
            <template v-if="role === 1">
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.writer_name || row.written_by }}
              </td>
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.assignee_name || row.assi_by || "-" }}
              </td>
              <td class="px-4 py-2 text-center text-gray-700">
                {{ fmt(row.submit_at) }}
              </td>
              <td class="px-4 py-2 text-center text-gray-700">
                {{ statusLabel(row.status) }}
              </td>
            </template>

            <!-- 2: 담당자 -->
            <template v-else-if="role === 2">
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.writer_name || row.written_by }}
              </td>
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.assignee_name || row.assi_by || "-" }}
              </td>
              <td class="px-4 py-2 text-center text-gray-700">
                {{ fmt(row.submit_at) }}
              </td>
              <td class="px-4 py-2 text-center text-gray-700">
                {{ statusLabel(row.status) }}
              </td>
            </template>

            <!-- 3: 관리자 -->
            <template v-else-if="role === 3">
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.writer_name || row.written_by }}
              </td>
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.assignee_name || row.assi_by || "-" }}
              </td>
              <td class="px-4 py-2 text-center text-gray-700">
                {{ fmt(row.submit_at) }}
              </td>
              <td class="px-4 py-2 text-center text-gray-700">
                {{ statusLabel(row.status) }}
              </td>
            </template>

            <!-- 4: 시스템 -->
            <template v-else>
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.version_detail_no }}
              </td>
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.writer_name || row.written_by }}
              </td>
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.assignee_name || row.assi_by || "-" }}
              </td>
              <td class="px-4 py-2 text-left text-gray-800">
                {{ row.org_name || row.institution_name || "-" }}
              </td>
              <td class="px-4 py-2 text-center text-gray-700">
                {{ fmt(row.submit_at) }}
              </td>
              <td class="px-4 py-2 text-center text-gray-700">
                {{ statusLabel(row.status) }}
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 비었을 때 (담당자 제외) -->
    <div
      v-if="!loading && !error && list.length === 0 && role !== 2"
      class="text-center text-gray-400 py-8"
    >
      조회된 제출본이 없습니다.
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";

const router = useRouter();

/**
 * 🔹 role: 백엔드 쿼리용 숫자 역할
 *  - 1: 일반 사용자 (AA1)
 *  - 2: 담당자 (AA2)
 *  - 3: 관리자 (AA3)
 *  - 4: 시스템 (AA4)
 */
const role = ref(1);

/**
 * 🔹 userId: 로그인한 유저의 user_code
 */
const userId = ref(null);

/**
 * 🔹 (선택) rawAuthCode: localStorage에 저장된 권한 코드(AA1~AA4)
 */
const rawAuthCode = ref("AA1");

const list = ref([]);
const loading = ref(false);
const error = ref("");

/** AA 코드 → 숫자 역할 매핑 */
function mapAuthToRole(code) {
  switch (code) {
    case "AA1":
      return 1;
    case "AA2":
      return 2;
    case "AA3":
      return 3;
    case "AA4":
      return 4;
    default:
      return 1;
  }
}

/** 숫자 역할 → 라벨 텍스트 */
const roleLabel = computed(() => {
  switch (role.value) {
    case 1:
      return "일반 이용자";
    case 2:
      return "담당자";
    case 3:
      return "관리자";
    case 4:
      return "시스템";
    default:
      return "알 수 없음";
  }
});

/** 목록 조회 */
async function fetchList() {
  loading.value = true;
  error.value = "";

  try {
    // 일반 사용자(1)는 반드시 userId 필요
    if (role.value === 1 && !userId.value) {
      throw new Error("로그인 정보를 찾을 수 없습니다. (user_code 없음)");
    }

    const { data } = await axios.get("/api/survey/submissions", {
      params: { role: role.value, userId: userId.value },
    });

    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.result)
      ? data.result
      : [];

    list.value = rows;
  } catch (e) {
    error.value =
      e?.response?.data?.message || e.message || "목록을 불러오지 못했습니다.";
    list.value = [];
  } finally {
    loading.value = false;
  }
}

/** 날짜 포맷 */
function fmt(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toISOString().slice(0, 10);
}

/** 상태 라벨 */
function statusLabel(code) {
  switch (code) {
    case "CA1":
      return "미검토";
    case "CA3":
      return "검토완료";
    default:
      return code || "-";
  }
}

/** 상세 페이지 이동 */
function goToDetail(submitCode) {
  router.push({
    path: `/survey/submission/${submitCode}`,
    query: { role: role.value, userId: userId.value },
  });
}

/** 🔹 마운트 시 localStorage에서 로그인 정보 읽기 */
onMounted(() => {
  try {
    const stored = localStorage.getItem("user");

    if (stored) {
      const u = JSON.parse(stored);

      const userCode = u.user_code ?? u.userCode ?? u.id;
      const auth = u.auth_code ?? u.authCode ?? u.role_code ?? u.role ?? "AA1";

      userId.value = userCode ? Number(userCode) : null;
      rawAuthCode.value = auth;
      role.value = mapAuthToRole(String(auth).toUpperCase());
    } else {
      userId.value = null;
      rawAuthCode.value = "AA1";
      role.value = 1;
    }
  } catch (e) {
    console.error("localStorage 파싱 오류:", e);
    userId.value = null;
    rawAuthCode.value = "AA1";
    role.value = 1;
  }

  fetchList();
});
</script>

<style scoped>
/* 섹션 전체 텍스트 컬러만 살짝 고정 */
section {
  color: #111827;
}
</style>
