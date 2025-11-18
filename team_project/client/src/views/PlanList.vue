<!-- src/views/PlanList.vue -->
<template>
  <section class="p-6">
    <div class="page-shell">
      <!-- 상단 타이틀 + 역할 표시 -->
      <header class="header-row mb-4">
        <div class="header-title">
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight">
            지원계획 목록
          </h2>
        </div>

        <div class="header-action">
          <span class="role-pill">
            역할: {{ roleLabel }} ({{ rawAuthCode || "-" }})
          </span>
          <span
            v-if="!currentUserId && selectedRole !== 4"
            class="role-warning"
          >
            로그인 정보를 찾을 수 없습니다.
          </span>
        </div>
      </header>

      <!-- 상태 표시 -->
      <div v-if="loading" class="text-gray-500 text-sm">불러오는 중...</div>
      <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
      <div v-else-if="!plans.length" class="empty-state">
        등록된 지원계획이 없습니다.
      </div>

      <!-- 목록 -->
      <div v-else class="table-wrapper">
        <div class="table-card">
          <table class="nice-table">
            <thead>
              <tr>
                <th class="th-cell text-center w-14">No</th>
                <th class="th-cell">작성자</th>
                <th class="th-cell">담당자</th>

                <!-- 🔥 시스템(4)일 때만 기관명 컬럼 추가 -->
                <th v-if="selectedRole === 4" class="th-cell">기관명</th>

                <th class="th-cell">조사지 제출일</th>
                <th class="th-cell">계획 작성일</th>
                <th class="th-cell text-center">상태</th>
                <th class="th-cell text-center w-28"></th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(row, idx) in paginatedPlans"
                :key="row.planCode"
                class="table-row-item"
                @click.stop="goDetail(row)"
              >
                <!-- No 컬럼 (페이징 반영) -->
                <td class="td-cell text-center">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </td>

                <td class="td-cell">
                  {{ row.writerName || "-" }}
                </td>

                <td class="td-cell">
                  {{ row.assiName || "-" }}
                </td>

                <!-- 🔥 시스템(4)일 때만 기관명 노출 -->
                <td v-if="selectedRole === 4" class="td-cell">
                  {{ row.orgName || "-" }}
                </td>

                <td class="td-cell">
                  {{ formatDate(row.submitAt) }}
                </td>

                <td class="td-cell">
                  {{ formatDate(row.writtenAt) }}
                </td>

                <!-- 상태 배지 -->
                <td class="td-cell text-center td-status">
                  <button
                    v-if="
                      normStatus(row.status) === 'CC7' && selectedRole !== 1
                    "
                    type="button"
                    class="status-pill status-pill--rejected status-pill--clickable"
                    @click.stop="openRejectReason(row)"
                  >
                    {{ statusLabel(row.status) }}
                  </button>
                  <span
                    v-else
                    class="status-pill"
                    :class="statusPillClass(row.status)"
                  >
                    {{ statusLabel(row.status) }}
                  </span>
                </td>

                <!-- 작업 -->
                <td class="td-cell">
                  <div class="flex items-center justify-center">
                    <template v-if="isAssigneeRole">
                      <MaterialButton
                        v-if="['CC1', 'CC2'].includes(normStatus(row.status))"
                        color="dark"
                        size="sm"
                        @click.stop="handleWrite(row)"
                      >
                        작성하기
                      </MaterialButton>
                      <MaterialButton
                        v-else-if="normStatus(row.status) === 'CC3'"
                        color="dark"
                        size="sm"
                        @click.stop="handleEdit(row)"
                      >
                        수정하기
                      </MaterialButton>
                      <MaterialButton
                        v-else-if="normStatus(row.status) === 'CC7'"
                        color="dark"
                        size="sm"
                        @click.stop="handleReEdit(row)"
                      >
                        재수정하기
                      </MaterialButton>
                      <span v-else class="text-gray-400 text-xs">-</span>
                    </template>

                    <span v-else class="text-gray-400 text-xs"></span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 🔹 페이지네이션 -->
        <div v-if="totalPages > 1" class="mt-6 text-center">
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
      </div>

      <!-- 🔻 반려 사유 모달 -->
      <div v-if="rejectReasonModalOpen" class="modal-overlay">
        <div class="modal-container">
          <h3 class="text-lg font-semibold mb-3">반려 사유</h3>

          <div v-if="rejectReasonLoading" class="text-sm text-gray-500">
            불러오는 중...
          </div>

          <div v-else-if="rejectReasonError" class="text-sm text-red-600">
            {{ rejectReasonError }}
          </div>

          <!-- 반려일자 + 사유 -->
          <div v-else class="space-y-2">
            <p class="text-sm text-gray-600">
              반려일자:
              <span class="font-medium">
                {{ formatDate(rejectReasonDate) }}
              </span>
            </p>

            <div
              class="text-sm whitespace-pre-line text-gray-800 max-h-60 overflow-y-auto border rounded px-3 py-2 bg-gray-50"
            >
              {{ rejectReasonText || "등록된 반려 사유가 없습니다." }}
            </div>
          </div>

          <div class="modal-actions mt-4 flex justify-end gap-2">
            <MaterialButton
              color="dark"
              size="sm"
              @click="closeRejectReasonModal"
            >
              닫기
            </MaterialButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import MaterialButton from "@/components/MaterialButton.vue";
