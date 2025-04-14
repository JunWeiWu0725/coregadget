export interface SourceTeacherRec {
  TeacherId: string;
  TeacherName: string;
  Nickname: string;
  Gender: string;
  TeacherStatus: string;
  LinkAccount: string;
  TeacherCode: string;
  ClassId: string;
  ClassName: string;
}

export interface TeacherRec {
  TeacherId: string;
  TeacherName: string;
  Nickname: string;
  Gender: string;
  TeacherStatus: string;
  LinkAccount: string;
  TeacherCode: string;
  Classes: ClassRec[];
  Tags: TagTeacherRec[];
}

export interface ClassRec {
  ClassId: string;
  ClassName: string;
}

export interface TagRec {
  TagId: string;
  Prefix: string;
  Name: string;
  Color: string;
  AccessControlCode: string;
  UsageCount: number;
}

export interface TagTeacherRec {
  TagId: string;
  TagTeacherId: string;
  Prefix: string;
  Name: string;
  Color: string;
  AccessControlCode: string;
}