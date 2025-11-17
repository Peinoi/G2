export const sponsorMenu = [
  {
    label: "후원 프로그램 목록",
    path: "/sponsorProgramList",
    collapseRef: "sponsorProgramList",
    role: ["AA1", "AA2", "AA3"],
  },
  {
    label: "후원 프로그램 관리",
    path: "/sponsor",
    collapseRef: "sponsor",
    role: ["AA2", "AA3"],
  },
  {
    label: "담당자 관리",
    path: "/manager",
    collapseRef: "tables",
    role: ["AA2"],
  },
  {
    label: "전체 후원 거래 내역서",
    path: "/report",
    collapseRef: "billing",
    role: ["AA2", "AA3"],
  },
  {
    label: "활동 보고서",
    path: "/activity",
    collapseRef: "rtl-page",
    role: ["AA1", "AA2", "AA3"],
  },
  {
    label: "총괄표 관리",
    path: "/summary",
    collapseRef: "notifications",
    role: ["AA3"],
  },
  {
    label: "후원 보고서 관리",
    path: "/profile",
    collapseRef: "profile",
    role: ["AA2", "AA3"],
  },
  {
    label: "분기 통지 / 발송 이력",
    path: "/notice",
    collapseRef: "sign-in",
    role: ["AA1", "AA2", "AA3"],
  },
];

export const eventMenu = [
  {
    label: "이벤트 메인페이지",
    path: "/event",
    collapseRef: "Event",
    role: ["AA1", "AA2", "AA3"],
  },
  {
    label: "이벤트 목록",
    path: "/event/list",
    collapseRef: "EventList",
    role: ["AA2", "AA3"],
  },
];
