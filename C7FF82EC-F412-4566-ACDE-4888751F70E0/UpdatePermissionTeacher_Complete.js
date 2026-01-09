var request = getRequest().Request || getRequest();

var teacher_id = request.teacher_id;
var teacher_name = request.teacher_name;
var permissions = request.permissions;
var note = request.note || '';

try {
    // 檢查必要參數
    if (!teacher_id || !teacher_name) {
        return {result: 'ERROR', message: '教師ID或姓名不能為空'};
    }
    
    if (!permissions || typeof permissions !== 'object') {
        return {result: 'ERROR', message: '權限設定不能為空'};
    }
    
    // 取得所有功能權限
    var featureSql = "SELECT uid, feature_code FROM $counsel.feature";
    var features = executeSql(featureSql).toArray(); 
    
    if (features.length === 0) {
        return {result: 'ERROR', message: '找不到功能權限設定'};
    } 
    
    var successCount = 0;
    var errorCount = 0;
    var errors = [];
    
    for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        var featureCode = feature.feature_code;
        var featureUid = feature.uid; 
        
        try {
            // 檢查該權限記錄是否已存在
            var checkSql = "SELECT uid FROM $counsel.teacher_permission WHERE ref_teacher_id = '" + teacher_id + "' AND ref_permission_id = '" + featureUid + "'";
            var existing = executeSql(checkSql).toArray(); 
            
            // 正確處理布林值 - 確保在 SQL 中使用正確的布林值
            var enableValue = permissions[featureCode] === true ? 'true' : 'false';
            
            if (existing.length > 0) {
                // 更新現有記錄的 enable 狀態
                var updateSql = "UPDATE $counsel.teacher_permission SET enable = " + enableValue + ", note = '" + note.replace(/'/g, "''") + "' WHERE ref_teacher_id = '" + teacher_id + "' AND ref_permission_id = '" + featureUid + "'";
                executeSql(updateSql);
            } else {
                // 插入新記錄
                var insertSql = "INSERT INTO $counsel.teacher_permission (ref_teacher_id, ref_permission_id, permission_action, enable, note) VALUES ('" + teacher_id + "', '" + featureUid + "', '檢視', " + enableValue + ", '" + note.replace(/'/g, "''") + "')";
                executeSql(insertSql);
            }
            
            successCount++;
            
        } catch (featureError) {
            errorCount++;
            errors.push({
                feature_code: featureCode,
                error: featureError.message
            });
        }
    } 
    
    // 回傳結果
    if (errorCount === 0) {
        return {
            result: 'OK', 
            message: '教師權限更新成功',
            data: {
                teacher_id: teacher_id,
                teacher_name: teacher_name,
                total_features: features.length,
                success_count: successCount
            }
        };
    } else if (successCount > 0) {
        return {
            result: 'PARTIAL_SUCCESS',
            message: '部分權限更新成功',
            data: {
                teacher_id: teacher_id,
                teacher_name: teacher_name,
                total_features: features.length,
                success_count: successCount,
                error_count: errorCount,
                errors: errors
            }
        };
    } else {
        return {
            result: 'ERROR',
            message: '所有權限更新都失敗',
            data: {
                teacher_id: teacher_id,
                teacher_name: teacher_name,
                total_features: features.length,
                error_count: errorCount,
                errors: errors
            }
        };
    }
    
} catch (error) {
    // 發生錯誤時回傳錯誤訊息
    return {
        result: 'ERROR', 
        message: '系統錯誤: ' + error.message,
        data: {
            teacher_id: teacher_id,
            teacher_name: teacher_name,
            error_time: new Date().toISOString()
        }
    };
}

