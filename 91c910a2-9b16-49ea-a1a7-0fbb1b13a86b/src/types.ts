/**
 * 學校基本資料介面
 */
export interface SchoolInfo {
  // 學校基本資訊
  Code: string;               // 學校代碼
  DefaultSchoolYear: number;  // 學年度
  DefaultSemester: number;    // 學期
  WebUrl: string;             // 校園首頁網址

  // 學校名稱與地址
  ChineseName: string;        // 學校中文名稱
  EnglishName: string;        // 學校英文名稱
  Address: string;            // 學校中文地址
  EnglishAddress: string;     // 學校英文地址

  // 聯絡資訊
  Telephone: string;          // 學校電話
  Fax: string;                // 學校傳真

  // 主管資訊
  ChancellorChineseName: string;  // 校長中文姓名
  ChancellorEnglishName: string;  // 校長英文姓名
  EduDirectorName: string;        // 教務主任姓名
  StuDirectorName: string;        // 學務主任姓名
}

/**
 * 表單錯誤介面
 */
export interface FormErrors {
  [key: string]: string;
}