export class QuizData {
  QuizUid: string;
  AnsUid: string;
  ImplementationDate: string;
  AnalysisDate: string;
  QuizName: string;
  

  QuizFieldList: QuizField[];
  public parseDate(dt: Date) {
    let y = dt.getFullYear();
    let m = dt.getMonth() + 1;
    let d = dt.getDate();
    let mStr = "" + m;
    let dStr = "" + d;
    if (m < 10) {
      mStr = "0" + m;
    }

    if (d < 10) dStr = "0" + d;

    return `${y}-${mStr}-${dStr}`;
  }
}

export class QuizField {
  Name: string;
  Order: number;
  Value: string;
  TempFieldName :string ;
}
