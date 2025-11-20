<template>
  <div class="container-fluid py-4">
    <!-- 🎞 상단 슬라이드 배너 -->
    <div class="row mb-5">
      <div class="col-12">
        <div
          id="bannerCarousel"
          class="carousel slide shadow-sm rounded-4 overflow-hidden"
          data-bs-ride="carousel"
          data-bs-interval="2000"
        >
          <div class="carousel-inner">
            <div class="carousel-item active">
              <div class="banner-ratio">
                <img src="@/assets/img/banner/1.png" alt="이벤트 배너" />
              </div>
            </div>
            <div class="carousel-item">
              <div class="banner-ratio">
                <img src="@/assets/img/banner/2.png" alt="후원 배너" />
              </div>
            </div>
            <div class="carousel-item">
              <div class="banner-ratio">
                <img src="@/assets/img/banner/3.png" alt="공지 배너" />
              </div>
            </div>
          </div>

          <button
            class="carousel-control-prev"
            type="button"
            data-bs-target="#bannerCarousel"
            data-bs-slide="prev"
          >
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button
            class="carousel-control-next"
            type="button"
            data-bs-target="#bannerCarousel"
            data-bs-slide="next"
          >
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 📊 하단 2x2 그리드 -->
    <div class="summary-grid">
      <!-- (1,1) 신청 현황 -->
      <div class="summary-item summary-item--apply">
        <dashboard-table-card
          title="신청 현황"
          icon="assignment"
          color="success"
          :columns="[
            { label: 'NO', field: 'no', align: 'left' },
            { label: '지원자', field: 'child_name', align: 'left' },
            { label: '신청일', field: 'survey_date', align: 'left' },
            { label: '상태', field: 'status_label', align: 'right' },
          ]"
          :rows="applyRows"
          :maxRows="4"
          :user-role="userRole"
        />
      </div>

      <!-- (1,2) 이벤트 카드 (테이블) -->
      <div class="summary-item summary-item--event">
        <dashboard-table-card
          title="이벤트"
          icon="event"
          color="info"
          :columns="[
            { label: 'NO', field: 'no', align: 'left' },
            { label: '이벤트명', field: 'event_name', align: 'left' },
            { label: '기간', field: 'period', align: 'left' },
          ]"
          :rows="eventRows || []"
          :maxRows="4"
          empty-message-override="등록된 이벤트가 없습니다."
          @row-click="goEventDetail"
        />
      </div>

      <!-- (2,1) 동글동글 퀵 버튼 -->
      <div class="summary-item summary-item--actions">
        <div class="quick-actions-inline">
          <button class="quick-action-btn" @click="handleSurveyClick">
            <span class="quick-action-label">{{ surveyMainText }}</span>
            <span class="quick-action-sub">{{ surveySubText }}</span>
          </button>
          <button class="quick-action-btn" @click="goEvent">
            <span class="quick-action-label">이벤트</span>
            <span class="quick-action-sub">바로가기</span>
          </button>
          <button class="quick-action-btn" @click="goSupport">
            <span class="quick-action-label">후원</span>
            <span class="quick-action-sub">바로가기</span>
          </button>
        </div>
      </div>

      <!-- (2,2) 후원 카드 (테이블) -->
      <div class="summary-item summary-item--donation">
        <dashboard-table-card
          title="후원 프로그램"
          icon="volunteer_activism"
          color="primary"
          :columns="[
            { label: 'NO', field: 'no', align: 'left' },
            { label: '후원명', field: 'program_name', align: 'left' },
            { label: '기간', field: 'period', align: 'left' },
          ]"
          :rows="sponsorRows || []"
          :maxRows="4"
          empty-message-override="등록된 후원 프로그램이 없습니다."
          @row-click="goSponsorDetail"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DashboardTableCard from "@/components/DashboardTableCard.vue";
import axios from "axios";

