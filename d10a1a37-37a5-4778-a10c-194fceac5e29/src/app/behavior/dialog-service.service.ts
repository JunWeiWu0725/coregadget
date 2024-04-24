import { MatDialog } from '@angular/material';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmCancelComponent } from './confirm-cancel.component';
import { Injectable } from '@angular/core';
import { EditDialogComponent } from './edit-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(public dialog: MatDialog) { }

  /**
   * 簡單的詢問視窗(僅確定 or 取消)
   * @param title 標題
   * @param body 內容
   */
  public async confirm(title: string, body: string): Promise<boolean> {

    return new Promise<boolean>((r, j) => {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '250px',
        data: { title: title, body: body }
      });

      dialogRef.afterClosed().subscribe(result => {
        r(result);
      });
    });

  }


  /**
   * 取消預約，並輸入原因(僅確定 or 取消)
   * @param title 標題
   * @param body 內容
   */
  public async confirmCancel(title: string, body: string, reason: string, width: string = '300px'): Promise<CancelResult> {

    return new Promise<CancelResult>((r, j) => {
      const dialogRef = this.dialog.open(ConfirmCancelComponent, {
        width: width,
        data: {
          title: title, body: body, reason: reason
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          r(result);
        } else {
          r({
            reason: reason,
            confirm: false,
          })
        }
      });
    });

  }

  /**
   * 取消預約，並輸入原因(僅確定 or 取消)
   * @param title 標題
   * @param body 內容
   */
  public async editDialog(title: string, body: string, comment: string, detention: boolean, isGoodBehavior : boolean ,daaDsaFollow:boolean,width: string = '450px'): Promise<EditDialogResult> {

    return new Promise<EditDialogResult>((r, j) => {
      const dialogRef = this.dialog.open(EditDialogComponent, {
        width: width,
        data: {
          title: title,
          body: body,
          comment: comment,
          detention: detention,
          isGoodBehavior : isGoodBehavior,
          daaDsaFollow :daaDsaFollow 
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          r(result);
        } else {
          r({
            comment: comment,
            detention: false,
            isGoodBehavior: false,
            daaDsaFollow :false ,
            confirm: false,
          })
        }
      });
    });

  }
}

export interface EditDialogResult {
  comment: string;
  detention: boolean;
  isGoodBehavior :boolean;
  daaDsaFollow :boolean
  confirm: boolean;
}

export interface CancelResult {
  reason: string;
  confirm: boolean;
}