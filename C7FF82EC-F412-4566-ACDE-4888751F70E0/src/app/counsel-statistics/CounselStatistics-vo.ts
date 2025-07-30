import * as moment from 'moment';
import * as node2json from 'nodexml';

export class QuizInfoReport {
    QuizID: string;
    QuizName: string;
    ImplementationDate: moment.Moment;
    ImplementationDateStr: string;
    UseMappingTable: boolean = false;

    GetQuizType() {
        if (this.UseMappingTable) {
            return '常模轉換';
        } else {
            return '自訂項目';
        }
    }
}

export class ClassStudentCountReport {
    ClassID: string;
    GradeYear: number = 0;
    ClassName: string;
    StudentCount: number;
    ItemCountList: ItemCount[] = [];
    StudentDataSource: any[] = [];

    // 計算統計
    CalcCPM_P() {
        // 智能優異PR＞=95
        // 智能在平均數以上90＜PR＜=94
        // 智能在平均數以上75＜=PR＜=90
        // 平均智能25＜PR＜75
        // 智能在平均數以下 5＜PR＜=25
        // 智能缺陷PR＜=5

        this.ItemCountList = [];
        // 項目
        let item1: ItemCount = new ItemCount();
        item1.Name = '智能優異(PR＞=95)';
        item1.Count = 0;
        item1.pst = 0;
        let item2: ItemCount = new ItemCount();
        item2.Name = '智能在平均數以上(PR >=90 且 PR＜95)';
        item2.Count = 0;
        item2.pst = 0;
        let item3: ItemCount = new ItemCount();
        item3.Name = '智能在平均數以上(PR >=75 且 PR＜90)';
        item3.Count = 0;
        item3.pst = 0;
        let item4: ItemCount = new ItemCount();
        item4.Name = '平均智能(PR >=25 且 PR＜75)';
        item4.Count = 0;
        item4.pst = 0;
        let item5: ItemCount = new ItemCount();
        item5.Name = '智能在平均數以下(PR >=5 且 PR＜25)';
        item5.Count = 0;
        item5.pst = 0;
        let item6: ItemCount = new ItemCount();
        item6.Name = '智能缺陷(PR＜5)';
        item6.Count = 0;
        item6.pst = 0;
        this.ItemCountList.push(item1);
        this.ItemCountList.push(item2);
        this.ItemCountList.push(item3);
        this.ItemCountList.push(item4);
        this.ItemCountList.push(item5);
        this.ItemCountList.push(item6);

        // 解析出學生資料
        this.StudentDataSource.forEach(studItem => {
            let xq = [].concat(node2json.xml2obj('<root>' + studItem.content + '</root>') || []);

            if (xq.length > 0) {
                if (xq[0].root && xq[0].root.Item) {
                    let items = [].concat(xq[0].root.Item || []);
                    items.forEach(subItem => {
                        if (subItem.name === '常模分數') {
                            if (subItem.value) {
                                let val: number = parseFloat(subItem.value);
                                if (val) {
                                    if (val >= 95)
                                        this.ItemCountList[0].Count++;

                                    if (val >= 90 && val < 75)
                                        this.ItemCountList[1].Count++;

                                    if (val >= 75 && val < 90)
                                        this.ItemCountList[2].Count++;

                                    if (val >= 25 && val < 75)
                                        this.ItemCountList[3].Count++;
                                    if (val >= 5 && val < 25)
                                        this.ItemCountList[4].Count++;
                                    if (val < 5)
                                        this.ItemCountList[5].Count++;

                                }
                            }

                        }
                    });
                }
            }

        });

        // 計算百分比
        if (this.StudentCount > 0) {
            this.ItemCountList.forEach(item => {
                item.pst = round(item.Count / this.StudentCount * 100, 2);
            });
        }
    }
}

var round = function (val, precision) {
    return Math.round(Math.round(val * Math.pow(10, (precision || 0) + 1)) / 10) / Math.pow(10, (precision || 0));
}

export class ItemCount {
    Name: string;
    Count: number;
    pst: number;
}

// 年級資訊
export class GradeInfo {
    GradeYear: number;
    GradeYearStr: string;
    Checked: boolean = false;
    id: string = '';
    SetGradeYearCheck() {
        this.Checked = !this.Checked;
    }
}


export class CounselClass {
    constructor() { }
    id: string = '';
    ClassID: string;
    ClassName: string;
    GradeYear: number;
    Checked: boolean = false;

    SetClassCheck() {
        this.Checked = !this.Checked;
    }

    getCheckClass() {
        if (this.Checked) {
            return 'class-select-section-selected';
        } else {
            return 'class-select-section';
        }
    }
}

export class GradeClassInfo {
    GradeYear: number;
    GradeYearStr: string;
    Checked: boolean = false;
    ClassItems: CounselClass[] = [];
    id: string = '';
    SetGradeYearCheck() {
        this.Checked = !this.Checked;
    }
    isOpen :boolean =false;
}

/**
 * 試別
 */
export class ExamInfo {
    ExamID: string;
    ExamName: string;
    DisplayOrder: number; // 資料庫disPlay
    SelectedOrder: number; // 學生選取後試別排序

}


export class PrintDataSource {
    StudentID: string;
    SchoolYear: string;
    Semester: string;
}

/**
 *選組分析筆表輸出用 =>由下面funcition 產出

 */
