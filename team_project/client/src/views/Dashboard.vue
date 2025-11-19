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
            <!-- 첫 번째 배너 -->
            <div class="carousel-item active">
              <div class="banner-ratio">
                <img src="@/assets/img/banner/1.png" alt="이벤트 배너" />
              </div>
            </div>

            <!-- 두 번째 배너 -->
            <div class="carousel-item">
              <div class="banner-ratio">
                <img src="@/assets/img/banner/2.png" alt="후원 배너" />
              </div>
            </div>

            <!-- 세 번째 배너 -->
            <div class="carousel-item">
              <div class="banner-ratio">
                <img src="@/assets/img/banner/3.png" alt="공지 배너" />
              </div>
            </div>
          </div>

          <!-- 좌우 버튼 -->
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
        <mini-statistics-card
          title="신청 현황"
          value="7억건"
          icon="assignment"
          color="success"
          description="이번 주 기준 신청 현황"
        />
      </div>

      <!-- (1,2) 이벤트 -->
      <div class="summary-item summary-item--event">
        <mini-statistics-card
          title="이벤트 참여"
          value="2억명"
          icon="event"
          color="info"
          description="이번 달 등록된 이벤트 수"
        />
      </div>

      <!-- (2,1) 동글동글 버튼들 -->
      <div class="summary-item summary-item--actions">
        <div class="quick-actions-inline">
          <button class="quick-action-btn" @click="goSurvey">
            <span class="quick-action-label">조사지</span>
            <span class="quick-action-sub">작성하기</span>
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

      <!-- (2,2) 후원 -->
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

export default {
  name: "Dashboard",
  components: { MiniStatisticsCard },
  methods: {
    // 👉 실제 라우트 경로에 맞게 바꿔 쓰면 됨
    goSurvey() {
      this.$router.push("/survey");
    },
    goEvent() {
      this.$router.push("/event");
    },
    goSupport() {
      this.$router.push("/support");
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

/* ✅ 배너 비율 고정 (aspect-ratio 사용) */
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

/* 카드와 배너 간격 (row + row 구조용) */
.row + .row {
  margin-top: 2rem;
}

/* 📊 2x2 느낌 카드 그리드 */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr; /* 모바일: 한 줄 */
  gap: 1.5rem;
  margin-top: 0.5rem;
}

/* 화면 좀 넓어지면 2열 그리드 + 2x2 고정 위치 */
@media (min-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(0, auto);
  }

  .summary-item--apply {
    grid-column: 1;
    grid-row: 1;
  }

  .summary-item--event {
    grid-column: 2;
    grid-row: 1;
  }

  .summary-item--actions {
    grid-column: 1;
    grid-row: 2;
  }

  .summary-item--donation {
    grid-column: 2;
    grid-row: 2;
  }
}

/* 🔘 퀵 액션 동그라미 버튼 (가로로 3개) */
.quick-actions-inline {
  display: flex;
  justify-content: space-evenly;
  gap: 1rem;
}

/* 동그란 버튼 자체 스타일 */
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
