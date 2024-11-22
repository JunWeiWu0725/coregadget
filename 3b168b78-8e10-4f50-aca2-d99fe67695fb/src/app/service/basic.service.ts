import { Injectable } from '@angular/core';
import { GadgetService } from '../gadget.service';
import { StudentRecord, MoralityMapping } from '../data';

@Injectable({
  providedIn: 'root'
})
export class BasicService {

  private _conn1: any;
  private _conn2: any;
  private _faces: string[] = [];

  constructor(
    private gadget: GadgetService,
  ) {
    this._conn1 = this.gadget.getContract('ta');
    this._conn2 = this.gadget.getContract('virtue_hs_teacher');
  }

  async connection1() {
    return this._conn1;
  }

  async connection2() {
    return this._conn2;
  }

  /**
   *取得主機時間
   */
  async getCurrentDateTime() {
    const conn = await this.connection1();

    const rsp = await conn.send('TeacherAccess.GetCurrentDateTime');
    return rsp.Response && rsp.Response.DateTime || '';
  }

  /**
   *取得目前學年期
   */
  async getCurrentSemester() {
    const conn = await this.connection1();

    const rsp = await conn.send('TeacherAccess.GetCurrentSemester', {});

    const curSchoolYear = rsp.Current.SchoolYear;
		const curSemester = rsp.Current.Semester;
    return {
      curSchoolYear: curSchoolYear,
      curSemester: curSemester,
    }
  }

  /**
   *取得代碼表(評語代碼 + 評語內容)
   */
  async getMoralCommentMappingTable() {
    const conn = await this.connection1();

    const rsp = await conn.send('TeacherAccess.GetMoralCommentMappingTable');
    return [].concat(
      rsp.GetMoralCommentMappingTable
      && rsp.GetMoralCommentMappingTable.Morality || []);
  }

  /**
   *取得文字評量代碼表(主項目>代碼 + 文字評量)
   */
  async getTextScoreMappingTable() {
    const conn = await this.connection1();

    const rsp = await conn.send('TeacherAccess.GetTextScoreMappingTable');

    const faces: string[] = [];
    const data = [].concat(
      rsp.GetWordCommentListResponse
      && rsp.GetWordCommentListResponse.Content
      && rsp.GetWordCommentListResponse.Content.Morality || []
    );
    data.forEach(morality => {
      faces.push(morality.Face);
      morality.Item = [].concat(morality.Item || []);
    });
    this._faces = faces;
    return data;
  }

  /**
   *取得德行成績設定值
   */
  async getMoralUploadConfig() {
    const conn = await this.connection1();

    const rsp = await conn.send('TeacherAccess.GetMoralUploadConfig');
    return rsp.Response || {};
  }

  /**
   *取得班級清單
   */
  async getClass() {
    const conn = await this.connection1();

    const rsp = await conn.send('TeacherAccess.GetMyClasses', {
      Content: {
        Field: {
          ClassID: '',
          ClassName: '',
          GradeYear: ''
        },
        Order: {
          ClassName: ''
        }
      }
    });
    return [].concat(rsp.ClassList && rsp.ClassList.Class || []);
  }

  /**
   *取得班級學生成績
   */
  async getStudentScore(classId: string, schoolYear: string, semester: string) {
    const conn = await this.connection2();

    const rsp = await conn.send('_.GetStudentSupervisedDiff', {
      Content: {
        Field: 'All',
        Condition: {
          ClassID: classId,
          SchoolYear: schoolYear,
          Semester: semester
        },
        Order: {
          SeatNumber: 'ASC'
        }
      }
    });
    const data: StudentRecord[] = [].concat(
      rsp.StudentSupervisedDiff
      && rsp.StudentSupervisedDiff.SupervisedDiff || []
    );
    data.forEach((student, idx) => {
      student.Index = idx;
      student.Origin_Comment = student.Comment;

      const morality: Map<string, MoralityMapping> = new Map();
      this._faces.forEach(face => {
        morality.set(face, {
          Face: face,
          Text: '',
          Origin: ''
        });
      });
      if (student.TextScore && student.TextScore.Morality) {
        [].concat(student.TextScore.Morality || []).forEach(item => {
          if (morality.has(item.Face)) {
            const tmp = morality.get(item.Face);
            tmp.Face = item.Face || '';
            tmp.Text = item['@text'] || '';
            tmp.Origin = item['@text'] || '';
          }
        });
      }
      student.MoralityMapping = morality;
    });
    return data as StudentRecord[];
  }

  /**
   *儲存文字評量成績
   */
  async saveTextSupervised(content: any) {
    const conn = await this.connection1();

    const rsp = await conn.send('TeacherAccess.SetStudentSupervisedDiff', {
      Content: content
    });
    return rsp;
  }
}
