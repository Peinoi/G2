<template>
  <div class="bg-white">
    <div class="container top-0 position-sticky z-index-sticky">
      <div class="row">
        <div class="col-12">
          <navbar
            isBlur="blur my-3 py-2 mt-4 start-0 end-0 mx-4 shadow blur border-radius-lg"
            btnBackground="bg-gradient-success"
            v-bind:darkMode="true"
          />
        </div>
      </div>
    </div>
    <main class="mt-0 main-content">
      <section>
        <div class="page-header min-vh-100">
          <div class="container">
            <div class="row">
              <div
                class="col-6 d-lg-flex d-none h-100 my-auto pe-0 ps-0 position-absolute top-0 start-0 text-center justify-content-center flex-column"
              >
                <div
                  class="position-relative h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center"
                  :style="{
                    backgroundImage:
                      'url(' +
                      require('@/assets/img/illustrations/illustration-signin.jpg') +
                      ')',
                  }"
                ></div>
              </div>
              <div
                class="col-xl-4 col-lg-5 col-md-7 d-flex flex-column ms-auto me-auto ms-lg-auto me-lg-5"
              >
                <div class="card card-plain">
                  <div class="pb-0 card-header bg-transparent mb-4">
                    <h4 class="font-weight-bolder">회원가입</h4>
                    <p class="mb-0">
                      아래의 항목들은 필수로 입력해주셔야 합니다.
                    </p>
                  </div>
                  <div class="card-body">
                    <!-- from -->
                    <form role="form" @submit.prevent v-if="step === 1">
                      <!-- 아이디 -->
                      <div class="mb-3">
                        <div class="d-flex align-items-end">
                          <!-- 아이디 입력창 -->
                          <div class="flex-grow-1 me-2">
                            <material-input
                              id="user-id"
                              type="text"
                              label="여긴 아이디"
                              size="lg"
                              v-model="userId"
                            />
                          </div>

                          <!-- 중복확인 버튼 -->
                          <material-button
                            variant="gradient"
                            color="success"
                            size="lg"
                            class="check-btn"
                            type="button"
                            @click="checkId"
                          >
                            중복확인
                          </material-button>
                        </div>
                      </div>
                      <p
                        v-if="idCheck"
                        :style="{
                          color: idCheck == 'true' ? '#2ecc71' : '#e74c3c',
                          fontSize: '0.8rem',
                          marginTop: '-10px',
                          marginLeft: '4px',
                        }"
                      >
                        <span>{{ idCheckMessage }}</span>
                      </p>

                      <p
                        v-else
                        :style="{
                          fontSize: '0.8rem',
                          marginTop: '-10px',
                          marginLeft: '4px',
                        }"
                      >
                        <span>{{ idCheckMessage }}</span>
                      </p>

                      <!-- 비밀번호 -->
                      <div class="mb-3">
                        <material-input
                          id="user-pw"
                          type="password"
                          label="여긴 비밀번호"
                          size="lg"
                          v-model="userPw"
                        />
                      </div>

                      <!-- 비밀번호 확인 -->
                      <div class="mb-3">
                        <material-input
                          id="user-pw-check"
                          type="password"
                          label="여긴 비밀번호 확인"
                          size="lg"
                          v-model="pwCheck"
                        />
                      </div>
                      <p
                        v-if="pwChecked"
                        :style="{
                          color: pwChecked == 'true' ? '#2ecc71' : '#e74c3c',
                          fontSize: '0.8rem',
                          marginTop: '-10px',
                          marginLeft: '4px',
                        }"
                      >
                        {{ pwCheckedMessage }}
                      </p>

                      <p
                        v-else
                        :style="{
                          fontSize: '0.8rem',
                          marginTop: '-10px',
                          marginLeft: '4px',
                        }"
                      >
                        {{ pwCheckedMessage }}
                      </p>

                      <!-- 이용약관 체크박스 -->
                      <material-checkbox
                        id="flexCheckDefault"
                        class="font-weight-light"
                        v-model="agree"
                      >
                        이용약관에 동의합니다
                        <a type="button" @click="showTermsModal">
                          | [이용약관(클릭 시 이용약관이 표시됩니다.)]</a
                        >
                      </material-checkbox>

                      <p
                        v-if="!agreeCheck"
                        :style="{
                          color: '#e74c3c',
                          fontSize: '0.8rem',
                          marginTop: '-10px',
                          marginLeft: '4px',
                        }"
                      >
                        {{ agreeCheckMessage }}
                      </p>

                      <!-- 가입 유형 선택 -->
                      <div class="d-flex justify-content-between gap-3 mt-4">
                        <!-- 개인 회원 -->
                        <material-button
                          variant="gradient"
                          color="success"
                          size="lg"
                          class="w-45"
                          type="button"
                          @click="goToStep('user')"
                          >개인 회원</material-button
                        >

                        <!-- 기관 회원 -->
                        <material-button
                          variant="gradient"
                          color="success"
                          size="lg"
                          class="w-45"
                          type="button"
                          @click="goToStep('org')"
                          >기관 회원</material-button
                        >
                      </div>
                    </form>

                    <!-- 개인 회원 -->
                    <sign-up-user-form
                      v-else-if="step === 'user'"
                      :base="{ userId, userPw, agree }"
                      @submit="signUpSubmit('user', $event)"
                      @back="step = 1"
                    />

                    <!-- 기관 회원 -->
                    <sign-up-org-form
                      v-else-if="step === 'org'"
                      :base="{ userId, userPw, agree }"
                      @submit="signUpSubmit('org', $event)"
                      @back="step = 1"
                    />
                  </div>
                  <div class="px-1 pt-0 text-center card-footer px-lg-2">
                    <p class="mx-auto mb-4 text-sm">
                      계정이 있으신가요? |
                      <router-link
                        :to="{ name: 'SignIn' }"
                        class="text-success text-gradient font-weight-bold"
                        >로그인</router-link
                      >
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- ======================= -->
  <!-- 📌 이용약관 모달창 -->
  <!-- ======================= -->
  <div
    v-if="showTerms"
    class="terms-modal-backdrop"
    @click.self="showTerms = false"
  >
    <div class="terms-modal">
      <h4 class="mb-3">이용약관</h4>

      <div class="terms-content">
        <h5>장애아동 지원센터 서비스 이용약관</h5>
        <p>
          본 약관은 장애아동 지원센터(이하 “센터”)가 제공하는 온라인 후원 및
          복지서비스(이하 “서비스”)의 이용 조건, 절차 및 이용자 권리와 의무를
          규정합니다.
        </p>

        <h6>제1조 (목적)</h6>
        <p>
          본 약관은 센터가 제공하는 서비스의 이용과 관련하여 센터와 이용자 간의
          권리 및 의무를 규정함을 목적으로 합니다.
        </p>

        <h6>제2조 (정의)</h6>
        <p>
          1. “이용자”란 본 약관에 동의하고 센터가 운영하는 서비스를 이용하는
          자를 말합니다.<br />
          2. “후원자”란 장애아동을 위해 후원금을 기부하는 이용자를 말합니다.<br />
          3. “기관 회원”은 복지기관 또는 단체로서 서비스에 가입한 이용자를
          말합니다.
        </p>

        <h6>제3조 (서비스 내용)</h6>
        <p>
          센터는 다음의 서비스를 제공합니다.<br />
          1. 장애아동 후원 프로그램 안내 및 참여 기능<br />
          2. 후원금 결제 및 관리<br />
          3. 기관별 활동 보고서 등록 서비스<br />
          4. 공지사항 및 이벤트 안내 메시지 제공<br />
        </p>

        <h6>제4조 (개인정보 보호)</h6>
        <p>
          센터는 개인정보보호법 등 관련 법령을 준수하며 이용자의 개인정보는
          명시된 목적 이외에는 사용하지 않습니다. 상세 내용은
          “개인정보처리방침”을 따릅니다.
        </p>

        <h6>제5조 (이용자의 의무)</h6>
        <p>
          1. 이용자는 서비스 이용 시 허위 정보를 제공해서는 안 됩니다.<br />
          2. 타인의 정보를 도용하거나 서비스를 부정 사용해서는 안 됩니다.<br />
          3. 후원금은 센터의 규정에 따라 사용되며, 이용자는 이에 동의해야
          합니다.
        </p>

        <h6>제6조 (약관의 변경)</h6>
        <p>
          센터는 필요한 경우 약관을 변경할 수 있으며, 변경 시 공지사항을 통해
          안내합니다.
        </p>

        <hr />
        <!-- 
      <p class="mt-3 text-sm text-muted">
        ※ 본 약관은 샘플이며 실제 서비스 운영 시 법률 검토 후 수정해야 합니다.
      </p> -->
      </div>

      <div class="text-end mt-3">
        <material-button
          color="success"
          variant="gradient"
          @click="showTerms = false"
        >
          닫기
        </material-button>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/examples/PageLayout/Navbar.vue';
