module.exports = {
  GET_PENDING_LIST: `
  SELECT
    submit_code
    , c.child_name AS child_name
    , s.submit_at
    , u2.name AS manager_name
    , s.status
    , CASE 
		  WHEN s.child_code IS NULL THEN u3.name
      ELSE u1.name
      END AS writer_name
  FROM survey_submission s
  LEFT JOIN child c ON s.child_code = c.child_code
  LEFT JOIN users u1 ON c.user_code = u1.user_code
  LEFT JOIN users u2 ON s.assi_by = u2.user_code
  LEFT JOIN users u3 ON s.written_by = u3.user_code
  WHERE u1.org_code = ? OR s.child_code IS NULL`,

  // GET_PENDING_LIST: `
  // SELECT
  //   submit_code
  // 	, c.child_name AS child_name
  //   , submit_at
  //   , u2.name AS manager_name
  //   , status
  // FROM survey_submission s
  // LEFT JOIN child c ON s.child_code = c.child_code
  // LEFT JOIN users u1 ON c.user_code = u1.user_code
  // LEFT JOIN users u2 ON s.assi_by = u2.user_code
  // WHERE u1.org_code = ?`,

  UPDATE_STATUS: `
  UPDATE survey_submission
  SET 
    status = ?,
    assi_by = ?
  WHERE submit_code = ?`,

  INSERT_COUNSEL: `
  INSERT INTO counsel_note (
	submit_code
    , status
    )
  VALUES (?, 'CB2')`,

  SEARCH_MANAGERS: `
  SELECT
    user_code
    ,	user_id
	  , name
    , phone 
  FROM users
  WHERE org_code = ?
  AND	role = "AA2"`,
};
