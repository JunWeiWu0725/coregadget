import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styles: []
})
export class EditDialogComponent implements OnInit {

  comment: string = '';
  detention: boolean = false;
  goodBehavior: boolean = false;
  daaDsaFollow:boolean =false ;
  alertText: string = "";


  constructor(
    public dialogRef: MatDialogRef<EditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

  }
  onCheckboxChange(selected: string) {
    if (selected === 'detention') {
      this.goodBehavior = false;
      this.daaDsaFollow = false;
    } else if (selected === 'goodBehavior') {
      this.detention = false;
      this.daaDsaFollow = false;
    } else if (selected === 'currentDaaDsaFollow') {
      this.detention = false;
      this.goodBehavior = false;
    }
  }
  ngOnInit() {
    this.comment = this.data.comment;
    this.detention = this.data.detention == true;
    this.goodBehavior = this.data.goodBehavior == true;
    this.daaDsaFollow =this.data.daaDsaFollow == true ;
  }

  onNoClick(): void {
    this.dialogRef.close({
      comment: '',
      detention: false,
      goodBehavior: false,
      daaDsaFollow :false,
      confirm: false,
    });
  }

  onYesClick(): void {

    this.alertText = "";
    //如果Detention 跟 Good 同時勾選
    if (this.detention === true && this.goodBehavior === true) {
      this.alertText += "Detention 和 Good 不能同時勾選 \n";
    }
    //如果事由未輸入
    if (this.comment.trim() == "" || !(this.comment)) {
      this.alertText += "請輸入事由內容 \n";
    }
    if (this.alertText !== "") {
      alert(this.alertText);
    } else {
      this.dialogRef.close({
        comment: this.comment,
        detention: this.detention,
        goodBehavior: this.goodBehavior,
        daaDsaFollow :this.daaDsaFollow,
        confirm: true
      });
    }
  }
}
