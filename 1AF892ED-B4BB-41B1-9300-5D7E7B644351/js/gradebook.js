angular.module('gradebook', ['ngSanitize', 'ui.sortable', 'mgcrea.ngStrap.helpers.dimensions', 'mgcrea.ngStrap.helpers.debounce'])

    .controller('MainCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
        var $scope長這個樣子 = {
            current: {
                SelectMode: "No.",
                SelectSeatNo: "",
                Value: "",
                Student: {
                    SeatNo: "5",
                    StudentName: "凱澤",
                    StudentID: "3597",
                    StudentScoreTag: "成績身分:一般生"
                },
                Exam: {
                    Name: 'Midterm',
                    Range: {
                        Max: 100,
                        Min: 0
                    }
                },
                Course: {},
                VisibleExam: []
            },
            studentList: [
                {
                    StudentID: "3597",
                    StudentName: "凱澤",
                    SeatNo: "5",
                    Final: "",
                    Midterm: "89",
                    StudentScoreTag: "成績身分:一般生",
                    index: 0
                }
            ],
            examList: [
                {
                    Name: 'Midterm',
                    Type: 'Number',
                    Range: {
                        Max: 100,
                        Min: 0
                    },
                    Lock: true
                },
                {
                    Name: 'Final',
                    Type: 'Number'
                },
                {
                    Name: 'Comment',
                    Type: 'Text'
                },
                {
                    Name: 'Avg',
                    Type: 'Function',
                    Fn: function (obj) {
                        return ((obj.Midterm || 0) + (obj.Final || 0)) / 2;
                    }
                }
            ],
            examExtensionMap: [{
                //評量缺考設定
            }],
            process: [{}]
        };

        $scope.current = {
            SelectMode: "Seq.",
            SelectSeatNo: "",
            Value: "",
            Student: null,
            Exam: null,
            Course: null,
            SchoolYear: "",
            Semester: "",
        };
        $scope.params = gadget.params;
        $scope.params.DefaultRound = gadget.params.DefaultRound || '2';
        $scope.isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/gi) ? true : false;
        $scope.modeList = ['成績管理', '平時評量'];
        $scope.current.mode = '成績管理';
        $scope.connection = gadget.getContract("ta");
        $scope.connection2 = gadget.getContract("1campus.log.teacher");
        $scope.connection3 = gadget.getContract("1campus.h.gradebook.teacher");
        $scope.examExtensionMap = [];
        $scope.isNullAsZeroChecked = true;
        $scope.printCourseScore = false;
        $scope.printTrialCalculation = false;
        $scope.current.CourseStudentDefaultRound = [];

        // 四捨五入
        function rounding(val, precision) {
            return Math.round(Math.round(val * Math.pow(10, (precision || 0) + 1)) / 10) / Math.pow(10, (precision || 0));
        }

        // 加法
        function add(arg1, arg2) {
            var r1, r2, m;
            try {
                r1 = arg1.toString().split(".")[1].length;
            } catch (e) {
                r1 = 0;
            }
            try {
                r2 = arg2.toString().split(".")[1].length
            } catch (e) {
                r2 = 0;
            }
            m = Math.pow(10, Math.max(r1, r2));
            return (arg1 * m + arg2 * m) / m;
        }

        /** 
         * 取得評量缺考設定 examExtensionMap
         */
        new Promise((r, j) => {
            $scope.connection3.send({
                service: "_.GetExamExtensionMap",
                autoRetry: true,
                result: function (response, error, http) {

                    if (error) {
                        alert("1campus.h.gradebook.teacher._.GetExamExtensionMap Error");
                        j(false);
                    } else {
                        $scope.$apply(function () {
                            $scope.examExtensionMap = [].concat(response.ExamExtensionMap || []);
                        });
                        r(true);
                    }
                }
            });

        });
        /** 
         * 取得試算成績未輸入以0分計算設定 GetSetting
         */
        new Promise((r, j) => {
            $scope.connection3.send({
                service: "_.GetSetting",
                autoRetry: true,
                result: function (response, error, http) {

                    if (error) {
                        alert("1campus.h.gradebook.teacher._.GetSetting Error");
                        $scope.isNullAsZeroChecked = true;
                        j(false);
                    } else {
                        $scope.$apply(function () {
                            $scope.isNullAsZeroChecked = true;
                            if (response.length)
                                if (response.Response.is_null_as_zero == 'f') {
                                    //有資料，且不勾
                                    $scope.isNullAsZeroChecked = false;
                                } else {
                                    //有資料，且勾
                                    console.log('true', response.Response.is_null_as_zero);
                                }
                                
                        });
                        r(true);
                    }
                }
            });
        });

        /** 
         * 1. 取得目前學年度學期 GetCurrentSemester
         * 2. 取得授課課程 GetMyCourses
         * 3. 設定目前課程 SetCurrentCourse
         */
        new Promise((r, j) => {
            $scope.connection.send({
                service: "TeacherAccess.GetCurrentSemester",
                autoRetry: true,
                body: '',
                result: function (response, error, http) {

                    if (error) {
                        alert("請檢查教師帳號是否存在，錯誤訊息:TeacherAccess.GetCurrentSemester Error");
                        j(error);
                    } else {
                        r(response);
                    }
                }
            });
        }).then((rsp) => {
            var schoolYear = rsp.Current.SchoolYear;
            var semester = rsp.Current.Semester;

            $scope.current.SchoolYear = schoolYear;
            $scope.current.Semester = semester;

            //當前學年度學期
            $scope.currentSemester = `${schoolYear}學年度 第${semester}學期`;
            //選擇的學年度學期
            $scope.selectedSemester = `${schoolYear}學年度 第${semester}學期`;

            $scope.connection.send({
                service: "TeacherAccess.GetMyCourses",
                autoRetry: true,
                body: {
                    Content: {
                        Field: { All: '' },
                        Order: { CourseName: '' }
                    }
                },
                result: function (response, error, http) {
                    if (error) {
                        alert("TeacherAccess.GetMyCourses Error");
                    } else {
                        $scope.$apply(function () {
                            $scope.allCourses = [].concat(response.Courses.Course || []);
                            if ($scope.allCourses.length == 0)
                                $scope.HasNoCourse = true;
                            $scope.semesterList = Array.from(new Set($scope.allCourses.map(course => `${course.SchoolYear}學年度 第${course.Semester}學期`)));

                            // $scope.semesterList = $scope.allCourses
                            //     .map(course => `${course.SchoolYear}學年度 第${course.Semester}學期`)
                            //     .reduce((unique, item) => {
                            //         if (unique.indexOf(item) === -1) {
                            //             unique.push(item);
                            //         }
                            //         return unique;
                            //     }, []);

                            // 對學期列表進行排序
                            $scope.semesterList.sort((a, b) => {
                                var [aYear, aSemester] = a.match(/(\d+)學年度 第(\d)學期/).slice(1, 3).map(Number);
                                var [bYear, bSemester] = b.match(/(\d+)學年度 第(\d)學期/).slice(1, 3).map(Number);
                                if (aYear !== bYear) {
                                    return bYear - aYear; // 學年度由大到小排序
                                } else {
                                    return bSemester - aSemester; // 學期由大到小排序
                                }
                            });
                            $scope.filterCoursesBySemester($scope.currentSemester);
                        });

                        // 原先的邏輯 先註解
                        // $scope.$apply(function () {
                        //     $scope.courseList = [];
                        //     $scope.HasNoCourse = false;

                        //     [].concat(response.Courses.Course || []).forEach(function (courseRec, index) {
                        //         if (courseRec.SchoolYear == schoolYear && courseRec.Semester == semester) {
                        //             $scope.courseList.push(courseRec);
                        //         }
                        //     });

                        //     if ($scope.courseList.length == 0) {
                        //         // 本學期沒有任何課程
                        //         $scope.HasNoCourse = true;
                        //     } else {
                        //         $scope.setCurrentCourse($scope.courseList[0]);
                        //     }
                        // });
                    }
                }
            });
        });

        // 新增過濾課程的函數
        $scope.filterCoursesBySemester = function (semester) {
            var [schoolYear, semesterPart] = semester.match(/(\d+)學年度 第(\d)學期/).slice(1, 3);
            $scope.courseList = $scope.allCourses.filter(course => course.SchoolYear == schoolYear && course.Semester == semesterPart);
            if ($scope.courseList.length == 0) {
                $scope.HasNoCourse = true;
            } else {
                $scope.HasNoCourse = false;
                $scope.setCurrentCourse($scope.courseList[0]);
            }
        };
        // 新增設定當前學期的函數
        $scope.setSelectedSemester = function (semester) {
            $scope.selectedSemester = semester;
            $scope.filterCoursesBySemester(semester);
        };


        /**
         * 設定目前課程
         * 整理試別項目 examList
         */
        $scope.setCurrentCourse = function (course) {
            if ($scope.studentList) {
                var data_changed = !$scope.checkAllTable($scope.current.mode);
                if (data_changed) {
                    if (!window.confirm("警告:尚未儲存資料，現在離開視窗將不會儲存本次更動")) {
                        return;
                    }
                }
            }

            // 取得 Service 時間
            new Promise((r, j) => {
                $scope.connection.send({
                    service: "Sesrver.Now",
                    autoRetry: true,
                    body: {},
                    result: function (response, error, http) {
                        if (error) {
                            alert("Sesrver.Now Error");
                        } else {
                            if (error) {
                                alert("無法取得時間，錯誤訊息:TeacherAccess.Sesrver.Now Error");
                                j(error);
                            } else {
                                r(response);
                            }
                        }
                    }
                });
            }).then((rsp) => {
                $scope.current.Student = null;
                $scope.current.Exam = null;
                $scope.studentList = null;
                $scope.current.VisibleExam = [];
                $scope.current.Course = course;

                /**
                 * 
                 * 是否為 Date 可 parse 的字串
                 * 如無法為 Date parse, 則檢查是否是 SQL date format
                 * 另外兼容 '' 空字串判定, 因成績範圍未輸入時會收到空字串
                 * 空字串 Date 可解析, syntax 正確但是 semantic 錯誤
                 * 會解析成 UNIX 時間的開始時間 UTC1970年1月1日0時0分0秒
                 * 
                 * @param {*} t 欲檢查的時間
                 * @returns true: valid datetime string format
                 */
                const isValidSqlTimeOrDateTime = (t) => {
                    if (t == '') return false; //input 有空字串

                    let newDateTest = new Date(t);

                    if (newDateTest == 'Invalid Date') { //'Invalid Date' 為 js Date(Web API) parse 回傳的錯誤碼
                        let transformTest = luxon.DateTime.fromSQL(t).toISO();
                        if (transformTest == null) {
                            return false;
                        } else {
                            return true;
                        }

                    }

                    return true;

                }
                /**
                 * 
                 * 此 gadget 範圍內已知時間格式轉換
                 * 
                 * 允許的 input 集合: 
                    * YYYY-MM-DDTHH:mm:ss (ISO 8601)
                    * YYYY-MM-DD HH:mm:ss server 回傳的 now (應是 select Now())
                    * YYYY/MM/DD HH:mm:ss server 回傳的 inputStart /inputEnd
                    * '' 空字串 (回傳的 inputStart /inputEnd, 未輸入時)
                 * 
                 * 
                 * 
                 * @param {*} timestamp : 時間字串
                 * @returns Date 合法字串 (ISO 8601)
                 */
                const timestampWrapper = (timestamp) => {

                    let newDateTest = new Date(timestamp);
                    if (newDateTest == 'Invalid Date') {//Date constructor 返回的錯誤碼
                        console.log('timestamp iso: ', luxon.DateTime.fromSQL(timestamp).toISO())
                        return luxon.DateTime.fromSQL(timestamp).toISO();
                    } else {
                        console.log('timestamp str: ', timestamp)
                        return timestamp;
                    }

                }

                //規則: 與孟樺靜瑜確認, 除非 開始時間與結束時間 都有值才判斷, 否則皆為 lock
                if (isValidSqlTimeOrDateTime(course.InputStartTime) && isValidSqlTimeOrDateTime(course.InputEndTime)) {

                    // 是否開放課程成績輸入
                    $scope.current.Course.Lock = !(course.AllowUpload == '是' && new Date(timestampWrapper(course.InputStartTime)) < new Date(timestampWrapper(rsp.Timestamp.Now))
                        && new Date(timestampWrapper(rsp.Timestamp.Now)) < new Date(timestampWrapper(course.InputEndTime)));


                } else {

                    $scope.current.Course.Lock = true;

                }

                /** 
                 * * 取得課程學生的成績計算規則，學期科目成績計算至小數點後..位數
                 * */
                const getStudentByCourseID = new Promise((r, j) => {
                    $scope.connection3.send({
                        service: "_.GetStudentByCourseID",
                        autoRetry: true,
                        body: { CourseID: $scope.current.Course.CourseID },
                        result: function (response, error, http) {

                            if (error) {
                                alert("1campus.h.gradebook.teacher._.GetStudentByCourseID Error");

                                j(false);
                            } else {
                                studentMapping = [];
                                $scope.$apply(function () {
                                    $scope.current.CourseStudentDefaultRound = response.CourseStudent;
                                });
                                r(true);
                            }
                        }
                    });
                });

                // 課程評分樣板：定期評量清單
                $scope.templateList = [];
                $scope.examList = [];
                // 平時評量
                $scope.gradeItemList = [];
                // 目前定期評量的平時評量
                $scope.current.gradeItemList = [];
                // 目前評量項目
                $scope.current.template = null;
                // --?
                // 假如有目前試別的話 先將平均分數歸零
                // if ($scope.current.Exam) {
                //     $scope.current.Exam.avgScore = '';
                // }

                // 學期成績
                {
                    var finalScore = {
                        ExamID: '學期成績',
                        Name: '學期成績',
                        Type: 'Number',
                        Permission: 'Editor',
                        Lock: $scope.current.Course.Lock,
                        totalScore: 0,
                        totalStudent: 0
                    };
                    var finalScorePreview = {
                        ExamID: '學期成績_試算',
                        Name: '學期成績_試算',
                        SubName: '試算',
                        Type: 'Program',
                        Permission: 'Editor',
                        Lock: false,
                        Group: finalScore,
                        SubVisible: true,
                        Fn: function (stu) {
                            // 處理試算，新增判斷是否需要評分
                            var total = 0, base = 0, seed = 10000;

                            var totalPercentage = 0; // 記錄評量群組內的總比重
                            var exemptedPercentage = 0; // 記錄免試評量的比重
                            var useGroupExams = []; // 記錄屬於同一評量群組的所有評量
                            var exemptedExams = []; // 記錄屬於同一評量群組的免試評量

                            // 遍歷所有評量，計算總比重和免試評量比重
                            [].concat(course.Scores.Score || []).forEach(function (examRec) {
                                if (examRec.UseScore === "是") {
                                    var p = Number(examRec.Percentage) || 0;
                                    if (examRec.Extension.Extension.UseGroup === "是") {
                                        totalPercentage += p;
                                        useGroupExams.push(examRec);

                                        //沒勾的話，沒成績=免試
                                        if (stu['Exam' + examRec.ExamID + 'score_type'] == '免試' || (!$scope.isNullAsZeroChecked && !stu['Exam' + examRec.ExamID])) {
                                            exemptedPercentage += p;
                                            exemptedExams.push(examRec);
                                        }
                                    }
                                }
                            });

                            // 計算需要分配的比重 免試的評量比重均分給 同群組非免試的評量
                            var distributedPercentage = exemptedPercentage / (useGroupExams.length - exemptedExams.length);
                            // 遍歷所有評量，計算總分
                            [].concat(course.Scores.Score || []).forEach(function (examRec) {
                                if (examRec.UseScore === "是") {
                                    var p = Number(examRec.Percentage) || 0;
                                    var s = stu['Exam' + examRec.ExamID];

                                    if (examRec.Extension.Extension.UseGroup === "是") {
                                        if (isNaN(Number(stu['Exam' + examRec.ExamID]))) {
                                            if (stu['Exam' + examRec.ExamID + 'score_type'] == '0分') { // 0分設定
                                                p += distributedPercentage
                                                total += seed * p * 0;
                                                base += p;
                                            }

                                        } else if ($scope.isNullAsZeroChecked || (stu['Exam' + examRec.ExamID] || stu['Exam' + examRec.ExamID] == '0')) {
                                            // 新比重
                                            p += distributedPercentage;
                                            total += seed * p * Number(s);
                                            base += p;
                                        }
                                    } else {
                                        if (isNaN(Number(stu['Exam' + examRec.ExamID]))) {
                                            if (stu['Exam' + examRec.ExamID + 'score_type'] == '0分') { // 0分設定
                                                total += seed * p * 0;
                                                base += p;
                                            }
                                        } else if ($scope.isNullAsZeroChecked || (stu['Exam' + examRec.ExamID] || stu['Exam' + examRec.ExamID] == '0')) {
                                            total += seed * p * Number(s);
                                            base += p;
                                        }

                                    }
                                }
                            });

                            // {
                            //     [].concat(course.Scores.Score || []).forEach(function (examRec, index) {
                            //         // 需要評分才試算
                            //         if (examRec.UseScore === "是") {
                            //             var p = Number(examRec.Percentage) || 0;
                            //             var s = stu['Exam' + examRec.ExamID];

                            //             if (stu['Exam' + examRec.ExamID] != '缺')
                            //                 if (stu['Exam' + examRec.ExamID] || stu['Exam' + examRec.ExamID] == '0') {
                            //                     total += seed * p * Number(stu['Exam' + examRec.ExamID]);
                            //                     base += p;
                            //                 }
                            //         }
                            //     });
                            // }

                            // 依照成績計算規則
                            var digit = 2;
                            var math_type = '';
                            [].concat($scope.current.CourseStudentDefaultRound || []).forEach(function (drl) {
                                if (drl['student_id'] == stu['StudentID']) {

                                    stu['Course_MakeupStandard'] = drl['makeup_standard'] || 40;
                                    stu['Remark'] = drl['remark'];
                                    digit = drl['digit'] || 2;

                                    if (drl['is_floor'] == 't')
                                        math_type = 'is_floor';
                                    if (drl['is_round'] == 't')
                                        math_type = 'is_round';
                                    if (drl['is_ceil'] == 't')
                                        math_type = 'is_ceil';
                                }
                            });


                            if (base) {
                                var round = Math.pow(10, $scope.params[finalScorePreview.Name + 'Round'] || digit);
                                if (math_type === 'is_floor')
                                    stu['Exam' + finalScorePreview.ExamID] = (Math.floor((Math.floor(total / base) / seed) * round) / round).toFixed(digit);
                                else if (math_type === 'is_ceil')
                                    stu['Exam' + finalScorePreview.ExamID] = (Math.ceil((Math.floor(total / base) / seed) * round) / round).toFixed(digit);
                                else
                                    stu['Exam' + finalScorePreview.ExamID] = (Math.round((Math.floor(total / base) / seed) * round) / round).toFixed(digit);

                                // var round = Math.pow(10, $scope.params[finalScorePreview.Name + 'Round'] || $scope.params.DefaultRound);
                                // stu['Exam' + finalScorePreview.ExamID] = Math.round((Math.floor(total / base) / seed) * round) / round;
                            } else {
                                stu['Exam' + finalScorePreview.ExamID] = "";
                            }
                        }
                    };


                    $scope.examList.push(finalScore, finalScorePreview);
                    $scope.current.VisibleExam.push('學期成績', '學期成績_試算');
                }

                // 定期評量
                {
                    // $scope.templateList = [].concat(course.Scores.Score || []).map((temp) => {

                    //     temp.isSubScoreMode = false;
                    //     temp.Lock = !(new Date(temp.InputStartTime) < new Date(rsp.Timestamp.Now) && new Date(rsp.Timestamp.Now) < new Date(temp.InputEndTime));
                    //     return temp;
                    // });


                    // 處理不需要評分不顯示
                    [].concat(course.Scores.Score || []).forEach(function (temp) {
                        if (temp.UseScore === "是") {
                            console.log('2: ', new Date(temp.InputStartTime), new Date(timestampWrapper(rsp.Timestamp.Now)), new Date(timestampWrapper(rsp.Timestamp.Now)), new Date(temp.InputEndTime))
                            temp.isSubScoreMode = false;
                            if (isValidSqlTimeOrDateTime(temp.InputStartTime) && isValidSqlTimeOrDateTime(temp.InputEndTime)) {

                                // 是否開放課程成績輸入
                                temp.Lock = !(new Date(timestampWrapper(temp.InputStartTime)) < new Date(timestampWrapper(rsp.Timestamp.Now)) && new Date(timestampWrapper(rsp.Timestamp.Now)) < new Date(timestampWrapper(temp.InputEndTime)));

                            } else {

                                temp.Lock = true;

                            }
                            //temp.Lock = !(new Date(temp.InputStartTime) < new Date(timestampWrapper(rsp.Timestamp.Now)) && new Date(timestampWrapper(rsp.Timestamp.Now)) < new Date(temp.InputEndTime));

                            $scope.templateList.push(temp);
                        }
                    });
                    $scope.templateList.forEach(function (examRec) {
                        var useGroup = false;
                        if (examRec.Extension)
                            if (examRec.Extension.Extension.UseGroup == "是")
                                useGroup = true;
                        // 定期評量
                        var exam = {
                            ExamID: examRec.ExamID,
                            Name: examRec.Name,
                            Percentage: examRec.Percentage,
                            Type: 'Number',
                            Permission: 'Editor',
                            Lock: examRec.Lock,
                            totalStudent: 0,
                            totalScore: 0,
                            avgScore: '',
                            InputStartTime: examRec.InputStartTime,
                            InputEndTime: examRec.InputEndTime,
                            isSubScoreMode: false,
                            SubVisible: true,
                            UseText: examRec.UseText,
                            UseScore: examRec.UseScore,
                            UseGroup: useGroup,
                        };
                        $scope.examList.push(exam);
                        $scope.current.VisibleExam.push(examRec.Name);

                        // 文字評量
                        if (examRec.Extension) {
                            if (examRec.Extension.Extension.UseText == "是") {
                                var subExamRec = {
                                    ExamID: examRec.ExamID + '_文字評量',
                                    Name: examRec.Name + '_文字評量',
                                    SubName: '文字評量',
                                    Type: 'Text',
                                    Group: examRec,
                                    Permission: 'Editor',
                                    Lock: examRec.Lock,
                                    SubVisible: true
                                };
                                $scope.examList.push(subExamRec);
                                $scope.current.VisibleExam.push(subExamRec.Name);
                            }
                        }
                    });
                }

                $scope.getGradeItemList().then(value => {
                    $scope.dataReload();
                });

            });
        }

        /**
         * service GetCourseExtensions
         * 平時評量成績 Name="GradeItem"
         * 高中讀卡模組設定 Name="GradeItemExtension"
         */
        $scope.getGradeItemList = function () {

            return new Promise((r, j) => {
                // 重新取得平時評量項目
                $scope.gradeItemList = [];
                $scope.templateList.forEach((examRec) => {
                    // 各定期平時評量_試算
                    var quizResult = {
                        RefExamID: examRec.ExamID,
                        ExamID: 'QuizResult_' + examRec.ExamID,
                        Name: '試算',
                        Type: 'Number',
                        Permission: 'Program',
                        Lock: false,
                        SubVisible: true
                    };

                    $scope.gradeItemList.push(quizResult);
                });

                // 重新取得子成績項目
                $scope.examList = $scope.examList.filter(examRec => examRec.SubName != '讀卡' && examRec.SubName != '試卷');

                $scope.connection.send({
                    service: "TeacherAccess.GetCourseExtensions",
                    autoRetry: true,
                    body: {
                        Content: {
                            ExtensionCondition: {
                                '@CourseID': '' + $scope.current.Course.CourseID,
                                Name: ['GradeItemExtension', 'GradeItem']
                            }
                        }
                    },
                    result: function (response, error, http) {
                        if (error) {
                            alert("TeacherAccess.GetCourseExtensions Error");
                            j(false);
                        } else {
                            [].concat(response.Response.CourseExtension.Extension || []).forEach(function (extensionRec) {
                                // 平時評量項目 gradeItemList
                                if (extensionRec.Name == 'GradeItem') {
                                    // 檢查課程是否有設定小考試別
                                    if (extensionRec.GradeItem) {
                                        [].concat(extensionRec.GradeItem.Item || []).forEach((item) => {
                                            var targetExam = $scope.examList.find(exam => exam.ExamID == item.ExamID);
                                            var gradeItem = {
                                                RefExamID: item.ExamID, // 定期評量編號
                                                ExamID: `Exam_${item.ExamID}_Quiz_${item.SubExamID}`,
                                                SubExamID: item.SubExamID, // 平時評量編號
                                                Name: item.Name,
                                                Index: item.Index,
                                                Weight: item.Weight,
                                                Type: 'Number',
                                                Permission: 'Editor',
                                                Lock: targetExam ? targetExam.Lock : false,
                                                SubVisible: true
                                            };

                                            $scope.gradeItemList.push(gradeItem);
                                        });
                                    }
                                }
                                // 讀卡成績項目 examList
                                if (extensionRec.Name == 'GradeItemExtension') {
                                    [].concat(extensionRec.GradeItemExtension || []).forEach((item) => {
                                        var index = $scope.examList.findIndex((exam) => exam.ExamID == item.ExamID);
                                        var index2 = $scope.templateList.findIndex((temp) => temp.ExamID == item.ExamID);
                                        if (index > -1) {

                                            var targetExam = $scope.examList[index];
                                            targetExam.Permission = 'Read';

                                            var examCScore = {
                                                ExamID: targetExam.ExamID + 'CScore',
                                                Name: targetExam.Name + '讀卡',
                                                SubName: '讀卡',
                                                Group: targetExam,
                                                Type: 'Number',
                                                Permission: 'Read',
                                                Lock: targetExam.Lock,
                                                SubVisible: true
                                            };
                                            var examPScore = {
                                                ExamID: targetExam.ExamID + 'PScore',
                                                Name: targetExam.Name + '試卷',
                                                SubName: '試卷',
                                                Group: targetExam,
                                                Type: 'Number',
                                                Permission: 'Editor',
                                                Lock: targetExam.Lock,
                                                SubVisible: true
                                            };

                                            $scope.examList.splice(index + 1, 0, examCScore, examPScore);
                                            $scope.current.VisibleExam.splice(index + 1, 0, examCScore.Name, examPScore.Name);
                                        }
                                        if (index2 > -1) {
                                            $scope.templateList[index2].isSubScoreMode = true;
                                        }
                                    });
                                }
                            });

                            //   $scope.dataReload();
                            r(true);
                        }

                        // --?
                        // 設定目前定期評量 
                        // if ($scope.current.mode == '平時評量') {
                        //     $scope.setCurrentTemplate($scope.templateList[0]);
                        // }
                    }
                });

            });
        }

        /** 
         * GetCourseStudents 取得課程學生
         * GetCourseExamScore 取得定期評量成績
         * GetCourseSemesterScore 取得學期成績
         * GetSCAttendExtensions 取得小考成績
         * setupCurrent
         */
        $scope.dataReload = function () {
            // Init avgScore
            $scope.examList = $scope.examList.map((exam) => {
                exam.totalScore = 0;
                exam.totalStudent = 0;
                exam.avgScore = '';
                return exam;
            });
            // 取得課程學生
            $scope.connection.send({
                service: "TeacherAccess.GetCourseStudents2024",
                autoRetry: true,
                body: {
                    Content: {
                        Field: { All: '' },
                        Condition: { CourseID: $scope.current.Course.CourseID },
                        Order: {
                            GradeYear: 'asc', DisplayOrder: 'asc', ClassName: 'asc', SeatNo: 'asc', StudentNumber: 'asc'
                        }
                    }
                },
                result: function (response, error, http) {
                    if (error) {
                        alert("TeacherAccess.GetCourseStudents2024 Error");
                    } else {
                        var studentMapping = {};
                        $scope.$apply(function () {
                            $scope.studentList = [];
                            $scope.OrginStudentList = [];
                            [].concat(response.Students.Student || []).forEach(function (studentRec, index) {
                                studentRec.SeatNo = studentRec.SeatNumber;
                                studentRec.StudentScoreTag = "預設";

                                //2017/6/15 穎驊新增，因應 [A09][06] 子成績輸入-顯示成績身分 項目 ，加入顯示身分類別 ，以利老師在輸入成績時作為判別資訊。
                                if (studentRec.Tags) {
                                    [].concat(studentRec.Tags.Tag || []).forEach(function (tag) {

                                        if (tag.Name.includes("成績身分")) {
                                            studentRec.StudentScoreTag = tag.Name;
                                            studentRec.StudentTag = tag.Name.replace('成績身分:', '');
                                        }
                                        // 列出所有類別(沒道理...)
                                        //studentRec.StudentScoreTag += tag.Name;
                                    });
                                }

                                // 2020/3/27 因需求提供及格標準
                                if (!studentRec.PassingStandard) {
                                    studentRec.PassingStandard = 60; // 預設
                                }
                                // if (!studentRec.MakeupStandard) {
                                //     studentRec.MakeupStandard = 40; // 2024.06.18 取不到值，content.htm改讀stuRec.Course_MakeupStandard
                                // }

                                studentRec.index = index;
                                // studentRec Init
                                {
                                    $scope.examList.forEach(function (examRec) {
                                        studentRec['Exam' + examRec.ExamID] = '';
                                    });
                                    $scope.gradeItemList.forEach((item) => {
                                        studentRec[item.ExamID] = '';
                                    });
                                }
                                $scope.studentList.push(studentRec);
                                $scope.OrginStudentList.push(Object.assign({}, studentRec));
                                studentMapping[studentRec.StudentID] = studentRec;
                            });




                            // 已透過 Service 處理，這段不需要
                            // // 學生排序
                            // $scope.studentList.sort((a, b) => {
                            //     if (Number(a.SeatNo) > Number(b.SeatNo)) {
                            //         return 1;
                            //     }
                            //     if (Number(a.SeatNo) < Number(b.SeatNo)) {
                            //         return -1;
                            //     }
                            //     return 0;
                            // });
                            // $scope.studentList.sort((a, b) => {
                            //     if (a.ClassName > b.ClassName) {
                            //         return 1;
                            //     }
                            //     if (a.ClassName < b.ClassName) {
                            //         return -1;
                            //     }

                            //     return 0;
                            // });
                            // // 學生清單排序後index更新
                            // $scope.studentList = $scope.studentList.map((stu, index) => {
                            //     stu.index = index;
                            //     return stu;
                            // });

                            // 取得定期評量成績
                            var getCourseExamScore = new Promise((r, j) => {
                                $scope.connection.send({
                                    service: "TeacherAccess.GetCourseExamScore2024",//2020
                                    autoRetry: true,
                                    body: {
                                        Content: {
                                            Field: { All: '' },
                                            Condition: { CourseID: $scope.current.Course.CourseID },
                                            Order: { SeatNumber: '' }
                                        }
                                    },
                                    result: function (response, error, http) {
                                        if (error) {
                                            alert("TeacherAccess.GetCourseExamScore2024 Error");
                                            j(false);
                                        } else {
                                            $scope.$apply(function () {
                                                [].concat(response.Scores.Item || []).forEach(function (examScoreRec) {

                                                    // 評量分數
                                                    studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID] = examScoreRec.Score;
                                                    studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID + 'score_type'] = '';

                                                    //Cynthia new
                                                    $scope.examExtensionMap.forEach(function (map) {
                                                        if (examScoreRec.Extension && examScoreRec.Extension.Extension) {
                                                            if (map.use_value == examScoreRec.Score && map.use_text == examScoreRec.Extension.Extension.UseText) {
                                                                studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID] = examScoreRec.Extension.Extension.UseText;
                                                                studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID + 'score_type'] = map.score_type;
                                                            } else if (!examScoreRec.Extension.Extension.UseText && examScoreRec.Extension.Extension.Score == '缺' && examScoreRec.Score == '-1') {
                                                                ////ext.use_text==undefined && ext.Score =='缺' && Score =='-1'  >>>> 舊制的缺
                                                                studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID] = examScoreRec.Extension.Extension.Score;
                                                            } else {
                                                                // console.log(examScoreRec.Extension.Extension.UseText);
                                                                // console.log(examScoreRec.Extension.Extension.Score);
                                                                // console.log(examScoreRec.Score);
                                                            }
                                                        }

                                                    });

                                                    // 2020/3/27 新增學生及格標準，如果沒有以60分算
                                                    if (!examScoreRec.PassingStandard) {
                                                        examScoreRec.PassingStandard = 60;
                                                    }
                                                    // if (!examScoreRec.MakeupStandard) {
                                                    //     examScoreRec.MakeupStandard = 40;
                                                    // }
                                                    // 及格標準
                                                    studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID + 'PassingStandard'] = examScoreRec.PassingStandard;
                                                    //studentMapping[examScoreRec.StudentID]['Exam' + '_' + 'MakeupStandard'] = examScoreRec.MakeupStandard;

                                                    if (examScoreRec.Extension.Extension) {
                                                        // 文字評量
                                                        studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID + '_文字評量'] = examScoreRec.Extension.Extension.Text == undefined ? '' : examScoreRec.Extension.Extension.Text;

                                                        // 子評量分數 (讀卡)
                                                        $scope.examList.forEach(function (examRec) {
                                                            if (examRec.ExamID == examScoreRec.ExamID) {
                                                                studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID + 'PScore'] = examScoreRec.Extension.Extension.PScore == undefined ? '' : examScoreRec.Extension.Extension.PScore;
                                                                studentMapping[examScoreRec.StudentID]['Exam' + examScoreRec.ExamID + 'CScore'] = examScoreRec.Extension.Extension.CScore == undefined ? '' : examScoreRec.Extension.Extension.CScore;
                                                            }
                                                        });
                                                    }
                                                    // 分數加總、人數加總
                                                    var index = $scope.examList.findIndex((exam) => exam.ExamID == examScoreRec.ExamID);
                                                    if (index > -1) {
                                                        // 處理缺考
                                                        if (!isNaN(examScoreRec.Score)) { //有分數
                                                            var skipStudent = false;
                                                            var totalScore = Number(examScoreRec.Score);

                                                            $scope.examExtensionMap.forEach(function (map) {
                                                                if (examScoreRec.Extension && examScoreRec.Extension.Extension) {
                                                                    if (map.use_value == examScoreRec.Score && map.use_text == examScoreRec.Extension.Extension.UseText) {
                                                                        if (map.score_type === "0分") {
                                                                            //視為0分
                                                                            totalScore = 0;
                                                                        } else if (map.score_type === "免試") {
                                                                            //視為沒有分數
                                                                            skipStudent = true;
                                                                        }
                                                                    } else if (!examScoreRec.Extension.Extension.UseText && examScoreRec.Extension.Extension.Score == '缺' && examScoreRec.Score == '-1') {
                                                                        //舊制的缺 視為沒有分數
                                                                        skipStudent = true;
                                                                    }
                                                                }
                                                            });
                                                            if (!skipStudent) {
                                                                $scope.examList[index].totalStudent += 1;
                                                                $scope.examList[index].totalScore += totalScore;
                                                            }
                                                        }

                                                    }
                                                });
                                            });
                                            r(true);
                                        }
                                    }
                                });
                            });
                            // 取得學期成績
                            var getCourseSemesterScore = new Promise((r, j) => {
                                $scope.connection.send({
                                    service: "TeacherAccess.GetCourseSemesterScore",
                                    autoRetry: true,
                                    body: {
                                        Content: {
                                            Field: {
                                                All: ''
                                            },
                                            Condition: {
                                                CourseID: $scope.current.Course.CourseID
                                            },
                                            Order: {
                                                SeatNumber: ''
                                            }
                                        }
                                    },
                                    result: function (response, error, http) {
                                        if (error) {
                                            alert("TeacherAccess.GetCourseSemesterScore Error");
                                            j(false);
                                        } else {
                                            $scope.$apply(function () {
                                                [].concat(response.Scores.Item || []).forEach(function (finalScoreRec) {
                                                    studentMapping[finalScoreRec.StudentID]['Exam學期成績'] = finalScoreRec.Score;

                                                    // 2020/3/27 新增取得學生及格標準
                                                    if (studentMapping[finalScoreRec.StudentID].PassingStandard) {
                                                        studentMapping[finalScoreRec.StudentID]['Exam學期成績' + 'PassingStandard'] = studentMapping[finalScoreRec.StudentID].PassingStandard;
                                                    } else {
                                                        studentMapping[finalScoreRec.StudentID]['Exam學期成績' + 'PassingStandard'] = 60;
                                                    }

                                                    // 分數加總、人數加總
                                                    var index = $scope.examList.findIndex((exam) => exam.ExamID == '學期成績');
                                                    if (index > -1) {
                                                        if (!isNaN(finalScoreRec.Score)) {
                                                            var totalScore = Number(finalScoreRec.Score);
                                                            $scope.examList[index].totalStudent += 1;
                                                            $scope.examList[index].totalScore += totalScore;
                                                        }
                                                    }
                                                });
                                            });
                                            r(true);
                                        }
                                    }
                                });
                            });
                            // 取得小考分數
                            var getScAttendExtensions = new Promise((r, j) => {
                                $scope.connection.send({
                                    service: "TeacherAccess.GetSCAttendExtensions",
                                    autoRetry: true,
                                    body: {
                                        Content: {
                                            ExtensionCondition: {
                                                '@CourseID': $scope.current.Course.CourseID,
                                                Name: 'GradeBook'
                                            }
                                        }
                                    },
                                    result: function (response, error, http) {
                                        if (error) {
                                            alert("TeacherAccess.GetSCAttendExtensions Error");
                                            j(false);
                                        } else {
                                            $scope.$apply(function () {
                                                [].concat(response.Response.SCAttendExtension || []).forEach(function (item) {
                                                    [].concat(item.Extension.Exam || []).forEach((exam) => {
                                                        // 平時評量成績：為小考結算後分數
                                                        studentMapping[item.StudentID][`QuizResult_${exam.ExamID}`] = (exam.Score || '');
                                                        // 平時評量-小考成績
                                                        [].concat(exam.Item || []).forEach(e => {
                                                            studentMapping[item.StudentID][`Exam_${exam.ExamID}_Quiz_${e.SubExamID}`] = (e.Score || '');
                                                        });
                                                    });
                                                });
                                                r(true);
                                            });
                                        }
                                    }
                                });
                            });

                            // 備份學生原始資料
                            Promise.all([getCourseExamScore, getCourseSemesterScore, getScAttendExtensions]).then(() => {
                                // 成績資料讀取完後計算平均 avgScore
                                $scope.examList.forEach(function (examRec) {
                                    if (examRec.totalStudent > 0) {
                                        // 非缺才放入平均
                                        if (!isNaN(examRec.totalScore)) {
                                            examRec.avgScore = rounding((examRec.totalScore / examRec.totalStudent), 2);
                                        }
                                    }
                                    else {
                                        examRec.avgScore = '';
                                    }
                                });
                                $scope.dataBackUp();
                            });
                        });


                        //  $scope.OrginStudentList =$scope.studentList.slice();

                        // console.log('$scope.OrginStudentList', $scope.OrginStudentList);

                    }
                }
            });
        }

        // 檢查及格標準變色
        $scope.checkPass = function (score, standard) {
            var pStandard = +standard;

            if (score === '' || score === '缺') {
                return { 'background-color': 'unset' };
            }

            if (+score < 0 || +score > 100) {
                return { 'background-color': '#ffda93' };
            }

            if (+score < pStandard) {
                return { 'background-color': 'yellow' };
            }

            if (score === "0") {
                return { 'background-color': 'yellow' };
            }

            //   return { 'background-color': 'unset' };
        }
        // 檢查「課程成績」變色
        $scope.checkExamLock = function (exam) {
            var ExamName = exam.Name;
            var lock = exam.Lock;

            if (ExamName === '學期成績' && lock)
                return { 'color': '#9d9d9d' };
            //return { 'background-color': 'yellow', 'color': 'gray' };
        }
        /** 
         * 1. 備份學生原始資料
         * 2. setupCurrent 
         */
        $scope.dataBackUp = function () {
            $scope.studentList.forEach(function (studentRec) {
                var rawStudentRec = angular.copy(studentRec);
                for (var key in rawStudentRec) {
                    if (!key.match(/Origin$/gi)) {
                        studentRec[key + 'Origin'] = studentRec[key];
                    }
                }
            });
            if ($scope.current.mode == '平時評量') {
                var chk = false;

                $scope.templateList.forEach(function (rec) {
                    if ($scope.current.template) {
                        if ($scope.current.template.Name === rec.Name) {
                            chk = true;
                        }
                    }
                });
                if (chk) {
                    $scope.setCurrentTemplate($scope.current.template);
                } else {
                    $scope.setCurrentTemplate($scope.templateList[0]);

                }
            } else {
                $scope.setCurrentTemplate($scope.current.template || $scope.templateList[0]);
            }

        }

        // 目前試別的切換
        $scope.setCurrentTemplate = function (template) {
            var execute = false;
            // 檢查資料是否更動
            var data_changed = !$scope.checkAllTable($scope.current.mode);
            if (data_changed) {
                if (!window.confirm("警告:尚未儲存資料，現在離開視窗將不會儲存本次更動")) {
                    return;
                }
                else {
                    execute = true;
                }
            } else {
                execute = true;
            }            
            if (execute) {
                $scope.current.template = template;
                $scope.current.gradeItemList = [];
                // 篩選出目前定期的平時評量項目
                $scope.gradeItemList.forEach(item => {
                    if (item.RefExamID == $scope.current.template.ExamID) {
                        $scope.current.gradeItemList.push(item);
                    }
                });

                // 定期評量改變後：目前學生不變、目前試別改變
                $scope.current.Exam = null;
                // 設定目前學生與目前試別
                $scope.setupCurrent();
                // 切換試別  要帶出不同的 功能
                $scope.getProcess();
            }
        }

        /**
         * 設定目前畫面資料、學生、試別
         * 執行setCurrent
         */
        $scope.setupCurrent = function () {
            if ($scope.studentList && $scope.examList) {
                // 計算：學期成績試算
                $scope.calc();
                var student, exam;

                /**設定目前學生 */
                if (!$scope.current.Student) {
                    student = $scope.studentList[0];
                } else {
                    student = $scope.current.Student;
                }
                /**
                 * 設定目前試別 
                 * 1. 成績管理模式 試別來自 examList
                 * 2. 平時評量模式 試別來自 gradeItemList
                 */
                if ($scope.current.mode == '成績管理') {
                    if (!$scope.current.Exam) {
                        exam = $scope.examList[0];
                    } else {
                        exam = $scope.current.Exam;
                    }
                }
                else if ($scope.current.mode == '平時評量') {
                    if (!$scope.current.Exam) {
                        exam = $scope.current.gradeItemList[0];
                    } else {
                        exam = $scope.current.Exam;
                    }
                }
                if (student && exam) {
                    $scope.setCurrent(student, exam, true, true);
                }
                $(function () {
                    $("#affixPanel").affix({
                        offset: {
                            top: 100,
                            bottom: function () {
                                return (this.bottom = $('.footer').outerHeight(true));
                            }
                        }
                    });
                });
            }
        }

        $scope.setCurrent = function (student, exam, setCondition, setFocus) {
            $scope.current.Exam = exam;
            $scope.current.Student = student;

            var val;

            if ($scope.current.mode == '成績管理') { // 成績管理模式
                val = (student || {})['Exam' + (exam || {}).ExamID];
            }
            else if ($scope.current.mode == '平時評量') { // 平時評量模式
                val = (student || {})[(exam || {}).ExamID];
            }

            $scope.current.Value = (angular.isNumber(val) ? val : (val || ""));

            if (setCondition && student) {
                $scope.current.SelectSeatNo = student.SeatNo;
            }
            if (setFocus) {
                $('.pg-grade-textbox:visible').focus()
                $timeout(function () {
                    $('.pg-grade-textbox:visible').select();
                }, 1);
            }
        }

        /** 學期成績試算 */
        $scope.calc = function () {
            [].concat($scope.examList).reverse().forEach(function (examItem) {
                if (examItem.Permission == "Editor" && !!!examItem.Lock && examItem.Type == "Program") {
                    $scope.studentList.forEach(function (stuRec) {
                        examItem.Fn(stuRec);
                    });
                }
            });
        }

        /**
        * 模式切換
        * 成績管理模式、平時評量模式
        */
        $scope.setCurrentMode = function (_mode) {
            var execute = false;
            // 檢查資料是否更動
            var data_changed = !$scope.checkAllTable($scope.current.mode);
            if (data_changed) {
                if (!window.confirm("警告:尚未儲存資料，現在離開視窗將不會儲存本次更動")) {
                    return;
                }
                else {
                    execute = true;
                }
            } else {
                execute = true;
            }
            if (execute) {
                $scope.current.mode = _mode;

                // 假如切回去 成績管理模式 ， 把目前的 template 設回空，讓下次切換時，在下面重抓
                // if ($scope.current.mode == '成績管理') {
                //     $scope.current.template = null;
                // }

                // 資料Reload (模式切換，依然是目前的課程，會自動帶入目前第一個開放的試別)
                // $scope.setCurrentCourse($scope.current.Course);

                // // 設定目前定期評量 
                // if ($scope.current.mode == '平時評量') {
                //     var template = $scope.templateList.filter(template => template.ExamID == $scope.current.Exam.ExamID)[0];
                // }

                // 目前選擇的試別清空
                // $scope.current.Exam = null;
                // $scope.setupCurrent();
                $scope.setCurrentTemplate($scope.current.template || $scope.templateList[0]);
            }
        }

        /** 顯示子成績項目,屏除此設計預設展開 */
        $scope.showSubExam = function (exam) {
            $scope.examList.forEach((examRec) => {
                if (examRec.Group) {
                    if (examRec.Group.ExamID == exam.ExamID) {
                        examRec.SubVisible = !examRec.SubVisible;
                    }
                }
            });
        }

        $scope.enterGrade = function (event) {
            if (event && (event.keyCode !== 13 || $scope.isMobile)) return;
            var flag = false;
            if ($scope.current.Exam.Type == 'Number') {
                var temp = Number($scope.current.Value);
                if (!isNaN(temp)
                    && (!$scope.current.Exam.Range || (!$scope.current.Exam.Range.Max && $scope.current.Exam.Range.Max !== 0) || temp <= $scope.current.Exam.Range.Max)
                    && (!$scope.current.Exam.Range || (!$scope.current.Exam.Range.Min && $scope.current.Exam.Range.Min !== 0) || temp >= $scope.current.Exam.Range.Min)) {
                    flag = true;

                    if (!$scope.current.Exam.Group) {
                        var round = Math.pow(10, $scope.params[$scope.current.Exam.Name + 'Round'] || $scope.params.DefaultRound);
                        temp = Math.round(temp * round) / round;
                    }
                }
                // if ($scope.current.Value == "缺" || $scope.current.Value == "-") {
                //     flag = true;
                // }

                if ($scope.current.Value == "-") {
                    flag = true;
                }

                var tempMapText = '';

                if ($scope.current.Exam.ExamID !== '學期成績')
                    $scope.examExtensionMap.forEach(function (map) {
                        if (map.use_text == $scope.current.Value) {
                            tempMapText = map.use_text;
                            flag = true;
                        }
                    });


                // if (flag) {
                //     if ($scope.current.Value != "" && $scope.current.Value != "缺" && $scope.current.Value != "-") {
                //         $scope.current.Value = temp;
                //     } else if ($scope.current.Value === "-") {
                //         $scope.current.Value = '';
                //     }
                // }
                if (flag) {
                    if ($scope.current.Value != "" && $scope.current.Value != tempMapText && $scope.current.Value != "-") {
                        $scope.current.Value = temp;
                    } else if ($scope.current.Value === "-") {
                        $scope.current.Value = '';
                    }
                }
            }
            else {
                flag = true;
            }
            if (flag) {
                $scope.submitGrade();
            }
        }

        $scope.submitGrade = function (matchNext) {
            if ($scope.current.mode === '成績管理') {
                console.log('$scope.current.Value', $scope.current.Value);
                $scope.current.Student['Exam' + $scope.current.Exam.ExamID] = $scope.current.Value;
                $scope.current.Student['Exam' + $scope.current.Exam.ExamID + 'score_type'] = '';
                //Cynthia new
                if ($scope.current.Exam.ExamID !== '學期成績')
                    $scope.examExtensionMap.forEach(function (map) {
                        if (map.use_text == $scope.current.Value) {
                            $scope.current.Student['Exam' + $scope.current.Exam.ExamID + 'score_type'] = map.score_type;
                        }
                    });

                if ($scope.current.Exam.Group) {
                    var examRec = $scope.current.Exam.Group;
                    // 取得定期評量
                    var template = $scope.templateList.find((temp) => temp.ExamID == examRec.ExamID) || {};
                    if (template && template.isSubScoreMode) {
                        var ps = $scope.current.Student['Exam' + template.ExamID + 'PScore'];
                        var cs = $scope.current.Student['Exam' + template.ExamID + 'CScore'];

                        // var score = (ps == '' && cs == '') ? '' : ps * 1 + cs * 1;
                        var score = (ps === '' && cs === '') ? '' : add(+ps, +cs);
                        $scope.current.Student['Exam' + template.ExamID] = score;
                    }
                }

                $scope.calc();
                var nextStudent =
                    $scope.studentList.length > ($scope.current.Student.index + 1) ?
                        $scope.studentList[$scope.current.Student.index + 1] :
                        $scope.studentList[0];

                $scope.setCurrent(nextStudent, $scope.current.Exam, true, false);

                if ($scope.current.SelectMode != 'Seq.')
                    $('.pg-seatno-textbox:visible').select().focus();
                else {
                    $('.pg-grade-textbox:visible').select().focus();
                }
                $timeout(function () {
                    if ($scope.current.SelectMode != 'Seq.')
                        $('.pg-seatno-textbox:visible').select();
                    else {
                        $('.pg-grade-textbox:visible').select();
                    }
                }, 1);
            }
            else {
                // 平時評量成績
                $scope.current.Student[$scope.current.Exam.ExamID] = $scope.current.Value;

                // 計算平時評量
                $scope.calcQuizResult($scope.current.Student);
                // 目前學生換下一位
                var nextStudent = $scope.studentList.length > ($scope.current.Student.index + 1) ?
                    $scope.studentList[$scope.current.Student.index + 1] :
                    $scope.studentList[0];

                $scope.setCurrent(nextStudent, $scope.current.Exam, true, true);
            }
        }

        /** 
         * 儲存定期評量成績 SetCourseExamScoreWithExtension
         * 儲存學期成績(課程成績) SetCourseSemesterScore
         */
        $scope.saveAll = function () {
            let invalidScore = false;

            //檢查評量成績
            $scope.templateList.forEach(function (examRec, index) {
                if (!examRec.Lock) {
                    [].concat($scope.studentList || []).forEach(function (studentRec) {
                        var score = studentRec['Exam' + examRec.ExamID];
                        if (score > 100 || score < 0) {
                            console.log('評量成績「' + score + '」輸入有誤，請確認後再儲存。');
                            invalidScore = true;
                            return;
                        }

                    });
                }
            });
            //檢查學期成績
            [].concat($scope.studentList || []).forEach(function (studentRec) {
                if (studentRec['Exam學期成績'] > 100 || studentRec['Exam學期成績'] < 0) {
                    console.log('學期成績「' + studentRec['Exam學期成績'] + '」輸入有誤，請確認後再儲存。');
                    invalidScore = true;
                    return;
                }
            });

            if (invalidScore) {
                alert('成績輸入有誤，請確認後再儲存。');
                return;
            }

            // 儲存定期評量成績
            var SetCourseExamScoreWithExtension = function () {
                let isChange = false
                let logManangers = [];
                let logDescription = `課程：${$scope.current.Course.CourseName}  【評量成績】　\n`;
                return new Promise((r, j) => {
                    var body = {
                        Content: {
                            '@CourseID': $scope.current.Course.CourseID,
                            Exam: []
                        }
                    };
                    $scope.templateList.forEach(function (examRec, index) {

                        if (!examRec.Lock) {
                            var eItem = {
                                '@ExamID': examRec.ExamID,
                                Student: []
                            };
                            [].concat($scope.studentList || []).forEach(function (studentRec) {

                                var text = '' + studentRec['Exam' + examRec.ExamID + '_文字評量'];
                                var score = studentRec['Exam' + examRec.ExamID];
                                var score_type = studentRec['Exam' + examRec.ExamID + 'score_type'];
                                var use_text = '';

                                if (score_type == '0分') {
                                    score = -1;
                                    use_text = studentRec['Exam' + examRec.ExamID];
                                }
                                if (score_type == '免試') {
                                    score = -2;
                                    use_text = studentRec['Exam' + examRec.ExamID];
                                }
                                //ext.use_text=='' && ext.Score =='缺' && Score =='-1'  >>>> 舊制的缺
                                var data = {
                                    '@StudentID': studentRec.StudentID,
                                    '@Score': score,
                                    Extension: {
                                        Extension: {
                                            Score: studentRec['Exam' + examRec.ExamID]
                                            , UseText: use_text
                                            , Text: text.replace(/'/g, "''")
                                        }
                                    }
                                };

                                if (studentRec['Exam' + examRec.ExamID] != studentRec['Exam' + examRec.ExamID + 'Origin']) {
                                    isChange = true;
                                    if (logManangers.length == 0 || !(logManangers.find(x => { return x.key == `Exam_${examRec.ExamID}` }))) { //第一次

                                        var logBySubItem = {
                                            key: `Exam_${examRec.ExamID}`,
                                            title: "",
                                            descriptSection: []

                                        };
                                        logBySubItem.title = `\n 輸入【${examRec.Name}】成績: \n`;
                                        logBySubItem.descriptSection = [];
                                        logManangers.push(logBySubItem);
                                    }

                                    var temp = logManangers.find(x => { return x.key == `Exam_${examRec.ExamID}` });
                                    var descriptByItem = `　${studentRec.ClassName}班  ${studentRec.SeatNo}號  ${studentRec.StudentName}  , ${studentRec['Exam' + examRec.ExamID + 'Origin'] || '  '} => ${studentRec['Exam' + examRec.ExamID]}  `;

                                    temp.descriptSection.push(descriptByItem);

                                }


                                // 是否為讀卡子成績項目
                                if (examRec.isSubScoreMode) {
                                    data.Extension.Extension['CScore'] = studentRec['Exam' + examRec.ExamID + 'CScore'];
                                    data.Extension.Extension['PScore'] = studentRec['Exam' + examRec.ExamID + 'PScore'];

                                }

                                eItem.Student.push(data);
                            });
                            body.Content.Exam.push(eItem);
                        }
                    });


                    logManangers.forEach(x => {
                        logDescription += x.title;
                        logDescription += x.descriptSection.join('\n');
                    });

                    // 評量成績
                    $scope.connection.send({
                        service: 'TeacherAccess.SetCourseExamScoreWithExtension',
                        autoRetry: true,
                        body: body,
                        result: function (response, error, http) {
                            if (error) {
                                alert('TeacherAccess.SetCourseExamScoreWithExtension Error:' + error);
                                console.log(error);
                                j(false);
                            } else {
                                r(true);
                            }
                        }
                    });


                    /**log */
                    if (isChange) {
                        $scope.connection2.send({
                            service: "_.InsertLogFromWeb",
                            body: `<Request>
                            <ActionType>${'insert'}</ActionType>
                            <Action>${'修改成績'}</Action>
                            <TargetCategory>${'teacher'}</TargetCategory>
                            <ActionBy>${'web:成績輸入'}</ActionBy>
                            <Description>${logDescription}</Description>
                        </Request>`,
                            result: function (response, error, http) {
                                if (error !== null) {
                                    alert("log發生錯誤 :[001]");
                                } else {
                                    console.log('成功輸入!');
                                }
                            }
                        });
                    }

                });
            }

            // 儲存學期成績(課程成績)
            var SetCourseSemesterScore = function () {

                var isChange = false;
                var descriptString = `修改 ${$scope.current.Course.CourseName} 【課程成績】 \n`;

                return new Promise((r, j) => {
                    var body = {
                        Content: {
                            Course: {
                                '@CourseID': $scope.current.Course.CourseID,
                                Student: []
                            }
                        }
                    };
                    [].concat($scope.studentList || []).forEach(function (studentRec) {

                        // log用
                        if (studentRec['Exam學期成績'] != studentRec['Exam學期成績Origin']) {
                            descriptString += `  ${studentRec.ClassName}班 ${studentRec.SeatNo}號  ${studentRec.StudentName}  ,${studentRec['Exam學期成績Origin']} => ${studentRec['Exam學期成績']} \n`
                            isChange = true;
                        }

                        var obj = {
                            '@StudentID': studentRec.StudentID,
                            '@Score': studentRec['Exam學期成績']
                        };
                        body.Content.Course.Student.push(obj);
                        console.log({ obj });

                    });
                    console.log({ body });
                    $scope.connection.send({
                        service: "TeacherAccess.SetCourseSemesterScore",
                        autoRetry: true,
                        body: body,
                        result: function (response, error, http) {
                            if (error) {
                                alert("TeacherAccess.SetCourseSemesterScore Error:" + error);
                                console.log(error);
                                j(false);
                            } else {
                                r(true);
                            }
                        }
                    });

                    if (isChange) {
                        $scope.connection2.send({
                            service: "_.InsertLogFromWeb",
                            body: `<Request>
                            <ActionType>${'insert'}</ActionType>
                            <Action>${'修改成績'}</Action>
                            <TargetCategory>${'teacher'}</TargetCategory>
                            <ActionBy>${'web:成績輸入'}</ActionBy>
                            <Description>${descriptString}</Description>
                        </Request>`,
                            result: function (response, error, http) {
                                if (error !== null) {
                                    alert("log發生錯誤[004]");
                                } else {
                                    console.log('成功輸入!');
                                }
                            }
                        });
                    }
                });
            }

            if (!$scope.current.Course.Lock) {

                Promise.all([SetCourseSemesterScore(), SetCourseExamScoreWithExtension()]).then(() => {
                    $scope.dataReload();
                    alert("儲存完成。");
                });
            } else {
                SetCourseExamScoreWithExtension().then(() => {
                    $scope.dataReload();
                    alert("儲存完成。");
                });
            }
        }

        /** 儲存平時評量 */
        $scope.saveGradeItemScore = function () {
            let logDescription = `課程：${$scope.current.Course.CourseName} 【平時評量】　\n`;
            var body = {
                Request: {
                    SCAttendExtension: []
                }
            };
            // 資料整理
            // log 資料整理
            logManangers = [];
            // 看使否有印過子項目(log用)
            [].concat($scope.studentList || []).forEach(function (stuRec, index) {


                // 學生
                var student = {
                    '@CourseID': $scope.current.Course.CourseID,
                    '@StudentID': stuRec.StudentID,
                    Extension: {
                        '@Name': 'GradeBook',
                        Exam: []
                    }
                };

                // 平時評量成績
                [].concat($scope.templateList || []).forEach(template => {
                    var exam = {
                        '@ExamID': template.ExamID,
                        '@Score': stuRec[`QuizResult_${template.ExamID}`] == undefined ? '' : stuRec[`QuizResult_${template.ExamID}`],
                        Item: []
                    };

                    // 小考成績
                    var targetItemList = $scope.gradeItemList.filter(item => item.Name !== '平時評量' && item.RefExamID == template.ExamID && item.Permission !== 'Program');

                    [].concat(targetItemList || []).forEach(item => {
                        var _item = {
                            '@SubExamID': item.SubExamID,
                            '@Score': stuRec[`Exam_${item.RefExamID}_Quiz_${item.SubExamID}`] == undefined ? '' : stuRec[`Exam_${item.RefExamID}_Quiz_${item.SubExamID}`]
                        }
                        /**log [平時評量] */
                        if (stuRec[`Exam_${item.RefExamID}_Quiz_${item.SubExamID}`] != stuRec[`Exam_${item.RefExamID}_Quiz_${item.SubExamID}Origin`]) {

                            if (logManangers.length == 0 || !(logManangers.find(x => { return x.key == `Exam_${item.RefExamID}_Quiz_${item.SubExamID}` }))) { //第一次

                                var logBySubItem = {
                                    key: `Exam_${item.RefExamID}_Quiz_${item.SubExamID}`,
                                    title: "",
                                    descriptSection: []

                                };
                                logBySubItem.title = `\n 輸入【${template.Name}】【${item.Name}】成績: \n`;
                                logBySubItem.descriptSection = [];
                                logManangers.push(logBySubItem);
                            }


                            var temp = logManangers.find(x => { return x.key == `Exam_${item.RefExamID}_Quiz_${item.SubExamID}` });
                            var descriptByItem = `　${stuRec.ClassName}班  ${stuRec.SeatNo}號  ${stuRec.StudentName}  , ${stuRec[`Exam_${item.RefExamID}_Quiz_${item.SubExamID}Origin`] || '  '} => ${stuRec[`Exam_${item.RefExamID}_Quiz_${item.SubExamID}`]} `;
                            temp.descriptSection.push(descriptByItem);
                        }
                        /**以上為log */
                        exam.Item.push(_item);
                    });

                    student.Extension.Exam.push(exam);
                });

                body.Request.SCAttendExtension.push(student);
            });


            //整理log 
            logManangers.forEach(x => {
                logDescription += x.title;
                logDescription += x.descriptSection.join('\n');
            });



            $scope.connection.send({
                service: "TeacherAccess.SetSCAttendExtensions",
                autoRetry: true,
                body: body,
                result: function (response, error, http) {
                    if (error) {
                        alert("TeacherAccess.SetSCAttendExtensions Error");
                    } else {
                        $scope.$apply(function () {
                            $scope.studentList.forEach(function (stuRec, index) {
                                // 原始資料更新
                                $scope.gradeItemList.forEach(function (item) {
                                    // 處理log 
                                    console.log('stuRec_', stuRec);

                                    stuRec[item.ExamID + 'Origin'] = stuRec[item.ExamID];
                                });
                            });
                        });

                        // 資料Reload
                        $scope.dataReload();

                        alert('儲存完成。');
                    }
                }
            });

            //紀錄log [自訂項目]
            $scope.connection2.send({
                service: "_.InsertLogFromWeb",
                body: `<Request>
                <ActionType>${'insert'}</ActionType>
                <Action>${'修改成績'}</Action>
                <TargetCategory>${'teacher'}</TargetCategory>
                <ActionBy>${'web:成績輸入'}</ActionBy>
                <Description>${logDescription}</Description>
            </Request>`,
                result: function (response, error, http) {
                    if (error !== null) {
                        alert("log發生錯誤[002]");
                    } else {
                        console.log('成功輸入!');
                    }
                }
            });
        }

        /**
        * 顯示編輯評分項目
        */
        $scope.showGradeItemConfig = function () {
            $scope.gradeItemConfig = {
                Item: []
                , OriginItem: []
                , Mode: 'Editor'
                , JSONCode: ''
                , DeleteItem: function (item) {
                    var index = $scope.gradeItemConfig.Item.indexOf(item);
                    if (index > -1) {
                        $scope.gradeItemConfig.Item.splice(index, 1);
                    }
                }
                , AddItem: function () {
                    $scope.gradeItemConfig.Item.push({
                        RefExamID: $scope.current.template.ExamID // 定期評量ID
                        , Name: ''
                        , Weight: '1'
                        , SubExamID: ''
                    });
                }
                , JSONMode: function () {
                    $scope.gradeItemConfig.Mode = 'JSON';
                    var jsonList = [];
                    $scope.gradeItemConfig.Item.forEach(function (item) {
                        /**
                         * 篩選目前定期評量 的平時評量項目
                         * 定期評量ID、平時評量ID不可給使用者調整
                         */
                        if ($scope.current.template.ExamID == item.RefExamID) {
                            jsonList.push({
                                RefExamID: item.RefExamID
                                , Name: item.Name
                                , Weight: item.Weight
                                , SubExamID: item.Name
                            });
                        }
                    });
                    $scope.gradeItemConfig.JSONCode = JSON.stringify(jsonList, null, '    ');
                }
                , CommitJSON: function () {
                    var jsonParse;
                    var jsonList = [];
                    try {
                        jsonParse = JSON.parse($scope.gradeItemConfig.JSONCode);
                    }
                    catch (error) {
                        alert('Syntax Error' + error);
                        return;
                    }
                    if (jsonParse.length || jsonParse.length === 0) {
                        jsonList = [].concat(jsonParse);
                    }
                    else {
                        alert('Parse Error');
                        return;
                    }
                    // 1. json parse 
                    $scope.gradeItemConfig.Item = [];
                    jsonList.forEach(function (item) {
                        $scope.gradeItemConfig.Item.push({
                            RefExamID: item.RefExamID
                            , Name: item.Name
                            , Weight: item.Weight
                            , SubExamID: item.SubExamID
                        });
                    });
                    // 2. 小考設定資料整理
                    var itemList = $scope.gradeItemList.filter(item =>
                        (item.RefExamID !== $scope.current.template.ExamID)
                        && (item.Permission == 'Editor'));
                    itemList.forEach(item => {
                        $scope.gradeItemConfig.Item.push(angular.copy(item));
                    });
                    $scope.gradeItemConfig.Mode = 'Editor';
                }, CheckConfig: function () {
                    var jsonCode = angular.toJson($scope.gradeItemConfig.Item);
                    var originJsonCode = angular.toJson($scope.gradeItemConfig.OriginItem);

                    return jsonCode === originJsonCode;
                }
            };

            // // 整理小考資料
            // [].concat($scope.gradeItemList || []).forEach(function (item) {
            //     $scope.gradeItemConfig.Item.push(angular.copy(item));
            //     $scope.gradeItemConfig.OriginItem.push(angular.copy(item));
            // });

            // 如果沒有評分項目的話，初始化。
            var item = {
                Index: '1',
                Name: '成績_1',
                SubExamID: '成績_1',
                Weight: '1'
            };

            // 篩選出目前定期評量的小考項目
            var targetGradeItem = $scope.gradeItemList.filter(item => item.Permission == 'Editor');
            [].concat(targetGradeItem || item).forEach(function (item) {
                $scope.gradeItemConfig.Item.push(angular.copy(item));
                $scope.gradeItemConfig.OriginItem.push(angular.copy(item));
            });
            $('#editScoreItemModal').modal('show');
        }

        /**
         * 儲存評分項目
         */
        $scope.saveGradeItemConfig = function () {
            var logDescription = "編輯後評分項目 : \n";
            var body = {
                Content: {
                    CourseExtension: {
                        '@CourseID': '' + $scope.current.Course.CourseID
                        , Extension: {
                            '@Name': 'GradeItem'
                            , GradeItem: {
                                Item: []
                            }
                        }
                    }
                }
            };

            var namePass = true;
            var weightPass = true;
            var subExamNameList = [];
            var subExamIDList = [];
            var dataRepeat = false;
            var repeatExamName = '';

            var subIDsRepeat = false;

            console.log("gradeItemConfig.Item", $scope.gradeItemConfig.Item);
            $scope.gradeItemConfig.Item.forEach(function (item) {

                var subNewID = item.Name;
                //var subNewID = item.Name + Date.now().toString();

                var pass = true;
                if (!item.Name) {
                    namePass = false;
                    pass = false;
                }
                if (!item.Weight || Number.isNaN(+item.Weight)) {
                    weightPass = false;
                    pass = false;
                }

                if (pass && !dataRepeat) {

                    // 再一個試別 Exam 下 小考試別不能重覆
                    if (subExamNameList.indexOf(item.RefExamID + '_' + item.Name) > -1) {
                        dataRepeat = true;
                        repeatExamName = item.Name;
                    }

                    //不允許 ID重複，若重複則加上時間
                    if (subExamIDList.indexOf(item.RefExamID + '_' + item.Name) > -1) {
                        subIDsRepeat = true;
                        subNewID = item.Name + Date.now().toString();
                    }

                    if ($scope.current.template.ExamID == item.RefExamID) {
                        logDescription += $scope.current.Course.CourseName + " : " + $scope.current.template.Name + ":" + item.Name + "\n";

                    }
                    body.Content.CourseExtension.Extension.GradeItem.Item.push({
                        '@ExamID': item.RefExamID,
                        // '@SubExamID': item.SubExamID == '' ? item.Name : item.SubExamID,
                        '@SubExamID': item.SubExamID == '' ? subNewID : item.SubExamID,
                        '@Name': item.Name,
                        '@Weight': item.Weight,
                        //'@Index': item.Index
                    });
                    subExamNameList.push(
                        item.RefExamID + '_' + item.Name
                    );
                    subExamIDList.push(
                        item.RefExamID + '_' + item.SubExamID
                    );
                }
            });
            if (namePass && weightPass && !dataRepeat) {
                $scope.connection.send({
                    service: "TeacherAccess.SetCourseExtensions",
                    autoRetry: true,
                    body: body,
                    result: function (response, error, http) {
                        if (error) {
                            alert("TeacherAccess.SetCourseExtensions Error");
                        } else {
                            $scope.$apply(function () {
                                // // 重新取得平時評量項目，並重新結算平時評量成績
                                $scope.getGradeItemList().then(value => {
                                    $scope.current.gradeItemList = [];
                                    // 篩選出目前定期的平時評量項目
                                    $scope.gradeItemList.forEach(item => {
                                        if (item.RefExamID == $scope.current.template.ExamID) {
                                            $scope.current.gradeItemList.push(item);

                                        }
                                    });

                                    // 重新計算評量成績
                                    $scope.$apply(function () {
                                        $scope.studentList.forEach(stuRec => {
                                            $scope.calcQuizResult(stuRec);
                                        });

                                        // 重整畫面
                                        $scope.reloadGradeItem();

                                    });
                                });

                                // 資料Reload
                                //   $scope.getGradeItemList();
                                // $scope.setCurrentMode($scope.current.mode);
                            });
                        }
                    }
                });
                // log [評分項目]
                $scope.connection2.send({
                    service: "_.InsertLogFromWeb",
                    body: `<Request>
                    <ActionType>${'insert'}</ActionType>
                    <Action>${'編輯評分項目'}</Action>
                    <TargetCategory>${'teacher'}</TargetCategory>
                    <ActionBy>${'web:成績輸入'}</ActionBy>
                    <Description>${logDescription}</Description>
                </Request>`,
                    result: function (response, error, http) {
                        if (error !== null) {
                            alert("log發生錯誤:[003]");
                        } else {
                            console.log('成功輸入!');
                        }
                    }
                });

            }
            else {
                var errMsg = '';
                if (!namePass) {
                    errMsg += (errMsg ? '\n' : '') + '評分名稱不可空白。';
                }
                if (!weightPass) {
                    errMsg += (errMsg ? '\n' : '') + '權重不可空白且必須為數值。';
                }
                if (dataRepeat) {
                    errMsg += (errMsg ? '\n' : '') + `評分項目名稱：「 ${repeatExamName}」重複! 資料無法儲存。`;
                }
                alert(errMsg);
            }
        }

        $scope.reloadGradeItem = function () {
            var execute = false;
            // 檢查資料是否更動
            var data_changed = !$scope.checkAllTable($scope.current.mode);
            if (data_changed) {

            } else {
                execute = true;
            }
            // if (execute) {
            $scope.current.template = $scope.current.template || $scope.templateList[0];
            $scope.current.gradeItemList = [];
            // 篩選出目前定期的平時評量項目
            $scope.gradeItemList.forEach(item => {
                if (item.RefExamID == $scope.current.template.ExamID) {
                    $scope.current.gradeItemList.push(item);
                }
            });

            // 定期評量改變後：目前學生不變、目前試別改變
            $scope.current.Exam = null;
            // 設定目前學生與目前試別
            $scope.setupCurrent();
            // 切換試別  要帶出不同的 功能
            $scope.getProcess();
            $('#editScoreItemModal').modal('hide');
            // }
        }


        $scope.isPrintCourseScore = function () {
            console.log('printCourseScore', $scope.printCourseScore);
        };
        $scope.isPrintTrialCalculation = function () {
            console.log('printTrialCalculation', $scope.printTrialCalculation);
        };

        $scope.openExportModal = function () {
            if ($scope.current.Exam.Name === '學期成績' && $scope.current.Exam.Lock) {
                $scope.printCourseScore = false;
                $scope.printTrialCalculation = true;
            }
            if ($scope.current.Exam.Name === '學期成績' && !$scope.current.Exam.Lock) {
                $scope.printCourseScore = true;
                $scope.printTrialCalculation = false;
            }
            console.log('openExportModal');
            $('#exportModal').modal('show');
        }
        $scope.closeExportModal = function () {
            console.log('closeExportModal');
            $('#exportModal').modal('hide');
        }
        /**匯出成績單 */
        $scope.exportGradeBook = function () {
            $('#exportModal').modal('hide');

            var data_changed = !$scope.checkAllTable($scope.current.mode);
            if (data_changed) {
                alert("資料尚未儲存，無法匯出報表。");
            } else {
                var trList = [];
                var thList1 = [];
                var thList2 = [];
                // 欄位資料整理
                thList1 = [
                    `<td rowspan='2' width='40px'>班級</td>`,
                    `<td rowspan='2' width='40px'>姓名</td>`,
                    `<td rowspan='2' width='70px'>學號</td>`,
                    //`<td rowspan='2' width='70px'>課程成績</td>`,
                    //`<td rowspan='2' width='70px'>課程成績_試算</td>`
                ];

                if ($scope.printCourseScore) {
                    thList1.push(`<td rowspan='2' width='70px'>課程成績</td>`);
                }

                if ($scope.printTrialCalculation) {
                    thList1.push(`<td rowspan='2' width='70px'>課程成績_試算</td>`);
                }
                [].concat($scope.templateList || []).forEach(template => {
                    if (template.Extension) {
                        if (template.Extension.Extension.UseText == '是') {
                            thList1.push(`<td colspan='2'>${template.Name}(${template.Percentage})</td>`);
                            thList2.push(`<td>定期<br/>評量</td>`);
                            thList2.push(`<td>文字<br/>評量</td>`);
                        } else {
                            thList1.push(`<td colspan='1'>${template.Name}(${template.Percentage})</td>`);
                            thList2.push(`<td>定期<br/>評量</td>`);
                        }
                    } else {
                        thList1.push(`<td colspan='1'>${template.Name}(${template.Percentage})</td>`);
                        thList2.push(`<td>定期<br/>評量</td>`);
                    }
                });

                trList.push(`<tr>${thList1.join('')}</tr>`);
                trList.push(`<tr>${thList2.join('')}</tr>`);


                // 學生資料整理
                [].concat($scope.studentList || []).forEach(student => {
                    var studentData = [
                        `<td>${student.ClassName}</td>`,
                        `<td>${student.StudentName}(${student.SeatNo})</td>`,
                        `<td class="text">${student.StudentNumber}</td>`,
                    ];
                    if ($scope.printCourseScore)
                        studentData.push(`<td>${student['Exam學期成績']}</td>`);
                    if ($scope.printTrialCalculation)
                        studentData.push(`<td>${student['Exam學期成績_試算']}</td>`);
                    [].concat($scope.templateList || []).forEach(template => {
                        if (template.Extension) {
                            if (template.Extension.Extension.UseText == '是') {
                                studentData.push(`<td>${student[`Exam${template.ExamID}`]}</td>`);
                                studentData.push(`<td>${student[`Exam${template.ExamID}_文字評量`]}</td>`);
                            } else {
                                studentData.push(`<td>${student[`Exam${template.ExamID}`]}</td>`);
                            }
                        } else {
                            studentData.push(`<td>${student[`Exam${template.ExamID}`]}</td>`);
                        }
                    });

                    trList.push(`<tr>${studentData.join('')}</tr>`);
                });

                var html = `
    <html>
        <head>
            <meta http-equiv=\'Content-Type\' content=\'text/html; charset=utf-8\'/>
            <style type="text/css">
            .text {
                mso-number-format:"\@"
            }
        </style>

        </head>
        <body>
            <table border='1' cellspacing='0' cellpadding='2'>
                <tbody align='center'>${$scope.current.Course.SchoolYear}學年度 第${$scope.current.Course.Semester}學期 ${$scope.current.Course.CourseName}
                        ${trList.join('')}
                </tbody>
            </table>
            <br/>教師簽名：
        </body>
    </html>`;

                saveAs(new Blob([html], { type: "application/octet-stream" }), $scope.current.Course.CourseName + '.xls');
            }
        }

        // -------- *

        // -- 匯出評量成績單 begin
        $scope.exportGradeBookA = function () {
            var data_changed = !$scope.checkAllTable($scope.current.mode);


            if (data_changed) {
                alert("資料尚未儲存，無法匯出報表。");
            } else {
                var trList = [];
                var thList1 = [];
                thList1 = [
                    `<td rowspan='1' width='40px'>班級</td>`,
                    `<td rowspan='1' width='40px'>姓名</td>`,
                    `<td rowspan='1' width='70px'>學號</td>`
                ];

                [].concat($scope.current.gradeItemList || []).forEach(template => {
                    if (template.Weight)
                        thList1.push(`<td>${template.Name}(${template.Weight})</td>`);
                    else
                        thList1.push(`<td>${template.Name}</td>`);
                });

                trList.push(`<tr>${thList1.join('')}</tr>`);

                // 學生資料整理
                [].concat($scope.studentList || []).forEach(student => {
                    var studentData = [
                        `<td>${student.ClassName}</td>`, `<td>${student.StudentName}(${student.SeatNo})</td>`,
                        `<td class="text">${student.StudentNumber}</td>`,
                    ];

                    [].concat($scope.current.gradeItemList || []).forEach(template => {

                        if (student[`${template.ExamID}`]) {
                            studentData.push(`<td>${student[`${template.ExamID}`]}</td>`);
                        } else {
                            studentData.push(`<td></td>`);
                        }
                    });

                    trList.push(`<tr>${studentData.join('')}</tr>`);
                });



                var html = `
            <html>
                <head>
                    <meta http-equiv=\'Content-Type\' content=\'text/html; charset=utf-8\'/>
                    <style type="text/css">
                    .text {
                        mso-number-format:"\@"
                    }
                </style>
                </head>
                <body>
                    <table border='1' cellspacing='0' cellpadding='2'>
                        <tbody align='center'>${$scope.current.Course.SchoolYear}學年度 第${$scope.current.Course.Semester}學期 ${$scope.current.Course.CourseName}
                                ${trList.join('')}
                        </tbody>
                    </table>
                    <br/>教師簽名：
                </body>
            </html>`;

                saveAs(new Blob([html], { type: "application/octet-stream" }), $scope.current.Course.CourseName + '.xls');
            }
        }
        // -- 匯出評量成績單 end

        $scope.changeSelectMode = function (mode) {
            $scope.current.SelectMode = mode;
            $timeout(function () {
                $('.pg-seatno-textbox:visible').select().focus();
            }, 1);
        }

        $scope.submitStudentNo = function (event) {
            if (event && (event.keyCode !== 13 || $scope.isMobile)) return; // 13是enter按鈕的代碼，return是跳出
            if (!$scope.current.Student) return;
            $('.pg-grade-textbox:visible').focus();
            $timeout(function () {
                $('.pg-grade-textbox:visible').select();
            }, 1);
        }

        $scope.typeStudentNo = function () {
            var currentIndex = $scope.current.Student ? $scope.current.Student.index : 0;

            var nextStudent = null;
            var nextStudent2 = null;
            angular.forEach($scope.studentList, function (item, index) {
                if (item.SeatNo == $scope.current.SelectSeatNo) {
                    if (index > currentIndex) {
                        if (nextStudent2 == null) {
                            nextStudent2 = item;
                        }
                    }
                    else {
                        if (nextStudent == null) {
                            nextStudent = item;
                        }
                    }
                }
            });
            $scope.setCurrent(nextStudent2 || nextStudent, $scope.current.Exam, false, false);
            $('.pg-seatno-textbox:visible').focus();
        }

        $scope.goPrev = function () {
            var currentIndex = $scope.current.Student ? $scope.current.Student.index : 0;
            $scope.setCurrent(
                (currentIndex == 0) ?
                    $scope.studentList[$scope.studentList.length - 1] :
                    $scope.studentList[currentIndex - 1]
                , $scope.current.Exam
                , true
                , true);
            $('.pg-grade-textbox:visible').focus();
            $timeout(function () {
                $('.pg-grade-textbox:visible').select();
            }, 1);
        }

        $scope.goNext = function () {
            var currentIndex = $scope.current.Student ? $scope.current.Student.index : 0;
            $scope.setCurrent(
                (currentIndex == $scope.studentList.length - 1) ?
                    $scope.studentList[0] :
                    $scope.studentList[currentIndex + 1]
                , $scope.current.Exam
                , true
                , true);
            $('.pg-grade-textbox:visible').focus();
            $timeout(function () {
                $('.pg-grade-textbox:visible').select();
            }, 1);
        }

        gadget.onLeave(function () {
            var data_changed = !$scope.checkAllTable($scope.current.mode);

            if (data_changed) {
                return "尚未儲存資料，現在離開視窗將不會儲存本次更動";
            }
            else {
                return "";
            }
        });

        $scope.selectValue = function (val) {
            $scope.current.Value = val;
            $scope.submitGrade();
        }

        $scope.filterPermission = function (examItem) {
            return (examItem.Permission == "Read" || examItem.Permission == "Editor")
                && ($scope.current.VisibleExam
                    && $scope.current.VisibleExam.indexOf(examItem.Name) >= 0);
        }

        $scope.getProcess = function () {
            if ($scope.examList && $scope.examList.length > 0 && $scope.examList[0].ExamID == '學期成績') {
                var process = [
                    {
                        Name: '課程成績',
                        Type: 'Header'
                    },
                    {
                        Name: '代入試算成績->課程成績',
                        Type: 'Function',
                        Fn: function () {
                            [].concat($scope.studentList || []).forEach(function (studentRec, index) {
                                studentRec['Exam學期成績'] = studentRec['Exam學期成績_試算'];
                            });
                            alert('課程成績已代入');
                        },
                        Disabled: $scope.examList[0].Lock
                    }
                ];

                // 小考匯入清單
                $scope.importGradeItemList = [];

                // 匯入 (評量)
                var importProcesses = [];
                [].concat($scope.examList).forEach(function (examRec, index) {
                    if (examRec.Type == 'Number' && examRec.Permission == "Editor") {
                        var importProcess = {
                            Name: '匯入' + (examRec.Name === '學期成績' ? '課程成績' : examRec.Name),
                            Type: 'Function',
                            Fn: function () {
                                delete importProcess.ParseString;
                                delete importProcess.ParseValues;
                                $scope.importProcess = importProcess;
                                $('#importModal').modal('show');
                            },
                            Parse: function () {

                                importProcess.ParseString = importProcess.ParseString || '';
                                importProcess.ParseValues = importProcess.ParseString.split("\n");
                                importProcess.HasError = false;
                                for (var i = 0; i < importProcess.ParseValues.length; i++) {
                                    var flag = false;
                                    var temp = Number(importProcess.ParseValues[i]);
                                    if (!isNaN(temp) && temp <= 100 && temp >= 0 && importProcess.ParseValues[i] != '') {
                                        flag = true;
                                        // if (!$scope.current.Exam.Group) {
                                        //     var round = Math.pow(10, $scope.params[$scope.current.Exam.Name + 'Round'] || $scope.params.DefaultRound);
                                        //     temp = Math.round(temp * round) / round;
                                        // }
                                    }
                                    if (importProcess.ParseValues[i] == "-") {
                                        flag = true;
                                        importProcess.ParseValues[i] = '';
                                    }
                                    // else if (importProcess.ParseValues[i] == "缺") {
                                    //     // importProcess.ParseValues[i] = -1;
                                    //     flag = true;
                                    // }

                                    if (examRec.Name !== '學期成績')
                                        $scope.examExtensionMap.forEach(function (map) {
                                            if (map.use_text == importProcess.ParseValues[i]) {
                                                flag = true;
                                            }
                                        });


                                    if (flag) {
                                        if (!isNaN(temp) && importProcess.ParseValues[i] != "")
                                            importProcess.ParseValues[i] = temp;
                                        else if (importProcess.ParseValues[i] == "-")
                                            importProcess.ParseValues[i] = '';
                                    }
                                    else {

                                        importProcess.HasError = true;
                                        if (temp > 100 || temp < 0)
                                            importProcess.ParseValues[i] = '超過';
                                        else
                                            importProcess.ParseValues[i] = '錯誤';
                                    }
                                }

                                $scope.studentList.forEach(function (stuRec, index) {
                                    if (index >= importProcess.ParseValues.length) {
                                        importProcess.ParseValues.push('錯誤');
                                        importProcess.HasError = true;
                                    }
                                });

                            },
                            Clear: function () {
                                delete importProcess.ParseValues;
                            },
                            Import: function () {
                                if (importProcess.HasError == true)
                                    return;
                                $scope.studentList.forEach(function (stuRec, index) {
                                    if (!importProcess.ParseValues[index] && importProcess.ParseValues[index] !== 0) {
                                        stuRec['Exam' + examRec.ExamID] = '';
                                        // } else if (importProcess.ParseValues[index] == '缺') {
                                        //     stuRec['Exam' + examRec.ExamID] = '缺';
                                    }
                                    else {
                                        stuRec['Exam' + examRec.ExamID] = importProcess.ParseValues[index];

                                        if (examRec.Name !== '學期成績')
                                            $scope.examExtensionMap.forEach(function (map) {
                                                if (map.use_text == importProcess.ParseValues[index]) {
                                                    stuRec['Exam' + examRec.ExamID + 'score_type'] = map.score_type;
                                                }
                                            });

                                        if (examRec.Group) {
                                            // stuRec['Exam' + examRec.Group.ExamID] = stuRec['Exam' + examRec.Group.ExamID + 'CScore'] * 1 + stuRec['Exam' + examRec.Group.ExamID + 'PScore'] * 1;
                                            stuRec['Exam' + examRec.Group.ExamID] = add(+stuRec['Exam' + examRec.Group.ExamID + 'CScore'], +stuRec['Exam' + examRec.Group.ExamID + 'PScore']);
                                        }
                                    }
                                });
                                $scope.calc();
                                $('#importModal').modal('hide');
                            },
                            Disabled: examRec.Lock
                        };

                        importProcesses.push(importProcess);
                    }
                    if (examRec.Type == 'Number' && examRec.Permission == 'Read') {

                    }
                });
                if (importProcesses.length > 0) {
                    process = process.concat({
                        Name: '匯入',
                        Type: 'Header'
                    }).concat(importProcesses);
                }

                // 整理小考匯入清單
                {
                    var targetGradeItemList = $scope.current.gradeItemList.filter(item => item.Permission !== 'Program');

                    [].concat(targetGradeItemList || []).forEach(item => {
                        var importProcess = {
                            Name: '匯入_' + item.Name,
                            Type: 'Function',
                            Fn: function () {
                                delete importProcess.ParseString;
                                delete importProcess.ParseValues;
                                $scope.importProcess = importProcess;
                                $('#importModal').modal('show');
                            },
                            Parse: function () {

                                importProcess.ParseString = importProcess.ParseString || '';
                                importProcess.ParseValues = importProcess.ParseString.split("\n");
                                importProcess.HasError = false;
                                for (var i = 0; i < importProcess.ParseValues.length; i++) {
                                    var flag = false;
                                    var temp = Number(importProcess.ParseValues[i]);
                                    if (!isNaN(temp) && temp <= 100 && temp >= 0 && importProcess.ParseValues[i] != '') {
                                        flag = true;



                                        // if (!$scope.current.Exam.Group) {
                                        //    var round = Math.pow(10, $scope.params[$scope.current.Exam.Name + 'Round'] || $scope.params.DefaultRound);
                                        //    temp = Math.round(temp * round) / round;
                                        // }
                                        var round = Math.pow(10, $scope.params[$scope.current.Exam.Name + 'Round'] || $scope.params.DefaultRound);
                                        temp = Math.round(temp * round) / round;
                                    }
                                    // 使用者若知道其學生沒有資料，請在其欄位內輸入 - ，程式碼會將其填尚緯空值 
                                    if (importProcess.ParseValues[i] == '-') {
                                        flag = true;
                                        importProcess.ParseValues[i] = '';
                                    }
                                    // if (importProcess.ParseValues[i] == '缺') {
                                    //     flag = true;
                                    // }
                                    $scope.examExtensionMap.forEach(function (map) {
                                        if (map.use_text == importProcess.ParseValues[i]) {
                                            flag = true;
                                        }
                                    });

                                    if (flag) {
                                        if (!isNaN(temp) && importProcess.ParseValues[i] != '') {
                                            importProcess.ParseValues[i] = temp;
                                        }
                                    }
                                    else {
                                        importProcess.HasError = true;
                                        if (temp > 100 || temp < 0)
                                            importProcess.ParseValues[i] = '超過';
                                        else
                                            importProcess.ParseValues[i] = '錯誤';
                                    }
                                }
                                $scope.studentList.forEach(function (stuRec, index) {
                                    if (index >= importProcess.ParseValues.length) {
                                        importProcess.ParseValues.push('錯誤');
                                        importProcess.HasError = true;
                                    }
                                });
                            },
                            Clear: function () {
                                delete importProcess.ParseValues;
                            },
                            Import: function () {
                                if (importProcess.HasError == true) {
                                    return;
                                }
                                $scope.studentList.forEach(function (stuRec, index) {
                                    if (!importProcess.ParseValues[index] && importProcess.ParseValues[index] !== 0) {
                                        stuRec[item.ExamID] = '';
                                    }
                                    else {
                                        stuRec[item.ExamID] = importProcess.ParseValues[index];

                                        $scope.examExtensionMap.forEach(function (map) {
                                            if (map.use_text == importProcess.ParseValues[index]) {
                                                stuRec[item.ExamID + 'score_type'] = map.score_type;
                                            }
                                        });
                                    }
                                });

                                $scope.studentList.forEach(student => {
                                    $scope.calcQuizResult(student);
                                });

                                $('#importModal').modal('hide');
                            },
                            Disabled: item.Lock
                        };

                        $scope.importGradeItemList.push(importProcess);
                    });
                }

                // 成績管理模式  可以帶入平時成績
                if ($scope.current.mode == '成績管理') {
                    // 帶入平時成績
                    var importAssessmentScoreProcesses = [];

                    [].concat($scope.examList).forEach(function (examRec, index) {
                        // 定期評量 帶入小考成績
                        if (examRec.Type == 'Number' && examRec.Permission == 'Editor' && examRec.Name !== '學期成績' && examRec.SubName != '試卷') {
                            var importProcess = {
                                Name: '帶入' + examRec.Name + '平時成績',
                                Type: 'Function',
                                ExamID: examRec.ExamID,
                                Fn: function () {
                                    $scope.studentList.forEach(function (stuRec) {
                                        stuRec['Exam' + examRec.ExamID] = stuRec['QuizResult_' + examRec.ExamID]
                                        stuRec['Exam' + examRec.ExamID + 'score_type'] = '';
                                    });
                                },
                                Disabled: examRec.Lock
                            };

                            importAssessmentScoreProcesses.push(importProcess);
                        }
                        // 定期評量試卷 帶入小考成績
                        if (examRec.Type == 'Number' && examRec.Permission == 'Editor' && examRec.SubName == '試卷') {
                            var importProcess = {
                                Name: '帶入' + examRec.Name + '平時成績',
                                Type: 'Function',
                                ExamID: examRec.ExamID,
                                Fn: function () {
                                    $scope.studentList.forEach(function (stuRec) {
                                        var cs = stuRec['Exam' + examRec.Group.ExamID + 'CScore'];
                                        var ps = stuRec['Exam' + examRec.Group.ExamID + 'PScore'];
                                        // var score = (ps == '' && cs == '') ? '' : ps * 1 + cs * 1;
                                        var score = (ps === '' && cs === '') ? '' : add(+ps, +cs);
                                        // 更新試卷成績：試卷成績 = 小考結算成績
                                        stuRec['Exam' + examRec.ExamID] = stuRec['QuizResult_' + examRec.Group.ExamID];
                                        // 更新定期評量成績：定期評量成績 = 讀卡 + 試卷
                                        stuRec['Exam' + examRec.Group.ExamID] = score;

                                    });
                                },
                                Disabled: examRec.Lock
                            };

                            importAssessmentScoreProcesses.push(importProcess);
                        }
                    });

                    process = process.concat({
                        Name: '帶入平時成績',
                        Type: 'Header'
                    }).concat(importAssessmentScoreProcesses);

                }

                $scope.process = process;

            }
            else {
                $scope.process = [];
            }
        }

        $scope.checkAllTable = function (target) {
            var pass = true;
            var targetExamList = [];

            if (target == '成績管理') {
                targetExamList = $scope.examList;
            } else if (target == '平時評量') {
                targetExamList = $scope.gradeItemList;
            }

            [].concat(targetExamList || []).forEach(exam => {
                if (pass) {
                    [].concat($scope.studentList || []).forEach(function (stuRec) {
                        // 成績管理 的驗證
                        if (pass && target == '成績管理') {
                            pass = !!$scope.checkOneCell(stuRec, 'Exam' + exam.ExamID);
                        }

                        // 平時評量 的驗證
                        if (pass && target == '平時評量') {
                            pass = !!$scope.checkOneCell(stuRec, exam.ExamID);
                        }
                    });
                }
            });
            return pass;
        }

        $scope.checkOneCell = function (studentRec, examKey) {
            var pass = true;
            pass = (studentRec[examKey] === studentRec[examKey + 'Origin']) || (studentRec[examKey + 'Origin'] === undefined) || (examKey == "Exam學期成績_試算");
            return pass;
        }

        $scope.openCopyModal = function () {
            $scope.CourseExamList = [];
            $scope.CanSelectCourseExamList = [];
            var currItemName = $scope.current.Course.CourseName + ":" + $scope.current.template.Name;
            var idx = 1;

            // 取得教師所屬所有課程的小考
            const coArray = $scope.courseList.map(course => {
                // 非 ESL 課程才可以複製
                if (typeof (course) != "undefined") {
                    if (typeof (course.Scores) != "undefined") {
                        if (course.Scores.HasDescription === 'f') {
                            return getCourseExam2020(course);
                        }
                    }
                }
            });

            Promise.all(coArray).then(val => {
                $scope.$apply(function () {
                    val.forEach(function (courseRec) {
                        if (typeof (courseRec) != "undefined") {
                            if (typeof (courseRec.Scores) != "undefined")
                                if (typeof (courseRec.Scores.Score) != "undefined") {
                                    // 處理當只有一筆資料  [].concat
                                    [].concat(courseRec.Scores.Score).forEach(function (scs) {
                                        //       console.log(scs.Name);
                                        var itemName = courseRec.CourseName + ":" + scs.Name;

                                        // 取得相對小考
                                        var subItemList = [];
                                        courseRec.ItemList.forEach(function (subItem) {
                                            if (subItem.RefExamID === scs.ExamID) {
                                                subItemList.push(subItem);
                                            }
                                        });

                                        var itemDisable = false;
                                        // 檢查如果有設評分項目就無法勾選
                                        if (subItemList.length > 0) {
                                            itemDisable = true;
                                        }


                                        var item = {
                                            id: idx,
                                            CourseID: courseRec.CourseID,
                                            CourseName: courseRec.CourseName,
                                            Name: itemName,
                                            ExamID: scs.ExamID,
                                            ExamName: scs.Name,
                                            SubItemLst: subItemList,
                                            Selected: false,
                                            ItemDisable: itemDisable
                                        }
                                        if (currItemName !== itemName) {
                                            $scope.CanSelectCourseExamList.push(item);
                                        }

                                        $scope.CourseExamList.push(item);
                                        idx = idx + 1;

                                    });
                                }
                        }
                    });
                    $('#copyModal').modal('show');
                });
            });
        }

        $scope.closeCopyModal = function () {
            $scope.CanSelectCourseExamList.forEach(function (course) {
                course.Selected = false;
            });
            $('#copyModal').modal('hide');
        }

        saveGradeItem = function (body) {
            return new Promise((r, j) => {
                $scope.connection.send({
                    service: "TeacherAccess.SetCourseExtensions",
                    autoRetry: true,
                    body: body,
                    result: function (response, error, http) {
                        if (error) {
                            alert("TeacherAccess.SetCourseExtensions Error");
                            j(false);
                        } else {
                            r(true);
                        }
                    }
                });
            });
        }

        // 取得評量小考設定
        getCourseExam2020 = function (course) {
            return new Promise((r, j) => {
                $scope.connection.send({
                    service: "TeacherAccess.GetCourseExtensions",
                    autoRetry: true,
                    body: {
                        Content: {
                            ExtensionCondition: {
                                '@CourseID': '' + course.CourseID,
                                Name: ['GradeItemExtension', 'GradeItem']
                            }
                        }
                    },
                    result: function (response, error, http) {
                        var ItemList = [];
                        if (error) {
                            alert("TeacherAccess.GetCourseExtensions Error");
                            j(false);
                        } else {
                            [].concat(response.Response.CourseExtension.Extension || []).forEach(function (extensionRec) {


                                // 平時評量項目 gradeItemList
                                if (extensionRec.Name == 'GradeItem') {
                                    // 檢查課程是否有設定小考試別
                                    if (extensionRec.GradeItem) {
                                        [].concat(extensionRec.GradeItem.Item || []).forEach((item) => {
                                            var targetExam = $scope.examList.find(exam => exam.ExamID == item.ExamID);
                                            var gradeItem = {
                                                RefExamID: item.ExamID, // 定期評量編號
                                                ExamID: `Exam_${item.ExamID}_Quiz_${item.SubExamID}`,
                                                SubExamID: item.SubExamID, // 平時評量編號
                                                Name: item.Name,
                                                Index: item.Index,
                                                Weight: item.Weight,
                                                Type: 'Number',
                                                Permission: 'Editor',
                                                Lock: targetExam ? targetExam.Lock : false,
                                                SubVisible: true
                                            };

                                            ItemList.push(gradeItem);
                                        });
                                    }
                                }

                            });

                            var value = {
                                CourseID: course.CourseID,
                                CourseName: course.CourseName,
                                Scores: course.Scores,
                                ItemList: ItemList
                            }
                            r(value);
                        }
                    }
                });
            });
        }


        $scope.copyGradeItemConfig = function () {
            var selectedCourseExam = [];

            // 取得勾選課程試別
            [].concat($scope.CanSelectCourseExamList || []).forEach(function (course) {
                if (course.Selected) {
                    selectedCourseExam.push(course);
                }
            });

            var SendData = [];

            // 整理 select 
            var selectedCourseID = [];
            var selectedCourse = [];
            selectedCourseExam.forEach(function (course) {
                if (!selectedCourseID.includes(course.CourseID)) {
                    selectedCourseID.push(course.CourseID);
                    selectedCourse.push(course);
                }
            });

            selectedCourse.forEach(function (course) {
                // 資料整理
                var body = {
                    Content: {
                        CourseExtension: {
                            '@CourseID': course.CourseID
                            , Extension: {
                                '@Name': 'GradeItem'
                                , GradeItem: {
                                    Item: []
                                }
                            }
                        }
                    }
                };

                // 複製到所選新的
                selectedCourseExam.forEach(function (selCourse) {
                    if (selCourse.CourseID === course.CourseID) {
                        $scope.current.gradeItemList.forEach(function (item) {
                            if (item.SubExamID) {
                                body.Content.CourseExtension.Extension.GradeItem.Item.push({
                                    '@ExamID': selCourse.ExamID,
                                    '@SubExamID': item.Name,
                                    '@Name': item.Name,
                                    '@Weight': item.Weight
                                });
                            }
                        });
                    }
                });

                // 將原本課程有的其他評量小考項目再放填入回存
                $scope.CourseExamList.forEach(function (source) {
                    if (source.CourseID === course.CourseID && source.ExamID !== course.ExamID) {
                        // 原本就有小考項目
                        if (source.SubItemLst.length > 0) {
                            source.SubItemLst.forEach(function (item) {
                                body.Content.CourseExtension.Extension.GradeItem.Item.push({
                                    '@ExamID': item.RefExamID,
                                    '@SubExamID': item.SubExamID,
                                    '@Name': item.Name,
                                    '@Weight': item.Weight
                                });
                            });
                        }
                    }
                });

                //console.log(body);
                SendData.push(body);
                //  saveGradeItem(body).then();
            });

            const sdArray = SendData.map(data => {
                return saveGradeItem(data);
            });

            Promise.all(sdArray).then(val => {
                // console.log(val);

                $scope.$apply(function () {
                    // // 重新取得平時評量項目
                    $scope.getGradeItemList().then(value => {
                        $scope.current.gradeItemList = [];
                        // 篩選出目前定期的平時評量項目
                        $scope.gradeItemList.forEach(item => {
                            if (item.RefExamID == $scope.current.template.ExamID) {
                                $scope.current.gradeItemList.push(item);
                            }
                        });
                    });

                    $scope.closeCopyModal();
                    if (selectedCourseExam.length > 0) {
                        $('#saveSuccessModal').modal('show');
                    }
                });
            });

        }

        // 篩選評分項目 - 編輯評分項目
        $scope.filterGradeItem = function (item) {
            if ($scope.current.template) {
                return $scope.current.template.ExamID == item.RefExamID
            }
        }

        /**
        * 計算平時評量
        */
        $scope.calcQuizResult = function (student) {

            var totalWeight = 0;
            var totalWeightScore = 0;
            $scope.current.gradeItemList.forEach(item => {
                if (student[item.ExamID] || ('' + student[item.ExamID]) == '0') {

                    var score = Number(student[item.ExamID]);
                    var weight = Number(item.Weight);

                    $scope.examExtensionMap.forEach(function (map) {
                        if (map.use_text == student[item.ExamID]) {
                            if (map.score_type == '0分')
                                score = 0;
                        }
                    });

                    if (!isNaN(score) && !isNaN(weight)) {
                        //處理javascript精度問題
                        score = score * 100000;
                        weight = weight * 100000;
                        totalWeightScore += score * weight;
                        totalWeight += weight;
                    }
                }
            });
            if (totalWeight) {
                /**
                 * 計算平時評量分數
                 * 透過round function執行四捨五入取小數第二位
                 */
                student['QuizResult_' + $scope.current.template.ExamID] = rounding((totalWeightScore / totalWeight / 100000), 2);
            } else {
                student['QuizResult_' + $scope.current.template.ExamID] = '';
            }
        }

        /**儲存 試算成績未輸入以0分計算設定 SetSetting*/
        $scope.isNullAsZero = function () {
            $scope.isNullAsZeroChecked = !$scope.isNullAsZeroChecked;
            if ($scope.isNullAsZeroChecked) {
                console.log('勾選了，沒有輸入成績視為0分。', $scope.isNullAsZeroChecked);
            } else {
                console.log('未勾選，沒有輸入成績忽略比例。', $scope.isNullAsZeroChecked);
            }

            //試算需要重新跑一次
            $scope.setCurrentCourse($scope.current.Course)

            new Promise((r, j) => {
                $scope.connection3.send({
                    service: "_.SetSetting",
                    autoRetry: true,
                    body: { IsNullAsZero: $scope.isNullAsZeroChecked },
                    result: function (response, error, http) {

                        if (error) {
                            alert("1campus.h.gradebook.teacher._.SetSetting Error");
                            j(false);
                        } else {
                            r(true);
                        }
                    }
                });
            });
        };
    }
    ])
    .provider('$affix', function () {

        var defaults = this.defaults = {
            offsetTop: 'auto'
        };

        this.$get = function ($window, debounce, dimensions) {

            var bodyEl = angular.element($window.document.body);
            var windowEl = angular.element($window);

            function AffixFactory(element, config) {

                var $affix = {};

                // Common vars
                var options = angular.extend({}, defaults, config);
                var targetEl = options.target;

                // Initial private vars
                var reset = 'affix affix-top affix-bottom',
                    initialAffixTop = 0,
                    initialOffsetTop = 0,
                    offsetTop = 0,
                    offsetBottom = 0,
                    affixed = null,
                    unpin = null;

                var parent = element.parent();
                // Options: custom parent
                if (options.offsetParent) {
                    if (options.offsetParent.match(/^\d+$/)) {
                        for (var i = 0; i < (options.offsetParent * 1) - 1; i++) {
                            parent = parent.parent();
                        }
                    }
                    else {
                        parent = angular.element(options.offsetParent);
                    }
                }

                $affix.init = function () {

                    $affix.$parseOffsets();
                    initialOffsetTop = dimensions.offset(element[0]).top + initialAffixTop;

                    // Bind events
                    targetEl.on('scroll', $affix.checkPosition);
                    targetEl.on('click', $affix.checkPositionWithEventLoop);
                    windowEl.on('resize', $affix.$debouncedOnResize);

                    // Both of these checkPosition() calls are necessary for the case where
                    // the user hits refresh after scrolling to the bottom of the page.
                    $affix.checkPosition();
                    $affix.checkPositionWithEventLoop();

                };

                $affix.destroy = function () {

                    // Unbind events
                    targetEl.off('scroll', $affix.checkPosition);
                    targetEl.off('click', $affix.checkPositionWithEventLoop);
                    windowEl.off('resize', $affix.$debouncedOnResize);

                };

                $affix.checkPositionWithEventLoop = function () {

                    setTimeout($affix.checkPosition, 1);

                };

                $affix.checkPosition = function () {
                    // if (!this.$element.is(':visible')) return

                    var scrollTop = getScrollTop();
                    var position = dimensions.offset(element[0]);
                    var elementHeight = dimensions.height(element[0]);

                    // Get required affix class according to position
                    var affix = getRequiredAffixClass(unpin, position, elementHeight);

                    // Did affix status changed this last check?
                    if (affixed === affix) return;
                    affixed = affix;

                    // Add proper affix class
                    element.removeClass(reset).addClass('affix' + ((affix !== 'middle') ? '-' + affix : ''));

                    if (affix === 'top') {
                        unpin = null;
                        element.css('position', (options.offsetParent) ? '' : 'relative');
                        element.css('top', '');
                    } else if (affix === 'bottom') {
                        if (options.offsetUnpin) {
                            unpin = -(options.offsetUnpin * 1);
                        }
                        else {
                            // Calculate unpin threshold when affixed to bottom.
                            // Hopefully the browser scrolls pixel by pixel.
                            unpin = position.top - scrollTop;
                        }
                        element.css('position', (options.offsetParent) ? '' : 'relative');
                        element.css('top', (options.offsetParent) ? '' : ((bodyEl[0].offsetHeight - offsetBottom - elementHeight - initialOffsetTop) + 'px'));
                    } else { // affix === 'middle'
                        unpin = null;
                        element.css('position', 'fixed');
                        element.css('top', initialAffixTop + 'px');
                    }

                };

                $affix.$onResize = function () {
                    $affix.$parseOffsets();
                    $affix.checkPosition();
                };
                $affix.$debouncedOnResize = debounce($affix.$onResize, 50);

                $affix.$parseOffsets = function () {

                    // Reset position to calculate correct offsetTop
                    element.css('position', (options.offsetParent) ? '' : 'relative');

                    if (options.offsetTop) {
                        if (options.offsetTop === 'auto') {
                            options.offsetTop = '+0';
                        }
                        if (options.offsetTop.match(/^[-+]\d+$/)) {
                            initialAffixTop = -options.offsetTop * 1;
                            if (options.offsetParent) {
                                offsetTop = dimensions.offset(parent[0]).top + (options.offsetTop * 1);
                            }
                            else {
                                offsetTop = dimensions.offset(element[0]).top - dimensions.css(element[0], 'marginTop', true) + (options.offsetTop * 1);
                            }
                        }
                        else {
                            offsetTop = options.offsetTop * 1;
                        }
                    }

                    if (options.offsetBottom) {
                        if (options.offsetParent && options.offsetBottom.match(/^[-+]\d+$/)) {
                            // add 1 pixel due to rounding problems...
                            offsetBottom = getScrollHeight() - (dimensions.offset(parent[0]).top + dimensions.height(parent[0])) + (options.offsetBottom * 1) + 1;
                        }
                        else {
                            offsetBottom = options.offsetBottom * 1;
                        }
                    }

                };

                // Private methods

                function getRequiredAffixClass(unpin, position, elementHeight) {

                    var scrollTop = getScrollTop();
                    var scrollHeight = getScrollHeight();

                    if (scrollTop <= offsetTop) {
                        return 'top';
                    } else if (unpin !== null && (scrollTop + unpin <= position.top)) {
                        return 'middle';
                    } else if (offsetBottom !== null && (position.top + elementHeight + initialAffixTop >= scrollHeight - offsetBottom)) {
                        return 'bottom';
                    } else {
                        return 'middle';
                    }

                }

                function getScrollTop() {
                    return targetEl[0] === $window ? $window.pageYOffset : targetEl[0].scrollTop;
                }

                function getScrollHeight() {
                    return targetEl[0] === $window ? $window.document.body.scrollHeight : targetEl[0].scrollHeight;
                }

                $affix.init();
                return $affix;

            }

            return AffixFactory;

        };

    })
    .directive('bsAffix', function ($affix, $window) {
        return {
            restrict: 'EAC',
            require: '^?bsAffixTarget',
            link: function postLink(scope, element, attr, affixTarget) {

                var options = { scope: scope, offsetTop: 'auto', target: affixTarget ? affixTarget.$element : angular.element($window) };
                angular.forEach(['offsetTop', 'offsetBottom', 'offsetParent', 'offsetUnpin'], function (key) {
                    if (angular.isDefined(attr[key])) options[key] = attr[key];
                });

                var affix = $affix(element, options);
                scope.$on('$destroy', function () {
                    affix && affix.destroy();
                    options = null;
                    affix = null;
                });

            }
        };

    })
    .directive('bsAffixTarget', function () {
        return {
            controller: function ($element) {
                this.$element = $element;
            }
        };
    })
    .directive('selectOnClick', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('click', function () {
                    this.select();
                });
            }
        };
    });
