import { Component, Input, ElementRef, ViewChild, ChangeDetectorRef, NgZone, TemplateRef, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ViewportScroller } from '@angular/common';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import { takeUntil } from 'rxjs/operators';
import { StudentRecord, ModeRecord, CommentRecord, MoralityRecord } from '../data';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TargetDataService } from '../service/target-data.service';

@Component({
  selector: 'app-input-block',
  templateUrl: './input-block.component.html',
  styleUrls: ['./input-block.component.css']
})
export class InputBlockComponent implements OnInit, OnDestroy {

  modalRef: BsModalRef;
  dispose$ = new Subject();
  affixTop = false;
  isMobile = false;

  selectMode: 'SEAT' | 'SEQ' = 'SEQ';
  selectSeatNumber: string;
  curStudent: StudentRecord;
  curGrade = '';
  canEdit: boolean;
  newValue: any;
  displayPage: TemplateRef<any>;
  codeList: Map<string, CommentRecord> = new Map();

  private inputSeatNo: ElementRef;
  private inputTextScore: ElementRef;

  @Input()
  mode: ModeRecord = {} as ModeRecord;

  @Input()
  moralList: CommentRecord[] = [];

  @Input()
  textScoreList: MoralityRecord[] = [];

  @ViewChild('inputSeatNo') set _inputSeatNo(content: ElementRef) {
    this.inputSeatNo = content;
    this.changeDetectorRef.detectChanges();
  }

  @ViewChild('inputTextScore') set _inputTextScore(content: ElementRef) {
    this.inputTextScore = content;
    this.changeDetectorRef.detectChanges();
  }
  @ViewChild('tplSourceNoData') tplSourceNoData: TemplateRef<any>;
  @ViewChild('tplSourceLock') tplSourceLock: TemplateRef<any>;
  @ViewChild('tplTextType') tplTextType: TemplateRef<any>;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private viewportScroller: ViewportScroller,
    private scrollDispatcher: ScrollDispatcher,
    private zone: NgZone,
    private modalService: BsModalService,
    private targetDataSrv: TargetDataService,
  ) {
    this.isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/gi) ? true : false;

    // 偵測 scrollbar
    this.scrollDispatcher.scrolled().pipe(
      takeUntil(this.dispose$)
    ).subscribe(x => {
      this.zone.run(() => {
        this.setAffixTop();
      });
    });
  }

  ngOnInit(): void {
    this.targetDataSrv.student$.pipe(
      takeUntil(this.dispose$)
    ).subscribe(stu => {
      this.curStudent = stu;
      this.setTarget();
    });

    this.targetDataSrv.grade$.pipe(
      takeUntil(this.dispose$)
    ).subscribe(grade => {
      this.curGrade = grade;
      this.setTarget();
    });

    this.targetDataSrv.canEdit$.pipe(
      takeUntil(this.dispose$)
    ).subscribe(value => {
      this.canEdit = value;
      this.setTarget();
    });

    this.targetDataSrv.mode$.pipe(
      takeUntil(this.dispose$)
    ).subscribe(data => {
      this.mode = data;
      this.setTarget();
    });

  }

  ngOnDestroy(): void {
    this.dispose$.next();
  }

  /**設定學生指定方式(座號、流水號) */
  setSelectMode(mode: 'SEAT' | 'SEQ') {
    this.selectMode = mode;
    this.changeDetectorRef.detectChanges();
    if (mode === 'SEAT') {
      this.focusAndSelect(this.inputSeatNo);
    }
  }

  /**指定座號，座號重複時會選擇同座號的下一位 */
  submitStudentNo() {
    if (this.isMobile) { return; }
    this.targetDataSrv.goSeatNoStudent(this.selectSeatNumber);
  }

  /**上一個座號的學生 */
  goPrev() {
    this.targetDataSrv.goPrevSeatNoStudent();
  }

  /**下一個座號的學生 */
  goNext() {
    this.targetDataSrv.goNextSeatNoStudent();
  }

  /**設定物件 focus 及選擇反白 */
  focusAndSelect(elementRef: ElementRef) {
    if (elementRef) {
      const input: HTMLInputElement = elementRef.nativeElement;

      setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
    }
  }

  /**設定是否固定置頂 */
  setAffixTop() {
    const scroll = this.viewportScroller.getScrollPosition();
    if (scroll[1] >= 140) {
      this.affixTop = true;
    } else {
      this.affixTop = false;
    }
  }

  /**設定目前物件 */
  setTarget() {
    const grade = this.curGrade;
    const student = this.curStudent;
    this.codeList.clear();

    if (student && student.StudentID && grade) {
      if (this.mode.Title === '文字評語') {
        if (student.MoralityMapping.has(grade)) {
          this.newValue = student.MoralityMapping.get(grade).Text || '';
        } else {
          this.newValue = '';
        }

        // 設定代碼表
        this.textScoreList.forEach(item => {
          if (item.Face === this.curGrade) {
            item.Item.forEach(v => {
              this.codeList.set(v.Code, v);
            });
          }
        });
      }

      this.selectSeatNumber = student.SeatNumber;

      if (this.canEdit) {
        this.displayPage = this.tplTextType;
        this.changeDetectorRef.detectChanges();
        this.focusAndSelect(this.inputTextScore);
      } else {
        this.displayPage = this.tplSourceLock;
      }
    } else {
      this.displayPage = this.tplSourceNoData;
    }
  }

  /**設定試別 */
  setExam(grade: string) {
    this.curGrade = grade;
    this.setTarget();
  }

  /**取得成績內容 */
  getScoreText(student: StudentRecord): string {
    const grade = this.curGrade;

    if (this.mode.Title === '文字評語') {
      if (student.MoralityMapping.has(grade)) {
        return student.MoralityMapping.get(grade).Text || '';
      } else {
        return '';
      }
    }  else {
      return '';
    }
  }

  /**輸入後呼叫代碼轉換為文字、及更新成績 */
  enterGrade() {
    this.newValue = this.newValue.replace(/\n/g, '');
    if (this.isMobile) { return; }
    this.codeConvertText();
    this.submitGrade(this.newValue);
  }

  /**代碼轉換 */
  codeConvertText() {
    const aryValues = (this.newValue || '').split(',');

    const valueList = aryValues.map((str: string) => {
      if (this.codeList.has(str)) {
        return this.codeList.get(str).Comment;
      } else {
        return str;
      }
    });
    this.newValue = valueList.join(',')
  }

  /**更新成績且跳至下一位 */
  submitGrade = (score: any) => {
    this.setScoreText(score);
    this.goNext();
  }

  /**設定成績內容 */
  setScoreText(newValue: any) {
    const grade = this.curGrade;
    const student = this.curStudent;

    if (this.mode.Title === '文字評語') {
      if (student.MoralityMapping.has(grade)) {
        student.MoralityMapping.get(grade).Text = (newValue || '');
      } else {
        student.MoralityMapping.set(grade, {
          Face: grade,
          Text: newValue || '',
          Origin: '',
        });
      }
    }
    this.targetDataSrv.setStudent(student);
  }

  /**顯示文字代碼表 */
  openCommentCode(template: TemplateRef<any>) {
    this.codeList.forEach(item => item.Selected = false);
    this.modalRef = this.modalService.show(template);
  }

  /**選擇文字代碼 */
  selectCode(item: CommentRecord) {
    this.newValue += (this.newValue) ? `, ${item.Comment}` : item.Comment;
    item.Selected = true;
  }
}
