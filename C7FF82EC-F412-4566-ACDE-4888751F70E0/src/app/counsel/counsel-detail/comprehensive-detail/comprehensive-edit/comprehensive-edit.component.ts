import { GlobalService } from 'src/app/global.service';
import { Component, OnInit, Optional, ViewChild, TemplateRef } from "@angular/core";
import {
  ActivatedRoute,
  Router,
  ParamMap,
  RoutesRecognized
} from "@angular/router";
import { DsaService } from 'src/app/dsa.service';
import { ComprehensiveDetailComponent } from '../comprehensive.component';

@Component({
  selector: 'app-comprehensive-edit',
  templateUrl: './comprehensive-edit.component.html',
  styleUrls: ['./comprehensive-edit.component.css']
})
export class ComprehensiveEditComponent implements OnInit {
  compoGUID :"d7a5a2e7-3f1c-4c8d-aaf4-3b6f0a2a0d18"
  isLoading = true;
  isSaving = false;
  studentID: string;
  fillInSectionId: string;
  fillInSection: any;
  questionSubject: any[] = [];
  requireList: any[];
  optionCodeMapping: any = {};


  optionKey: any = {
    '%TEXT%': { element: 'input', style: { width: '100px' } },
    '%TEXT1%': { element: 'input', style: { width: '30px' } },
    '%TEXT2%': { element: 'input', style: { width: '60px' } },
    '%TEXT3%': { element: 'input', style: { width: '100px' } },
    '%TEXT4%': { element: 'input', style: { width: '150px' } },
    '%TEXT5%': { element: 'input', style: { width: '300px' } },
    '%TEXTAREA%': { element: 'textarea', style: { width: '100%' } }
  };