import MaterialInput from '@/components/MaterialInput.vue';
import MaterialCheckbox from '@/components/MaterialCheckbox.vue';
import MaterialButton from '@/components/MaterialButton.vue';
const body = document.getElementsByTagName('body')[0];
import { mapMutations } from 'vuex';
import SignUpUserForm from '@/components/SignUp/SignUpUserForm.vue';
import SignUpOrgForm from '@/components/SignUp/SignUpOrgForm.vue';
import { checkId as checkUserId, addUser, addOrg } from '../api/user';
import dateFormat from '../utils/dateFormat';

const today = dateFormat(new Date(), 'yyyy-MM-dd');

export default {
  name: 'sign-up',
  components: {
    Navbar,
    MaterialInput,
    MaterialCheckbox,
    MaterialButton,
    SignUpUserForm,
    SignUpOrgForm,
  },
  data() {
    return {
      // step: 1,
      // userId: 'test12',
      // userPw: '123',
      // pwCheck: '123',
      // agree: true,
      // idCheck: 'true',
      // idCheckMessage: '사용 가능한 아이디인지 확인해주세요.',
      // pwChecked: 'true',
      // pwCheckedMessage: '비밀번호를 확인해주세요.',
      // agreeCheck: true,
      // agreeCheckMessage: '',
      step: 1,
      org_name: '',
      userId: '',
      userPw: '',
      pwCheck: '',
      agree: false,
      idCheck: null,
      idCheckMessage: '사용 가능한 아이디인지 확인해주세요.',
      pwChecked: null,
      pwCheckedMessage: '비밀번호를 확인해주세요.',
      agreeCheck: true,
      agreeCheckMessage: '',
      showTerms: false,
    };
  },
  watch: {
    userId() {
      this.idCheck = null;
      this.idCheckMessage = '사용 가능한 아이디인지 확인해주세요.';
    },
    pwCheck() {
      if (this.pwCheck == '') {
        this.pwChecked = null;
        this.pwCheckedMessage = '비밀번호를 확인해주세요.';
      } else if (this.userPw != this.pwCheck) {
        this.pwChecked = 'false';
        this.pwCheckedMessage = '비밀번호가 틀립니다.';
      } else {
        this.pwChecked = 'true';
        this.pwCheckedMessage = '비밀번호가 일치합니다.';
      }
    },
  },
  beforeMount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
    body.classList.remove('bg-gray-100');
  },
  beforeUnmount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
    body.classList.add('bg-gray-100');
  },
  methods: {
    ...mapMutations(['toggleEveryDisplay', 'toggleHideConfig']),

    showTermsModal() {
      this.showTerms = true;
    },
    // 중복확인
    async checkId() {
      if (!this.userId) {
        this.idCheck = 'false';
        this.idCheckMessage = '아이디를 입력해주세요.';
        return;
      }
      try {
        const result = await checkUserId(this.userId);
        if (result.ok) {
          this.idCheck = 'true';
          this.idCheckMessage = '사용 가능한 아이디입니다.';
        } else {
          this.idCheck = 'false';
          this.idCheckMessage = '이미 사용 중인 아이디입니다.';
        }
      } catch (err) {
        alert('중복확인 오류가 발생하였습니다.');
      }
    },

    goToStep(type) {
      // 중복확인 검사
      if (this.idCheck != 'true') {
        this.idCheck = 'false';
        this.idCheckMessage = '아이디를 확인해주세요.';
        return;
      }
      if (this.pwChecked != 'true') {
        this.pwChecked = 'false';
        this.pwCheckedMessage = '비밀번호를 확인해주세요.';
        return;
      }
      if (!this.agree) {
        this.agreeCheck = false;
        this.agreeCheckMessage = '이용약관에 동의해주셔야 이용이 가능합니다.';
        return;
      }
      this.step = type; // user / org
    },

    async signUpSubmit(type, detail) {
      // 개인 회원
      if (type == 'user') {
        try {
          const payload = {
            org_name: this.org_name,
            userId: this.userId,
            userPw: this.userPw,
            agree: this.agree,
            joinDate: today,
            ...detail,
          };
          const result = await addUser(payload);

          if (!result.ok) {
            alert('회원가입에 실패했습니다.\n고객센터에 문의해주세요.');
            return;
          }
          this.$router.push({ name: 'SignIn' });
          alert('회원가입에 성공했습니다.\n로그인 페이지로 이동합니다.');
        } catch (err) {
          alert('회원가입에 실패했습니다.\n고객센터에 문의해주세요.');
        }
      }
      // 기관 회원
      if (type == 'org') {
        try {
          const payload = {
            userId: this.userId,
            userPw: this.userPw,
            agree: this.agree,
            joinDate: today,
            ...detail,
          };

          const result = await addOrg(payload);

          if (!result.ok) {
            alert('회원가입에 실패했습니다.\n고객센터에 문의해주세요.');
            return;
          }
          this.$router.push({ name: 'SignIn' });
          alert('회원가입에 성공했습니다.\n로그인 페이지로 이동합니다.');
        } catch (err) {
          alert('회원가입에 실패했습니다.\n고객센터에 문의해주세요.');
        }
      }
    },
  },
};
</script>

<style scoped>
.check-btn {
  padding: 10px;
  width: 80px;
  height: 45px;
}

/* 모달 배경 */
.terms-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* 모달 박스 */
.terms-modal {
  background: #fff;
  width: 600px;
  max-width: 90%;
  max-height: 80%;
  overflow-y: auto;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

/* 내용 스크롤 */
.terms-content {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
