import { Component, OnInit, Optional } from '@angular/core';
import { CounselDetailComponent } from '../counsel-detail.component';
import { DsaService } from '../../dsa.service';
import { StudentBaseInfo, UpdateRecordInfo } from './base-info-detail';

@Component({
  selector: 'app-base-info-detail',
  templateUrl: './base-info-detail.component.html',
  styleUrls: ['./base-info-detail.component.css']
})
export class BaseInfoDetailComponent implements OnInit {
  isLoading = false;
  serviceSchoolCoreInfo: string = "GetSchoolCoreInfo";
  // 學校型態,JHHC,JHKH,SH
  selectSchoolType: string = "";
  // 異動資料
  UpdateRecordList: UpdateRecordInfo[] = [];
  currentStudentBaseInfo: StudentBaseInfo = new StudentBaseInfo();
  constructor(private dsaService: DsaService,
    @Optional() private counselDetailComponent: CounselDetailComponent) { }

  async ngOnInit() {
    this.counselDetailComponent.setCurrentItem('base_info_detail');
    console.log(' this.counselDetailComponent', this.counselDetailComponent.currentStudent)
    this.isLoading = true;
    // 取得學制
    await this.GetSchoolCoreInfo();
    // 取得學生基本資料
    await this.GetBaseInfoDetail();
    // 取得異動資料
    await this.GetUpdateRecord();
    this.isLoading = false;
  }

  // 取得學制
  async GetSchoolCoreInfo() {
    try {
      let resp = await this.dsaService.send(this.serviceSchoolCoreInfo, {});

      let SchoolCoreInfo = [].concat(resp.SchoolCoreInfo || []);
      SchoolCoreInfo.forEach(item => {
        if (item.成績核心 === '高中一般') {
          this.selectSchoolType = 'SH';
        } else if (item.成績核心 === '國中高雄') {
          this.selectSchoolType = 'JHKH';
        } else {
          this.selectSchoolType = 'JHHC';
        }
      });

    } catch (err) {
      alert('無法取得學制：' + err.dsaError.message);
    }
  }

