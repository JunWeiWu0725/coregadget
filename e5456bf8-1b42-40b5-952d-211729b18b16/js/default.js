$(document).ready(function () {
    // 初始化:讓 loading 畫面獲得焦點
    var $loadingScreen = $('#loadingScreen');
    if ($loadingScreen.length) {
        $loadingScreen.focus();
    }

    // 用來追蹤兩個 API 是否都完成
    var loadingState = {
        dropoutRecord: false,
        reminderText: false
    };

    // 檢查是否所有資料都載入完成
    function checkAllDataLoaded() {
        if (loadingState.dropoutRecord && loadingState.reminderText) {
            // 所有資料都載入完成,隱藏 loading 並聚焦到標題
            setTimeout(function() {
                // 更新 aria-busy 狀態
                $loadingScreen.attr('aria-busy', 'false');
                
                // 隱藏 loading 畫面
                $loadingScreen.fadeOut(300, function() {
                    $(this).remove();
                    
                    // 聚焦到"休學紀錄"標題
                    var $title = $('#dropoutTitle');
                    if ($title.length) {
                        // 確保所有區域的 aria-live 都是 off
                        $('.content').attr('aria-live', 'off');
                        $('.page-container').attr('aria-live', 'off');
                        $('#dropout').attr('aria-live', 'off');
                        $('#DropoutReminderText').attr('aria-live', 'off');
                        
                        // 設置標題的 ARIA 屬性,確保只報讀標題
                        $title.attr({
                            'aria-atomic': 'true',
                            'role': 'heading',
                            'aria-level': '1'
                        });
                        
                        // 移除表格的 role 以避免自動導航到表格內容
                        $('#dropout').removeAttr('role');
                        
                        // 聚焦到標題
                        $title.focus();
                        
                        // 確保焦點停留,不會自動移動
                        setTimeout(function() {
                            if (document.activeElement !== $title[0]) {
                                $title.focus();
                            }
                        }, 100);
                    }
                });
            }, 200); // 稍微延遲,確保 DOM 完全渲染
        }
    }

    /*
    $("#editModal").modal({
        show: false
    });
    $("#editModal").on("hidden", function () {
        $("#editModal #errorMessage").html("");
    });
    $("#editModal").on("show", function () {
        $("#editModal #save-data").button("reset");
    });
    $("#editModal #save-data").click(function () {
        $(this).button("loading");
    });
*/
    // 取得學生休學記錄
    var connection = gadget.getContract("emba.student");
    connection.send({
        service: "default.GetDropoutRecord",
        body: {},
        result: function (response, error, http) {
            if (error !== null) {
                $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetDropoutRecord)\n</div>");
                loadingState.dropoutRecord = true;
                checkAllDataLoaded();
            } else {
                // 成功
                var ret = '';
                var _ref;
                //alert(JSON.stringify(response.Response));
                //console.log(response.Response);

                if (response.Response && response.Response['dropout_record']) {
                    var record = response.Response['dropout_record'];
                    var suspension = ['Suspension1','Suspension2','Suspension3','Suspension4','Suspension5','Suspension6','Suspension7','Suspension8'];
                    var items = [];
                    $(suspension).each(function(index, item){
                        if (record[item]) {
                            items.push(
                                '<tr>' +
                                    '<td width="100px">' + (index+1) + '</td>' +
                                    '<td>' + record[item] + '</td>' +
                                '</tr>'
                            );                        
                        }
                    });
                    if (items.length === 0) {
                        items.push(
                            '<tr>' +
                            '    <td>無</td>' +
                            '</tr>'
                        );
                    }
                    $('#dropout tbody').html(items.join(''));
                }
                
                // 標記此 API 已完成
                loadingState.dropoutRecord = true;
                checkAllDataLoaded();
                //return;emba.student.dropout_record.Suspension1
                /*
                if (response.Response && response.Response.emba && response.Response.emba.student && response.Response.emba.student.dropout_record) {
                    $(response.Response.Student).each(function(index, item) {
                        ret = '<p>姓名：' + (item.Name || '') + '</p>' +
                            '<p>學號：' + (item.StudentNumber || '') + '</p>' +
                            '<p>座號：' + (item.SeatNo || '') + '</p>';
                    });
                    $('#absence').html('aaa');
                }
                */
            }
        }
    });

    //  取得休學相關說明文字
    connection.send({
        service: "default.GetDropoutReminderText",
        body: {},
        result: function (response, error, http) {
            if (error !== null) {
                $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常,請稍候重試!</strong>(GetStudent)\n</div>");
                loadingState.reminderText = true;
                checkAllDataLoaded();
            } else {
                // 成功

                if (response.Response && response.Response['conf']) {
                    $('#DropoutReminderText').html(response.Response['conf']['ConfContent']);
                }
                
                // 標記此 API 已完成
                loadingState.reminderText = true;
                checkAllDataLoaded();
            }
        }
    });
});