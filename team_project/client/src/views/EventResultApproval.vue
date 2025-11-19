<!-- src/views/EventResultApproval.vue -->
<template>
  <div class="priority-page">
    <h2 class="priority-title">이벤트 결과 승인 요청 목록</h2>

    <!-- 검색 / 상태 / 정렬 -->
    <div class="priority-filters">
      <input
        v-model="keyword"
        class="priority-input"
        :placeholder="searchPlaceholder"
        @keyup.enter="searchList"
      />

      <select v-model="state" class="priority-select" @change="searchList">
        <option value="">전체</option>
        <option value="BA1">요청</option>
        <option value="BA2">승인</option>
        <option value="BA3">반려</option>
      </select>

      <select v-model="orderBy" class="priority-select" @change="searchList">
        <option value="latest">최신순</option>
        <option value="oldest">오래된순</option>
        <option value="name">이벤트명순</option>
      </select>
    </div>

    <div class="priority-card">
      <!-- 로딩 표시 -->
      <div v-if="loading" class="priority-loading">불러오는 중...</div>

      <!-- 목록 테이블 -->
      <table v-else class="priority-table">
        <thead>
          <tr>
            <th>승인코드</th>
            <th>이벤트명</th>
            <th>담당자</th>
            <!-- 기관 컬럼: 기관 관리자(AA3) 에서는 숨김, 시스템 관리자(AA4)만 표시 -->
            <th v-if="isOrgVisible">기관</th>
            <th>작성일</th>
            <th>모집인원</th>
            <th>모집기간</th>
            <th>시행기간</th>
            <th>상태</th>
            <th>처리일</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.approval_code"
            @click="goDetail(item)"
            class="priority-row"
          >
            <td>{{ item.approval_code }}</td>
            <td>{{ item.event_name }}</td>
            <td>{{ item.manager_name }}</td>
            <td v-if="isOrgVisible">{{ item.org_name }}</td>

            <!-- 작성일: SQL에서 er.report_register_date AS written_at -->
            <td>
              {{
                formatDate(
                  item.written_at ||
                    item.report_register_date ||
                    item.create_date
                )
              }}
            </td>

            <td>{{ item.max_participants }}</td>

            <!-- 모집기간 -->
            <td>
              {{
                formatDateRange(item.recruit_start_date, item.recruit_end_date)
              }}
            </td>

            <!-- 시행기간 -->
            <td>
              {{ formatDateRange(item.event_start_date, item.event_end_date) }}
            </td>

            <td>
              <span class="priority-badge" :class="stateBadgeClass(item.state)">
                {{ codeLabel(item.state) }}
              </span>
            </td>

            <!-- 처리일: 요청(BA1) 이거나 날짜 없으면 '-' -->
            <td>
              {{
                item.state === "BA1" || !item.approval_date
                  ? "-"
                  : formatDate(item.approval_date)
              }}
            </td>
          </tr>

          <tr v-if="list.length === 0">
            <!-- 기관 컬럼 여부에 따라 colspan 조정 -->
            <td class="priority-empty" :colspan="isOrgVisible ? 10 : 9">
              데이터가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 페이징 -->
      <div v-if="!loading && totalPages > 1" class="priority-pagination">
        <button
          class="priority-page-btn"
          :disabled="page === 1"
          @click="changePage(page - 1)"
        >
          이전
        </button>

        <span class="priority-page-info">
          {{ page }} / {{ totalPages }} (총 {{ totalCount }}건)
        </span>

        <button
          class="priority-page-btn"
          :disabled="page === totalPages"
          @click="changePage(page + 1)"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/authLogin.js";

const router = useRouter();
const auth = useAuthStore();

const list = ref([]);

// 페이지 관련 상태
const page = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const loading = ref(false);

// 전체 페이지 수 계산
const totalPages = computed(() =>
  totalCount.value > 0 ? Math.ceil(totalCount.value / pageSize.value) : 1
);

// 검색어, 상태, 정렬
const keyword = ref("");
const state = ref("");
const orderBy = ref("latest");

// ===== 권한 / 로그인 정보 =====

// 유저 역할 코드 (AA3 / AA4 등)
const userRole = computed(() => {
  return auth.role || (auth.user && auth.user.roleCode) || "";
});

// 로그인 아이디 (기관 필터 기준)
const loginId = computed(() => {
  return (
    auth.userId ||
    auth.loginId ||
    auth.id ||
    (auth.user && auth.user.userId) ||
    ""
  );
});

// 기관 관리자 여부 (AA3)
const isOrgManager = computed(() => userRole.value === "AA3");

// 시스템 관리자 여부 (AA4)
const isSystemAdmin = computed(() => userRole.value === "AA4");

// 이 페이지 접근 가능 여부 (AA3 또는 AA4)
const canViewEventResultPage = computed(
  () => isOrgManager.value || isSystemAdmin.value
);

