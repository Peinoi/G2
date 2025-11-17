<template>
  <div class="container py-4">
    <div class="mb-3">
      <h3 class="fw-bold text-start text-dark">회원정보</h3>
    </div>

    <!-- 탭 -->
    <div class="tabs-container">
      <div>
        <material-button
          :class="['tab-btn', activeTab === 'user' ? 'active' : 'inactive']"
          @click="activeTab = 'user'"
        >
          사용자 정보
        </material-button>
      </div>

      <div>
        <material-button
          :class="['tab-btn', activeTab === 'org' ? 'active' : 'inactive']"
          @click="activeTab = 'org'"
        >
          소속기관 정보
        </material-button>
      </div>

      <div v-if="auth.role === 'AA1'">
        <material-button
          :class="['tab-btn', activeTab === 'child' ? 'active' : 'inactive']"
          @click="activeTab = 'child'"
        >
          자녀 정보
        </material-button>
      </div>
    </div>

    <div class="info-wrapper">
      <material-card class="info-card">
        <material-card-content class="info-content">
          <!-- 사용자 정보 -->
          <div v-if="activeTab === 'user'">
            <UserBasicInfo
              :editMode="editMode"
              :userData="userData"
              @edit="editMode = true"
              @cancel="cancelUserEdit"
              @save="saveUserInfo"
            />
          </div>

          <!-- 소속기관 정보 -->
          <div v-if="activeTab === 'org'">
            <UserOrgInfo
              :role="auth.role"
              :editMode="orgEditMode"
              :orgData="orgData"
              @edit="orgEditMode = true"
              @cancel="cancelOrgEdit"
              @save="saveOrgInfo"
            />
          </div>

          <!-- 자녀 정보 -->
          <div v-if="activeTab === 'child'">
            <UserChildInfo
              :childList="childList"
              @add-child="addChild"
              @update-child="updateChild"
              @delete-child="deleteChild"
            />
          </div>
        </material-card-content>
      </material-card>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/store/authLogin';
import UserBasicInfo from '@/components/userInfo/UserBasicInfo.vue';
import UserOrgInfo from '@/components/userInfo/UserOrgInfo.vue';
import UserChildInfo from '@/components/userInfo/UserChildInfo.vue';
import axios from 'axios';

export default {
  name: 'UserInfo',

  components: {
    UserBasicInfo,
    UserOrgInfo,
    UserChildInfo,
  },
  data() {
    return {
      activeTab: 'user',
      editMode: false,
      orgEditMode: false,
      userData: {
        user_id: '',
        name: '',
        phone: '',
        address: '',
        email: '',
      },
      orgData: {
        orgName: '',
        managerName: '',
        deptName: '',
        roleName: '',
        phone: '',
        address: '',
      },
      childList: [],
      showChildForm: false,
      originalUser: {},
      originalOrg: {},
      auth: null,
    };
  },

  created() {
    const auth = useAuthStore();
    this.auth = auth;

    this.userData.user_id = auth.userId;
    this.userData.name = '';
    this.userData.phone = '';
    this.userData.address = '';
    this.userData.email = '';
    this.originalUser = { ...this.userData };

    this.orgData.orgName = '';
    this.orgData.managerName = '';
    this.orgData.deptName = '';
    this.orgData.roleName = auth.role;
    this.orgData.phone = '';
    this.orgData.address = '';
    this.originalOrg = { ...this.orgData };

    // if (this.auth.role == 'AA1') {
    //   this.userFullInfo();
    // }

    this.userFullInfo();

    this.childList = [
      {
        name: '김첫째',
        ssn: '111111-2222222',
        gender: '남',
        disability: '지적장애',
      },
      {
        name: '김둘째',
        ssn: '111111-2222222',
        gender: '여',
        disability: '지체장애',
      },
      {
        name: '김셋째',
        ssn: '111111-2222222',
        gender: '남',
        disability: '자폐성장애',
      },
    ];
  },

  methods: {
    cancelUserEdit() {
      this.userData = { ...this.originalUser };
      this.editMode = false;
    },
    cancelOrgEdit() {
      this.orgData = { ...this.originalOrg };
      this.orgEditMode = false;
    },
    saveUserInfo(updated) {
      this.userData = { ...updated };
      this.originalUser = { ...updated };
      this.editMode = false;
    },
    saveOrgInfo(updated) {
      this.orgData = { ...updated };
      this.originalOrg = { ...updated };
      this.orgEditMode = false;
    },
    addChild(child) {
      this.childList.push(child);
    },
    updateChild({ index, child }) {
      this.childList.splice(index, 1, child);
    },
    deleteChild(index) {
      this.childList.splice(index, 1);
    },

    async userFullInfo() {
      try {
        const res = await axios.post('/api/userinfo/findInfo', {
          userId: this.auth.userId,
          role: this.auth.role,
        });
        console.log(res.data);
        if (res.ok) {
          console.log('값 없음');
          return;
        }

        this.userData = {
          user_id: res.data.user_id,
          name: res.data.name,
          phone: res.data.phone,
          address: res.data.user_address,
          email: res.data.email,
        };
        this.originalUser = { ...this.userData };

        this.orgData = {
          orgName: res.data.org_name || '소속기관 없음',
          managerName: res.data.manager_name || '담당자 미정',
          deptName: res.data.department,
          roleName: this.auth.role,
          phone: res.data.org_phone,
          address: res.data.org_address,
        };
        console.log(res.data);
        this.originalOrg = { ...this.orgData };
      } catch (err) {
        console.error('[ loadUserFullInfo 오류 ]', err);
      }
    },
  },
};
</script>

<style>
material-button,
.material-button {
  cursor: pointer !important;
}

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
  color: white !important;
}

.tab-btn.inactive {
  background: #e9ecef !important;
  color: #344767 !important;
}

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

.material-button,
button,
button:hover,
.btn,
.btn:hover {
  cursor: pointer !important;
}
</style>
