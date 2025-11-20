<template>
  <div class="event-info">
    <!-- 대표 이미지 -->
    <div class="event-image">
      <img
        v-if="mainImage"
        :src="mainImage"
        alt="이벤트 이미지"
        class="main-img"
      />
      <div v-else class="no-image">이미지 없음</div>
    </div>

    <!-- 기본 정보 -->
    <div class="card">
      <h3>기본 정보</h3>
      <div class="info-grid">
        <div><strong>이벤트명:</strong> {{ event.event_name }}</div>
        <div><strong>기관명:</strong> {{ event.org_name }}</div>
        <div><strong>모집상태:</strong> {{ event.recruit_status_name }}</div>
        <div><strong>모집인원:</strong> {{ event.max_participants }}</div>
        <div><strong>장소:</strong> {{ event.event_location }}</div>
      </div>
    </div>

    <!-- 기간 정보 -->
    <div class="card">
      <h3>기간</h3>
      <div class="info-grid">
        <div>
          <strong>모집기간:</strong>
          {{ formatDate(event.recruit_start_date) }} ~
          {{ formatDate(event.recruit_end_date) }}
        </div>
        <div>
          <strong>진행기간:</strong>
          {{ formatDate(event.event_start_date) }} ~
          {{ formatDate(event.event_end_date) }}
        </div>
      </div>
    </div>

    <!-- 내용 -->
    <div class="card">
      <h3>내용</h3>
      <p>{{ event.event_content }}</p>
    </div>

    <!-- 예약제: 테이블로 표시 -->
    <div
      v-if="event.event_type_name === '예약제' && event.sub_events.length"
      class="card"
    >
      <h3>예약 일정 목록</h3>

      <table class="reserve-table">
        <thead>
          <tr>
            <th>일정명</th>
            <th>시작일시</th>
            <th>종료일시</th>
            <th>정원</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in event.sub_events" :key="s.sub_event_code">
            <td>{{ s.sub_event_name }}</td>
            <td>{{ formatDateTime(s.sub_event_start_date) }}</td>
            <td>{{ formatDateTime(s.sub_event_end_date) }}</td>
            <td>{{ s.sub_recruit_count }}명</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 매니저 목록 -->
    <div v-if="managerList.length" class="card">
      <h3>매니저 목록</h3>

      <table class="manager-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>구분</th>
            <th>아이디</th>
            <th>전화번호</th>
            <th>이메일</th>
            <th>부서명</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in managerList" :key="m.user_id">
            <td>{{ m.name }}</td>
            <td>{{ m.type_name }}</td>
            <td>{{ m.user_id }}</td>
            <td>{{ m.phone }}</td>
            <td>{{ m.email }}</td>
            <td>{{ m.department }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 첨부파일 -->
    <div v-if="event.attachments.length" class="card">
      <h3>첨부파일</h3>
      <ul class="file-list">
        <li v-for="file in event.attachments" :key="file.server_filename">
          <span class="file-name" @click="previewFile(file)">
            {{ file.original_filename }}
          </span>
        </li>
      </ul>
    </div>

    <!-- 이미지 미리보기 모달 -->
    <div v-if="previewImage" class="preview-modal" @click="closePreview">
      <img :src="previewImage" class="preview-img" />
    </div>

    <!-- 하단 이전 버튼 -->
    <div class="bottom-buttons">
      <button class="back-btn" @click="goBack">이전으로</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import dateFormat from "@/utils/dateFormat";

const route = useRoute();
const router = useRouter();

const event = ref({
  sub_events: [],
  attachments: [],
});

// 날짜 포맷
const formatDate = (d) => (d ? dateFormat(d, "yyyy-MM-dd") : "");

// 예약 일정 날짜 포맷
const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const MM = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
};

// 미리보기 이미지
const previewImage = ref("");

// 파일 미리보기
const previewFile = (file) => {
  const ext = file.original_filename.split(".").pop().toLowerCase();

  // 이미지면 모달로 보기
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    previewImage.value = file.file_path;
    return;
  }

  // PDF면 새 창 미리보기
  if (ext === "pdf") {
    window.open(file.file_path, "_blank");
    return;
  }

  // 그 외 파일은 다운로드
  window.location.href = file.file_path;
};

const closePreview = () => {
  previewImage.value = "";
};

const managerList = computed(() => {
  const list = [];

  // 메인 매니저
  if (event.value.main_manager_name) {
    list.push({
      name: event.value.main_manager_name,
      type_name: event.value.main_manager_type_name || "메인 매니저",
      user_id: event.value.main_manager_id,
      phone: event.value.main_manager_phone,
      email: event.value.main_manager_email,
      department: event.value.main_manager_department,
    });
  }

  // 서브 매니저
  if (event.value.sub_managers?.length) {
    event.value.sub_managers.forEach((m) => {
      list.push({
        name: m.manager_name,
        type_name: m.manager_type_name,
        user_id: m.user_id,
        phone: m.phone,
        email: m.email,
        department: m.department,
      });
    });
  }

  return list;
});

// 대표 이미지 설정
const mainImage = ref("");

const fetchEvent = async () => {
  const code = route.params.eventCode;
  const res = await axios.get(`/api/event/${code}`);
  event.value = res.data.data;

  // 대표 이미지
  const img = event.value.attachments.find((x) =>
    /\.(jpg|jpeg|png|gif)$/i.test(x.original_filename)
  );
  mainImage.value = img ? img.file_path : "";
};

// 이전 버튼
const goBack = () => {
  router.back();
};

onMounted(fetchEvent);
</script>

<style scoped>
.event-info {
  max-width: 900px;
  margin: 20px auto;
  font-family: Arial;
}

.event-image {
  width: 100%;
  height: 250px;
  border-radius: 10px;
  overflow: hidden;
  background: #eee;
  margin-bottom: 20px;
}
.main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card {
  background: #fff;
  padding: 20px;
  margin-bottom: 25px;
  border-radius: 10px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
}

.apply-button-wrap {
  text-align: center;
  margin-top: 30px;
}

.apply-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 14px 26px;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
}
.apply-btn:hover {
  background: #125ea8;
}
.reserve-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.reserve-table th,
.reserve-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
}

.reserve-table th {
  background: #f6f6f6;
  font-weight: bold;
}

.reserve-table tr:nth-child(even) {
  background: #fafafa;
}

.bottom-buttons {
  text-align: center;
  margin: 30px 0;
}

.back-btn {
  background: #555;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.back-btn:hover {
  background: #333;
}

.file-list {
  padding-left: 0;
  list-style: none;
}

.file-name {
  cursor: pointer;
  color: #1a73e8;
}

.file-name:hover {
  text-decoration: underline;
}

/* 이미지 미리보기 모달 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.preview-img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 10px;
}

.manager-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.manager-table th,
.manager-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
}

.manager-table th {
  background: #f6f6f6;
  font-weight: bold;
}

.manager-table tr:nth-child(even) {
  background: #fafafa;
}
</style>
