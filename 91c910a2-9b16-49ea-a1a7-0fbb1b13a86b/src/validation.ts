import { SchoolInfo, FormErrors } from './types';

/**
 * 驗證學校資料
 * @param data 學校資料
 * @returns 錯誤訊息物件
 */
export const validateSchoolInfo = (data: Partial<SchoolInfo>): FormErrors => {
  const errors: FormErrors = {};

  // 驗證學校代碼
  if (!data.Code?.trim()) {
    errors.Code = '請輸入學校代碼';
  }

  // 驗證學年度
  if (!data.DefaultSchoolYear) {
    errors.DefaultSchoolYear = '請輸入學年度';
  } else if (isNaN(Number(data.DefaultSchoolYear)) || !Number.isInteger(Number(data.DefaultSchoolYear)) || Number(data.DefaultSchoolYear) <= 0) {
    errors.DefaultSchoolYear = '學年度必須為正整數';
  }

  // 驗證學期
  if (!data.DefaultSemester) {
    errors.DefaultSemester = '請選擇學期';
  } else if (data.DefaultSemester !== 1 && data.DefaultSemester !== 2) {
    errors.DefaultSemester = '學期必須為 1 或 2';
  }

  // 驗證校園首頁網址
  if (data.WebUrl?.trim()) {
    try {
      new URL(data.WebUrl);
    } catch (e) {
      errors.WebUrl = '請輸入有效的網址';
    }
  }

  // 驗證學校中文名稱
  if (!data.ChineseName?.trim()) {
    errors.ChineseName = '請輸入學校中文名稱';
  }

  return errors;
};