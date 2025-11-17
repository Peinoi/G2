<template>
  <div class="child-container">
    <!-- 상단 영역 -->
    <div class="header-row">
      <h6 class="title">자녀 정보</h6>
      <material-button color="success" @click="enterAddMode">
        자녀 추가
      </material-button>
    </div>

    <!-- 목록 모드 -->
    <div v-if="mode === 'list'">
      <div class="child-scroll-area">
        <div
          v-for="(child, index) in childList"
          :key="index"
          class="child-card"
        >
          <div class="child-title">
            <span class="child-index">{{ index + 1 }}번</span>
            <span class="child-name">{{ child.name }}</span>
          </div>

          <div class="child-field">
            <span class="label">주민등록번호</span>
            <span class="value">{{ child.ssn }}</span>
          </div>

          <div class="child-field">
            <span class="label">성별</span>
            <span class="value">{{ child.gender }}</span>
          </div>

          <div class="child-field">
            <span class="label">장애유형</span>
            <span class="value">{{ child.disability }}</span>
          </div>

          <div class="btn-row">
            <material-button color="info" @click="enterEditMode(child, index)">
              수정
            </material-button>

            <material-button
              color="danger"
              @click="$emit('delete-child', index)"
            >
              삭제
            </material-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 추가/수정 모드 -->
    <div v-if="mode === 'form'" class="form-card">
      <h6 class="form-title">
        {{ editIndex !== null ? '자녀 정보 수정' : '자녀 추가' }}
      </h6>

      <div class="input-row">
        <MaterialInput
          v-model="localChild.name"
          label="자녀 이름"
          class="w-100"
        />
      </div>

      <div class="input-row">
        <MaterialInput
          v-model="localChild.ssn"
          label="주민등록번호"
          class="w-100"
        />
      </div>

      <div class="input-row">
        <MaterialInput v-model="localChild.gender" label="성별" class="w-100" />
      </div>

      <div class="input-row">
        <MaterialInput
          v-model="localChild.disability"
          label="장애유형"
          class="w-100"
        />
      </div>

      <div class="form-btn-row">
        <material-button color="secondary" @click="cancelForm">
          취소
        </material-button>

        <material-button color="success" @click="saveChild">
          {{ editIndex !== null ? '수정 완료' : '추가하기' }}
        </material-button>
      </div>
    </div>
  </div>
</template>

<script>
import MaterialInput from '@/components/MaterialInput.vue';

export default {
  name: 'UserChildInfo',
  components: { MaterialInput },

  props: {
    childList: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      mode: 'list', // list | form
      editIndex: null, // index for editing
      localChild: {
        name: '',
        ssn: '',
        gender: '',
        disability: '',
      },
    };
  },

  methods: {
    enterAddMode() {
      this.mode = 'form';
      this.editIndex = null;
      this.localChild = {
        name: '',
        ssn: '',
        gender: '',
        disability: '',
      };
    },

    enterEditMode(child, index) {
      this.mode = 'form';
      this.editIndex = index;
      this.localChild = { ...child };
    },

    cancelForm() {
      this.mode = 'list';
      this.editIndex = null;
    },

    saveChild() {
      if (this.editIndex !== null) {
        this.$emit('update-child', {
          index: this.editIndex,
          child: this.localChild,
        });
      } else {
        this.$emit('add-child', this.localChild);
      }
      this.cancelForm();
    },
  },
};
</script>

<style scoped>
.child-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.child-scroll-area {
  max-height: 330px;
  overflow-y: auto;
  padding-right: 6px;
}

.child-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.child-title {
  display: flex;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}

.child-field {
  margin-bottom: 6px;
}

.label {
  font-size: 11px;
  color: #8392ab;
  font-weight: 700;
  margin-right: 6px;
}

.value {
  font-size: 13px;
  color: #344767;
  font-weight: 500;
}

.btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* form */
.form-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.form-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 16px;
  color: #344767;
}

.input-row {
  margin-bottom: 14px;
}

.form-btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
