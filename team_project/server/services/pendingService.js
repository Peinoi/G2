const pendingMapper = require('../mappers/pendingMapper');

async function getPendingListService() {
  try {
    const result = await pendingMapper.getPendingListMapper();
    return result;
  } catch (err) {
    console.error('[ getPendingListService 실패 ] : ', err);
  }
}

async function updateStatusService(data) {
  try {
    const result = await pendingMapper.updateStatusMapper(data);
    return result;
  } catch (err) {
    console.error('[ updateStatusService 실패 ] : ', err);
  }
}

module.exports = { getPendingListService, updateStatusService };
