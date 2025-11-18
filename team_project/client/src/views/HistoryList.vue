<!-- src/views/HistoryList.vue -->
<template>
  <div class="hist-page">
    <h2 class="hist-title">히스토리</h2>

    <!-- 권한 없음 -->
    <div v-if="!isSystem && !isOrgManager" class="hist-no-auth">
      <p>접근 권한이 없습니다. (시스템 관리자 / 기관 관리자 전용)</p>
    </div>

    <!-- 권한 있을 때만 -->
    <div v-else>
      <!-- 필터 영역 -->
      <div class="hist-toolbar">
        <!-- 1행: 검색조건 + 검색창 + 검색버튼 -->
        <div class="hist-filters-row">
          <!-- 검색 기준 -->
          <select
            v-model="searchField"
            class="hist-select"
            @change="onFilterChange"
          >
            <option value="all">전체</option>
            <option value="table_name">테이블명</option>
            <option value="change_item">변경 항목</option>
            <option value="modifier_name">수정자</option>
          </select>

          <!-- 검색 입력 -->
          <input
            v-model.trim="keyword"
            class="hist-input"
            placeholder="검색어 입력"
            @keyup.enter="fetchList"
          />

          <button class="hist-btn hist-btn-primary" @click="fetchList">
            검색
          </button>
        </div>

        <!-- 2행: 정렬/유형/기관 또는 담당자 -->
        <div class="hist-filters-row">
          <!-- 정렬 -->
          <select
            v-model="orderBy"
            class="hist-select"
            @change="onFilterChange"
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>

          <!-- BD 공통코드 유형 -->
          <select
            v-model="typeCode"
            class="hist-select"
            @change="onFilterChange"
          >
            <option value="">전체</option>
            <option value="BD1">조사지</option>
            <option value="BD2">상담</option>
            <option value="BD3">지원계획</option>
            <option value="BD4">지원결과</option>
            <option value="BD5">이벤트 계획</option>
            <option value="BD6">이벤트 결과</option>
            <option value="BD7">후원 계획</option>
            <option value="BD8">후원 결과</option>
          </select>

          <!-- 시스템 관리자: 기관 선택 -->
          <template v-if="isSystem">
            <select
              v-model="orgCode"
              class="hist-select"
              @change="onFilterChange"
            >
              <option value="">기관 전체</option>
              <option
                v-for="org in orgOptions"
                :key="org.org_code"
                :value="org.org_code"
              >
                {{ org.org_name }}
              </option>
            </select>
          </template>

          <!-- 기관 관리자: 담당자 선택 (user_code 기준) -->
          <template v-else-if="isOrgManager">
            <select
              v-model="managerCode"
              class="hist-select"
              @change="onFilterChange"
            >
              <option value="">담당자 전체</option>
              <option
                v-for="m in managerOptions"
                :key="m.user_code"
                :value="m.user_code"
              >
                {{ m.name }}
              </option>
            </select>
          </template>
        </div>
      </div>

      <!-- 테이블 -->
      <div class="hist-table-wrap">
        <table class="hist-table">
          <thead>
            <tr>
              <th>No</th>
              <th>수정일시</th>
              <th>유형</th>
              <th v-if="isSystem">기관</th>
              <th>수정자</th>
              <th>수정자 권한</th>
              <th>변경 항목</th>
              <th>변경 전</th>
              <th>변경 후</th>
            </tr>
          </thead>

          <tbody>
            <!-- 데이터 없을 때 -->
            <tr v-if="!loading && items.length === 0">
              <td :colspan="isSystem ? 9 : 8" class="hist-empty">
                조회된 이력이 없습니다.
              </td>
            </tr>

            <!-- 목록 행 -->
            <tr v-for="(row, idx) in items" :key="row.record_code">
              <td>{{ startIndex + idx }}</td>
              <td>{{ formatDateTime(row.revision_date) }}</td>

              <!-- 유형: BD 코드 → 한글 -->
              <td>{{ getTypeName(row.type_code) }}</td>

              <td v-if="isSystem">{{ row.org_name || "-" }}</td>

              <td>{{ row.modifier_name }}</td>

              <!-- 🔹 새 컬럼: 수정자 권한 (AA1~AA4) → 한글 -->
              <td>{{ getModifierRoleName(row.modifier_role) }}</td>

              <td>{{ row.change_item }}</td>

              <td class="hist-before">{{ row.before_change }}</td>
              <td class="hist-after">{{ row.after_change }}</td>
            </tr>

            <!-- 로딩 중 -->
            <tr v-if="loading">
              <td :colspan="isSystem ? 9 : 8" class="hist-loading">
                로딩 중...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이징 -->
      <div class="hist-pagination" v-if="totalPages > 1">
        <button
          class="hist-btn"
          :disabled="page === 1 || loading"
          @click="changePage(page - 1)"
        >
          이전
        </button>

        <span class="hist-page-info">{{ page }} / {{ totalPages }}</span>

        <button
          class="hist-btn"
          :disabled="page === totalPages || loading"
          @click="changePage(page + 1)"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import { useAuthStore } from "@/store/authLogin";

