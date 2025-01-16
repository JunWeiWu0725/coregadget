import React, { useState, useEffect } from 'react';
import './App.css';
import { Link } from 'react-router-dom';
// import greenDown from './greenDown.png';
// import redUp from './redUp.png';
import down from './down.png';
import up from './up.png';
import ScrollToTopButton from './ScrollToTopButton';
import { useAppContext } from './AppContext';
import Loading from './Loading';
import { MdKeyboardDoubleArrowRight } from "react-icons/md";

function Main() {

  const { appData, setAppDataValues } = useAppContext();

  const [basicLoading, setBasicLoading] = useState(true);
  // 學生清單
  const [studentList, setStudentList] = useState([]);

  //選擇的學生 
  const [studentID, setStudent] = useState(appData.studentID);

  // 該學生的所有課程學年期
  const [courseSemesterRange, setCourseSemesterList] = useState([]);

  // 該學生的指定學年期的評量清單
  const [courseExamList, setCourseExamList] = useState([]);

  //系統學年期 
  const currSemester = appData.currentSemester;

  //當前顯示學年期 
  const [selectedSemester, setViewSemester] = useState(appData.semester);

  //當前顯示評量ID 
  const [selectedExam, setViewExam] = useState(appData.examID);

  //當前顯示排名類別 
  const [selectedRankType, setViewRankType] = useState(appData.rankType);

  // 該學生的指定學年期、指定評量 之排名類別
  const [examRankType, setRankType] = useState([]);

  // 該校設定要顯示加權平均"分數"還是算術平均"分數" (desktop設定需要同時更新才可生效)
  const [avgSetting, setAvgSetting] = useState('加權平均');

  // 該校設定 不顯示排名(true:不顯示，false:顯示) ... 因為過去desktop選項是"不顯示排名"則值=true，所以比較拗口 (desktop設定需要同時更新才可生效)
  const [showNoRankSetting, setShowNoRankSetting] = useState(true);

  //取得 判斷加權平均、算術平均 的及格標準分數
  const [avgPassingStandard, setAvgPassingStandard] = useState(60);

  // 該學生的指定學年期、每次評量 之加權平均&算術平均 (即時)
  const [examAvgList, setExamAvgList] = useState([]);
  const [examAvgFilteredList, setExamAvgFilteredList] = useState([]);

  // 計算該次評量的不及格科目數
  const [failedCount, setFailedCount] = useState(0);


  //******************* */
  // 該學生的指定學年期的課程成績
  const [courseExamScore, setCourseExamScore] = useState([]);

  // 該學生的指定學年期的課程成績 再加上 總計成績
  const [courseExamScorePlusAvg, setCourseExamScorePlusAvg] = useState([]);

  // 該學生的指定學年期的定期評量固定排名資料
  const [examRankMatrix, setRankMatrix] = useState([]);


  // 該學生的指定學年期的 "加權/算術"平均 固定排名及分數
  const [examAvgRankMatrix, setAvgRankMatrix] = useState([]);

  //******************* */

  const position = window.gadget.params.system_position;

  useEffect(() => {
    const init = async () => {
      try {
        setBasicLoading(true);
        if (!currSemester)
          await GetCurrentSemester();

        await Promise.all([GetStudentList(), GetViewSetting()]);

      } catch (error) {
        console.error("init Error:", error);
      } finally {
        setBasicLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (studentID)
      GetCourseSemesterList();
  }, [studentID]);


  useEffect(() => {
    if (studentID && selectedSemester) {
      GetCourseExamList();
      GetAllExamScore();
      GetRankInfo()
      GetExamAvgScore();
      GetScoreCalcRulePassingStandard();
      GetExamAvgRankMatrix();
    }
  }, [studentID, selectedSemester]);

  useEffect(() => {
    if (selectedSemester && selectedExam)
      GetRankType();
  }, [selectedSemester, selectedExam, studentID]);


  useEffect(() => {
    if (selectedExam && selectedSemester && courseExamScore)
      CountFailedExamSubject();
  }, [selectedExam, selectedSemester, courseExamScore]);

  useEffect(() => {
    if (examAvgList)
      filterExamAvgList(examAvgList);
    else
      setExamAvgFilteredList([]);
  }, [examAvgList]);

  var _connection = window.gadget.getContract("1campus.h.exam.parent");

  if (position === 'student')
    _connection = window.gadget.getContract("1campus.h.exam.student");

  /** 取得系統學年期 */
  const GetCurrentSemester = async () => {
    return new Promise((resolve, reject) => {
      _connection.send({
        service: "_.GetCurrentSemester",
        body: {},
        result: (response, error) => {
          if (error) {
            console.log('GetCurrentSemester Error:', error);
            return reject(error);
          }
          const currentSemester = response.CurrentSemester.schoolyear + response.CurrentSemester.semester;
          setAppDataValues({
            currentSemester: currentSemester
          });
          resolve(currentSemester);
        }
      });
    });
  };

  /** 取得顯示 加權平均、算術平均 或不顯示排名 */
  const GetViewSetting = async () => {
    return new Promise((resolve, reject) => {
      _connection.send({
        service: "_.GetViewSetting",
        body: {},
        result: (response, error) => {
          if (error) {
            console.log('GetViewSetting Error:', error);
            return reject(error);
          }
          const isShowRank = response?.Setting?.show_no_rank?.toLowerCase() === 'true';
          setShowNoRankSetting(isShowRank);
          setAvgSetting(response.Setting.show_score);
          resolve(isShowRank);
        }
      });
    });
  };
  /** 取得學生清單 */
  const GetStudentList = async () => {
    return new Promise((resolve, reject) => {
      _connection.send({
        service: "_.GetStudentList",
        body: {},
        result: (response, error) => {
          if (error) {
            console.log('GetStudentList Error:', error);
            return reject(error);
          }
          const studentList = [].concat(response.Student || []);
          const defaultStudent = studentList[0]?.id;
          setStudentList(studentList);
          if (!studentID) {
            setStudent(defaultStudent);
          } else {
            var temp = false;
            studentList.forEach(stu => {
              if (stu.id === studentID) {
                setStudent(studentID);
                temp = true;
              }
            });
            if (!temp) {
              setStudent(defaultStudent);
            }
          }
          resolve(studentList);
        }
      });
    });
  };

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
                //localStorage.clear();
                setAppDataValues({
                  isBack: false
                });

              }
              else if (sameInCourse)
                setViewSemester(tempSelectedSemester);
              else if (sameAsCurrency) {
                setViewSemester(currSemester);
                //localStorage.clear();
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
  // 取得判斷加權平均、算術平均 的及格標準分數 
  async function GetScoreCalcRulePassingStandard() {
    await _connection.send({
      service: "_.GetScoreCalcRulePassingStandard",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetScoreCalcRulePassingStandardError', error);
          return 'err';
        } else {
          if (response) {
            if ([].concat(response.Rule || []).length) {
              if (response.Rule.passing_standard !== '')
                setAvgPassingStandard(response.Rule.passing_standard);
              //console.log('GetScoreCalcRulePassingStandard', response.Rule.passing_standard);
            }
          }
        }
      }
    });
  }

  // 取得 各評量 加權平均、算術平均  
  async function GetExamAvgScore() {
    await _connection.send({
      service: "_.GetExamAvgScore",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetExamAvgScore', error);
          return 'err';
        } else {
          if (response) {
            setExamAvgList(response.ExamAvg);
            //console.log('response.ExamAvg', response.ExamAvg);
          }
        }
      }
    });
  }

  // 取得指定學年期的排名類別
  async function GetRankType() {
    await _connection.send({
      service: "_.GetRankType",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester,
        ExamID: selectedExam
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetRankTypeError', error);
          setViewRankType('');
          return 'err';
        } else {
          if (response) {
            setRankType([].concat(response.RankType || []));
            //console.log({ examRankType: response.RankType })
            if ([].concat(response.RankType || []).length) {
              if (selectedRankType === '' || selectedRankType === null)
                setViewRankType([].concat(response.RankType || [])[0].rank_type);
            }
          }
        }
      }
    });
  }

  //取得指定學年期的固定排名
  async function GetRankInfo() {
    await _connection.send({
      service: "_.GetRankInfo",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetRankInfoError', error);
          return 'err';
        } else {
          if (response) {
            setRankMatrix([].concat(response.RankMatrix || []));
          }
        }
      }
    });
  }

  // 取得指定學年期的課程評量成績
  async function GetAllExamScore() {
    await _connection.send({
      service: "_.GetAllExamScore",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetAllExamScoreError', error);
          return 'err';
        } else {
          if (response) {
            setCourseExamScore([].concat(response.ExamScore || []));
          }
        }
      }
    });
  }

  // 該學生的指定學年期的 "加權/算術"平均 固定排名及分數
  async function GetExamAvgRankMatrix() {
    await _connection.send({
      service: "_.GetExamAvgRankMatrix",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetExamAvgRankMatrix Error', error);
          return 'err';
        } else {
          if (response) {
            setAvgRankMatrix([].concat(response.RankMatrix || []));
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

  const handleShowRankDetail = (e) => {
    let score = null;
    let scoreType = '';
    [].concat(e.Field || []).forEach(f => {
      if (f.ExamID === selectedExam || '') {
        score = f.Score;
        scoreType = f.ScoreType;
      }
    })

    setAppDataValues({
      studentID: studentID,
      examID: selectedExam,
      rankType: selectedRankType,
      courseID: e.CourseID,
      semester: selectedSemester,
      subject: e.Subject,
      passingStandard: e.PassingStandard,

      domain: e.Domain,
      score: score,
      scoreType: scoreType,
    });
  };

  const handleShowAvgRankDetail = (e) => {
    let score = null;
    [].concat(e.Field || []).forEach(f => {
      if (f.ExamID === selectedExam || '') {
        score = f.Score;
      }
    })

    setAppDataValues({
      studentID: studentID,
      examID: selectedExam,
      rankType: selectedRankType,
      courseID: 0,
      semester: selectedSemester,
      subject: e.ItemName,
      passingStandard: avgPassingStandard,

      domain: '',
      score: score,
      scoreType: '',
    });
  };

  const handleChangeViewRank = (e) => {
    setViewRankType(e.target.value);
  };

  // 處理 該評量 不及格科目數
  function CountFailedExamSubject() {
    let failCount = 0;
    if (Object.keys(courseExamScore).length)
      courseExamScore.forEach(ces => {
        [].concat(ces.Field || []).forEach(e => {
          if (selectedExam === e.ExamID) {
            if (e.IsPass === 'f' && ces.Subject !== avgSetting && e.Score !== '') {
              failCount++;
            }
          }
        });

      });
    setFailedCount(failCount);
  }

  function filterExamAvgList(examAvgList) {
    const filteredList = examAvgList.map(item => ({
      ...item,
      Field: item.Field.filter((exam, index, self) =>
        index === self.findIndex((e) => e.ExamID === exam.ExamID)
      ),
    }));

    setExamAvgFilteredList(filteredList);
  }

  function ConvertStudentName(name) {
    const htmlText = `${name}`

    return <div dangerouslySetInnerHTML={{ __html: htmlText }} />;
  }

  //若有其中一科目是不開放查詢，則最後不會顯示 "不及格科目數"
  let isShowFailSubjectCount = true;

  return (
    <div className="App">
      {basicLoading && <Loading />}
      {
        (!!!basicLoading) && (
          <div className="container px-3 px-sm-4 py-5 ">
            <div className='titleBorder d-flex align-items-center'>
              <div>
                <div className='ms-2 me-4 d-flex align-items-center fs-4'>評量成績</div>
                {position === 'student' ? '' :
                  <div className='putLeft'>
                    {studentList.map((student) => {
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
              <div className='col-12 col-md-3 col-lg-3  py-2'>
                <select className="form-select" value={selectedSemester} onChange={(e) => handleChangeViewSemester(e)} >
                  {[].concat(courseSemesterRange || []).length < 1 ? <option value="Y" key="Y">(選擇學年度學期)</option> : <></>}
                  {courseSemesterRange.map((courseSemester, index) => {
                    return <option key={index} value={courseSemester.schoolyear + courseSemester.semester}>
                      {courseSemester.schoolyear}學年度第{courseSemester.semester}學期</option>
                  })}
                </select>
              </div>
              <div className='col-12 col-md-3 col-lg-3  py-2'>
                <select className="form-select" value={selectedExam} onChange={(e) => handleChangeViewExam(e)}>
                  <option value="0" key="Y">總覽</option>
                  {courseExamList.map((examList, index) => {
                    return <option key={index} value={examList.exam_id}>
                      {examList.exam_name}</option>
                  })}
                </select>
              </div>
              {selectedExam === '0' || selectedExam === null || showNoRankSetting ? '' :

                <div className="col-12 col-md-6 col-lg-6  py-2">
                  <div className='d-flex align-items-center text-nowrap'>
                    <div className='pe-1'>排名類別</div><select className="form-select" value={selectedRankType} onChange={(e) => handleChangeViewRank(e)}>

                      {[].concat(examRankType || []).length < 1 ? <option value="Y" key="Y">(尚無排名資料)</option> : ''}
                      {examRankType.map((rankType, index) => {
                        return <option key={index} value={rankType.rank_type}>
                          {rankType.rank_type}</option>
                      })}
                    </select></div>
                </div>
              }

            </div>


            <div>{[].concat(courseExamScore || []).length < 1 ? '尚無資料。' : ''}</div>

            {/* <div className="row row-cols-1 row-cols-md-2 g-4 "> */}{/* 兩排 */}
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 "> {/* 三排 */}
              {/* 評量成績 */}
              {[].concat(courseExamScore || []).map((ces) => {
                let col = 'col-6 col-md-6 col-lg-3 my-2';
                if (showNoRankSetting || (!showNoRankSetting && [].concat(examRankType || []).length < 1))//不顯示排名(只有分數) || 顯示排名但沒排名
                  col = 'col-12 my-2';


                return <>
                  {[].concat(ces.Field || []).map((cField, index) => {
                    if (cField.ExamID === selectedExam) {
                      let roundColor = '#A9D18E';
                      let passColor = 'card card-pass shadow h-100';
                      let scoreColor = 'fs-4 me-0 pe-0';
                      let show = null;
                      let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';

                      if (cField.IsPass === 'f') {
                        roundColor = '#FF0000';
                        passColor = 'card card-unpass shadow h-100';
                        scoreColor = 'fs-4 text-danger me-0 pe-0';
                      }

                      if (cField.ReportValue !== '') {
                        scoreColor = 'fs-4 text-danger me-0 pe-0';
                      }


                      // 檢查是否有相對應的排名
                      let matchingItem = false;
                      [].concat(examRankMatrix || []).forEach((rank) => {

                        if (rank.ItemName === ces.Subject) {
                          [].concat(rank.Field || []).forEach((rField) => {
                            if (rField.ExamID === selectedExam && rField.RankType === selectedRankType) {
                              matchingItem = true;
                            }
                          })
                        }
                      });


                      if (matchingItem) {
                        show = '/RankDetail';
                      } else {
                        show = '/RankDetailImmediately';
                      }


                      // 沒成績 不能看
                      if (cField.Score === '') {
                        roundColor = '#5B9BD5';
                        scoreColor = 'fs-4 me-0 pe-0';
                        passColor = 'card shadow h-100';
                        show = null;
                        disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                      }

                      //時間未到 不能看
                      if (cField.ToView === 'f' || ces.Subject === avgSetting) {
                        roundColor = '#5B9BD5';
                        passColor = 'card shadow h-100';
                        if (cField.ToView === 'f') {
                          disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                          show = null;
                          isShowFailSubjectCount = false;
                        }
                      }

                      // if ([].concat(examRankType || []).length < 1) {
                      //   show = null;
                      //   disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                      // }


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
                                {ces.Subject === avgSetting ? <></> : <div className='rounded-circle me-1' style={{ width: '10px', height: '10px', background: roundColor }}></div>}
                                {/* <div className='rounded-circle me-1' style={{ width: '10px', height: '10px', background: roundColor }}></div> */}
                                <div className='text-subject text-start'>{ces.Domain === "" ? "" : ces.Domain + "-"}{ces.Subject}</div>
                              </div>
                              <div className='d-flex text-small pt-2 pe-2' >
                                <div>{ces.Subject === avgSetting ? '' : '權數'}{ces.Credit}</div>
                              </div>
                            </div>

                            <div className='row align-items-center'>

                              {cField.ToView === 'f' ? <div><div>未開放查詢。</div> <div>開放查詢時間：{cField.ToViewTime}</div></div> :
                                <div className={col}>
                                  <div className='row align-items-center'>
                                    <div className='d-flex justify-content-center'>
                                      <div className='row align-items-center'>
                                        <div className={scoreColor}>{cField.Score === '' ? '-' : cField.Score}</div>
                                        <div className='text-small me-0 pe-0'>分數</div>
                                      </div>

                                      <div>{index === 0 || cField.ToView === 'f' || cField.Score === '' || ces.Field[im].Score === '' ?
                                        <img className='arrow' /> :
                                        Number(ces.Field[index].Score) > Number(ces.Field[im].Score) ? <img className='arrow' src={up} alt='↑' />
                                          : Number(ces.Field[index].Score) < Number(ces.Field[im].Score) ? <img className='arrow' src={down} alt='↓' />
                                            : <img className='arrow' />}</div>

                                    </div>
                                  </div>
                                </div>
                              }

                              {[].concat(examRankMatrix || []).map((rank, index) => {
                                if (cField.ToView === 't')
                                  if (rank.ItemName === ces.Subject) {
                                    let previousExamRank = '0';
                                    return <>
                                      {[].concat(rank.Field || []).map((rField, index) => {

                                        if (rField.RankType === selectedRankType && rField.ExamID === previousExamID)
                                          previousExamRank = rField.Rank;

                                        if (rField.RankType === selectedRankType && rField.ExamID === selectedExam && !showNoRankSetting)
                                          return <>
                                            <div className={col}>
                                              <div className='d-flex justify-content-center'>
                                                <div className='row align-self-center'>
                                                  <div className='fs-4 pe-0 me-0'>{rField.Rank}</div>
                                                  <div className='text-small pe-0 me-0'>名次</div>
                                                </div>

                                                <div>{previousExamRank === '0' || previousExamID === '' || rField.Rank === '' || previousExamRank === '' ?
                                                  <img className='arrow' /> : Number(rField.Rank) > Number(previousExamRank) ? <img className='arrow' src={down} alt='↓' />
                                                    : Number(rField.Rank) === Number(previousExamRank) ?
                                                      <img className='arrow' /> : <img className='arrow' src={up} alt='↑' />}</div>
                                              </div>
                                            </div>
                                            <div className={col}>
                                              <div className='d-flex justify-content-center'>
                                                <div className='row align-self-center'>
                                                  <div className='fs-4'>{rField.PR}</div>
                                                  <div className='text-small'>PR</div>
                                                </div>
                                              </div>
                                            </div>

                                            <div className={col}>
                                              <div className='d-flex justify-content-center'>
                                                <div className='row align-self-center'>
                                                  <div className='fs-4'>{rField.Percentile}</div>
                                                  <div className='text-nowrap text-small'>百分比</div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                                          <MdKeyboardDoubleArrowRight />
                                          更多
                                        </div> */}

                                          </>
                                      })}

                                    </>
                                  }
                              })}

                              {show === '/RankDetail' ?
                                <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                                  <MdKeyboardDoubleArrowRight />
                                  更多
                                </div> :
                                show === '/RankDetailImmediately' ?
                                  <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                                    <MdKeyboardDoubleArrowRight />
                                    組距
                                  </div>
                                  : <></>
                              }

                            </div>


                          </Link>
                        </div>
                      </div>
                      </div>
                    }

                  })}
                </>
              })}

              {/* 評量成績 的加權平均*/}
              {selectedExam !== '0' ?
                <div className="col">
                  {[].concat(examAvgList || []).map((examAvg) => {
                    if (examAvg.ItemName === avgSetting) {
                      //console.log('examAvg.ItemName', examAvg);
                      let col = 'col-6 col-md-6 col-lg-3 my-2';
                      if (showNoRankSetting)//不顯示排名(只有分數) 
                        col = 'col-12 my-2';
                      return <>
                        {[].concat(examAvg.Field || []).map((avgField, index) => {
                          //console.log('examAvg.Field ', avgField);
                          // console.log('selectedRankType', selectedRankType);
                          if (avgField.ExamID === selectedExam)
                            //此評量有計算排名
                            if (avgField.RankType) {
                              //console.log('此評量有計算排名examAvg.Field', examAvg.Field);
                              if (avgField.RankType === selectedRankType) {
                                let show = '/RankDetail';
                                let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';

                                // if (!avgField.RankScore)
                                //   show = '/RankDetailImmediately';
                                if (avgField.ToView === 'f') {
                                  show = null;
                                  disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                                }

                                let im = 0;
                                let previousExamID = selectedExam;

                                if (index !== 0) {
                                  im = index - 1;
                                  previousExamID = examAvg.Field[im].ExamID;
                                }

                                return <>
                                  <div className='card shadow h-100'>
                                    <div className="card-body">
                                      <div className='d-flex'>
                                        <div className='d-flex me-auto p-2 align-items-center'>
                                          <div className='text-subject'>{avgSetting}</div>
                                        </div>
                                      </div>
                                      <Link className={disabledCursor} to={show} onClick={() => { handleShowAvgRankDetail(examAvg); }}>
                                        <div className='row align-items-center'>

                                          {avgField.ToView === 'f' ? <div><div>未開放查詢。</div> <div>開放查詢時間：{avgField.ToViewTime}</div></div> :
                                            <div className={col}>
                                              <div className='row align-items-center'>
                                                <div className='d-flex justify-content-center'>
                                                  <div className='row align-items-center'>

                                                    {avgField.Score !== '' && Number(avgField.Score) < avgPassingStandard ?
                                                      <div className='fs-4 text-danger me-0 pe-0'>{Math.round(Number(avgField.Score) * 100) / 100}</div>
                                                      : <div className='fs-4 me-0 pe-0'>{avgField.Score === '' ? '-' : Math.round(Number(avgField.Score) * 100) / 100}</div>}

                                                    <div className='text-small me-0 pe-0'>分數</div>
                                                  </div>

                                                  <div>{index === 0 || avgField.Score === '' || examAvg.Field[im].Score === '' ? '' : Number(examAvg.Field[index].Score) > Number(examAvg.Field[im].Score) ? <img className='arrow' src={up} alt='↑' /> : Number(examAvg.Field[index].Score) < Number(examAvg.Field[im].Score) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                                </div>
                                              </div>
                                            </div>
                                          }

                                          {showNoRankSetting || avgField.ToView === 'f' ? '' : <><div className={col}>
                                            <div className='d-flex justify-content-center'>
                                              <div className='row align-self-center'>
                                                <div className='fs-4 pe-0 me-0'>{avgField.Rank}</div>
                                                <div className='text-small pe-0 me-0'>名次</div>
                                              </div>

                                              <div>{previousExamID === '' || avgField.Rank === '' || examAvg.Field[im].Rank === '' ? '' : Number(avgField.Rank) > Number(examAvg.Field[im].Rank) ? <img className='arrow' src={down} alt='↓' /> : Number(avgField.Rank) === Number(examAvg.Field[im].Rank) ? '' : <img className='arrow' src={up} alt='↑' />}</div>
                                            </div>
                                          </div>

                                            <div className={col}>
                                              <div className='d-flex justify-content-center'>
                                                <div className='row align-self-center'>
                                                  <div className='fs-4'>{avgField.PR}</div>
                                                  <div className='text-small'>PR</div>
                                                </div>
                                              </div>
                                            </div>

                                            <div className={col}>
                                              <div className='d-flex justify-content-center'>
                                                <div className='row align-self-center'>
                                                  <div className='fs-4'>{avgField.Percentile}</div>
                                                  <div className='text-nowrap text-small'>百分比</div>
                                                </div>
                                              </div>
                                            </div>

                                            <div className='d-flex align-items-center justify-content-between mt-2'>
                                              <div className='text-start text-mark'>此成績為科目成績即時運算而得。</div>
                                              <div className="d-flex align-items-center text-nowrap text-more">
                                                <MdKeyboardDoubleArrowRight />
                                                更多
                                              </div>
                                            </div>
                                          </>}

                                        </div>
                                      </Link>
                                    </div>
                                  </div>
                                </>
                              }
                            }
                            else {
                              //console.log('此評量沒有計算排名examAvg.Field', examAvg.Field);
                              //此評量沒計算排名avgField.RankType===''
                              let show = '/RankDetailImmediately';
                              let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';

                              if (avgField.ToView === 'f') {
                                show = null;
                                disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                              }

                              let im = 0;
                              let previousExamID = selectedExam;

                              if (index !== 0) {
                                im = index - 1;
                                previousExamID = examAvg.Field[im].ExamID;
                              }

                              return <>
                                <div className='card shadow h-100'>
                                  <div className="card-body">
                                    <div className='d-flex'>
                                      <div className='d-flex me-auto p-2 align-items-center'>
                                        <div className='text-subject'>{avgSetting}</div>
                                      </div>
                                    </div>
                                    <Link className={disabledCursor} to={show} onClick={() => { handleShowAvgRankDetail(examAvg); }}>
                                      <div className='row align-items-center'>

                                        {avgField.ToView === 'f' ? <div><div>未開放查詢。</div> <div>開放查詢時間：{avgField.ToViewTime}</div></div> :
                                          <>
                                            <div className='col-12 my-2'>
                                              <div className='row align-items-center'>
                                                <div className='d-flex justify-content-center'>
                                                  <div className='row align-items-center'>

                                                    {avgField.Score !== '' && Number(avgField.Score) < avgPassingStandard ?
                                                      <div className='fs-4 text-danger me-0 pe-0'>{Math.round(Number(avgField.Score) * 100) / 100}</div>
                                                      : <div className='fs-4 me-0 pe-0'>{avgField.Score === '' ? '-' : Math.round(Number(avgField.Score) * 100) / 100}</div>}

                                                    <div className='text-small me-0 pe-0'>分數</div>
                                                  </div>

                                                  <div>{index === 0 || avgField.Score === '' || examAvg.Field[im].Score === '' ? '' : Number(examAvg.Field[index].Score) > Number(examAvg.Field[im].Score) ? <img className='arrow' src={up} alt='↑' /> : Number(examAvg.Field[index].Score) < Number(examAvg.Field[im].Score) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>

                                                </div>
                                              </div>
                                            </div>

                                            <div className='d-flex align-items-center justify-content-between mt-2'>
                                              <div className='text-start text-mark'>此成績為科目成績即時運算而得。</div>
                                              <div className="d-flex align-items-center text-nowrap text-more">
                                                <MdKeyboardDoubleArrowRight />
                                                組距
                                              </div>
                                            </div>
                                          </>
                                        }

                                      </div>
                                    </Link>
                                  </div>
                                </div>
                              </>
                            }
                        })}
                      </>
                    }


                  })}
                  {/* </div>
              </div> */}
                </div>


                : <></>}


              {/* {總覽} */}

              {[].concat(courseExamScore || []).map((nces) => {

                if (selectedExam === '0') {
                  return <div className="col">
                    <div className={nces.Subject === avgSetting ? 'card shadow h-100' : 'card card-pass shadow h-100'}>
                      <div className="card-body">
                        <div className="card-block">
                          <div className='d-flex'>
                            <div className='d-flex me-auto p-2 align-items-center'>
                              {nces.Subject === avgSetting ? <></> : <div className='rounded-circle me-1' style={{ width: '10px', height: '10px', background: '#8FAADC' }}></div>}

                              <div className='text-subject'>{nces.Domain === "" ? "" : nces.Domain + "-"}{nces.Subject}</div>
                            </div>
                            <div className='d-flex text-small pt-2 pe-2' >
                              <div>{nces.Subject === avgSetting ? '' : '權數'}{nces.Credit}</div>
                            </div>
                          </div>

                          <div className='row align-items-center'>

                            {[].concat(nces.Field || []).map((nField, index) => {
                              let scoreColor = 'fs-4';
                              if (nField.IsPass === 'f' || nField.ReportValue !== '') {
                                scoreColor = 'fs-4 text-danger';
                              }
                              if (nField.ToView === 'f' || nField.Score === '') {
                                scoreColor = 'fs';
                              }

                              let im = 0;
                              if (index !== 0)
                                im = index - 1
                              return <div className='col-6 col-md-6 col-lg-6'>
                                <div className='row align-items-center m-2'>
                                  <div className='d-flex justify-content-center'>
                                    <div className={scoreColor}>{nField.ToView === 't' ? nField.Score === '' ? '-' : nField.Score : <div className='text-unview'><div>開放查詢時間：</div><div>{nField.ToViewTime}</div></div>}
                                    </div>
                                    <div>{index === 0 || nField.ToView === 'f' || nField.Score === '' || nces.Field[im].Score === '' ? '' : Number(nces.Field[index].Score) > Number(nces.Field[im].Score) ? <img className='arrow' src={up} alt='↑' /> : Number(nces.Field[index].Score) < Number(nces.Field[im].Score) ? <img className='arrow' src={down} alt='↓' /> : ''}</div>
                                  </div>
                                  <div className='text-small'>{nField.ExamName}</div>
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

              {/* {總覽 平均} */}
              {[].concat(examAvgFilteredList || []).map((eaf) => {
                if (eaf.ItemName === avgSetting) {

                  if (selectedExam === '0') {
                    return <div className="col">
                      <div className='card shadow h-100'>
                        <div className="card-body">
                          <div className="card-block">
                            <div className='d-flex'>
                              <div className='d-flex me-auto p-2 align-items-center'>
                                <div className='text-subject'>{eaf.ItemName}</div>
                              </div>
                            </div>

                            <div className='row align-items-center'>

                              {[].concat(eaf.Field || []).map((nField, index) => {
                                let scoreColor = 'fs-4';
                                if (Number(nField.Score) < avgPassingStandard) {
                                  scoreColor = 'fs-4 text-danger';
                                }
                                if (nField.Score === '') {
                                  scoreColor = 'fs';
                                }

                                let im = 0;
                                if (index !== 0)
                                  im = index - 1

                                return <div className='col-6 col-md-6 col-lg-6'>
                                  <div className='row align-items-center m-2'>
                                    <div className='d-flex justify-content-center'>

                                      <div className={scoreColor}>
                                        {nField.ToView === 't' ?
                                          nField.Score === '' ? '-' : Math.round(Number(nField.Score) * 100) / 100 :
                                          <div className='text-unview'>
                                            <div>開放查詢時間：</div><div>{nField.ToViewTime}</div>
                                          </div>}
                                      </div>
                                      <div>
                                        {index === 0 || nField.ToView === 'f' || nField.Score === '' || eaf.Field[im].Score === '' ? '' :
                                          Number(eaf.Field[index].Score) > Number(eaf.Field[im].Score) ? <img className='arrow' src={up} alt='↑' /> :
                                            Number(eaf.Field[index].Score) < Number(eaf.Field[im].Score) ? <img className='arrow' src={down} alt='↓' /> :
                                              ''}
                                      </div>
                                    </div>
                                    <div>{nField.ExamName}</div>
                                  </div>
                                </div>
                              })}
                              <div className='text-start text-mark mt-2'>此成績為科目成績即時運算而得。</div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  }
                }
              })}

            </div>

            {!isShowFailSubjectCount || selectedExam === '0' || selectedExam === null ? "" : <div>
              <div className='d-flex justify-content-left'>
                <div>不及格科目數：</div><div>{failedCount}</div>
              </div>
            </div>}

            <ScrollToTopButton />

          </div>
        )
      }
    </div>
  );
}

export default Main;



