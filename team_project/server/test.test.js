const { childAdd, findInfo } = require('./services/userInfoService');

async function testUser() {
  console.log('----------------------------------------------------');
  // const testUser = {
  //   org_name: '대구행복복지센터',
  //   userId: 'test01',
  //   userPw: '123123123',
  //   role: 'AA1',
  //   agree: true,
  //   joinDate: '2025-11-25',
  //   name: 'test01',
  //   ssn: '111111-2222222',
  //   phone: '010-7797-8738',
  //   address: '경북 경산시 대동',
  //   email: 'test@email.com',
  // };

  // const testUser = {
  //   user_code: 32,
  //   registered_date: '2025-11-25',
  //   child_name: 'test자녀01',
  //   ssn: '111111-2222222',
  //   gender: 'AC1',
  //   disability_type: '장애유형테스트',
  // };

  const testUser = { userId: 'test01', role: 'AA1' };
  await findInfo(testUser);

  return;
}

testUser();
