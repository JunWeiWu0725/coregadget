export class TeacherCounselRole {
    
    constructor() {

     }
    TeacherID: string;
    Role: string;
    TeacherName: string;
    /** 教師編碼 (月報表使用) */
    TeacherCounselNumber:string ="";
    /** 輔導人力身分 (月報表使用) */
    TeacherReportRole :string = "" ;
    /** 身分職稱 */
    JobTitle : string  = "" ;
    /** 編輯模式 */
    isAddMode :boolean  = false ;
    isChage: boolean = false;
    Order: number;
    setAddMode(){ this.isAddMode = true }
    parseOrder() {
        if (this.Role === '輔導主任') {
            this.Order = 1;
        }else if (this.Role === '輔導組長')
        {
            this.Order = 2;
        }else if (this.Role === '專任輔導')
        {
            this.Order = 3;
        }else if (this.Role === '兼任輔導')
        {
            this.Order = 4;
        }else if (this.Role === '認輔老師')
        {
            this.Order = 5;
        }else {
            this.Order = 999;
        }
    }
}