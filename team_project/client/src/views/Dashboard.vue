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
      <!-- (1,1) 나의 신청 현황 -->
      <div class="summary-item summary-item--apply">
        <dashboard-table-card
          title="나의 신청 현황"
          icon="assignment"
          color="success"
          :columns="[
            { label: '지원자', field: 'child_name', align: 'left' },
            { label: '기관', field: 'org_name', align: 'left' },
            { label: '신청일', field: 'survey_date', align: 'left' },
            { label: '상태', field: 'status_label', align: 'right' },
          ]"
          :rows="applyRows"
          :maxRows="4"
        />
      </div>

      <!-- (1,2) 이벤트 카드 -->
      <div class="summary-item summary-item--event">
        <mini-statistics-card
          title="이벤트 참여"
          value="2억명"
          icon="event"
          color="info"
          description="이번 달 등록된 이벤트 수"
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

      <!-- (2,2) 후원 카드 -->
      <div class="summary-item summary-item--donation">
        <mini-statistics-card
          title="후원 금액"
          value="₩280,000,000,000"
          icon="volunteer_activism"
          color="primary"
          description="총 누적 후원 금액"
        />
      </div>
    </div>
  </div>
</template>

<script>
import MiniStatisticsCard from "@/components/MiniStatisticsCard.vue";
import DashboardTableCard from "@/components/DashboardTableCard.vue";
import axios from "axios";

export default {
  name: "Dashboard",
  components: { MiniStatisticsCard, DashboardTableCard },
  data() {
    return {
      userRole: null,
      applyRows: [],
      loadingApply: false,
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

    // 일반 사용자(AA1)일 때만 "나의 신청 현황" 조회
    if (this.userRole === "AA1") {
      this.fetchApplyStats();
    }
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
    handleSurveyClick() {
      const role = this.userRole;

      if (role === "AA1") {
        this.$router.push("/survey/write");
      } else if (["AA2", "AA3", "AA4"].includes(role)) {
        this.$router.push("/survey/list");
      } else {
        this.$router.push("/sign-in");
      }
    },
    goEvent() {
      this.$router.push("/event/list");
    },
    goSupport() {
      this.$router.push("/support");
    },

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
          params: { loginId },
        });

        const raw = res.data?.data ?? [];
        let list = [];

        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && typeof raw === "object") {
          list = [raw];
        }

        // submit_code 있는 것만 필터 + 최신순 정렬 + 앞에서 4개만 사용
        const sorted = list
          .filter((row) => row && row.submit_code)
          .sort((a, b) => {
            const da = new Date(a.survey_date || a.submit_at || 0);
            const db = new Date(b.survey_date || b.submit_at || 0);
            return db - da; // 최신 먼저
          })
          .slice(0, 4);

        this.applyRows = sorted.map((row) => {
          // 상태 문자열 만들기 (계획/결과 상황에 따라)
          let status = "-";

          if (row.result_status) {
            status = `결과중`;
          } else if (row.plan_status) {
            status = `계획중`;
          } else {
            status = "검토중";
          }

          const dateStr = row.survey_date
            ? String(row.survey_date).substring(0, 10)
            : "";

          return {
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
  },
};
</script>

<style scoped>
.container-fluid {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* 화면 넓을 때 가운데로 모으는 느낌 */
@media (min-width: 992px) {
  .container-fluid {
    padding: 0 300px;
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
