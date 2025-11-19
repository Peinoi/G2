<template>
  <section class="p-6 max-w-6xl mx-auto">
    <!-- 🔥 상단 래퍼: 헤더를 한 줄로 예쁘게 -->
    <div class="page-inner">
      <!-- 헤더 -->
      <header class="mb-2 header-row">
        <div class="header-title">
          <h2
            class="page-title text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap align-middle"
          >
            조사지 제출 목록
          </h2>
        </div>

        <!-- 🔹 로그인 정보 / 역할 표시 (읽기 전용) -->
        <div class="header-meta">
          <span class="role-pill"> 권한: {{ roleLabel }} ({{ role }}) </span>
        </div>
      </header>

      <!-- 액션 버튼 영역 -->
      <div class="mb-3 flex justify-between items-center action-row">
        <div class="flex items-center gap-2">
          <!-- 🔹 일반 사용자(ROLE=1)만 노출: 조사지 작성하기 -->
          <MaterialButton
            v-if="role === 1"
            color="dark"
            size="sm"
            @click="$router.push('/survey/write')"
          >
            조사지 작성하기
          </MaterialButton>
        </div>
      </div>

      <!-- 🔍 검색 / 필터 / 정렬 라인 -->
      <div class="filter-row" v-if="role !== 1">
        <form class="filter-form" @submit.prevent="onSearch">
          <!-- 검색 인풋 -->
          <div class="filter-field filter-field--search">
            <input
              v-model="searchText"
              type="text"
              class="search-input"
              :placeholder="searchPlaceholder"
            />
          </div>

          <!-- 상태 셀렉트 -->
          <div class="filter-field filter-field--select select-wrapper">
            <select v-model="statusFilter" class="select-input">
              <option value="ALL">전체 상태</option>
              <option value="CA1">미검토</option>
              <option value="CA3">검토완료</option>
            </select>
          </div>

          <!-- 정렬 셀렉트 -->
          <div class="filter-field filter-field--select select-wrapper">
            <select v-model="sortOption" class="select-input">
              <option value="RECENT">최신순</option>
              <option value="OLD">오래된순</option>
              <option value="NAME">이름순</option>
            </select>
          </div>

          <!-- 검색 버튼 -->
          <div class="filter-field filter-field--button">
            <MaterialButton type="submit" color="dark" size="sm">
              검색
            </MaterialButton>
          </div>
        </form>
      </div>

      <!-- 상태 표시 -->
      <div v-if="loading" class="text-gray-500">불러오는 중...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>

      <!-- 담당자(2)인데 목록이 비었을 때 -->
      <div v-else-if="role === 2 && list.length === 0" class="empty-card">
        아직 배정받지 않았습니다.
      </div>

      <!-- 🔥 테이블 카드 -->
      <div v-else class="table-card">
        <table class="nice-table">
          <thead>
            <tr>
              <th class="th-cell text-center w-14">No</th>
              <th v-if="role === 4" class="th-cell">세부버전</th>
              <th class="th-cell">지원자 이름</th>
              <th class="th-cell">보호자 이름</th>
              <th class="th-cell">담당자 이름</th>
              <th v-if="role === 4" class="th-cell">기관명</th>
              <th class="th-cell text-center">제출일</th>
              <th class="th-cell text-center">상태</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, idx) in paginatedList"
              :key="row.submit_code"
              class="table-row-item"
              @click="goToDetail(row.submit_code)"
            >
              <!-- No -->
              <td class="td-cell text-center">
                {{ (currentPage - 1) * pageSize + idx + 1 }}
              </td>

              <!-- 시스템(4)일 때만 세부버전 -->
              <td v-if="role === 4" class="td-cell text-left mono">
                {{ row.version_detail_no }}
              </td>

              <!-- 지원자 이름 -->
              <td class="td-cell text-left">
                {{ row.child_name || "본인" }}
              </td>

              <!-- 보호자 이름 -->
              <td class="td-cell text-left">
                {{ row.writer_name || row.written_by }}
              </td>

              <!-- 담당자 이름 -->
              <td class="td-cell text-left">
                {{ row.assignee_name || row.assi_by || "-" }}
              </td>

              <!-- 시스템(4)일 때만 기관명 -->
              <td v-if="role === 4" class="td-cell text-left">
                {{ row.org_name || row.institution_name || "-" }}
              </td>

              <!-- 제출일 -->
              <td class="td-cell text-center">
                {{ fmt(row.submit_at) }}
              </td>

              <!-- 상태 -->
              <td class="td-cell text-center td-status">
                <span class="status-pill" :class="statusClass(row.status)">
                  {{ statusLabel(row.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 🔹 페이지네이션 -->
      <div v-if="!loading && !error && totalPages > 1" class="mt-6 text-center">
        <MaterialPagination color="dark" size="md" class="pagination">
          <MaterialPaginationItem
            prev
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          />
          <MaterialPaginationItem
            v-for="page in totalPages"
            :key="page"
            :label="String(page)"
            :active="page === currentPage"
            @click="changePage(page)"
          />
          <MaterialPaginationItem
            next
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          />
        </MaterialPagination>
      </div>

      <!-- 비었을 때 (담당자 제외) -->
      <div
        v-if="!loading && !error && list.length === 0 && role !== 2"
        class="empty-state"
      >
        조회된 제출본이 없습니다.
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";
import MaterialPagination from "@/components/MaterialPagination.vue";
import MaterialPaginationItem from "@/components/MaterialPaginationItem.vue";

const router = useRouter();

const role = ref(1);

/**
 * 🔹 userId: 로그인한 유저의 user_code
 */
const userId = ref(null);

/**
 * 🔹 rawAuthCode: localStorage에 저장된 권한 코드(AA1~AA4)
 */
const rawAuthCode = ref("AA1");

const list = ref([]);
const loading = ref(false);
const error = ref("");

// 🔍 검색 / 필터 / 정렬 상태
const searchText = ref(""); // 입력창에 보이는 값
const appliedSearch = ref(""); // 실제로 필터에 사용하는 값
const statusFilter = ref("ALL"); // ALL | CA1 | CA3
const sortOption = ref("RECENT"); // RECENT | OLD | NAME

const searchPlaceholder = computed(() => {
  if (role.value === 4) {
    return "지원자, 보호자, 담당자, 기관명 검색";
  }
  return "지원자, 보호자, 담당자 검색";
});

// 🔹 페이징 상태
const currentPage = ref(1);
const pageSize = 10;

// 🔍 검색 / 상태필터 / 정렬 적용된 리스트
const filteredList = computed(() => {
  let rows = [...list.value];

  // 1) 검색 (버튼/엔터 눌렀을 때만 적용되는 appliedSearch 사용)
  const q = appliedSearch.value;
  if (q) {
    rows = rows.filter((row) => {
      // 공통: 지원자 / 보호자 / 담당자
      const baseTargets = [
        row.child_name, // 지원자 이름
        row.writer_name, // 보호자 이름
        row.assignee_name, // 담당자 이름
      ];

      // 시스템 권한(role 4)일 때만 기관명 추가
      const extraTargets =
        role.value === 4
          ? [row.org_name, row.institution_name] // 기관명 컬럼들
          : [];

      const targets = [...baseTargets, ...extraTargets];

      return targets.some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }

  // 2) 상태 필터
  if (statusFilter.value !== "ALL") {
    rows = rows.filter((row) => row.status === statusFilter.value);
  }

  // 3) 정렬
  if (sortOption.value === "RECENT") {
    // 최신 제출일 순 (submit_at DESC)
    rows.sort((a, b) => new Date(b.submit_at) - new Date(a.submit_at));
  } else if (sortOption.value === "OLD") {
    // 오래된 제출일 순 (submit_at ASC)
    rows.sort((a, b) => new Date(a.submit_at) - new Date(b.submit_at));
  } else if (sortOption.value === "NAME") {
    // 지원자 이름 가나다순 (없으면 "본인" 기준)
    rows.sort((a, b) => {
      const an = a.child_name || "본인";
      const bn = b.child_name || "본인";
      return an.localeCompare(bn, "ko");
    });
  }

  return rows;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredList.value.length / pageSize) || 1)
);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredList.value.slice(start, start + pageSize);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

function onSearch() {
  // 🔥 이때만 실제 검색어 적용
  appliedSearch.value = searchText.value.trim().toLowerCase();
  currentPage.value = 1;
}

/** AA 코드 → 숫자 역할 매핑 */
function mapAuthToRole(code) {
  switch (code) {
    case "AA1":
      return 1;
    case "AA2":
      return 2;
    case "AA3":
      return 3;
    case "AA4":
      return 4;
    default:
      return 1;
  }
}

/** 숫자 역할 → 라벨 텍스트 */
const roleLabel = computed(() => {
  switch (role.value) {
    case 1:
      return "일반 이용자";
    case 2:
      return "담당자";
    case 3:
      return "관리자";
    case 4:
      return "시스템";
    default:
      return "알 수 없음";
  }
});

/** 목록 조회 */
async function fetchList() {
  loading.value = true;
  error.value = "";

  try {
    // 일반 사용자(1)는 반드시 userId 필요
    if (role.value === 1 && !userId.value) {
      throw new Error("로그인 정보를 찾을 수 없습니다. (user_code 없음)");
    }

    const { data } = await axios.get("/api/survey/submissions", {
      params: { role: role.value, userId: userId.value },
    });

    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.result)
      ? data.result
      : [];

    list.value = rows;
    currentPage.value = 1; // 새로 조회할 때 첫 페이지로
  } catch (e) {
    error.value =
      e?.response?.data?.message || e.message || "목록을 불러오지 못했습니다.";
    list.value = [];
  } finally {
    loading.value = false;
  }
}

/** 날짜 포맷 */
function fmt(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toISOString().slice(0, 10);
}

/** 상태 라벨 */
function statusLabel(code) {
  switch (code) {
    case "CA1":
      return "미검토";
    case "CA3":
      return "검토완료";
    default:
      return code || "-";
  }
}

function statusClass(code) {
  switch (code) {
    case "CA1": // 미검토
      return "status-pending";
    case "CA3": // 검토완료
      return "status-done";
    default:
      return "status-default";
  }
}

/** 상세 페이지 이동 */
function goToDetail(submitCode) {
  router.push({
    path: `/survey/submission/${submitCode}`,
    query: { role: role.value, userId: userId.value },
  });
}

/** 🔹 마운트 시 localStorage에서 로그인 정보 읽기 */
onMounted(() => {
  try {
    const stored = localStorage.getItem("user");

    if (stored) {
      const u = JSON.parse(stored);

      const userCode = u.user_code ?? u.userCode ?? u.id;
      const auth = u.auth_code ?? u.authCode ?? u.role_code ?? u.role ?? "AA1";

      userId.value = userCode ? Number(userCode) : null;
      rawAuthCode.value = auth;
      role.value = mapAuthToRole(String(auth).toUpperCase());
    } else {
      userId.value = null;
      rawAuthCode.value = "AA1";
      role.value = 1;
    }
  } catch (e) {
    console.error("localStorage 파싱 오류:", e);
    userId.value = null;
    rawAuthCode.value = "AA1";
    role.value = 1;
  }

  fetchList();
});
</script>

<style scoped>
section {
  color: #111827;
}

/* 안쪽 래퍼: 전체 폭 제한 + 살짝 간격 */
.page-inner {
  max-width: 72rem; /* 1152px 정도 */
  margin: 0 auto;
}

/* 헤더 한 줄 유지 */
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 1rem;
}

/* 제목 쪽: 필요하면 줄 잘리게 */
.header-title {
  flex: 1 1 auto;
  min-width: 0;
}

.page-title {
  letter-spacing: -0.02em;
}

/* 오른쪽 역할 정보 */
.header-meta {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* 역할 pill */
.role-pill {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f3f4f6;
  font-size: 0.8rem;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.role-sub {
  margin-top: 2px;
  font-size: 0.72rem;
  color: #9ca3af;
}

/* 액션 라인 */
.action-row {
  margin-top: 0.25rem;
}

/* 담당자 empty 카드 */
.empty-card {
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
  background-color: #f9fafb;
  padding: 1.75rem 1.25rem;
  color: #4b5563;
  font-size: 0.9rem;
}

/* 공통 테이블 카드 */
.table-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  margin-top: 0.5rem;
}

/* 테이블 기본 */
.nice-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

/* 헤더 셀 */
.th-cell {
  padding: 0.7rem 0.9rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

/* 바디 셀 */
.td-cell {
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  font-size: 0.9rem;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-cell.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.82rem;
  color: #4b5563;
}

/* 행 스타일 */
.table-row-item {
  transition:
    background-color 0.12s ease,
    box-shadow 0.15s ease,
    transform 0.08s ease;
  cursor: pointer;
}

/* 줄무늬 느낌 (묽게) */
.table-row-item:nth-child(odd) {
  background-color: #ffffff;
}
.table-row-item:nth-child(even) {
  background-color: #f9fafb;
}

/* hover 효과 */
.table-row-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

/* 상태 뱃지 */
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.2rem;
  padding: 0.12rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
  border: 1px solid transparent;
}

/* 미검토 */
.status-pending {
  background-color: #fef9c3;
  border-color: #facc15;
  color: #854d0e;
}

/* 검토완료 */
.status-done {
  background-color: #111827;
  border-color: #111827;
  color: #f9fafb;
}

/* 기타 */
.status-default {
  background-color: #e5e7eb;
  border-color: #d1d5db;
  color: #4b5563;
}

/* 공통 폰트 정리 (헤더/바디 같이) */
table th,
table td {
  font-family:
    "Noto Sans KR",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

/* 비었을 때 (담당자 제외) */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

/* 페이지네이션 */
.pagination {
  display: inline-flex;
}

.td-status {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

/* 🔍 필터 라인 */
.filter-row {
  margin-bottom: 0.75rem;
  margin-top: 0.25rem;
  width: 100%;
}

.filter-form {
  display: flex;
  flex-wrap: wrap; /* 화면 좁으면 자동 줄바꿈 */
  gap: 0.5rem;
  align-items: stretch;
  width: 100%;
}

/* 공통 필드 래퍼 */
.filter-field {
  display: flex;
}

/* 🔹 검색 인풋은 가능한 한 넓게 차지 */
.filter-field--search {
  flex: 1 1 260px; /* 남는 공간 다 먹고, 최소 260px */
  min-width: 0; /* 줄여질 때 깨지지 않게 */
}

/* 🔹 셀렉트들은 내용 크기만큼 */
.filter-field--select {
  flex: 0 0 auto;
}

/* 🔹 버튼도 내용 크기만큼 */
.filter-field--button {
  flex: 0 0 auto;
}

/* 검색 인풋 (pill 스타일) */
.search-input {
  width: 100%;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.45rem 0.9rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  outline: none;
}

.search-input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.16);
}

/* 셀렉트 wrapper */
.select-wrapper {
  position: relative;
  display: inline-block;
  min-width: 120px;
}

/* 셀렉트 인풋 (pill) */
.select-input {
  width: 100%;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.45rem 1.1rem 0.45rem 0.8rem;
  font-size: 0.8rem;
  background-color: #ffffff;
  outline: none;
  color: #374151;
}

.select-input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.16);
}
</style>
