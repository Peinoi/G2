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
            <th class="px-3 py-2 text-left w-24">계획 진행</th>
            <th class="px-3 py-2 text-left w-24">결과 진행</th>
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
            <td class="px-3 py-2">{{ row.register_status_name || "-" }}</td>
            <td class="px-3 py-2">{{ row.result_status || "-" }}</td>
            <td class="px-3 py-2">
              <button class="view-btn" @click="viewPlan(row.event_code)">
                보기
              </button>
            </td>
            <td class="px-3 py-2">
              <button class="view-btn" @click="viewResult(row.event_code)">
                보기
              </button>
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

// 날짜 포맷 함수 (YYYY-MM-DD)
const formatDate = (v) => (v ? String(v).slice(0, 10) : "-");

// 이벤트 목록 불러오기
const loadEvents = async () => {
  try {
    const res = await axios.get("/api/event/list");
    console.log(res.data);
    events.value = res.data.data || [];
  } catch (err) {
    console.error("이벤트 요청/결과 목록 조회 실패:", err);
  }
};

// 진행계획 보기
const viewPlan = (event_code) => {
  router.push({ path: "/event/apply-info", query: { code: event_code } });
};

// 진행결과 보기
const viewResult = (event_code) => {
  router.push({ path: "/event/result-info", query: { code: event_code } });
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
</style>
