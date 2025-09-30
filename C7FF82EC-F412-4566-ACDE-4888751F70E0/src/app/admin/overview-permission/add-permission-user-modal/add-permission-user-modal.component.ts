import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { DsaService } from 'src/app/dsa.service';
import { GlobalService } from 'src/app/global.service';

// 教師基本資料結構
interface Teacher {
  teacher_id: string;
  teacher_name: string;
  nickname?: string;
}

// 使用者資料結構
interface UserData {
  teacher_name: string;
  permissions: {
    [key: string]: boolean;
  };
  note: string;
  start_at: string;  // 開始時間
  end_at: string;    // 結束時間
}

// 編輯模式的使用者資料結構（包含ID）
interface EditUserData extends UserData {
  teacherId?: string;
}

// 權限項目結構
interface PermissionItem {
  code: string;
  name: string;
}

@Component({
  selector: 'app-add-permission-user-modal',
  templateUrl: './add-permission-user-modal.component.html',
  styleUrls: ['./add-permission-user-modal.component.css']
})
export class AddPermissionUserModalComponent implements OnInit, OnChanges {

  @Input() isVisible: boolean = false;
  @Input() editMode: boolean = false; // 新增：編輯模式標記
  @Input() editUser: EditUserData | null = null; // 新增：要編輯的使用者資料
  @Output() onSave = new EventEmitter<EditUserData>();
  @Output() onClose = new EventEmitter<void>();

  userData: EditUserData = {
    teacherId: '',
    teacher_name: '',
    permissions: {
      'comp_record': false,
      'first_level_counsel': false,
      'case_view': false,
      'psych_test': false,
      'statistics': false
    },
    note: '',
    start_at: '',
    end_at: ''
  };

  permissionList: PermissionItem[] = [
    { code: 'comp_record', name: '檢視綜合記錄表' },
    { code: 'first_level_counsel', name: '檢視一級晤談' },
    { code: 'case_view', name: '檢視個案' },
    { code: 'psych_test', name: '檢視心理測驗' },
    { code: 'statistics', name: '檢視統計' }
  ];

  // 教師相關資料
  allTeachers: Teacher[] = [];
  filteredTeachers: Teacher[] = [];
  showTeacherDropdown: boolean = false;
  searchKeyword: string = '';

  isUserNameValid: boolean = false;
  isFormValid: boolean = false;

  constructor(
    private dsaService: DsaService,
    private globalService: GlobalService
  ) { }

