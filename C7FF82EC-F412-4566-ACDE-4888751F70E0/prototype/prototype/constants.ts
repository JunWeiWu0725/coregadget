
import { ClassInfo, Field } from './types';

export const GRADES = [1, 2, 3, 6];

export const CLASSES: ClassInfo[] = [
  { id: '105', name: '105', grade: 1 },
  { id: '104', name: '104', grade: 1 },
  { id: '103', name: '103', grade: 1 },
  { id: '102', name: '102', grade: 1 },
  { id: '268', name: '268', grade: 2 },
  { id: '201', name: '201', grade: 2 },
  { id: '204', name: '204', grade: 2 },
  { id: '202', name: '202', grade: 2 },
  { id: '319', name: '319', grade: 3 },
  { id: '304', name: '304', grade: 3 },
  { id: '302', name: '302', grade: 3 },
  { id: '301', name: '301', grade: 3 },
  { id: '303-6', name: '303', grade: 6 }
];

export const FIELD_CATEGORIES = [
  '學生基本資料',
  '前級畢業資訊',
  '父母及監護人資料'
];

export const FIELDS: Field[] = [
  { id: 'nat_id', name: '國籍', category: '學生基本資料' },
  { id: 'birth', name: '出生日期', category: '學生基本資料' },
  { id: 'gender', name: '性別', category: '學生基本資料' },
  { id: 'eng_name', name: '英文姓名', category: '學生基本資料' },
  { id: 'phone', name: '聯絡電話', category: '學生基本資料' },
  { id: 'grad_sch', name: '畢業國小', category: '前級畢業資訊' },
  { id: 'grad_loc', name: '所在地', category: '前級畢業資訊' },
  { id: 'parent_name', name: '姓名', category: '父母及監護人資料' },
  { id: 'parent_id', name: '身分證號', category: '父母及監護人資料' },
  { id: 'parent_job', name: '職業', category: '父母及監護人資料' }
];
