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
                  // 🔍 安全地解析 AnswerMatrix - 先移除控制字元
                  if (option.AnswerMatrix) {
                    if (typeof option.AnswerMatrix === 'string') {
                      let matrixStr = option.AnswerMatrix.trim();
                      
                      // 🔍 檢查並打印包含換行符的原始資料
                      if (matrixStr.includes('\n') || matrixStr.includes('\r') || matrixStr.includes('\t')) {
                        console.log('=== 發現包含控制字元的 AnswerMatrix ===');
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
                      
                      // 步驟1：先處理控制字元（使用特殊標記暫時替換換行符，避免 JSON.parse 錯誤）
                      // 之後會根據 input/textarea 類型決定如何處理換行符
                      const originalStr = matrixStr; // 保留原始值用於對比
                      // 先用特殊標記替換換行符，避免 JSON.parse 錯誤
                      matrixStr = matrixStr
                        .replace(/\n/g, '__NEWLINE_MARKER__')   // 暫時標記換行符
                        .replace(/\r/g, '')   // 移除回車符
                        .replace(/\t/g, ' ')   // Tab 轉為空格
                        .replace(/\f/g, '')   // 移除換頁符
                        .replace(/\b/g, '');  // 移除退格符
                      
                      // 步驟2：檢查是否為 JSON 陣列格式
                      const isJsonArray = matrixStr.startsWith('[') && matrixStr.endsWith(']');
                      
                      if (isJsonArray) {
                        // 是 JSON 陣列格式，嘗試解析
                        try {
                          const parsed = JSON.parse(matrixStr);
                          option.AnswerMatrix = [].concat(parsed || []);
                          // 將特殊標記還原為換行符（view 頁面顯示時保留換行符）
                          option.AnswerMatrix = option.AnswerMatrix.map((item: string) => {
                            if (typeof item === 'string') {
                              return item.replace(/__NEWLINE_MARKER__/g, '\n');
                            }
                            return item;
                          });
                        } catch (parseError) {
                          console.warn('JSON.parse 失敗，嘗試備用方案:', parseError.message, '處理後的值:', matrixStr);
                          // 備用方案：手動解析
                          const content = matrixStr.slice(1, -1); // 移除 [ ]
                          if (content) {
                            // 使用正則表達式提取字串值
                            const matches = content.match(/"([^"]*)"/g);
                            if (matches && matches.length > 0) {
                              option.AnswerMatrix = matches.map(m => m.slice(1, -1).replace(/__NEWLINE_MARKER__/g, '\n')); // 移除引號並還原換行符
                            } else {
                              // 如果沒有引號，嘗試分割（可能是逗號分隔）
                              const items = content.split(',').map(item => item.trim().replace(/^["']|["']$/g, '').replace(/__NEWLINE_MARKER__/g, '\n'));
                              option.AnswerMatrix = items.filter(item => item);
                            }
                          } else {
                            option.AnswerMatrix = [];
                          }
                        }
                      } else {
                        // 不是 JSON 格式，可能是純字串，直接轉換為陣列
                        // 還原換行符標記
                        matrixStr = matrixStr.replace(/__NEWLINE_MARKER__/g, '\n');
                        // 如果包含逗號，可能是多個值
                        if (matrixStr.includes(',')) {
                          const items = matrixStr.split(',').map(item => item.trim()).filter(item => item);
                          option.AnswerMatrix = items;
                        } else {
                          option.AnswerMatrix = [matrixStr];
                        }
                      }
                      
                      // 如果處理後有變化，打印對比
                      if (originalStr !== matrixStr) {
                        console.log('處理後的值:', matrixStr);
                        console.log('已暫時標記換行符，view 頁面顯示時保留換行符');
                      }
                    } else {
                      // 如果不是字串，直接使用（可能是已經解析過的陣列）
                      option.AnswerMatrix = [].concat(option.AnswerMatrix || []);
                    }
                  } else {
                    option.AnswerMatrix = [];
                  }
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
      console.error('=== getFillInData 發生錯誤 ===', error);
      // 🔍 改善錯誤訊息顯示
      let errorMessage = '發生錯誤';
      if (error) {
        if (error.dsaError && error.dsaError.message) {
          errorMessage = error.dsaError.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          try {
            const errorStr = JSON.stringify(error, null, 2);
            if (errorStr && errorStr !== '{}') {
              errorMessage = errorStr;
            } else {
              errorMessage = '發生未知錯誤，請查看控制台';
            }
          } catch (e) {
            errorMessage = '發生錯誤，無法顯示詳細訊息';
          }
        }
      }
      alert(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }
}