export class GroupSelectAnyls {
    StudentID: String;
    StudentName: String;
    ClassName: String;
    ClassTeacher: String;
    SeatNo: String;
    FirstSchoolYear: String;
    SecondSchoolYear: String;
    Sems1_subj1_SubjName: String = "";
    Sems1_subj1_Credit: String = "";
    Sems1_subj1_IsRequire: String = "";
    Sems1_subj1_Reg1SubjScore: String = "";
    Sems1_subj1_Reg1SubjPR: String = "";
    Sems1_subj1_Reg2SubjScore: String = "";
    Sems1_subj1_Reg2SubjPR: String = "";
    Sems1_subj1_FinalSubjSocre: String = "";
    Sems1_subj1_FinalSubjPR: String = "";
    Sems1_subj1_SemsSubScore: String = "";
    Sems1_subj1_SemsSubjPR: String = "";
    Sems1_subj2_SubjName: String = "";
    Sems1_subj2_Credit: String = "";
    Sems1_subj2_IsRequire: String = "";
    Sems1_subj2_Reg1SubjScore: String = "";
    Sems1_subj2_Reg1SubjPR: String = "";
    Sems1_subj2_Reg2SubjScore: String = "";
    Sems1_subj2_Reg2SubjPR: String = "";
    Sems1_subj2_FinalSubjSocre: String = "";
    Sems1_subj2_FinalSubjPR: String = "";
    Sems1_subj2_SemsSubScore: String = "";
    Sems1_subj2_SemsSubjPR: String = "";
    Sems1_subj3_SubjName: String = "";
    Sems1_subj3_Credit: String = "";
    Sems1_subj3_IsRequire: String = "";
    Sems1_subj3_Reg1SubjScore: String = "";
    Sems1_subj3_Reg1SubjPR: String = "";
    Sems1_subj3_Reg2SubjScore: String = "";
    Sems1_subj3_Reg2SubjPR: String = "";
    Sems1_subj3_FinalSubjSocre: String = "";
    Sems1_subj3_FinalSubjPR: String = "";
    Sems1_subj3_SemsSubScore: String = "";
    Sems1_subj3_SemsSubjPR: String = "";
    Sems1_subj4_SubjName: String = "";
    Sems1_subj4_Credit: String = "";
    Sems1_subj4_IsRequire: String = "";
    Sems1_subj4_Reg1SubjScore: String = "";
    Sems1_subj4_Reg1SubjPR: String = "";
    Sems1_subj4_Reg2SubjScore: String = "";
    Sems1_subj4_Reg2SubjPR: String = "";
    Sems1_subj4_FinalSubjSocre: String = "";
    Sems1_subj4_FinalSubjPR: String = "";
    Sems1_subj4_SemsSubScore: String = "";
    Sems1_subj4_SemsSubjPR: String = "";
    Sems1_subj5_SubjName: String = "";
    Sems1_subj5_Credit: String = "";
    Sems1_subj5_IsRequire: String = "";
    Sems1_subj5_Reg1SubjScore: String = "";
    Sems1_subj5_Reg1SubjPR: String = "";
    Sems1_subj5_Reg2SubjScore: String = "";
    Sems1_subj5_Reg2SubjPR: String = "";
    Sems1_subj5_FinalSubjSocre: String = "";
    Sems1_subj5_FinalSubjPR: String = "";
    Sems1_subj5_SemsSubScore: String = "";
    Sems1_subj5_SemsSubjPR: String = "";
    Sems1_subj6_SubjName: String = "";
    Sems1_subj6_Credit: String = "";
    Sems1_subj6_IsRequire: String = "";
    Sems1_subj6_Reg1SubjScore: String = "";
    Sems1_subj6_Reg1SubjPR: String = "";
    Sems1_subj6_Reg2SubjScore: String = "";
    Sems1_subj6_Reg2SubjPR: String = "";
    Sems1_subj6_FinalSubjSocre: String = "";
    Sems1_subj6_FinalSubjPR: String = "";
    Sems1_subj6_SemsSubScore: String = "";
    Sems1_subj6_SemsSubjPR: String = "";
    Sems1_subj7_SubjName: String = "";
    Sems1_subj7_Credit: String = "";
    Sems1_subj7_IsRequire: String = "";
    Sems1_subj7_Reg1SubjScore: String = "";
    Sems1_subj7_Reg1SubjPR: String = "";
    Sems1_subj7_Reg2SubjScore: String = "";
    Sems1_subj7_Reg2SubjPR: String = "";
    Sems1_subj7_FinalSubjSocre: String = "";
    Sems1_subj7_FinalSubjPR: String = "";
    Sems1_subj7_SemsSubScore: String = "";
    Sems1_subj7_SemsSubjPR: String = "";
    Sems1_subj8_SubjName: String = "";
    Sems1_subj8_Credit: String = "";
    Sems1_subj8_IsRequire: String = "";
    Sems1_subj8_Reg1SubjScore: String = "";
    Sems1_subj8_Reg1SubjPR: String = "";
    Sems1_subj8_Reg2SubjScore: String = "";
    Sems1_subj8_Reg2SubjPR: String = "";
    Sems1_subj8_FinalSubjSocre: String = "";
    Sems1_subj8_FinalSubjPR: String = "";
    Sems1_subj8_SemsSubScore: String = "";
    Sems1_subj8_SemsSubjPR: String = "";
    Sems1_subj9_SubjName: String = "";
    Sems1_subj9_Credit: String = "";
    Sems1_subj9_IsRequire: String = "";
    Sems1_subj9_Reg1SubjScore: String = "";
    Sems1_subj9_Reg1SubjPR: String = "";
    Sems1_subj9_Reg2SubjScore: String = "";
    Sems1_subj9_Reg2SubjPR: String = "";
    Sems1_subj9_FinalSubjSocre: String = "";
    Sems1_subj9_FinalSubjPR: String = "";
    Sems1_subj9_SemsSubScore: String = "";
    Sems1_subj9_SemsSubjPR: String = "";
    Sems1_subj10_SubjName: String = "";
    Sems1_subj10_Credit: String = "";
    Sems1_subj10_IsRequire: String = "";
    Sems1_subj10_Reg1SubjScore: String = "";
    Sems1_subj10_Reg1SubjPR: String = "";
    Sems1_subj10_Reg2SubjScore: String = "";
    Sems1_subj10_Reg2SubjPR: String = "";
    Sems1_subj10_FinalSubjSocre: String = "";
    Sems1_subj10_FinalSubjPR: String = "";
    Sems1_subj10_SemsSubScore: String = "";
    Sems1_subj10_SemsSubjPR: String = "";
    Sems1_subj11_SubjName: String = "";
    Sems1_subj11_Credit: String = "";
    Sems1_subj11_IsRequire: String = "";
    Sems1_subj11_Reg1SubjScore: String = "";
    Sems1_subj11_Reg1SubjPR: String = "";
    Sems1_subj11_Reg2SubjScore: String = "";
    Sems1_subj11_Reg2SubjPR: String = "";
    Sems1_subj11_FinalSubjSocre: String = "";
    Sems1_subj11_FinalSubjPR: String = "";
    Sems1_subj11_SemsSubScore: String = "";
    Sems1_subj11_SemsSubjPR: String = "";
    Sems1_subj12_SubjName: String = "";
    Sems1_subj12_Credit: String = "";
    Sems1_subj12_IsRequire: String = "";
    Sems1_subj12_Reg1SubjScore: String = "";
    Sems1_subj12_Reg1SubjPR: String = "";
    Sems1_subj12_Reg2SubjScore: String = "";
    Sems1_subj12_Reg2SubjPR: String = "";
    Sems1_subj12_FinalSubjSocre: String = "";
    Sems1_subj12_FinalSubjPR: String = "";
    Sems1_subj12_SemsSubScore: String = "";
    Sems1_subj12_SemsSubjPR: String = "";
    Sems1_subj13_SubjName: String = "";
    Sems1_subj13_Credit: String = "";
    Sems1_subj13_IsRequire: String = "";
    Sems1_subj13_Reg1SubjScore: String = "";
    Sems1_subj13_Reg1SubjPR: String = "";
    Sems1_subj13_Reg2SubjScore: String = "";
    Sems1_subj13_Reg2SubjPR: String = "";
    Sems1_subj13_FinalSubjSocre: String = "";
    Sems1_subj13_FinalSubjPR: String = "";
    Sems1_subj13_SemsSubScore: String = "";
    Sems1_subj13_SemsSubjPR: String = "";
    Sems1_subj14_SubjName: String = "";
    Sems1_subj14_Credit: String = "";
    Sems1_subj14_IsRequire: String = "";
    Sems1_subj14_Reg1SubjScore: String = "";
    Sems1_subj14_Reg1SubjPR: String = "";
    Sems1_subj14_Reg2SubjScore: String = "";
    Sems1_subj14_Reg2SubjPR: String = "";
    Sems1_subj14_FinalSubjSocre: String = "";
    Sems1_subj14_FinalSubjPR: String = "";
    Sems1_subj14_SemsSubScore: String = "";
    Sems1_subj14_SemsSubjPR: String = "";
    Sems1_subj15_SubjName: String = "";
    Sems1_subj15_Credit: String = "";
    Sems1_subj15_IsRequire: String = "";
    Sems1_subj15_Reg1SubjScore: String = "";
    Sems1_subj15_Reg1SubjPR: String = "";
    Sems1_subj15_Reg2SubjScore: String = "";
    Sems1_subj15_Reg2SubjPR: String = "";
    Sems1_subj15_FinalSubjSocre: String = "";
    Sems1_subj15_FinalSubjPR: String = "";
    Sems1_subj15_SemsSubScore: String = "";
    Sems1_subj15_SemsSubjPR: String = "";
    Sems1_subj16_SubjName: String = "";
    Sems1_subj16_Credit: String = "";
    Sems1_subj16_IsRequire: String = "";
    Sems1_subj16_Reg1SubjScore: String = "";
    Sems1_subj16_Reg1SubjPR: String = "";
    Sems1_subj16_Reg2SubjScore: String = "";
    Sems1_subj16_Reg2SubjPR: String = "";
    Sems1_subj16_FinalSubjSocre: String = "";
    Sems1_subj16_FinalSubjPR: String = "";
    Sems1_subj16_SemsSubScore: String = "";
    Sems1_subj16_SemsSubjPR: String = "";
    Sems1_subj17_SubjName: String = "";
    Sems1_subj17_Credit: String = "";
    Sems1_subj17_IsRequire: String = "";
    Sems1_subj17_Reg1SubjScore: String = "";
    Sems1_subj17_Reg1SubjPR: String = "";
    Sems1_subj17_Reg2SubjScore: String = "";
    Sems1_subj17_Reg2SubjPR: String = "";
    Sems1_subj17_FinalSubjSocre: String = "";
    Sems1_subj17_FinalSubjPR: String = "";
    Sems1_subj17_SemsSubScore: String = "";
    Sems1_subj17_SemsSubjPR: String = "";
    Sems1_subj18_SubjName: String = "";
    Sems1_subj18_Credit: String = "";
    Sems1_subj18_IsRequire: String = "";
    Sems1_subj18_Reg1SubjScore: String = "";
    Sems1_subj18_Reg1SubjPR: String = "";
    Sems1_subj18_Reg2SubjScore: String = "";
    Sems1_subj18_Reg2SubjPR: String = "";
    Sems1_subj18_FinalSubjSocre: String = "";
    Sems1_subj18_FinalSubjPR: String = "";
    Sems1_subj18_SemsSubScore: String = "";
    Sems1_subj18_SemsSubjPR: String = "";
    Sems1_subj19_SubjName: String = "";
    Sems1_subj19_Credit: String = "";
    Sems1_subj19_IsRequire: String = "";
    Sems1_subj19_Reg1SubjScore: String = "";
    Sems1_subj19_Reg1SubjPR: String = "";
    Sems1_subj19_Reg2SubjScore: String = "";
    Sems1_subj19_Reg2SubjPR: String = "";
    Sems1_subj19_FinalSubjSocre: String = "";
    Sems1_subj19_FinalSubjPR: String = "";
    Sems1_subj19_SemsSubScore: String = "";
    Sems1_subj19_SemsSubjPR: String = "";
    Sems1_subj20_SubjName: String = "";
    Sems1_subj20_Credit: String = "";
    Sems1_subj20_IsRequire: String = "";
    Sems1_subj20_Reg1SubjScore: String = "";
    Sems1_subj20_Reg1SubjPR: String = "";
    Sems1_subj20_Reg2SubjScore: String = "";
    Sems1_subj20_Reg2SubjPR: String = "";
    Sems1_subj20_FinalSubjSocre: String = "";
    Sems1_subj20_FinalSubjPR: String = "";
    Sems1_subj20_SemsSubScore: String = "";
    Sems1_subj20_SemsSubjPR: String = "";
    Sems1_subj21_SubjName: String = "";
    Sems1_subj21_Credit: String = "";
    Sems1_subj21_IsRequire: String = "";
    Sems1_subj21_Reg1SubjScore: String = "";
    Sems1_subj21_Reg1SubjPR: String = "";
    Sems1_subj21_Reg2SubjScore: String = "";
    Sems1_subj21_Reg2SubjPR: String = "";
    Sems1_subj21_FinalSubjSocre: String = "";
    Sems1_subj21_FinalSubjPR: String = "";
    Sems1_subj21_SemsSubScore: String = "";
    Sems1_subj21_SemsSubjPR: String = "";
    Sems1_subj22_SubjName: String = "";
    Sems1_subj22_Credit: String = "";
    Sems1_subj22_IsRequire: String = "";
    Sems1_subj22_Reg1SubjScore: String = "";
    Sems1_subj22_Reg1SubjPR: String = "";
    Sems1_subj22_Reg2SubjScore: String = "";
    Sems1_subj22_Reg2SubjPR: String = "";
    Sems1_subj22_FinalSubjSocre: String = "";
    Sems1_subj22_FinalSubjPR: String = "";
    Sems1_subj22_SemsSubScore: String = "";
    Sems1_subj22_SemsSubjPR: String = "";
    Sems1_subj23_SubjName: String = "";
    Sems1_subj23_Credit: String = "";
    Sems1_subj23_IsRequire: String = "";
    Sems1_subj23_Reg1SubjScore: String = "";
    Sems1_subj23_Reg1SubjPR: String = "";
    Sems1_subj23_Reg2SubjScore: String = "";
    Sems1_subj23_Reg2SubjPR: String = "";
    Sems1_subj23_FinalSubjSocre: String = "";
    Sems1_subj23_FinalSubjPR: String = "";
    Sems1_subj23_SemsSubScore: String = "";
    Sems1_subj23_SemsSubjPR: String = "";
    Sems1_subj24_SubjName: String = "";
    Sems1_subj24_Credit: String = "";
    Sems1_subj24_IsRequire: String = "";
    Sems1_subj24_Reg1SubjScore: String = "";
    Sems1_subj24_Reg1SubjPR: String = "";
    Sems1_subj24_Reg2SubjScore: String = "";
    Sems1_subj24_Reg2SubjPR: String = "";
    Sems1_subj24_FinalSubjSocre: String = "";
    Sems1_subj24_FinalSubjPR: String = "";
    Sems1_subj24_SemsSubScore: String = "";
    Sems1_subj24_SemsSubjPR: String = "";
    Sems1_subj25_SubjName: String = "";
    Sems1_subj25_Credit: String = "";
    Sems1_subj25_IsRequire: String = "";
    Sems1_subj25_Reg1SubjScore: String = "";
    Sems1_subj25_Reg1SubjPR: String = "";
    Sems1_subj25_Reg2SubjScore: String = "";
    Sems1_subj25_Reg2SubjPR: String = "";
    Sems1_subj25_FinalSubjSocre: String = "";
    Sems1_subj25_FinalSubjPR: String = "";
    Sems1_subj25_SemsSubScore: String = "";
    Sems1_subj25_SemsSubjPR: String = "";
    Sems1_subj26_SubjName: String = "";
    Sems1_subj26_Credit: String = "";
    Sems1_subj26_IsRequire: String = "";
    Sems1_subj26_Reg1SubjScore: String = "";
    Sems1_subj26_Reg1SubjPR: String = "";
    Sems1_subj26_Reg2SubjScore: String = "";
    Sems1_subj26_Reg2SubjPR: String = "";
    Sems1_subj26_FinalSubjSocre: String = "";
    Sems1_subj26_FinalSubjPR: String = "";
    Sems1_subj26_SemsSubScore: String = "";
    Sems1_subj26_SemsSubjPR: String = "";
    Sems1_subj27_SubjName: String = "";
    Sems1_subj27_Credit: String = "";
    Sems1_subj27_IsRequire: String = "";
    Sems1_subj27_Reg1SubjScore: String = "";
    Sems1_subj27_Reg1SubjPR: String = "";
    Sems1_subj27_Reg2SubjScore: String = "";
    Sems1_subj27_Reg2SubjPR: String = "";
    Sems1_subj27_FinalSubjSocre: String = "";
    Sems1_subj27_FinalSubjPR: String = "";
    Sems1_subj27_SemsSubScore: String = "";
    Sems1_subj27_SemsSubjPR: String = "";
    Sems1_subj28_SubjName: String = "";
    Sems1_subj28_Credit: String = "";
    Sems1_subj28_IsRequire: String = "";
    Sems1_subj28_Reg1SubjScore: String = "";
    Sems1_subj28_Reg1SubjPR: String = "";
    Sems1_subj28_Reg2SubjScore: String = "";
    Sems1_subj28_Reg2SubjPR: String = "";
    Sems1_subj28_FinalSubjSocre: String = "";
    Sems1_subj28_FinalSubjPR: String = "";
    Sems1_subj28_SemsSubScore: String = "";
    Sems1_subj28_SemsSubjPR: String = "";
    Sems1_subj29_SubjName: String = "";
    Sems1_subj29_Credit: String = "";
    Sems1_subj29_IsRequire: String = "";
    Sems1_subj29_Reg1SubjScore: String = "";
    Sems1_subj29_Reg1SubjPR: String = "";
    Sems1_subj29_Reg2SubjScore: String = "";
    Sems1_subj29_Reg2SubjPR: String = "";
    Sems1_subj29_FinalSubjSocre: String = "";
    Sems1_subj29_FinalSubjPR: String = "";
    Sems1_subj29_SemsSubScore: String = "";
    Sems1_subj29_SemsSubjPR: String = "";
    Sems1_subj30_SubjName: String = "";
    Sems1_subj30_Credit: String = "";
    Sems1_subj30_IsRequire: String = "";
    Sems1_subj30_Reg1SubjScore: String = "";
    Sems1_subj30_Reg1SubjPR: String = "";
    Sems1_subj30_Reg2SubjScore: String = "";
    Sems1_subj30_Reg2SubjPR: String = "";
    Sems1_subj30_FinalSubjSocre: String = "";
    Sems1_subj30_FinalSubjPR: String = "";
    Sems1_subj30_SemsSubScore: String = "";
    Sems1_subj30_SemsSubjPR: String = "";
    // 第二學期
    Sems2_subj1_SubjName: String = "";
    Sems2_subj1_Credit: String = "";
    Sems2_subj1_IsRequire: String = "";
    Sems2_subj1_Reg1SubjScore: String = "";
    Sems2_subj1_Reg1SubjPR: String = "";
    Sems2_subj1_Reg2SubjScore: String = "";
    Sems2_subj1_Reg2SubjPR: String = "";
    Sems2_subj2_SubjName: String = "";
    Sems2_subj2_Credit: String = "";
    Sems2_subj2_IsRequire: String = "";
    Sems2_subj2_Reg1SubjScore: String = "";
    Sems2_subj2_Reg1SubjPR: String = "";
    Sems2_subj2_Reg2SubjScore: String = "";
    Sems2_subj2_Reg2SubjPR: String = "";
    Sems2_subj3_SubjName: String = "";
    Sems2_subj3_Credit: String = "";
    Sems2_subj3_IsRequire: String = "";
    Sems2_subj3_Reg1SubjScore: String = "";
    Sems2_subj3_Reg1SubjPR: String = "";
    Sems2_subj3_Reg2SubjScore: String = "";
    Sems2_subj3_Reg2SubjPR: String = "";
    Sems2_subj4_SubjName: String = "";
    Sems2_subj4_Credit: String = "";
    Sems2_subj4_IsRequire: String = "";
    Sems2_subj4_Reg1SubjScore: String = "";
    Sems2_subj4_Reg1SubjPR: String = "";
    Sems2_subj4_Reg2SubjScore: String = "";
    Sems2_subj4_Reg2SubjPR: String = "";
    Sems2_subj5_SubjName: String = "";
    Sems2_subj5_Credit: String = "";
    Sems2_subj5_IsRequire: String = "";
    Sems2_subj5_Reg1SubjScore: String = "";
    Sems2_subj5_Reg1SubjPR: String = "";
    Sems2_subj5_Reg2SubjScore: String = "";
    Sems2_subj5_Reg2SubjPR: String = "";
    Sems2_subj6_SubjName: String = "";
    Sems2_subj6_Credit: String = "";
    Sems2_subj6_IsRequire: String = "";
    Sems2_subj6_Reg1SubjScore: String = "";
    Sems2_subj6_Reg1SubjPR: String = "";
    Sems2_subj6_Reg2SubjScore: String = "";
    Sems2_subj6_Reg2SubjPR: String = "";
    Sems2_subj7_SubjName: String = "";
    Sems2_subj7_Credit: String = "";
    Sems2_subj7_IsRequire: String = "";
    Sems2_subj7_Reg1SubjScore: String = "";
    Sems2_subj7_Reg1SubjPR: String = "";
    Sems2_subj7_Reg2SubjScore: String = "";
    Sems2_subj7_Reg2SubjPR: String = "";
    Sems2_subj8_SubjName: String = "";
    Sems2_subj8_Credit: String = "";
    Sems2_subj8_IsRequire: String = "";
    Sems2_subj8_Reg1SubjScore: String = "";
    Sems2_subj8_Reg1SubjPR: String = "";
    Sems2_subj8_Reg2SubjScore: String = "";
    Sems2_subj8_Reg2SubjPR: String = "";
    Sems2_subj9_SubjName: String = "";
    Sems2_subj9_Credit: String = "";
    Sems2_subj9_IsRequire: String = "";
    Sems2_subj9_Reg1SubjScore: String = "";
    Sems2_subj9_Reg1SubjPR: String = "";
    Sems2_subj9_Reg2SubjScore: String = "";
    Sems2_subj9_Reg2SubjPR: String = "";
    Sems2_subj10_SubjName: String = "";
    Sems2_subj10_Credit: String = "";
    Sems2_subj10_IsRequire: String = "";
    Sems2_subj10_Reg1SubjScore: String = "";
    Sems2_subj10_Reg1SubjPR: String = "";
    Sems2_subj10_Reg2SubjScore: String = "";
    Sems2_subj10_Reg2SubjPR: String = "";
    Sems2_subj11_SubjName: String = "";
    Sems2_subj11_Credit: String = "";
    Sems2_subj11_IsRequire: String = "";
    Sems2_subj11_Reg1SubjScore: String = "";
    Sems2_subj11_Reg1SubjPR: String = "";
    Sems2_subj11_Reg2SubjScore: String = "";
    Sems2_subj11_Reg2SubjPR: String = "";
    Sems2_subj12_SubjName: String = "";
    Sems2_subj12_Credit: String = "";
    Sems2_subj12_IsRequire: String = "";
    Sems2_subj12_Reg1SubjScore: String = "";
    Sems2_subj12_Reg1SubjPR: String = "";
    Sems2_subj12_Reg2SubjScore: String = "";
    Sems2_subj12_Reg2SubjPR: String = "";
    Sems2_subj13_SubjName: String = "";
    Sems2_subj13_Credit: String = "";
    Sems2_subj13_IsRequire: String = "";
    Sems2_subj13_Reg1SubjScore: String = "";
    Sems2_subj13_Reg1SubjPR: String = "";
    Sems2_subj13_Reg2SubjScore: String = "";
    Sems2_subj13_Reg2SubjPR: String = "";
    Sems2_subj14_SubjName: String = "";
    Sems2_subj14_Credit: String = "";
    Sems2_subj14_IsRequire: String = "";
    Sems2_subj14_Reg1SubjScore: String = "";
    Sems2_subj14_Reg1SubjPR: String = "";
    Sems2_subj14_Reg2SubjScore: String = "";
    Sems2_subj14_Reg2SubjPR: String = "";
    Sems2_subj15_SubjName: String = "";
    Sems2_subj15_Credit: String = "";
    Sems2_subj15_IsRequire: String = "";
    Sems2_subj15_Reg1SubjScore: String = "";
    Sems2_subj15_Reg1SubjPR: String = "";
    Sems2_subj15_Reg2SubjScore: String = "";
    Sems2_subj15_Reg2SubjPR: String = "";
    Sems2_subj16_SubjName: String = "";
    Sems2_subj16_Credit: String = "";
    Sems2_subj16_IsRequire: String = "";
    Sems2_subj16_Reg1SubjScore: String = "";
    Sems2_subj16_Reg1SubjPR: String = "";
    Sems2_subj16_Reg2SubjScore: String = "";
    Sems2_subj16_Reg2SubjPR: String = "";
    Sems2_subj17_SubjName: String = "";
    Sems2_subj17_Credit: String = "";
    Sems2_subj17_IsRequire: String = "";
    Sems2_subj17_Reg1SubjScore: String = "";
    Sems2_subj17_Reg1SubjPR: String = "";
    Sems2_subj17_Reg2SubjScore: String = "";
    Sems2_subj17_Reg2SubjPR: String = "";
    Sems2_subj18_SubjName: String = "";
    Sems2_subj18_Credit: String = "";
    Sems2_subj18_IsRequire: String = "";
    Sems2_subj18_Reg1SubjScore: String = "";
    Sems2_subj18_Reg1SubjPR: String = "";
    Sems2_subj18_Reg2SubjScore: String = "";
    Sems2_subj18_Reg2SubjPR: String = "";
    Sems2_subj19_SubjName: String = "";
    Sems2_subj19_Credit: String = "";
    Sems2_subj19_IsRequire: String = "";
    Sems2_subj19_Reg1SubjScore: String = "";
    Sems2_subj19_Reg1SubjPR: String = "";
    Sems2_subj19_Reg2SubjScore: String = "";
    Sems2_subj19_Reg2SubjPR: String = "";
    Sems2_subj20_SubjName: String = "";
    Sems2_subj20_Credit: String = "";
    Sems2_subj20_IsRequire: String = "";
    Sems2_subj20_Reg1SubjScore: String = "";
    Sems2_subj20_Reg1SubjPR: String = "";
    Sems2_subj20_Reg2SubjScore: String = "";
    Sems2_subj20_Reg2SubjPR: String = "";
    Sems2_subj21_SubjName: String = "";
    Sems2_subj21_Credit: String = "";
    Sems2_subj21_IsRequire: String = "";
    Sems2_subj21_Reg1SubjScore: String = "";
    Sems2_subj21_Reg1SubjPR: String = "";
    Sems2_subj21_Reg2SubjScore: String = "";
    Sems2_subj21_Reg2SubjPR: String = "";
    Sems2_subj22_SubjName: String = "";
    Sems2_subj22_Credit: String = "";
    Sems2_subj22_IsRequire: String = "";
    Sems2_subj22_Reg1SubjScore: String = "";
    Sems2_subj22_Reg1SubjPR: String = "";
    Sems2_subj22_Reg2SubjScore: String = "";
    Sems2_subj22_Reg2SubjPR: String = "";
    Sems2_subj23_SubjName: String = "";
    Sems2_subj23_Credit: String = "";
    Sems2_subj23_IsRequire: String = "";
    Sems2_subj23_Reg1SubjScore: String = "";
    Sems2_subj23_Reg1SubjPR: String = "";
    Sems2_subj23_Reg2SubjScore: String = "";
    Sems2_subj23_Reg2SubjPR: String = "";
    Sems2_subj24_SubjName: String = "";
    Sems2_subj24_Credit: String = "";
    Sems2_subj24_IsRequire: String = "";
    Sems2_subj24_Reg1SubjScore: String = "";
    Sems2_subj24_Reg1SubjPR: String = "";
    Sems2_subj24_Reg2SubjScore: String = "";
    Sems2_subj24_Reg2SubjPR: String = "";
    Sems2_subj25_SubjName: String = "";
    Sems2_subj25_Credit: String = "";
    Sems2_subj25_IsRequire: String = "";
    Sems2_subj25_Reg1SubjScore: String = "";
    Sems2_subj25_Reg1SubjPR: String = "";
    Sems2_subj25_Reg2SubjScore: String = "";
    Sems2_subj25_Reg2SubjPR: String = "";
    Sems2_subj26_SubjName: String = "";
    Sems2_subj26_Credit: String = "";
    Sems2_subj26_IsRequire: String = "";
    Sems2_subj26_Reg1SubjScore: String = "";
    Sems2_subj26_Reg1SubjPR: String = "";
    Sems2_subj26_Reg2SubjScore: String = "";
    Sems2_subj26_Reg2SubjPR: String = "";
    Sems2_subj27_SubjName: String = "";
    Sems2_subj27_Credit: String = "";
    Sems2_subj27_IsRequire: String = "";
    Sems2_subj27_Reg1SubjScore: String = "";
    Sems2_subj27_Reg1SubjPR: String = "";
    Sems2_subj27_Reg2SubjScore: String = "";
    Sems2_subj27_Reg2SubjPR: String = "";
    Sems2_subj28_SubjName: String = "";
    Sems2_subj28_Credit: String = "";
    Sems2_subj28_IsRequire: String = "";
    Sems2_subj28_Reg1SubjScore: String = "";
    Sems2_subj28_Reg1SubjPR: String = "";
    Sems2_subj28_Reg2SubjScore: String = "";
    Sems2_subj28_Reg2SubjPR: String = "";
    Sems2_subj29_SubjName: String = "";
    Sems2_subj29_Credit: String = "";
    Sems2_subj29_IsRequire: String = "";
    Sems2_subj29_Reg1SubjScore: String = "";
    Sems2_subj29_Reg1SubjPR: String = "";
    Sems2_subj29_Reg2SubjScore: String = "";
    Sems2_subj29_Reg2SubjPR: String = "";
    Sems2_subj30_SubjName: String = "";
    Sems2_subj30_Credit: String = "";
    Sems2_subj30_IsRequire: String = "";
    Sems2_subj30_Reg1SubjScore: String = "";
    Sems2_subj30_Reg1SubjPR: String = "";
    Sems2_subj30_Reg2SubjScore: String = "";
    Sems2_subj30_Reg2SubjPR: String = "";

