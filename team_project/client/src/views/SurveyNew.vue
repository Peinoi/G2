<template>
  <section class="p-6 max-w-5xl mx-auto">
    <!-- 헤더 -->
    <header class="flex items-center justify-between header-row">
      <h2 class="text-2xl font-semibold">새 버전 작성</h2>

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

    <!-- 비어있을 때 -->
    <div v-if="sections.length === 0" class="empty-state">
      <div class="text-gray-600 mb-4">아직 항목이 없습니다.</div>
      <MaterialButton color="dark" size="sm" @click="addSection">
        + 항목 추가
      </MaterialButton>
    </div>

    <!-- 섹션 있을 때 -->
    <div v-else class="space-y-6">
      <div v-for="(sec, sIndex) in sections" :key="sec.id" class="section-card">
        <!-- 섹션 헤더 -->
        <div class="section-header">
          <h3 class="section-title">항목 #{{ sIndex + 1 }}</h3>
          <div class="space-x-2">
            <MaterialButton
              color="dark"
              size="sm"
              variant="outlined"
              @click="addSubsection(sIndex)"
            >
              세부항목 추가
            </MaterialButton>
            <MaterialButton
              color="dark"
              size="sm"
              variant="outlined"
              @click="removeSection(sIndex)"
            >
              삭제
            </MaterialButton>
          </div>
        </div>

        <!-- 섹션 기본 정보 -->
        <div class="grid md:grid-cols-2 gap-3 mb-4">
          <div>
            <MaterialInput
              v-model="sec.title"
              :id="`sec-title-${sIndex}`"
              label="항목 제목"
              variant="static"
              size="default"
            />
          </div>
          <div>
            <MaterialInput
              v-model="sec.desc"
              :id="`sec-desc-${sIndex}`"
              label="항목 설명"
              variant="static"
              size="default"
            />
          </div>
        </div>

        <!-- 세부항목들 -->
        <div class="space-y-4">
          <div
            v-for="(sub, subIndex) in sec.subsections"
            :key="sub.id"
            class="subsection-card"
          >
            <!-- 서브 헤더 -->
            <div class="sub-header">
              <div class="font-medium text-sm">
                세부항목 #{{ subIndex + 1 }}
              </div>
              <div class="space-x-2">
                <MaterialButton
                  color="dark"
                  size="sm"
                  variant="outlined"
                  @click="addItem(sIndex, subIndex)"
                >
                  질문 추가
                </MaterialButton>
                <MaterialButton
                  color="dark"
                  size="sm"
                  variant="outlined"
                  @click="removeSubsection(sIndex, subIndex)"
                >
                  삭제
                </MaterialButton>
              </div>
            </div>

            <!-- 서브 기본 정보 -->
            <div class="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <MaterialInput
                  v-model="sub.title"
                  :id="`sub-title-${sIndex}-${subIndex}`"
                  label="세부항목 제목"
                  variant="static"
                  size="default"
                />
              </div>
              <div>
                <MaterialInput
                  v-model="sub.desc"
                  :id="`sub-desc-${sIndex}-${subIndex}`"
                  label="세부항목 설명"
                  variant="static"
                  size="default"
                />
              </div>
            </div>

            <!-- 질문들 -->
            <div class="space-y-3">
              <div
                v-for="(it, iIndex) in sub.items"
                :key="it.id"
                class="question-card"
              >
                <div class="question-header">
                  <div class="font-medium text-sm text-gray-800">
                    질문 #{{ iIndex + 1 }}
                  </div>
                  <MaterialButton
                    color="dark"
                    size="sm"
                    variant="outlined"
                    @click="removeItem(sIndex, subIndex, iIndex)"
                  >
                    삭제
                  </MaterialButton>
                </div>

                <div class="grid md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                      질문 타입
                    </label>
                    <select
                      v-model="it.type"
                      class="w-full input-basic"
                      @change="onChangeType(it)"
                    >
                      <option value="TEXT">TEXT (단답)</option>
                      <option value="TEXTAREA">TEXTAREA (서술)</option>
                      <option value="RADIO">RADIO (단일 선택)</option>
                      <option value="CHECKBOX">CHECKBOX (다중 선택)</option>
                    </select>
                  </div>

                  <div class="md:col-span-2">
                    <MaterialInput
                      v-model="it.text"
                      :id="`q-text-${sIndex}-${subIndex}-${iIndex}`"
                      label="질문 내용"
                      variant="static"
                      size="default"
                    />
                  </div>
                </div>

                <!-- 필수 여부 (스위치) -->
                <div class="mt-2">
                  <MaterialSwitch
                    :id="`required-${sIndex}-${subIndex}-${iIndex}`"
                    :name="`required-${sIndex}-${subIndex}-${iIndex}`"
                    :checked="it.required"
                    labelClass="text-xs text-gray-700"
                    @click="it.required = !it.required"
                  >
                    필수 질문
                  </MaterialSwitch>
                </div>

                <!-- 옵션 -->
                <div v-if="isChoiceType(it.type)" class="mt-4 border-t pt-3">
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-xs font-medium text-gray-700">
                      옵션 ({{ it.options.length }})
                    </div>
                    <MaterialButton
                      color="dark"
                      size="sm"
                      variant="outlined"
                      @click="addOption(sIndex, subIndex, iIndex)"
                    >
                      + 옵션 추가
                    </MaterialButton>
                  </div>

                  <div class="space-y-2">
                    <div
                      v-for="(op, oIndex) in it.options"
                      :key="op.id"
                      class="option-row"
                    >
                      <!-- 번호 -->
                      <div class="text-[11px] text-gray-500">
                        #{{ oIndex + 1 }}
                      </div>

                      <!-- 라벨 -->
                      <div>
                        <MaterialInput
                          v-model="op.label"
                          :id="`label-${op.id}`"
                          label="옵션 라벨"
                          variant="static"
                          size="default"
                        />
                      </div>

                      <!-- 값 -->
                      <div>
                        <MaterialInput
                          v-model="op.value"
                          :id="`value-${op.id}`"
                          label="옵션 값"
                          variant="static"
                          size="default"
                        />
                      </div>

                      <!-- 삭제 버튼 -->
                      <div class="flex justify-end">
                        <MaterialButton
                          color="dark"
                          size="sm"
                          variant="outlined"
                          @click="
                            removeOption(sIndex, subIndex, iIndex, oIndex)
                          "
                        >
                          삭제
                        </MaterialButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- // 질문 하나 -->
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 컨트롤 -->
      <div class="form-actions">
        <MaterialButton
          color="dark"
          size="sm"
          variant="outlined"
          @click="addSection"
        >
          + 항목 추가
        </MaterialButton>

        <!-- 작성 완료 버튼 -->
        <MaterialButton
          color="dark"
          size="sm"
          class="px-5"
          @click="openPreview"
        >
          작성 완료
        </MaterialButton>
      </div>
    </div>
    <!-- =======================
        PREVIEW MODAL
    ======================= -->
    <div v-if="previewOpen" class="modal-overlay">
      <div class="modal-box">
        <h3 class="text-xl font-semibold mb-4">작성 내용 확인</h3>

        <div class="max-h-[70vh] overflow-y-auto space-y-4 pr-2">
          <div
            v-for="(sec, sIdx) in sections"
            :key="sec.id"
            class="preview-section"
          >
            <h4 class="font-semibold text-lg mb-1">
              항목 #{{ sIdx + 1 }} — {{ sec.title || "제목 없음" }}
            </h4>
            <p class="text-gray-600 mb-3">
              {{ sec.desc || "설명 없음" }}
            </p>

            <div
              v-for="(sub, subIdx) in sec.subsections"
              :key="sub.id"
              class="preview-subsection"
            >
              <h5 class="font-medium">
                세부항목 #{{ subIdx + 1 }} — {{ sub.title || "제목 없음" }}
              </h5>
              <p class="text-gray-500 mb-2">
                {{ sub.desc || "설명 없음" }}
              </p>

              <div
                v-for="(it, iIdx) in sub.items"
                :key="it.id"
                class="preview-question"
              >
                <div class="font-medium mb-1">
                  질문 #{{ iIdx + 1 }} ({{ it.type }})
                  <span v-if="it.required" class="text-red-600 text-sm">
                    *필수
                  </span>
                </div>

                <div class="text-gray-800 mb-2">
                  {{ it.text || "질문 내용 없음" }}
                </div>

                <!-- 옵션 -->
                <div v-if="isChoiceType(it.type)" class="mt-2">
                  <div class="text-xs text-gray-600 mb-1">옵션</div>
                  <ul class="list-disc pl-6 text-sm">
                    <li v-for="op in it.options" :key="op.id">
                      {{ op.label || "라벨 없음" }} ({{ op.value || "-" }})
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <MaterialButton
            color="dark"
            size="sm"
            variant="outlined"
            @click="previewOpen = false"
          >
            수정하기
          </MaterialButton>

          <MaterialButton
            color="dark"
            size="sm"
            class="px-5"
            @click="saveDraft"
          >
            최종 제출하기
          </MaterialButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

