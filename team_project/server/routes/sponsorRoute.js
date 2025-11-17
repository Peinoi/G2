const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 업로드 경로와 파일명 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    console.log("--- MULTER LOG: Destination Path ---", uploadPath); // 로그 추가!
    if (!fs.existsSync(uploadPath))
      console.log("--- MULTER LOG: Creating Upload Directory ---"); // 로그 추가!
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 한글 지원
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );

    // 날짜 접미사 (yyyyMMdd)
    const now = new Date();
    const year = now.getFullYear();
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    const day = ("0" + now.getDate()).slice(-2);
    const dateSuffix = `${year}${month}${day}`;

    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);

    cb(null, `${baseName}_${dateSuffix}${ext}`);
  },
});

const upload = multer({ storage });

const {
  sponsorUsersList,
  sponsorProgramAdd,
  sponsorUsers,
  sponsorProgramUpdate,
} = require("../services/sponsorService.js"); // sponsorUsers 추가

// [수정] 전체 목록 조회 및 조건 검색 처리 (클라이언트의 search()와 연동)
router.get("/", async (req, res) => {
  try {
    // 클라이언트에서 보낸 쿼리 파라미터(searchParams)를 req.query로 받습니다.
    const searchParams = req.query;

    // 파라미터가 있으면 조건 검색, 없으면 전체 검색을 서비스에서 처리합니다.
    const serviceSponsor = await sponsorUsersList(searchParams);
    // console.log("Route Layer | 검색 파라미터:", serviceSponsor);
    console.log("[ sponsorRoute.js || 전체/조건 조회 성공]");
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error("[ sponsorRoute.js || 전체/조건 조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});

// [수정] 단건 조회 처리
router.get("/:no", async (req, res) => {
  try {
    // URL 파라미터에서 프로그램 코드 (no)를 추출합니다.
    const programCode = req.params.no;

    // 단건 조회 서비스 호출
    const serviceSponsor = await sponsorUsers(programCode);

    console.log(`[ sponsorRoute.js || 단건 조회 (${programCode}) 성공]`);
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error("[ sponsorRoute.js || 단건 조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});

router.post("/", upload.array("attachments"), async (req, res) => {
  try {
    const clientData = req.body;
    console.log(clientData);
    // 첨부파일 정보
    const attachments = req.files.map((file) => ({
      original_filename: Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      ),
      server_filename: file.filename,
      file_path: `/uploads/${file.filename}`,
    }));

    const serviceSponsor = await sponsorProgramAdd(clientData, attachments);
    console.log("[ ProgramADD.js || routeProgramADD 성공]");
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error("[ ProgramADD.js || routeProgramADD 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});

router.put("/:no", async (req, res) => {
  try {
    const programCode = req.params.no;
    let clientData = req.body;
    clientData.program_code = programCode;
    console.log(clientData);
    const serviceSponsor = await sponsorProgramUpdate(clientData);
    console.log(
      "[ sponsorProgramUpdateRoute.js || sponsorProgramUpdateRoute 성공]"
    );
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error(
      "[ sponsorProgramUpdateRoute.js || sponsorProgramUpdateRoute 실패]",
      err.message
    );
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});
module.exports = router;
