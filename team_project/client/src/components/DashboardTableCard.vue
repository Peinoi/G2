<template>
  <div class="card dashboard-table-card">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0">{{ title }}</h6>
        <i v-if="icon" class="material-icons text-muted small">{{ icon }}</i>
      </div>

      <!-- 데이터 없을 때 -->
      <div v-if="displayedRows.length === 0" class="empty-text">
        데이터가 없습니다.
      </div>

      <!-- 데이터 있을 때 -->
      <div v-else class="table-responsive">
        <table class="table mb-0 align-middle">
          <thead>
            <tr>
              <th
                v-for="col in columns"
                :key="col.field"
                :class="[
                  'py-2 small text-secondary fw-semibold',
                  alignClass(col.align),
                ]"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- ✅ maxRows 만큼 “채우는” 게 아니라, displayedRows 만큼만 돌린다 -->
            <tr v-for="(row, idx) in displayedRows" :key="idx">
              <td
                v-for="col in columns"
                :key="col.field"
                :class="['py-2 small', alignClass(col.align)]"
              >
                {{ row[col.field] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DashboardTableCard",
  props: {
    title: String,
    icon: String,
    color: {
      type: String,
      default: "primary",
    },
    columns: {
      type: Array,
      default: () => [],
    },
    rows: {
      type: Array,
      default: () => [],
    },
    maxRows: {
      type: Number,
      default: 0, // 0이면 제한 없음
    },
  },
  computed: {
    displayedRows() {
      if (!Array.isArray(this.rows)) return [];
      if (this.maxRows && this.maxRows > 0) {
        return this.rows.slice(0, this.maxRows); // 👈 여기서 자르기만, 채우기 없음
      }
      return this.rows;
    },
  },
  methods: {
    alignClass(align) {
      if (align === "right") return "text-end";
      if (align === "center") return "text-center";
      return "text-start";
    },
  },
};
</script>

<style scoped>
.dashboard-table-card {
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
  border: none;
}

.empty-text {
  font-size: 0.875rem;
  color: #9ca3af;
}
</style>
