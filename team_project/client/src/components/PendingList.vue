<template>
  <div class="apv-page">
    <h3 class="fw-bold text-start text-dark mb-4">대기자 목록</h3>

    <div class="apv-toolbar">
      <div class="apv-filters">
        <select v-model="stage" class="apv-select" @change="fetchList(1)">
          <option value="">단계 전체</option>
          <option value="ST1">지원중</option>
          <option value="ST2">기간만료</option>
          <option value="ST3">반려</option>
        </select>

        <select
          v-model="progressState"
          class="apv-select"
          @change="fetchList(1)"
        >
          <option value="">진행상태 전체</option>
          <option value="PR1">작성중</option>
          <option value="PR2">승인완료</option>
        </select>

        <input
          v-model.trim="applicantKeyword"
          class="apv-input"
          placeholder="신청자명 검색"
          @keyup.enter="fetchList(1)"
        />

        <input
          v-model.trim="managerKeyword"
          class="apv-input"
          placeholder="담당자명 검색"
          @keyup.enter="fetchList(1)"
        />
      </div>
      <button class="apv-btn apv-btn-outline" @click="fetchList(1)">
        조회
      </button>
    </div>

    <div class="apv-table-wrap">
      <table class="apv-table">
        <thead>
          <tr>
            <th style="width: 5%">순번</th>
            <th style="width: 15%">이름</th>
            <th style="width: 15%">신청일</th>
            <th style="width: 15%">담당자</th>
            <th style="width: 10%">첨부파일</th>
            <th style="width: 15%">진행상태</th>
            <th style="width: 15%">단계</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in list" :key="item.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>
              <a href="#" @click.prevent="openDetail(item)">
                {{ item.applicantName }}
              </a>
            </td>
            <td>{{ item.applyDate }}</td>
            <td>{{ item.managerName }}</td>
            <td>
              <i
                v-if="item.hasAttachment"
                class="fas fa-paperclip apv-text-info"
                title="첨부파일 있음"
              ></i>
              <span v-else class="apv-muted">없음</span>
            </td>
            <td>
              <span
                :class="['apv-state', getProgressClass(item.progressState)]"
              >
                {{ getProgressText(item.progressState) }}
              </span>
            </td>
            <td>
              <select
                :value="item.stage"
                class="apv-select apv-select-sm"
                @change="onChangeStage(item.id, $event.target.value)"
              >
                <option value="ST1">지원중</option>
                <option value="ST2">기간만료</option>
                <option value="ST3">반려</option>
              </select>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="7" class="text-center py-4 apv-muted">
              검색된 대기자 목록이 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalCount > pageSize" class="pagination-wrap">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="setPageAndFetch(currentPage - 1)"
      >
        &lt;
      </button>
      <button
        v-for="p in pageNumbers"
        :key="p"
        :class="['page-btn', { active: p === currentPage }]"
        @click="setPageAndFetch(p)"
      >
        {{ p }}
      </button>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="setPageAndFetch(currentPage + 1)"
      >
        &gt;
      </button>
    </div>

    <div v-if="showDetailModal" class="apv-modal-backdrop">
      <div class="apv-modal">
        <h5 class="apv-modal-title">
          {{ detailData.applicantName }} 상세 정보
        </h5>
        <p class="apv-modal-content">
          신청일: {{ detailData.applyDate }}<br />
          담당자: {{ detailData.managerName }}<br />
          진행상태: {{ getProgressText(detailData.progressState) }}<br />
          단계: {{ getStageText(detailData.stage) }}<br />
        </p>
        <div class="text-end">
          <button
            class="apv-btn apv-btn-outline"
            @click="showDetailModal = false"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// [주의] 이 함수는 목업입니다. 실제 프로젝트의 API 호출 로직으로 변경해야 합니다.
const fetchPendingListApi = async (params) => {
  // 실제 백엔드 연동 시: axios.get('/api/pending/list', { params }) 등을 사용합니다.
  console.log('API 호출: 대기자 목록', params);

  // 목업 데이터 (20건)
  const mockData = Array(20)
    .fill(0)
    .map((_, i) => ({
      id: i + 1,
      applicantName: `신청자${i + 1}`,
      applyDate: `2024-11-${String(i + 1).padStart(2, '0')}`,
      managerName: i % 3 === 0 ? '이담당' : '미배정',
      hasAttachment: i % 2 === 0,
      progressState: i % 4 < 2 ? 'PR1' : 'PR2', // PR1: 작성중, PR2: 승인완료
      stage: i % 4 === 0 ? 'ST1' : i % 4 === 1 ? 'ST2' : 'ST3', // ST1: 지원중, ST2: 기간만료, ST3: 반려
    }));

  // 클라이언트 측 목업 필터링
  let filteredData = mockData;

  if (params.stage) {
    filteredData = filteredData.filter((item) => item.stage === params.stage);
  }
  if (params.progressState) {
    filteredData = filteredData.filter(
      (item) => item.progressState === params.progressState
    );
  }
  if (params.applicantKeyword) {
    filteredData = filteredData.filter((item) =>
      item.applicantName.includes(params.applicantKeyword)
    );
  }
  if (params.managerKeyword) {
    filteredData = filteredData.filter((item) =>
      item.managerName.includes(params.managerKeyword)
    );
  }

  // 클라이언트 측 목업 페이지네이션
  const pageSize = params.pageSize || 10;
  const page = params.page || 1;
  const totalCount = filteredData.length;
  const startIndex = (page - 1) * pageSize;
  const list = filteredData.slice(startIndex, startIndex + pageSize);

  return {
    list: list,
    totalCount: totalCount,
  };
};

