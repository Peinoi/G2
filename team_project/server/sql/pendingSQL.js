module.exports = {
  GET_PENDING_LIST: `
  SELECT
    submit_code
  	, c.child_name AS child_name
    , submit_at
    , u2.name AS manager_name
    , status
  FROM survey_submission s
  LEFT JOIN child c ON s.child_code = c.child_code
  LEFT JOIN users u1 ON c.user_code = u1.user_code
  LEFT JOIN users u2 ON u1.manager_code = u2.user_code
  WHERE u1.org_code = ?`,

  UPDATE_STATUS: `
  UPDATE survey_submission s
  JOIN child c ON s.child_code = c.child_code
  JOIN users u ON c.user_code = u.user_code
  SET 
    s.status = ?,
    u.manager_code = ?
  WHERE s.submit_code = ?`,

  SEARCH_MANAGERS: `
  SELECT
    user_code
    ,	user_id
	  , name
    , phone 
  FROM users
  WHERE org_code = ?
  AND	role != "AA1"`,
};
