export class Course {
  Capacity: string;
  ClassName: string;
  Classroom: string;
  CourseID: string;
  CourseName: string;
  CourseTimeInfo: string;
  CourseType: string;
  Credit: string;
  Memo: string;
  NewSubjectCode: string;
  SerialNo: string;
  Syllabus: string;
  TeacherName: string;
  TeacherURLName: string;

  /**是否需點數選課 */
  NeedPoints: string;
  MaxPoints: string;
  MinPoints: string;

  /**學生投入的點數 */
  StudentSetPoints: number;
  /**投點點數有誤 */
  PointIsError: boolean;
  ErrorMsg: string;

  /**要退選 */
  WillQuit: boolean;

  /**要加選 */
  WillAdd: boolean;

  /**目前衝突課程清單 */
  HaveConflict: string[];

  /**選課來自哪個階段 */
  ChooseItem: any;

  Time: string;

  /**第一階段選課人數 */
  Item1StudentCount: string;

  /**第二階段選課人數 */
  Item2StudentCount: string;

  /**總選課人數 */
  TotalStudentCount: string;

  /**剩餘名額 */
  RemainderCapacity: string;

  /**投點點數排行 */
  Ranks: any;

  /**顯示排名 */
  InvestmentRank: string;

  /**投點歷程編號 */
  RefConsumeID: string;

  /**課程影片 */
  VideoFile: string;
}