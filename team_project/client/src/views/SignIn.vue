<template>
  <navbar btnBackground="bg-gradient-success" />
  <div
    class="page-header align-items-start min-vh-100"
    style="
      background-image: url('https://images.unsplash.com/photo-1497294815431-9365093b7331?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80');
    "
  >
    <span class="mask bg-gradient-dark opacity-6"></span>
    <div class="container my-auto">
      <div class="row">
        <div class="col-lg-4 col-md-8 col-12 mx-auto">
          <div class="card z-index-0 fadeIn3 fadeInBottom">
            <!-- 로그인 헤더 -->
            <div class="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
              <div
                class="bg-gradient-success shadow-success border-radius-lg py-3 pe-1"
              >
                <h4 class="text-white font-weight-bolder text-center mt-2 mb-0">
                  장애 행복 복지 지원
                </h4>

                <!-- 소셜 로그인 버튼 -->
                <!-- <div class="row mt-3">
                  <div class="col-2 text-center ms-auto">
                    <a class="btn btn-link px-3" href="javascript:;">
                      <i class="fab fa-facebook text-white text-lg"></i>
                    </a>
                  </div>
                  <div class="col-2 text-center px-1">
                    <a class="btn btn-link px-3" href="javascript:;">
                      <i class="fab fa-github text-white text-lg"></i>
                    </a>
                  </div>
                  <div class="col-2 text-center me-auto">
                    <a class="btn btn-link px-3" href="javascript:;">
                      <i class="fab fa-google text-white text-lg"></i>
                    </a>
                  </div>
                </div> -->
              </div>
            </div>

            <!-- 로그인 바디 -->
            <div class="card-body">
              <!-- form -->
              <form role="form" class="text-start mt-3">
                <div class="mb-3">
                  <material-input
                    id="userId"
                    type="text"
                    label="아이디를 입력해주세요"
                    name="userId"
                    v-model="userId"
                  />
                </div>
                <div class="mb-3">
                  <material-input
                    id="userPw"
                    type="password"
                    label="비밀번호를 입력해주세요"
                    name="userPw"
                    v-model="userPw"
                  />
                </div>
                <!-- <material-switch id="rememberMe" name="rememberMe"
                  >Remember me</material-switch
                > -->
                <div class="text-center">
                  <material-button
                    class="my-4 mb-2"
                    variant="gradient"
                    color="success"
                    fullWidth
                    type="button"
                    @click="login"
                    >로그인</material-button
                  >
                </div>
                <p class="mt-4 text-sm text-center">
                  계정이 없으신가요?
                  <router-link
                    :to="{ name: 'SignUp' }"
                    class="text-success text-gradient font-weight-bold"
                  >
                    회원가입</router-link
                  >
                </p>

                <!-- id / pw 찾기 아직 구현 못 함, 내일(18일) 구현하기 -->
                <p class="mt-4 text-sm text-center">
                  <a
                    href="#"
                    @click.prevent="toggleIdModal"
                    class="text-success text-gradient font-weight-bold"
                  >
                    ID 찾기
                  </a>
                  <span> / </span>
                  <a
                    href="#"
                    @click.prevent="togglePwModal"
                    class="text-success text-gradient font-weight-bold"
                  >
                    PW 찾기
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- ID 찾기 모달 -->
      <div v-if="showFindIdModal" class="custom-modal-backdrop">
        <div class="custom-modal">
          <h5 class="font-weight-bolder mb-3">아이디 찾기</h5>

          <!-- <p class="text-sm text-secondary">멀 보노</p> -->

          <material-input
            type="text"
            label="이름"
            class="mb-3"
            v-model="findIdName"
          />

          <material-input
            type="tel"
            label="연락처"
            class="mb-4"
            v-model="findIdPhone"
            @input="formatPhoneInput('findIdPhone')"
          />

          <div class="d-flex justify-content-end gap-2">
            <material-button color="secondary" @click="toggleIdModal">
              닫기
            </material-button>
            <material-button color="success" @click="findId">
              확인
            </material-button>
          </div>
        </div>
      </div>

      <!-- PW 찾기 모달 -->
      <div v-if="showFindPwModal" class="custom-modal-backdrop">
        <div class="custom-modal">
          <div v-if="findPwStep === 1">
            <h5 class="font-weight-bolder mb-3">비밀번호 찾기 (1/2)</h5>

            <!-- <p class="text-sm text-secondary">나는 문어</p> -->

            <material-input
              type="text"
              label="아이디"
              class="mb-3"
              v-model="findPwUserId"
            />
            <material-input
              type="text"
              label="이름"
              class="mb-3"
              v-model="findPwName"
            />
            <material-input
              type="tel"
              label="연락처"
              class="mb-4"
              v-model="findPwPhone"
              @input="formatPhoneInput('findPwPhone')"
            />

            <div class="d-flex justify-content-end gap-2">
              <material-button color="secondary" @click="togglePwModal">
                닫기
              </material-button>
              <material-button color="success" @click="findPw">
                본인 확인
              </material-button>
            </div>
          </div>

          <div v-else-if="findPwStep === 2">
            <h5 class="font-weight-bolder mb-3">비밀번호 재설정 (2/2)</h5>

            <!-- <p class="text-sm text-secondary">꿈을 꾸는 문어</p> -->

            <material-input
              type="password"
              label="새 비밀번호"
              class="mb-3"
              v-model="findPwNewPw"
            />
            <material-input
              type="password"
              label="새 비밀번호 확인"
              class="mb-4"
              v-model="findPwNewPwCheck"
            />

            <div class="d-flex justify-content-end gap-2">
              <material-button color="secondary" @click="togglePwModal">
                취소
              </material-button>
              <material-button color="success" @click="resetPassword">
                비밀번호 재설정
              </material-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- <footer class="footer position-absolute bottom-2 py-2 w-100">
      <div class="container">
        <div class="row align-items-center justify-content-lg-between">
          <div class="col-12 col-md-6 my-auto">
            <div class="copyright text-center text-sm text-white text-lg-start">
              © {{ new Date().getFullYear() }}, made with
              <i class="fa fa-heart" aria-hidden="true"></i> by
              <a
                href="https://www.creative-tim.com"
                class="font-weight-bold text-white"
                target="_blank"
                >Creative Tim</a
              >
              for a better web.
            </div>
          </div>
          <div class="col-12 col-md-6">
            <ul
              class="nav nav-footer justify-content-center justify-content-lg-end"
            >
              <li class="nav-item">
                <a
                  href="https://www.creative-tim.com"
                  class="nav-link text-white"
                  target="_blank"
                  >Creative Tim</a
                >
              </li>
              <li class="nav-item">
                <a
                  href="https://www.creative-tim.com/presentation"
                  class="nav-link text-white"
                  target="_blank"
                  >About Us</a
                >
              </li>
              <li class="nav-item">
                <a
                  href="https://www.creative-tim.com/blog"
                  class="nav-link text-white"
                  target="_blank"
                  >Blog</a
                >
              </li>
              <li class="nav-item">
                <a
                  href="https://www.creative-tim.com/license"
                  class="nav-link pe-0 text-white"
                  target="_blank"
                  >License</a
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer> -->
  </div>