export default {
  name: "Dashboard",
  components: { DashboardTableCard },
  data() {
    return {
      userRole: null,
      applyRows: [],
      eventRows: [],
      sponsorRows: [],
      loadingApply: false,
      loadingEvent: false,
      loadingSponsor: false,
    };
  },
  created() {
    // 로그인 정보에서 role 세팅
    const userStr = localStorage.getItem("user");

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role || null;
      } catch (e) {
        console.error("[Dashboard] user 파싱 실패:", e);
        this.userRole = null;
      }
    }

    // AA1~AA4는 모두 신청 현황 조회
    if (["AA1", "AA2", "AA3", "AA4"].includes(this.userRole)) {
      this.fetchApplyStats();
    }

    // 이벤트 / 후원 목록 조회
    this.fetchEventList();
    this.fetchSponsorList();
  },
  computed: {
    surveyMainText() {
      if (this.userRole === "AA0" || !this.userRole) return "로그인";
      return "조사지";
    },
    surveySubText() {
      if (this.userRole === "AA0" || !this.userRole) return "로그인 하러가기";
      if (this.userRole === "AA1") return "작성하기";
      if (["AA2", "AA3", "AA4"].includes(this.userRole)) return "목록 바로가기";
      return "";
    },
  },
  methods: {
    // ───────────────── 신청 관련 ─────────────────
    handleSurveyClick() {
      const role = this.userRole;

      if (role === "AA1") {
        this.$router.push("/survey/write");
      } else if (["AA2", "AA3", "AA4"].includes(role)) {
        this.$router.push("/survey-list");
      } else {
        this.$router.push("/sign-in");
      }
    },

    // ───────────────── 라우팅 버튼 ─────────────────
    goEvent() {
      this.$router.push("/event/list");
    },
    goSupport() {
      this.$router.push("/sponsorprogramlist");
    },

    // ───────────────── 이벤트 행 클릭 ─────────────────
    goEventDetail({ row }) {
      const code = row.event_code;
      if (!code) {
        console.warn("event_code 없음:", row);
        return;
      }
      this.$router.push(`/event/info/${code}`);
    },

    // ───────────────── 후원 행 클릭 ─────────────────
    goSponsorDetail({ row }) {
      const code = row.program_code;
      if (!code) {
        console.warn("program_code 없음:", row);
        return;
      }
      // ⚠ 실제 라우터 path에 맞게 수정해줘
      this.$router.push(`/sponsordetail/${code}`);
    },

    // ───────────────── 신청 현황 조회 ─────────────────
    async fetchApplyStats() {
      const userStr = localStorage.getItem("user");

      if (!userStr) {
        this.applyRows = [];
        return;
      }

      let loginId = null;
      try {
        const user = JSON.parse(userStr);
        // 🔥 백엔드 WHERE parent.user_id = ? 이면 user_id 사용
        loginId = user.user_id;
      } catch (e) {
        console.error("[Dashboard] user 파싱 실패:", e);
        this.applyRows = [];
        return;
      }

      if (!loginId) {
        this.applyRows = [];
        return;
      }

      this.loadingApply = true;

      try {
        const res = await axios.get("/api/applications/mine", {
          params: {
            loginId,
            role: this.userRole,
          },
        });

        const raw = res.data?.data ?? [];
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

        const sorted = list
          .filter((row) => row && row.submit_code)
          .sort((a, b) => {
            const da = new Date(a.survey_date || a.submit_at || 0);
            const db = new Date(b.survey_date || b.submit_at || 0);
            return db - da; // 최신 먼저
          })
          .slice(0, 4);

        this.applyRows = sorted.map((row, idx) => {
          let status = "-";

          if (row.result_status) {
            status = "결과";
          } else if (row.plan_status) {
            status = "계획";
          } else if (row.counsel_status) {
            status = "상담";
          } else {
            status = "접수";
          }

          const dateStr = row.survey_date
            ? String(row.survey_date).substring(0, 10)
            : "";

          return {
            no: idx + 1,
            child_name: row.child_name || row.name,
            org_name: row.org_name || "-",
            survey_date: dateStr,
            status_label: status,
          };
        });
      } catch (err) {
        console.error("[Dashboard] 신청 현황 조회 실패:", err);
        this.applyRows = [];
      } finally {
        this.loadingApply = false;
      }
    },

    // ───────────────── 이벤트 목록 조회 ─────────────────
    async fetchEventList() {
      this.loadingEvent = true;

      try {
        const res = await axios.get("/api/event/list");
        const raw = res.data?.data ?? [];
        const sorted = raw
          .sort((a, b) => b.event_code - a.event_code)
          .slice(0, 4);

        this.eventRows = sorted.map((row, idx) => {
          const start = row.event_start_date
            ? String(row.event_start_date).substring(0, 10)
            : "-";

          const end = row.event_end_date
            ? String(row.event_end_date).substring(0, 10)
            : "-";

          return {
            no: idx + 1,
            event_code: row.event_code, // 상세 이동용
            event_name: row.event_name,
            period: `${start} ~ ${end}`,
          };
        });
      } catch (e) {
        console.error("[Dashboard] 이벤트 목록 조회 실패:", e);
        this.eventRows = [];
      } finally {
        this.loadingEvent = false;
      }
    },

    // ───────────────── 후원(프로그램) 목록 조회 ─────────────────
    async fetchSponsorList() {
      this.loadingSponsor = true;

      try {
        const res = await axios.get("/api/sponsor");
        // 라우터에서 { status, serviceSponsor } 로 내려주니까 여기!
        const raw = res.data?.serviceSponsor ?? [];
        const sorted = raw
          .sort((a, b) => b.program_code - a.program_code)
          .slice(0, 4);

        this.sponsorRows = sorted.map((row, idx) => {
          const start = row.start_date
            ? String(row.start_date).substring(0, 10)
            : "-";

          const end = row.end_date
            ? String(row.end_date).substring(0, 10)
            : "-";

          return {
            no: idx + 1,
            program_code: row.program_code, // 상세 이동용
            program_name: row.program_name,
            period: `${start} ~ ${end}`,
          };
        });
      } catch (e) {
        console.error("[Dashboard] 후원 프로그램 목록 조회 실패:", e);
        this.sponsorRows = [];
      } finally {
        this.loadingSponsor = false;
      }
    },
  },
};
</script>

