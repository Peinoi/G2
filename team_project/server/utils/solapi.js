const { SolapiMessageService } = require('solapi');

const apiKey = process.env.SOLAPI_API_KEY;
const apiSecret = process.env.SOLAPI_API_SECRET;

// Solapi 클라이언트 생성
const client = new SolapiMessageService(apiKey, apiSecret);

async function sendSms(to, text) {
  try {
    const result = await client.sendOne({
      to,
      from: process.env.SOLAPI_FROM,
      text,
    });

    return { ok: true, result };
  } catch (error) {
    console.error('[ Solapi v5 Error ]', error);
    return { ok: false, error };
  }
}

module.exports = { sendSms };