</template>

<script>
import Navbar from '@/examples/PageLayout/Navbar.vue';
import MaterialInput from '@/components/MaterialInput.vue';
// import MaterialSwitch from '@/components/MaterialSwitch.vue';
import MaterialButton from '@/components/MaterialButton.vue';
import { mapMutations } from 'vuex';
import { useAuthStore } from '../store/authLogin';
import { useMenuStore } from '@/store/sidebar';
import { findIdPw } from '../api/user';

export default {
  name: 'sign-in',

  components: {
    Navbar,
    MaterialInput,
    // MaterialSwitch,
    MaterialButton,
  },
  data() {
    return {
      userId: '',
      userPw: '',
      showFindIdModal: false,
      showFindPwModal: false,
      findIdName: '',
      findIdPhone: '',
      findPwUserId: '',
      findPwName: '',
      findPwPhone: '',
      findPwNewPw: '',
      findPwNewPwCheck: '',
      findPwStep: 1, // 1: 본인 확인, 2: 재설정
    };
  },
  beforeMount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  beforeUnmount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  methods: {
    async login() {
      if (!this.userId || !this.userPw) {
        alert('아이디 및 비밀번호 입력해주세요');
        return;
      }

      const piniaLogin = useAuthStore();
      const menu = useMenuStore();
      // menu.loadUserRole();
      try {
        const result = await piniaLogin.login({
          userId: this.userId,
          userPw: this.userPw,
        });
        if (!result.ok) {
          alert(`로그인 실패: ${result.err}`);
          return;
        }

        alert(`반갑습니다 ${result.user_id}(${result.role})님`);
        this.$router.push({ name: 'dashboard' });
        localStorage.setItem('user', JSON.stringify(result));
        menu.setRole(result.role);
      } catch (err) {
        alert('로그인 실패: ', err);
      }
    },

    formatPhoneInput(targetVariable) {
      let phone = this[targetVariable];
      if (!phone) return;

      const cleaned = phone.replace(/[^0-9]/g, '');
      let formatted = '';

      if (cleaned.length < 4) {
        formatted = cleaned;
      } else if (cleaned.length < 8) {
        formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
      } else if (cleaned.length < 11) {
        formatted =
          cleaned.slice(0, 3) +
          '-' +
          cleaned.slice(3, 7) +
          '-' +
          cleaned.slice(7);
      } else {
        formatted =
          cleaned.slice(0, 3) +
          '-' +
          cleaned.slice(3, 7) +
          '-' +
          cleaned.slice(7, 11);
      }

      this[targetVariable] = formatted;
    },

    async findId() {
      if (!this.findIdName || !this.findIdPhone) {
        alert('모든 항목을 입력해주세요');
        return;
      }
      const result = await findIdPw('findId', {
        name: this.findIdName,
        phone: this.findIdPhone,
      });
      if (!result.ok) {
        alert('조건에 맞는 값이 없습니다');
        return;
      }
      alert(`아이디는 ${result.user_id} 입니다.`);
    },

    async findPw() {
      if (!this.findPwUserId || !this.findPwName || !this.findPwPhone) {
        return alert('모든 항목을 입력해주세요');
      }
      const result = await findIdPw('findPw', {
        user_id: this.findPwUserId,
        name: this.findPwName,
        phone: this.findPwPhone,
      });
      if (!result.ok) {
        alert('조건에 맞는 값이 없습니다');
        return;
      }
      alert('다음 페이지로 이동');
      this.findPwStep = 2;
    },

    async resetPassword() {
      if (!this.findPwNewPw || !this.findPwNewPwCheck) {
        return alert('모두 입력해주세요');
      }
      if (this.findPwNewPw !== this.findPwNewPwCheck) {
        return alert('비밀번호 틀림');
      }
      const result = await findIdPw('findResetPw', {
        user_id: this.findPwUserId,
        name: this.findPwName,
        phone: this.findPwPhone,
        newPw: this.findPwNewPw,
      });
      if (!result.ok) {
        alert('PW 변경 실패');
        return;
      }
      alert('비밀번호 변경 성공');
      this.togglePwModal();
      this.findPwStep = 1;
    },

    toggleIdModal() {
      this.showFindIdModal = !this.showFindIdModal;
    },
    togglePwModal() {
      this.showFindPwModal = !this.showFindPwModal;
    },

    ...mapMutations(['toggleEveryDisplay', 'toggleHideConfig']),
  },
};
</script>

<style>
/* [추가] 모달 배경 스타일 */
.custom-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 반투명 검은색 배경 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050; /* 다른 요소 위에 표시되도록 높게 설정 */
}

/* [추가] 모달 본체 스타일 */
.custom-modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
</style>
