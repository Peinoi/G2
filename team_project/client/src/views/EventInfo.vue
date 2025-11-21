<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- 상단 액션라인 -->
    <div class="flex justify-between items-center">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>

      <div class="flex items-center gap-2">
        <!-- 일반 사용자 신청 버튼 -->
        <MaterialButton v-if="canApply" @click="applySimple"
          >신청하기</MaterialButton
        >

        <MaterialButton v-else-if="applied" disabled>신청 완료</MaterialButton>

        <!-- 작성자 버튼 -->
        <MaterialButton v-if="canEdit" @click="goEdit">수정하기</MaterialButton>

        <MaterialButton v-if="canReEdit" @click="goEdit"
          >재수정하기</MaterialButton
        >

        <!-- 관리자 승인/반려 -->
        <MaterialButton v-if="isAdmin" @click="handleApprove"
          >승인</MaterialButton
        >

        <MaterialButton v-if="isAdmin" @click="handleReject"
          >반려</MaterialButton
        >
      </div>
    </div>

    <!-- 이벤트 기본정보 카드 -->
    <div class="detail-card space-y-4">
      <header class="flex justify-between items-center">
        <h2 class="text-2xl font-semibold">이벤트 상세</h2>
        <span
          v-if="seeStatus"
          class="status-pill"
          :class="statusClass(event.register_status)"
        >
          {{ event.register_status_name }}
        </span>
      </header>

      <div class="event-main-image">
        <img v-if="mainImage" :src="mainImage" alt="대표 이미지" />
        <div v-else class="no-image">이미지 없음</div>
      </div>

      <div class="meta-card">
        <div class="meta-row">
          <span>이벤트명</span><span>{{ event.event_name }}</span>
        </div>
        <div class="meta-row">
          <span>기관명</span><span>{{ event.org_name }}</span>
        </div>
        <div class="meta-row">
          <span>매니저</span><span>{{ event.main_manager_name }}</span>
        </div>
        <div class="meta-row">
          <span>장소</span><span>{{ event.event_location }}</span>
        </div>
        <div class="meta-row">
          <span>최대 참여자</span><span>{{ event.max_participants }}</span>
        </div>
      </div>

      <div class="block-card">
        <div class="field-block">
          <div class="field-label">모집 기간</div>
          <div class="field-value">
            {{ formatDate(event.recruit_start_date) }} ~
            {{ formatDate(event.recruit_end_date) }}
          </div>
        </div>
        <div class="field-block">
          <div class="field-label">진행 기간</div>
          <div class="field-value">
            {{ formatDate(event.event_start_date) }} ~
            {{ formatDate(event.event_end_date) }}
          </div>
        </div>
      </div>

      <div class="block-card">
        <div class="field-block">
          <div class="field-label">내용</div>
          <div class="field-value whitespace-pre-line">
            {{ event.event_content }}
          </div>
        </div>
      </div>

      <!-- 예약 일정 카드 -->
      <div
        v-if="event.event_type === 'DD2' && event.sub_events.length"
        class="block-card"
      >
        <div class="field-block">
          <div class="field-label">예약 가능한 일정</div>
          <FullCalendar ref="calendarRef" :options="calendarOptions" />
        </div>
      </div>

      <!-- 첨부파일 카드 -->
      <div v-if="event.attachments.length" class="block-card">
        <div class="field-block">
          <div class="field-label">첨부파일</div>
          <ul class="file-list">
            <li v-for="file in event.attachments" :key="file.server_filename">
              <a :href="file.file_path" :download="file.original_filename">{{
                file.original_filename
              }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const route = useRoute();
const router = useRouter();
const calendarRef = ref(null);

const eventCode = Number(route.params.eventCode || 0);
const role = ref(Number(route.query.role || 1)); // 1: 일반, 2: 작성자, 3: 관리자

const event = ref({
  sub_events: [],
  attachments: [],
});

const mainImage = ref("");
const isApplied = ref(false);

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
// 상태 버튼 표시
const canApply = computed(
  () =>
    loginRole.value === "AA1" &&
    event.value.event_type === "DD1" &&
    !isApplied.value
);
const applied = computed(() => role.value === 1 && isApplied.value);
const canEdit = computed(
  () => role.value === 2 && event.value.register_status === "BA2"
);
const canReEdit = computed(
  () => role.value === 2 && event.value.register_status === "BA3"
);

const isAdmin = computed(() => role.value === 3);

const seeStatus = computed(
  () => loginRole.value === "AA2" && loginRole.value === "AA3"
);

// 상태 Pill 클래스
const statusClass = (status) => {
  switch (status) {
    case "BA1":
      return "status-pill--before";
    case "BA2":
      return "status-pill--done";
    case "BA3":
      return "status-pill--rejected";
    default:
      return "";
  }
};

// 날짜 포맷
const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// 로그인 유저 코드
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

// 이벤트 조회
const fetchEvent = async () => {
  try {
    console.log("eventCode >>>", eventCode);

    const userCode = getLoginUserCode();
    const res = await axios.get(`/api/event/${eventCode}`, {
      params: { user_code: userCode },
    });
    event.value = res.data.data || {};
    isApplied.value = !!event.value.alreadyApplied;

    // 대표 이미지
    const img = event.value.attachments.find((x) =>
      /\.(jpg|jpeg|png|gif)$/i.test(x.original_filename)
    );
    mainImage.value = img ? img.file_path : "";

    // 캘린더 이벤트
    calendarOptions.value.events = (event.value.sub_events || []).map((s) => ({
      id: String(s.sub_event_code),
      title: s.sub_event_name,
      start: s.sub_event_start_date,
      end: s.sub_event_end_date,
      extendedProps: { code: s.sub_event_code, isApplied: !!s.applied },
      color: s.applied ? "gray" : undefined,
    }));

    await nextTick();
  } catch (err) {
    console.error("fetchEvent error:", err);
  }
};

// 단순 신청
const applyEvent = async ({ sub_event_code = null }) => {
  const userCode = getLoginUserCode();
  if (!userCode) return alert("로그인 상태가 아닙니다.");

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

// 신청 버튼
const applySimple = async () => {
  if (isApplied.value) return alert("이미 신청한 일정입니다.");
  const ok = await applyEvent({});
  if (ok) isApplied.value = true;
};

// 캘린더 클릭 예약
const onEventClick = async (info) => {
  if (loginRole.value !== "AA1")
    return alert("신청은 일반 사용자(AA1)만 가능합니다.");

  if (info.event.extendedProps.isApplied)
    return alert("이미 신청한 일정입니다.");

  const confirmApply = confirm(`일정 "${info.event.title}" 예약하시겠습니까?`);
  if (!confirmApply) return;

  const success = await applyEvent({
    sub_event_code: info.event.extendedProps.code,
  });
  if (!success) return;

  // UI 업데이트
  info.event.setProp("color", "gray");
  info.event.setExtendedProp("isApplied", true);

  const idx = event.value.sub_events.findIndex(
    (s) => s.sub_event_code === info.event.extendedProps.code
  );
  if (idx !== -1) event.value.sub_events[idx].applied = true;

  calendarRef.value.getApi().render();
};

// 승인/반려 (관리자)
const handleApprove = async () => {
  try {
    const res = await axios.post(`/api/event/${eventCode}/approve`);
    if (res.data.success) {
      alert("승인되었습니다.");
      await fetchEvent();
    } else {
      alert(res.data.message || "승인 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

const handleReject = async () => {
  const reason = prompt("반려 사유를 입력해주세요:");
  if (!reason) return;
  try {
    const res = await axios.post(`/api/event/${eventCode}/reject`, { reason });
    if (res.data.success) {
      alert("반려 처리되었습니다.");
      await fetchEvent();
    } else {
      alert(res.data.message || "반려 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 화면 이동
const goBack = () => router.back();
const goEdit = () => router.push({ name: "EventEdit", params: { eventCode } });

// FullCalendar 옵션
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  events: [],
  eventClick: onEventClick,
});

onMounted(fetchEvent);
</script>

<style scoped>
/* 카드 공통 스타일 */
.detail-card,
.block-card,
.meta-card {
  background: #fff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}
.block-card {
  padding: 1rem;
}
.meta-card .meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.meta-card .meta-row span:first-child {
  color: #6b7280;
}
.meta-card .meta-row span:last-child {
  color: #111827;
}

/* 상태 Pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid transparent;
}
.status-pill--before {
  background: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}
.status-pill--done {
  background: #111827;
  color: #f9fafb;
  border-color: #111827;
}
.status-pill--rejected {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}
.status-pill--resubmit {
  background: #fefce8;
  color: #854d0e;
  border-color: #fef3c7;
}

/* 이미지 영역 */
.event-main-image {
  width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  margin-bottom: 1rem;
}
.event-main-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

/* 첨부파일 리스트 */
.file-list {
  margin-top: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  list-style: none;
  padding: 0;
}
.file-list li + li {
  margin-top: 0.25rem;
}
.file-list a {
  color: #2563eb;
  text-decoration: underline;
}
</style>