import MaterialPagination from "@/components/MaterialPagination.vue";
import MaterialPaginationItem from "@/components/MaterialPaginationItem.vue";

const router = useRouter();

const currentUserId = ref(null);
const rawAuthCode = ref(""); // AA1~AA4
const selectedRole = ref(1); // 1~4 숫자 역할

function mapAuthToRole(code) {
  switch (code) {
    case "AA1":
      return 1; // 일반
    case "AA2":
      return 2; // 담당자
    case "AA3":
      return 3; // 관리자
    case "AA4":
      return 4; // 시스템
    default:
      return 1;
  }
}

const roleLabel = computed(() => {
  switch (selectedRole.value) {
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

// 담당자 역할 여부
const isAssigneeRole = computed(() => Number(selectedRole.value) === 2);

const plans = ref([]);
const loading = ref(false);
const error = ref("");

const formatDate = (v) => {
  if (!v) return "-";
  return String(v).slice(0, 10);
};

function normStatus(raw) {
  return (raw ?? "").toString().trim().toUpperCase();
}

function statusLabel(code) {
  switch (normStatus(code)) {
    case "CC1":
    case "CC2":
      return "작성전";
    case "CC3":
      return "검토중";
    case "CC4":
      return "진행중";
    case "CC5":
      return "지원완료";
    case "CC6":
      return "재승인요청";
    case "CC7":
      return "반려";
    default:
      return code || "-";
  }
}

function statusPillClass(code) {
  switch (normStatus(code)) {
    case "CC1":
    case "CC2":
      return "status-pill--before";
    case "CC3":
    case "CC4":
      return "status-pill--review";
    case "CC5":
      return "status-pill--done";
    case "CC6":
      return "status-pill--resubmit";
    default:
      return "status-pill--default";
  }
}

//페이징
const currentPage = ref(1);
const pageSize = 10;

const totalPages = computed(() =>
  Math.max(1, Math.ceil(plans.value.length / pageSize) || 1)
);

const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return plans.value.slice(start, start + pageSize);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

const loadList = async () => {
  loading.value = true;
  error.value = "";
  try {
    const params = {
      role: selectedRole.value,
      userId: currentUserId.value,
    };
    const { data } = await axios.get("/api/plans", { params });
    plans.value = Array.isArray(data?.result) ? data.result : [];
    currentPage.value = 1; // 조회할 때 첫 페이지로
  } catch (e) {
    console.error(e);
    error.value = e.message || "지원계획 목록 조회 중 오류";
    plans.value = [];
  } finally {
    loading.value = false;
  }
};

const handleWrite = (row) => {
  router.push({
    name: "plan-write",
    params: { submitcode: row.submitCode },
  });
};

const handleEdit = (row) => {
  router.push({
    name: "plan-edit",
    params: { planCode: row.planCode },
    query: { submitCode: row.submitCode },
  });
};

const handleReEdit = (row) => {
  router.push({
    name: "plan-edit",
    params: { planCode: row.planCode },
    query: { submitCode: row.submitCode },
  });
};

function goDetail(row) {
  router.push({
    name: "planDetail",
    params: { planCode: row.planCode },
    query: { submitCode: row.submitCode, role: selectedRole.value },
  });
}

//반려 모달
const rejectReasonModalOpen = ref(false);
const rejectReasonText = ref("");
const rejectReasonLoading = ref(false);
const rejectReasonError = ref("");
const rejectReasonDate = ref("");

async function openRejectReason(row) {
  rejectReasonModalOpen.value = true;
  rejectReasonText.value = "";
  rejectReasonError.value = "";
  rejectReasonLoading.value = true;
  rejectReasonDate.value = "";

  try {
    const { data } = await axios.get(
      `/api/plans/${row.planCode}/rejection-reason`
    );

    if (data?.success === false) {
      throw new Error(data.message || "반려 사유를 불러오지 못했습니다.");
    }

    rejectReasonText.value =
      data?.result?.rejection_reason ?? data?.rejection_reason ?? "";
    rejectReasonDate.value =
      data?.result?.rejection_date ?? data?.rejection_date ?? "";
  } catch (e) {
    console.error(e);
    rejectReasonError.value =
      e.response?.data?.message || e.message || "반려 사유 조회 중 오류";
  } finally {
    rejectReasonLoading.value = false;
  }
}

function closeRejectReasonModal() {
  rejectReasonModalOpen.value = false;
}

onMounted(() => {
  try {
    const stored = localStorage.getItem("user");

    if (stored) {
      const u = JSON.parse(stored);

      const userCode = u.user_code ?? null;
      const auth = u.role ?? "AA1";

      currentUserId.value = userCode ? Number(userCode) : null;
      rawAuthCode.value = String(auth).toUpperCase();
      selectedRole.value = mapAuthToRole(rawAuthCode.value);
    } else {
      currentUserId.value = null;
      rawAuthCode.value = "AA1";
      selectedRole.value = mapAuthToRole("AA1");
    }
  } catch (e) {
    console.error("localStorage user 파싱 오류:", e);
    currentUserId.value = null;
    rawAuthCode.value = "AA1";
    selectedRole.value = mapAuthToRole("AA1");
  }

  loadList();
});
</script>

<style scoped>
section {
  color: #111827;
}

/* 페이지 폭 통일 */
.page-shell {
  max-width: 960px;
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

.header-title {
  flex: 1 1 auto;
  min-width: 0;
}

.header-action {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  white-space: nowrap;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  background-color: #f3f4f6;
  color: #4b5563;
}

.role-warning {
  font-size: 0.7rem;
  color: #b91c1c;
}

/* 비었을 때 */
.empty-state {
  margin-top: 1.5rem;
  text-align: center;
  padding: 2.5rem 1rem;
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
  background-color: #f9fafb;
  font-size: 0.9rem;
  color: #6b7280;
}

/* 상담 목록 래퍼 */
.table-wrapper {
  margin-top: 0.5rem;
}

/* 카드 컨테이너 */
.table-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  width: 100%;
}

/* 테이블 */
.nice-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

/* 헤더 셀 */
.th-cell {
  padding: 0.75rem 0.9rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

/* 바디 셀 */
.td-cell {
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
}

/* 행 스타일 */
.table-row-item {
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
  cursor: pointer;
}

.table-row-item:nth-child(odd) {
  background-color: #ffffff;
}
.table-row-item:nth-child(even) {
  background-color: #f9fafb;
}

.table-row-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

/* 상태 배지 공통 */
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid transparent;
}

/* 상태별 톤 (무채색 계열) */
.status-pill--before {
  background-color: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}

.status-pill--review {
  background-color: #e5e7eb;
  color: #111827;
  border-color: #d1d5db;
}

.status-pill--done {
  background-color: #111827;
  color: #f9fafb;
  border-color: #111827;
}

.status-pill--resubmit {
  background-color: #fefce8;
  color: #854d0e;
  border-color: #fef3c7;
}

.status-pill--rejected {
  background-color: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.status-pill--default {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #e5e7eb;
}

/* 클릭 가능한 배지 (반려) */
.status-pill--clickable {
  cursor: pointer;
  transition:
    transform 0.1s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.status-pill--clickable:hover {
  transform: translateY(-0.5px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.16);
}

/* 작은 칩 버튼 (작업 버튼) */
.chip-button {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  font-size: 0.75rem;
  color: #4b5563;
  cursor: pointer;
  white-space: nowrap;
}

.chip-button:hover {
  background-color: #e5e7eb;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-container {
  background: #ffffff;
  border-radius: 0.9rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.4);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 페이지네이션 */
.pagination {
  display: inline-flex;
}

.td-status {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap; /* 줄바꿈 허용하고 싶으면 이 줄 지워도 돼 */
}
</style>
