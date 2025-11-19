<template>
  <div class="apv-page">
    <div class="apv-toolbar">
      <div class="apv-filters">
        <select v-model="stateInput" class="apv-select">
          <option value="">단계 전체</option>
          <option value="미검토">미검토</option>
          <option value="검토중">검토중</option>
          <option value="승인완료">승인완료</option>
        </select>

        <input
          v-model.trim="applicantKeywordInput"
          class="apv-input"
          placeholder="신청자명"
          @keyup.enter="fetchList"
        />

        <input
          v-model.trim="managerKeywordInput"
          class="apv-input"
          placeholder="담당자명"
          @keyup.enter="fetchList"
        />
      </div>
      <button class="apv-btn apv-btn-outline" @click="fetchList">조회</button>
    </div>

    <div class="apv-table-wrap">
      <table class="apv-table">
        <thead>
          <tr>
            <th style="width: 5%">순번</th>
            <th style="width: 15%">이름</th>
            <th style="width: 15%">신청일</th>
            <th style="width: 15%">담당자</th>
            <th style="width: 25%">첨부파일</th>
            <th style="width: 25%">단계</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in list" :key="item.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ item.applicantName }}</td>
            <td>{{ item.applicationDate }}</td>
            <td>{{ item.managerName }}</td>
            <td>
              <button
                class="apv-btn-link"
                @click="onAttachmentClick(item.attachment)"
              >
                {{ item.attachment }}
              </button>
            </td>
            <td class="apv-actions-cell">
              <span class="apv-state" :class="item.statusBg">
                {{ item.status }}
              </span>

              <div class="status-change-btns">
                <template v-for="newStatus in allStatusKeys" :key="newStatus">
                  <button
                    v-if="item.status !== newStatus"
                    :class="[
                      'apv-btn',
                      'apv-btn-sm',
                      { 'apv-btn-info': newStatus === '검토중' },
                      { 'apv-btn-success': newStatus === '승인완료' },
                      { 'apv-btn-danger': newStatus === '미검토' },
                    ]"
                    @click="changeStatus(item, newStatus)"
                  >
                    {{ newStatus === '미검토' ? '반려' : newStatus }}
                  </button>
                </template>
              </div>
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="6" class="text-center">
              조회된 대기자 목록이 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-wrap">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="setPage(currentPage - 1)"
      >
        &lt;
      </button>

      <button
        v-for="page in pageNumbers"
        :key="page"
        :class="['page-btn', { active: page === currentPage }]"
        @click="setPage(page)"
      >
        {{ page }}
      </button>

      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="setPage(currentPage + 1)"
      >
        &gt;
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PendingApproval',
  data() {
    return {
      // ⭐️ 1. Input 필드에 바인딩되는 값 (데이터만 변경, computed에 영향 X) ⭐️
      stateInput: '',
      applicantKeywordInput: '',
      managerKeywordInput: '',

      // ⭐️ 2. 실제 필터링에 사용되는 값 (fetchList에서만 변경) ⭐️
      stateActive: '',
      applicantKeywordActive: '',
      managerKeywordActive: '',

      // 페이징 관련 상태
      pageSize: 10,
      currentPage: 1,

      // 전체 더미 데이터 (listRaw)
      listRaw: [
        {
          id: 1,
          applicantName: '김철수',
          applicationDate: '2025-11-15',
          managerName: '이영희',
          attachment: '신분증, 신청서',
          status: '미검토',
          statusBg: 'apv-state-BA3',
        },
        {
          id: 2,
          applicantName: '박영수',
          applicationDate: '2025-11-10',
          managerName: '최민수',
          attachment: '신분증',
          status: '검토중',
          statusBg: 'apv-state-BA1',
        },
        {
          id: 3,
          applicantName: '정하나',
          applicationDate: '2025-11-01',
          managerName: '이영희',
          attachment: '신분증, 신청서, 서약서',
          status: '승인완료',
          statusBg: 'apv-state-BA2',
        },
        {
          id: 4,
          applicantName: '이하늘',
          applicationDate: '2025-10-28',
          managerName: '김민지',
          attachment: '신분증',
          status: '미검토',
          statusBg: 'apv-state-BA3',
        },
        {
          id: 5,
          applicantName: '최지우',
          applicationDate: '2025-10-25',
          managerName: '박준영',
          attachment: '신청서',
          status: '검토중',
          statusBg: 'apv-state-BA1',
        },
        {
          id: 6,
          applicantName: '강민호',
          applicationDate: '2025-10-22',
          managerName: '이영희',
          attachment: '신분증, 서약서',
          status: '승인완료',
          statusBg: 'apv-state-BA2',
        },
        {
          id: 7,
          applicantName: '윤서연',
          applicationDate: '2025-10-18',
          managerName: '최민수',
          attachment: '신청서',
          status: '미검토',
          statusBg: 'apv-state-BA3',
        },
        {
          id: 8,
          applicantName: '송재림',
          applicationDate: '2025-10-15',
          managerName: '김민지',
          attachment: '신분증',
          status: '검토중',
          statusBg: 'apv-state-BA1',
        },
        {
          id: 9,
          applicantName: '한예슬',
          applicationDate: '2025-10-10',
          managerName: '박준영',
          attachment: '신분증, 서약서',
          status: '승인완료',
          statusBg: 'apv-state-BA2',
        },
        {
          id: 10,
          applicantName: '오상진',
          applicationDate: '2025-10-05',
          managerName: '이영희',
          attachment: '신청서',
          status: '미검토',
          statusBg: 'apv-state-BA3',
        },
        {
          id: 11,
          applicantName: '고아라',
          applicationDate: '2025-10-01',
          managerName: '최민수',
          attachment: '신분증',
          status: '검토중',
          statusBg: 'apv-state-BA1',
        },
        {
          id: 12,
          applicantName: '장동건',
          applicationDate: '2025-09-28',
          managerName: '김민지',
          attachment: '신청서',
          status: '승인완료',
          statusBg: 'apv-state-BA2',
        },
      ],
      // 상태 관리를 위한 맵핑 객체
      statusMap: {
        미검토: { label: '미검토', class: 'apv-state-BA3' },
        검토중: { label: '검토중', class: 'apv-state-BA1' },
        승인완료: { label: '승인완료', class: 'apv-state-BA2' },
      },
      allStatusKeys: ['미검토', '검토중', '승인완료'],
    };
  },
  computed: {
    // ⭐️ 필터링된 전체 목록 (Active 값으로 필터링) ⭐️
    filteredList() {
      return this.listRaw.filter((item) => {
        // Active 값에 의존하여, Active 값이 변경될 때만 필터링이 재실행됩니다.
        const stateMatch =
          !this.stateActive || item.status === this.stateActive;
        const applicantMatch =
          !this.applicantKeywordActive ||
          item.applicantName.includes(this.applicantKeywordActive.trim());
        const managerMatch =
          !this.managerKeywordActive ||
          item.managerName.includes(this.managerKeywordActive.trim());

        return stateMatch && applicantMatch && managerMatch;
      });
    },

    // 총 페이지 수 계산 (필터링된 목록 기준)
    totalPages() {
      return Math.ceil(this.filteredList.length / this.pageSize);
    },

    // 현재 페이지에 표시할 목록 계산 (페이징 적용)
    list() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;

      return this.filteredList.slice(start, end);
    },

    // 페이지네이션 컴포넌트에 표시할 페이지 번호 배열
    pageNumbers() {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    },
  },
  methods: {
    // ⭐️ 조회 버튼 클릭 또는 Enter 키 입력 시 실행되는 함수 ⭐️
    fetchList() {
      // ⭐️ Input 값을 Active 값으로 복사하여 computed 속성의 재계산을 유도합니다. ⭐️
      this.stateActive = this.stateInput;
      this.applicantKeywordActive = this.applicantKeywordInput;
      this.managerKeywordActive = this.managerKeywordInput;

      // 검색이 적용되면 1페이지로 이동
      this.currentPage = 1;
      console.log('목록 조회 및 필터링 적용');
    },

    onAttachmentClick(attachment) {
      alert(`다운로드/상세 보기: ${attachment}`);
    },

    changeStatus(item, newStatus) {
      const statusLabel = newStatus === '미검토' ? '반려' : newStatus;
      if (
        !confirm(
          `${item.applicantName}님의 상태를 [${statusLabel}]로 변경하시겠습니까?`
        )
      ) {
        return;
      }
      item.status = newStatus;
      item.statusBg = this.statusMap[newStatus].class;
      alert(`상태가 ${statusLabel}로 변경되었습니다.`);
    },

    setPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
  },
  mounted() {
    // 컴포넌트 마운트 시 최초 1회 목록 로드
    this.fetchList();
  },
};
</script>

