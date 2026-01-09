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
  nickname?: string;  // 暱稱
  note?: string;
  start_at?: string;  // 開始時間
  end_at?: string;    // 結束時間
  enable?: boolean;   // 權限啟用狀態
}

// 前端使用的教師權限結構
interface TeacherPermission {
  teacherId: string;
  teacher_name: string;
  nickname?: string;  // 暱稱
  permissions: {
    [featureCode: string]: boolean;
  };
  note?: string;
  start_at?: string;  // 開始時間
  end_at?: string;    // 結束時間
  enable?: boolean;   // 整體啟用狀態
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
  rawApiData: any = null; // 儲存原始 API 資料用於除錯
  
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
    'interview_basic': '檢視一級晤談',
    'case': '檢視個案',
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

  /** 解析 enable 值，處理字串格式的布林值 */
  parseEnableValue(enableValue: any): boolean {
    if (enableValue === undefined || enableValue === null) {
      return true; // 預設為啟用
    }
    
    if (typeof enableValue === 'boolean') {
      return enableValue;
    }
    
    if (typeof enableValue === 'string') {
      // 處理字串格式：'t'/'true' 為 true，'f'/'false' 為 false
      const lowerValue = enableValue.toLowerCase();
      if (lowerValue === 't' || lowerValue === 'true' || lowerValue === '1') {
        return true;
      } else if (lowerValue === 'f' || lowerValue === 'false' || lowerValue === '0') {
        return false;
      }
    }
    
    if (typeof enableValue === 'number') {
      return enableValue !== 0;
    }
    
    // 預設為啟用
    return true;
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
      
      // 儲存原始 API 資料用於除錯顯示
      this.rawApiData = resp;
      
      if (resp.result && resp.result.length > 0) {
        console.log("第一筆資料範例:", resp.result[0]);
        console.log("資料結構檢查:");
        Object.keys(resp.result[0]).forEach(key => {
          console.log(`  ${key}:`, resp.result[0][key], `(${typeof resp.result[0][key]})`);
        });
        
        // 特別檢查 enable 欄位
        console.log("=== Enable 欄位檢查 ===");
        resp.result.forEach((record, index) => {
          console.log(`記錄 ${index}:`, {
            ref_teacher_id: record.ref_teacher_id,
            feature_code: record.feature_code,
            enable: record.enable,
            enable_type: typeof record.enable
          });
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
      console.log('Enable 狀態:', record.enable, '類型:', typeof record.enable);
      const teacherId = record.ref_teacher_id;
      
      if (!teacherMap.has(teacherId)) {
        // 初始化教師資料
        console.log('原始記錄資料:', {
          ref_teacher_name: record.ref_teacher_name,
          teacher_name: record.teacher_name,
          feature_name: record.feature_name,
          teacherId: teacherId,
          nickname: record.nickname
        });
        
        const teacherName = record.ref_teacher_name || 
                           record.teacher_name || 
                           `教師${teacherId}`;
        
        console.log(`教師 ID: ${teacherId}, 解析出的姓名: "${teacherName}"`);
        
        const nicknameValue = record.nickname || '';
        console.log(`設定教師 ${teacherId} 的 nickname: "${nicknameValue}"`);
        
        teacherMap.set(teacherId, {
          teacherId: teacherId,
          teacher_name: teacherName,
          nickname: nicknameValue, // 添加暱稱欄位
          permissions: {},
          note: record.note || '',
          start_at: record.start_at || '',
          end_at: record.end_at || '',
          enable: true // 預設為啟用，稍後會根據權限狀態調整
        });
      }

      // 設定這個功能的權限（只有啟用狀態才設為 true）
      const teacher = teacherMap.get(teacherId)!;
      teacher.permissions[record.feature_code] = this.parseEnableValue(record.enable); // 使用解析後的 enable 值
      
      // 更新開放時間（如果有更新的記錄，使用最新的）
      if (record.start_at) {
        teacher.start_at = record.start_at;
      }
      if (record.end_at) {
        teacher.end_at = record.end_at;
      }
    });

    // 轉換為陣列並確保所有功能都有預設值，同時過濾掉停用的教師
    const allTeachers = Array.from(teacherMap.values());
    console.log('過濾前的所有教師:', allTeachers);
    console.log('過濾前的教師數量:', allTeachers.length);
    
    const result = allTeachers
      .filter(teacher => {
        // 檢查是否有任何啟用的權限
        const hasEnabledPermission = Object.values(teacher.permissions).some(permission => permission === true);
        console.log(`檢查教師 ${teacher.teacher_name} (${teacher.teacherId}) 是否有啟用權限:`, hasEnabledPermission, '權限狀態:', teacher.permissions);
        return hasEnabledPermission; // 只保留有啟用權限的教師
      })
      .map(teacher => {
      // 確保所有功能都有權限值
      Object.keys(this.featureMap).forEach(featureCode => {
        if (!(featureCode in teacher.permissions)) {
          teacher.permissions[featureCode] = false;
        }
      });
      return teacher;
    });

    console.log('轉換後的教師權限資料:', result);
    
    // 特別檢查每個教師的 enable 狀態
    result.forEach(teacher => {
      console.log(`教師 ${teacher.teacher_name} (${teacher.teacherId}) 的 enable 狀態:`, teacher.enable);
    });
    
    return result;
  }

  /** 開啟新增使用者 Modal */
  openAddUserModal() {
    this.isEditMode = false;
    this.currentEditUser = null;
    this.showUserModal = true;
  }

  /** 取得使用者 IP */
  getUserIP(): string {
    // 可以從 GlobalService 或其他服務取得 IP
    // 這裡先回傳預設值，您可以根據實際需求修改
    return '127.0.0.1';
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
  async deleteUser(teacherId: string) {
    // 找到要刪除的教師資料
    const teacher = this.teachers.find(t => t.teacherId === teacherId);
    if (!teacher) {
      alert('找不到要刪除的教師資料');
      return;
    }

    // 顯示詳細的確認對話框
    const confirmMessage = `確定要停用教師「${teacher.teacher_name}」的所有權限嗎？\n\n` +
                          `點擊「確定」繼續，點擊「取消」中止操作。`;
    
    if (confirm(confirmMessage)) {
      try {
        this.isLoading = true;
        console.log('開始停用教師權限:', teacher);
        
        // 呼叫停用權限 API
        const deleteData = {
          teacher_id: teacherId,
          teacher_name: teacher.teacher_name,
          reason: '管理員手動停用',
          operator_id: 'admin' // 可以從登入資訊取得
        };
        
        console.log('呼叫停用權限API，資料：', deleteData);
        const response = await this.dsaService.send('Admin.DeletePermissionTeacher', deleteData);
        console.log('停用權限API回應：', response);
        
        if (response.result === 'OK') {
          // 記錄操作 LOG
          const logContent = `停用教師權限 - 教師: ${teacher.teacher_name} (${teacher.teacherId}), 原因: 管理員手動停用`;
          await this.dsaService.send("Share.AddLog", { 
            Request: { 
              Content: logContent, 
              IP: this.getUserIP(), 
              Action: '停用教師權限' 
            } 
          });
          
          alert(`教師「${teacher.teacher_name}」的權限已成功停用！`);
          
          // 重新載入資料
          this.GetAllPermissionTeacher();
        } else {
          alert(`停用權限失敗：${response.message || '未知錯誤'}`);
        }
        
      } catch (error) {
        console.error('停用教師權限失敗：', error);
        alert(`停用權限失敗：${error.message || '系統錯誤'}`);
      } finally {
        this.isLoading = false;
      }
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