    // 以下為心理測驗變數
    大考中心興趣量表_A型總分: String = "";
    大考中心興趣量表_C型總分: String = "";
    大考中心興趣量表_E型總分: String = "";
    大考中心興趣量表_I型總分: String = "";
    大考中心興趣量表_R型總分: String = "";
    大考中心興趣量表_S型總分: String = "";
    大考中心興趣量表_區分值: String = "";
    大考中心興趣量表_抓週第一碼: String = "";
    大考中心興趣量表_抓週第三碼: String = "";
    大考中心興趣量表_抓週第二碼: String = "";
    大考中心興趣量表_興趣代碼: String = "";
    大考中心興趣量表_興趣第一碼: String = "";
    大考中心興趣量表_興趣第三碼: String = "";
    大考中心興趣量表_興趣第二碼: String = "";
    大考中心興趣量表_諧和度: String = "";
    大考中心學業性向測驗_圖形分數: String = "";
    大考中心學業性向測驗_圖形百分等級: String = "";
    大考中心學業性向測驗_推理1分數: String = "";
    大考中心學業性向測驗_推理2分數: String = "";
    大考中心學業性向測驗_推理1百分等級: String = "";
    大考中心學業性向測驗_推理2百分等級: String = "";
    大考中心學業性向測驗_數學分數: String = "";
    大考中心學業性向測驗_數學百分等級: String = "";
    大考中心學業性向測驗_語文分數: String = "";
    大考中心學業性向測驗_語文百分等級: String = "";
    大考中心興趣量表_抓週代碼: String = "";
    GroupSelectProvDate: String = "";
    Signdeadline: String = "";
    HomeTeacherReturn: String = "";
}