  ngOnInit() {
    this.validateForm();
    this.loadAllTeachers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isVisible && this.isVisible) {
      this.initializeForm();
    }
    if (changes.editUser && this.editUser) {
      this.loadEditData();
    }
  }

  /** 載入全校教師資料 */
  async loadAllTeachers() {
    try {
      console.log('載入全校教師資料...');
      const response = await this.dsaService.send('GetAllTeacher', {});
      console.log('GetAllTeacher 回應:', response);
      
      if (response && Array.isArray(response)) {
        // 直接是陣列格式
        this.allTeachers = response.map((teacher: any) => ({
          teacher_id: teacher.teacher_id || teacher.TeacherId || teacher.ID || '',
          teacher_name: teacher.teacher_name || teacher.TeacherName || teacher.Name || '',
          nickname: teacher.nickname || teacher.Nickname || ''
        }));
        console.log('處理後的教師資料:', this.allTeachers);
      } else {
        console.log('GetAllTeacher 格式不符，嘗試使用 _.GetAllTeacher...');
        const response2 = await this.dsaService.send('_.GetAllTeacher', {});
        console.log('_.GetAllTeacher 回應:', response2);
        
        if (response2 && response2.Teacher && Array.isArray(response2.Teacher)) {
          // 格式是 { Teacher: [...] }
          this.allTeachers = response2.Teacher.map((teacher: any) => {
            console.log('處理教師資料:', teacher);
            return {
              teacher_id: teacher.teacher_id || teacher.TeacherId || teacher.ID || '',
              teacher_name: teacher.teacher_name || teacher.TeacherName || teacher.Name || '',
              nickname: teacher.nickname || teacher.Nickname || ''
            };
          });
          console.log('處理後的教師資料:', this.allTeachers);
        } else {
          console.warn('兩種 API 都無法取得正確的教師資料');
          this.allTeachers = [];
        }
      }
    } catch (error) {
      console.error('載入全校教師資料失敗:', error);
      this.allTeachers = [];
    }
  }

  /** 搜尋教師 */
  searchTeachers(keyword: string) {
    this.searchKeyword = keyword;
    
    if (!keyword.trim()) {
      this.filteredTeachers = this.allTeachers.slice(0, 10); // 顯示前10筆
    } else {
      this.filteredTeachers = this.allTeachers.filter(teacher => 
        teacher.teacher_name.includes(keyword) || 
        (teacher.nickname && teacher.nickname.includes(keyword)) ||
        teacher.teacher_id.includes(keyword)
      ).slice(0, 10); // 最多顯示10筆搜尋結果
    }
  }

  /** 處理姓名輸入 */
  onTeacherNameInput(event: any) {
    const value = event.target.value;
    this.userData.teacher_name = value;
    this.searchTeachers(value);
    this.showTeacherDropdown = true;
    this.validateForm();
  }

  /** 處理姓名輸入框焦點 */
  onTeacherNameFocus() {
    if (!this.editMode) {
      this.searchTeachers(this.userData.teacher_name);
      this.showTeacherDropdown = true;
    }
  }

  /** 處理姓名輸入框失焦 */
  onTeacherNameBlur() {
    // 延遲隱藏下拉選單，讓點擊事件有時間執行
    setTimeout(() => {
      this.showTeacherDropdown = false;
    }, 200);
  }

  /** 選擇教師 */
  selectTeacher(teacher: Teacher) {
    this.userData.teacher_name = teacher.teacher_name;
    this.userData.teacherId = teacher.teacher_id;
    this.showTeacherDropdown = false;
    this.validateForm();
    console.log('選擇教師:', teacher);
  }

  /** 初始化表單 */
  initializeForm() {
    if (this.editMode && this.editUser) {
      this.loadEditData();
    } else {
      this.resetForm();
    }
  }

  /** 載入編輯資料 */
  loadEditData() {
    if (this.editUser) {
      this.userData = {
        teacherId: this.editUser.teacherId || '',
        teacher_name: this.editUser.teacher_name || '',
        permissions: { ...this.editUser.permissions },
        note: this.editUser.note || '',
        start_at: this.editUser.start_at || '',
        end_at: this.editUser.end_at || ''
      };
      console.log('載入編輯資料:', this.userData);
      this.validateForm();
    }
  }

  /** 重置表單 */
  resetForm() {
    this.userData = {
      teacherId: '',
      teacher_name: '',
      permissions: {
        'comp_record': false,
        'first_level_counsel': false,
        'case_view': false,
        'psych_test': false,
        'statistics': false
      },
      note: '',
      start_at: '',
      end_at: ''
    };
    this.validateForm();
  }

  /** 表單驗證 */
  validateForm() {
    // 在編輯模式下，姓名欄位是唯讀的，所以自動視為有效
    // 在新增模式下，需要檢查姓名是否有輸入
    this.isUserNameValid = this.editMode || this.userData.teacher_name.trim().length > 0;
    this.isFormValid = this.isUserNameValid;
  }

  /** 切換權限狀態 */
  togglePermission(permissionCode: string) {
    this.userData.permissions[permissionCode] = !this.userData.permissions[permissionCode];
  }

  /** 取得當前日期時間字串 (用於預設值) */
  getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /** 設定開始時間為現在 */
  setStartTimeNow() {
    this.userData.start_at = this.getCurrentDateTime();
  }

  /** 清除結束時間 */
  clearEndTime() {
    this.userData.end_at = '';
  }

  /** 格式化日期時間用於預覽顯示 */
  formatDateTimeForPreview(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      
      // 檢查是否為有效日期
      if (isNaN(date.getTime())) {
        return dateTimeString;
      }
      
      // 格式化為更友善的顯示格式
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      // 判斷是上午還是下午
      const period = date.getHours() >= 12 ? '下午' : '上午';
      const displayHours = date.getHours() > 12 ? date.getHours() - 12 : 
                          date.getHours() === 0 ? 12 : date.getHours();
      
      return `${year}/${month}/${day} ${period} ${String(displayHours).padStart(2, '0')}:${minutes}`;
    } catch (error) {
      console.error('預覽日期格式化錯誤:', error);
      return dateTimeString;
    }
  }

  /** 取得 Modal 標題 */
  getModalTitle(): string {
    return this.editMode ? '編輯使用者' : '新增使用者';
  }

  /** 取得儲存按鈕文字 */
  getSaveButtonText(): string {
    return this.editMode ? '更新' : '儲存';
  }

  /** 關閉 Modal */
  close() {
    this.isVisible = false;
    this.onClose.emit();
  }

  /** 儲存使用者 */
  save() {
    if (this.isFormValid) {
      console.log(`${this.editMode ? '更新' : '儲存'}使用者資料:`, this.userData);
      this.onSave.emit({ ...this.userData });
      this.close();
    }
  }

}
