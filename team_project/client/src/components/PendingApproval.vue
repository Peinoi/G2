<template>
  <div class="apv-page">
    <h3 class="fw-bold text-start text-dark mb-4">담당자 배정 목록</h3>

    <div class="apv-toolbar">
      <div class="apv-filters">
        <select v-model="stateInput" class="apv-select">
          <option value="">단계</option>
          <option value="미검토">미검토</option>
          <option value="검토완료">검토완료</option>
        </select>

        <input
          v-model.trim="searchChildInput"
          class="apv-input"
          placeholder="신청자명"
          @keyup.enter="searchList"
        />

        <input
          v-model.trim="searchManagerInput"
          class="apv-input"
          placeholder="담당자명"
          @keyup.enter="searchList"
        />
      </div>
      <button class="apv-btn apv-btn-outline" @click="searchList">조회</button>
    </div>

    <div class="apv-table-wrap">
      <table class="apv-table">
        <thead>
          <tr>
            <th
              style="
                width: 50px;
                min-width: 50px;
                max-width: 50px;
                overflow: hidden;
              "
            >
              순번
            </th>
            <th
              style="
                width: 120px;
                min-width: 120px;
                max-width: 120px;
                overflow: hidden;
              "
            >
              이름
            </th>
            <th
              style="
                width: 120px;
                min-width: 120px;
                max-width: 120px;
                overflow: hidden;
              "
            >
              신청일
            </th>
            <th
              style="
                width: 120px;
                min-width: 120px;
                max-width: 120px;
                overflow: hidden;
              "
            >
              담당자
            </th>

            <th style="width: 200px">단계</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in list" :key="item.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ item.childName }}</td>
            <td>{{ item.submitAt }}</td>
            <td>{{ item.managerName }}</td>
            <td class="apv-actions-cell">
              {{ item.status }}

              <div class="status-change-btns">
                <span
                  v-if="item.status === '검토완료'"
                  class="apv-disabled-text"
                >
                  변경불가
                </span>
                <div v-else>
                  <template v-for="key in allStatusKeys" :key="key">
                    <button
                      v-if="item.status !== key"
                      :class="[
                        'apv-btn',
                        'apv-btn-sm',
                        { 'apv-btn-success': key == '검토완료' },
                      ]"
                      @click="changeStatus(item, key)"
                    >
                      {{ key == '미검토' ? '미검토' : key }}
                    </button>
                  </template>
                </div>
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
import {
  getPendingList,
  changeStatus as changeStatusApi,
} from '../api/pending';

export default {
  name: 'PendingApproval',
  data() {
    return {
      // Input 필드에 바인딩되는 값 (데이터만 변경, computed에 영향 X)
      stateInput: '',
      searchChildInput: '',
      searchManagerInput: '',

      // 실제 필터링에 사용되는 값 (fetchList에서만 변경)
      stateActive: '',
      applicantKeywordActive: '',
      managerKeywordActive: '',

      // 페이징 관련 상태
      pageSize: 10,
      currentPage: 1,

      listRaw: [],

      statusMap: {
        검토완료: { label: '승인완료', class: 'apv-state-CA3' },
      },
      allStatusKeys: ['검토완료'],
    };
  },
  computed: {
    filteredList() {
      return this.listRaw.filter((item) => {
        // Active 값 변경 -> 필터링 재실행
        const stateMatch =
          !this.stateActive || item.status === this.stateActive;
        const applicantMatch =
          !this.applicantKeywordActive ||
          item.childName.includes(this.applicantKeywordActive.trim());
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
    // 조회
    async fetchList() {
      // input -> Active -> computed
      this.stateActive = this.stateInput;
      this.applicantKeywordActive = this.searchChildInput;
      this.managerKeywordActive = this.searchManagerInput;

      const result = await getPendingList();

      this.listRaw = result.map((item) => ({
        submit_code: item.submit_code,
        childName: item.child_name,
        submitAt: item.submit_at?.split(' ')[0],
        managerName: item.manager_name,
        status: this.changeCode('load', item.status),
      }));
      // 검색 후 1페이지로 이동
      this.currentPage = 1;
    },

    // 검색
    searchList() {
      // input → Active로 복사
      this.stateActive = this.stateInput;
      this.applicantKeywordActive = this.searchChildInput;
      this.managerKeywordActive = this.searchManagerInput;

      // 검색할 때마다 다시 1페이지부터
      this.currentPage = 1;
    },

    // 상태값 코드 <-> 텍스트 변경 함수
    changeCode(type, code) {
      if (type == 'change') {
        const result = code == '미검토' ? 'CA1' : 'CA3';
        return result;
      }
      const result = code == 'CA1' ? '미검토' : '검토완료';
      return result;
    },

    // 상태값
    async changeStatus(item, key) {
      const status = key == '미검토' ? '미검토' : key;
      if (
        !confirm(`${item.childName}님의 상태를 [${status}]로 변경하시겠습니까?`)
      ) {
        return;
      }
      item.status = key;
      const res = {
        submit_code: item.submit_code,
        status: this.changeCode('change', item.status),
      };

      const result = await changeStatusApi(res);
      if (!result.ok) {
        alert('변경 실패');
        return;
      }
      this.fetchList();
      alert('변경 완료');
    },

    setPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
  },

  mounted() {
    this.fetchList();
  },
};
</script>

<style scoped>
.apv-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕',
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.apv-title {
  display: none !important;
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
  background: #ffffff;
  border: 1px solid #dcdcdc;
  padding: 8px 15px;
  height: 38px;
  line-height: 20px;
  color: #495057;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.apv-btn-outline:hover {
  background: #f0f0f0;
  border-color: #c0c0c0;
  color: #333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.apv-table-wrap {
  overflow-x: auto;
  min-height: 560px;
}

.apv-table {
  table-layout: fixed;
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

.apv-table td:last-child,
.apv-table th:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 단계 셀 정렬 및 버튼 스타일 */
.apv-actions-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
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
.apv-state-CA1 {
  /* 미검토 (빨간색 계열) */
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.apv-state-CA1 {
  /* 승인완료 (초록색 계열) */
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.apv-disabled-text {
  font-size: 12px;
  color: #999;
  padding: 3px 6px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f5f5f5;
}

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
