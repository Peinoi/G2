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
            <td>{{ totalCount - (page - 1) * pageSize - index }}</td>
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

    <div v-if="totalCount > pageSize" class="apv-pagination">
      <button
        @click="fetchList(page - 1)"
        :disabled="page === 1"
        class="apv-pagination-btn"
      >
        &lt; 이전
      </button>
      <span class="apv-page-info"
        >{{ page }} / {{ totalPages }} 페이지 (총 {{ totalCount }}건)</span
      >
      <button
        @click="fetchList(page + 1)"
        :disabled="page === totalPages"
        class="apv-pagination-btn"
      >
        다음 &gt;
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
      page: 1,
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
  },

  mounted() {
    this.fetchList();
  },

  methods: {
    // 진행상태 텍스트
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
    // 진행상태 스타일 클래스
    getProgressClass(state) {
      return `apv-state-${state}`;
    },
    // 단계 텍스트
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

    // 단계 변경 액션 (목업)
    onChangeStage(id, newStage) {
      const item = this.list.find((i) => i.id === id);
      if (
        confirm(
          `${item.applicantName} 님의 단계를 '${this.getStageText(
            newStage
          )}'(으)로 변경하시겠습니까?`
        )
      ) {
        // TODO: 실제 API 호출 (단계를 변경하는 PUT/PATCH 요청)
        // alert('단계가 변경되었습니다.');
        this.fetchList(this.page); // 변경 후 목록 새로고침 (실제는 성공 콜백에서 진행)
      } else {
        // 취소 시 원래 값으로 되돌리기
        this.$nextTick(() => {
          // 강제 리렌더링 등으로 원래 값을 유지해야 함 (목업 한계)
          // 실제로는 API 호출이 성공했을 때만 데이터가 업데이트되므로 이 문제는 발생하지 않음
        });
      }
    },

    // 리스트 조회
    async fetchList(pageNumber) {
      if (pageNumber) {
        this.page = pageNumber;
      }

      try {
        const result = await fetchPendingListApi({
          page: this.page,
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

    // 상세 모달 열기
    openDetail(item) {
      this.detailData = item;
      this.showDetailModal = true;
    },
  },
};
</script>

<style scoped>
/*
  이하 스타일은 기존 컴포넌트의 스타일과 일관성을 위해 복사되었습니다.
*/
.apv-page {
  padding: 10px 0;
}
.apv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 10px;
}
.apv-filters {
  display: flex;
  gap: 10px;
  flex-grow: 1;
}
.apv-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  flex-grow: 1;
  max-width: 150px;
  transition: border-color 0.2s;
}
.apv-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  min-width: 120px;
  transition: border-color 0.2s;
}
.apv-select-sm {
  padding: 4px 8px;
  font-size: 12px;
  height: 30px;
  min-width: 100px;
}
.apv-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.apv-btn-outline {
  background: #fff;
  color: #5e72e4;
  border: 1px solid #5e72e4;
  transition: background 0.2s;
}
.apv-btn-outline:hover {
  background: #5e72e4;
  color: #fff;
}

/* 테이블 */
.apv-table-wrap {
  overflow-x: auto;
  margin-bottom: 1rem;
}
.apv-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}
.apv-table th,
.apv-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  text-align: center;
  font-size: 14px;
}
.apv-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
}
.apv-table tbody tr:hover {
  background-color: #f5f5f5;
}
.apv-table td a {
  color: #5e72e4;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}

/* 상태 뱃지 */
.apv-state {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
/* 진행상태: 작성중 (노란색 계열) */
.apv-state-PR1 {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}
/* 진행상태: 승인완료 (초록색 계열) */
.apv-state-PR2 {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
/* 단계: 지원중 (파란색 계열, 임의 지정) */
.apv-state-ST1 {
  background: #cce5ff;
  color: #004085;
  border: 1px solid #b8daff;
}
/* 단계: 기간만료 (회색 계열, 임의 지정) */
.apv-state-ST2 {
  background: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}
/* 단계: 반려 (빨간색 계열) */
.apv-state-ST3 {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.apv-text-info {
  color: #17a2b8;
  font-size: 1.1rem;
}
.apv-muted {
  color: #9ca3af;
  font-size: 12px;
}

/* 페이지네이션 */
.apv-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}
.apv-pagination-btn {
  background: #f8f9fa;
  border: 1px solid #ccc;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.apv-pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.apv-page-info {
  font-size: 14px;
  font-weight: 600;
  color: #6c757d;
}

/* 모달 */
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
