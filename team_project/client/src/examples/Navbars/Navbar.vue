<template>
  <nav
    class="shadow-none navbar navbar-main navbar-expand-lg border-radius-xl"
    v-bind="$attrs"
    id="navbarBlur"
    data-scroll="true"
    :class="isAbsolute ? 'mt-4' : 'mt-0'"
  >
    <div class="px-3 py-1 container-fluid">
      <!-- 왼쪽에 있는 현재 페이지의 이름 -->
      <div class="navbar-left-area">
        <breadcrumbs :currentPage="currentRouteName" :color="color" />
      </div>

      <!-- 중앙 버튼 영역 -->
      <div
        class="header-button-group d-flex justify-content-center align-items-center gap-3 flex-grow-1"
      >
        <router-link
          v-for="(item, index) in menuList"
          :key="index"
          :to="item.path"
          class="badge-link"
        >
          <span
            class="badge badge-sm"
            :class="['bg-gradient-' + item.color, { 'rounded-pill': true }]"
          >
            {{ item.name }}
          </span>
        </router-link>
      </div>

      <!-- 오른쪽 영역 -->
      <div
        class="mt-2 collapse navbar-collapse mt-sm-0 me-0 ms-auto flex-grow-0"
        :class="isRTL ? 'px-0' : 'me-sm-4'"
        id="navbar"
      >
        <!-- 오른쪽 아이콘 -->
        <div class="ms-auto d-flex align-items-center">
          <ul class="navbar-nav justify-content-end">
            <!-- ✅ 로그인 중일 때 로그인한 사용자 이름 표시 -->
            <li
              v-if="piniaLogin.isLogin"
              class="nav-item d-flex align-items-center me-2"
            >
              <span
                class="px-2 nav-link font-weight-bold lh-1"
                :class="color ? color : 'text-body'"
                style="cursor: default"
              >
                {{ piniaLogin.userName }} 님
              </span>
            </li>
            <!-- 로그인 아이콘 -->
            <li
              v-if="!piniaLogin.isLogin"
              class="nav-item d-flex align-items-center"
            >
              <div
                :to="{ name: 'SignIn' }"
                class="px-0 nav-link font-weight-bold lh-1"
                @click="loginCheck"
                :class="color ? color : 'text-body'"
                style="cursor: pointer"
              >
                로그인
                <i
                  class="material-icons"
                  :class="isRTL ? 'ms-sm-2' : 'me-sm-1'"
                >
                  account_circle
                </i>
              </div>
            </li>
            <!-- 로그아웃 -->
            <li
              v-if="piniaLogin.isLogin"
              class="nav-item d-flex align-items-center"
            >
              <div
                :to="{ name: 'SignIn' }"
                class="px-0 nav-link font-weight-bold lh-1"
                @click="loginCheck"
                :class="color ? color : 'text-body'"
                style="cursor: pointer"
              >
                로그아웃
                <i
                  class="material-icons"
                  :class="isRTL ? 'ms-sm-2' : 'me-sm-1'"
                >
                  account_circle
                </i>
              </div>
            </li>
            <!-- 로그인 상태일 때만 보이는 '회원정보' 아이콘 -->
            <li
              v-if="piniaLogin.isLogin"
              class="nav-item d-flex align-items-center ms-3"
            >
              <div
                class="px-0 nav-link font-weight-bold lh-1"
                :class="color ? color : 'text-body'"
                @click="$router.push({ name: 'UserInfo' })"
                style="cursor: pointer"
              >
                회원 정보 관리
                <i
                  class="material-icons"
                  :class="isRTL ? 'ms-sm-2' : 'me-sm-1'"
                >
                  face
                </i>
              </div>
            </li>

            <!-- 모바일 사이드바 토글 -->
            <li class="nav-item d-xl-none ps-3 d-flex align-items-center">
              <a
                href="#"
                @click="toggleSidebar"
                class="p-0 nav-link text-body lh-1"
                id="iconNavbarSidenav"
              >
                <div class="sidenav-toggler-inner">
                  <i class="sidenav-toggler-line"></i>
                  <i class="sidenav-toggler-line"></i>
                  <i class="sidenav-toggler-line"></i>
                </div>
              </a>
            </li>

            <!-- 설정 아이콘 -->
            <!-- <li class="px-3 nav-item d-flex align-items-center">
              <a
                class="p-0 nav-link lh-1"
                @click="toggleConfigurator"
                :class="color ? color : 'text-body'"
              >
                <i
                  class="material-icons fixed-plugin-button-nav cursor-pointer"
                >
                  settings
                </i>
              </a>
            </li> -->

            <!-- 알림 메뉴 -->
            <!-- <li
              class="nav-item dropdown d-flex align-items-center"
              :class="isRTL ? 'ps-2' : 'pe-2'"
            >
              <a
                href="#"
                class="p-0 nav-link lh-1"
                :class="[color ? color : 'text-body', showMenu ? 'show' : '']"
                id="dropdownMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                @click="showMenu = !showMenu"
              >
                <i class="material-icons cursor-pointer"> notifications </i>
              </a>
              <ul
                class="px-2 py-3 dropdown-menu dropdown-menu-end me-sm-n4"
                :class="showMenu ? 'show' : ''"
                aria-labelledby="dropdownMenuButton"
              >
                <li class="mb-2">
                  <a class="dropdown-item border-radius-md" href="javascript:;">
                    <div class="py-1 d-flex">
                      <div class="my-auto">
                        <img
                          src="../../assets/img/team-2.jpg"
                          class="avatar avatar-sm me-3"
                          alt="user image"
                        />
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-1 text-sm font-weight-normal">
                          <span class="font-weight-bold">New message</span> from
                          Laur
                        </h6>
                        <p class="mb-0 text-xs text-secondary">
                          <i class="fa fa-clock me-1"></i>
                          13 minutes ago
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
                <li class="mb-2">
                  <a class="dropdown-item border-radius-md" href="javascript:;">
                    <div class="py-1 d-flex">
                      <div class="my-auto">
                        <img
                          src="../../assets/img/small-logos/logo-spotify.svg"
                          class="avatar avatar-sm bg-gradient-dark me-3"
                          alt="logo spotify"
                        />
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-1 text-sm font-weight-normal">
                          <span class="font-weight-bold">New album</span> by
                          Travis Scott
                        </h6>
                        <p class="mb-0 text-xs text-secondary">
                          <i class="fa fa-clock me-1"></i>
                          1 day
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item border-radius-md" href="javascript:;">
                    <div class="py-1 d-flex">
                      <div
                        class="my-auto avatar avatar-sm bg-gradient-secondary me-3"
                      >
                        <svg
                          width="12px"
                          height="12px"
                          viewBox="0 0 43 36"
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                          <title>credit-card</title>
                          <g
                            stroke="none"
                            stroke-width="1"
                            fill="none"
                            fill-rule="evenodd"
                          >
                            <g
                              transform="translate(-2169.000000, -745.000000)"
                              fill="#FFFFFF"
                              fill-rule="nonzero"
                            >
                              <g transform="translate(1716.000000, 291.000000)">
                                <g
                                  transform="translate(453.000000, 454.000000)"
                                >
                                  <path
                                    class="color-background"
                                    d="M43,10.7482083 L43,3.58333333 C43,1.60354167 41.3964583,0 39.4166667,0 L3.58333333,0 C1.60354167,0 0,1.60354167 0,3.58333333 L0,10.7482083 L43,10.7482083 Z"
                                    opacity="0.593633743"
                                  ></path>
                                  <path
                                    class="color-background"
                                    d="M0,16.125 L0,32.25 C0,34.2297917 1.60354167,35.8333333 3.58333333,35.8333333 L39.4166667,35.8333333 C41.3964583,35.8333333 43,34.2297917 43,32.25 L43,16.125 L0,16.125 Z M19.7083333,26.875 L7.16666667,26.875 L7.16666667,23.2916667 L19.7083333,23.2916667 L19.7083333,26.875 Z M35.8333333,26.875 L28.6666667,26.875 L28.6666667,23.2916667 L35.8333333,23.2916667 L35.8333333,26.875 Z"
                                  ></path>
                                </g>
                              </g>
                            </g>
                          </g>
                        </svg>
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-1 text-sm font-weight-normal">
                          Payment successfully completed
                        </h6>
                        <p class="mb-0 text-xs text-secondary">
                          <i class="fa fa-clock me-1"></i>
                          2 days
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
            </li> -->
          </ul>
        </div>
      </div>
    </div>
  </nav>
