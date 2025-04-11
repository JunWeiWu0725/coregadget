angular.module('learning', ['ngAnimate'])
    .controller('MainCtrl', ['$scope', function ($scope) {
        $scope.connection = gadget.getContract("ischool.service_learning.teacher");
        $scope.getClassList = function () {
            $scope.connection.send({
                service: "_.GetClassList",
                body: '',
                result: function (response, error, http) {
                    if (error !== null) {
                        $scope.set_error_message('#mainMsg', 'GetClassList', error);
                    } else {
                        //console.log(response);
                        $scope.$apply(function () {
                            if (response !== null && response.Response !== null && response.Response !== '') {
                                $scope.classList = [].concat(response.Response.Class);

                                if ($scope.classList.length > 0) {
                                    //$scope.currentClassList = $scope.classList[0]; //預設選取第一筆記錄
                                    $scope.selectClassList($scope.classList[0]); //第一筆記錄詳細資料
                                }
                            }
                        });
                    }
                }
            });
        }
        $scope.selectClassList = function (item) {
            $scope.currentClassList = item;

            //-> 班級選取下拉變色
            angular.forEach($scope.classList, function (item) {
                item.selected = false; //先設定通通不選取
            })

            item.selected = true; //設定被選取

            $scope.getSchoolYear();
            //$scope.getSemester();
        }
        $scope.getSchoolYear = function () {
            delete $scope.schoolYearList;
            delete $scope.columnList;
            delete $scope.colHeaderList;
            //delete $scope.currentStudent;

            $scope.connection.send({
                service: "_.GetSchoolYear",
                body: {
                    ClassID: $scope.currentClassList.ClassID
                },
                result: function (response, error, http) {
                    if (error !== null) {
                        $scope.set_error_message('#mainMsg', 'GetSchoolYear', error);
                    } else {
                        $scope.$apply(function () { //apply用來更新選擇或變動的資料顯示
                            if (response !== null && response.Result !== null && response.Result !== '') {

                                $scope.schoolYearList = [].concat(response.Result);

                                if ($scope.schoolYearList.length > 0) { //長度要大於０，至少要有一筆記錄

                                    $scope.columnList = [
                                        {
                                            Name: 'SeatNo',
                                            Text: '座號',
                                            Class: 'number-column'
                                        },
                                        {
                                            Name: 'StudentNumber',
                                            Text: '學號',
                                            Class: 'default'
                                        },
                                        {
                                            Name: 'StudentName',
                                            Text: '姓名',
                                            Class: 'default'
                                        },
                                    ];

                                    $scope.colHeaderList = [
                                        // '學生基本資料'
                                        ''
                                    ];

                                    angular.forEach($scope.schoolYearList, function (item) {

                                        var data1 = {
                                            Name: item.SchoolYear + 1,
                                            Text: '上',
                                            Class: 'number-column'
                                        };
                                        var data2 = {
                                            Name: item.SchoolYear + 2,
                                            Text: '下',
                                            Class: 'number-column'
                                        };
                                        var data3 = {
                                            Name: item.SchoolYear + 'total',
                                            Text: '學年',
                                            Class: 'number-column'
                                        }
                                        $scope.columnList.push(data1);
                                        $scope.columnList.push(data2);
                                        $scope.columnList.push(data3);

                                        $scope.colHeaderList.push(item.SchoolYear);
                                    })
                                }
                            }
                        });
                    }
                }
            });

            $scope.getStudentData();
        }
        {
            //-> 取得學年度學期
            //$scope.getSemester = function() {

            //    delete $scope.semesters; //先清空
            //    delete $scope.students;
            //    delete $scope.currentStudent;

            //    $scope.connection.send({
            //        service: "_.GetSemester",
            //        body: {
            //            Request: {
            //                Condition: {
            //                    ClassID: $scope.currentClassList.ClassID
            //                }
            //            }
            //        },
            //        result: function(response, error, http) {
            //            if (error !== null) {
            //                $scope.set_error_message('#mainMsg', 'GetSemester', error);
            //            } else {
            //                //console.log(response); //檢查元素console用
            //                $scope.$apply(function() { //apply用來更新選擇或變動的資料顯示
            //                    if (response !== null && response.Response !== null && response.Response !== '') {
            //                        $scope.semesters = [].concat(response.Response.Semester);

            //                        if ($scope.semesters.length > 0) { //長度要大於０，至少要有一筆記錄
            //                            $scope.currentSemester = $scope.semesters[0]; //預設選取第一筆記錄
            //                            $scope.selectSemester($scope.semesters[0]); //第一筆記錄詳細資料
            //                        }
            //                    }
            //                });
            //            }
            //        }
            //    });
            //}
        }
        $scope.getStudentData = function () {
            $scope.connection.send({
                service: "_.GetStudentService",
                body: {
                    ClassID: $scope.currentClassList.ClassID
                },
                result: function (response, error, http) {
                    if (error !== null) {
                        $scope.set_error_message('#mainMsg', 'GetStudentService', error);
                    } else {

                        $scope.$apply(function () { //apply用來更新選擇或變動的資料顯示
                            if (response !== null && response.Result !== null && response.Result !== '') {
                                $scope.schoolYearList.sort((a, b) => b.SchoolYear - a.SchoolYear);
        
                                // **清除 studentList 並初始化**
                                $scope.studentList = [];
                                var studentKey = {};
        
                                angular.forEach([].concat(response.Result), function (item) {
                                    if (!studentKey[item.StudentID]) {
                                        var student = {
                                            StudentID: item.StudentID,
                                            SeatNo: item.SeatNo,
                                            StudentNumber: item.StudentNumber,
                                            StudentName: item.StudentName,
                                            selected: false,  // **確保每次重新載入時不會有學生保持展開狀態**
                                            records: []
                                        };
        
                                        angular.forEach($scope.schoolYearList, function (data) {
                                            student[data.SchoolYear + 1] = 0;
                                            student[data.SchoolYear + 2] = 0;
                                            student[data.SchoolYear + 'total'] = 0;
                                        });
        
                                        $scope.studentList.push(student);
                                        studentKey[item.StudentID] = student;
                                    }
        
                                    var targetStudent = studentKey[item.StudentID];
                                    // 確保將 item.Sum 安全地轉換為數字
                                    var sum = Number(item.Sum) || 0;
                                    targetStudent[item.SchoolYear + item.Semester] = sum;
                                
                                    // 如果 targetStudent[item.SchoolYear + 'total'] 沒有初始化，這行代碼就會進行初始化
                                    if (typeof targetStudent[item.SchoolYear + 'total'] === 'undefined') {
                                        targetStudent[item.SchoolYear + 'total'] = 0;
                                    }
        
                                    targetStudent[item.SchoolYear + 'total'] += sum;
        
                                    // **確保詳細資料（records）也重新初始化**
                                    targetStudent.records.push({
                                        SchoolYear: item.SchoolYear,
                                        Semester: item.Semester,
                                        OccurDate: item.OccurDate,
                                        Hours: sum,
                                        Organizers: item.Organizers,
                                        InternalOrExternal: item.InternalOrExternal,
                                        Reason: item.Reason,
                                        Remark: item.Remark
                                    });
                                });
                            }
                        });
                    }
                }
            });
        };
        
        {
            //$scope.selectSchoolYear = function (data) {
            //    $scope.currentSchoolYear = data.SchoolYear;

            //    //-> 學年度學期選取下拉變色
            //    angular.forEach($scope.arraySchoolYear, function (item) {
            //        item.selected = false; //先設定通通不選取
            //    })
            //    data.selected = true; //設定被選取
            //    delete $scope.students;
            //    delete $scope.currentStudent;

            //    $scope.connection.send({
            //        service: "_.GetStudentService",
            //        body: {
            //            ClassID: $scope.currentClassList.ClassID,
            //            SchoolYear: data.SchoolYear,
            //        },
            //        result: function (response, error, http) {
            //            if (error !== null) {
            //                $scope.set_error_message('#mainMsg', 'GetStudentService', error);
            //            } else {
            //                $scope.$apply(function () { //apply用來更新選擇或變動的資料顯示
            //                    if (response !== null && response.Result !== null && response.Result !== '') {
            //                        $scope.students = [].concat(response.Result);

            //                        // 資料整理
            //                        angular.forEach($scope.students, function (item) {
            //                            item.Semester1 = parseInt(item.Semester1 == "" ? 0 : item.Semester1);
            //                            item.Semester2 = parseInt(item.Semester2 == "" ? 0 : item.Semester2);
            //                            item.Total = item.Semester1 + item.Semester2;
            //                        })
            //                    }
            //                });
            //            }
            //        }
            //    });
            //}
        }
        {
            //$scope.selectSemester = function(item) {
            //    $scope.currentSemester = item;

            //    //-> 學年度學期選取下拉變色
            //    angular.forEach($scope.semesters, function(item) {
            //        item.selected = false; //先設定通通不選取
            //    })

            //    item.selected = true; //設定被選取

            //    delete $scope.students;
            //    delete $scope.currentStudent;

            //    $scope.connection.send({
            //        service: "_.GetStudentServiceList",
            //        body: {
            //            Request: {
            //                Condition: {
            //                    ClassID: $scope.currentClassList.ClassID,
            //                    SchoolYear: item.SchoolYear,
            //                    Semester: item.Semester
            //                }
            //            }
            //        },
            //        result: function(response, error, http) {
            //            if (error !== null) {
            //                $scope.set_error_message('#mainMsg', 'GetStudentServiceList', error);
            //            } else {
            //                //console.log(response); //檢查元素console用

            //                $scope.$apply(function() { //apply用來更新選擇或變動的資料顯示
            //                    if (response !== null && response.Response !== null && response.Response !== '') {
            //                        $scope.students = [].concat(response.Response.Students);
            //                    }
            //                });
            //            }
            //        }
            //    });
            //}
        }
        $scope.selectStudent = function (item) {
            // 切換選取狀態
            item.selected = !item.selected;
        
            // 取消選取其他學生
            angular.forEach($scope.studentList, function (student) {
                if (student !== item) {
                    student.selected = false;
                }
            });
        
            // 如果展開，就請求 API，否則不請求
            if (item.selected) {
                $scope.currentStudent = item; // 設定目前選取的學生
        
                // 呼叫 API 載入該學生詳細資料
                $scope.connection.send({
                    service: "_.GetStudentServiceDetail",
                    body: {
                        Request: {
                            StudentID: item.StudentID
                        }
                    },
                    result: function (response, error, http) {
                        if (error !== null) {
                            $scope.set_error_message('#mainMsg', 'GetStudentServiceDetail', error);
                        } else {
                            $scope.$apply(function () {
                                if (response && response.Result) {
                                    item.records = [].concat(response.Result); // 確保 records 是陣列
                                    
                                    angular.forEach(item.records, function (record) {
                                        if (record.OccurDate) {
                                            var date = new Date(parseInt(record.OccurDate)).toLocaleDateString();
                                            record.OccurDate = date;
                                        }
                                    });
                                } else {
                                    item.records = []; // 確保 records 為空陣列，而不是 undefined
                                }
                            });
                        }
                    }
                });
            }
        };
        
        $scope.removeCurrentStudent = function () {
            delete $scope.currentStudent;
        }
        // TODO: 錯誤訊息
        $scope.set_error_message = function (select_str, serviceName, error) {
            var tmp_msg = '<i class="icon-white icon-info-sign my-err-info"></i><strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(' + serviceName + ')';
            if (error !== null) {
                if (error.dsaError) {
                    if (error.dsaError.status === "504") {
                        switch (error.dsaError.message) {
                            case '501':
                                tmp_msg = '<strong>很抱歉，您無讀取資料權限！</strong>';
                                break;
                        }
                    } else if (error.dsaError.message) {
                        tmp_msg = error.dsaError.message;
                    }
                } else if (error.loginError.message) {
                    tmp_msg = error.loginError.message;
                } else if (error.message) {
                    tmp_msg = error.message;
                }
                $(select_str).html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  " + tmp_msg + "\n</div>");
                $('.my-err-info').click(function () {
                    alert('請拍下此圖，並與客服人員連絡，謝謝您。\n' + JSON.stringify(error, null, 2))
                });
            }
        };
        //$scope.getClassList();
    }])
{
    // var _gg = _gg || {};
    // _gg.connection = gadget.getContract("ischool.service_learning.teacher");

    // jQuery(function () {
    //     // TODO:  切換下拉選單
    //     $('#myTab')
    //         .click(function() {
    //             $(this).find('li.active').removeClass('active');
    //         })
    //         .on('click', 'a', function() {
    //             $('#tabName').html($(this).html());
    //         });


    //     $('#sall')
    //         .on('change', 'select[name=class]', function() {
    //             $('#sall select[name=semester], #sall tbody').html('');
    //             _gg.list_classid = $(this).val();
    //             _gg.GetSemester('list');
    //             $('#sall button[data-type=return]').trigger('click');
    //         })
    //         .on('change', 'select[name=semester]', function() {
    //             $('#sall tbody').html('');
    //             _gg.list_schoolyear = $(this).find('option:selected').attr('school-year');
    //             _gg.list_semester = $(this).find('option:selected').attr('semester');
    //             _gg.GetStudentServiceList();
    //             $('#sall button[data-type=return]').trigger('click');
    //         })
    //         .on('click', 'table[data-type=all] tbody tr', function() {
    //             $('#sall table[data-type=all]').animate(
    //                 {left:-$(this).width() * 2}
    //                 , 500
    //                 , function() {
    //                     $(this).hide();
    //                     $('#sall div.my-detail').css({left:0}).show();
    //                 }
    //             );
    //             _gg.studentid = $(this).attr('studentid');
    //             _gg.GetStudentDetail();
    //         })
    //         .on('click', 'button[data-type=return]', function() {
    //             $('#sall div.my-detail').animate(
    //                 {left:+$(window).width() * 2}
    //                 , 500
    //                 , function() {
    //                     $(this).hide();
    //                     $('#sall table[data-type=all]').css({left:0}).show();
    //                 }
    //             );
    //         });


    //     // TODO: 取得我的班級
    //     _gg.connection.send({
    //         service: "_.GetClassList",
    //         body: '',
    //         result: function (response, error, http) {
    //             if (error !== null) {
    //                 _gg.set_error_message('#mainMsg', 'GetClassList', error);
    //             } else {
    //                 var _ref, dropdown_class = [];
    //                 if (((_ref = response.Response) != null ? _ref.Class : void 0) != null) {

    //                     $(response.Response.Class).each(function(index, item) {
    //                         dropdown_class.push('<option value="' + (item.ClassID || '') + '">' + (item.ClassName || '') + '</option>');
    //                     });
    //                 }
    //                 // TODO: 下拉選單
    //                 $('select[name=class]')
    //                     .html((dropdown_class.join('') || '<option value="">目前無資料</option>'))
    //                     .find('option:first').prop('selected', true).trigger('change');
    //             }
    //         }
    //     });
    // });


    // // TODO: 載入此班級具服務學習時數的學年度
    // _gg.GetSemester = function(kind) {
    //     var classid, obj;
    //     if (kind === 'list') {
    //         if (_gg.list_classid) {
    //             classid = _gg.list_classid;
    //             obj = $('#sall');
    //         } else {
    //             return false;
    //         }
    //     } else if (kind === 'detail') {
    //         if (_gg.detail_classid) {
    //             classid = _gg.detail_classid;
    //             obj = $('#sone');
    //         } else {
    //             return false;
    //         }
    //     }

    //     _gg.connection.send({
    //         service: "_.GetSemester",
    //         body: '<Request><Condition><ClassID>' + classid + '</ClassID></Condition></Request>',
    //         result: function (response, error, http) {
    //             if (error !== null) {
    //                 _gg.set_error_message('#mainMsg', 'GetSemester', error);
    //             } else {
    //                 var _ref, items = [];
    //                 if (((_ref = response.Response) != null ? _ref.Semester : void 0) != null) {
    //                     $(response.Response.Semester).each(function(index, item) {
    //                         items.push(
    //                             '<option value="' + (item.SchoolYear || '') + (item.Semester || '') + '"' +
    //                             ' school-year="' + (item.SchoolYear || '') + '"' +
    //                             ' semester="' + (item.Semester || '') + '"' +
    //                             '>' + (item.SchoolYear || '') + '學年度第' + (item.Semester || '') + '學期</option>'
    //                         );
    //                     });
    //                 }
    //                 obj.find('select[name=semester]')
    //                     .html(items.join('') || '<option value="">目前無資料</option>')
    //                     .find('option:first').prop('selected', true).trigger('change');
    //             }
    //         }
    //     });
    // };

    // // TODO: 載入服務學習時數總覽
    // _gg.GetStudentServiceList = function() {
    //     if (_gg.list_classid && _gg.list_schoolyear && _gg.list_semester) {
    //         _gg.connection.send({
    //             service: "_.GetStudentServiceList",
    //             body: '<Request><Condition><ClassID>' + _gg.list_classid + '</ClassID>' +
    //                 '<SchoolYear>' + _gg.list_schoolyear + '</SchoolYear>' +
    //                 '<Semester>' + _gg.list_semester + '</Semester></Condition></Request>',
    //             result: function (response, error, http) {
    //                 if (error !== null) {
    //                     _gg.set_error_message('#mainMsg', 'GetStudentServiceList', error);
    //                 } else {
    //                     var _ref;
    //                     if (((_ref = response.Response) != null ? _ref.Students : void 0) != null) {
    //                         var items = [];
    //                         $(response.Response.Students).each(function(index, item) {
    //                             items.push(
    //                                 '<tr studentid="' + (item.StudentID || '') + '">' +
    //                                 '    <td>' + (item.SeatNo || '') + '</td>' +
    //                                 '    <td>' + (item.StudentNumber || '') + '</td>' +
    //                                 '    <td>' + (item.StudentName || '') + '</td>' +
    //                                 '    <td>' + (item.TotalHours || '') + '</td>' +
    //                                 '</tr>'
    //                             );
    //                         });
    //                         $('#sall table[data-type=all] tbody').html(items.join(''));
    //                     }
    //                 }
    //             }
    //         });
    //     }
    // };

    // // TODO: 載入個人服務學習時間
    // _gg.GetStudentDetail = function() {
    //     $('#sall table[data-type=total] tbody, #sall table[data-type=detail] tbody').html('');

    //     if (_gg.studentid && _gg.list_schoolyear && _gg.list_semester) {
    //         _gg.connection.send({
    //             service: "_.GetStudentDetail",
    //             body: '<Request><Condition><StudentID>' + _gg.studentid + '</StudentID>' +
    //                 '<SchoolYear>' + _gg.list_schoolyear + '</SchoolYear>' +
    //                 '<Semester>' + _gg.list_semester + '</Semester></Condition></Request>',
    //             result: function (response, error, http) {
    //                 if (error !== null) {
    //                     _gg.set_error_message('#mainMsg', 'GetStudentDetail', error);
    //                 } else {
    //                     var _ref, items = [];
    //                     if (((_ref = response.Response) != null ? _ref.Record : void 0) != null) {
    //                         $(response.Response.Record).each(function(index, item) {
    //                             items.push(
    //                                 '<tr>' +
    //                                 '    <td>' + (item.OccurDate || '') + '</td>' +
    //                                 '    <td>' +
    //                                 '        <ul>' +
    //                                 '            <li>' + (item.Reason || '') + '</li>' +
    //                                 '        </ul>' +
    //                                 '    </td>' +
    //                                 '    <td>' + (item.Hours || '') + '</td>' +
    //                                 '    <td>' + (item.Organizers || '') + '</td>' +
    //                                 '    <td>' + (item.Remark || '') + '</td>' +
    //                                 '</tr>'
    //                             );
    //                         });
    //                     }
    //                     var tmp = items.join('');
    //                     if (tmp) {
    //                         $('#sall table[data-type=detail] tbody').html(tmp);
    //                     } else {
    //                         $('#sall table[data-type=detail] tbody').html('<tr><td colspan="5">目前無資料</td></tr>');
    //                     }
    //                 }
    //             }
    //         });

    //         $('#sall table[data-type=all] tr[studentid=' + _gg.studentid + ']').clone().appendTo('#sall table[data-type=total] tbody');
    //     }
    // };

    // // TODO: 錯誤訊息
    // _gg.set_error_message = function(select_str, serviceName, error) {
    //     var tmp_msg = '<i class="icon-white icon-info-sign my-err-info"></i><strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(' + serviceName + ')';
    //     if (error !== null) {
    //         if (error.dsaError) {
    //             if (error.dsaError.status === "504") {
    //                 switch (error.dsaError.message) {
    //                     case '501':
    //                         tmp_msg = '<strong>很抱歉，您無讀取資料權限！</strong>';
    //                         break;
    //                 }
    //             } else if (error.dsaError.message) {
    //                 tmp_msg = error.dsaError.message;
    //             }
    //         } else if (error.loginError.message) {
    //             tmp_msg = error.loginError.message;
    //         } else if (error.message) {
    //             tmp_msg = error.message;
    //         }
    //         $(select_str).html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  " + tmp_msg + "\n</div>");
    //         $('.my-err-info').click(function(){alert('請拍下此圖，並與客服人員連絡，謝謝您。\n' + JSON.stringify(error, null, 2))});
    //     }
    // };
}

