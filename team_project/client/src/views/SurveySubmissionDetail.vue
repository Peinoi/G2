<template>
  <section class="p-6 max-w-5xl mx-auto relative">
    <div class="form-action">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>
      <!-- 관리자 전용: 우상단 담당자 배정 버튼 -->
      <div v-if="isAdmin" class="absolute right-8 top-6 z-10">
        <MaterialButton color="dark" size="sm" @click="goAssignPage">
          담당자 배정
        </MaterialButton>
      </div>
    </div>

    <div class="detail-card">
      <!-- 헤더 -->
      <header class="flex justify-between items-start detail-header">
        <h2 class="text-2xl font-semibold mb-1">조사지 답변</h2>

        <span class="status-pill">
          상태: {{ statusLabel(submission?.status) }}
        </span>
      </header>

      <!-- 로딩/에러 -->
      <div v-if="loading" class="text-gray-500 py-6">불러오는 중...</div>
      <div v-else-if="error" class="text-red-600 py-6">{{ error }}</div>
      <div v-else-if="!submission" class="text-gray-500 py-6">
        데이터를 찾을 수 없습니다.
      </div>

      <!-- 본문 -->
      <div v-else class="detail-body">
        <!-- 상단 메타 정보 -->
        <div class="meta-card">
          <div class="meta-grid">
            <!-- 지원자 -->
            <div class="meta-item">
              <span class="meta-label">지원자</span>
              <span class="meta-value">{{
                submission.child_name || "본인"
              }}</span>
            </div>

            <!-- 보호자 -->
            <div class="meta-item">
              <span class="meta-label">보호자</span>
              <span class="meta-value">{{
                submission.written_by_name || "-"
              }}</span>
            </div>

            <!-- 담당자 -->
            <div class="meta-item">
              <span class="meta-label">담당자</span>
              <span class="meta-value">{{
                submission.assignee_name || "-"
              }}</span>
            </div>

            <!-- 장애유형 -->
            <div class="meta-item">
              <span class="meta-label">장애유형</span>
              <span class="meta-value">{{
                submission.disability_type || "-"
              }}</span>
            </div>

            <!-- 제출일 -->
            <div class="meta-item">
              <span class="meta-label">제출일</span>
              <span class="meta-value">{{ fmt(submission.submit_at) }}</span>
            </div>

            <!-- 수정일 -->
            <div class="meta-item">
              <span class="meta-label">수정일</span>
              <span class="meta-value">{{ fmt(submission.updated_at) }}</span>
            </div>
          </div>
        </div>

        <!-- 섹션/서브섹션/문항 -->
        <div
          v-for="(section, sIdx) in submission.sections"
          :key="section.section_code"
          class="section-block"
        >
          <div class="section-header">
            <div>
              <h3 class="section-title">
                {{ sIdx + 1 }}. {{ section.section_title }}
              </h3>
              <p v-if="section.section_desc" class="section-desc">
                {{ section.section_desc }}
              </p>
            </div>
          </div>

          <div
            v-for="(sub, subIdx) in section.subsections"
            :key="sub.subsection_code"
            class="subsection-block"
          >
            <div class="sub-header">
              <div>
                <h4 class="sub-title">
                  {{ sIdx + 1 }}.{{ subIdx + 1 }} {{ sub.subsection_title }}
                </h4>
                <p v-if="sub.subsection_desc" class="sub-desc">
                  {{ sub.subsection_desc }}
                </p>
              </div>
            </div>

            <ul class="space-y-3">
              <li
                v-for="(item, iIdx) in sub.items"
                :key="item.item_code"
                class="question-item"
              >
                <div class="question-top">
                  <div class="question-title">
                    {{ sIdx + 1 }}.{{ subIdx + 1 }}.{{ iIdx + 1 }}
                    {{ item.question_text }}
                    <span v-if="item.is_required === 'Y'" class="required-mark">
                      *필수
                    </span>
                  </div>
                </div>

                <div class="answer-row">
                  <span class="answer-label">답변</span>
                  <span class="answer-value">
                    <template v-if="Array.isArray(renderAnswer(item))">
                      {{ renderAnswer(item).join(", ") || "-" }}
                    </template>
                    <template v-else>
                      {{ renderAnswer(item) || "-" }}
                    </template>
                  </span>
                </div>

                <div
                  v-if="
                    isChoiceType(item.question_type) &&
                    item.option_values?.length
                  "
                  class="option-hint"
                >
                  선택지:
                  {{
                    item.option_values.map((o) => o.label ?? o.value).join(", ")
                  }}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 일반 전용: 우하단 수정 버튼 -->
    <div class="form-actions">
      <MaterialButton
        v-if="isGeneral"
        color="dark"
        size="sm"
        class="fixed right-6 bottom-6 shadow-lg rounded-full mt-3"
        @click="goEdit"
      >
        수정하기
      </MaterialButton>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";

const route = useRoute();
const router = useRouter();
const submitCode = route.params.submitCode;

// 쿼리로 전달된 역할/유저 (없으면 기본값)
const role = computed(() => Number(route.query.role || 1));
const userId = computed(() => Number(route.query.userId || 1));

// 권한 플래그
const isGeneral = computed(() => role.value === 1);
const isAdmin = computed(() => role.value === 3);

