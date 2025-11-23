<template>
  <div class="event-list">
    <div class="top-bar">
      <h2>이벤트 목록</h2>
      <!-- 담당자 전용 영역: 이벤트 등록 버튼 -->
      <div v-if="isManager" class="addEvent">
        <MaterialButton
          color="dark"
          size="sm"
          class="px-4"
          @click="goToEventAdd()"
          >이벤트 등록</MaterialButton
        >
      </div>
    </div>

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

      <!-- 모집기간 -->
      <div class="form-field">
        <label>모집기간</label>
        <div class="field-inputs">
          <input
            type="date"
            v-model="filters.recruit_start_date"
            placeholder="시작일"
          />
          <span>~</span>
          <input
            type="date"
            v-model="filters.recruit_end_date"
            placeholder="종료일"
          />
        </div>
      </div>

      <!-- 시행기간 -->
      <div class="form-field">
        <label>시행기간</label>
        <div class="field-inputs">
          <input
            type="date"
            v-model="filters.event_start_date"
            placeholder="시작일"
          />
          <span>~</span>
          <input
            type="date"
            v-model="filters.event_end_date"
            placeholder="종료일"
          />
        </div>
      </div>

      <div class="form-field">
        <label>이벤트명</label>
        <input
          type="text"
          v-model="filters.event_name"
          placeholder="이벤트명"
        />
      </div>

      <div class="form-actions">
        <MaterialButton
          color="dark"
          size="sm"
          @click="resetFilters"
          style="height: 42px; line-height: 42px; padding: 0 20px"
          >초기화</MaterialButton
        >
      </div>
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
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import { useRouter } from "vue-router";
import MaterialButton from "@/components/MaterialButton.vue";

const router = useRouter();

// 로그인 권한
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
const loginRole = ref(getLoginRole());
const isManager = computed(() => {
  // 로그인 권한이 AA2일때만 버튼 보여주기
  return loginRole.value === "AA2";
});

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

// filters 변경 시 자동으로 fetchEvents 호출
watch(
  filters,
  () => {
    fetchEvents();
  },
  { deep: true } // filters 안의 속성까지 모두 감시
);

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
  max-width: 1500px;
  margin: 30px auto;
  padding: 16px;
  font-family: "Noto Sans KR", sans-serif;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  text-align: left;
}

/* 검색 폼 */
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 24px;
  background-color: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-field {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  flex: 1 1 200px;
}

.form-field label {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px;
}

.field-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-inputs input[type="date"],
.form-field input[type="text"] {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  flex: 1;
}

.field-inputs span {
  white-space: nowrap;
}

/* 데스크탑 - 초기화 버튼 높이 input과 동일하게 */
.form-actions .material-button {
  height: 42px; /* input 높이와 동일 */
  min-height: 42px;
  padding: 0 20px; /* 가로 비율 맞춤 */
  line-height: 42px;
  font-size: 14px;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  align-items: flex-end; /* 이 줄이 버튼을 input과 세로선상에 맞춥니다. */
  gap: 8px;
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
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-image {
  width: 100%;
  height: 160px;
  background-color: #f3f4f6;
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
  margin-bottom: 8px;
  color: #111827;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content p {
  margin: 4px 0;
  font-size: 14px;
  color: #4b5563;
}

/* 담당자 전용 버튼 */
.addEvent {
  justify-content: center;
  margin-bottom: 20px;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .search-form {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .form-actions {
    display: flex;
    align-items: center; /* 버튼과 input 세로 중앙 정렬 */
    gap: 8px;
  }

  /* 초기화 버튼 높이 input과 동일하게 맞추기 */
  .form-actions .material-button {
    height: 42px !important; /* input과 동일 높이 */
    min-height: 42px !important;
    padding: 0 16px !important; /* 좌우 여백 */
    line-height: 42px !important; /* 텍스트 세로 중앙 정렬 */
    font-size: 14px !important;
    border-radius: 6px !important;
  }

  .card-content h3 {
    font-size: 16px;
  }
}
</style>
