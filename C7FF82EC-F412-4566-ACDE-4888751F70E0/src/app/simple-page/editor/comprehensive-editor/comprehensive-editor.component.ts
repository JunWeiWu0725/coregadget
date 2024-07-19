import { Component, OnInit, Optional, ViewChild, TemplateRef } from "@angular/core";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-comprehensive-editor',
  templateUrl: './comprehensive-editor.component.html',
  styleUrls: ['./comprehensive-editor.component.css']
})
export class ComprehensiveEditorComponent implements OnInit {
  
  questionSubject: any[] = [];
  requireList: any[];
  optionCodeMapping: any = {};

  config: any = {
    configXml: ""
  }

  optionKey: any = {
    '%TEXT%': { element: 'input', style: { width: '100px' } },
    '%TEXT1%': { element: 'input', style: { width: '30px' } },
    '%TEXT2%': { element: 'input', style: { width: '60px' } },
    '%TEXT3%': { element: 'input', style: { width: '100px' } },
    '%TEXT4%': { element: 'input', style: { width: '150px' } },
    '%TEXT5%': { element: 'input', style: { width: '300px' } },
    '%TEXTAREA%': { element: 'textarea', style: { width: '100%' } }
  };

  needSorting = false;
  sortingTitle = "";
  sortingItems = [];  // 需要排序的選項清單
  sortingType: string;  // default

  constructor() { }

  ngOnInit() {
    $("#modal-editor").modal('show');
  }

  setConfig() {
    if (this.config.configXml) {
      try {
        var template = xml2json.parser(this.config.configXml).Template || {};

        template.QuestionSubject = [].concat(template.QuestionSubject || []);
        template.QuestionSubject.forEach((subject) => {
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
                      if (option.AnswerMatrix.length <= index) {
                        if (this.optionKey[part]) {
                          option.AnswerMatrix.push("");
                        }
                        else {
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
        this.questionSubject = template.QuestionSubject;
        this.refreshMark();
        $("#modal-editor").modal('hide');
      }
      catch (exc) {
        alert("ERROR：" + exc);
      }
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

  /**
   * 處理拖拉項目後，json 物件的順序該如何調整。
   * 此外也把結果轉回 XML ，寫回 config.configXml，這樣可出現在輸入 XML 的畫面中。
   * 
   * @param event 拖拉事件的資料參數
   * @param queries 把 cdkDragList 裡的所有項目傳入，但後來發現好像 event.container.data 就可以抓到了，所以好像沒用到？
   * @see json轉xml請參考 https://www.npmjs.com/package/nodexml
   * @see 拖拉技術文件請參考： https://material.angular.io/cdk/drag-drop/examples
   */
  drop(event: CdkDragDrop<string[]>, queries) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
    // moveItemInArray(queries, event.previousIndex, event.currentIndex);
    // console.log(this.questionSubject);

    // 把 Json 轉回 XML
    const objRoot = {
      "Template": {
        "QuestionSubject": []
      }
    };

    this.questionSubject.forEach(subj => {
      objRoot.Template.QuestionSubject.push(subj);
    });
    // console.log(objRoot);

    const xmlstring = parseXml.CreateParser().parse(objRoot, "root"); // require('nodexml').obj2xml(objRoot);   // convert json to xml
    const finalXmlString = xmlstring.replace("<root>", "").replace("</root>", "");

    // 把 XML 寫回 config.configXml，好顯示在設定 XML 的畫面中。
    this.config.configXml = finalXmlString;
    // console.log(xmlstring);
    // console.log(this.questionSubject);
  }

  sortQueryText(query) {
    console.log(query.QuestionText);
    this.sortingTitle = query.Query;
    this.sortingType = "TEXT";
    this.sortingItems = query.QuestionText;
  }

  sortOptions(questionText, queryTitle) {
    console.log(questionText.Option);
    this.sortingTitle = `${queryTitle}/${questionText.Text}`;
    this.sortingType = "OPTION";
    this.sortingItems = questionText.Option;
  }

  showSorting() {
    if (!this.needSorting) {
      this.sortingItems = []; // 清空
      this.sortingTitle = '';
    }
  }
}


