import { HttpClient } from "@angular/common/http";
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  HostListener,
} from "@angular/core";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { GlobalService } from "src/app/global.service";

@Component({
  selector: "app-comprehensive-fill",
  templateUrl: "./comprehensive-fill.component.html",
  styleUrls: ["./comprehensive-fill.component.css"],
})
export class ComprehensiveFillComponent implements OnInit {
  compoGUID: "d25c27b1-7156-4a10-8f8d-68f3d46f94e2";
  //如果使用者有改變卻沒有儲存，需要提醒使用需要先儲存。
  isChangeNotSave = false;
  dsns: string;
  fillInKey: string;

  schoolInfo: any;
  studentInfo: any;
  sectionInfo: any;

  questionSubject: any[] = [];
  requireList: any[];
  logUnfilled: string[];
  optionCodeMapping: any = {};

  isSaving: boolean = false;
  isOpen: boolean = false;
  startTime: string = "";
  endTime: string = "";
  config: any = { key: "" };
  loadingFillInData: boolean = false;
  loadFaildMsg: string = "";
  userIP: string = "";

  optionKey: any = {
    "%TEXT%": { element: "input", style: { width: "100px" } },
    "%TEXT1%": { element: "input", style: { width: "30px" } },
    "%TEXT2%": { element: "input", style: { width: "60px" } },
    "%TEXT3%": { element: "input", style: { width: "100px" } },
    "%TEXT4%": { element: "input", style: { width: "150px" } },
    "%TEXT5%": { element: "input", style: { width: "auto" } },
    "%TEXTAREA%": { element: "textarea", style: { width: "100%" } },
  };

  constructor(
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private globalService: GlobalService
  ) {}

  async ngOnInit() {
    // 抓取 IP
    this.userIP = await this.fetchIp();
    this.activatedRoute.paramMap.subscribe((params: ParamMap): void => {
      this.dsns = params.get("dsns");
      this.fillInKey = params.get("fill_in_key"); //'A123456789'
      this.getSchoolInfo();
    });
  }
  async fetchIp(): Promise<string | null> {
    try {
      const result: any = await this.http
        .get("https://api.ipify.org/?format=json")
        .toPromise();
      return result.ip.trim();
    } catch (error) {
      console.error("抓取 IP 失敗", error);
      return "";
    }
  }
  /** */
  async getSectionOpenDate() {
    try {
      let rs = await this.send(
        this.dsns + "/1campus.counsel.public",
        "GetSecrionOpenDate",
        { FillInKey: this.fillInKey }
      );

      return rs;
    } catch (ex) {
      alert(JSON.stringify(ex));
    }
  }

  async getSchoolInfo() {
    // alert("" + JSON.stringify(this.fillInKey))
    this.schoolInfo = await this.send(
      this.dsns + "/1campus.counsel.public",
      "GetSchoolInfo"
    );
    if (this.fillInKey) {
      this.getFillInData(false);
    } else {
      $("#modal-key").modal({
        show: true,
        backdrop: false,
        keyboard: false,
        focus: true,
      });
    }
  }