  @ViewChild("plugin")
  pluginEle: TemplateRef<any>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private route: ActivatedRoute,
    private dsaService: DsaService,
    private globalService :GlobalService,
    @Optional()
    private comprehensiveComponent: ComprehensiveDetailComponent
  ) { }

  ngOnInit() {
    this.studentID = this.comprehensiveComponent.studentID;
    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.fillInSectionId = params.get("sectionID");
        this.comprehensiveComponent.plugin = this.pluginEle;
        this.getFillInData();
      }
    );
  }

  async getFillInData() {
    this.isLoading = true;
    this.questionSubject = [];
    try {
      if (this.fillInSectionId) {
        this.optionCodeMapping = {};

        var fillInData = await this.dsaService.send("GetFillInData", {
          Request: {
            StudentID: this.studentID,
            FillInSectionID: this.fillInSectionId,
          }
        });
        fillInData.Section = [].concat(fillInData.Section || []);
        if (fillInData.Section.length) {
          this.fillInSection = fillInData.Section[0];
          this.comprehensiveComponent.setCurrentSemester(this.fillInSection.SchoolYear, this.fillInSection.Semester);
        }

        fillInData.QuestionSubject = [].concat(fillInData.QuestionSubject || []);
        fillInData.QuestionSubject.forEach((subject) => {
          subject.QuestionGroup = [].concat(subject.QuestionGroup || []);
          subject.QuestionGroup.forEach(group => {
            group.QuestionQuery = [].concat(group.QuestionQuery || []);
            group.QuestionQuery.forEach(query => {
              query.HasText = false;
              query.ShowMark = false;

              query.QuestionText = [].concat(query.QuestionText || []);
              query.QuestionText.forEach(text => {
                if (text.Text) {
                  query.HasText = true;
                }
                text.Require = (text.Require == "true");
                text.RequireLink = text.RequireLink || "";

                text.ShowMark = false;

                text.Option = [].concat(text.Option || []);
                text.Option.forEach(option => {
                  option.AnswerChecked = (option.AnswerChecked == "true");
                  option.AnswerComplete = (option.AnswerComplete == "true");

                  if (option.OptionCode) {
                    this.optionCodeMapping[option.OptionCode] = option;
                  }

                  switch (text.Type) {
                    case "單選":
                      option.change = () => {
                        if (!option.AnswerChecked) {
                          option.AnswerChecked = true;
                        }
                        text.Option.forEach(optionC => {
                          if (optionC != option) {
                            optionC.AnswerChecked = false;
                          }
                        });
                        this.refreshMark();
                      };
                      break;
                    case "複選":
                      option.change = () => {
                        option.AnswerChecked = !option.AnswerChecked;
                        this.refreshMark();
                      };
                      break;
                    case "填答":
                      option.AnswerChecked = true;
                      break;
                  }

                  option.AnswerMatrix = [].concat(JSON.parse(option.AnswerMatrix || '[]') || []);
                  option.IsTextArea = false;
                  option.Template = [];
                  //分割OptionText進Template
                  var splitTemplate = () => {
                    var keyWord = [];
                    for (var key in this.optionKey) {
                      keyWord.push(key);
                    }
                    keyWord.reverse();

                    var keySplit = (query, keyWord) => {
                      var key = keyWord.pop();
                      var list = query.split(key);

                      list.forEach((item, index) => {
                        if (keyWord.length > 0) {
                          if (item)
                            keySplit(item, [].concat(keyWord));
                        }
                        else {
                          if (item == "" && (index == 0 || index + 1 == list.length)) {

                          }
                          else {
                            option.Template.push(item);
                          }
                        }
                        if (index + 1 != list.length) {
                          if (this.optionKey[key].element == 'textarea') { option.IsTextArea = true; }
                          option.Template.push(key);
                        }
                      });
                    }
                    keySplit(option.OptionText, keyWord);
                  };
                  splitTemplate();
                  //建置預設的AnswerMatrix
                  if (option.AnswerMatrix.length < option.Template.length) {
                    option.Template.forEach((part, index) => {
                      if(option.AnswerMatrix.length <= index){
                        if(this.optionKey[part]){
                          option.AnswerMatrix.push("");
                        }
                        else{
                          option.AnswerMatrix.push(part);
                        }
                      }
                    });
                  }
                });
              });
            });
          });
        });
        this.questionSubject = fillInData.QuestionSubject;
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
      this.refreshMark();
    }
  }

  refreshMark() {
    this.requireList = [];
    this.questionSubject.forEach(subject => {
      subject.QuestionGroup.forEach(group => {
        group.QuestionQuery.forEach(query => {
          query.ShowMark = false;
          query.QuestionText.forEach(text => {
            text.ShowMark = false;

            var hasChecked = false;
            var hasAllComplete = true;
            text.Option.forEach(option => {
              if (option.AnswerChecked) {
                option.AnswerComplete = true;
                hasChecked = true;
                option.Template.forEach((templateItem, index) => {
                  if (this.optionKey[templateItem]) {
                    if (!option.AnswerMatrix[index]) {
                      // 完全沒有輸入
                      option.AnswerComplete = false;
                      hasAllComplete = false;
                     } else if (!option.AnswerMatrix[index].trim()) {
                      // 如果只輸入空白，當作沒有輸入
                      option.AnswerComplete = false;
                      hasAllComplete = false;
                    }
                  }
                  else {
                    if (option.AnswerMatrix.length > index) {
                      option.AnswerMatrix[index] = templateItem;
                    }
                    else {
                      option.AnswerMatrix.push(templateItem);
                    }
                  }
                });
                option.AnswerValue = option.AnswerMatrix.join("");
              }
              else {
                option.AnswerComplete = true;
                option.AnswerValue = "";
              }
            });

            if (
              text.Require ||
              (
                text.RequireLink
                && this.optionCodeMapping[text.RequireLink]
                && this.optionCodeMapping[text.RequireLink].AnswerChecked
              )
            ) {
              if (!hasChecked || !hasAllComplete) {
                // this.requireCount++;
                if (text.Text) {
                  this.requireList.push(subject.Subject + "/" + group.Group + "/" + query.Query + "/" + text.Text);
                  text.ShowMark = true;
                }
                else {
                  this.requireList.push(subject.Subject + "/" + group.Group + "/" + query.Query);
                  query.ShowMark = true;
                }
              }
            }
          });
        });
      });
    });
  }
  showRequireList() {
    alert(this.requireList.join("\n"));
  }
  async save() {
    try {
      if (this.isSaving) { return; }

      this.isSaving = true;
      const options = [];
      for (const subject of this.questionSubject) {
        for (const group of subject.QuestionGroup) {
          for (const query of group.QuestionQuery) {
            query.QuestionText.forEach(text => {
              text.Option.forEach(option => {
                options.push({
                  AnswerChecked: option.AnswerChecked,
                  AnswerComplete: option.AnswerComplete,
                  AnswerID: option.AnswerID,
                  AnswerMatrix: JSON.stringify(option.AnswerMatrix),
                  AnswerValue: option.AnswerValue,
                  OptionCode: option.OptionCode,
                  OptionText: option.OptionText,
                });
              });
            });
          }
        }
      }
      console.log(options);
      await this.dsaService.send("SetFillInData", {
        Request: {
          Option: options
        }
      });
      // console.log(rsp);
      this.router.navigate(["../../view", this.fillInSection.SchoolYear, this.fillInSection.Semester], {
        relativeTo: this.route,
      });
    } catch (error) {
      console.log(error);
      alert("儲存發生錯誤：\n" + JSON.stringify(error, null, 4));
    } finally {
      this.isSaving = false;
    }
  }
}