/**
 *  1. 學期
 *  2. 科目
 *  3. [科目名稱 學分數 必選修  期中分數1 期中考分數2 ]
 *  4. 心理測驗
 */
/**
 * 1.產生選租分析表變數
 * 2.上面 GroupSelectAnyls 內的許多屬性是由此 class 產生
 *  by Jean (方便開發使用)
 */
export class GroupSeleVariableGen {
    // ----成績部分---------
    VarText: String; // 最後產出之變數字串
    Semesters: String[]; // 學期
    Columns: String[]; // 對應之攔位
    ExcludeColSems2: String[]; // 第二學期要排除的欄位(因此張報表列印時點 為下學期尾聲 不一定有期末考級結算成績 )
    subjAmountMax: number; // 最多印幾科
    // ----心理測驗部分-------
    QuizNames: string[]; // [大考中心性向測驗 、大考中心興趣量表]
    AptitudeTestFields: string[]; // [ 語文測驗(Score) (PR)、數學測驗等 ]
    InterestTestFields: String[];
    constructor() {
        this.Semesters = ["Sems1", "Sems2"];
        this.Columns = ["SubjName", "Credit", "IsRequire"
            , "Reg1SubjScore", "Reg1SubjPR"
            , "Reg2SubjScore", "Reg2SubjPR"
            , "FinalSubjSocre", "FinalSubjPR"
            , "SemsSubScore", "SemsSubjPR"];
        this.ExcludeColSems2 = ["FinalSubjSocre", "FinalSubjPR", "SemsSubScore", "SemsSubjPR"]; // 第二學期要要排除的
        this.subjAmountMax = 30;
        this.QuizNames = ["Aptitude", "Interest"];
        this.AptitudeTestFields = ["LangScore", "MathScore", "ReasoningLangScore", "ReasoningMathScore", "GraphicsScore",
            "LangPR", "MathPR", "ReasoningLangPR", "ReasoningMathPR", "GraphicsPR"];
        this.InterestTestFields = ["R_Score", "I_Score",
            "A_Score", "S_Score",
            "E_Score", "C_Score",
            "Distinguish", "Balanced",
            "InterestCode", "DrawLotsCode"];
        this.VarText = "";

    }
    /**
    * 取得欲產變數之字串
    */
    GetVarText(): String {
        let VariableUnit = "";
        // 成績部分
        this.Semesters.forEach(x => {
            for (let z = 1; z <= this.subjAmountMax; z++) {
                this.Columns.forEach(y => {
                    let VariableUnit = "";
                    VariableUnit = VariableUnit + x + "_subj" + z + "_" + y + ": String  ;\n";

                    if (this.ExcludeColSems2.includes(y) && x === "Sems2") {
                        return;
                    } else {
                        this.VarText = this.VarText + (VariableUnit);
                    }
                });
            }
        });

        // 心理測驗部分
        let QuizVariableUnit;

        this.QuizNames.forEach(QuizName => {
            if (QuizName === "Aptitude") {
                this.AptitudeTestFields.forEach(field => {
                    QuizVariableUnit = QuizName + "_" + field;
                    this.VarText = this.VarText + (QuizVariableUnit) + ": String  ;\n";
                });
            }
            if (QuizName === "Interest") {
                this.InterestTestFields.forEach(field => {
                    QuizVariableUnit = QuizName + "_" + field;
                    this.VarText = this.VarText + (QuizVariableUnit) + ": String  ;\n";
                });
            }
        });

        return this.VarText;
    }
}

