// app.js
const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const testRouter = require("./routes/testRoute");
const surveyRoute = require("./routes/surveyRoute");
const counselRoute = require("./routes/counselRoute");
const supportPlanRoute = require("./routes/supportPlanRoute");
const supportResultRoute = require("./routes/supportResultRoute");
const orgRouter = require("./routes/orgRoute");
const eventRouter = require("./routes/eventRoute");
const sponsorRouter = require("./routes/sponsorRoute");
const approvalRouter = require("./routes/approvalRoute.js");
const path = require("path");
const signRouter = require("./routes/signUser");
const userRouter = require("./routes/userRoute");
const attachmentRouter = require("./routes/attachmentRoute");
const assign = require("./routes/assignRoute");
const historyRoute = require("./routes/historyRoute");
const managerRoute = require("./routes/managerRoute");
const authorityTransferRoute = require("./routes/authorityTransferRoute");
const applicationRoute = require("./routes/applicationRoute");
const kakaoPayRouter = require("./routes/kakaoPayRouter.js");
dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// 라우터
// app.use('/api', testRouter);

app.use("/test", testRouter);
app.use("/sponsor", sponsorRouter);
app.use("/survey", surveyRoute);
app.use("/counsel", counselRoute);
app.use("/plans", supportPlanRoute);
app.use("/result", supportResultRoute);
app.use("/organization", orgRouter);
app.use("/approvals", approvalRouter);
app.use("/event", eventRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // 첨부파일
app.use("/user", signRouter);
app.use("/userinfo", userRouter);
app.use("/attachment", attachmentRouter);
app.use("/assign", assign);
app.use("/histories", historyRoute);
app.use("/managers", managerRoute);
app.use("/authority-transfer", authorityTransferRoute);
app.use("/applications", applicationRoute);
app.use("/pay/kakao", kakaoPayRouter);

// const port = process.env.PORT;
const port = process.env.PORT;
app.listen(port, () => {
  console.log("[ server app.js 가동 완료 | http://localhost:3000/ ]");
});
