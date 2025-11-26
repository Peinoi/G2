<template>
  <div class="approve-wrap">
    <h2>결제 승인 중입니다. 잠시만 기다려 주세요...</h2>
  </div>
</template>

<script setup>
import axios from "axios";
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const pg_token = route.query.pg_token;
  const localtid = localStorage.getItem("kakao_tid");
  const kakaoObject = JSON.parse(localtid);
  const tid = String(kakaoObject.tid);

  if (!pg_token || !tid) {
    alert("결제 승인 정보가 올바르지 않습니다.");
    router.push("/SponsorProgramList");
    return;
  }

  try {
    // ----------------------------
    // 서버에 approve 요청
    // ----------------------------
    const userJsonString = localStorage.getItem("user");

    let userId = null;
    let code = null;
    const userObject = JSON.parse(userJsonString);

    userId = String(userObject.user_id);
    code = kakaoObject.code;
    const res = await axios.post("http://49.50.139.49/pay/kakao/approve", {
      pg_token,
      tid,
      program_code: code,
      userID: userId,
    });

    console.log("최종 승인 성공:", res.data);

    alert("프로그램이 성공적으로 후원되었습니다!");

    // 결제정보 삭제
    localStorage.removeItem("kakao_tid");
    localStorage.removeItem("program_code");
    localStorage.removeItem("userID");

    router.push("/SponsorProgramList");
  } catch (error) {
    console.error("approve 오류:", error);
    alert("결제 승인 중 오류가 발생했습니다.");
    router.push("/SponsorProgramList");
  }
});
</script>

<style scoped>
.approve-wrap {
  padding: 40px;
  text-align: center;
}
</style>