// 기존 data(ref) → submission(ref)
const submissionRef = ref(null);
const submission = computed(() => submissionRef.value);

const loading = ref(false);
const error = ref("");

onMounted(fetchDetail);

async function fetchDetail() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get(`/api/survey/submission/${submitCode}`);

    if (res.data?.success === false)
      throw new Error(res.data.message || "조회 실패");

    const payload = res.data?.result ?? res.data;

    submissionRef.value = normalizePayload(payload);
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || "조회 실패";
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push("/survey-list");
}

// 관리자: 담당자 배정 페이지로 이동 (쿼리 유지)
function goAssignPage() {
  router.push({
    path: `/assign-manager/${submitCode}`,
    query: { role: role.value, userId: userId.value },
  });
}

// 일반: 제출본 수정 페이지로 이동 (쿼리 유지)
function goEdit() {
  router.push({
    path: `/survey/submission/${submitCode}/edit`,
    query: { role: role.value, userId: userId.value },
  });
}

/* ---------- 상태 라벨 ---------- */
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

/* ---------- 렌더/정규화 유틸 ---------- */
const CHOICE_TYPES = ["RADIO", "CHECKBOX"];
function isChoiceType(t) {
  return CHOICE_TYPES.includes(String(t).toUpperCase());
}

function mapValueToLabel(value, options = []) {
  const byValue = options.find((o) => (o?.value ?? o?.label) === value);
  if (byValue) return byValue.label ?? byValue.value ?? value;
  const byLabel = options.find((o) => o?.label === value);
  return byLabel ? byLabel.label ?? value : value;
}

function parseAnswerText(answer_text) {
  if (answer_text == null) return null;
  if (Array.isArray(answer_text)) return answer_text;
  if (typeof answer_text === "object") return answer_text;
  if (typeof answer_text === "string") {
    const s = answer_text.trim();
    if (!s) return "";
    if (
      (s.startsWith("[") && s.endsWith("]")) ||
      (s.startsWith("{") && s.endsWith("}"))
    ) {
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    }
    return s;
  }
  return String(answer_text);
}

function renderAnswer(item) {
  const options = Array.isArray(item.option_values) ? item.option_values : [];
  const raw = parseAnswerText(item.answer_text);

  if (isChoiceType(item.question_type)) {
    if (Array.isArray(raw)) return raw.map((v) => mapValueToLabel(v, options));
    if (raw == null || raw === "") return "";
    return mapValueToLabel(raw, options);
  }
  if (Array.isArray(raw)) return raw.join(", ");
  return raw ?? "";
}

function normalizeOptions(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return [];
    try {
      return JSON.parse(s);
    } catch {
      return [];
    }
  }
  return [];
}

function normalizePayload(payload) {
  if (!payload) return payload;
  const copy = JSON.parse(JSON.stringify(payload));
  copy.sections?.forEach((sec) => {
    sec.subsections?.forEach((sub) => {
      sub.items?.forEach((it) => {
        it.option_values = normalizeOptions(it.option_values);
      });
    });
  });
  return copy;
}

function fmt(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toISOString().slice(0, 10);
}
</script>

<style scoped>
section {
  color: #111;
}

/* 바깥 카드 */
.detail-card {
  background: #ffffff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}

/* 헤더 */
.detail-header {
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: #111827;
  color: #f9fafb;
}

/* 메타 정보 카드 */
.meta-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem 1rem;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}

.meta-row + .meta-row {
  margin-top: 0.25rem;
}
.meta-label {
  display: inline-block;
  width: 4.5rem;
  color: #6b7280;
}
.meta-value {
  color: #111827;
}

/* 섹션 카드 */
.section-block {
  border-radius: 0.85rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.1rem 1rem;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  margin-bottom: 1rem;
}

.section-header {
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
}
.section-desc {
  font-size: 0.85rem;
  color: #6b7280;
}

/* 서브섹션 카드 */
.subsection-block {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.85rem 0.9rem;
  margin-top: 0.7rem;
}

.sub-header {
  margin-bottom: 0.5rem;
}
.sub-title {
  font-size: 0.95rem;
  font-weight: 600;
}
.sub-desc {
  font-size: 0.8rem;
  color: #6b7280;
}

/* 질문 */
.question-item {
  border-radius: 0.7rem;
  border: 1px dashed #d1d5db;
  background-color: #ffffff;
  padding: 0.75rem 0.8rem;
}

.question-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.45rem;
}

.question-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}
.question-type {
  font-size: 0.75rem;
  color: #6b7280;
}
.required-mark {
  margin-left: 0.25rem;
  font-size: 0.75rem;
  color: #dc2626;
}

/* 답변 영역 */
.answer-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  margin-top: 0.15rem;
}
.answer-label {
  flex: 0 0 2.5rem;
  color: #6b7280;
}
.answer-value {
  flex: 1;
  color: #111827;
}

/* 선택지 힌트 */
.option-hint {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #9ca3af;
}
.form-actions {
  margin-top: 10px;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.form-action {
  margin-bottom: 10px;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem 1rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-item .meta-label {
  font-size: 0.78rem;
  color: #6b7280;
  margin-bottom: 0.15rem;
}

.meta-item .meta-value {
  font-size: 0.9rem;
  color: #111827;
  font-weight: 500;
}
</style>
