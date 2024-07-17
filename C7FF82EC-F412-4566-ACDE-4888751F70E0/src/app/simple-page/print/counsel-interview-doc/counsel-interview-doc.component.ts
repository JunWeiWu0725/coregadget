import { GlobalService } from './../../../global.service';
import { RoleService } from "./../../../role.service";
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { DsaService } from 'src/app/dsa.service';
import * as moment from 'moment';
import { VirtualTimeScheduler } from 'rxjs';

@Component({
  selector: 'app-counsel-interview-doc',
  templateUrl: './counsel-interview-doc.component.html',
  styleUrls: ['./counsel-interview-doc.component.css']
})
export class CounselInterviewDocComponent implements OnInit {
  isLoading = false;
  studentID: string;
  StudentNumber: string;
  SchoolName: string;
  StudentName: string;
  param: ICounselInterviewDocRec;
  addBlank: number[] = [];
  startDate: string = "";
  endDate: string = "";
  reportData: any;
  isDisplayCounsel: boolean = false;
  isDisplayCase: boolean = false;
  OnlyPrintMine :boolean = false ; 
  teacherID :string  ="";
  // 一級輔導
  CounselInterview: any[] = [];

  // 二級輔導
  CaseInterview: any[] = [];

  constructor(private activatedRoute: ActivatedRoute,
    private router: Router,
    private dsaService: DsaService,
    private RoleService : RoleService ,
    private globalService :GlobalService) {
  }



  async ngOnInit() {
   
    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.OnlyPrintMine = localStorage.getItem('OnlyPrintMine') =='true';
        this.teacherID = JSON.parse(localStorage.getItem('teacherID'));
        this.param = JSON.parse(params.get("param"));
      }
    );
    await this.getReportData();
  }

  // 取得報表資料
  async getReportData() {
    this.isLoading = true;
    this.isDisplayCounsel = false;
    this.isDisplayCase = false;
  //  alert("sss"+JSON.stringify(this.RoleService.role))
  //  alert("globalService"+JSON.stringify( this.globalService.MyCounselTeacherRole))
    try {
      console.log("gloableService")
      if( this.globalService.MyCounselTeacherRole=='輔導主任' && (this.RoleService.role.indexOf('輔導老師') >= 0 )){
          debugger
          this.reportData = await this.dsaService.send("GetPrintCounselData12ByStudentID", {
          StudentID: this.param.studentID,
          StartDate: this.param.StartDate,
          EndDate: this.param.EndDate ,
        
        });
      }else if(this.RoleService.role.indexOf('輔導老師') >= 0) {
        debugger
        this.reportData = await this.dsaService.send("GetPrintCounselData12ByStudentIDandTeacherID", {
          StudentID: this.param.studentID,
          StartDate: this.param.StartDate,
          EndDate: this.param.EndDate ,
        });
      console.log("only my self  ")


      }

      if (this.reportData.SchoolName) {
        this.SchoolName = this.reportData.SchoolName;
      }

      if (this.reportData.StudentName) {
        this.StudentName = this.reportData.StudentName;
      }

      if (this.reportData.StudentNumber) {
        this.StudentNumber = this.reportData.StudentNumber;
      }

      // 一級輔導
      this.CounselInterview = [];
      if (this.reportData.CounselInterview) {
        this.CounselInterview = [].concat(this.reportData.CounselInterview || []);

        // 解析資料
        this.CounselInterview.forEach((data) => {

          let disp: boolean = false;

          if (data.isPrivate === 'f') {
            data.isPublic = '是';
            // 公開
            if (this.param.P1T) {
              disp = true;
            }
          } else {
            // 不公開
            if (this.param.P1F) {
              data.isPublic = '否';
              disp = true;
            }
          }

          data.isDisplay = disp;
          let cate_strs: string[] = [];
          if (data.Category) {
            data.category_json = JSON.parse(data.Category);
            data.category_json.forEach((data1) => {
              if (data1.answer_checked) {
                let strValue = data1.answer_text;

                // 有其他時
                if (data1.answer_text.indexOf('其他%text') > -1) {
                  strValue = data1.answer_martix.join('：');
                }

                cate_strs.push(strValue);
              }
            });

            data.category_text = cate_strs.join('、');
          }
          if (disp) {
            this.isDisplayCounsel = true;
          }

        });
      }

      // 二級輔導
      this.CaseInterview = [];
      if (this.reportData.CaseInterview) {
        this.CaseInterview = [].concat(this.reportData.CaseInterview || []);

        // 解析資料
        this.CaseInterview.forEach((data) => {

          let disp: boolean = false;

          if (data.isPrivate === 'f') {
            data.isPublic = '是';
            // 公開
            if (this.param.P2T) {
              disp = true;
            }
          } else {
            // 不公開
            if (this.param.P2F) {
              data.isPublic = '否';
              disp = true;
            }
          }

          data.isDisplay = disp;
          let cate_strs: string[] = [];
          if (data.Category) {
            data.category_json = JSON.parse(data.Category);
            data.category_json.forEach((data1) => {
              if (data1.answer_checked) {

                let strValue = data1.answer_text;

                // 有其他時
                if (data1.answer_text.indexOf('其他%text') > -1) {
                  strValue = data1.answer_martix.join('：');
                }

                cate_strs.push(strValue);
              }
            });

            data.category_text = cate_strs.join('、');
          }
          if (disp) {
            this.isDisplayCase = true;
          }
        });

      }

      this.addBlank = [];
      // 判斷加入幾個空白
      if (this.CounselInterview.length > 0) {
        let n: number = (20 - this.CounselInterview.length);
        if (n > 1) {
          for (let i = 1; i <= n; i++) {
            this.addBlank.push(i);
          }
        }
      } else {
        for (let i = 1; i <= 20; i++) {
          this.addBlank.push(i);
        }
      }


    } catch (error) {
      alert("發生錯誤!AA" +JSON.stringify(error))
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }

}

interface ICounselInterviewDocRec {
  studentID: string;
  StartDate: string;
  EndDate: string;
  P1T: boolean;
  P1F: boolean;
  P2T: boolean;
  P2F: boolean;
}