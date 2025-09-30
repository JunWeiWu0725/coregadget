import { Component, OnInit } from '@angular/core';
import { GlobalService } from 'src/app/global.service';
import { DsaService } from 'src/app/dsa.service';

// 後端回傳的原始資料結構
interface PermissionRecord {
  feature_code: string;
  feature_name: string;
  uid: string;
  last_update: string;
  ref_teacher_id: string;
  teacher_name?: string;
  ref_teacher_name?: string; // 新增用於轉換
  note?: string;
  start_at?: string;  // 開始時間
  end_at?: string;    // 結束時間
}

// 前端使用的教師權限結構
interface TeacherPermission {
  teacherId: string;
  teacher_name: string;
  permissions: {
    [featureCode: string]: boolean;
  };
  note?: string;
  start_at?: string;  // 開始時間
  end_at?: string;    // 結束時間
}

// 新使用者資料結構（與Modal component一致）
interface UserData {
  teacherId?: string;
  teacher_name: string;
  permissions: {
    [key: string]: boolean;
  };
  note: string;
  start_at: string;   // 開始時間
  end_at: string;     // 結束時間
}

@Component({
  selector: 'app-overview-permission',
  templateUrl: './overview-permission.component.html',
  styleUrls: ['./overview-permission.component.css']
})
export class OverviewPermissionComponent implements OnInit {

  isLoading: boolean = false;
  teachers: TeacherPermission[] = [];
  permissionRecords: PermissionRecord[] = [];
  
  // Modal 控制
  showUserModal: boolean = false;
  isEditMode: boolean = false;
  currentEditUser: TeacherPermission | null = null;
  
  // 保留舊的變數名稱以避免破壞現有功能
  get showAddUserModal(): boolean {
    return this.showUserModal;
  }
  
  // 權限功能對應表
  featureMap = {
    'comp_record': '檢視綜合記錄表',
    'first_level_counsel': '檢視一級晤談',
    'case_view': '檢視個案',
    'psych_test': '檢視心理測驗',
    'statistics': '檢視統計'
  };

  constructor(
    private dsaService: DsaService,
    private globalService: GlobalService
  ) { }

  ngOnInit() {
    this.GetAllPermissionTeacher();
  }

  /** 取得所有權限教師資料 */
  public async GetAllPermissionTeacher() {
    this.isLoading = true;
    try {
      console.log("開始呼叫 Admin.GetAllPermissionTeacher API...");
      let resp = await this.dsaService.send("Admin.GetAllPermissionTeacher", {});
      
      console.log("=== GetAllPermissionTeacher 完整回應 ===");
      console.log("完整 response:", resp);
      console.log("response.result:", resp.result);
      console.log("response.result 類型:", typeof resp.result);
      console.log("response.result 長度:", resp.result ? resp.result.length : '無');
      
      if (resp.result && resp.result.length > 0) {
        console.log("第一筆資料範例:", resp.result[0]);
        console.log("資料結構檢查:");
        Object.keys(resp.result[0]).forEach(key => {
          console.log(`  ${key}:`, resp.result[0][key], `(${typeof resp.result[0][key]})`);
        });
      }
      
      // 儲存原始資料
      this.permissionRecords = [].concat(resp.result || []);
      
      // 轉換為前端使用的格式
      this.teachers = this.transformToTeacherPermissions(this.permissionRecords);
      
      console.log("原始權限記錄:", this.permissionRecords);
      console.log("轉換後的教師權限:", this.teachers);
      
    } catch (ex) {
      console.error("=== GetAllPermissionTeacher API 錯誤 ===");
      console.error("錯誤詳情:", ex);
      console.error("錯誤類型:", typeof ex);
      console.error("錯誤訊息:", ex.message || ex);
      
      alert(JSON.stringify(ex));
      // 如果API失敗，使用預設資料來測試顯示
      console.log("使用預設資料...");
      this.permissionRecords = [
        {
          feature_code: 'comp_record',
          feature_name: '綜合紀錄表',
          uid: '96173500',
          last_update: '2025-09-25 23:37:49.942013',
          ref_teacher_id: '9184',
          teacher_name: '王老師'
        },
        {
          feature_code: 'first_level_counsel',
          feature_name: '一級晤談',
          uid: '96173501',
          last_update: '2025-09-25 23:37:49.942013',
          ref_teacher_id: '9184',
          teacher_name: '王老師'
        },
        {
          feature_code: 'comp_record',
          feature_name: '綜合紀錄表',
          uid: '96173502',
          last_update: '2025-09-25 23:37:49.942013',
          ref_teacher_id: '9352',
          teacher_name: '陳老師'
        }
      ];
      this.teachers = this.transformToTeacherPermissions(this.permissionRecords);
    } finally {
      this.isLoading = false;
      console.log("GetAllPermissionTeacher 執行完成，loading 狀態已關閉");
    }
  }

