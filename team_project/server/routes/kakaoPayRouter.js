const express = require("express");
const router = express.Router();
const axios = require("axios");

// 카카오페이 결제 준비(ready)
router.post("/ready", async (req, res) => {
  try {
    const { program_code, userID, amount, item_name } = req.body;

    // 카카오페이 요청 바디
    const body = {
      cid: "TC0ONETIME", // 테스트 CID 고정
      partner_order_id: program_code, // 주문 번호 (프로그램 코드 사용)
      partner_user_id: userID, // 사용자 ID
      item_name: item_name || "후원 결제", // 프로그램명(없으면 기본값)
      quantity: 1, // 고정 1개
      total_amount: amount, // 후원 금액
      vat_amount: 0,
      tax_free_amount: 0,
      approval_url: "http://49.50.139.49/kakaopayapprove",
      cancel_url: "http://49.50.139.49/kakaopaycancel",
      fail_url: "http://49.50.139.49/kakaopayfail",
    };

    const kakaoResponse = await axios.post(
      "https://open-api.kakaopay.com/online/v1/payment/ready",
      body,
      {
        headers: {
          Authorization: `SECRET_KEY ${process.env.KAKAO_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // tid는 approve 때 필요하기 때문에 Vue/LocalStorage에 저장해야 함
    res.json({
      next_redirect_pc_url: kakaoResponse.data.next_redirect_pc_url,
      tid: kakaoResponse.data.tid,
    });
  } catch (error) {
    console.error("카카오페이 READY 오류 :", error.response?.data || error);
    return res
      .status(500)
      .json({ message: "카카오페이 결제 준비 실패", error: error });
  }
});
// 결제 승인(approve)
router.post("/approve", async (req, res) => {
  try {
    const { pg_token, tid, userID, program_code } = req.body;

    const body = {
      cid: "TC0ONETIME",
      tid: tid,
      partner_order_id: program_code, // 사실상 아무거나 가능
      partner_user_id: userID, // 사실상 아무거나 가능
      pg_token: pg_token,
    };

    // 카카오페이 승인 요청
    const approveResponse = await axios.post(
      "https://open-api.kakaopay.com/online/v1/payment/approve",
      body,
      {
        headers: {
          Authorization: `SECRET_KEY ${process.env.KAKAO_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("카카오페이 결제 승인 결과:", approveResponse.data);

    // --------------------------------------
    // ⭐ 후원 DB 저장 (여기서 수행)
    // --------------------------------------
    // 결제 금액
    const totalAmount = approveResponse.data.amount.total;

    const paymentInsert = await axios.post(
      `http://49.50.139.49:3000/sponsor/${program_code}/${userID}/payments`,
      {
        userID,
        transaction_amount: totalAmount,
        program_code,
      }
    );
    // 지금은 데이터를 Vue에 그대로 넘김
    res.json({
      message: "success",
      data: approveResponse.data,
    });
  } catch (error) {
    console.error("카카오페이 APPROVE 오류:", error.response?.data || error);
    return res
      .status(500)
      .json({ message: "카카오페이 결제 승인 실패", error: error });
  }
});

module.exports = router;