<style scoped>
/* ---------------------------------------------------- */
/* [Fix] 부모 컴포넌트의 넓은 영역을 채우기 위한 스타일 */
/* ---------------------------------------------------- */
.apv-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.apv-title {
  display: none !important;
}

/* ---------------------------------------------------- */
/* 테이블 및 액션 버튼 스타일 */
/* ---------------------------------------------------- */
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
}

.apv-btn,
.apv-btn-outline {
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.apv-btn-outline {
  background: none;
  border-color: #dee2e6;
  color: #495057;
}

.apv-table-wrap {
  overflow-x: auto;
}

.apv-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.apv-table th,
.apv-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
  font-size: 14px;
}

.apv-table th {
  background-color: #f8f9fa;
  font-weight: 700;
  color: #344767;
}

/* 단계 셀 정렬 및 버튼 스타일 */
.apv-actions-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

.apv-state {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;
}

.status-change-btns {
  display: flex;
  gap: 4px;
}

/* 첨부파일 링크 버튼 스타일 */
.apv-btn-link {
  background: none;
  border: none;
  padding: 0;
  color: #1a73e8;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}

/* 버튼 오버라이드 */
.apv-btn-sm {
  padding: 3px 6px;
  font-size: 11px;
  line-height: 1.5;
}
.apv-btn-info {
  background-color: #17a2b8;
  color: white;
}
.apv-btn-success {
  background-color: #28a745;
  color: white;
}
.apv-btn-danger {
  background-color: #dc3545;
  color: white;
}

/* 상태 색상 클래스 정의 */
.apv-state-BA1 {
  /* 검토중 (노란색 계열) */
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}
.apv-state-BA2 {
  /* 승인완료 (초록색 계열) */
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.apv-state-BA3 {
  /* 미검토 (빨간색 계열) */
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* ---------------------------------------------------- */
/* 페이지네이션 스타일 */
/* ---------------------------------------------------- */
.pagination-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-top: 20px;
  padding: 0 10px;
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
  background-color: #5e72e4;
  color: white;
  border-color: #5e72e4;
  font-weight: 700;
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