  // 基本資料
  async GetBaseInfoDetail() {
    this.isLoading = true;
    try {

      let resp = await this.dsaService.send("GetStudentBaseInfo", {
        Request: {
          StudentID: this.counselDetailComponent.currentStudent.StudentID
        }
      });

      let Data = [].concat(resp.Student || []);
      Data.forEach(item => {

        let studInfo: StudentBaseInfo = new StudentBaseInfo();
        studInfo.StudentID = item.StudentID;
        studInfo.Name = item.Name;
        studInfo.EnglishName = item.EnglishName;
        studInfo.Birthdate = item.Birthdate;
        studInfo.IDNumber = item.IDNumber;
        studInfo.StudentNumber = item.StudentNumber;
        studInfo.Gender = item.Gender;
        studInfo.ParseAddressXML(item.PermanentAddress, item.MailingAddress, item.OtherAddress);
        studInfo.PermanentPhone = item.PermanentPhone;
        studInfo.StudentContactPhone = item.StudentContactPhone;
        studInfo.PhotoUrl = `${
          this.dsaService.AccessPoint
          }/GetStudentPhoto?stt=Session&sessionid=${
          this.dsaService.SessionID
          }&parser=spliter&content=StudentID:${item.StudentID}`;
        studInfo.ParseOtherPhonesXML(item.OtherPhones);
        //studInfo.OtherPhones = item.OtherPhones;
        studInfo.SmsPhone = item.SmsPhone;
        studInfo.BeforeEnrollment = item.BeforeEnrollment;
        studInfo.ContactName = item.ContactName;
        studInfo.ContactTitle = item.ContactTitle;
        studInfo.ContactPhone = item.ContactPhone;
        studInfo.ContactMobile = item.ContactMobile;
        studInfo.ContactOffice = item.ContactOffice;
        studInfo.SecondContactName = item.SecondContactName;
        studInfo.SecondContactTitle = item.SecondContactTitle;
        studInfo.SecondContactPhone = item.SecondContactPhone;
        studInfo.SecondContactMobile = item.SecondContactMobile;
        studInfo.SecondContactOffice = item.SecondContactOffice;
        studInfo.ThirdContactName = item.ThirdContactName;
        studInfo.ThirdContactTitle = item.ThirdContactTitle;
        studInfo.ThirdContactPhone = item.ThirdContactPhone;
        studInfo.ThirdContactMobile = item.ThirdContactMobile;
        studInfo.ThirdContactOffice = item.ThirdContactOffice;
        //Email
        studInfo.MotherEmail =  item.MotherEmail ;
        studInfo.FatherEmail = item.FatherEmail ;
        studInfo.GuardianEmail =item.GuardianEmail;
        // 緊急聯絡人
        studInfo.ContactName = item.ContactName;
        studInfo.ContactTitle = item.ContactTitle;
        studInfo.ContactPhone = item.ContactPhone;
        studInfo.ContactMobile = item.ContactMobile;
        studInfo.ContactOffice = item.ContactOffice;
        studInfo.SecondContactName = item.SecondContactName;
        studInfo.SecondContactTitle = item.SecondContactTitle;
        studInfo.SecondContactPhone = item.SecondContactPhone;
        studInfo.SecondContactMobile = item.SecondContactMobile;
        studInfo.SecondContactOffice = item.SecondContactOffice;
        studInfo.ThirdContactName = item.ThirdContactName;
        studInfo.ThirdContactTitle = item.ThirdContactTitle;
        studInfo.ThirdContactPhone = item.ThirdContactPhone;
        studInfo.ThirdContactMobile = item.ThirdContactMobile;
        studInfo.ThirdContactOffice = item.ThirdContactOffice;
        studInfo.FatherName = item.FatherName;
        studInfo.FatherNationality = item.FatherNationality;
        studInfo.MotherName = item.MotherName;
        studInfo.MotherNationality = item.MotherNationality;
        studInfo.CustodianName = item.CustodianName;
        studInfo.CustodianNationality = item.CustodianNationality;
        studInfo.CustodianRelationship = item.CustodianRelationship;
        studInfo.ParseFatherMontherCXML(item.Father_otherInfo,item.MotherOtherInfo,item.CustodianOtherInfo);
        // 前級畢業資訊
        studInfo.ParseBeforeEnrollmentXML(item.BeforeEnrollment);
        this.currentStudentBaseInfo = studInfo;
      });

    } catch (err) {
      alert('無法取得學生基本資料：' + err.dsaError.message);
    }


  }

  // 異動資料
  async GetUpdateRecord() {
    try {
      let rspUpdateRec;
      // 取得異動資料 高中
      if (this.selectSchoolType === 'SH') {
        rspUpdateRec = await this.dsaService.send("GetUpdateRecordSHByStudentID", {
          Request: {
            StudentID: this.counselDetailComponent.currentStudent.StudentID
          }
        });
      } else {
        rspUpdateRec = await this.dsaService.send("GetUpdateRecordJHByStudentID", {
          Request: {
            StudentID: this.counselDetailComponent.currentStudent.StudentID
          }
        });
      }
      this.UpdateRecordList = [];
      let UpdateRecordRsp = [].concat(rspUpdateRec.UpdateRecord || []);

      UpdateRecordRsp.forEach(item => {
        if (item.StudentID === this.currentStudentBaseInfo.StudentID) {
          let ur:UpdateRecordInfo = new  UpdateRecordInfo();
          ur.StudentID = item.StudentID;
          ur.SchoolYear = parseInt(item.SchoolYear);
          ur.Semester = parseInt(item.Semester);
          ur.GradeYear = parseInt(item.GradeYear);
          ur.UpdateDate = item.UpdateDate;
          ur.UpdateCode = item.UpdateCode;
          ur.UpdateDesc = item.UpdateDesc;
          ur.AdDate = item.AdDate;
          ur.AdNumber = item.AdNumber;
          this.UpdateRecordList.push(ur);
        }
      });

      //console.log('UpdateRecordRsp'+UpdateRecordRsp.length);
    } catch (err) {
      alert('無法取得異動資料：' + err.dsaError.message);
    }
  }
}
