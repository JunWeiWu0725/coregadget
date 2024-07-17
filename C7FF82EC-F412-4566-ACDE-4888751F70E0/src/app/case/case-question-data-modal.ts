export class QOption {
  constructor() {}
  answer_code: string;
  answer_text: string;
  answer_value: string;
  answer_martix: string[];
  answer_complete: boolean;
  answer_checked: boolean;

  public setAnswerCheck() {
    this.answer_checked = !this.answer_checked;
  }
}