  async getFillInData(closeModal) {
    let rs = (await this.getSectionOpenDate()) as any;
    //  {"result":{"end_time":"2023-09-30 11:19:00","start_time":"2023-08-18 11:19:00","isopen":"f"}}
    if (rs.result) {
      console.log("rs.result", rs.result);
      this.isOpen = rs.result.isopen == "t";
      this.startTime = rs.result.start_time;
      this.endTime = rs.result.end_time;
    }

    if (this.loadingFillInData) return;
    this.loadingFillInData = true;

    this.sectionInfo = null;
    this.studentInfo = null;
    this.questionSubject = [];

    // try{
    var rsp = await this.send(
      this.dsns + "/1campus.counsel.public",
      "GetFillInData",
      { FillInKey: this.fillInKey }
    );
    if (rsp.QuestionSubject) {
      if (closeModal) $("#modal-key").modal("hide");
      rsp.QuestionSubject = [].concat(rsp.QuestionSubject || []);
      rsp.QuestionSubject.forEach((subject) => {
        subject.QuestionGroup = [].concat(subject.QuestionGroup || []);
        subject.QuestionGroup.forEach((group) => {
          group.QuestionQuery = [].concat(group.QuestionQuery || []);
          group.QuestionQuery.forEach((query) => {
            query.HasText = false;
            query.ShowMark = false;

            query.QuestionText = [].concat(query.QuestionText || []);
            query.QuestionText.forEach((text) => {
              if (text.Text) {
                query.HasText = true;
              }
              text.Require = text.Require == "true";
              text.RequireLink = text.RequireLink || "";

              text.ShowMark = false;

              text.Option = [].concat(text.Option || []);
              text.Option.forEach((option) => {
                option.AnswerChecked = option.AnswerChecked == "true";
                option.AnswerComplete = option.AnswerComplete == "true";

                if (option.OptionCode) {
                  this.optionCodeMapping[option.OptionCode] = option;
                }

                switch (text.Type) {
                  case "單選":
                    option.change = () => {
                      if (!option.AnswerChecked) {
                        option.AnswerChecked = true;
                      }
                      text.Option.forEach((optionC) => {
                        if (optionC != option) {
                          optionC.AnswerChecked = false;
                        }
                      });
                      console.log("單選");
                      this.refreshMark("單選");
                    };
                    break;
                  case "複選":
                    option.change = () => {
                      option.AnswerChecked = !option.AnswerChecked;
                      console.log("複選");
                      this.refreshMark("複選");
                    };
                    break;
                  case "填答":
                    option.AnswerChecked = true;
                    break;
                }

                option.AnswerMatrix = [].concat(
                  JSON.parse(option.AnswerMatrix || "[]") || []
                );
                // console.log(    option.AnswerMatrix)
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
                        if (item) keySplit(item, [].concat(keyWord));
                      } else {
                        if (
                          item == "" &&
                          (index == 0 || index + 1 == list.length)
                        ) {
                        } else {
                          option.Template.push(item);
                        }
                      }
                      if (index + 1 != list.length) {
                        if (this.optionKey[key].element == "textarea") {
                          option.IsTextArea = true;
                        }
                        option.Template.push(key);
                      }
                    });
                  };
                  keySplit(option.OptionText, keyWord);
                };
                splitTemplate();
                //建置預設的AnswerMatrix
                if (option.AnswerMatrix.length < option.Template.length) {
                  option.Template.forEach((part, index) => {
                    if (option.AnswerMatrix.length <= index) {
                      if (this.optionKey[part]) {
                        option.AnswerMatrix.push("");
                      } else {
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
      this.sectionInfo = rsp.Section;
      this.studentInfo = rsp.Student;
      this.questionSubject = rsp.QuestionSubject;

      this.refreshMark("");
    } else {
      alert("代碼錯誤");
    }
    // }
    // catch (err) {
    //   console.log(err);
    //   alert("取得資料發生錯誤：\n" + JSON.stringify(err, null, 4));
    // }
    this.loadingFillInData = false;
  }

  refreshMark(param: string) {
    
    if (param != "") {
      this.isChangeNotSave = true;
    }

    this.requireList = [];
    this.logUnfilled = [];
    this.questionSubject.forEach((subject) => {
      subject.QuestionGroup.forEach((group) => {
        group.QuestionQuery.forEach((query) => {
          query.ShowMark = false;
          query.QuestionText.forEach((text) => {
            text.ShowMark = false;

            var hasChecked = false;
            var hasAllComplete = true;
            text.Option.forEach((option) => {
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
                  } else {
                    if (option.AnswerMatrix.length > index) {
                      option.AnswerMatrix[index] = templateItem;
                    } else {
                      option.AnswerMatrix.push(templateItem);
                    }
                  }
                });
                option.AnswerValue = option.AnswerMatrix.join("");
              } else {
                option.AnswerComplete = true;
                option.AnswerValue = "";
              }
            });
            if (
              text.Require ||
              (text.RequireLink &&
                this.optionCodeMapping[text.RequireLink] &&
                this.optionCodeMapping[text.RequireLink].AnswerChecked)
            ) {
              if (!hasChecked || !hasAllComplete) {
                // this.requireCount++;
                if (text.Text) {
                  this.requireList.push(
                    subject.Subject +
                      "/" +
                      group.Group +
                      "/" +
                      query.Query +
                      "/" +
                      text.Text
                  );
                  text.ShowMark = true;
                } else {
                  this.requireList.push(
                    subject.Subject + "/" + group.Group + "/" + query.Query
                  );
                  query.ShowMark = true;
                }
              }
            }
            // 增加log用未填寫清單
            if (!hasChecked || !hasAllComplete) {
              // this.requireCount++;
              if (text.Text) {
                this.logUnfilled.push(
                  subject.Subject +
                    "/" +
                    group.Group +
                    "/" +
                    query.Query +
                    "/" +
                    text.Text
                );
       
              } else {
                this.logUnfilled.push(
                  subject.Subject + "/" + group.Group + "/" + query.Query
                );
             
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

  showRequireList2() {
    alert(this.logUnfilled.join("\n"));
  }

  /**
   *
   * 當視窗被關閉時
   * @param {*} event
   * @returns
   * @memberof ComprehensiveFillComponent
   */
  @HostListener("window:beforeunload", ["$event"])
  onCTablose(event: any) {
    if (this.isChangeNotSave) {
      event.returnValue = "跳出提醒視窗";
      return "";
    }
  }

  setConfig() {
    if (this.config.key) {
      this.fillInKey = this.config.key;
      this.getFillInData(true);
    }
  }

  async save() {
    this.isChangeNotSave = false;
    if (this.isSaving) {
      return;
    }
    this.isSaving = true;
    const options = [];
    for (const subject of this.questionSubject) {
      for (const group of subject.QuestionGroup) {
        for (const query of group.QuestionQuery) {
          query.QuestionText.forEach((text) => {
            text.Option.forEach((option) => {
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
    try {
      // 紀錄 log : 點選儲存按鈕
      await this.send(this.dsns + "/1campus.counsel.public", "AddLog", {
        Content: `${this.studentInfo.ClassName}班 ${this.studentInfo.SeatNo}號 ${this.studentInfo.Name} 點選【儲存綜合紀錄表】`,
        IP: this.userIP,
        Action :'填寫綜合紀錄表'
      });
    } catch (e) {
      console.log("儲存log發生錯誤");
    }

    try {
      var rsp = await this.send(
        this.dsns + "/1campus.counsel.public",
        "SetFillInData",
        {   
          FillInKey: this.fillInKey,
          Option: options,
        }
      );
      // 成功的 log
      try {
        await this.send(this.dsns + "/1campus.counsel.public", "AddLog", {
          Content: `${this.studentInfo.ClassName}班 ${this.studentInfo.SeatNo}號 ${this.studentInfo.Name} 填寫綜合紀錄表 , 共${this.logUnfilled.length}項空白,空白項目如下 : \n${this.logUnfilled.join('\n')}`,
          IP: this.userIP,
          Action :'填寫綜合紀錄表'

        });
      } catch (e) {
        console.log("儲存log發生錯誤");
      }

      alert("儲存完成");
    } catch (err) {
      try {
        // 紀錄 log : 點選儲存按鈕
        await this.send(this.dsns + "/1campus.counsel.public", "AddLog", {
          Content: `${this.studentInfo.ClassName}班 ${this.studentInfo.SeatNo}號 ${this.studentInfo.Name} 儲存綜合紀錄表失敗`,
          IP: this.userIP,
          Action :'填寫綜合紀錄表'
        });
      } catch (e) {
        console.log("儲存log發生錯誤");
      }

      console.log(err);
      alert("儲存發生錯誤：\n" + JSON.stringify(err, null, 4));
    }
    this.isSaving = false;
  }

  async getContract(contractName: string): Promise<any> {
    const contract = dsutil.creatConnection(contractName);
    return await new Promise<any>((r, j) => {
      contract.ready(() => {
        r(contract);
      });
      contract.OnError((loginError, dsaError, networkError, ajaxException) => {
        j({
          loginError: loginError,
          dsaError: dsaError,
          networkError: networkError,
          ajaxException: ajaxException,
        });
      });
    });
  }

  async send(
    contractName: string,
    serviceName: string,
    body: any = {}
  ): Promise<any> {
    let conn = await this.getContract(contractName);
    return new Promise<any>((r, j) => {
      conn.send({
        service: serviceName,
        body: body,
        result: (rsp, err, xmlhttp) => {
          if (err) {
            j(err);
          } else {
            r(rsp);
          }
        },
      });
    });
  }
}
