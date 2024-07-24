/**當月個案　sheet1 */
export class CaseMonthlyStatistics {
    constructor() { }
    OccurDate: string;
    /**個案類別(副) */
    Category: string;
    /** 副類別其他描述 */
    CategoryOther :string ;
    /** 個案類別(主) */
    CaseMainCategory:string ;
    /** 個案類別其他選項 */
    CaseMainCategoryOther :string ;
    /**教師身分呈報*/
    TeacherReportRole
    /** 教師編碼 */
    TeacherCounselNumber;
    /** 學生ID */
    StudentID: string; 
    /** 學生姓名 */
    TeacherName: string;
    /** 年級 */
    GradeYear: string;
    /** 學生年級 */
    StudentGender: string;
    /** 新舊個案 */
    Status: string; // 新或舊
    /** 個案類別*/
    Count: number = 0;
    /** 個案來源 */
    CaseSource :string ;
    /** 會裝對應的數字 (副類別) */
    CategoryValue: any[] = [];
    
    /** 會裝對應的數字 (主類別) */
    MainCategoryValueList :any[] =[];
    /**  學生類別 (對應數字) */
    StudentStatusList :any [] = [] ;
    /** 個案來源 (對應數字) */
    CaseSourceList :string  [] = [] ;
    
    /** 轉介概況 2022 */
    ReportReferal:string  ;    
    OtherCount: number = 0; // 其他服務
    OtherDetailCount: CaseMonthlyItemCount[] = [];
    CLevel: string; // 一級或二級輔導
    TeacherID: string;
    TeacherNickName: string;
    TeacherRole: string;   
    CaseNo :string  ;

    // 取得單項其他數量
    GetOtherDetailCount(name: string) {
        let value = 0;
        this.OtherDetailCount.forEach(item => {
            if (item.ItemName === name) {
                value = item.Count;
            }
        });

        return value;
    }

    AddOtherDetailCount(name: string) {
        let addValue: boolean = true;
        this.OtherDetailCount.forEach(item => {
            if (item.ItemName === name) {
                item.Count = item.Count + 1;
                addValue = false;
            }
        });
        if (addValue) {
            let item: CaseMonthlyItemCount = new CaseMonthlyItemCount();
            item.ItemName = name;
            item.Count = 1;
            this.OtherDetailCount.push(item);
        }
    }

    // 計算其他總數
    SumOtherDetailCount() {
        let value = 0;

        this.OtherDetailCount.forEach(item => {
            value = value + item.Count;
        });
        return value;
    }
}

/**報表2統計使用*/
export class CaseMonthlyStatistics2 {
    constructor() { }
    TeacherID: string;
    TeacherNickName: string;
    TeacherCounselNumber :string ;
    /** 呈報之教師身分 */
    TeacherReportRole :string;
    /** 系統之教師恩 */
    TeacherRole: string;
    /** 身分職稱 */
    JobTitle :string ;     
    OccurDate: string;n
    StudentID: string;
    TeacherName: string;
    ServiceItemOtherDetail :string ;
    // StudentGender: string;
    ServiceTarget :string ;
    ContactItem: string;
    ServiceItem: string;
    ContactName: string;
    CLevel: string; // 一級或二級輔導
    BoyCount: number = 0;
    GirlCount: number = 0;
    GenderOther :number = 0
}

export class CaseMonthlyItemCount {
    constructor() {
    }
    ItemName: string;
    Count: number = 0;
}


/** 產生報表時  教師代碼用  因為報表很多張(要分開去改 servie 很麻煩 一定從這邊抓) */
export interface TeacherCounselRole{
     TeacherID :string ;
     TeacherName :string ;
     Role :string ;
     TeacherCounselNumber ;
}