</template>
<script>
import Breadcrumbs from '../Breadcrumbs.vue';
import { mapMutations, mapState } from 'vuex';
import { useAuthStore } from '@/store/authLogin';
import { roleMenu } from '@/examples/Menu/roleMenu';

export default {
  name: 'navbar',
  data() {
    return {
      showMenu: false,
    };
  },
  props: ['minNav', 'color'],
  created() {
    this.minNav;
  },
  methods: {
    ...mapMutations(['navbarMinimize', 'toggleConfigurator']),

    toggleSidebar() {
      this.navbarMinimize();
    },

    loginCheck() {
      // pinia속에 있는 isLogin 변수를 갖고와서 로그인 상태인지 체크함
      if (this.piniaLogin.isLogin) {
        this.piniaLogin.logout();
        alert('로그아웃 완료');
      }

      this.$router.push({ name: 'SignIn' });
    },
  },
  components: {
    Breadcrumbs,
  },
  computed: {
    ...mapState(['isRTL', 'isAbsolute']),

    currentRouteName() {
      return this.$route.name;
    },

    piniaLogin() {
      return useAuthStore();
    },

    // 권한에 따라 메뉴 항목이 다름
    // 비회원, AA1은 보이는 항목이 같음
    // 신천형황, 지원, 조사지, 후원, 이벤트, 회원 정보 관리
    // AA3
    // 대기자 목록, 승인 요청 관리, 지원 계획, 조사지, 상담, 후원, 이벤트, 히스토리, 회원 정보 관리
    // AA4
    // 대기자 목록, 지원 계획, 조사지, 상담, 후원, 이벤트, 기관 및 요청 관리, 히스토리, 회원 정보 관리
    menuList() {
      return roleMenu[this.piniaLogin.role] || roleMenu.AA1;
    },
  },
};
</script>
<style scoped>
/* 1. 전체 네비게이션 바 컨테이너 스타일 */
.navbar {
  background-color: white !important;
  box-shadow: none !important;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  z-index: 1000;
}

