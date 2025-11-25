const { addOrg } = require('./services/signUserService');

async function testUser() {
  console.log('----------------------------------------------------');
  const testUser = {
    org_name: '대구행복복지센터',
    userId: 'test01',
    userPw: '123123123',
    role: 'AA3',
    agree: true,
    joinDate: '2025-11-25',
    name: 'test01',
    ssn: '111111-2222222',
    phone: '010-7797-8738',
    address: '경북 경산시 대동',
    email: 'test@email.com',
  };

  await addOrg(testUser);

  return;
}

testUser();
