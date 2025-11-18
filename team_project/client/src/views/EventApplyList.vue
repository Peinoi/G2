<template>
  <section class="p-6 max-w-6xl mx-auto space-y-4">
    <h2 class="text-2xl font-semibold mb-4">이벤트 신청 내역</h2>

    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse border border-gray-200">
        <thead class="bg-gray-100 text-gray-700">
          <tr>
            <th class="px-4 py-2 text-center w-12">No</th>
            <th class="px-4 py-2 text-left w-48">이벤트명</th>
            <th class="px-4 py-2 text-left w-48">세부 이벤트명</th>
            <th class="px-4 py-2 text-left w-48">신청일정</th>
            <th class="px-4 py-2 text-center w-36">신청인원 / 마감인원</th>
            <th class="px-4 py-2 text-center w-24">신청상태</th>
            <th class="px-4 py-2 text-center w-24">취소</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(apply, idx) in applies"
            :key="apply.apply_code || idx"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-2 text-center">{{ idx + 1 }}</td>
            <td class="px-4 py-2">{{ apply.event_name }}</td>
            <td class="px-4 py-2">{{ apply.sub_event_name || "-" }}</td>
            <td class="px-4 py-2">{{ apply.apply_period }}</td>
            <td class="px-4 py-2 text-center">
              {{ apply.current_count }} / {{ apply.max_count }}
            </td>
            <td class="px-4 py-2 text-center">{{ apply.apply_status_name }}</td>
            <td class="px-4 py-2 text-center">
              <button
                class="bg-red-700 hover:bg-red-800 text-white px-4 py-1 rounded-md shadow-sm transition duration-200"
                @click="handleCancel(apply.apply_code)"
              >
                취소
              </button>
            </td>
          </tr>

          <tr v-if="!applies.length">
            <td colspan="7" class="px-4 py-6 text-center text-gray-500">
              신청한 이벤트가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const applies = ref([]);
const user_code = JSON.parse(localStorage.getItem("user") || "{}").user_code;

// 신청 내역 조회
const fetchApplies = async () => {
  try {
    const res = await axios.get(`/api/event/applyList?user_code=${user_code}`);
    if (res.data.status === "success") {
      applies.value = res.data.data || [];
    }
  } catch (err) {
    console.error("이벤트 신청 내역 조회 실패:", err);
  }
};

// 취소 처리
const handleCancel = async (apply_code) => {
  if (!confirm("정말로 신청을 취소하시겠습니까?")) return;

  try {
    // 1) 신청 내역 삭제 + 신청인원 감소 서버에서 처리
    const res = await axios.delete(`/api/event/apply/${apply_code}`);
    if (res.data.status === "success") {
      // 2) UI 즉시 반영 (목록 재조회)
      await fetchApplies();
      alert("신청이 취소되고 신청인원이 업데이트 되었습니다.");
    }
  } catch (err) {
    console.error("신청 취소 실패:", err);
    alert("신청 취소 중 오류가 발생했습니다.");
  }
};

onMounted(fetchApplies);
</script>

<style scoped>
table {
  border-radius: 8px;
  overflow: hidden;
}
th,
td {
  border: 1px solid #e5e7eb;
}
button {
  cursor: pointer;
  font-weight: 500;
}
button:focus {
  outline: none;
}
</style>
