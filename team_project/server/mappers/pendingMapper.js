const pool = require('../configs/db');
const pendingSQL = require('../sql/pendingSQL');

async function getPendingListMapper() {
  try {
    const result = await pool.query(pendingSQL.GET_PENDING_LIST);
    return result;
  } catch (err) {
    console.error('[ getPendingListMapper 실패 ] : ', err);
  }
}

async function updateStatusMapper(data) {
  try {
    const { status, submit_code } = data;
    const result = await pool.query(pendingSQL.UPDATE_STATUS, [
      status,
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

module.exports = { getPendingListMapper, updateStatusMapper };
