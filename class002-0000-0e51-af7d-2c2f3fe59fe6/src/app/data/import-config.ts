export type ImportMode = 'ADD' | 'EDIT';

export interface ImportFieldRec {
  name: string;
  value: string;
  selected: boolean;
  disabled: boolean;
  hidden: boolean;
}

export type ClassFieldName = 'ClassId' | 'ClassName' | 'GradeYear' | 'ClassCode'
  | 'TeacherFullName' | 'TeacherId' | 'TeacherIdSecondary';