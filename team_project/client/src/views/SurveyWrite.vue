<template>
  <section class="p-6 max-w-5xl mx-auto">
    <!-- 헤더 -->
    <header class="mb-4 flex items-center justify-between header-row">
      <h2 class="text-2xl font-semibold">조사지 작성</h2>

      <div class="space-x-2">
        <MaterialButton
          color="dark"
          size="sm"
          variant="outlined"
          @click="goBack"
        >
          ← 목록
        </MaterialButton>
      </div>
    </header>

    <div v-if="!survey" class="text-gray-500">불러오는 중...</div>

    <div v-else class="space-y-6">
      <!-- 섹션 카드 -->
      <div
        v-for="section in survey.sections"
        :key="section.section_code"
        class="section-card"
      >
        <div class="section-header">
          <h3 class="section-title">
            {{ section.section_title }}
          </h3>
          <p v-if="section.section_desc" class="section-desc">
            {{ section.section_desc }}
          </p>
        </div>

        <!-- 세부항목들 -->
        <div
          v-for="sub in section.subsections"
          :key="sub.subsection_code"
          class="subsection-card"
        >
          <div class="sub-header">
            <div class="font-medium text-sm text-gray-800">
              {{ sub.subsection_title }}
            </div>
            <p v-if="sub.subsection_desc" class="text-xs text-gray-500 mt-0.5">
              {{ sub.subsection_desc }}
            </p>
          </div>

          <!-- 질문들 -->
          <div class="space-y-4 mt-2">
            <div
              v-for="item in sub.items"
              :key="item.item_code"
              class="question-card"
            >
              <!-- 질문 헤더 -->
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium text-sm text-gray-900">
                  {{ item.question_text }}
                  <span
                    v-if="item.is_required === 'Y'"
                    class="text-red-500 text-xs ml-1"
                    >*</span
                  >
                </div>
              </div>

              <!-- TEXT: MaterialInput 사용 -->
              <div v-if="item.question_type === 'TEXT'">
                <MaterialInput
                  v-model="answers[item.item_code]"
                  :id="`item-${item.item_code}`"
                  label="답변"
                  variant="static"
                  size="default"
                />
              </div>

              <!-- TEXTAREA -->
              <div v-else-if="item.question_type === 'TEXTAREA'">
                <label
                  class="block text-xs font-medium text-gray-500 mb-1"
                  :for="`item-${item.item_code}`"
                >
                  내용
                </label>
                <textarea
                  :id="`item-${item.item_code}`"
                  v-model="answers[item.item_code]"
                  class="w-full textarea-basic"
                  rows="3"
                ></textarea>
              </div>

              <!-- RADIO : MaterialRadio 사용 -->
              <div v-else-if="item.question_type === 'RADIO'" class="space-y-1">
                <div class="text-[11px] text-gray-500 mb-1">
                  보기 중 하나를 선택하세요
                </div>

                <MaterialRadio
                  v-for="opt in item.option_values"
                  :key="opt.value"
                  :id="`item-${item.item_code}-opt-${opt.value}`"
                  :name="`item_${item.item_code}`"
                  :checked="answers[item.item_code] === opt.value"
                  @change="answers[item.item_code] = opt.value"
                >
                  {{ opt.label }}
                </MaterialRadio>
              </div>

              <!-- CHECKBOX : MaterialCheckbox + 배열 매핑 -->
              <div
                v-else-if="item.question_type === 'CHECKBOX'"
                class="space-y-1"
              >
                <div class="text-[11px] text-gray-500 mb-1">
                  해당되는 항목을 모두 선택하세요
                </div>

                <MaterialCheckbox
                  v-for="opt in item.option_values"
                  :key="opt.value"
                  :id="`item-${item.item_code}-opt-${opt.value}`"
                  :name="`item_${item.item_code}`"
                  :modelValue="isChecked(item.item_code, opt.value)"
                  @update:modelValue="
                    (checked) =>
                      toggleCheckbox(item.item_code, opt.value, checked)
                  "
                >
                  {{ opt.label }}
                </MaterialCheckbox>
              </div>

              <!-- 기타 타입 방어 -->
              <div v-else class="text-xs text-gray-400 italic">
                지원되지 않는 질문 타입입니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="mt-4 flex justify-end gap-2">
        <MaterialButton
          color="dark"
          size="sm"
          variant="outlined"
          @click="goBack"
        >
          ← 목록
        </MaterialButton>

        <MaterialButton
          color="dark"
          size="sm"
          class="px-5"
          @click="submitSurvey"
        >
          제출하기
        </MaterialButton>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