/**
`* 學生資料
 *
 * @export
 * @class ScoreInfoByStud
 */
export class ScoreInfoByStud {
    StudentID: String;
    StudentName: String;
    ClassName: String;
    ClassTeacher: String;
    SeatNo: String;
    /**
     * 學年度學期 下 某科目之成績資訊
     *
     * @type {Map <string , Map<string , ScoreInfo>>}
     * @memberof StudentScoreInfo
     */
    ScoreInfosBySemes: Map<String, ScoreInfoBySeme>;

    // key :測驗名稱
    QuizData: Map<string, QuizFieldInfos>;

    GetMapSocreInfos(): Map<String, ScoreInfoBySeme> {

        return this.ScoreInfosBySemes;
    }

    GetScoreInfoBySems(semester: String): ScoreInfoBySeme {
        return this.ScoreInfosBySemes.get(semester);
    }

    SetSemeScoreInfo(semester: String, scoreInfoBySeme: ScoreInfoBySeme) {
        this.ScoreInfosBySemes.set(semester, scoreInfoBySeme);

    }
    IsContainSems(semester: String): Boolean {
        return this.ScoreInfosBySemes.has(semester);

    }

    GetMapQuizData() {
        return this.QuizData;
    }

    constructor() {
        this.ScoreInfosBySemes = new Map<String, ScoreInfoBySeme>(); // 初始化 先建立一個
        this.QuizData = new Map<string, QuizFieldInfos>();
    }
}



