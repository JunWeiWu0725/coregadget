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

                  // 🔍 安全地解析 AnswerMatrix - 先移除控制字元（但保留換行符資訊）
                  try {
                    let matrixStr = option.AnswerMatrix || '[]';
                    if (typeof matrixStr === 'string') {
                      // 🔍 檢查並打印包含換行符的原始資料
                      if (matrixStr.includes('\n') || matrixStr.includes('\r') || matrixStr.includes('\t')) {
                        console.log('=== [comprehensive-edit] 發現包含控制字元的 AnswerMatrix ===');
                        console.log('原始值:', matrixStr);
                        console.log('包含換行符 (\\n):', matrixStr.includes('\n'));
                        console.log('包含回車符 (\\r):', matrixStr.includes('\r'));
                        console.log('包含 Tab (\\t):', matrixStr.includes('\t'));
                        // 顯示可視化的控制字元位置
                        const withMarkers = matrixStr
                          .replace(/\n/g, '\\n')
                          .replace(/\r/g, '\\r')
                          .replace(/\t/g, '\\t');
                        console.log('可視化字串:', withMarkers);
                        console.log('字串長度:', matrixStr.length);
                        console.log('JSON 位置:', matrixStr.indexOf('['), '到', matrixStr.lastIndexOf(']'));
                      }
                      
                      // 先處理控制字元（為了避免 JSON.parse 錯誤）
                      // 使用特殊標記暫時替換換行符，之後再根據 input/textarea 決定如何處理
                      const originalStr = matrixStr; // 保留原始值用於對比
                      // 先用特殊標記替換換行符，避免 JSON.parse 錯誤
                      matrixStr = matrixStr
                        .replace(/\n/g, '__NEWLINE_MARKER__')   // 暫時標記換行符
                        .replace(/\r/g, '')   // 移除回車符
                        .replace(/\t/g, ' ')   // Tab 轉為空格
                        .replace(/\f/g, '')   // 移除換頁符
                        .replace(/\b/g, '');  // 移除退格符
                      
                      // 嘗試解析
                      option.AnswerMatrix = [].concat(JSON.parse(matrixStr) || []);
                      
                      // 將特殊標記還原為換行符（稍後會根據 input/textarea 決定是否轉為頓號）
                      option.AnswerMatrix = option.AnswerMatrix.map((item: string) => {
                        if (typeof item === 'string') {
                          return item.replace(/__NEWLINE_MARKER__/g, '\n');
                        }
                        return item;
                      });
                      
                      // 如果處理後有變化，打印對比
                      if (originalStr !== matrixStr) {
                        console.log('處理後的值:', matrixStr);
                        console.log('已暫時標記換行符，稍後會根據 input/textarea 類型處理');
                      }
                    } else {
                      // 如果不是字串，直接使用
                      option.AnswerMatrix = [].concat(option.AnswerMatrix || []);
                    }
                  } catch (parseError) {
                    console.warn('解析 AnswerMatrix 時發生錯誤:', parseError, '原始值:', option.AnswerMatrix);
                    // 如果解析失敗，嘗試備用方案
                    try {
                      let matrixStr = (option.AnswerMatrix || '[]').toString();
                      // 移除控制字元後再試一次
                      matrixStr = matrixStr
                        .replace(/\n/g, '__NEWLINE_MARKER__')  // 暫時標記
                        .replace(/\r/g, '')
                        .replace(/\t/g, ' ')
                        .replace(/\f/g, '')
                        .replace(/\b/g, '');
                      
                      if (matrixStr.startsWith('[') && matrixStr.endsWith(']')) {
                        // 嘗試手動解析
                        const content = matrixStr.slice(1, -1);
                        if (content) {
                          const matches = content.match(/"([^"]*)"/g);
                          if (matches && matches.length > 0) {
                            option.AnswerMatrix = matches.map(m => m.slice(1, -1).replace(/__NEWLINE_MARKER__/g, '\n'));
                          } else {
                            const items = content.split(',').map(item => item.trim().replace(/^["']|["']$/g, '').replace(/__NEWLINE_MARKER__/g, '\n'));
                            option.AnswerMatrix = items.filter(item => item);
                          }
                        } else {
                          option.AnswerMatrix = [];
                        }
                      } else {
                        option.AnswerMatrix = [];
                      }
                    } catch (fallbackError) {
                      console.error('備用解析也失敗:', fallbackError);
                      option.AnswerMatrix = []; // 最終備選：設為空陣列
                    }
                  }
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
                  
                  // 🔍 根據 Template 類型處理 AnswerMatrix 中的換行符
                  // input 類型：換行符轉為頓號；textarea 類型：保留換行符
                  if (option.Template && option.AnswerMatrix) {
                    option.Template.forEach((templatePart: string, index: number) => {
                      if (option.AnswerMatrix[index] && typeof option.AnswerMatrix[index] === 'string') {
                        // 判斷這個 Template 項目是 input 還是 textarea
                        const isTextArea = templatePart === '%TEXTAREA%';
                        const isInput = this.optionKey[templatePart] && this.optionKey[templatePart].element === 'input';
                        
                        if (isInput) {
                          // input 類型：將換行符轉為頓號
                          const originalValue = option.AnswerMatrix[index];
                          option.AnswerMatrix[index] = option.AnswerMatrix[index]
                            .replace(/\n/g, '、')   // 換行符轉為頓號
                            .replace(/\r/g, '');     // 移除回車符
                          
                          if (originalValue !== option.AnswerMatrix[index]) {
                            console.log(`[comprehensive-edit] input 類型項目 [${index}] 已將換行符轉為頓號`, {
                              '原始值': originalValue,
                              '處理後': option.AnswerMatrix[index],
                              'Template': templatePart
                            });
                          }
                        } else if (isTextArea) {
                          // textarea 類型：保留換行符，只移除回車符
                          const originalValue = option.AnswerMatrix[index];
                          option.AnswerMatrix[index] = option.AnswerMatrix[index]
                            .replace(/\r/g, '');     // 只移除回車符，保留換行符
                          
                          if (originalValue !== option.AnswerMatrix[index]) {
                            console.log(`[comprehensive-edit] textarea 類型項目 [${index}] 已移除回車符，保留換行符`, {
                              '原始值': originalValue,
                              '處理後': option.AnswerMatrix[index],
                              'Template': templatePart
                            });
                          }
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