import MaterialButton from "@/components/MaterialButton.vue";
import MaterialInput from "@/components/MaterialInput.vue";
import MaterialRadio from "@/components/MaterialRadio.vue";
import MaterialCheckbox from "@/components/MaterialCheckbox.vue";

const router = useRouter();
const survey = ref(null);
const answers = ref({});

// 체크박스용 헬퍼: 현재 값에 포함되어 있는지
function isChecked(itemCode, value) {
  const arr = answers.value[itemCode];
  if (!Array.isArray(arr)) return false;
  return arr.includes(value);
}

// 체크박스 토글 → 배열로 저장
function toggleCheckbox(itemCode, value, checked) {
  const current = Array.isArray(answers.value[itemCode])
    ? [...answers.value[itemCode]]
    : [];

  if (checked) {
    if (!current.includes(value)) current.push(value);
  } else {
    const idx = current.indexOf(value);
    if (idx !== -1) current.splice(idx, 1);
  }

  answers.value[itemCode] = current;
}

// ✅ 최신 조사지 불러오기 + 답변 초기화
onMounted(async () => {
  try {
    const { data } = await axios.get("/api/survey/latest");
    const payload = data?.result ?? data;
    survey.value = payload;

    const initial = {};

    for (const section of payload?.sections ?? []) {
      for (const sub of section.subsections ?? []) {
        for (const item of sub.items ?? []) {
          const t = String(item.question_type).toUpperCase();
          initial[item.item_code] = t === "CHECKBOX" ? [] : "";
        }
      }
    }
    answers.value = initial;
  } catch (e) {
    alert("조사지 불러오기 실패: " + (e.response?.data?.message || e.message));
  }
});

// 제출하기
async function submitSurvey() {
  try {
    // 🔹 로그인 정보 가져오기
    const stored = localStorage.getItem("user");
    let userCode = null;

    if (stored) {
      const u = JSON.parse(stored);
      // 네가 실제 쓰는 필드명에 맞게 조합
      userCode = u.user_code ?? u.userCode ?? u.id ?? null;
    }

    if (!userCode) {
      alert("로그인 정보를 찾을 수 없습니다. (user_code 없음)");
      return;
    }

    const payload = {
      template_ver_code: survey.value.template_ver_code,
      answers: answers.value,
      written_by: Number(userCode), // ⭐ 여기!
    };

    const res = await axios.post("/api/survey/submit", payload);

    if (res.data?.success !== false) {
      alert("응답이 저장되었습니다!");
      router.push("/survey-list");
    } else {
      alert("저장 실패: " + (res.data?.message || "알 수 없는 오류"));
    }
  } catch (e) {
    alert("저장 실패: " + (e.response?.data?.message || e.message));
  }
}

function goBack() {
  router.push("/survey-list");
}
</script>

<style scoped>
section {
  color: #111827;
}

/* 헤더 한 줄 유지 */
.header-row {
  flex-wrap: nowrap;
}

/* 섹션 카드 */
.section-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
}

.section-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.section-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.2rem;
}

/* 서브섹션 카드 */
.subsection-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem;
  margin-top: 0.75rem;
}

.sub-header {
  margin-bottom: 0.25rem;
}

/* 질문 카드 */
.question-card {
  border-radius: 0.7rem;
  border: 1px dashed #d1d5db;
  padding: 0.8rem;
  background-color: #ffffff;
}

/* MaterialInput 위/아래 간격 줄이기 */
:deep(.input-group) {
  margin-top: 0.15rem;
  margin-bottom: 0.15rem;
}

/* TEXTAREA 스타일 */
.textarea-basic {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
  min-height: 80px;
  background-color: #ffffff;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.textarea-basic:focus {
  border-color: #111827;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.18);
}
</style>