import MaterialButton from "@/components/MaterialButton.vue";
import MaterialInput from "@/components/MaterialInput.vue";
import MaterialSwitch from "@/components/MaterialSwitch.vue";

const router = useRouter();
const sections = ref([]);
let uid = 1;
const newId = () => uid++;
const isChoiceType = (t) =>
  ["RADIO", "CHECKBOX"].includes(String(t).toUpperCase());

// 섹션
function addSection() {
  sections.value.push({ id: newId(), title: "", desc: "", subsections: [] });
}
function removeSection(i) {
  sections.value.splice(i, 1);
}

// 서브섹션
function addSubsection(i) {
  sections.value[i].subsections.push({
    id: newId(),
    title: "",
    desc: "",
    items: [],
  });
}
function removeSubsection(i, j) {
  sections.value[i].subsections.splice(j, 1);
}

// 질문
function addItem(i, j) {
  sections.value[i].subsections[j].items.push({
    id: newId(),
    type: "TEXT",
    text: "",
    required: false,
    options: [],
  });
}
function removeItem(i, j, k) {
  sections.value[i].subsections[j].items.splice(k, 1);
}

// 타입 변경 시 옵션 초기화
function onChangeType(item) {
  if (isChoiceType(item.type)) {
    if (!Array.isArray(item.options)) item.options = [];
    if (item.options.length === 0)
      item.options.push({ id: newId(), label: "", value: "", order: 1 });
  } else {
    item.options = [];
  }
}

