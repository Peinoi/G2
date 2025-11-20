<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- 상단 액션라인 -->
    <div class="flex justify-between items-center">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>
      <!-- 매니저 승인/취소 -->
      <MaterialButton v-if="isManager" @click="handleApprove"
        >승인</MaterialButton
      >

      <MaterialButton v-if="isManager" @click="handleReject"
        >취소</MaterialButton
      >
    </div>

    <!-- 이벤트 기본정보 카드 -->
    <div v-if="applyInfo" class="detail-card space-y-4">
      <span class="status-pill" :class="statusClass(applyInfo.apply_status)">
        {{ applyInfo.apply_status_name }}
      </span>
      <header class="flex justify-between items-center">
        <h2 class="text-2xl font-semibold">이벤트 상세</h2>
      </header>

      <div class="event-main-image">
        <img v-if="mainImage" :src="mainImage" alt="대표 이미지" />
        <div v-else class="no-image">이미지 없음</div>
      </div>

      <div class="meta-card">
        <h5>메인이벤트 정보</h5>
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
        <div class="meta-row">
          <span>모집 기간</span
          ><span
            >{{ formatDate(event.recruit_start_date) }} ~
            {{ formatDate(event.recruit_end_date) }}</span
          >
        </div>
        <div class="meta-row">
          <span>진행 기간</span
          ><span
            >{{ formatDate(event.event_start_date) }} ~
            {{ formatDate(event.event_end_date) }}</span
          >
        </div>
        <div class="meta-row">
          <span>내용</span><span>{{ event.event_content }}</span>
        </div>
      </div>

      <!-- 세부이벤트 카드-->
      <div v-if="event.sub_events.length" class="meta-card">
        <h5>세부이벤트 정보</h5>
        <div class="meta-row">
          <span>
            <ul
              class="sub-list"
              v-for="sub in event.sub_events"
              :key="sub.sub_event_code"
            >
              <li>
                <span>세부이벤트코드</span>
                <span>{{ sub.sub_event_code }}</span>
              </li>
              <li>
                <span>세부이벤트명</span>
                <span>{{ sub.sub_event_name }}</span>
              </li>
              <li>
                <span>시행기간</span>
                <span
                  >{{ sub.sub_event_start_date }} ~
                  {{ sub.sub_event_end_date }}</span
                >
              </li>
              <li>
                <span>모집인원</span>
                <span>{{ sub.sub_recruit_count }}</span>
              </li>
            </ul>
          </span>
        </div>
      </div>

      <!-- 첨부파일 카드 -->
      <div v-if="event.attachments.length" class="meta-card">
        <div class="meta-row">
          <span>첨부파일</span>
          <span>
            <ul class="file-list">
              <li v-for="file in event.attachments" :key="file.server_filename">
                <span class="file-name" @click="previewFile(file)">
                  {{ file.original_filename }}
                </span>
              </li>
            </ul>
          </span>
        </div>
        <!-- 이미지 미리보기 모달 -->
        <div v-if="previewImage" class="preview-modal" @click="closePreview">
          <img :src="previewImage" class="preview-img" />
        </div>
      </div>

      <!-- 자녀 카드 -->
      <div class="meta-card">
        <h5>자녀 정보</h5>
        <div class="meta-row">
          <span>자녀명</span><span>{{ applyInfo.child_name }}</span>
        </div>
        <div class="meta-row">
          <span>성별</span><span>{{ applyInfo.child_gender_name }}</span>
        </div>
        <div class="meta-row">
          <span>주민번호</span><span>{{ applyInfo.child_ssn }}</span>
        </div>
      </div>

      <!-- 신청자 카드 -->
      <div class="meta-card">
        <h5>신청자 정보</h5>
        <div class="meta-row">
          <span>신청자명</span><span>{{ applyInfo.applicant_name }}</span>
        </div>
        <div class="meta-row">
          <span>주소</span><span>{{ applyInfo.applicant_address }}</span>
        </div>
        <div class="meta-row">
          <span>소속기관</span><span>{{ applyInfo.applicant_org_name }}</span>
        </div>
        <div class="meta-row">
          <span>주민번호</span><span>{{ applyInfo.applicant_ssn }}</span>
        </div>
        <div class="meta-row">
          <span>전화번호</span><span>{{ applyInfo.applicant_phone }}</span>
        </div>
        <div class="meta-row">
          <span>이메일</span><span>{{ applyInfo.applicant_email }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

const route = useRoute();
const router = useRouter();

const isManager = ref(false);

const checkManager = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return user.role === "AA2";
  } catch {
    return false;
  }
};

const eventCode = Number(route.params.eventCode || 0);
const applyCode = Number(route.params.applyCode || 0);

const applyInfo = ref({});

const event = ref({
  sub_events: [],
  attachments: [],
});

const mainImage = ref("");
const isApplied = ref(false);

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

    await nextTick();
  } catch (err) {
    console.error("fetchEvent error:", err);
  }
};

// 상태 Pill 클래스
const statusClass = (status) => {
  switch (status) {
    case "DA1":
      return "status-pill--before";
    case "DA2":
      return "status-pill--done";
    case "DA4":
      return "status-pill--rejected";
    default:
      return "";
  }
};

// 신청자/자녀 조회
const fetchApply = async () => {
  try {
    const res = await axios.get(`/api/event/attendanceList/${applyCode}`);
    applyInfo.value = res.data.data || {};

    await nextTick();
  } catch (err) {
    console.error("fetchApply error:", err);
  }
};

// 승인 (담당자)
const handleApprove = async () => {
  try {
    const res = await axios.post(`/api/event/myApply/approve/${applyCode}`);
    if (res.data.success) {
      alert("승인되었습니다.");
      await fetchEvent();
      await fetchApply();
    } else {
      alert(res.data.message || "승인 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 취소 (담당자)
const handleReject = async () => {
  try {
    const res = await axios.post(`/api/event/myApply/reject/${applyCode}`);
    if (res.data.success) {
      alert("취소 처리되었습니다.");
      await fetchEvent();
      await fetchApply();
    } else {
      alert(res.data.message || "취소 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 화면 이동
const goBack = () => router.back();

onMounted(async () => {
  await fetchEvent();
  await fetchApply();
  isManager.value = checkManager();
});
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

/* 첨부파일 리스트 */
.sub-list {
  margin-top: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  list-style: none;
  padding: 0;
}
.sub-list li + li {
  margin-top: 0.25rem;
}
.sub-list a {
  color: #2563eb;
  text-decoration: underline;
}
</style>
