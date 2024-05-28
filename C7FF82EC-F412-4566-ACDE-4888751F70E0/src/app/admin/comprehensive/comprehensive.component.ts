import { Component, OnInit } from '@angular/core';
// import { QuestionGroup, QuestionInfo, QuestionQuery, QuestionSubject, QuestionText } from 'src/app/counsel-statistics/reports/comprehensive-data-export/comprehensive-data-export-vo';
import { DsaService } from 'src/app/dsa.service';
import { QuestionGroup, QuestionInfo, QuestionQuery, QuestionSubject, QuestionText } from './comprehensive.component-vo';


export interface QuestionDisableVO {
  QuestionCode: string;
  IsDisable: boolean;

}
@Component({
  selector: 'app-comprehensive',
  templateUrl: './comprehensive.component.html',
  styleUrls: ['./comprehensive.component.css']
})


export class ComprehensiveComponent implements OnInit {
  QuestionSubjectMap: Map<string, QuestionSubject> = new Map<string, QuestionSubject>();
  showAlert: boolean = false;
  Mode: '編輯' | '預覽' = '編輯'
  updateLists: QuestionDisableVO[] = []
  selectTemplates: any[] = []
  currentTemplateSection: any
  constructor(private dsaService: DsaService) { }

  async ngOnInit() {
    // 
    await this.GetTemplateSection();
    await this.LoadngQuestionData(false);
    this.updateLists = []
  }

  selectTemplate(template: any) {
    this.currentTemplateSection = template
    this.LoadngQuestionData(false);
  }


  /** 取得樣板 */
  async GetTemplateSection() {

    try {
      const resp = await this.dsaService.send("Admin.GetTemplateSection", {
        Request: {

        }

      }) as any;

      this.selectTemplates = [].concat(resp.result || [])
      this.selectTemplate(this.selectTemplates[0])

    } catch (ex) {
      alert("取得未展開樣板發生錯誤! " + JSON.stringify(ex))
    }
  }


  display() {

    this.Mode = "預覽"
    this.showAlert = true;
    this.LoadngQuestionData(true);

  }

  hideAlert() {
    this.Mode = "編輯"
    this.showAlert = false;
    this.LoadngQuestionData(false);
  }
  /** */
  async save() {
    try {
      const resp = await this.dsaService.send("Admin.SetComprehensiveIsDsiable", {
        Request: {
          QuestionInfos: this.updateLists
        }
      });

      console.log("resp", resp)

      alert("儲存成功 ! ")
      this.LoadngQuestionData(false);

    } catch (ex) {

      alert("儲存發生錯誤 ! " + JSON.stringify(ex))

    }

  }


  async LoadngQuestionData(fileterDisable: boolean) {
    this.QuestionSubjectMap.clear();
    this.updateLists = []
    const resp = await this.dsaService.send("Admin.GetComprehensiveTemplate", {
      Request: {
        TemplactionSectionID: this.currentTemplateSection.uid
      }
    });
    let QuestionInfos: QuestionInfo[] = resp.Question;

    if (fileterDisable) {
      QuestionInfos = QuestionInfos.filter(x => (x.IsDisable != 'true'))

    }
    // 整理資料
    [].concat(QuestionInfos).forEach(questionInfos => {
      const subjectName: string = questionInfos.QuestionSubject;

      if (!this.QuestionSubjectMap.has(subjectName)) {
        this.QuestionSubjectMap.set(subjectName, new QuestionSubject(questionInfos));
      } else {
        // 已經有
        const questionSubject: QuestionSubject = this.QuestionSubjectMap.get(subjectName);
        questionSubject.AddGroup(questionInfos);
      }
    });

    console.log("QuestionSubjectMap", (this.QuestionSubjectMap))
  }


  /**
     * 點選 Subject
     * @param {QuestionGroup} target
     * @memberof ComprehensiveDataExportComponent
     */
  public selectSubject(target: QuestionSubject) {
    if (!target.IsSetDisable) {
      target.SubjectCheckChildIsChecked(target.IsSetDisable, this.updateLists);
      target.IsSetDisable = target.ischildAllCheck();
    } else {

      target.SubjectCheckChildIsChecked(target.IsSetDisable, this.updateLists);
      target.IsSetDisable = target.ischildAllCheck();
    }
  }
  /**
   *點選 Group
   *
   * @param {QuestionGroup} target
   * @memberof ComprehensiveDataExportComponent
   */
  public selectGroup(target: QuestionGroup, parent: QuestionSubject) {
    target.QueryCheckChildIsChecked(target.IsSetDisable, this.updateLists);

    parent.IsSetDisable = parent.ischildAllCheck();
  }

  getJson(s: any) {

    return JSON.stringify(s)
  }
  public selectQuery(target: QuestionQuery, parent: QuestionGroup, parent2: QuestionSubject) {

    target.QueryCheckChildIsChecked(target.IsSetDisable, this.updateLists);
    parent.IsSetDisable = parent.ischildAllCheck()
    parent2.IsSetDisable = parent2.ischildAllCheck()

  }

  public selectQuestionText(target: QuestionText, parent: QuestionQuery, parent2: QuestionGroup, parent3: QuestionSubject) {


    target.TextCheckChildIsChecked(target.IsSetDisable, this.updateLists);
    parent.IsSetDisable = parent.ischildAllCheck()
    parent2.IsSetDisable = parent2.ischildAllCheck()
    parent3.IsSetDisable = parent3.ischildAllCheck()

  }

  /**
  * 取得QuestionMap
  */
  GetQuestionSubjectMapValue(): QuestionSubject[] {
    return Array.from(this.QuestionSubjectMap.values());
  }


}
