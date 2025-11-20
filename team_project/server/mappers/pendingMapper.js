const pool = require('../configs/db');
const pendingSQL = require('../sql/pendingSQL');

async function getPendingListMapper(data) {
  try {
    const result = await pool.query(pendingSQL.GET_PENDING_LIST, [
      data.org_code,
    ]);
    return result;
  } catch (err) {
    console.error('[ getPendingListMapper 실패 ] : ', err);
  }
}

async function updateStatusMapper(data) {
  try {
    const { status, manager_code, submit_code } = data;
    const result = await pool.query(pendingSQL.UPDATE_STATUS, [
      status,
      manager_code,
      submit_code,
    ]);
    if (result.affectedRows == 0) {
      return { ok: false, message: '변경 실패' };
    }
    return { ok: true, message: '변경 성공' };
  } catch (err) {
    console.error('[ updateStatusMapper 실패 ] : ', err);
  }
}

async function searchManagersMapper(data) {
  try {
    const result = await pool.query(pendingSQL.SEARCH_MANAGERS, [data]);
    if (result.length == 0) {
      return { ok: false, message: '값 없음' };
    }
    return result;
  } catch (err) {
    console.error('[ searchManagersMapper 실패 ] : ', err);
  }
}

module.exports = {
  getPendingListMapper,
  updateStatusMapper,
  searchManagersMapper,
};
