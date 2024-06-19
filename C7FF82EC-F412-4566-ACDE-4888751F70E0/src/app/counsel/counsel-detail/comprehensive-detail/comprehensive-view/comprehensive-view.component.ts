import { GlobalService } from './../../../../global.service';
import { RoleService } from 'src/app/role.service';
import { Component, OnInit, Optional, TemplateRef, ViewChild } from "@angular/core";
import {
  ActivatedRoute,
  Router,
  ParamMap,
  RoutesRecognized
} from "@angular/router";
import { DsaService } from 'src/app/dsa.service';
import { ComprehensiveDetailComponent } from '../comprehensive.component';
import { ComprehensiveTemplateService } from 'src/app/comprehensive-template.service';


// 教師綜合記錄表 


@Component({
  selector: 'app-comprehensive-view',
  templateUrl: './comprehensive-view.component.html',
  styleUrls: ['./comprehensive-view.component.css']
})
export class ComprehensiveViewComponent implements OnInit {
  compoGUID :"fa94318e-41c1-4a25-8c29-b2c06bb923fb"
  isEditable =false ;
  isLoading = true;
  isSaving = false;
  studentID: string;
  // fillInSectionId: string;
  schoolYear: string;
  semester: string;
  fillInSection: any[] = [];
  fillInData: any[] = [];


  @ViewChild("plugin")
  pluginEle: TemplateRef<any>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private route: ActivatedRoute,
    private dsaService: DsaService,
    private roleService:RoleService,
    private globalService :GlobalService ,
    private comprehensiveTemplateService :ComprehensiveTemplateService ,
    @Optional()
    private comprehensiveComponent: ComprehensiveDetailComponent
  ) { }

  ngOnInit() {
   
    this.getComphresive()
    this.studentID = this.comprehensiveComponent.studentID;
    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.schoolYear = params.get("schoolYear");
        this.semester = params.get("semester");
        // this.comprehensiveComponent.setCurrentFillInSection(this.fillInSectionId);
        this.comprehensiveComponent.setCurrentSemester(this.schoolYear, this.semester);
        this.comprehensiveComponent.plugin = this.pluginEle;
        this.getFillInData();
        
      }
    );
  }

async getComphresive(){


}

  async getFillInData() {
    this.isLoading = true;
    this.fillInSection = [];
    this.fillInData = [];
    try {
      if (this.schoolYear&&this.semester) {

        var fillInData = await this.dsaService.send("GetFillInData", {
          Request: {
            StudentID: this.studentID,
            // FillInSectionID: this.fillInSectionId,
            SchoolYear: this.schoolYear,
            Semester: this.semester
          }
        });
console.log("fillInData",fillInData)
        this.fillInSection = [].concat(fillInData.Section || []);
        fillInData.QuestionSubject = [].concat(fillInData.QuestionSubject || []);
        fillInData.QuestionSubject.forEach((subject) => {
          subject.QuestionGroup = [].concat(subject.QuestionGroup || []);
          subject.QuestionGroup.forEach(group => {
            group.QuestionQuery = [].concat(group.QuestionQuery || []);
            group.QuestionQuery.forEach(query => {
              query.HasText = false;
              query.QuestionText = [].concat(query.QuestionText || []);
              query.QuestionText.forEach(text => {
                if (text.Text) {
                  query.HasText = true;
                }
                text.Require = (text.Require == "true");
                text.HasValue = false;
                var checkedOption = [];
                text.Option = [].concat(text.Option || []);
                text.Option.forEach(option => {
                  option.AnswerChecked = (option.AnswerChecked == "true");
                  option.AnswerMatrix = [].concat(JSON.parse(option.AnswerMatrix || '[]') || []);
                  option.AnswerComplete = (option.AnswerComplete == "true");
                  if (option.AnswerChecked && option.AnswerComplete) {
                    text.HasValue = true;
                    checkedOption.push(option);
                  }
                });
                text.Option = checkedOption;
              });
            });
          });
        });
        this.fillInData = fillInData.QuestionSubject;
      }
    } catch (error) {
      alert("發生錯誤" +JSON.stringify(error))
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }
}
