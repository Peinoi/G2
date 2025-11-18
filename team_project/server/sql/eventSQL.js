// Table : event, sub_event, event_apply, event_result

// 이벤트 메인페이지
const selectEventMainpage = `
  SELECT 
    e.event_code,
    e.event_name,
    e.event_start_date,
    e.event_end_date,
    e.recruit_start_date,
    e.recruit_end_date,
    e.max_participants,
    COALESCE(SUM(se.sub_recruit_count), 0) AS total_sub_recruit_count,
    a.server_filename,
    a.file_path
  FROM event e
  LEFT JOIN sub_event se ON e.event_code = se.event_code
  LEFT JOIN (
    SELECT linked_record_pk, MIN(server_filename) AS server_filename, MIN(file_path) AS file_path
    FROM attachment
    WHERE linked_table_name = 'event'
      AND LOWER(SUBSTRING_INDEX(original_filename, '.', -1)) IN ('jpg', 'jpeg', 'png', 'gif')
    GROUP BY linked_record_pk
  ) a ON e.event_code = a.linked_record_pk
  GROUP BY e.event_code
  ORDER BY e.event_code DESC
`;

// 이벤트 목록(검색조건)
const selectEventList = `
  SELECT 
    e.event_code,
    e.user_code,
    e.event_name,
    e.event_register_date,
    e.event_start_date,
    e.event_end_date,
    e.recruit_start_date,
    e.recruit_end_date,
    e.max_participants,
    COALESCE(SUM(se.sub_recruit_count), 0) AS total_sub_recruit_count,
    a.server_filename,
    a.file_path,
    org.org_name AS org_name,
    u.name AS main_manager_name,
    e.register_status
  FROM event e
  LEFT JOIN sub_event se ON e.event_code = se.event_code
  LEFT JOIN (
    SELECT linked_record_pk, MIN(server_filename) AS server_filename, MIN(file_path) AS file_path
    FROM attachment
    WHERE linked_table_name = 'event'
      AND LOWER(SUBSTRING_INDEX(original_filename, '.', -1)) IN ('jpg', 'jpeg', 'png', 'gif')
    GROUP BY linked_record_pk
  ) a ON e.event_code = a.linked_record_pk
  LEFT JOIN organization org ON e.org_code = org.org_code
  LEFT JOIN users u ON e.user_code = u.user_code
  WHERE 1=1
    -- 모집상태
    AND (? IS NULL OR e.recruit_status = ?)
    -- 모집기간
    AND (? IS NULL OR e.recruit_start_date >= ?)
    AND (? IS NULL OR e.recruit_end_date <= ?)
    -- 시행기간
    AND (? IS NULL OR e.event_start_date >= ?)
    AND (? IS NULL OR e.event_end_date <= ?)
    -- 이벤트명
    AND (? IS NULL OR e.event_name LIKE CONCAT('%', ?, '%'))
  GROUP BY e.event_code
  ORDER BY e.event_code DESC
`;

// 이벤트 작성자별 계획/결과 목록(검색조건)
const selectEventApplyResult = `
  SELECT 
    e.event_code,
    e.user_code,
    e.event_name,
    e.event_register_date,
    e.event_start_date,
    e.event_end_date,
    e.recruit_start_date,
    e.recruit_end_date,
    e.max_participants,
    COALESCE(SUM(se.sub_recruit_count), 0) AS total_sub_recruit_count,
    a.server_filename,
    a.file_path,
    org.org_name AS org_name,
    u.name AS main_manager_name,
    e.register_status
  FROM event e
  LEFT JOIN sub_event se ON e.event_code = se.event_code
  LEFT JOIN (
    SELECT linked_record_pk, MIN(server_filename) AS server_filename, MIN(file_path) AS file_path
    FROM attachment
    WHERE linked_table_name = 'event'
      AND LOWER(SUBSTRING_INDEX(original_filename, '.', -1)) IN ('jpg', 'jpeg', 'png', 'gif')
    GROUP BY linked_record_pk
  ) a ON e.event_code = a.linked_record_pk
  LEFT JOIN organization org ON e.org_code = org.org_code
  LEFT JOIN users u ON e.user_code = u.user_code
  WHERE 1=1
    -- 모집상태
    AND (? IS NULL OR e.recruit_status = ?)
    -- 모집기간
    AND (? IS NULL OR e.recruit_start_date >= ?)
    AND (? IS NULL OR e.recruit_end_date <= ?)
    -- 시행기간
    AND (? IS NULL OR e.event_start_date >= ?)
    AND (? IS NULL OR e.event_end_date <= ?)
    -- 이벤트명
    AND (? IS NULL OR e.event_name LIKE CONCAT('%', ?, '%'))
    -- 이벤트 등록자명
    AND e.user_code = ?
  GROUP BY e.event_code
  ORDER BY e.event_code DESC
`;

// 첨부파일 등록
const insertAttachment = `
INSERT INTO attachment (
  original_filename,
  server_filename,
  file_path,
  linked_table_name,
  linked_record_pk
) VALUES (?, ?, ?, ?, ?)
`;

// 첨부파일 조회
const selectAttachList = `
SELECT
    attach_code,
    original_filename,
    server_filename,
    file_path
FROM attachment
WHERE linked_table_name = 'event'
  AND linked_record_pk = ?
`;

// 매니저 등록
const insertManager = `
INSERT INTO manager (
  manager_category,
  manager_category_code,
  manager_type,
  user_code
) VALUES (?, ?, ?, ?)
`;

