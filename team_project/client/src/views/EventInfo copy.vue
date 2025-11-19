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
        <div><strong>매니저:</strong> {{ event.main_manager_name }}</div>
        <div><strong>모집상태:</strong> {{ event.recruit_status_name }}</div>
        <div><strong>최대 참여자:</strong> {{ event.max_participants }}</div>
        <div><strong>장소:</strong> {{ event.event_location }}</div>
      </div>
    </div>

    <!-- 기간 정보 -->
    <div class="card">
      <h3>기간</h3>
      <div class="info-grid">
        <div>
          <strong>모집:</strong>
          {{ formatDate(event.recruit_start_date) }} ~
          {{ formatDate(event.recruit_end_date) }}
        </div>
        <div>
          <strong>진행:</strong>
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

    <!-- 예약제일 경우: 달력 표시 -->
    <div
      v-if="event.event_type === 'DD2' && event.sub_events.length"
      class="card"
    >
      <h3>예약 가능한 일정</h3>
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

    <!-- 첨부파일 -->
    <div v-if="event.attachments.length" class="card">
      <h3>첨부파일</h3>
      <ul>
        <li v-for="file in event.attachments" :key="file.server_filename">
          <a
            :href="file.file_path"
            :download="file.original_filename"
            target="_blank"
          >
            {{ file.original_filename }}
          </a>
        </li>
      </ul>
    </div>

    <!-- 여기에 role/권한별 버튼 div 넣기 -->
    <div class="form-action flex items-center justify-between">
      <!-- ← 목록으로 버튼 -->
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>

      <!-- 오른쪽 버튼 영역 -->
      <div class="flex items-center gap-2">
        <!-- role=1 일반사용자 -->
        <MaterialButton
          v-if="role === 1 && event.event_type === 'DD1' && !isApplied"
          color="primary"
          size="sm"
          @click="applySimple"
        >
          신청하기
        </MaterialButton>

        <button
          v-else-if="role === 1 && event.event_type === 'DD1' && isApplied"
          class="apply-btn"
          disabled
          style="background: gray; cursor: not-allowed"
        >
          신청 완료
        </button>

        <!-- role=2 작성자 -->
        <MaterialButton
          v-if="role === 2 && event.register_status === 'BA2'"
          color="warning"
          size="sm"
          @click="goEdit"
        >
          수정하기
        </MaterialButton>
        <MaterialButton
          v-if="role === 2 && event.register_status === 'BA1'"
          color="dark"
          size="sm"
          variant="outlined"
          @click="goBack"
        >
          이전으로
        </MaterialButton>
        <MaterialButton
          v-if="role === 2 && event.register_status === 'BA3'"
          color="warning"
          size="sm"
          @click="goEdit"
        >
          재수정하기
        </MaterialButton>

        <!-- role=3 관리자 -->
        <template v-if="role === 3 && event.register_status === 'BA1'">
          <MaterialButton color="success" size="sm" @click="approve">
            승인
          </MaterialButton>
          <MaterialButton color="danger" size="sm" @click="openRejectModal">
            반려
          </MaterialButton>
        </template>

        <template v-if="role === 3 && event.register_status === 'BA3'">
          <div class="text-red-600 text-sm mr-3">
            반려 사유: {{ event.reject_reason }}
          </div>
          <MaterialButton color="success" size="sm" @click="approve">
            승인
          </MaterialButton>
          <MaterialButton color="danger" size="sm" @click="openRejectModal">
            반려
          </MaterialButton>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import dateFormat from "@/utils/dateFormat";

import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

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

const calendarRef = ref(null);

const route = useRoute();
const event = ref({
  sub_events: [],
  attachments: [],
});
const role = ref(Number(route.query.role) || 1); // 기본값 1: 일반 사용자

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  events: [],
  eventClick: (info) => onEventClick(info),
});

const formatDate = (d) => (d ? dateFormat(d, "yyyy-MM-dd") : "");

// 대표 이미지
const mainImage = ref("");

const isApplied = ref(false);

const fetchEvent = async () => {
  try {
    const eventCode = route.params.eventCode;
    const userCode = getLoginUserCode(); // localStorage에서 로그인 유저 가져오기

    const res = await axios.get(`/api/event/${eventCode}`, {
      params: { user_code: userCode },
    });
    event.value = res.data.data;

    // 이미 신청했으면 버튼 비활성화
    isApplied.value = !!event.value.alreadyApplied;

    // 대표 이미지 설정
    const img = event.value.attachments.find((x) =>
      /\.(jpg|jpeg|png|gif)$/i.test(x.original_filename)
    );
    mainImage.value = img ? img.file_path : "";

    // 캘린더 이벤트 구성
    calendarOptions.value.events = event.value.sub_events.map((s) => ({
      id: String(s.sub_event_code),
      title: s.sub_event_name,
      start: s.sub_event_start_date,
      end: s.sub_event_end_date,
      extendedProps: {
        code: s.sub_event_code,
        max: s.sub_recruit_count,
        isApplied: !!s.applied,
      },
      color: s.applied ? "gray" : undefined, // 이미 신청한 일정은 회색표시
    }));

    await nextTick();
  } catch (err) {
    console.error("fetchEvent error:", err);
  }
};

// 신청 공통 함수 (신청제 / 예약제)
const applyEvent = async ({ sub_event_code = null }) => {
  const userCode = getLoginUserCode();
  if (!userCode) {
    alert("로그인 상태가 아닙니다.");
    return false;
  }

  const res = await axios.post("/api/event/apply", {
    apply_type: event.value.event_type,
    event_code: event.value.event_code,
    sub_event_code,
    user_code: userCode,
  });

  if (res.data && res.data.status) {
    alert("신청 완료! 내 신청 내역에 등록되었습니다.");
    return true;
  } else {
    alert("신청 실패: " + res.data.message);
    return false;
  }
};

// 신청제: 단순 신청하기
const applySimple = async () => {
  if (isApplied.value) {
    alert("이미 신청한 일정입니다.");
    return; // 이미 신청했으면 그냥 종료
  }

  const ok = await applyEvent({});
  if (!ok) return;

  // 신청 성공 시 바로 버튼 상태 변경
  isApplied.value = true;
};

// 예약제: 캘린더 일정 클릭
const onEventClick = async (info) => {
  if (info.event.extendedProps.isApplied) {
    alert("이미 신청한 일정입니다.");
    return;
  }

  const formatDateTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const MM = d.getMonth() + 1;
    const dd = d.getDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}년 ${MM}월 ${dd}일 ${hh}:${mm}`;
  };

  const startStr = formatDateTime(info.event.start);
  const endStr = formatDateTime(info.event.end);

  const ok = confirm(
    `[일정: ${startStr} - ${endStr}, 제목: ${info.event.title}] 예약하시겠습니까?`
  );
  if (!ok) return;

  const success = await applyEvent({
    sub_event_code: info.event.extendedProps.code,
  });

  if (!success) return;

  // ★ 1) FullCalendar UI 즉시 반영
  info.event.setProp("color", "gray");
  info.event.setExtendedProp("isApplied", true);

  // ★ 2) Vue 데이터에도 반영해줘야 화면 새로고침 없이 동일하게 유지됨
  const idx = event.value.sub_events.findIndex(
    (s) => s.sub_event_code === info.event.extendedProps.code
  );

  if (idx !== -1) {
    event.value.sub_events[idx].applied = true;
  }

  // ★ 3) 캘린더 다시 렌더링 (진짜 중요)
  calendarRef.value.getApi().render();
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
</style>
