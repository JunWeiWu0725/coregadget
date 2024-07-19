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
  isGoodBehavior :boolean = false;
  daaDsaFollow :boolean =false ;

  constructor(
    public dialogRef: MatDialogRef<EditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

  }


  onCheckboxChange(selected: string) {
    // alert('selected '+selected)
    if (selected === 'detention') {
      this.isGoodBehavior = false;
      this.daaDsaFollow = false;
    
    } else if (selected === 'goodBehavior') {

      this.detention = false;
      this.daaDsaFollow = false;
    } else if (selected === 'daaDsaFollow') {

      this.detention = false;
      this.isGoodBehavior = false;
    }
  }
  ngOnInit() {
    this.comment = this.data.comment;
    this.detention = this.data.detention == true;
    this.isGoodBehavior = this.data.isGoodBehavior == true ;
    this.daaDsaFollow = this.data.daaDsaFollow == true ;
  }

  onNoClick(): void {
    this.dialogRef.close({
      comment: '',
      detention: false,
      isGoodBehavior :false,
      daaDsaFollow :false,
      confirm: false,
    });
  }

  onYesClick(): void {
    let checkAmount  =  0 ;
    this.isGoodBehavior ? checkAmount++ :checkAmount ;
    this.detention ?  checkAmount++ :checkAmount ;
    this.daaDsaFollow ? checkAmount++ :checkAmount ;
   
    if (checkAmount>1) {
 

    // alert("Good and Detention can't be selected in the same time")
    alert("please select one answer choice.")
    return ;
  }

    this.dialogRef.close({
      comment: this.comment,
      detention: this.detention,
      isGoodBehavior : this.isGoodBehavior,
      daaDsaFollow :this.daaDsaFollow,
      confirm: true,
    });




  }
}