.container-fluid {
  /* container-fluid를 Flex 컨테이너로 설정 */
  display: flex;
  align-items: center; /* 수직 중앙 정렬 */
  justify-content: space-between; /* 항목들을 양 끝으로 분산 */
  padding-left: 24px !important;
  padding-right: 24px !important;
}

/* 2. 왼쪽 영역 (Breadcrumbs) */
.navbar-left-area {
  /* 고정된 너비를 제거하고 내용물 크기에 맞게 설정 */
  /* 단, 왼쪽 영역이 너무 작을 경우를 대비해 최소한의 flex-shrink 설정 */
  flex-basis: 170px; /* 기존 너비를 기준으로 공간 확보 */
  min-width: 170px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* --- 3. 중앙 버튼 영역 (Middle Area) - 완벽한 중앙 정렬을 위해 수정 --- */

.header-button-group {
  /* Flexbox 설정 유지 */
  display: flex;
  justify-content: center; /* 내부 버튼들을 중앙 정렬 */
  align-items: center;
  gap: 1rem;

  /* ✅ 중앙 정렬 핵심: 남은 공간을 최대한 차지 */
  flex-grow: 1;

  /* 중앙 영역 스타일 (기존 유지) */
  background-color: #f0f2f5;
  border-radius: 0.75rem;
  padding: 0.4rem 0.8rem;
  box-shadow: none;
  max-width: fit-content; /* 내부 내용물 크기만큼만 사용 */
  margin: 0 auto; /* ✅ 이 margin: auto가 flex-grow: 1과 결합하여 중앙 정렬을 보장합니다. */
}

.badge-link {
  text-decoration: none !important;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.badge-link .badge {
  padding: 0.5rem 1.25rem !important;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 0.5rem !important;
  transition: all 0.2s ease-in-out;
  box-shadow: none !important;
  background-image: none !important;
  color: #344767 !important;
  background-color: transparent !important;
}

.badge-link .badge:hover {
  background-color: rgba(0, 0, 0, 0.2) !important;
}

.badge-link.router-link-active .badge,
.badge-link.router-link-exact-active .badge {
  background-color: white !important;
  color: #344767 !important;
  font-weight: 700;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-image: none !important;
}

/* --- 4. 오른쪽 영역 (Right Area) --- */

/* 오른쪽 영역 컨테이너: flex-grow-0 유지 */
.navbar-collapse {
  flex-grow: 0 !important;
  justify-content: flex-end;
  /* 오른쪽 영역도 너비를 고정하여 중앙 영역과의 균형을 맞춥니다. */
  flex-basis: auto;
  flex-shrink: 0;
}

.ms-auto.d-flex.align-items-center {
  flex-shrink: 0;
  align-items: center;
}

.navbar-nav.justify-content-end {
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
}

.navbar-nav .nav-item {
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
}

.navbar-nav .nav-item:last-of-type {
  margin-right: 0;
}

/* 로그아웃, 회원정보관리, 로그인 아이콘 (클릭 가능한 항목) 패딩 조정 */
.nav-link.font-weight-bold {
  padding: 0.5rem 1.25rem !important;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #344767 !important;
}

.nav-link.font-weight-bold[style*='cursor: pointer']:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

/* 'OOO 님' 텍스트 (로그인 중 사용자 이름 - 클릭 불가 요소) 패딩 유지 */
.nav-item > span.nav-link {
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
  opacity: 1;
  color: #6c757d !important;
  cursor: default !important;
}

/* Material Icons 스타일 정돈 */
.nav-link.font-weight-bold i.material-icons {
  font-size: 1.25rem;
  line-height: 1;
  margin-left: 0.25rem;
  margin-right: 0;
}

.nav-item.ms-3 {
  margin-left: 0.5rem !important;
}
.nav-item.ms-3 .nav-link.font-weight-bold i.material-icons {
  margin-left: 0.5rem;
}

.nav-item.d-xl-none {
  margin-left: 0.75rem !important;
}

.sidenav-toggler-inner i {
  background-color: currentColor !important;
}
</style>