// 기관 컬럼 표시 여부: 기관 관리자면 숨김, 시스템 관리자만 표시
const isOrgVisible = computed(() => !isOrgManager.value);

// 상세 화면 role 값 (AA3 → 3, AA4 → 4)
const detailRole = computed(() => (isSystemAdmin.value ? 4 : 3));

// 검색 placeholder (기관 관리자면 '기관' 문구 제거)
const searchPlaceholder = computed(() =>
  isSystemAdmin.value ? "이벤트명/담당자/기관 검색" : "이벤트명/담당자 검색"
);

// ===== 공통코드 / 포맷터 =====

const CODE_LABEL_MAP = {
  BA1: "요청",
  BA2: "승인",
  BA3: "반려",
};

function searchList() {
  page.value = 1;
  loadList();
}

function codeLabel(code) {
  if (!code) return "";
  return CODE_LABEL_MAP[code] || code;
}

function stateBadgeClass(s) {
  switch (s) {
    case "BA1":
      return "priority-badge-request";
    case "BA2":
      return "priority-badge-approve";
    case "BA3":
      return "priority-badge-reject";
    default:
      return "priority-badge-default";
  }
}

function formatDate(value) {
  if (!value) return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function formatDateRange(start, end) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (!s && !e) return "";
  if (s && !e) return s;
  if (!s && e) return e;
  return `${s} ~ ${e}`;
}

// ===== API 호출 =====

// 이벤트 결과 승인 목록 호출
async function loadList() {
  loading.value = true;
  try {
    const res = await axios.get("/api/approvals/event-result", {
      params: {
        page: page.value,
        size: pageSize.value,
        keyword: keyword.value,
        state: state.value,
        orderBy: orderBy.value,
        loginId: loginId.value, // 기관 필터용
        role: userRole.value, // 'AA3' / 'AA4'
      },
    });

    const payload = res.data?.data || {};
    const rows = Array.isArray(payload.rows) ? payload.rows : [];

    list.value = rows;
    totalCount.value = payload.totalCount ?? 0;
  } catch (err) {
    console.error("[EventResultApproval] loadList error:", err);
    list.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
}

// 페이지 변경
function changePage(nextPage) {
  if (nextPage < 1) return;
  if (nextPage > totalPages.value) return;
  if (nextPage === page.value) return;

  page.value = nextPage;
  loadList();
}

// 각 행 클릭 시 이벤트 결과 상세로 이동
function goDetail(item) {
  router.push({
    name: "event-result-detail",
    params: {
      resultCode: item.result_code, // SQL alias 와 맞춤
    },
    query: {
      role: detailRole.value, // AA3 -> 3, AA4 -> 4
    },
  });
}

// 처음 진입 시 권한 체크 + 목록 로딩
onMounted(() => {
  auth.reload?.();

  if (!auth.isLogin) {
    alert("로그인이 필요합니다.");
    router.push({ name: "SignIn" });
    return;
  }

  if (!canViewEventResultPage.value) {
    alert("기관 관리자 및 시스템 관리자만 접근할 수 있습니다.");
    router.push("/");
    return;
  }

  loadList();
});
</script>

<style scoped>
/* EventPlanApproval.vue 과 동일 스타일 유지 */
.priority-page {
  max-width: 1100px;
  margin: 24px auto 40px;
  padding: 0 16px;
}

.priority-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111827;
}

.priority-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  padding: 12px 16px;
}

.priority-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.priority-table thead th {
  text-align: left;
  padding: 10px 8px;
  font-weight: 600;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  white-space: nowrap;
}

.priority-table tbody td {
  padding: 9px 8px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: middle;
}

.priority-row {
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    transform 0.06s ease;
}

.priority-row:hover {
  background: #f3f4ff;
  transform: translateY(-1px);
}

.priority-empty {
  text-align: center;
  padding: 14px 0;
  color: #9ca3af;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid transparent;
}

.priority-badge-request {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #3730a3;
}

.priority-badge-approve {
  background: #ecfdf5;
  border-color: #bbf7d0;
  color: #166534;
}

.priority-badge-reject {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.priority-badge-default {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #4b5563;
}

.priority-loading {
  font-size: 13px;
  color: #6b7280;
  padding: 8px 4px;
}

/* 페이징 */
.priority-pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
}

.priority-page-btn {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
  font-size: 12px;
  transition:
    background-color 0.12s ease,
    transform 0.06s ease,
    box-shadow 0.12s ease;
}

.priority-page-btn:hover:not(:disabled) {
  background: #eef2ff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  transform: translateY(-0.5px);
}

.priority-page-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.priority-page-info {
  min-width: 120px;
  text-align: right;
}

.priority-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}

.priority-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
}

.priority-select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}
</style>