export default {
  name: 'PendingList',
  data() {
    return {
      // 검색 필터
      stage: '', // 단계
      progressState: '', // 진행상태
      applicantKeyword: '', // 신청자명 검색
      managerKeyword: '', // 담당자명 검색

      // 목록 데이터 및 페이지네이션
      list: [],
      pageSize: 10,
      currentPage: 1,
      totalCount: 0,

      // 모달
      showDetailModal: false,
      detailData: {},
    };
  },

  computed: {
    totalPages() {
      return Math.ceil(this.totalCount / this.pageSize);
    },
    pageNumbers() {
      const maxPagesToShow = 5;
      let startPage = Math.max(
        1,
        this.currentPage - Math.floor(maxPagesToShow / 2)
      );
      let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        const newStart = Math.max(1, endPage - maxPagesToShow + 1);
        startPage = newStart;
      }

      const pages = [];
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    },
  },

  mounted() {
    this.fetchList();
  },

  methods: {
    getProgressText(state) {
      switch (state) {
        case 'PR1':
          return '작성중';
        case 'PR2':
          return '승인완료';
        default:
          return '알 수 없음';
      }
    },
    getProgressClass(state) {
      return `apv-state-${state}`;
    },
    getStageText(stage) {
      switch (stage) {
        case 'ST1':
          return '지원중';
        case 'ST2':
          return '기간만료';
        case 'ST3':
          return '반려';
        default:
          return '미지정';
      }
    },

    setPageAndFetch(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.fetchList(page);
      }
    },

    onChangeStage(id, newStage) {
      const item = this.list.find((i) => i.id === id);
      if (
        confirm(
          `${item.applicantName} 님의 단계를 '${this.getStageText(
            newStage
          )}'(으)로 변경하시겠습니까?`
        )
      ) {
        this.fetchList(this.currentPage);
      } else {
        this.$nextTick(() => {});
      }
    },

    async fetchList(newPage) {
      try {
        if (newPage === 1) {
          this.currentPage = 1;
        } else if (newPage) {
          this.currentPage = newPage;
        }

        const result = await fetchPendingListApi({
          page: this.currentPage,
          pageSize: this.pageSize,
          stage: this.stage,
          progressState: this.progressState,
          applicantKeyword: this.applicantKeyword,
          managerKeyword: this.managerKeyword,
        });

        this.list = result.list;
        this.totalCount = result.totalCount;
      } catch (error) {
        console.error('대기자 목록 조회 오류:', error);
        this.list = [];
        this.totalCount = 0;
      }
    },

    openDetail(item) {
      this.detailData = item;
      this.showDetailModal = true;
    },
  },
};
</script>

<style scoped>
.apv-page {
  /* 폰트 통일: 시스템 기본 폰트 + 맑은 고딕 */
  font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕',
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.apv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}
.apv-filters {
  display: flex;
  gap: 10px;
  align-items: center;
}
.apv-input,
.apv-select {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  min-width: 140px;
}
.apv-select-sm {
  padding: 4px 8px;
  font-size: 12px;
  height: 30px;
  min-width: 100px;
}

.apv-btn,
.apv-btn-outline {
  padding: 8px 15px; /* P.A.와 통일 */
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent; /* 기본 테두리 속성 추가 */
  transition: all 0.2s;
  font-weight: 600; /* P.A.의 기본 버튼 폰트 두께 */
}
.apv-btn-outline {
  background: #ffffff;
  border: 1px solid #dcdcdc;
  height: 38px;
  line-height: 20px;
  color: #495057;
  font-weight: 500; /* 기본 600을 500으로 재설정 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.apv-btn-outline:hover {
  background: #f0f0f0;
  border-color: #c0c0c0;
  color: #333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 테이블 */
.apv-table-wrap {
  overflow-x: auto;
  min-height: 560px;
}
.apv-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.apv-table th,
.apv-table td {
  padding: 10px 10px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
  font-size: 14px;
}
.apv-table th {
  background-color: #f8f9fa;
  font-weight: 700;
  color: #344767;
}
.apv-table td a {
  color: #5e72e4;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}
.apv-table td {
  text-align: left !important;
}

/* 상태 뱃지 */
.apv-state {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;
}

.apv-state-PR1,
.apv-state-ST1 {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.apv-state-PR2 {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.apv-state-ST3,
.apv-state-ST2 {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.apv-text-info {
  color: #17a2b8;
  font-size: 1.1rem;
}
.apv-muted {
  color: #9ca3af;
  font-size: 12px;
}

.pagination-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-top: 20px;
  padding: 15px 10px;
  background-color: transparent;
  box-shadow: none;
}
.page-btn {
  padding: 8px 12px;
  font-size: 14px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background-color: #e9ecef;
}
.page-btn.active {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}
.apv-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}
.apv-modal {
  width: min(460px, 92vw);
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 18px 16px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.35);
  border: 1px solid #e2e7f0;
}
.apv-modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.apv-modal-content {
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 20px;
}
</style>