// 옵션 추가/삭제
function addOption(i, j, k) {
  const item = sections.value[i].subsections[j].items[k];
  const nextOrder = (item.options?.length || 0) + 1;
  item.options.push({ id: newId(), label: "", value: "", order: nextOrder });
}
function removeOption(i, j, k, o) {
  const item = sections.value[i].subsections[j].items[k];
  item.options.splice(o, 1);
  item.options.forEach((op, idx) => (op.order = idx + 1));
}

// 저장할 데이터 구조 (백엔드 insertSurvey에 맞춤)
const payload = computed(() => ({
  template: {
    version_no: "2.0",
    status: "ACTIVE",
    created_by: 1,
    created_at: new Date().toISOString().slice(0, 10),
  },
  sections: sections.value.map((sec, sIdx) => ({
    order: sIdx + 1,
    title: sec.title,
    desc: sec.desc,
    subsections: sec.subsections.map((sub, subIdx) => ({
      order: subIdx + 1,
      title: sub.title,
      desc: sub.desc,
      items: sub.items.map((it, iIdx) => ({
        order: iIdx + 1,
        question_type: it.type,
        question_text: it.text,
        is_required: it.required ? "Y" : "N",
        option_values: isChoiceType(it.type)
          ? it.options.map((op, k) => ({
              label: op.label ?? "",
              value: op.value ?? "",
              order: op.order ?? k + 1,
            }))
          : null,
      })),
    })),
  })),
}));

const previewOpen = ref(false);

function openPreview() {
  previewOpen.value = true;
}

// ✅ 저장 함수 (백엔드 연동)
async function saveDraft() {
  try {
    const { data } = await axios.post("/api/survey/new", payload.value);
    if (data?.success) {
      alert("조사지 저장 완료!");
      router.push("/survey-version");
    } else {
      alert("저장 실패");
    }
  } catch (e) {
    console.error("save error:", e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

function goBack() {
  router.push({ name: "surveyVersion" });
}
</script>

<style scoped>
section {
  color: #111;
}

/* 헤더 한 줄 고정 */
.header-row {
  flex-wrap: nowrap;
  margin-bottom: 1.25rem;
}

:deep(.input-group) {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
  color: #4b5563;
  background: #f9fafb;
  margin-bottom: 1.5rem;
}

/* 공통 인풋 스타일 (select 등에서 사용) */
.input-basic {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background-color: #ffffff;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.input-basic:focus {
  border-color: #111827;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.2);
}

/* 섹션 카드 */
.section-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}

/* 섹션 헤더 줄 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #4b5563;
}

/* 세부항목 카드 */
.subsection-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem;
}

/* 세부항목 헤더 */
.sub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

/* 질문 카드 */
.question-card {
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
  padding: 0.9rem;
  background-color: #ffffff;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

/* 옵션 행 (번호 + 라벨 + 값 + 삭제 버튼 한 줄) */
.option-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1.5fr) minmax(0, 2fr) 80px;
  gap: 0.5rem;
  align-items: center;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  background: white;
  border-radius: 0.85rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.4);
}

/* 프리뷰 안쪽 카드들 */
.preview-section {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 0.9rem;
  background-color: #f9fafb;
}

.preview-subsection {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 0.75rem;
  background-color: #ffffff;
  margin-top: 0.75rem;
}

.preview-question {
  border-radius: 0.6rem;
  border: 1px dashed #d1d5db;
  padding: 0.6rem;
  margin-top: 0.5rem;
}

.form-actions {
  margin-top: 10px;
  padding-top: 0.9rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
</style>
