<!-- src/views/EventApplyResult.vue -->
<template>
  <section class="p-6 max-w-6xl mx-auto space-y-4">
    <h2 class="text-2xl font-semibold mb-4">이벤트 계획 / 결과 목록</h2>

    <div class="border rounded-lg overflow-hidden bg-white">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 text-xs text-gray-600">
          <tr>
            <th class="px-3 py-2 text-left w-12">No</th>
            <th class="px-3 py-2 text-left w-48">이벤트명</th>
            <th class="px-3 py-2 text-left w-36">이벤트 요청일</th>
            <th class="px-3 py-2 text-left w-36">메인 매니저</th>
            <th class="px-3 py-2 text-left w-24">계획 상태</th>
            <th class="px-3 py-2 text-left w-24">결과 상태</th>
            <th class="px-3 py-2 text-left w-32">진행계획</th>
            <th class="px-3 py-2 text-left w-32">진행결과</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, idx) in events"
            :key="row.event_code || idx"
            class="border-t"
          >
            <td class="px-3 py-2">{{ idx + 1 }}</td>
            <td class="px-3 py-2">{{ row.event_name }}</td>
            <td class="px-3 py-2">{{ formatDate(row.event_register_date) }}</td>
            <td class="px-3 py-2">{{ row.main_manager_name || "-" }}</td>
            <td class="px-3 py-2">
              <span
                :class="['status-badge', statusBadgeClass(row.register_status)]"
              >
                {{ row.register_status_name || "-" }}
              </span>
            </td>
            <td class="px-3 py-2">
              <span
                v-if="row.event_result_code"
                :class="['status-badge', statusBadgeClass(row.result_status)]"
              >
                {{ row.result_status_name || "-" }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="px-3 py-2">
              <button class="view-btn" @click="viewPlan(row.event_code)">
                보기
              </button>
            </td>
            <td class="px-3 py-2">
              <button
                v-if="row.event_result_code"
                class="view-btn"
                @click="viewResult(row.event_result_code)"
              >
                보기
              </button>
              <span v-else>-</span>
            </td>
          </tr>

          <tr v-if="!events.length">
            <td colspan="8" class="px-3 py-6 text-center text-gray-500">
              등록된 이벤트가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const events = ref([]);

const getLoginUserCode = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const data = JSON.parse(userStr);
    return data.user_code || null;
  } catch {
    return null;
  }
};

const getLoginRole = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const data = JSON.parse(userStr);
    return data.role || null;
  } catch {
    return null;
  }
};

// 날짜 포맷 함수 (YYYY-MM-DD)
const formatDate = (v) => (v ? String(v).slice(0, 10) : "-");

// 이벤트 목록 불러오기
const loadEvents = async () => {
  try {
    const user_code = getLoginUserCode();
    if (!user_code) {
      alert("로그인 상태가 아닙니다.");
      return;
    }

    const params = { role: getLoginRole(), user_code: getLoginUserCode() };
    const role = getLoginRole();
    if (role !== "AA3") {
      params.user_code = user_code;
    }

    const res = await axios.get("/api/event/applyResult", {
      params, // role=AA3이면 params 비어있어서 전체, 아니면 user_code만
    });

    console.log(res.data);
    events.value = res.data.data || [];
  } catch (err) {
    console.error("이벤트 요청/결과 목록 조회 실패:", err);
  }
};

// 상태 뱃지
const statusBadgeClass = (code) => {
  switch (code) {
    case "BA1":
      return "badge-request"; // 요청
    case "BA2":
      return "badge-approve"; // 승인
    case "BA3":
      return "badge-reject"; // 반려
    default:
      return "badge-default";
  }
};

// 진행계획 보기
const viewPlan = (event_code) => {
  router.push({ name: "EventApplyInfo", params: { eventCode: event_code } });
};

// 진행결과 보기
const viewResult = (event_result_code) => {
  router.push({
    name: "EventResultInfo",
    params: { resultCode: event_result_code },
  });
};

onMounted(loadEvents);
</script>

<style scoped>
.view-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.view-btn:hover {
  background: #125ea8;
}
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

/* 요청 */
.badge-request {
  background-color: #3730a3; /* 보라 */
}

/* 승인 */
.badge-approve {
  background-color: #166534; /* 초록 */
}

/* 반려 */
.badge-reject {
  background-color: #b91c1c; /* 빨강 */
}

/* 기본 */
.badge-default {
  background-color: #6b7280; /* 회색 */
}
</style>
