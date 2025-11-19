<template>
  <div class="approval-wrapper">
    <div class="approval-card">
      <div class="approval-content">
        <component :is="activeComponent" />
      </div>
    </div>
  </div>
</template>

<script>
import PendingList from '../components/PendingList.vue';

export default {
  name: 'PendingUserList',
  components: {
    PendingList,
  },
  data() {
    return {
      activeTab: 'approval',
    };
  },
  computed: {
    activeComponent() {
      return 'PendingList';
    },
  },
};
</script>

<style scoped>
.approval-wrapper {
  padding: 0;
}

.approval-card {
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 24px;
}

.approval-content {
  padding: 2.5rem 1.5rem;
}

.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
</style>