const auth = useAuthStore();

// 권한 체크
const isSystem = computed(() => auth.role === "AA4");
const isOrgManager = computed(() => auth.role === "AA3");

const searchField = ref("all");
const keyword = ref("");
const orderBy = ref("latest");
const typeCode = ref(""); // BD1~BD8

const orgCode = ref("");
const managerCode = ref(""); // ✅ users.user_code 기준으로 사용

const items = ref([]);
const page = ref(1);
const size = ref(20);
const totalCount = ref(0);
const loading = ref(false);

const orgOptions = ref([]);
const managerOptions = ref([]);

const startIndex = computed(() => (page.value - 1) * size.value + 1);
const totalPages = computed(() =>
  totalCount.value === 0 ? 1 : Math.ceil(totalCount.value / size.value)
);

// 유형(BD) 매핑
const typeMap = {
  BD1: "조사지",
  BD2: "상담",
  BD3: "지원계획",
  BD4: "지원결과",
  BD5: "이벤트 계획",
  BD6: "이벤트 결과",
  BD7: "후원 계획",
  BD8: "후원 결과",
};
const getTypeName = (code) => typeMap[code] || "-";

// 🔹 수정자 권한 매핑 (AA 코드)
const modifierRoleMap = {
  AA1: "일반 사용자",
  AA2: "기관 담당자",
  AA3: "기관 관리자",
  AA4: "시스템 관리자",
};

const getModifierRoleName = (roleCode) => modifierRoleMap[roleCode] || "-";

// 날짜 format
const formatDateTime = (v) =>
  v ? String(v).replace("T", " ").substring(0, 19) : "";

// 필터 변경 시 리로드
const onFilterChange = () => {
  page.value = 1;
  fetchList();
};

// 페이지 이동
const changePage = (p) => {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
  fetchList();
};

// 이력 조회
const fetchList = async () => {
  if (!isSystem.value && !isOrgManager.value) return;

  loading.value = true;
  try {
    const params = {
      page: page.value,
      size: size.value,
      searchField: searchField.value,
      keyword: keyword.value,
      orderBy: orderBy.value,
      typeCode: typeCode.value,
      // 🔹 권한/로그인 정보도 항상 같이 전달
      loginId: auth.userId,
      role: auth.role,
    };

    if (isSystem.value && orgCode.value) {
      params.orgCode = orgCode.value;
    }
    if (isOrgManager.value && managerCode.value) {
      // ✅ managerCode는 users.user_code
      params.managerCode = managerCode.value;
    }

    const res = await axios.get("/api/histories", { params });

    items.value = res.data?.data?.list ?? [];
    totalCount.value = res.data?.data?.totalCount ?? 0;
  } catch (err) {
    console.error(err);
    alert("이력 목록 조회 중 오류가 발생했습니다.");
  } finally {
    loading.value = false;
  }
};

// 기관목록 / 담당자 목록
const fetchOrgOptions = async () => {
  if (!isSystem.value) return;
  try {
    const res = await axios.get("/api/organization/simple");
    orgOptions.value = res.data?.data ?? [];
  } catch (err) {
    console.error(err);
  }
};

const fetchManagerOptions = async () => {
  if (!isOrgManager.value) return;
  try {
    const res = await axios.get("/api/managers/simple", {
      // ⬇️ 기존: orgCode: auth.orgCode (undefined라서 400 남)
      // params: { orgCode: auth.orgCode },
      params: { loginId: auth.userId }, // ✅ 로그인 아이디 기준으로 요청
    });

    const raw = res.data?.data ?? [];

    managerOptions.value = raw.map((m) => ({
      user_code: m.user_code ?? m.manager_code,
      name: m.name ?? m.manager_name,
    }));
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  if (isSystem.value) await fetchOrgOptions();
  if (isOrgManager.value) await fetchManagerOptions();

  fetchList();
});
</script>

<style scoped>
.hist-page {
  padding: 24px;
}

.hist-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
}

.hist-no-auth {
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fafafa;
  text-align: center;
  font-size: 14px;
}

.hist-toolbar {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hist-filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hist-select,
.hist-input {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.hist-input {
  min-width: 220px;
}

.hist-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  cursor: pointer;
  background: white;
}

.hist-btn-primary {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.hist-table-wrap {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow-x: auto;
}

.hist-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.hist-table th,
.hist-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.hist-table thead th {
  background: #fafafa;
}

.hist-before,
.hist-after {
  white-space: pre-wrap;
  word-break: break-word;
}

.hist-empty,
.hist-loading {
  text-align: center;
  padding: 12px 0;
}

.hist-pagination {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.hist-page-info {
  font-size: 13px;
}
</style>
