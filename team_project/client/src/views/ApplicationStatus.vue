<!-- src/views/ApplicationStatus.vue -->
<template>
  <div class="as-page">
    <h2 class="as-title">나의 지원 신청 현황</h2>

    <!-- 권한 없음 -->
    <div v-if="!isUser" class="as-no-auth">
      <p>접근 권한이 없습니다. (일반 이용자 전용 페이지)</p>
    </div>

    <!-- 목록 -->
    <div v-else>
      <div class="as-table-wrap">
        <table class="as-table">
          <thead>
            <tr>
              <th>No</th>
              <th>이름</th>
              <th>보호자</th>
              <th>담당자</th>
              <th>기관</th>
              <th>지원 신청일</th>
              <th>우선순위</th>
              <th>계획</th>
              <th>결과</th>
            </tr>
          </thead>

          <tbody>
            <!-- 로딩 -->
            <tr v-if="loading">
              <td colspan="9" class="as-empty">불러오는 중...</td>
            </tr>

            <!-- 데이터 없음 -->
            <tr v-else-if="statusList.length === 0">
              <td colspan="9" class="as-empty">조회된 신청 내역이 없습니다.</td>
            </tr>

            <!-- 데이터 표시 -->
            <tr
              v-else
              v-for="(row, idx) in statusList"
              :key="row.submit_code || idx"
            >
              <td>{{ idx + 1 }}</td>

              <td>{{ row.child_name || "본인" }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.assi_name || "-" }}</td>
              <td>{{ row.org_name || "-" }}</td>

              <!-- 지원 신청일 (조사지 상세 이동) -->
              <td class="as-link" @click="goSurveyDetail(row.submit_code)">
                {{ formatDate(row.survey_date) }}
              </td>

              <!-- 우선순위 -->
              <td>
                <span class="as-tag" :class="'lvl-' + row.priority_level">
                  {{ convertPriority(row.priority_level) }}
                </span>
              </td>

              <!-- 지원 계획 상태 -->
              <td class="as-link" @click="goPlanDetail(row.plan_code)">
                {{ convertPlanStatus(row.plan_status) }}
              </td>

              <!-- 지원 결과 상태 -->
              <td class="as-link" @click="goResultDetail(row.result_code)">
                {{ convertResultStatus(row.result_status) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "@/store/authLogin";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

// 권한 체크 (일반 회원만)
const isUser = computed(() => auth.role === "AA1");

// 상태
const loading = ref(false);
const statusList = ref([]);

// 날짜 포맷
const formatDate = (d) => (d ? d.substring(0, 10) : "-");

// 우선순위 매핑 (BB)
const convertPriority = (code) => {
  switch (code) {
    case "BB1":
      return "긴급";
    case "BB2":
      return "중점";
    case "BB3":
      return "준비";
    default:
      return "-";
  }
};

// 지원 계획 상태 매핑 (CC)
const convertPlanStatus = (code) => {
  switch (code) {
    case "CC1":
      return "작성 전";
    case "CC2":
      return "작성 전";
    case "CC3":
      return "검토중";
    case "CC4":
      return "진행중";
    case "CC5":
      return "지원완료";
    default:
      return "-";
  }
};

// 지원 결과 상태 매핑 (CD)
const convertResultStatus = (code) => {
  switch (code) {
    case "CD1":
      return "작성 전";
    case "CD2":
      return "작성 전";
    case "CD3":
      return "지원중";
    case "CD4":
      return "승인요청";
    case "CD5":
      return "지원완료";
    default:
      return "-";
  }
};

// 이동 함수
const goSurveyDetail = (submitCode) => {
  if (!submitCode) return;
  router.push(`/survey/detail/${submitCode}`);
};

const goPlanDetail = (planCode) => {
  if (!planCode) return;
  router.push(`/plans/detail/${planCode}`);
};

const goResultDetail = (resultCode) => {
  if (!resultCode) return;
  router.push(`/results/detail/${resultCode}`);
};

// 데이터 조회
const fetchMyApplications = async () => {
  loading.value = true;

  try {
    const res = await axios.get("/api/applications/mine", {
      params: { loginId: auth.userId },
    });

    console.log("[ApplicationStatus] raw response:", res.data);

    const raw = res.data?.data ?? [];
    let list = [];

    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === "object") {
      list = [raw];
    }

    statusList.value = list.filter((row) => row && row.submit_code);
  } catch (err) {
    console.error("[ApplicationStatus] 조회 실패:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!isUser.value) return;
  fetchMyApplications();
});
</script>

<style scoped>
.as-page {
  padding: 24px;
}

.as-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
}

.as-no-auth {
  padding: 30px;
  border: 1px solid #ddd;
  background: #fff8f8;
  border-radius: 10px;
  text-align: center;
}

/*** 테이블 ***/
.as-table-wrap {
  overflow-x: auto;
}

.as-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.as-table th,
.as-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.as-table thead th {
  background: #fafafa;
  font-weight: 600;
}

.as-empty {
  text-align: center;
  padding: 20px;
  color: #777;
}

/*** 링크 스타일 ***/
.as-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
}

/*** 우선순위 태그 ***/
.as-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
}

.lvl-BB1 {
  background: #ff4d4f; /* 빨강: 긴급 */
}

.lvl-BB2 {
  background: #fa8c16; /* 주황: 중점 */
}

.lvl-BB3 {
  background: #52c41a; /* 초록: 준비 */
}
</style>
