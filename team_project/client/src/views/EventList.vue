<template>
  <div class="event-list">
    <h2>이벤트 목록</h2>
    <button @click="goToEventAdd()" style="cursor: pointer">이벤트 등록</button>

    <!-- 검색 조건 -->
    <div class="search-form">
      <!-- <select v-model="filters.recruit_status">
        <option value="">모집상태 선택</option>
        <option value="DC1">모집예정</option>
        <option value="DC2">모집중</option>
        <option value="DC3">모집마감</option>
        <option value="DC4">진행중</option>
        <option value="DC5">종료</option>
      </select> -->

      <input
        type="date"
        v-model="filters.recruit_start_date"
        placeholder="모집 시작일"
      />
      <input
        type="date"
        v-model="filters.recruit_end_date"
        placeholder="모집 종료일"
      />

      <input
        type="date"
        v-model="filters.event_start_date"
        placeholder="시행 시작일"
      />
      <input
        type="date"
        v-model="filters.event_end_date"
        placeholder="시행 종료일"
      />

      <input type="text" v-model="filters.event_name" placeholder="이벤트명" />

      <button @click="fetchEvents">검색</button>
      <button @click="resetFilters">초기화</button>
    </div>

    <div class="cards">
      <div
        class="card"
        v-for="event in events"
        :key="event.event_code"
        @click="goToEventInfo(event.event_code)"
        style="cursor: pointer"
      >
        <div class="card-image">
          <img
            v-if="event.file_path"
            :src="event.file_path"
            alt="이벤트 이미지"
          />
          <div v-else class="no-image">이미지 없음</div>
        </div>
        <div class="card-content">
          <h3>{{ event.event_name }}</h3>
          <p>
            시행기간: {{ formatDate(event.event_start_date) }} ~
            {{ formatDate(event.event_end_date) }}
          </p>
          <p>
            모집기간: {{ formatDate(event.recruit_start_date) }} ~
            {{ formatDate(event.recruit_end_date) }}
          </p>
          <p>
            신청인원/모집인원: {{ event.total_sub_recruit_count }} /
            {{ event.max_participants }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import { useRouter } from "vue-router";

const router = useRouter();

const goToEventAdd = () => {
  router.push({ name: "EventAdd" });
};

const goToEventInfo = (event_code) => {
  if (!event_code) {
    console.warn("eventCode가 없습니다!");
    return;
  }
  router.push({
    name: "EventInfo",
    params: { eventCode: event_code },
  });
};

const events = ref([]);

// 검색 조건
const filters = ref({
  recruit_status: "",
  recruit_start_date: "",
  recruit_end_date: "",
  event_start_date: "",
  event_end_date: "",
  event_name: "",
});

const fetchEvents = async () => {
  try {
    // 쿼리스트링으로 전달
    const query = new URLSearchParams(filters.value).toString();
    const res = await axios.get(`/api/event/list?${query}`); // 백엔드에서 위 쿼리 결과 반환
    events.value = res.data.data;
  } catch (err) {
    console.error("이벤트 메인 조회 실패", err);
  }
};

const resetFilters = () => {
  filters.value = {
    recruit_status: "",
    recruit_start_date: "",
    recruit_end_date: "",
    event_start_date: "",
    event_end_date: "",
    event_name: "",
    register_status: "",
  };
  fetchEvents();
};

// 날짜 포맷
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return dateFormat(dateStr, "yyyy-MM-dd");
};

onMounted(() => {
  fetchEvents();
});
</script>

<style scoped>
.event-list {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 16px;
  font-family: "Noto Sans KR", sans-serif;
}

h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
}

/* 검색 폼 */
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
}

.search-form input,
.search-form select {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  transition: all 0.2s ease;
}

.search-form input:focus,
.search-form select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

/* 버튼 스타일 통일 */
button {
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* 등록 버튼 */
button.register-btn {
  background-color: #2563eb;
  color: #fff;
}
button.register-btn:hover {
  background-color: #1e40af;
}

/* 검색 버튼 */
button.search-btn {
  background-color: #10b981;
  color: #fff;
}
button.search-btn:hover {
  background-color: #047857;
}

/* 초기화 버튼 */
button.reset-btn {
  background-color: #f3f4f6;
  color: #4b5563;
}
button.reset-btn:hover {
  background-color: #e5e7eb;
}

/* 카드 레이아웃 */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.card {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-image {
  width: 100%;
  height: 180px;
  background-color: #f9fafb;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: #9ca3af;
  font-size: 14px;
}

.card-content {
  padding: 16px;
}

.card-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #111827;
  line-height: 1.3;
}

.card-content p {
  margin: 6px 0;
  font-size: 14px;
  color: #4b5563;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .search-form {
    flex-direction: column;
    gap: 10px;
  }
  .card-content h3 {
    font-size: 16px;
  }
}
</style>