export class ScoreInfoBySeme {

    SchoolYear: String;
    Semester: String;
    MapScoreInfoBySubj: Map<String, ScoreInfo>;   // key:科目  value : 各科目下之

    GetBySubj(subject: String): ScoreInfo {
        return this.MapScoreInfoBySubj.get(subject);
    }

    // 加此學期下面
    AddWithSubj(subj: String, semesterScoreInfo: ScoreInfo) {
        return this.MapScoreInfoBySubj.set(subj, semesterScoreInfo);
    }

    // 是否已經包含當學期
    IsContain(subj: String) {
        let result: Boolean = false;
        if (this.MapScoreInfoBySubj.has(subj)) {
            result = true;
        }
        return result;
    }

    // 取得整個Map
    GetAllScInfoSubj(): Map<String, ScoreInfo> {
        return this.MapScoreInfoBySubj;
    }


    SetWithSubj(subj: String, scoreInfoBySubj: ScoreInfo) {
        this.MapScoreInfoBySubj.set(subj, scoreInfoBySubj);

    }
    constructor(schoolYear: String, semester: String) {
        this.MapScoreInfoBySubj = new Map<String, ScoreInfo>();
        this.SchoolYear = schoolYear;
        this.Semester = semester;
    }

}





/**
 * 裝特定學生 > 特定學年度學期 > 科目下資訊
 */
