<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <div class="flex justify-between items-center mb-6">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>
    </div>

    <div v-if="result" class="detail-card space-y-4">
      <header class="flex justify-between items-center">
        <h2 class="text-2xl font-semibold">결과보고서 상세</h2>
        <span class="status-pill" :class="statusClass(result.result_status)">
          {{ result.result_status_name }}
        </span>
      </header>

      <div class="meta-card">
        <div class="meta-row">
          <span>제목</span>
          <span>{{ result.result_subject }}</span>
        </div>
        <div class="meta-row">
          <span>작성일</span>
          <span>{{ formatDate(result.report_register_date) }}</span>
        </div>
      </div>

      <div class="block-card">
        <div class="field-block">
          <div class="field-label">내용</div>
          <div class="field-value whitespace-pre-line">
            {{ result.result_content }}
          </div>
        </div>
      </div>

      <!-- 첨부파일 -->
      <div v-if="result.attachments?.length" class="block-card">
        <div class="field-block">
          <div class="field-label">첨부파일</div>
          <ul class="file-list">
            <li v-for="file in result.attachments" :key="file.server_filename">
              <span class="file-name" @click="previewFile(file)">
                {{ file.original_filename }}
              </span>
            </li>
          </ul>
        </div>

        <!-- 이미지 미리보기 모달 -->
        <div v-if="previewImage" class="preview-modal" @click="closePreview">
          <img :src="previewImage" class="preview-img" />
        </div>

        <!-- 하단 이전 버튼 -->
        <div class="bottom-buttons">
          <button class="back-btn" @click="goBack">이전으로</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

const route = useRoute();
const router = useRouter();

const result = ref(null);

const resultCode = Number(route.params.resultCode || 0);

// 로그인 유저 코드
const getLoginUserCode = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const data = JSON.parse(userStr);
    return data.user_code || null;
  } catch {
    return null;
  }
};

// 미리보기 이미지
const previewImage = ref("");

// 파일 미리보기
const previewFile = (file) => {
  const ext = file.original_filename.split(".").pop().toLowerCase();

  // 이미지면 모달로 보기
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    previewImage.value = file.file_path;
    return;
  }

  // PDF면 새 창 미리보기
  if (ext === "pdf") {
    window.open(file.file_path, "_blank");
    return;
  }

  // 그 외 파일은 다운로드
  window.location.href = file.file_path;
};

const closePreview = () => {
  previewImage.value = "";
};

// 대표 이미지 설정
const mainImage = ref("");

// API 호출
const fetchResult = async () => {
  try {
    const userCode = getLoginUserCode();

    const res = await axios.get(`/api/event/result/${resultCode}`, {
      params: { user_code: userCode },
    });

    if (res.data?.status === "success") {
      result.value = res.data.data;
    } else {
      alert("결과보고서 조회 실패");
      return;
    }

    // 대표 이미지
    const img = result.value.attachments.find((x) =>
      /\.(jpg|jpeg|png|gif)$/i.test(x.original_filename)
    );
    mainImage.value = img ? img.file_path : "";
  } catch (err) {
    console.error("fetchResult error:", err);
    alert("서버 오류 발생");
  }
};

const statusClass = (status) => {
  switch (status) {
    case "BA1":
      return "status-pill--before";
    case "BA2":
      return "status-pill--done";
    case "BA3":
      return "status-pill--rejected";
    default:
      return "";
  }
};

const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// 이전 버튼
const goBack = () => router.back();

onMounted(fetchResult);
</script>

<style scoped>
.detail-card,
.block-card,
.meta-card {
  background: #fff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}
.meta-card .meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.meta-card .meta-row span:first-child {
  color: #6b7280;
}
.meta-card .meta-row span:last-child {
  color: #111827;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid transparent;
}
.status-pill--before {
  background: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}
.status-pill--done {
  background: #111827;
  color: #f9fafb;
  border-color: #111827;
}
.status-pill--rejected {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.file-list {
  margin-top: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  list-style: none;
  padding: 0;
}
.file-list li + li {
  margin-top: 0.25rem;
}
.file-list a {
  color: #2563eb;
  text-decoration: underline;
}
</style>
