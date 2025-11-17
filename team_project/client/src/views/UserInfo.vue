<template>
  <div class="container py-4">
    <!-- 제목 -->
    <div class="mb-3">
      <h3 class="fw-bold text-start text-dark">회원정보</h3>
    </div>

    <!-- 탭 버튼 -->
    <div class="tabs-container">
      <material-button
        :class="['tab-btn', activeTab === 'user' ? 'active' : 'inactive']"
        @click="activeTab = 'user'"
      >
        사용자 정보
      </material-button>

      <material-button
        :class="['tab-btn', activeTab === 'org' ? 'active' : 'inactive']"
        @click="activeTab = 'org'"
      >
        소속기관 정보
      </material-button>

      <material-button
        :class="['tab-btn', activeTab === 'child' ? 'active' : 'inactive']"
        @click="activeTab = 'child'"
      >
        자녀 정보
      </material-button>
    </div>

    <!-- 내용 카드 -->
    <div class="info-wrapper">
      <material-card class="info-card">
        <material-card-content class="info-content">
          <!-- USER TAB -->
          <div v-if="activeTab === 'user'">
            <!-- 읽기 모드 -->
            <div v-if="!editMode">
              <div
                v-for="item in userFields"
                :key="item.key"
                class="view-block"
              >
                <p class="view-label">{{ item.label }}</p>
                <p class="view-value">{{ userData[item.key] }}</p>
              </div>

              <div class="text-end mt-4">
                <material-button color="success" @click="editMode = true">
                  회원정보 수정
                </material-button>
              </div>
            </div>

            <!-- 수정 모드 -->
            <div v-else>
              <div
                v-for="item in userFields"
                :key="item.key"
                class="edit-block"
              >
                <p class="edit-label">{{ item.label }}</p>

                <!-- 수정 불가 -->
                <p v-if="item.key === 'user_id'" class="edit-static">
                  {{ userData.user_id }}
                </p>

                <!-- 입력 가능 -->
                <MaterialInput
                  v-else
                  v-model="userData[item.key]"
                  class="w-100"
                />
              </div>

              <div class="text-end mt-4 d-flex justify-content-end gap-2">
                <material-button color="secondary" @click="cancelEdit">
                  취소
                </material-button>

                <material-button color="success" @click="saveUserInfo">
                  저장
                </material-button>
              </div>
            </div>
          </div>

          <!-- ORG -->
          <div v-if="activeTab === 'org'">
            <p class="text-center text-muted">소속기관 정보 (준비 중)</p>
          </div>

          <!-- CHILD -->
          <div v-if="activeTab === 'child'">
            <p class="text-center text-muted">자녀 정보 (준비 중)</p>
          </div>
        </material-card-content>
      </material-card>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/store/authLogin';

// ⭐⭐ 여기 반드시 추가 ⭐⭐
import MaterialInput from '@/components/MaterialInput.vue';

export default {
  name: 'UserInfo',

  components: {
    MaterialInput,
  },

  data() {
    return {
      activeTab: 'user',
      editMode: false,

      userData: {
        user_id: '',
        name: '',
        phone: '',
        address: '',
        email: '',
      },

      userFields: [
        { key: 'user_id', label: '아이디' },
        { key: 'name', label: '이름' },
        { key: 'phone', label: '전화번호' },
        { key: 'address', label: '주소' },
        { key: 'email', label: '이메일' },
      ],

      originalData: {},
    };
  },

  created() {
    const auth = useAuthStore();
    this.userData.user_id = auth.userId;
    this.userData.name = '홍길동';
    this.userData.phone = '010-1111-2222';
    this.userData.address = '대구광역시 어딘가';
    this.userData.email = 'email@email.com';

    this.originalData = { ...this.userData };
  },

  methods: {
    cancelEdit() {
      this.editMode = false;
      this.userData = { ...this.originalData };
    },

    saveUserInfo() {
      alert('저장 완료 (추후 API 연동 예정)');
      this.editMode = false;
      this.originalData = { ...this.userData };
    },
  },
};
</script>

<style scoped>
/* 탭 영역 */
.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 6px 16px !important;
  border-radius: 8px !important;
  font-size: 13px;
  font-weight: 600;
}

.tab-btn.active {
  background: #5e72e4 !important;
  color: #fff !important;
}

.tab-btn.inactive {
  background: #e9ecef !important;
  color: #344767 !important;
}

/* 카드 중앙 정렬 */
.info-wrapper {
  display: flex;
  justify-content: center;
}

.info-card {
  width: 460px;
  border-radius: 12px;
}

.info-content {
  padding: 24px !important;
}

/* 읽기 모드 */
.view-block {
  margin-bottom: 20px;
}

.view-label {
  font-weight: 700;
  color: #344767;
  margin-bottom: 4px;
}

.view-value {
  color: #6c757d;
  font-size: 14px;
}

/* 수정 모드 */
.edit-block {
  margin-bottom: 22px;
}

.edit-label {
  font-weight: 700;
  color: #344767;
  margin-bottom: 6px;
}

.edit-static {
  color: #6c757d;
  font-size: 14px;
}
</style>