// export class ScoreInfoBySubj {

//     SubjName: String; // 1.科目名稱
//     Credit: String; // 2.學分
//     IsRequire: String; // 3.是否必修
//     MapScoreInfoBySubj: Map<String, ScoreInfo>; // 4.成績資訊


//     // 取得Score by 科目
//     GetScoreInfoBySubj(subject: String): ScoreInfo {
//         return this.MapScoreInfoBySubj.get(subject);
//     }

//     // 取得 加入成績資訊
//     AddWithSubj(subject: String, scoreInfo: ScoreInfo) {
//         return this.MapScoreInfoBySubj.set(subject, scoreInfo);
//     }

//     // Map中是否包含
//     IsContain(subject: String) {
//         let result: Boolean = false;
//         if (this.MapScoreInfoBySubj.has(subject)) {

//             result = true;
//         }
//         return result;
//     }
//     GetAllScInfoSemes(): Map<String, ScoreInfo> {
//         return this.MapScoreInfoBySubj;
//     }

//     constructor(subjName: String, credit: String, isRequire: String) {
//         this.MapScoreInfoBySubj = new Map<String, ScoreInfo>();
//         this.SubjName = subjName;
//         this.Credit = credit;
//         this.IsRequire = isRequire;
//     }

// }







/**
 * 最小單位
 *
 * @export
 * @class ScoreInfo
 */
