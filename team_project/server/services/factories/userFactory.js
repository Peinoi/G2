function createUser(userData, list = {}) {
  const {
    orgCode = null,
    hashedPw = null,
    isActive = 1,
    department = null,
  } = list;

  return {
    org_code: orgCode,
    userId: userData.userId,
    hashedPw,
    role: userData.role,
    name: userData.name,
    ssn: userData.ssn,
    phone: userData.phone,
    address: userData.address,
    email: userData.email,
    department,
    is_active: isActive,
    login_fail_count: 0,
    joinDate: userData.joinDate,
  };
}

module.exports = { createUser };
