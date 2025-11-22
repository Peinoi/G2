<template>
  <div>
    <!-- <h5 class="font-weight-bolder mb-4">개인 회원 상세 정보</h5> -->

    <!-- 이름 -->
    <material-input
      id="name"
      type="text"
      label="이름"
      v-model="name"
      size="lg"
      class="mb-3"
    />

    <!-- 주민등록번호 (앞자리 + 뒷자리) -->
    <div class="d-flex align-items-end gap-2 mb-3">
      <material-input
        id="reg1"
        type="text"
        label="주민등록번호 앞자리"
        v-model="regFront"
        @input="regFront = regFront.replace(/[^0-9]/g, '').slice(0, 6)"
        size="lg"
        class="flex-grow-1"
      />
      <material-input
        id="reg2"
        type="password"
        label="주민등록번호 뒷자리"
        v-model="regBack"
        @input="regBack = regBack.replace(/[^0-9]/g, '').slice(0, 7)"
        size="lg"
        class="flex-grow-1"
      />
    </div>

    <!-- 연락처 -->
    <material-input
      id="phone"
      type="text"
      label="연락처 ( - 없이 입력 )"
      v-model="phone"
      size="lg"
      class="mb-3"
      @input="validatePhone"
    />

    <!-- 이메일 -->
    <div class="d-flex align-items-end gap-2 mb-3">
      <material-input
        id="email"
        type="email"
        label="이메일"
        v-model="email"
        size="lg"
        class="flex-grow-1"
      />
    </div>

    <!-- 주소 -->
    <div class="d-flex align-items-end gap-2 mb-3">
      <material-input
        id="address"
        type="text"
        label="주소"
        v-model="address"
        size="lg"
        class="flex-grow-1"
      />
      <material-button
        variant="gradient"
        color="success"
        size="md"
        type="button"
        class="address-btn"
        @click="searchAddress"
      >
        주소검색
      </material-button>
    </div>

    <!-- 기관명 (select box) -->
    <div class="input-group input-group-outline my-3">
      <label class="form-label"></label>
      <select v-model="org_name" class="form-control">
        <option disabled value="">소속 기관(선택사항입니다.)</option>
        <option
          v-for="org in orgList"
          :key="org.org_name"
          :value="org.org_name"
        >
          {{ org.org_name }}
        </option>
      </select>
    </div>

    <!-- 하단 버튼 -->
    <div class="d-flex justify-content-between mt-4">
      <material-button type="button" @click="$emit('back')"
        >뒤로</material-button
      >
      <material-button type="button" color="success" @click="submitForm">
        회원가입 완료
      </material-button>
    </div>
  </div>
</template>

<script>
import MaterialInput from '@/components/MaterialInput.vue';
import MaterialButton from '@/components/MaterialButton.vue';
import { findAllOrg } from '../../api/user';

export default {
  name: 'SignUpUserForm',
  components: {
    MaterialInput,
    MaterialButton,
  },
  props: { base: Object },
  data() {
    return {
      name: '',
      regFront: '',
      regBack: '',
      phone: '',
      address: '',
      email: '',
      org_name: '',
      orgList: [],
      role: 'AA1',
    };
  },
  methods: {
    searchAddress() {
      new window.daum.Postcode({
        oncomplete: (data) => {
          let addr = data.address;
          if (data.buildingName != '') {
            addr += `(${data.buildingName})`;
          }
          this.address = addr;
        },
      }).open();
    },
    submitForm() {
      if (
        !this.name ||
        !this.regFront ||
        !this.regBack ||
        !this.phone ||
        !this.address ||
        !this.email
      ) {
        return alert('필수 정보들을 입력해주세요.');
      }

      let formattedPhone = '';
      if (this.phone.length === 10) {
        formattedPhone = `${this.phone.slice(0, 3)}-${this.phone.slice(
          3,
          6
        )}-${this.phone.slice(6)}`;
      } else if (this.phone.length === 11) {
        formattedPhone = `${this.phone.slice(0, 3)}-${this.phone.slice(
          3,
          7
        )}-${this.phone.slice(7)}`;
      } else {
        return alert('전화번호는 10~11자리 숫자로 입력하세요.');
      }

      this.$emit('submit', {
        name: this.name,
        ssn: `${this.regFront}-${this.regBack}`,
        phone: formattedPhone,
        address: this.address,
        email: this.email,
        role: this.role,
        org_name: this.org_name ? this.org_code : null,
      });
    },
    validatePhone() {
      // 하이픈 감지
      if (this.phone.includes('-')) {
        alert('- 없이 입력하세요.');
        this.phone = this.phone.replace(/-/g, '');
        return;
      }

      // 숫자만
      this.phone = this.phone.replace(/[^0-9]/g, '');

      // 11자리 제한
      if (this.phone.length > 11) {
        this.phone = this.phone.slice(0, 11);
      }
    },
    async findOrgList() {
      const result = await findAllOrg();
      this.orgList = result;
    },
  },
  mounted() {
    this.findOrgList();
  },
};
</script>

<style scoped>
.address-btn {
  padding: 10px;
  width: 100px;
  height: 43px;
}
</style>