export class ScoreInfo {

    SchoolYear: String;
    Semester: String;
    SubjName: String;
    Credit: String;
    Level: String;
    IsRequire: String;
    Reg1SubjScore: String;
    Reg1SubjPR: String;
    Reg2SubjScore: String;
    Reg2SubjPR: String;
    FinalSubjSocre: String;
    FinalSubjPR: String;
    SemsSubScore: String;
    SemsSubjPR: String;
    constructor(schoolYear: String, semester: String) {

        this.SchoolYear = schoolYear;
        this.Semester = semester;
    }


}



interface IQuizData {
    Student: string;
    QuizName: String;
    FieldName: String;
    Value: String;

}

export class QuizFieldInfos {
    QuizName: String;
    MapQuizField: Map<string, string>;

    Add(fieldName: string, value: string) {
        this.MapQuizField.set(fieldName, value);
    }

    GetAll(): Map<string, string> {
        return this.MapQuizField;
    }

    GetByFieldName(fieldName): String {
        return this.MapQuizField.get(fieldName);

    }


    constructor() {
        this.MapQuizField = new Map<string, string>();
    }
}

// 批次產生綜合紀錄表使用
export class StudentDocument {
    StudentID: string = "";
    ClassID: string = "";
    PrintDocumentID: string = "";
    GradeYear: string = "";
}