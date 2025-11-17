// server/mappers/assignMapper.js
const pool = require("../configs/db");
const sql = require("../sql/assignSql");

module.exports = {
  async assignManager(submitCode, assignee) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1) survey_submission.assi_by 업데이트
      await conn.query(sql.updateAssignee, [assignee, submitCode]);

      // 2) counsel_note INSERT (CB2 상태)
      await conn.query(sql.insertCounselNote, [submitCode, "CB2", new Date()]);

      await conn.commit();

      return { submitCode, assignee, status: "CB2" };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },
};
