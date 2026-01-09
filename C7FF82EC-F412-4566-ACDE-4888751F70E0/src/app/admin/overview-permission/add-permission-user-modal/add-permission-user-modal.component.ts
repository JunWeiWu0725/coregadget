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
  teacher_id?: string;
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
  @Input() existingTeachers: any[] = []; // 新增：已存在的教師清單
  @Output() onSave = new EventEmitter<EditUserData>();
  @Output() onClose = new EventEmitter<void>();

  userData: EditUserData = {
    teacher_id: '',
    teacher_name: '',
    permissions: {
      'comp_record': false,
      'interview_basic': false,
      'case': false,
      'psych_test': false,
      'statistics': false
    },
    note: '',
    start_at: '',
    end_at: ''
  };

  permissionList: PermissionItem[] = [
    { code: 'comp_record', name: '檢視綜合記錄表' },
    { code: 'interview_basic', name: '檢視一級晤談' },
    { code: 'case', name: '檢視個案' },
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
    console.log('=== ngOnChanges 除錯資訊 ===');
    console.log('changes:', changes);
    console.log('isVisible:', this.isVisible);
    console.log('editMode:', this.editMode);
    console.log('userData.teacher_id 在 ngOnChanges 開始:', this.userData.teacher_id);
    
    if (changes.isVisible && this.isVisible) {
      console.log('調用 initializeForm()');
      this.initializeForm();
      console.log('userData.teacher_id 在 initializeForm() 後:', this.userData.teacher_id);
    }
    if (changes.editUser && this.editUser) {
      console.log('調用 loadEditData()');
      this.loadEditData();
      console.log('userData.teacher_id 在 loadEditData() 後:', this.userData.teacher_id);
    }
    if (changes.existingTeachers) {
      console.log('調用 loadAllTeachers()');
      // 當已存在的教師清單改變時，重新載入教師清單
      this.loadAllTeachers();
    }
    
    console.log('userData.teacher_id 在 ngOnChanges 結束:', this.userData.teacher_id);
    console.log('=== ngOnChanges 除錯資訊結束 ===');
  }

  /** 載入全校教師資料 */
  async loadAllTeachers() {
    try {
      console.log('載入全校教師資料...');
      const response = await this.dsaService.send('GetAllTeacher', {});
      console.log('GetAllTeacher 回應:', response);
      
      let allTeachersFromAPI: Teacher[] = [];
      
      if (response && Array.isArray(response)) {
        // 直接是陣列格式
        console.log('=== GetAllTeacher API 完整回應 ===');
        console.log('API 回應類型:', typeof response);
        console.log('API 回應長度:', response.length);
        console.log('第一個教師原始資料:', response[0]);
        console.log('第一個教師的所有欄位:', Object.keys(response[0]));
        if (this.editMode) {
          alert('原始API回應: ' + JSON.stringify(response[0])); // 查看第一個教師的原始資料
        }
        allTeachersFromAPI = response.map((teacher: any) => {
          console.log('處理教師資料 - 原始:', teacher);
          console.log('原始資料的所有欄位:', Object.keys(teacher));
          
          // 使用正確的欄位名稱
          const processedTeacher = {
            teacher_id: teacher.ref_teacher_id || teacher.teacher_id || teacher.TeacherId || teacher.ID || teacher.id || 
                       teacher.teacherId || teacher.teacherID || teacher.TeacherID || 
                       teacher.teacher_code || teacher.code || teacher.user_id || teacher.userId || 
                       teacher.staff_id || teacher.staffId || teacher.employee_id || teacher.employeeId || '',
            teacher_name: teacher.teacher_name || teacher.TeacherName || teacher.Name || teacher.name || '',
            nickname: teacher.nickname || teacher.Nickname || ''
          };
          
          console.log('處理教師資料 - 處理後:', processedTeacher);
          console.log('teacher_id 來源檢查:', {
            'teacher.ref_teacher_id': teacher.ref_teacher_id,
            'teacher.teacher_id': teacher.teacher_id,
            'teacher.TeacherId': teacher.TeacherId,
            'teacher.ID': teacher.ID,
            'teacher.id': teacher.id,
            'teacher.teacherId': teacher.teacherId,
            'teacher.teacherID': teacher.teacherID,
            'teacher.TeacherID': teacher.TeacherID,
            'teacher.teacher_code': teacher.teacher_code,
            'teacher.code': teacher.code,
            'teacher.user_id': teacher.user_id,
            'teacher.userId': teacher.userId,
            'teacher.staff_id': teacher.staff_id,
            'teacher.staffId': teacher.staffId,
            'teacher.employee_id': teacher.employee_id,
            'teacher.employeeId': teacher.employeeId
          });
          
          return processedTeacher;
        });
        console.log('處理後的教師資料:', allTeachersFromAPI);
        if (this.editMode) {
          alert('處理後的教師資料: ' + JSON.stringify(allTeachersFromAPI[0])); // 查看第一個教師的處理後資料
        }
      } else {
        console.log('GetAllTeacher 格式不符，嘗試使用 _.GetAllTeacher...');
        const response2 = await this.dsaService.send('_.GetAllTeacher', {});
        console.log('_.GetAllTeacher 回應:', response2);
        
        if (response2 && response2.Teacher && Array.isArray(response2.Teacher)) {
          // 格式是 { Teacher: [...] }
          if (this.editMode) {
            alert('第二個API原始回應: ' + JSON.stringify(response2.Teacher[0])); // 查看第一個教師的原始資料
          }
          allTeachersFromAPI = response2.Teacher.map((teacher: any) => {
            console.log('處理教師資料:', teacher);
            return {
              teacher_id: teacher.teacher_id || teacher.TeacherId || teacher.ID || '',
              teacher_name: teacher.teacher_name || teacher.TeacherName || teacher.Name || '',
              nickname: teacher.nickname || teacher.Nickname || ''
            };
          });
          console.log('處理後的教師資料:', allTeachersFromAPI);
          if (this.editMode) {
            alert('第二個API處理後資料: ' + JSON.stringify(allTeachersFromAPI[0])); // 查看第一個教師的處理後資料
          }
        } else {
          console.warn('兩種 API 都無法取得正確的教師資料');
          allTeachersFromAPI = [];
        }
      }
      
      // 過濾掉已經有權限的教師（僅在新增模式下）
      if (!this.editMode) {
        const existingTeacherIds = this.existingTeachers.map(t => t.teacherId);
        this.allTeachers = allTeachersFromAPI.filter(teacher => 
          !existingTeacherIds.includes(teacher.teacher_id)
        );
        console.log('已存在的教師ID:', existingTeacherIds);
        console.log('過濾後的可用教師:', this.allTeachers);
      } else {
        // 編輯模式下顯示所有教師
        this.allTeachers = allTeachersFromAPI;
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
    console.log('=== 選擇教師除錯資訊 ===');
    console.log('選擇教師完整資料:', teacher);
    console.log('teacher.teacher_id:', teacher.teacher_id);
    console.log('teacher.teacher_name:', teacher.teacher_name);
    console.log('teacher_id 類型:', typeof teacher.teacher_id);
    console.log('teacher_id 是否為空:', teacher.teacher_id === '' || teacher.teacher_id === null || teacher.teacher_id === undefined);
    console.log('teacher_id 長度:', teacher.teacher_id ? teacher.teacher_id.length : 'undefined');
    
    // 檢查是否一開始就有抓到 teacher_id
    if (teacher.teacher_id && teacher.teacher_id.trim() !== '') {
      console.log('✅ 一開始就有抓到 teacher_id:', teacher.teacher_id);
    } else {
      console.log('❌ 一開始就沒有抓到 teacher_id');
      console.log('teacher 物件的所有屬性:', Object.keys(teacher));
      console.log('teacher 物件的所有值:', Object.values(teacher));
    }
    
    if (this.editMode) {
      alert('選擇的教師資料: ' + JSON.stringify(teacher)); // 查看選擇的教師資料
    }
    
    console.log('設定前的 userData.teacher_id:', this.userData.teacher_id);
    this.userData.teacher_name = teacher.teacher_name;
    this.userData.teacher_id = teacher.teacher_id;
    console.log('設定後的 userData.teacher_id:', this.userData.teacher_id);
    
    this.showTeacherDropdown = false;
    this.validateForm();
    
    console.log('最終 userData:', this.userData);
    if (this.editMode) {
      alert('設定後的 userData: ' + JSON.stringify(this.userData)); // 查看設定後的 userData
    }
    console.log('=== 選擇教師除錯資訊結束 ===');
  }

  /** 初始化表單 */
  initializeForm() {
    console.log('=== initializeForm 除錯資訊 ===');
    console.log('editMode:', this.editMode);
    console.log('editUser:', this.editUser);
    console.log('userData.teacher_id 在 initializeForm 開始:', this.userData.teacher_id);
    console.log('userData.teacher_name 在 initializeForm 開始:', this.userData.teacher_name);
    
    if (this.editMode && this.editUser) {
      console.log('進入編輯模式，調用 loadEditData()');
      this.loadEditData();
    } else {
      console.log('進入新增模式，強制重置表單');
      // 新增模式時，強制重置表單以清空所有欄位
      this.resetForm();
    }
    
    console.log('userData.teacher_id 在 initializeForm 結束:', this.userData.teacher_id);
    console.log('=== initializeForm 除錯資訊結束 ===');
  }

  /** 載入編輯資料 */
  loadEditData() {
    console.log('=== loadEditData 除錯資訊 ===');
    console.log('editUser 物件:', this.editUser);
    console.log('editUser 的所有欄位:', this.editUser ? Object.keys(this.editUser) : 'editUser 為空');
    
    if (this.editUser) {
      console.log('editUser.teacher_id:', this.editUser.teacher_id);
      console.log('editUser.teacherId:', (this.editUser as any).teacherId);
      console.log('editUser.teacherID:', (this.editUser as any).teacherID);
      
      this.userData = {
        teacher_id: this.editUser.teacher_id || (this.editUser as any).teacherId || (this.editUser as any).teacherID || '',
        teacher_name: this.editUser.teacher_name || '',
        permissions: { ...this.editUser.permissions },
        note: this.editUser.note || '',
        start_at: this.editUser.start_at || '',
        end_at: this.editUser.end_at || ''
      };
      console.log('載入編輯資料後的 userData:', this.userData);
      this.validateForm();
    }
    console.log('=== loadEditData 除錯資訊結束 ===');
  }

  /** 重置表單 */
  resetForm() {
    this.userData = {
      teacher_id: '',
      teacher_name: '',
      permissions: {
        'comp_record': false,
        'interview_basic': false,
        'case': false,
        'psych_test': false,
        'statistics': false
      },
      note: '',
      start_at: '',
      end_at: ''
    };
    // 清空下拉選單相關狀態
    this.showTeacherDropdown = false;
    this.validateForm();
  }

  /** 表單驗證 */
  validateForm() {
    // 在編輯模式下，姓名欄位是唯讀的，所以自動視為有效
    // 在新增模式下，需要檢查姓名是否有輸入且已選擇教師
    this.isUserNameValid = this.editMode || this.userData.teacher_name.trim().length > 0;
    
    // 在新增模式下，還需要檢查是否已選擇教師（有 teacherId）
    const isTeacherSelected = this.editMode || (this.userData.teacher_id && this.userData.teacher_id.trim().length > 0);
    
    this.isFormValid = this.isUserNameValid && isTeacherSelected;
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

  /** 取得使用者 IP */
  getUserIP(): string {
    // 可以從 GlobalService 或其他服務取得 IP
    // 這裡先回傳預設值，您可以根據實際需求修改
    return '127.0.0.1';
  }

  /** 將權限物件轉換為中文可讀格式 */
  formatPermissionsToChinese(permissions: any): string {
    const permissionMap: { [key: string]: string } = {
      'comp_record': '綜合紀錄表',
      'interview_basic': '一級晤談',
      'case': '個案檢視',
      'psych_test': '心理測驗',
      'statistics': '統計報表'
    };

    const enabledPermissions: string[] = [];
    const disabledPermissions: string[] = [];

    for (const [key, value] of Object.entries(permissions)) {
      const chineseName = permissionMap[key] || key;
      if (value === true) {
        enabledPermissions.push(chineseName);
      } else {
        disabledPermissions.push(chineseName);
      }
    }

    let result = '';
    if (enabledPermissions.length > 0) {
      result += `啟用: ${enabledPermissions.join('、')}`;
    }
    if (disabledPermissions.length > 0) {
      if (result) result += '; ';
      result += `停用: ${disabledPermissions.join('、')}`;
    }

    return result || '無權限設定';
  }

  /** 儲存使用者 */
  async save() {
    console.log('=== 儲存方法除錯資訊 ===');
    console.log('editMode:', this.editMode);
    console.log('userData.teacher_id:', this.userData.teacher_id);
    console.log('userData.teacher_name:', this.userData.teacher_name);
    console.log('userData.teacher_id 類型:', typeof this.userData.teacher_id);
    console.log('userData.teacher_id 是否為空:', this.userData.teacher_id === '' || this.userData.teacher_id === null || this.userData.teacher_id === undefined);
    
    // 驗證是否已選擇教師（僅在新增模式下檢查）
    if (!this.editMode && (!this.userData.teacher_id || this.userData.teacher_id.trim() === '')) {
      alert('請先選擇教師！');
      return;
    }

    if (this.isFormValid) {
      try {
        console.log(`${this.editMode ? '更新' : '儲存'}使用者資料:`, this.userData);
        
        if (this.editMode) {
          // 編輯模式：更新資料庫
          const updateData = {
            teacher_id: this.userData.teacher_id,
            teacher_name: this.userData.teacher_name,
            permissions: this.userData.permissions,
            note: this.userData.note,
            start_at: this.userData.start_at,
            end_at: this.userData.end_at
          };
          
          console.log('呼叫更新API，資料：', updateData);
          const response = await this.dsaService.send('Admin.UpdatePermissionTeacher', updateData);
          console.log('更新API回應：', response);
          
          // 記錄操作 LOG
          const permissionText = this.formatPermissionsToChinese(this.userData.permissions);
          const logContent = `修改教師權限 - 教師: ${this.userData.teacher_name} (${this.userData.teacher_id}), 權限: ${permissionText}`;
          await this.dsaService.send("Share.AddLog", { 
            Request: { 
              Content: logContent, 
              IP: this.getUserIP(), 
              Action: '修改教師權限' 
            } 
          });
          
          // alert('update'+JSON.stringify(response));
          
        } else {
          // 新增模式：插入資料庫
          const insertData = {
            teacher_id: this.userData.teacher_id || '',
            teacher_name: this.userData.teacher_name,
            permissions: this.userData.permissions,
            note: this.userData.note,
            start_at: this.userData.start_at,
            end_at: this.userData.end_at
          };
          
          console.log('=== 新增模式發送資料除錯 ===');
          console.log('insertData.teacher_id:', insertData.teacher_id);
          console.log('insertData.teacher_name:', insertData.teacher_name);
          console.log('完整 insertData:', insertData);
          
          if (this.editMode) {
            // alert('新增模式 - 發送資料: ' + JSON.stringify(insertData));
          }
          console.log('呼叫新增API，資料：', insertData);
          const response = await this.dsaService.send('Admin.AddPermissionTeacher', insertData);
          console.log('新增API回應：', response);
          
          // 記錄操作 LOG
          const permissionText = this.formatPermissionsToChinese(this.userData.permissions);
          const logContent = `新增教師權限 - 教師: ${this.userData.teacher_name} (${this.userData.teacher_id}), 權限: ${permissionText}`;
          await this.dsaService.send("Share.AddLog", { 
            Request: { 
              Content: logContent, 
              IP: this.getUserIP(), 
              Action: '新增教師權限' 
            } 
          });
          
          // alert('新增'+JSON.stringify(response));
        }
        
        // 成功後發送資料給父元件並關閉Modal
        this.onSave.emit({ ...this.userData });
        this.close();
        
      } catch (error) {
        console.error(`${this.editMode ? '更新' : '新增'}使用者失敗：`, error);
        alert(`${this.editMode ? '更新' : '新增'}使用者失敗：${JSON.stringify(error.message || error)}`);
      }
    }
  }

}

