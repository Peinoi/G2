const express = require("express");
const router = express.Router();
const axios = require("axios");

// 카카오페이 결제 준비(ready)
router.post("/ready", async (req, res) => {
  try {
    const { program_code, userID, amount, item_name, origin } = req.body;

    const userOrigin = req.body.origin; // Vue에서 받은 URL

    const approvalBaseURL =
      userOrigin || req.headers.origin || "http://49.50.139.49";

    const body = {
      cid: "TC0ONETIME",
      partner_order_id: program_code,
      partner_user_id: userID,
      item_name: item_name || "후원 결제",
      quantity: 1,
      total_amount: amount,
      vat_amount: 0,
      tax_free_amount: 0,

      // 📌 Vue 주소로 redirect
      approval_url: `49.50.139.49/kakaopayapprove`,
      cancel_url: `49.50.139.49/kakaopaycancel`,
      fail_url: `49.50.139.49/kakaopayfail`,
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

    res.json({
      next_redirect_pc_url: kakaoResponse.data.next_redirect_pc_url,
      tid: kakaoResponse.data.tid,
    });
  } catch (error) {
    return res.status(500).json({ message: "결제 준비 실패", error });
  }
});

// 결제 승인(approve)
router.post("/approve", async (req, res) => {
  try {
    const { pg_token, tid, program_code, userID } = req.body;

    if (!pg_token || !tid) {
      return res.status(400).json({
        message: "pg_token 또는 tid 누락됨",
      });
    }

    const body = {
      cid: "TC0ONETIME",
      tid,
      partner_order_id: program_code,
      partner_user_id: userID,
      pg_token,
    };

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

    // 결제금액 추출
    const totalAmount = approveResponse.data.amount.total;

    // DB 저장
    await axios.post(
      `http://49.50.139.49/sponsor/${program_code}/${userID}/payments`,
      {
        userID,
        transaction_amount: totalAmount,
        program_code,
      }
    );

    res.json({
      message: "success",
      data: approveResponse.data,
    });
  } catch (error) {
    console.error("approve 오류:", error.response?.data || error);
    res.status(500).json({
      message: "카카오페이 결제 승인 실패",
      error,
    });
  }
});

module.exports = router;