<style scoped>
.container-fluid {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 992px) {
  .container-fluid {
    padding: 0 60px; /* 가운데 여백 */
  }
}

/* 배너 비율 유지 */
.banner-ratio {
  width: 100%;
  aspect-ratio: 21 / 9;
  border-radius: 16px;
  overflow: hidden;
}

.banner-ratio > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 카드와 배너 간격 */
.row + .row {
  margin-top: 2rem;
}

/* 📊 그리드 기본(모바일): 1열 + 순서 지정 */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 0.5rem;
  grid-template-areas:
    "apply"
    "event"
    "donation"
    "actions";
}

/* 영역 매핑 */
.summary-item--apply {
  grid-area: apply;
}
.summary-item--event {
  grid-area: event;
}
.summary-item--donation {
  grid-area: donation;
}
.summary-item--actions {
  grid-area: actions;
}

/* 큰 화면(>=768px): 2x2 레이아웃 */
@media (min-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(0, auto);
    grid-template-areas:
      "apply event"
      "actions donation";
  }
}

/* 🔘 퀵액션 버튼 */
.quick-actions-inline {
  display: flex;
  justify-content: space-evenly;
  gap: 1rem;
}

.quick-action-btn {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: none;
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.quick-action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
  background-color: #f9fafb;
}

.quick-action-label {
  font-size: 13px;
  font-weight: 700;
}

.quick-action-sub {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}
</style>
