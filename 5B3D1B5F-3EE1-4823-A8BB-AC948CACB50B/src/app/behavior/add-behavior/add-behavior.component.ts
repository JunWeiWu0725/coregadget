import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassInfo, StudInfo } from 'src/app/models/vo';
import { DialogService } from "../dialog-service.service";
import { GadgetService, Contract } from "src/app/gadget.service";
import { Utils } from 'src/app/util';
import * as moment from 'moment';
import { BehaviorDataService } from '../behavior-data.service';

@Component({
  selector: 'app-add-behavior',
  templateUrl: './add-behavior.component.html',
  styles: []
})
export class AddBehaviorComponent implements OnInit {

  currentClassID: string;    // 目前被選取的班級代碼
  currentClassName: string;
  selectedStuds: StudInfo[];  //目前被選取的學生清單
  classes: any; //下拉式方塊所需要的所有班級
  selectedClass: any;

  contract: Contract;
  commentTemplateInfo: any;
  commentTemplateList: any;
  studentDataList: any;
  loading: boolean;
  isDetention: boolean;
  isGoodBehavior :boolean;
  checkCount: number;
  checkButtonEnable: string = "disabled";
  currentDateString: string;
  addText: string;
  studentDataListSelect: any;
  currentDetention: boolean;
  currentGoodBehavior : boolean ; 
  /***20240605 康橋新增 */
  currentDaaDsaFollow :boolean ;
  selectedText: any = [];
  selectedStudents: any;   //已選取的學生
  currentDate: string = moment().format("YYYY-MM-DD");
  sortType: string = 'seat';  // 排序類型：'seat' 班座排序, 'studentNumber' 學號排序

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gadget: GadgetService,
    private behaviorDataService: BehaviorDataService,
  ) { }
 

  onCheckboxChange(selected: string) {
    if (selected === 'detention') {
      this.currentGoodBehavior = false;
      this.currentDaaDsaFollow = false;
    } else if (selected === 'goodBehavior') {
      this.currentDetention = false;
      this.currentDaaDsaFollow = false;
    } else if (selected === 'currentDaaDsaFollow') {
      this.currentDetention = false;
      this.currentGoodBehavior = false;
    }
  }
  async ngOnInit() {

    this.selectedStudents = [];

    this.contract = await this.gadget.getContract("kcis");
    this.currentDateString = moment().format("YYYY-MM-DD");//取得日期字串

    //1. 取得目前的班級 :若不是蟲導師班開啟此畫面 是不會有班級編號和名稱
    this.currentClassID = this.route.snapshot.paramMap.get('classID');
    this.currentClassName = this.route.snapshot.paramMap.get('className');

    //2. 取得所有班級清單，填入下拉式方塊
    this.classes = [];
    this.getAllCalss();

    //3. 取得目前班級的學生清單
    if (this.currentClassID) {
      this.getClassStudents(this.currentClassID);
    }

    //4.取得評語樣板
    this.getCommentTemplate();
  }
  //取得評語樣板
  async getCommentTemplate() {
    try {
      this.loading = true;

      this.commentTemplateList = (await this.contract.send('behavior.GetCommentTemplate')).Response.CommentTemplate || [];

    } catch (err) {
      console.log(err);
    } finally {
      this.loading = false;
    }
  }

  //取得日期
  async currentDateChange(value) {
    this.behaviorDataService.addDate = value;
  }

  //取得All班級
  async getAllCalss() {

    const rspAllCourse = await this.contract.send("behaviorForAll.GetAllClass")
    this.classes = Utils.array(rspAllCourse, "Response/Class");
    if (this.currentClassID) {
      this.selectedClass = this.classes.find(cls => cls.ID == this.currentClassID);
    }

  }

  //取得班級的學生清單
  async getClassStudents(classSelected: string) {

    this.checkButtonEnable = "";
    this.checkCount = 0;
    this.loading = true;
    this.currentDetention = false;
    this.currentGoodBehavior = false;
    this.currentDaaDsaFollow =false ;

    //如果日期不為空
    if (this.behaviorDataService.addDate !== "") {
      this.currentDateString = this.behaviorDataService.addDate;
    }
    //如果事由不為空
    if (this.behaviorDataService.addComment !== "") {
      this.addText = this.behaviorDataService.addComment;
    }

    //取的學生資料   
    const rspStudentByClass = await this.contract.send("behaviorForAll.GetStudentsByClassID", {
      Request: {
        ClassID: classSelected
      }

    })
    const studentDataInfo = Utils.array(rspStudentByClass, "Response/Student");

    this.studentDataList = [];
    //讀取學生的資料
    for (const data of studentDataInfo) {
      //如果被選學生數量大於0 
      if (this.selectedStudents.length > 0) {
        for (const selectdata of this.selectedStudents) {
          //如果 被選學生的ID=  該班學生的ID,就設為已被選取，以顯示這班被選取狀況。
          if (selectdata.ID === data.ID) {
            data.checked = true;
          }
        }
      } else {
        data.checked = false;
      }
      data.PhotoUrl = `${this.contract.getAccessPoint}/behavior.GetStudentPhoto?stt=Session&sessionid=${this.contract.getSessionID}&parser=spliter&content=StudentID:${data.ID}`;
      this.studentDataList.push(data);
    }
    // 排序學生列表
    this.sortStudentList();
  }

  // 排序變更處理
  onSortChange() {
    this.sortStudentList();
  }

  // 排序學生列表
  sortStudentList() {
    if (!this.studentDataList || this.studentDataList.length === 0) {
      return;
    }

    if (this.sortType === 'seat') {
      // 班座排序：按 SeatNo 排序
      this.studentDataList.sort((a, b) => {
        const seatA = parseInt(a.SeatNo) || 0;
        const seatB = parseInt(b.SeatNo) || 0;
        return seatA - seatB;
      });
    } else if (this.sortType === 'studentNumber') {
      // 學號排序：按 StudentNumber 排序
      this.studentDataList.sort((a, b) => {
        const numA = a.StudentNumber || '';
        const numB = b.StudentNumber || '';
        return numA.localeCompare(numB);
      });
    }

    // 同時排序已選擇的學生列表
    this.sortSelectedStudents();
  }

  // 排序已選擇的學生列表
  sortSelectedStudents() {
    if (!this.selectedStudents || this.selectedStudents.length === 0) {
      return;
    }

    if (this.sortType === 'seat') {
      // 班座排序：按 SeatNo 排序
      this.selectedStudents.sort((a, b) => {
        const seatA = parseInt(a.SeatNo) || 0;
        const seatB = parseInt(b.SeatNo) || 0;
        return seatA - seatB;
      });
    } else if (this.sortType === 'studentNumber') {
      // 學號排序：按 StudentNumber 排序
      this.selectedStudents.sort((a, b) => {
        const numA = a.StudentNumber || '';
        const numB = b.StudentNumber || '';
        return numA.localeCompare(numB);
      });
    }
  }

  //選擇班級變換後
  onClassSelected() {
    this.getClassStudents(this.selectedClass.ID);
  }

  async selectItem(data: any) {

    this.addText = data.Comment;
  }

  //點學生照片
  clickPicture(student: any) {

    //選取 
    const targetStud = this.selectedStudents.find(item => { return item.ID === student.ID });
    // 如果此學生存在 已被選取的學生清單

    if (targetStud) {
      //取消選取
      student.checked = false;
      this.selectedStudents.splice(this.selectedStudents.findIndex(item => item.ID === student.ID), 1);
    }
    else {
      //設定為已選取
      student.checked = true;
      this.selectedStudents.push(student);
      // 排序已選擇的學生列表
      this.sortSelectedStudents();
    }

  }

  async save() {

    this.checkButtonEnable = "disabled";
    try {

      this.loading = true;
      let rsp: any;
      let checkCanSend: Boolean = true;
      let checkCanSendError: String = "";

      if (!this.currentDateString) {
        checkCanSend = false;
        checkCanSendError = "請輸入日期 \n";
      }

      if (!this.addText) {
        checkCanSend = false;
        checkCanSendError += "請輸入事由內容 \n";
      }

      if (this.selectedStudents.length === 0) {
        checkCanSend = false;
        checkCanSendError += "請選取學生 \n";
      }
      if (this.currentGoodBehavior === true && this.currentDetention === true) {
        checkCanSend = false;
        checkCanSendError += "Good 和 Detention 不可同時勾選 \n";
      }



      if (checkCanSend === true) {

        // 多筆傳送
        let items: any;
        items = [];
        for (const data of this.selectedStudents) {
          if (data.checked === true) {
            let item = {
              Field: {
                Comment: this.addText,
                CreateDate: this.currentDateString,
                CourseID: null,
                Detention: this.currentDetention ? "true" : "false",
                IsGoodBehavior: this.currentGoodBehavior ? "true" : "false",
                DaaDsaFollow :this.currentDaaDsaFollow ? "true" : "false",
                StudentID: data.ID
              }
            }
            items.push(item);
          }
        }

        let reqStr = JSON.stringify(items);
        rsp = (await this.contract.send('behaviorForAll.AddBehaviorData', { Request: { BehaviorData: items } }));

        alert('已儲存！');

        // 清空暫存值
        this.behaviorDataService.addDate = "";
        this.behaviorDataService.addComment = "";
        this.behaviorDataService.addCheckStudentList = [];
        // 回到 list
     
        if (!this.currentClassID) {
          this.router.navigate(['../list'], {
            relativeTo: this.route
          }
          );

        } else {
          this.router.navigate(['../../../list'], {
            relativeTo: this.route
          }
          );
        }
      } else {
        alert(checkCanSendError);
        this.checkButtonEnable = "";
      }
    } catch (err) {
      console.log(err);
    } finally {
      this.loading = false;
    }
  }

}
