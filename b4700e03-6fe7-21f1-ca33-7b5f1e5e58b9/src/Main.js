import React, { useState, useEffect } from 'react';
import './App.css';
import { Link } from 'react-router-dom';
// import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
// import Popover from 'react-bootstrap/Popover';
import ScrollToTopButton from './ScrollToTopButton';
import { useAppContext } from './AppContext';

function Main() {

  const { appData, setAppDataValues } = useAppContext();

  // 學生清單
  const [studentDateRange, setStudentList] = useState([]);

  //選擇的學生 //localStorage
  const [studentID, setStudent] = useState(appData.studentID);

  // 該學生的所有學期成績 學年期
  const [semesterRange, setSubjectScoreSemesterList] = useState([]);

  //系統學年期 
  const [currSemester, setCurrSemester] = useState("");

  //當前顯示學年期 //localStorage
  const [selectedSemester, setViewSemester] = useState(appData.semester);

  //當前顯示排名類別 //localStorage
  const [selectedRankType, setViewRankType] = useState(appData.rankType);

  // 該學生的指定學年期 之排名類別
  const [rankTypeList, setRankTypeList] = useState([]);

  //預設顯示成績
  const [showScore, setShowScore] = useState(true);

  //預設不顯示等第
  const [showDegree, setShowDegree] = useState(false);

  //預設不顯示排名
  const [showRank, setShowRank] = useState(false);

  //預設即時查看成績 = 現在可看成績
  const [showNow, setShowNow] = useState(true);

  //可查看成績起始日
  const [viewTime, setViewtime] = useState('');

  // 該學生的 指定 學年期的 學期科目成績
  const [semesterSubjectScore, setSemesterSubjectScore] = useState([]);

  // 該學生的 指定 學年期的 學期分項成績
  const [semesterEntryScore, setSemesterEntryScore] = useState([]);

  //指定學年期的 取得學分狀況
  const [semesterCredit, setSemesterCredit] = useState([]);

  // 該學生的 指定 學年期的 固定排名
  const [semesterRankMatrix, setRankMatrix] = useState([]);

  // 該學期的不及格科目數
  //const [failedSubjectCount, setFailedSubjectCount] = useState(0);

  const position = window.gadget.params.system_position;

  useEffect(() => {
    GetCurrentSemester();
    GetStudentList();
  }, []);


  useEffect(() => {
    if (studentID)
      GetSubjectScoreSemesterList();
  }, [studentID]);


  useEffect(() => {

    if (studentID && selectedSemester) {
      GetAllSemesterSubjectScore();
      GetAllSemesterEntryScore();
      GetSemesterCredit();
      GetRankInfo();
      GetRankType();
    }

  }, [studentID, selectedSemester]);


  // useEffect(() => {

  //   if (studentID && selectedSemester) {
  //     GetSemesterCredit();
  //   }
  // }, [studentID, selectedSemester]);



  useEffect(() => {
    if (selectedSemester)
      GetViewSetting();
  }, [selectedSemester]);



  var _connection = window.gadget.getContract("1campus.h.semester.parent");

  if (position === 'student')
    _connection = window.gadget.getContract("1campus.h.semester.student");

  // 取得顯示 時間、分數、等第、排名
  async function GetViewSetting() {
    await _connection.send({
      service: "_.GetViewSetting",
      body: {
        ViewSemester: selectedSemester,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetViewSettingError', error);
          return 'err';
        } else {
          if (response) {
            //console.log('Setting[]', [].concat(response.Setting || []));
            if ([].concat(response.Setting || []).length) {
              setShowRank(response.Setting.showrank.toLowerCase() === 'true');
              setShowNow(response.Setting.toview.toLowerCase() === 't');
              setViewtime(response.Setting.viewtime);
            }
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
                localStorage.clear();
                setStudent([].concat(response.Student || [])[0].id);
              }
            }
          }
        }
      }
    });
  }

  // 取得學期科目成績 學年期清單
  async function GetSubjectScoreSemesterList() {
    await _connection.send({
      service: "_.GetAllSubjectScoreSemester",
      body: {
        StudentID: studentID
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetAllSubjectScoreSemesterError', error);
          return 'err';
        } else {
          if (response) {//semesterRange
            if ([].concat(response.Semester || []).length) {
              //console.log('ScoreSemester[]', [].concat(response.Semester || []));
              setSubjectScoreSemesterList([].concat(response.Semester || []));
              var tempSelectedSemester = selectedSemester;

              //1. 返回，保持原來的學年期
              //2. 從別的學生點過來，且有一樣的學年期
              //3. 從別的學生點過來，且沒有一樣的學年期>>系統學年期
              //4. 上述情況都不符合，填入最新的學年期
              var sameInCourse = false; //有一樣的學年期
              var sameAsCurrency = false; //有一樣的系統學年期
              //if (selectedSemester) {
              [].concat(response.Semester || []).forEach(element => {
                if (element.schoolyear + element.semester === currSemester) {
                  sameAsCurrency = true;
                }
                if (element.schoolyear + element.semester === selectedSemester) {
                  sameInCourse = true;
                }

              });

              //* 先填入最新的學年期
              setViewSemester([].concat(response.Semester || [])[0].schoolyear + [].concat(response.Semester || [])[0].semester);

              // 再根據檢查結果填入學年期
              if (appData.isBack) {
                setViewSemester(tempSelectedSemester);
                setAppDataValues({
                  isBack: false
                });
              }
              else if (sameInCourse)
                setViewSemester(tempSelectedSemester);
              else if (sameAsCurrency) {
                setViewSemester(currSemester);
                localStorage.clear();
              }

            }
            else {
              setViewSemester('');
              setSubjectScoreSemesterList([]);
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
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetRankTypeError', error);
          setViewRankType('');
          return 'err';
        } else {
          if (response) {
            setRankTypeList([].concat(response.RankType || []));
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
          console.log('GetRankInfo', error);
          return 'err';
        } else {
          if (response) {
            setRankMatrix([].concat(response.RankMatrix || []));
          }
        }
      }
    });
  }


  // 取得指定學年期的 科目 成績
  async function GetAllSemesterSubjectScore() {
    await _connection.send({
      service: "_.GetAllSemesterSubjectScore",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          setSemesterSubjectScore([]);
          console.log('GetAllSemesterSubjectScoreError', error);
          return 'err';
        } else {
          if (response) {
            setSemesterSubjectScore([].concat(response.SemesterScore || []));
          }
        }
      }
    });
  }

  // 取得指定學年期的 分項 成績
  async function GetAllSemesterEntryScore() {
    await _connection.send({
      service: "_.GetAllSemesterEntryScore",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          setSemesterEntryScore([]);
          console.log('GetAllSemesterEntryScore Error', error);
          return 'err';
        } else {
          if (response) {
            setSemesterEntryScore([].concat(response.EntryScore || []));
          }
        }
      }
    });
  }

  // 取得指定學年期的 取得學分狀況
  async function GetSemesterCredit() {
    await _connection.send({
      service: "_.GetSemesterCredit",
      body: {
        StudentID: studentID,
        ViewSemester: selectedSemester
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetSemesterCredit Error', error);
          setSemesterCredit([]);
          return 'err';
        } else {
          if (response) {
            setSemesterCredit([].concat(response.SemesterCredit || []));
          }
        }
      }
    });
  }

  // 取得指定學年期的 不及格科目數
  async function GetFailedSemesterSubjectCount() {
    // await _connection.send({
    //   service: "_.GetFailedSemesterSubjectCount",
    //   body: {
    //     StudentID: studentID,
    //     ViewSemester: selectedSemester
    //   },
    //   result: function (response, error, http) {
    //     if (error !== null) {
    //       console.log('GetFailedSemesterSubjectCountError', error);
    //       return 'err';
    //     } else {
    //       if (response) {
    //         if ([].concat(response.Failed || []).length) {
    //           setFailedSubjectCount(response.Failed.failed_count);
    //         }
    //       }
    //     }
    //   }
    // });
  }


  const handleChangeStudent = (studentID) => {
    setStudent(studentID);
  }

  const handleChangeViewSemester = (e) => {
    setViewSemester(e.target.value);
  }

  // const handleSubjectType = (e) => {
  //   setSubjectType(Number(e.target.value));
  // }

  const handleShowRankDetail = (e) => {

    var subject = e.subject;
    var subjectType = 'subject';

    if (!e.subject) {
      subject = e.entry;
      subjectType = 'entry';
    }

    let entryOScore = null;
    if (subjectType === 'entry') {
      [].concat(semesterEntryScore || []).forEach(sem => {
        if (sem.entry.includes('原始') && sem.entry.includes(subject)) {
          entryOScore = sem.score;
        }
      })
    }

    setAppDataValues({
      studentID: studentID,
      rankType: selectedRankType,
      semester: selectedSemester,
      subject: subject,
      subjectType: subjectType,

      domain: e.domain,
      score: e.score,
      o_score: subjectType === 'subject' ? e.o_score : entryOScore,
      p_score: e.p_score,
      r_score: e.r_score,
      h_score: e.h_score,
      y_score: e.y_score,
      period: e.period,
      credit: e.credit,
      entry: e.entry,
      passingStandard: e.pass_standard,
      level: e.level,
      required_by: e.required_by,
      is_required: e.is_required,

    });
  };

  const handleShowCreditDetail = (e) => {

    // 按下去的時候才存
    // localStorage.setItem('StudentID', studentID);
    // localStorage.setItem('Semester', selectedSemester);

    const selectElement = document.getElementById("form-semester");
    //localStorage.setItem('SemesterText', selectElement.options[selectElement.selectedIndex].innerHTML);


    setAppDataValues({
      studentID: studentID,
      semester: selectedSemester,
      SemesterText: selectElement.options[selectElement.selectedIndex].innerHTML,

    });

  };

  const handleChangeViewRank = (e) => {
    setViewRankType(e.target.value);
  };

  // const handleOnMouseEnter = (index, target) => {
  //   setCurrentTargetIndex(index);
  //   setCurrentTarget(target);
  // }
  // const handleOnMouseLeave = () => {
  //   setCurrentTargetIndex('');
  //   setCurrentTarget('');
  // }

  function ConvertStudentName(name) {
    const htmlText = `${name}`

    return <div dangerouslySetInnerHTML={{ __html: htmlText }} />;
  }



  return (
    <div className="App">
      <div className="container px-3 px-sm-4 py-5 ">

        <div className='titleBorder d-flex align-items-center'>
          <div>
            <div className='ms-2 me-4 d-flex align-items-center fs-4'>學期成績</div>
            {position === 'student' ? '' :
              <div className='putLeft'>
                {studentDateRange.map((student) => {
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
          <div className='col-12 col-md-6 col-lg-3 py-2'>
            <select id='form-semester' className="form-select" value={selectedSemester} onChange={(e) => handleChangeViewSemester(e)} >
              {[].concat(semesterRange || []).length < 1 ? <option value="Y" key="Y">(選擇學年度學期)</option> : <></>}
              {semesterRange.map((semester, index) => {
                return <option key={index} value={semester.schoolyear + semester.semester}>
                  {semester.schoolyear}學年度第{semester.semester}學期</option>
              })}
            </select>
          </div>

          {!showRank ? '' :
            <div className='d-flex align-items-center text-nowrap col-12 col-md-6 col-lg-3 py-2'>
              <div className='pe-1'>排名類別</div>
              <select className="form-select" value={selectedRankType} onChange={(e) => handleChangeViewRank(e)}>

                {[].concat(rankTypeList || []).length < 1 ? <option value="Y" key="Y">(尚無排名資料)</option> : <></>}

                {rankTypeList.map((rankType, index) => {
                  return <option key={index} value={rankType.rank_type}>
                    {rankType.rank_type}</option>
                })}
              </select>
            </div>}

          {/* <div className='col-12 col-md-6 col-lg-3 text-start py-2'>
            {!showNow ? '' : '不及格科目數：' + failedDomainCount}
          </div> */}


        </div>


        <div>{[].concat(semesterSubjectScore || []).length < 1 ? '尚無成績資料。' : ''}</div>

        {/* 取得學分 */}
        {studentID && selectedSemester ?
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-4">
            <div className='col'>
              <div className="card card-credit shadow">
                <div className="card-body">
                  <Link className={showNow ? 'card-block stretched-link text-decoration-none link-dark' : 'card-block stretched-link text-decoration-none link-dark disabledCursor'}
                    to={showNow ? '/CreditDetail' : null} key='' onClick={() => { handleShowCreditDetail(); }}>
                    <div className='text-subject ms-3'>取得學分</div>
                    {!showNow ? <div className='' style={{ color: '#86B963' }}>開放查詢時間：{viewTime}</div> : <>
                      {[].concat(semesterCredit || []).map((credit, index) => {
                        return <div className='row row-cols-2' key={index}>
                          <div className='col'>
                            <div className='fs-4-blue text-nowrap'>{credit.studied_count === '' ? '-' : credit.studied_count}</div>
                            <div className='text-small'>已修學分</div>
                          </div>
                          <div className='col'>
                            <div className='fs-4-blue text-nowrap'>{credit.pass_count === '' ? '-' : credit.pass_count}</div>
                            <div className='text-small'>取得學分</div>
                          </div>
                        </div>
                      })}

                      <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more mt-2">
                        <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                        更多
                      </div>

                    </>}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          : ''}


        {/* 分項成績 */}
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-4">
          {[].concat(semesterEntryScore || []).map((ses, index) => {
            if (!ses.entry.includes('原始')) {
              //console.log('semesterEntryScore', semesterEntryScore);
              // let scoreMark = 'text-blue text-nowrap align-self-end';
              let col = 'col-12 my-2';

              // let passColor = 'card card-pass shadow h-100';
              let scoreColor = 'fs-4-blue text-nowrap';
              let show = '/RankDetail';
              let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';

              if ([].concat(rankTypeList || []).length < 1) {
                show = '/RankDetailImmediately'
              }

              // //如果沒有及格標準，直接當60
              // if (Number(ses.score) < 60) {
              //   // passColor = 'card card-unpass shadow h-100';
              //   scoreColor = 'fs-4 text-danger text-nowrap me-0 pe-0';
              //   // scoreMark = 'text-red text-nowrap align-self-end';
              // }
              if (!showNow) {
                // passColor = 'card shadow h-100';
                disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
                show = null;
                //isShowFailSubjectCount = false;
              }

              if (showRank && [].concat(rankTypeList || []).length > 0) {
                // 顯示排名 且 有排名 (共4個)
                col = 'col-6 col-md-3 col-lg-3 my-2';
              }

              if (!showRank || [].concat(rankTypeList || []).length < 1) {
                //不顯示排名 或 沒有排名 //只有分數
                col = 'col-12 my-2';
              }

              return <div className="col" key={index}>
                <div className='card shadow h-100'>

                  <div className="card-body">

                    <Link className={disabledCursor} to={show} key={ses.index} onClick={() => { handleShowRankDetail(ses); }}>
                      <div className='d-flex'>
                        <div className='d-flex me-auto pb-2 align-items-center'>
                          <div className='rounded-circle me-1' style={{ width: '10px', height: '10px' }}></div>
                          <div className='text-subject'>{ses.entry}成績</div>
                        </div>
                      </div>

                      <div className='row align-items-center p-2'>
                        {/* {!showNow ? <div><div>未開放查詢。</div> <div>開放查詢時間：{viewTime}</div></div> : <> */}
                        {!showNow ? <div className='' style={{ color: '#bf9000' }}>開放查詢時間：{viewTime}</div> : <>
                          <div className={col}>
                            <div>
                              <div className='d-flex justify-content-center' >
                                <div className={scoreColor}>{ses.score === '' ? '-' : ses.score}</div>
                              </div>
                              <div className='text-nowrap text-small'>分數</div>
                            </div>
                          </div>

                        </>
                        }

                        {[].concat(semesterRankMatrix || []).map((rank, index) => {
                          if (showRank && showNow)
                            if (rank.item_type === '學期/分項成績' && rank.rank_type === selectedRankType && rank.item_name === ses.entry) {
                              return <>
                                <div className={col}>
                                  <div>
                                    <div className='fs-4-blue text-nowrap'>{rank.rank}</div>
                                    <div className='text-nowrap text-small'>名次</div>
                                  </div>
                                </div>
                                <div className={col}>
                                  <div>
                                    <div className='fs-4-blue text-nowrap'>{rank.pr}</div>
                                    <div className='text-nowrap text-small'>PR</div>
                                  </div>
                                </div>
                                <div className={col}>
                                  <div>
                                    <div className='fs-4-blue text-nowrap'>{rank.percentile}</div>
                                    <div className='text-nowrap text-small'>百分比</div>
                                  </div>
                                </div>


                              </>
                            }
                        })}

                      </div>

                      {showNow ?
                        <div className="d-flex align-items-center justify-content-end text-nowrap text-end text-more">
                          <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                          更多
                        </div>
                        : ''}

                    </Link>
                  </div>
                </div>
              </div>
            }
          })}
        </div>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">

          {/* 科目成績 */}
          {[].concat(semesterSubjectScore || []).map((sss, index) => {
            //console.log('semesterSubjectScore', semesterSubjectScore);
            let scoreMark = 'text-blue text-nowrap align-self-end';
            let col = 'col-12 my-2';
            let roundColor = '#5b9bd5';//A9D18E
            let passColor = 'card card-pass shadow h-100';
            let scoreColor = 'fs-4-blue text-nowrap';
            let show = '/RankDetail';
            let disabledCursor = 'card-block stretched-link text-decoration-none link-dark';

            //如果沒有及格標準，直接當60
            // let passingScore = sss.pass_standard === '' ? 60 : Number(sss.pass_standard);
            // if (Number(sss.score) < passingScore) {


            if ([].concat(rankTypeList || []).length < 1) {
              show = '/RankDetailImmediately'
            }


            //如果未取得學分
            if (sss.is_pass !== '是') {
              roundColor = '#FF66CC';
              passColor = 'card card-unpass shadow h-100';
              scoreColor = 'fs-4 text-danger text-nowrap me-0 pe-0';
              scoreMark = 'text-red text-nowrap align-self-end';
            }
            if (!showNow) {
              passColor = 'card shadow h-100';
              disabledCursor = 'card-block stretched-link text-decoration-none link-dark disabledCursor';
              show = null;
              //isShowFailSubjectCount = false;
            }

            if (showRank && [].concat(rankTypeList || []).length > 0) {
              // 顯示排名 且 有排名 (共4個)
              col = 'col-6 col-md-3 col-lg-3 my-2';
            }

            if (!showRank || [].concat(rankTypeList || []).length < 1) {
              //不顯示排名 或 沒有排名 //只有分數
              col = 'col-12 my-2';
            }

            return <div className="col" key={index}>
              <div className={passColor}>

                <div className="card-body">

                  <Link className={disabledCursor} to={show} key={sss.index} onClick={() => { handleShowRankDetail(sss); }}>
                    <div className='d-flex'>
                      <div className='d-flex me-auto pb-2 align-items-center'>
                        {!showNow ? <div className='rounded-circle me-1' style={{ width: '10px', height: '10px' }}></div> : <div className='rounded-circle me-1' style={{ width: '10px', height: '10px', background: roundColor }}></div>}
                        <div className='text-subject'>{sss.domain === "" ? "" : sss.domain + "-"}{sss.subject}</div>
                      </div>
                      <div className='d-flex align-items-center' >
                        <div className='text-small'>{sss.entry}分項</div>
                      </div>
                    </div>

                    <div className='d-flex text-small ms-3'>級別{sss.level} {sss.required_by} {sss.is_required} {sss.credit}學分</div>

                    <div className='row align-items-center p-2'>
                      {/* {!showNow ? <div><div>未開放查詢。</div> <div>開放查詢時間：{viewTime}</div></div> : <> */}
                      {!showNow ? <div className='' style={{ color: '#bf9000' }}>開放查詢時間：{viewTime}</div> : <>
                        <div className={col}>
                          <div>
                            <div className='d-flex justify-content-center' >
                              <div className={scoreColor}>{sss.score === '' ? '-' : sss.score}</div>
                              <div className={scoreMark}>{sss.score_mark}</div>
                            </div>
                            <div className='text-nowrap text-small'>分數</div>
                          </div>
                        </div>

                      </>
                      }

                      {semesterRankMatrix.map((rank, index) => {
                        if (showRank && showNow)
                          if (rank.item_type === '學期/科目成績' && rank.rank_type === selectedRankType && rank.item_name === sss.subject) {
                            return <>
                              <div className={col}>
                                <div>
                                  <div className='fs-4-blue text-nowrap'>{rank.rank}</div>
                                  <div className='text-nowrap text-small'>名次</div>
                                </div>
                              </div>
                              <div className={col}>
                                <div>
                                  <div className='fs-4-blue text-nowrap'>{rank.pr}</div>
                                  <div className='text-nowrap text-small'>PR</div>
                                </div>
                              </div>
                              <div className={col}>
                                <div>
                                  <div className='fs-4-blue text-nowrap'>{rank.percentile}</div>
                                  <div className='text-nowrap text-small'>百分比</div>
                                </div>
                              </div>


                            </>
                          }
                      })}

                    </div>

                    {showNow ?
                      <div className="d-flex align-items-center justify-content-between text-nowrap text-end">
                        <div className="d-flex align-items-center text-start">
                          {sss.is_pass === '是' ?
                            <span className="material-symbols-outlined checkbox text-check">check_box</span>
                            : <span className="material-symbols-outlined checkbox">check_box_outline_blank</span>}

                          取得學分
                        </div>

                        <div className="d-flex align-items-center text-end text-more">
                          <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                          更多
                        </div>
                      </div>
                      : ''}

                  </Link>


                </div>
              </div>
            </div>

          })}



        </div>

        <ScrollToTopButton />

      </div>
    </div>
  );
}

export default Main;