// 매니저 조회
const selectManager = `
SELECT
    u.user_id,
    u.phone,
    u.email,
    u.department,
    m.manager_num,
    u.name AS manager_name,
    m.manager_type,
    m.manager_category
FROM manager m
LEFT JOIN users u ON m.user_code = u.user_code
WHERE m.manager_category_code IS NOT NULL
  AND m.manager_type IN ('DA1','DA2')
  AND m.manager_category = 'DB2'
  AND m.manager_category_code = ?
`;

// 이벤트 단건조회
const selectEventOne = `
SELECT 
    e.event_code,
    e.event_name,
    e.event_content,
    e.event_location,
    e.target_audience,
    e.max_participants,
    e.recruit_start_date,
    e.recruit_end_date,
    e.event_start_date,
    e.event_end_date,
    e.recruit_status, -- 코드값만
    e.event_type,     -- 코드값만
    org.org_name AS org_name,
    u.name AS main_manager_name
FROM event e
LEFT JOIN organization org ON e.org_code = org.org_code
LEFT JOIN users u ON e.user_code = u.user_code
WHERE e.event_code = ?
`;

// 이벤트 등록
const insertEvent = `
INSERT INTO event (
  org_code
 ,user_code
 ,event_name
 ,event_type
 ,event_content
 ,event_location
 ,target_audience
 ,max_participants
 ,recruit_start_date
 ,recruit_end_date
 ,event_start_date
 ,event_end_date
 ,recruit_status
 ,event_register_date
 ,register_status)
VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
`;

// 이벤트 신청 내역 등록
const insertEventApply = `
INSERT INTO event_apply (
  apply_date
 ,apply_type 
 ,user_code
 ,event_code
 ,sub_event_code)
VALUES ( ?, ?, ?, ?, ? )
`;

// 이벤트 신청 내역 조회
const selectEventApplyList = `
SELECT
    ea.apply_code,
    DATE_FORMAT(ea.apply_date, '%Y-%m-%d') AS apply_date,
    ea.apply_type,
    ea.apply_status,
    ea.user_code,
    ea.event_code,
    ea.sub_event_code,
    e.event_name,
    se.sub_event_name,
    -- 신청일정
    CASE
        WHEN ea.apply_type = 'DD1' THEN 
            CONCAT(
                DATE_FORMAT(e.event_start_date, '%Y-%m-%d'),
                ' ~ ',
                DATE_FORMAT(e.event_end_date, '%Y-%m-%d')
            )
        WHEN ea.apply_type = 'DD2' THEN 
            CONCAT(
                DATE_FORMAT(se.sub_event_start_date, '%Y-%m-%d %H:%i'),
                ' ~ ',
                DATE_FORMAT(se.sub_event_end_date, '%Y-%m-%d %H:%i')
            )
        ELSE '-'
    END AS apply_period,
    -- 신청인원
    CASE
        WHEN ea.apply_type = 'DD1' THEN
            (SELECT COUNT(*) FROM event_apply ea2 WHERE ea2.event_code = ea.event_code AND ea2.sub_event_code IS NULL)
        WHEN ea.apply_type = 'DD2' THEN
            (SELECT COUNT(*) FROM event_apply ea2 WHERE ea2.sub_event_code = ea.sub_event_code)
        ELSE 0
    END AS current_count,
    -- 마감인원
    CASE
        WHEN ea.apply_type = 'DD1' THEN e.max_participants
        WHEN ea.apply_type = 'DD2' THEN se.sub_recruit_count
        ELSE 0
    END AS max_count
FROM event_apply ea
LEFT JOIN event e ON ea.event_code = e.event_code
LEFT JOIN sub_event se ON ea.sub_event_code = se.sub_event_code
WHERE ea.user_code = ?
ORDER BY ea.apply_date DESC
`;

// 이벤트 신청 취소
const deleteEventApply = `
DELETE FROM event_apply
WHERE apply_code = ?
`;

// 이벤트 중복 신청 체크
const selectEventApplyExist = `
SELECT
  COUNT(*) AS cnt
 ,user_code
 ,event_code
 ,sub_event_code       
FROM event_apply
WHERE user_code = ?
  AND event_code = ?
  AND (sub_event_code = ? OR (sub_event_code IS NULL AND ? IS NULL))
`;

// 이벤트 수정
const updateEvent = `
UPDATE event
SET ?
WHERE event_code = ?
`;

// 이벤트 삭제
const deleteEvent = `
DELETE FROM event
WHERE event_code = ?`;

// 세부 이벤트 조회
const selectSubEventList = `
  SELECT 
    sub_event_code,
    sub_event_name,
    sub_event_start_date,
    sub_event_end_date,
    sub_recruit_count
FROM sub_event
WHERE event_code = ?
ORDER BY sub_event_code ASC
`;

// 세부 이벤트 등록
const insertSubEvent = `
INSERT INTO sub_event (
   sub_event_name
  ,sub_event_start_date
  ,sub_event_end_date
  ,sub_recruit_count
  ,event_code)
VALUES ( ?, ?, ?, ?, ? )
`;

// 세부 이벤트 수정
const updateSubEvent = `
UPDATE sub_event
SET ?
WHERE sub_event_code = ?
`;

// 세부 이벤트 삭제
const deleteSubEvent = `
DELETE FROM sub_event
WHERE sub_event_code = ?`;

module.exports = {
  selectEventMainpage,
  selectEventList,
  selectEventOne,
  insertEvent,
  insertEventApply,
  updateEvent,
  deleteEvent,
  selectSubEventList,
  insertSubEvent,
  updateSubEvent,
  deleteSubEvent,
  insertAttachment,
  insertManager,
  selectAttachList,
  selectManager,
  selectEventApplyExist,
  selectEventApplyList,
  deleteEventApply,
  selectEventApplyResult,
};
