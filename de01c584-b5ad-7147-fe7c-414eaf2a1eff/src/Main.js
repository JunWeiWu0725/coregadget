import React, { useState, useEffect } from 'react';
import './App.css';
import { Link } from 'react-router-dom';
import down from './down.png';
import up from './up.png';
import ScrollToTopButton from './ScrollToTopButton';
import { useAppContext } from './AppContext';

function Main() {

  const { appData, setAppDataValues } = useAppContext();

  // 學生清單
  const [studentDateRange, setStudentList] = useState([]);

  //選擇的學生 //localStorage
  const [studentID, setStudent] = useState(appData.studentID);

  // 該學生的所有課程學年期
  const [courseSemesterRange, setCourseSemesterList] = useState([]);

  // 該學生的指定學年期的評量清單
  const [courseExamList, setCourseExamList] = useState([]);

  //系統學年期 
  const [currSemester, setCurrSemester] = useState("");

  //當前顯示學年期 
  const [selectedSemester, setViewSemester] = useState(appData.semester);

  //當前顯示評量ID 
  const [selectedExam, setViewExam] = useState(appData.examID);

  //當前顯示 科目成績 or 領域成績 
  const [selectedSubjectType, setSubjectType] = useState(Number(appData.selectedSubjectType));

  //當前顯示 定期&平時 or 定期+平時 
  //const [selectedScoreType, setScoreType] = useState(0);

  //當前顯示排名類別 
  const [selectedRankType, setViewRankType] = useState(appData.rankType);

  // 該學生的指定學年期、指定評量 之排名類別
  //const [examRankType, setRankType] = useState([]);

  // 該校設定要顯示加權平均"分數"還是算術平均"分數" (desktop設定需要同時更新才可生效)
  // 處理如果兩個都是false，則設為加權平均。
  const [avgSetting, setAvgSetting] = useState('加權平均');

  // 該校設定 不顯示排名(true:不顯示，false:顯示) 
  // 國中一律不顯示排名
  const [showNoRankSetting, setShowNoRankSetting] = useState(true);

  //取得 及格標準分數 --- 國中一律為60
  const [avgPassingStardard, setAvgPassingStardard] = useState(60);

  // 該學生的指定學年期、每次評量 之加權平均&算術平均
  //const [examAvgList, setExamAvgList] = useState([]);


  // 計算該次評量的不及格科目數
  //const [failedCount, setFailedCount] = useState(0);


  //******************* */
  // 該學生的指定學年期的課程 科目成績
  const [courseSubjectExamScore, setCourseSubjectExamScore] = useState([]);

  // 該學生的指定學年期的課程 領域成績
  const [courseDomainScore, setCourseDomainExamScore] = useState([]);

  // 該學生的指定學年期的 "加權/算術"平均 固定排名及分數
  const [examAvgRankMatrix, setAvgRankMatrix] = useState([]);

  // 該學生的指定學年期的 "加權/算術"平均 及時運算分數
  const [examAvgScoreInSpecificDomain, setExamAvgScoreInSpecificDomain] = useState([]);
  const [examAvgScore, setExamAvgScore] = useState([]);
  //******************* */

  const position = window.gadget.params.system_position;

  useEffect(() => {
    GetCurrentSemester();
    GetViewSetting();
    GetStudentList();
  }, []);


  useEffect(() => {
    if (studentID)
      GetCourseSemesterList();
  }, [studentID]);


  useEffect(() => {
    if (studentID && selectedSemester) {
      GetCourseExamList();
      GetAllSubjectExamScore();
      GetAllDomainExamScore();
      //GetRankInfo()
      //GetExamAvgScore();
      //GetScoreCalcRulePassingStandard();
      //GetRankAvgScore();
      GetExamAvgScore();
      GetExamAvgScoreInSpecificDomain();
    }
  }, [studentID, selectedSemester]);

  // useEffect(() => {
  //   //GetRankType();
  // }, [selectedSemester, selectedExam]);


  // useEffect(() => {
  //   OrganizeCourseExamScore();
  // }, [courseSubjectExamScore]);


  // useEffect(() => {
  //   //CountFailedExamSubject();
  // }, [selectedExam, selectedSemester, courseExamScore]);


  var _connection = window.gadget.getContract("1campus.j.exam.parent");

  if (position === 'student')
    _connection = window.gadget.getContract("1campus.j.exam.student");

  // 取得顯示 加權平均、算術平均
  async function GetViewSetting() {
    await _connection.send({
      service: "_.GetViewSetting",
      body: {},
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetViewSettingError', error);
          return 'err';
        } else {
          if (response) {
            // console.log( { response })
            // let isShowRank = (response.Setting.show_no_rank.toLowerCase() === 'true')
            // setShowNoRankSetting(isShowRank);
            if (response.Response.Setting)
              setAvgSetting(response.Response.Setting.show_score);
          }
        }
      }
    });
  }


  // 取得 各評量固定排名之 加權平均、算術平均  
  async function GetRankAvgScore() {
    await _connection.send({
      service: "_.GetRankAvgScore",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetRankAvgScoreError', error);
          return 'err';
        } else {
          if (response) {
            setAvgRankMatrix([].concat(response.RankAvg || []));
          }
        }
      }
    });
  }

  // 取得 各評量 及時運算 之 加權平均、算術平均  
  async function GetExamAvgScore() {
    await _connection.send({
      service: "_.GetExamAvgScore",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester,
        SpecificDomain: false,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetExamAvgScore Error', error);
          return 'err';
        } else {
          if (response) {
            setExamAvgScore([].concat(response.ExamAvg || []));
          }
        }
      }
    });
  }

  // 取得 各評量 及時運算 之 加權平均、算術平均  (限八大領域)
  async function GetExamAvgScoreInSpecificDomain() {
    await _connection.send({
      service: "_.GetExamAvgScore",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester,
        SpecificDomain: true,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetExamAvgScore InSpecificDomain Error', error);
          return 'err';
        } else {
          if (response) {
            setExamAvgScoreInSpecificDomain([].concat(response.ExamAvg || []));
          }
        }
      }
    });
  }


  // 取得學生清單
  async function GetStudentList() {
    await _connection.send({
      service: "_.GetStudentList",
      body: {},
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetStudentListError', error);
          return 'err';
        } else {
          if (response) {
            setStudentList([].concat(response.Student || []));

            if (studentID === '' || studentID === null) {
              setStudent([].concat(response.Student || [])[0].id);
            }
            else {
              var temp = false;
              [].concat(response.Student || []).forEach(element => {
                if (element.id === studentID) {
                  setStudent(studentID);
                  temp = true;
                }
              });
              if (!temp) {
                //localStorage.clear();
                setStudent([].concat(response.Student || [])[0].id);
              }
            }
          }
        }
      }
    });
  }

  // 取得課程學年期清單
  async function GetCourseSemesterList() {
    await _connection.send({
      service: "_.GetAllCourseSemester",
      body: {
        StudentID: studentID
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetAllCourseSemesterError', error);
          return 'err';
        } else {
          if (response) {
            if ([].concat(response.CourseSemester || []).length) {
              setCourseSemesterList([].concat(response.CourseSemester || []));
              var tempSelectedSemester = selectedSemester;

              //1. 返回，保持原來的學年期
              //2. 從別的學生點過來，且課程中有一樣的學年期
              //3. 從別的學生點過來，且課程中沒有一樣的學年期>>系統學年期
              //4. 上述情況都不符合，填入最新的學年期
              var sameInCourse = false; //課程中有一樣的學年期
              var sameAsCurrency = false; //有一樣的系統學年期
              //if (selectedSemester) {
              [].concat(response.CourseSemester || []).forEach(element => {
                if (element.schoolyear + element.semester === currSemester) {
                  sameAsCurrency = true;
                }
                if (element.schoolyear + element.semester === selectedSemester) {
                  sameInCourse = true;
                }

              });

              //* 先填入最新的學年期
              setViewSemester([].concat(response.CourseSemester || [])[0].schoolyear + [].concat(response.CourseSemester || [])[0].semester);

              // 再根據檢查結果填入學年期
              if (appData.isBack) {
                setViewSemester(tempSelectedSemester);
              }
              else if (sameInCourse)
                setViewSemester(tempSelectedSemester);
              else if (sameAsCurrency) {
                setViewSemester(currSemester);
              }

            }
            else {
              setViewSemester('');
              setCourseSemesterList([]);
            }
          }
        }
      }
    });
  }

  // 取得系統學年期
  async function GetCurrentSemester() {
    await _connection.send({
      service: "_.GetCurrentSemester",
      body: {},
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetCurrentSemesterError', error);
          return 'err';
        } else {
          if (response) {
            setCurrSemester(response.CurrentSemester.schoolyear + response.CurrentSemester.semester);

            // if (selectedSemester === '' || selectedSemester === null) {
            //   setViewSemester(response.CurrentSemester.schoolyear + response.CurrentSemester.semester);
            // }

          }
        }
      }
    });
  }

  // 取得顯示學年期的評量清單
  async function GetCourseExamList() {
    await _connection.send({
      service: "_.GetCourseExamList",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          setViewExam('0');
          console.log('GetCourseExamListError', error);
          return 'err';
        } else {
          if (response) {
            setCourseExamList([].concat(response.ExamList || []));
            if ([].concat(response.ExamList || []).length < 1 || selectedExam === null) {
              setViewExam('0');
              //console.log('ASAselectedExam,', selectedExam)
            }
            if ([].concat(response.ExamList || []).length || selectedExam === null) {
              var temp = false;
              [].concat(response.ExamList || []).forEach(element => {
                if (element.exam_id === selectedExam) {
                  setViewExam(selectedExam);
                  temp = true;
                }
              });
              if (!temp) {
                setViewExam('0');
              }
            }
          }
        }
      }
    });
  }

  // 取得指定學年期的排名類別
  async function GetRankType() {
    // await _connection.send({
    //   service: "_.GetRankType",
    //   body: {
    //     StudentID: studentID,
    //     ViewSemester: selectedSemester,
    //     ExamID: selectedExam
    //   },
    //   result: function (response, error, http) {
    //     if (error !== null) {
    //       console.log('GetRankTypeError', error);
    //       setViewRankType('');
    //       return 'err';
    //     } else {
    //       if (response) {
    //         setRankType([].concat(response.RankType || []));
    //         if ([].concat(response.RankType || []).length) {
    //           if (selectedRankType === '' || selectedRankType === null)
    //             setViewRankType([].concat(response.RankType || [])[0].rank_type);
    //         }
    //       }
    //     }
    //   }
    // });
  }

  //取得指定學年期的固定排名
  async function GetRankInfo() {
    // await _connection.send({
    //   service: "_.GetRankInfo",
    //   body: {
    //     StudentID: studentID,
    //     ViewSemester: selectedSemester
    //   },
    //   result: function (response, error, http) {
    //     if (error !== null) {
    //       console.log('GetRankInfo', error);
    //       return 'err';
    //     } else {
    //       if (response) {
    //         setRankMatrix([].concat(response.RankMatrix || []));
    //       }
    //     }
    //   }
    // });
  }


  // 取得指定學年期的課程 科目 定期評量 & 平時評量 & 定期+平時(固定排名) 成績
  async function GetAllSubjectExamScore() {
    await _connection.send({
      //service: "_.GetAllSubjectExamScore",
      service: "_.GetAllSubjectExamScoreImmediately",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetAllSubjectExamScore Error', error);
          return 'err';
        } else {
          if (response) {
            setCourseSubjectExamScore([].concat(response.ExamScore || []));
          }
        }
      }
    });
  }

  // 取得指定學年期的 領域 定期評量(固定排名) & 定期+平時(固定排名) 成績
  async function GetAllDomainExamScore() {
    await _connection.send({
      //service: "_.GetAllDomainExamScore",
      service: "_.GetAllDomainExamScoreImmediately",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetAllDomainExamScore Error', error);
          return 'err';
        } else {
          if (response) {
            setCourseDomainExamScore([].concat(response.DomainScore || []));
          }
        }
      }
    });
  }




  const handleChangeStudent = (studentID) => {
    setStudent(studentID);
  }

  const handleChangeViewSemester = (e) => {
    setViewSemester(e.target.value);
  }

  const handleChangeViewExam = (e) => {
    setViewExam(e.target.value);
  }

  // const handleChangeScoreType = (e) => {
  //   setScoreType(e.target.value);
  // }

  const handleSubjectType = (e) => {
    setSubjectType(Number(e.target.value));
  }

  const handleShowRankDetail = (e) => {
    var subject = e.Subject;
    var courseID = e.CourseID;
    var subjectType = 'subject';

    if (!e.Subject && !e.Domain) {

      subject = avgSetting;
      subjectType = 'avg';
    }

    if (!e.Subject && !e.ItemName) {
      subjectType = 'domain';
      subject = e.Domain;
    }

    if (!e.CourseID)
      courseID = 0;

    let score = null;

    [].concat(e.Field || []).forEach(f => {
      if (f.ExamID === selectedExam || '') {
        score = f.ExamScore;
      }
    })


    setAppDataValues({
      studentID: studentID,
      examID: selectedExam,
      rankType: selectedRankType,
      courseID: courseID,
      semester: selectedSemester,
      subject: subject,
      subjectType: subjectType,
      selectedSubjectType: selectedSubjectType,
      score: score,
      domain: e.Domain,
      credit: e.Credit,
      //period: e.Period,

    });

  };

  const handleDomainExamLevel = (e, specificDomain) => {
    var subject = avgSetting;
    var courseID = 0;
    var subjectType = 'avg';

    subject = avgSetting;
    subjectType = 'avg';


    let score = null;

    [].concat(e.Field || []).forEach(f => {
      if (f.ExamID === selectedExam || '') {
        if (avgSetting === '加權平均')
          score = f.ExamScoreWeight;
        else
          score = f.ExamScore;
      }
    })

    setAppDataValues({
      studentID: studentID,
      examID: selectedExam,
      rankType: selectedRankType,
      courseID: courseID,
      semester: selectedSemester,
      subject: subject,
      subjectType: subjectType,
      selectedSubjectType: selectedSubjectType,
      score: score,
      domain: '',
      total_type: specificDomain, //八大領域、含彈性課程
    });

  };
  // const handleChangeViewRank = (e) => {
  //   setViewRankType(e.target.value);
  // };


  function ConvertStudentName(name) {
    const htmlText = `${name}`

    return <div dangerouslySetInnerHTML={{ __html: htmlText }} />;
  }


  //若有其中一科目是不開放查詢，則最後不會顯示 "不及格科目數"
  //let isShowFailSubjectCount = true;

  return (
    <div className="App">
      <div className="container px-3 px-sm-4 py-5 ">

        <div className='titleBorder d-flex align-items-center'>
          <div>
            <div className='ms-2 me-4 d-flex align-items-center fs-4'>評量成績</div>
            {position === 'student' ? '' :
              <div className='putLeft'>
                {[].concat(studentDateRange || []).map((student) => {
                  if (student.id === studentID)
                    return <button type="button" className="btn btn-outline-blue active me-1 ms-1 mt-1" id={student.id} key={student.id} value={student.id} onClick={() => { handleChangeStudent(student.id); }} >{ConvertStudentName(student.name)}</button>
                  else
                    return <button type="button" className="btn btn-outline-blue me-1 ms-1 mt-1" id={student.id} key={student.id} value={student.id} onClick={() => { handleChangeStudent(student.id); }}>{ConvertStudentName(student.name)}</button>
                })}
              </div>
            }
          </div>
        </div>


        <div className='row align-items-center my-1'>
          <div className='col-12 col-md-4 col-lg-3 py-2'>
            <select className="form-select" value={selectedSemester} onChange={(e) => handleChangeViewSemester(e)} >
              {[].concat(courseSemesterRange || []).length < 1 ? <option value="Y" key="Y">(選擇學年度學期)</option> : <></>}
              {/* <option value="Y" key="Y">(選擇學年度學期)</option> */}
              {courseSemesterRange.map((courseSemester, index) => {
                return <option key={index} value={courseSemester.schoolyear + courseSemester.semester}>
                  {courseSemester.schoolyear}學年度第{courseSemester.semester}學期</option>
              })}
            </select>
          </div>
          <div className='col-12 col-md-4 col-lg-3 py-2'>
            <select className="form-select" value={selectedExam} onChange={(e) => handleChangeViewExam(e)}>
              <option value="0" key="Y">總覽</option>
              {courseExamList.map((examList, index) => {
                return <option key={index} value={examList.exam_id}>
                  {examList.exam_name}</option>
              })}
            </select>
          </div>

          {/* 總覽只顯示 科目成績_定期 ， 故不給選科目or領域*/}
          {selectedExam === '0' ? '' :
            <div className='col-12 col-md-4 col-lg-3 py-2'>
              <select className="form-select" value={selectedSubjectType} onChange={(e) => handleSubjectType(e)}>
                <option value={0} key={0}>科目成績</option>
                <option value={1} key={1}>領域成績</option>
              </select>
            </div>}

          {/* <div className='col-12 col-md-6 col-lg-3 py-2'>
            <select className="form-select" value={selectedScoreType} onChange={(e) => handleChangeScoreType(e)} >
              <option value={0} key={0}>定期 與 平時</option>
              <option value={1} key={1}>定期 加 平時</option>
            </select>
          </div> */}

          {/* {selectedExam === '0' || selectedExam === null || showNoRankSetting ? '' :
          <div className='d-flex align-items-center mb-3 col-12 col-md-6 col-lg-6 py-2'>
            <div className="col-2 col-md-4 col-lg-2">排名類別</div>
            <div className="col-10 col-md-8 col-lg-10 ps-1">
              <select className="form-select" value={selectedRankType} onChange={(e) => handleChangeViewRank(e)}>

                {[].concat(examRankType || []).length < 1 ? <option value="Y" key="Y">(尚無排名資料)</option> : <option value="Y" key="Y">(選擇排名類別)</option>}

                {examRankType.map((rankType, index) => {
                  return <option key={index} value={rankType.rank_type}>
                    {rankType.rank_type}</option>
                })}
              </select>
            </div>
          </div>} */}

        </div>


        <div>{[].concat(courseSubjectExamScore || []).length < 1 ? '尚無成績資料。' : ''}</div>

        {/* 2023.12.02 改及時運算 先拿掉 */}
        {/* <div>{selectedExam !== '0' && selectedSubjectType === 1 && [].concat(examAvgRankMatrix || []).length < 1 ? '尚無資料。' : ''}</div> */}

        {/* <div className="row row-cols-1 row-cols-md-2 g-4 "> */}
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 "> {/* 三排 */}

          {/* 評量> 科目成績 */}
          {selectedSubjectType === 0 ? <>    {[].concat(courseSubjectExamScore || []).map((ces) => {
            return <>
              {[].concat(ces.Field || []).map((cField, index) => {
                if (cField.ExamID === selectedExam) {
                  //let roundColor = '#A9D18E';
                  let passColor = 'card card-pass shadow h-100';
                  let examScoreColor = 'fs-4 me-0 pe-0';
                  let assignmentScoreColor = 'fs-4 me-0 pe-0';
                  let scoreColor = 'fs-4 me-0 pe-0';
                  let show = '/RankDetail';
                  let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';
                  // if (cField.IsPass === 'f') {
                  //   roundColor = '#FF0000';
                  //   passColor = 'card card-unpass h-100';
                  //   scoreColor = 'fs-4 text-danger me-0 pe-0';
                  // }

                  //2023.12.02 移除"尚未計算"，和沒有成績一樣是"-"
                  //scoreColor = 'me-0 pe-0 text-unview';

                  if (!cField.RankScore)
                    show = '/RankDetailImmediately';

                  //什麼分數都沒有，不給看詳細資料
                  if (!cField.ExamScore && !cField.RankScore && !cField.Score) {
                    disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                    show = null;
                  }


                  if (cField.ToView === 'f') {
                    //roundColor = '#5B9BD5';
                    //passColor = 'card h-100';
                    //if (cField.ToView === 'f') {
                    disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                    show = null;
                    //isShowFailSubjectCount = false;
                    //}
                  }

                  //缺或免  紅字
                  if (cField.ExamScoreText !== '')
                    examScoreColor = 'fs-4 text-danger me-0 pe-0';
                  if (cField.AssignmentScore !== '' && cField.AssignmentScoreText !== '')
                    assignmentScoreColor = 'fs-4 text-danger me-0 pe-0';

                  // 有成績 且 非缺 非免 且 60分以下 紅字
                  if (cField.ExamScore !== '' && cField.ExamScoreText === '' && Number(cField.ExamScore) < 60)
                    examScoreColor = 'fs-4 text-danger me-0 pe-0';
                  if (cField.AssignmentScore !== '' && cField.AssignmentScoreText === '' && Number(cField.AssignmentScore) < 60)
                    assignmentScoreColor = 'fs-4 text-danger me-0 pe-0';

                  if (cField.Score !== '' && Number(cField.Score) < 60)
                    scoreColor = 'fs-4 text-danger me-0 pe-0';

                  let im = 0;
                  let previousExamID = selectedExam;
                  if (index !== 0) {
                    im = index - 1;
                    previousExamID = ces.Field[im].ExamID;
                  }
                  return <div className="col"><div className={passColor}>
                    <div className="card-body">
                      <Link className={disabledCursor} to={show} onClick={() => { handleShowRankDetail(ces); }}>
                        <div className='d-flex'>
                          <div className='d-flex me-auto p-2 align-items-center'>
                            {/* {<div className='rounded-circle me-1' style={{ width: '10px', height: '10px', background: roundColor }}></div>} */}

                            <div className='fs-4 fw-bold text-start'>{ces.Domain === "" ? "" : ces.Domain + "-"}{ces.Subject}</div>
                          </div>
                          <div className='d-flex p-2' >
                            <div>權數</div><div>{ces.Credit}</div>
                          </div>
                        </div>

                        <div className='row align-items-end'>

                          {cField.ToView === 'f' ? <div className='text-unview'><div>未開放查詢。</div> <div>開放查詢時間：{cField.ToViewTime === '' ? '未設定' : cField.ToViewTime}</div></div> : <>
                            <div className='col-6 col-md-6 col-lg-4 my-2'>
                              <div className='row align-items-center'>
                                <div className='d-flex justify-content-center'>
                                  <div className='row align-items-center'>
                                    {/* <div className={examScoreColor}>{cField.ExamScore === '' ? '-' : cField.ExamScore}</div> */}
                                    {/* 2023-12-2 及時運算sevice 使用 */}
                                    <div className={examScoreColor}>
                                      {cField.ExamScoreText !== '' ? cField.ExamScoreText : cField.ExamScore === '' ? '-' : cField.ExamScore}
                                    </div>
                                    <div className='text-nowrap me-0 pe-0'>定期評量</div>
                                  </div>

                                  <div>{index === 0 || cField.ExamScore === '' || ces.Field[im].ExamScore === '' ? '' : Number(ces.Field[index].ExamScore) > Number(ces.Field[im].ExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(ces.Field[index].ExamScore) < Number(ces.Field[im].ExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                </div>
                              </div>
                            </div>

                            <div className='col-6 col-md-6 col-lg-4 my-2'>
                              <div className='row align-items-center'>
                                <div className='d-flex justify-content-center'>
                                  <div className='row align-items-center'>
                                    {/* <div className={assignmentScoreColor}>{cField.AssignmentScore === '' ? '-' : cField.AssignmentScore}</div> */}
                                    {/* 2023-12-2 及時運算sevice 使用 */}
                                    <div className={assignmentScoreColor}>{cField.AssignmentScore === '' ? '-' : cField.AssignmentScoreText !== '' ? cField.AssignmentScoreText : cField.AssignmentScore}</div>
                                    <div className='text-nowrap me-0 pe-0'>平時評量</div>
                                  </div>

                                  <div>{index === 0 || cField.AssignmentScore === '' || ces.Field[im].AssignmentScore === '' ? '' : Number(ces.Field[index].AssignmentScore) > Number(ces.Field[im].AssignmentScore) ? <img className='arrow' src={up} alt='↑' /> : Number(ces.Field[index].AssignmentScore) < Number(ces.Field[im].AssignmentScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                </div>
                              </div>
                            </div>

                            <div className='col-6 col-md-6 col-lg-4 my-2'>
                              <div className='row align-items-center'>
                                <div className='d-flex justify-content-center'>
                                  <div className='row align-items-center'>
                                    {/* <div className={scoreColor}>{cField.Score === '' ? '尚未計算' : Math.round(Number(cField.Score) * 100) / 100}</div> */}

                                    <div className={scoreColor}>{cField.Score === '' ? '-' : Math.round(Number(cField.Score) * 100) / 100}</div>
                                    <div className='text-nowrap me-0 pe-0'>定期+平時評量</div>
                                  </div>

                                  <div>{index === 0 || cField.Score === '' || ces.Field[im].Score === '' ? '' : Number(ces.Field[index].Score) > Number(ces.Field[im].Score) ? <img className='arrow' src={up} alt='↑' /> : Number(ces.Field[index].Score) < Number(ces.Field[im].Score) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                </div>
                              </div>
                            </div>



                          </>}

                        </div>

                        {cField.ToView === 'f' ? '' :
                          <div className='d-flex me-auto p-2 align-items-center'>
                            {/* <div className=''>計算時間：{cField.CreateTime}</div> */}
                            <div className='text-success'>{cField.Message}</div>
                          </div>
                        }
                        {/* {cField.Score !== '' ? <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                          <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                          更多
                        </div> : cField.ExamScore !== '' && cField.ToView === 't' ? <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                          <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                          組距
                        </div> : <></>

                        } */}


                        {cField.ToView === 'f' || (!cField.Score && !cField.ExamScore) ? '' : <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                          <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                          更多
                        </div>}

                      </Link>
                    </div>
                  </div>
                  </div>
                }

              })}
            </>
          })}</> : ''}


          {/* 評量> 領域成績 */}
          {selectedSubjectType === 1 ? <>   {[].concat(courseDomainScore || []).map((ces) => {
            return <>
              {[].concat(ces.Field || []).map((cField, index) => {
                if (cField.ExamID === selectedExam) {
                  //let roundColor = '#A9D18E';
                  let passColor = 'card card-pass shadow h-100';
                  let examScoreColor = 'fs-4 me-0 pe-0';
                  let scoreColor = 'fs-4 me-0 pe-0';
                  let show = '/RankDetail';
                  let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';


                  if (!cField.RankScore)
                    show = '/RankDetailImmediately';

                  //什麼分數都沒有，不給看詳細資料
                  if (!cField.ExamScore && !cField.RankScore && !cField.Score) {
                    disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                    show = null;
                  }

                  // 有成績 且 60分以下 紅字
                  if (cField.ExamScore !== '' && Number(cField.ExamScore) < 60)
                    examScoreColor = 'fs-4 text-danger me-0 pe-0';
                  if (cField.Score !== '' && Number(cField.Score) < 60)
                    scoreColor = 'fs-4 text-danger me-0 pe-0';

                  let im = 0;
                  let previousExamID = selectedExam;
                  if (index !== 0) {
                    im = index - 1;
                    previousExamID = ces.Field[im].ExamID;
                  }
                  return <div className="col"><div className={passColor}>
                    <div className="card-body">
                      <Link className={disabledCursor} to={show} onClick={() => { handleShowRankDetail(ces); }}>
                        <div className='d-flex'>
                          <div className='d-flex me-auto p-2 align-items-center'>
                            {/* {<div className='rounded-circle me-1' style={{ width: '10px', height: '10px', background: roundColor }}></div>} */}

                            <div className='fs-4 fw-bold text-start'>{ces.Domain}</div>
                          </div>
                          <div className='d-flex p-2' >
                            <div>權數</div><div>{cField.Credit}</div>
                          </div>
                        </div>

                        <div className='row align-items-center'>

                          {cField.ToView === 'f' ? <div className='text-unview'><div>未開放查詢。</div> <div>開放查詢時間：{cField.ToViewTime === '' ? '未設定' : cField.ToViewTime}</div></div> : <>
                            <div className='col-6 col-md-6 col-lg-6 my-2'>
                              <div className='row align-items-center'>
                                <div className='d-flex justify-content-center'>
                                  <div className='row align-items-center'>
                                    <div className={examScoreColor}>{cField.ExamScore === '' ? '-' : Math.round(Number(cField.ExamScore) * 100) / 100}</div>
                                    <div className='text-nowrap me-0 pe-0'>定期評量</div>
                                  </div>

                                  <div>{index === 0 || cField.ExamScore === '' || ces.Field[im].ExamScore === '' ? '' : Number(ces.Field[index].ExamScore) > Number(ces.Field[im].ExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(ces.Field[index].ExamScore) < Number(ces.Field[im].ExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                </div>
                              </div>
                            </div>

                            <div className='col-6 col-md-6 col-lg-6 my-2'>
                              <div className='row align-items-center'>
                                <div className='d-flex justify-content-center'>
                                  <div className='row align-items-center'>
                                    <div className={scoreColor}>{cField.Score === '' ? '-' : Math.round(Number(cField.Score) * 100) / 100}</div>
                                    <div className='me-0 pe-0'>定期+平時評量</div>
                                  </div>

                                  <div>{index === 0 || cField.Score === '' || ces.Field[im].Score === '' ? '' : Number(ces.Field[index].Score) > Number(ces.Field[im].Score) ? <img className='arrow' src={up} alt='↑' /> : Number(ces.Field[index].Score) < Number(ces.Field[im].Score) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                </div>
                              </div>
                            </div>
                          </>}

                          {/* {箭頭排版} */}
                          {/* <div className='col-6 col-md-6 col-lg-6 my-2'>
                            <div className='row align-items-center m-2'>
                              <div className='d-flex justify-content-center'>
                                <div className={scoreColor}>{cField.Score === '' ? '-' : Math.round(Number(cField.Score) * 100) / 100}</div>
                                <div>{index === 0 || cField.Score === '' || ces.Field[im].Score === '' ? '' : Number(ces.Field[index].Score) > Number(ces.Field[im].Score) ? <img className='arrow' src={redUp} alt='↑' /> : Number(ces.Field[index].Score) < Number(ces.Field[im].Score) ? <img className='arrow' src={greenDown} alt='↓' /> : ''}</div>
                              </div>
                              <div className=''>定期+平時評量</div>
                            </div>
                          </div> */}

                        </div>



                        {/* 2023.12.02 因改及時運算而棄用 */}
                        {/* <div className='d-flex me-auto p-2 align-items-center'>
                          <div className=''>計算時間：{cField.CreateTime}</div>
                        </div>
                        {cField.CreateTime === '' ? '' : <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                          <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                          更多
                        </div>} */}

                        {/* 2023.12.02 因改及時運算而使用 */}
                        {cField.ToView === 'f' || (!cField.Score && !cField.ExamScore) ? '' : <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                          <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                          更多
                        </div>}
                      </Link>
                    </div>
                  </div>
                  </div>
                }

              })}
            </>
          })}</> : ''}


          {/* 評量> 固定排名總計成績  改用即時分數 棄用*/}
          {/* {examAvgRankMatrix.map((ces) => {
            if (ces.ItemName === avgSetting)
              return <>
                {[].concat(ces.Field || []).map((cField, index) => {
                  if (cField.ExamID === selectedExam) {
                    //let roundColor = '#A9D18E';
                    let passColor = 'card card-pass shadow h-100';
                    let examScoreColor = 'fs-4 me-0 pe-0';
                    let scoreColor = 'fs-4 me-0 pe-0';
                    let show = '/RankDetail';
                    let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';

                    // 有成績 且 60分以下 紅字
                    if (cField.ExamScore !== '' && Number(cField.ExamScore) < 60)
                      examScoreColor = 'fs-4 text-danger me-0 pe-0';
                    if (cField.Score !== '' && Number(cField.Score) < 60)
                      scoreColor = 'fs-4 text-danger me-0 pe-0';

                    let im = 0;
                    let previousExamID = selectedExam;
                    if (index !== 0) {
                      im = index - 1;
                      previousExamID = ces.Field[im].ExamID;
                    }
                    return <div className="col"><div className={passColor}>
                      <div className="card-body">
                        <Link className={disabledCursor} to={show} onClick={() => { handleShowRankDetail(ces); }}>
                          <div className='d-flex'>
                            <div className='d-flex me-auto p-2 align-items-center'>

                              <div className='fs-4 fw-bold text-start'>{ces.ItemName}</div>
                            </div>

                          </div>

                          <div className='row align-items-center'>


                            <div className='col-6 col-md-6 col-lg-6 my-2'>
                              <div className='row align-items-center'>
                                <div className='d-flex justify-content-center'>
                                  <div className='row align-items-center'>
                                    <div className={examScoreColor}>{cField.ExamScore === '' ? '-' : Math.round(Number(cField.ExamScore) * 100) / 100}</div>
                                    <div className='me-0 pe-0'>定期評量</div>
                                  </div>

                                  <div>{index === 0 || cField.ExamScore === '' || ces.Field[im].ExamScore === '' ? '' : Number(ces.Field[index].ExamScore) > Number(ces.Field[im].ExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(ces.Field[index].ExamScore) < Number(ces.Field[im].ExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                </div>
                              </div>
                            </div>

                            <div className='col-6 col-md-6 col-lg-6 my-2'>
                              <div className='row align-items-center'>
                                <div className='d-flex justify-content-center'>
                                  <div className='row align-items-center'>
                                    <div className={scoreColor}>{cField.Score === '' ? '-' : Math.round(Number(cField.Score) * 100) / 100}</div>
                                    <div className='me-0 pe-0'>定期+平時評量</div>
                                  </div>

                                  <div>{index === 0 || cField.Score === '' || ces.Field[im].Score === '' ? '' : Number(ces.Field[index].Score) > Number(ces.Field[im].Score) ? <img className='arrow' src={up} alt='↑' /> : Number(ces.Field[index].Score) < Number(ces.Field[im].Score) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                </div>
                              </div>
                            </div>


                          </div>

                          <div className='d-flex me-auto p-2 align-items-center'>
                            <div className=''>計算時間：{cField.CreateTime}</div>
                          </div>
                          {cField.CreateTime === '' ? '' :
                            <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                              <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                              更多
                            </div>}

                        </Link>
                      </div>
                    </div>
                    </div>
                  }

                })}
              </>
          })} */}

          {/* 評量> (及時)八大領域總計成績 */}
          {examAvgScoreInSpecificDomain.length > 0 ? <>
            {[].concat(examAvgScoreInSpecificDomain || []).map((ces) => {
              return <>
                {[].concat(ces.Field || []).map((cField, index) => {
                  if (cField.ExamID === selectedExam) {
                    //let roundColor = '#A9D18E';
                    let passColor = 'card card-pass shadow h-100';
                    let examScoreColor = 'fs-4 me-0 pe-0';
                    let scoreColor = 'fs-4 me-0 pe-0';
                    let show = '/RankDetail';
                    let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';

                    if (!cField.RankScore)
                      show = '/RankDetailImmediately';

                    let pExamScore = '';
                    let pScore = '';
                    let ExamScore = '';
                    let Score = '';
                    if (avgSetting === '加權平均') {
                      ExamScore = cField.ExamScoreWeight;
                      Score = cField.ScoreWeight;
                    }
                    else {
                      ExamScore = cField.ExamScore;
                      Score = cField.Score;
                    }

                    if (cField.ToView === 'f' || !ExamScore) {
                      show = null;
                      disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                    }

                    // 有成績 且 60分以下 紅字
                    if (ExamScore !== '' && Number(ExamScore) < 60)
                      examScoreColor = 'fs-4 text-danger me-0 pe-0';
                    if (Score !== '' && Number(Score) < 60)
                      scoreColor = 'fs-4 text-danger me-0 pe-0';

                    let im = 0;
                    let previousExamID = selectedExam;
                    if (index !== 0) {
                      im = index - 1;

                      if (avgSetting === '加權平均') {
                        pExamScore = ces.Field[im].ExamScoreWeight;
                        pScore = ces.Field[im].ScoreWeight;
                      }
                      else {
                        pExamScore = ces.Field[im].ExamScore;
                        pScore = ces.Field[im].Score;
                      }
                      previousExamID = ces.Field[im].ExamID;
                    }
                    return <div className="col"><div className={passColor}>
                      <div className="card-body">
                        <Link className={disabledCursor} to={show} onClick={() => { handleDomainExamLevel(ces, '八大領域'); }}>
                          <div className='d-flex'>
                            <div className='d-flex me-auto p-2 align-items-center'>
                              <div className='fs-4 fw-bold text-start'>{avgSetting}(八大領域)</div>
                            </div>

                          </div>

                          <div className='row align-items-center'>

                            {cField.ToView === 'f' ? <div className='text-unview'><div>未開放查詢。</div> <div>開放查詢時間：{cField.ToViewTime === '' ? '未設定' : cField.ToViewTime}</div></div> : <>
                              <div className='col-6 col-md-6 col-lg-6 my-2'>
                                <div className='row align-items-center'>
                                  <div className='d-flex justify-content-center'>
                                    <div className='row align-items-center'>
                                      <div className={examScoreColor}>{ExamScore === '' ? '-' : Math.round(Number(ExamScore) * 100) / 100}</div>
                                      <div className='text-nowrap me-0 pe-0'>定期評量</div>
                                    </div>

                                    <div>{index === 0 || ExamScore === '' || pExamScore === '' ? '' : Number(ExamScore) > Number(pExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(ExamScore) < Number(pExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                  </div>
                                </div>
                              </div>

                              <div className='col-6 col-md-6 col-lg-6 my-2'>
                                <div className='row align-items-center'>
                                  <div className='d-flex justify-content-center'>
                                    <div className='row align-items-center'>
                                      <div className={scoreColor}>{Score === '' ? '-' : Math.round(Number(Score) * 100) / 100}</div>
                                      <div className='text-nowrap me-0 pe-0'>定期+平時評量</div>
                                    </div>

                                    <div>{index === 0 || Score === '' || pScore === '' ? '' : Number(Score) > Number(pScore) ? <img className='arrow' src={up} alt='↑' /> : Number(Score) < Number(pScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                  </div>
                                </div>
                              </div>

                            </>}
                          </div>
                          <div className='text-start text-mark mt-2'>此總計成績為八大學習領域之科目成績即時運算而得。</div>

                          {cField.ToView === 'f' || !ExamScore ? '' :
                            <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                              <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                              更多
                            </div>}

                        </Link>
                      </div>
                    </div>
                    </div>
                  }

                })}
              </>
            })}
          </>
            : <></>}

          {/* 評量> (及時)含彈性課程總計成績 */}
          {examAvgScore.length > 0 ? <>
            {[].concat(examAvgScore || []).map((ces) => {
              return <>
                {[].concat(ces.Field || []).map((cField, index) => {
                  if (cField.ExamID === selectedExam) {
                    //let roundColor = '#A9D18E';
                    let passColor = 'card card-pass shadow h-100';
                    let examScoreColor = 'fs-4 me-0 pe-0';
                    let scoreColor = 'fs-4 me-0 pe-0';
                    let show = '/RankDetail';
                    let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';

                    if (!cField.RankScore)
                      show = '/RankDetailImmediately';

                    let pExamScore = '';
                    let pScore = '';
                    let ExamScore = '';
                    let Score = '';
                    if (avgSetting === '加權平均') {
                      ExamScore = cField.ExamScoreWeight;
                      Score = cField.ScoreWeight;
                    }
                    else {
                      ExamScore = cField.ExamScore;
                      Score = cField.Score;
                    }

                    if (cField.ToView === 'f' || !ExamScore) {
                      show = null;
                      disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                    }
                    // 有成績 且 60分以下 紅字
                    if (ExamScore !== '' && Number(ExamScore) < 60)
                      examScoreColor = 'fs-4 text-danger me-0 pe-0';
                    if (Score !== '' && Number(Score) < 60)
                      scoreColor = 'fs-4 text-danger me-0 pe-0';

                    let im = 0;
                    let previousExamID = selectedExam;
                    if (index !== 0) {
                      im = index - 1;

                      if (avgSetting === '加權平均') {
                        pExamScore = ces.Field[im].ExamScoreWeight;
                        pScore = ces.Field[im].ScoreWeight;
                      }
                      else {
                        pExamScore = ces.Field[im].ExamScore;
                        pScore = ces.Field[im].Score;
                      }
                      previousExamID = ces.Field[im].ExamID;
                    }
                    return <div className="col"><div className={passColor}>
                      <div className="card-body">
                        <Link className={disabledCursor} to={show} onClick={() => { handleDomainExamLevel(ces, '含彈性課程'); }}>
                          <div className='d-flex'>
                            <div className='d-flex me-auto p-2 align-items-center'>
                              <div className='fs-4 fw-bold text-start'>{avgSetting}(含彈性課程)</div>
                            </div>
                          </div>

                          <div className='row align-items-center'>
                            {cField.ToView === 'f' ? <div className='text-unview'><div>未開放查詢。</div> <div>開放查詢時間：{cField.ToViewTime === '' ? '未設定' : cField.ToViewTime}</div></div> : <>

                              <div className='col-6 col-md-6 col-lg-6 my-2'>
                                <div className='row align-items-center'>
                                  <div className='d-flex justify-content-center'>
                                    <div className='row align-items-center'>
                                      <div className={examScoreColor}>{ExamScore === '' ? '-' : Math.round(Number(ExamScore) * 100) / 100}</div>
                                      <div className='text-nowrap me-0 pe-0'>定期評量</div>
                                    </div>

                                    <div>{index === 0 || ExamScore === '' || pExamScore === '' ? '' : Number(ExamScore) > Number(pExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(ExamScore) < Number(pExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                  </div>
                                </div>
                              </div>

                              <div className='col-6 col-md-6 col-lg-6 my-2'>
                                <div className='row align-items-center'>
                                  <div className='d-flex justify-content-center'>
                                    <div className='row align-items-center'>
                                      <div className={scoreColor}>{Score === '' ? '-' : Math.round(Number(Score) * 100) / 100}</div>
                                      <div className='me-0 pe-0'>定期+平時評量</div>
                                    </div>

                                    <div>{index === 0 || Score === '' || pScore === '' ? '' : Number(Score) > Number(pScore) ? <img className='arrow' src={up} alt='↑' /> : Number(Score) < Number(pScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                  </div>
                                </div>
                              </div>

                            </>}
                          </div>
                          <div className='text-start text-mark mt-2'>此總計成績為八大學習領域(含彈性課程)之科目成績即時運算而得。</div>

                          {cField.ToView === 'f' || !ExamScore ? '' :
                            <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                              <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                              更多
                            </div>}

                        </Link>
                      </div>
                    </div>
                    </div>
                  }

                })}
              </>
            })}
          </>
            : <></>}

          {/* 總覽> 科目成績_定期 */}

          {[].concat(courseSubjectExamScore || []).map((nces) => {
            if (selectedExam === '0') {
              return <div className="col">
                <div className='card card-pass shadow h-100'>
                  <div className="card-body">
                    <div className="card-block">
                      <div className='d-flex'>
                        <div className='d-flex me-auto p-2 align-items-center'>
                          {/* {nces.Subject === avgSetting ? <></> : <div className='rounded-circle me-1' style={{ width: '10px', height: '10px', background: '#8FAADC' }}></div>} */}

                          <div className='fs-4 fw-bold text-start'>{nces.Domain === "" ? "" : nces.Domain + "-"}{nces.Subject}</div>
                        </div>
                        <div className='d-flex p-2' >
                          <div>權數</div><div>{nces.Credit}</div>
                        </div>
                      </div>

                      <div className='row align-items-center'>

                        {[].concat(nces.Field || []).map((nField, index) => {
                          let scoreColor = 'fs-4';

                          //缺或免  紅字
                          if (nField.ExamScoreText !== '')
                            scoreColor = 'fs-4 text-danger me-0 pe-0';

                          // 有成績 且 非缺 非免 且 60分以下 紅字
                          if (nField.ExamScore !== '' && nField.ExamScoreText === '' && Number(nField.ExamScore) < 60)
                            scoreColor = 'fs-4 text-danger me-0 pe-0';

                          let im = 0;
                          if (index !== 0)
                            im = index - 1
                          return <div className='col-6 col-md-6 col-lg-6'>
                            <div className='row align-items-center my-2'>
                              <div className='d-flex justify-content-center'>
                                <div className={scoreColor}>
                                  {nField.ToView === 't' ?
                                    nField.ExamScoreText !== '' ? nField.ExamScoreText :
                                      nField.ExamScore === '' ? '-' : nField.ExamScore :
                                    <div className='text-unview'>
                                      <div>開放查詢時間：</div><div>{nField.ToViewTime === '' ? '未設定' : nField.ToViewTime}</div>
                                    </div>}
                                </div>
                                <div>{index === 0 || nField.ToView === 'f' || nField.ExamScore === '' || nces.Field[im].ExamScore === '' ? '' : Number(nces.Field[index].ExamScore) > Number(nces.Field[im].ExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(nces.Field[index].ExamScore) < Number(nces.Field[im].ExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>
                              </div>
                              <div>{nField.ExamName}</div>
                            </div>
                          </div>
                        })}
                      </div>


                    </div>
                  </div>
                </div>
              </div>
            }
          })}

          {/* 總覽> 總計 改用即時分數，棄用*/}
          {/* {examAvgRankMatrix.map((earm) => {
            if (selectedExam === '0' && earm.ItemName === avgSetting) {
              return <div className="col">
                <div className='card card-pass shadow h-100'>
                  <div className="card-body">
                    <div className="card-block">
                      <div className='d-flex'>
                        <div className='d-flex me-auto p-2 align-items-center'>
                          <div className='fs-4 fw-bold'>{earm.ItemName}</div>
                        </div>
                      </div>

                      <div className='row align-items-center'>

                        {[].concat(earm.Field || []).map((mField, index) => {
                          let scoreColor = 'fs-4';

                          // 有成績 且 非缺 非免 且 60分以下 紅字
                          if (mField.ExamScore !== '' && Number(mField.ExamScore) < 60)
                            scoreColor = 'fs-4 text-danger me-0 pe-0';

                          let im = 0;
                          if (index !== 0)
                            im = index - 1
                          return <div className='col-6 col-md-6 col-lg-6'>
                            <div className='row align-items-center my-2'>
                              <div className='d-flex justify-content-center'>
                                <div className={scoreColor}>{mField.ExamScore === '' ? '-' : Math.round(Number(mField.ExamScore) * 100) / 100}
                                </div>
                                <div>{index === 0 || mField.ExamScore === '' || earm.Field[im].ExamScore === '' ? '' : Number(earm.Field[index].ExamScore) > Number(earm.Field[im].ExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(earm.Field[index].ExamScore) < Number(earm.Field[im].ExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>
                              </div>
                              <div>{mField.ExamName}</div>
                            </div>
                          </div>
                        })}
                      </div>


                    </div>
                  </div>
                </div>
              </div>
            }
          })} */}

          {/* 總覽> (及時) 八大領域 定期_總計 */}
          {[].concat(examAvgScoreInSpecificDomain || []).map((earm) => {
            //console.log('earm',earm);
            if (selectedExam === '0') {
              return <div className="col">
                <div className='card card-pass shadow h-100'>
                  <div className="card-body">
                    <div className="card-block">
                      <div className='d-flex'>
                        <div className='d-flex me-auto p-2 align-items-center'>
                          <div className='fs-4 fw-bold'>{avgSetting}(八大領域)</div>
                        </div>
                      </div>

                      <div className='row align-items-center'>

                        {[].concat(earm.Field || []).map((mField, index) => {
                          let scoreColor = 'fs-4';

                          let pExamScore = '';
                          let pScore = '';
                          let ExamScore = '';
                          let Score = '';
                          if (avgSetting === '加權平均') {
                            ExamScore = mField.ExamScoreWeight;
                            Score = mField.ScoreWeight;
                          }
                          else {
                            ExamScore = mField.ExamScore;
                            Score = mField.Score;
                          }




                          // 有成績 且 非缺 非免 且 60分以下 紅字
                          if (ExamScore !== '' && Number(ExamScore) < 60)
                            scoreColor = 'fs-4 text-danger me-0 pe-0';

                          let im = 0;
                          if (index !== 0) {
                            im = index - 1
                            if (avgSetting === '加權平均') {
                              pExamScore = earm.Field[im].ExamScoreWeight;
                              pScore = earm.Field[im].ScoreWeight;
                            }
                            else {
                              pExamScore = earm.Field[im].ExamScore;
                              pScore = earm.Field[im].Score;
                            }
                          }
                          return <div className='col-6 col-md-6 col-lg-6'>
                            <div className='row align-items-center my-2'>
                              {mField.ToView === 'f' ? <div><div className='text-unview'>開放查詢時間：{mField.ToViewTime === '' ? '未設定' : mField.ToViewTime}</div></div> : <>
                                <div className='d-flex justify-content-center'>
                                  <div className={scoreColor}>{ExamScore === '' ? '-' : Math.round(Number(ExamScore) * 100) / 100}
                                  </div>
                                  <div>{index === 0 || ExamScore === '' || pExamScore === '' ? '' : Number(ExamScore) > Number(pExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(ExamScore) < Number(pExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>
                                </div>
                              </>}
                              <div>{mField.ExamName}</div>
                            </div>
                          </div>

                        })}
                        <div className='text-start text-mark mt-1'>此總計成績為八大學習領域之科目成績即時運算而得。</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          })}
          {/* 總覽> (及時) 含彈性課程 定期_總計 */}
          {[].concat(examAvgScore || []).map((earm) => {
            //console.log('earm',earm);
            if (selectedExam === '0') {
              return <div className="col">
                <div className='card card-pass shadow h-100'>
                  <div className="card-body">
                    <div className="card-block">
                      <div className='d-flex'>
                        <div className='d-flex me-auto p-2 align-items-center'>
                          <div className='fs-4 fw-bold'>{avgSetting}(含彈性課程)</div>
                        </div>
                      </div>

                      <div className='row align-items-center'>

                        {[].concat(earm.Field || []).map((mField, index) => {
                          let scoreColor = 'fs-4';

                          let pExamScore = '';
                          let pScore = '';
                          let ExamScore = '';
                          let Score = '';
                          if (avgSetting === '加權平均') {
                            ExamScore = mField.ExamScoreWeight;
                            Score = mField.ScoreWeight;
                          }
                          else {
                            ExamScore = mField.ExamScore;
                            Score = mField.Score;
                          }




                          // 有成績 且 非缺 非免 且 60分以下 紅字
                          if (ExamScore !== '' && Number(ExamScore) < 60)
                            scoreColor = 'fs-4 text-danger me-0 pe-0';

                          let im = 0;
                          if (index !== 0) {
                            im = index - 1
                            if (avgSetting === '加權平均') {
                              pExamScore = earm.Field[im].ExamScoreWeight;
                              pScore = earm.Field[im].ScoreWeight;
                            }
                            else {
                              pExamScore = earm.Field[im].ExamScore;
                              pScore = earm.Field[im].Score;
                            }
                          }
                          return <div className='col-6 col-md-6 col-lg-6'>
                            <div className='row align-items-center my-2'>
                              {mField.ToView === 'f' ? <div> <div className='text-unview'>開放查詢時間：{mField.ToViewTime === '' ? '未設定' : mField.ToViewTime}</div></div> : <>
                                <div className='d-flex justify-content-center'>
                                  <div className={scoreColor}>{ExamScore === '' ? '-' : Math.round(Number(ExamScore) * 100) / 100}
                                  </div>
                                  <div>{index === 0 || ExamScore === '' || pExamScore === '' ? '' : Number(ExamScore) > Number(pExamScore) ? <img className='arrow' src={up} alt='↑' /> : Number(ExamScore) < Number(pExamScore) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>
                                </div>
                              </>}
                              <div>{mField.ExamName}</div>
                            </div>
                          </div>
                        })}
                        <div className='text-start text-mark mt-1'>此總計成績為八大學習領域(含彈性課程)之科目成績即時運算而得。</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          })}
        </div>

        {/* {!isShowFailSubjectCount || selectedExam === '0' || selectedExam === null ? "" : <div>
          <div className='d-flex justify-content-left'>
            <div>不及格科目數：</div><div>{failedCount}</div>
          </div>
        </div>} */}

        <ScrollToTopButton />
      </div>
    </div>
  );
}

export default Main;