  /** 將API資料轉換為前端使用的格式 */
  transformToTeacherPermissions(permissionRecords: PermissionRecord[]): TeacherPermission[] {
    const teacherMap = new Map<string, TeacherPermission>();

    // 先處理每個權限記錄
    permissionRecords.forEach(record => {
      console.log('處理權限記錄:', record);
      const teacherId = record.ref_teacher_id;
      
      if (!teacherMap.has(teacherId)) {
        // 初始化教師資料
        console.log('原始記錄資料:', {
          ref_teacher_name: record.ref_teacher_name,
          teacher_name: record.teacher_name,
          feature_name: record.feature_name,
          teacherId: teacherId
        });
        
        const teacherName = record.ref_teacher_name || 
                           record.teacher_name || 
                           `教師${teacherId}`;
        
        console.log(`教師 ID: ${teacherId}, 解析出的姓名: "${teacherName}"`);
        
        teacherMap.set(teacherId, {
          teacherId: teacherId,
          teacher_name: teacherName,
          permissions: {},
          note: record.note || '',
          start_at: record.start_at || '',
          end_at: record.end_at || ''
        });
      }

      // 設定這個功能的權限
      const teacher = teacherMap.get(teacherId)!;
      teacher.permissions[record.feature_code] = true;
      
      // 更新開放時間（如果有更新的記錄，使用最新的）
      if (record.start_at) {
        teacher.start_at = record.start_at;
      }
      if (record.end_at) {
        teacher.end_at = record.end_at;
      }
    });

    // 轉換為陣列並確保所有功能都有預設值
    const result = Array.from(teacherMap.values()).map(teacher => {
      // 確保所有功能都有權限值
      Object.keys(this.featureMap).forEach(featureCode => {
        if (!(featureCode in teacher.permissions)) {
          teacher.permissions[featureCode] = false;
        }
      });
      return teacher;
    });

    console.log('轉換後的教師權限資料:', result);
    return result;
  }

  /** 開啟新增使用者 Modal */
  openAddUserModal() {
    this.isEditMode = false;
    this.currentEditUser = null;
    this.showUserModal = true;
  }

  /** 開啟編輯使用者 Modal */
  openEditUserModal(teacher: TeacherPermission) {
    console.log('開啟編輯 Modal，使用者資料:', teacher);
    this.isEditMode = true;
    this.currentEditUser = { ...teacher }; // 複製物件避免直接修改原始資料
    this.showUserModal = true;
  }

  /** Modal 關閉事件 */
  onModalClosed() {
    this.showUserModal = false;
    this.isEditMode = false;
    this.currentEditUser = null;
  }

  /** 處理來自 Modal 的使用者資料 */
  async onUserSaved(userData: UserData) {
    console.log('收到使用者資料:', userData);
    
    // 準備要送到後端的資料格式
    const teacherData = {
      teacherId: userData.teacherId || '', 
      teacher_name: userData.teacher_name,
      permissions: userData.permissions,
      note: userData.note || '',
      start_at: userData.start_at || '',
      end_at: userData.end_at || ''
    };
    
    try {
      if (this.isEditMode) {
        // 編輯模式：更新現有教師
        console.log('更新教師權限:', teacherData);
        const response = await this.dsaService.send('Admin.UpdatePermissionTeacher', teacherData);
        console.log('更新權限成功:', response);
      } else {
        // 新增模式：建立新教師
        console.log('新增教師權限:', teacherData);
        const response = await this.dsaService.send('Admin.AddPermissionTeacher', teacherData);
        console.log('新增權限成功:', response);
      }
      
      // 重新載入資料
      this.GetAllPermissionTeacher();
      
    } catch (error) {
      console.error(`${this.isEditMode ? '更新' : '新增'}權限失敗:`, error);
    }
  }

  addNewUser() {
    // 舊的方法，保留作為備用
    this.openAddUserModal();
  }

  editUser(teacherId: string) {
    // 舊的編輯方法，保留作為備用
    const teacher = this.teachers.find(t => t.teacherId === teacherId);
    if (teacher) {
      this.openEditUserModal(teacher);
    }
  }

  /** 刪除使用者 */
  deleteUser(teacherId: string) {
    if (confirm('確定要刪除這個使用者嗎？')) {
      console.log('刪除使用者:', teacherId);
      // TODO: 實作刪除 API 呼叫
    }
  }

  /** 格式化日期時間顯示 */
  formatDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      
      // 檢查是否為有效日期
      if (isNaN(date.getTime())) {
        return dateTimeString; // 如果無法解析，返回原始字串
      }
      
      // 格式化為 YYYY/MM/DD HH:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return dateTimeString; // 發生錯誤時返回原始字串
    }
  }

  /** 儲存所有設定 */
  async saveAllSettings() {
    this.isLoading = true;
    try {
      for (const teacher of this.teachers) {
        let resp = await this.dsaService.send("Admin.UpdatePermissionTeacher", {
          TeacherId: teacher.teacherId,
          Permissions: teacher.permissions
        });
        console.log("UpdatePermissionTeacher response", resp);
      }
      alert("儲存成功!");
      this.GetAllPermissionTeacher();
      this.globalService.loadingSettingList();
    } catch (ex) {
      alert(JSON.stringify(ex));
    } finally {
      this.isLoading = false;
    }
  }

}
