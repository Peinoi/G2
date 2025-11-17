const FIND_USER_INFO = `
SELECT u.user_id
  	 , u.name
     , u.phone
     , u.address AS user_address
     , u.email
     , o.org_name
     , u.manager_code
     , o.org_phone
     , o.address AS org_address
FROM users u
LEFT JOIN organization o
	   ON u.org_code = o.org_code
	WHERE u.user_id = ?`;

const FIND_ORG_INFO = `
SELECT u.user_id
  	 , u.name
     , u.phone
     , u.address AS user_address
     , u.email
     , o.org_name
     , u.department
     , u.role
     , o.org_phone
     , o.address AS org_address
FROM users u
LEFT JOIN organization o
	   ON u.org_code = o.org_code
	WHERE u.user_id = ?`;

module.exports = { FIND_USER_INFO, FIND_ORG_INFO };
