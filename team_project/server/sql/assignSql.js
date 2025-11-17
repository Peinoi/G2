// server/sql/assignSql.js
module.exports = {
  updateAssignee: `
    UPDATE survey_submission
    SET assi_by = ?
    WHERE submit_code = ?
  `,

  insertCounselNote: `
    INSERT INTO counsel_note (submit_code, status, written_at)
    VALUES (?, ?, ?)
  `,
};
