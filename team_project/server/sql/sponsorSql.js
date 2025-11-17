//전체 조회
const sponsor_all = `select 
  program_code,
	program_name,
    sponsor_type,
    status,
    start_date,
    end_date,
    donation_type,
    donation_unit,
    goal_amount,
    current_amount,
    writer,
    create_date,
    approval_status
 from support_program`;

//단건 조회
const sponsor_search = `select
    program_code,
	  program_name,
    sponsor_type,
    status,
    start_date,
    end_date,
    donation_type,
    donation_unit,
    goal_amount,
    current_amount,
    writer,
    create_date,
    approval_status
 from support_program
 where program_code = ?`;

// //조건 조회
// const sponsor_search_condition = `select
//             program_code,
//             program_name,
//             sponsor_type,
//             status,
//             start_date,
//             end_date,
//             donation_type,
//             donation_unit,
//             goal_amount,
//             current_amount,
//             writer,
//             create_date,
//             approval_status
//      from support_program
//     where 1=1
//     AND program_code = IFNULL(:programCode, program_code)
//     AND sponsor_type = IFNULL(:sponsorType, sponsor_type)
//     AND status = IFNULL(:status, status)
//     AND (
//         (start_date <= :endDate AND end_date >= :startDate)
//         OR (:startDate IS NULL OR :startDate = '')
//     )
//  `;
//등록
const sponsor_program = `
  insert into support_program  (
    program_name,
    sponsor_type,
    status,
    start_date,
    end_date,
    donation_type,
    donation_unit,
    goal_amount,
    current_amount,
    writer,
    create_date,
    approval_status
)    
values (?,?,?,?,?,?,?,?,?,?,?,?)
 `;

//수정
const sponsor_update = `
  update support_program set
    program_name = ?,
    sponsor_type = ?,
    status = ?,
    start_date = ?,
    end_date = ?,
    donation_type = ?,
    donation_unit = ?,
    goal_amount = ?,
    approval_status = ?
    where program_code = ?
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
WHERE linked_table_name = 'support_program'
  AND linked_record_pk = ?
`;

// 첨부파일 한 건 삭제
const deleteAttachmentByCode = `
    DELETE FROM attachment
    WHERE linked_record_pk = ?
      AND linked_table_name = 'support_program'
  `;
module.exports = {
  sponsor_all,
  sponsor_program,
  sponsor_search,
  // sponsor_search_condition,
  sponsor_update,
  insertAttachment,
  selectAttachList,
  deleteAttachmentByCode,
};
