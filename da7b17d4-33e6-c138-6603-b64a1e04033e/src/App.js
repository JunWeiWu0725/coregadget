import React, { useState, useEffect } from 'react';
import './App.css';
import { HiInformationCircle } from "react-icons/hi2";



function App() {

  // 學生清單
  const [studentDateRange, setStudentList] = useState([]);

  //選擇的學生 
  const [studentID, setStudent] = useState('');

  // 班級清單
  const [classDateRange, setClassList] = useState([]);

  //選擇的班級 
  const [classID, setClass] = useState('');

  // 學期歷程
  const [allSemesters, setHistoryList] = useState([]);
  // const [semesterList, setHistoryList] = useState([]);

  // const allSemesters = [
  //   { name: "Semester1", title: "", days: "" },
  //   { name: "Semester2", title: "", days: "" },
  //   { name: "Semester3", title: "", days: "" },
  //   { name: "Semester4", title: "", days: "" },
  //   { name: "Semester5", title: "", days: "" },
  //   { name: "Semester6", title: "", days: "" }
  // ];

  // //整理學習歷程
  // const updatedSemesters = semesterList.map((semester) => {
  //   const semesterIndex = allSemesters.findIndex((s) => s.name === semester.name);
  //   allSemesters[semesterIndex].title = semester.title;
  //   allSemesters[semesterIndex].days = semester.days;
  //   return allSemesters[semesterIndex];
  // });


  //整理上課天數
  const totalDays = allSemesters.reduce((accumulator, semester) => {
    return accumulator + parseInt(semester.days);
  }, 0);



  // 學期成績
  const [scoreList, setScoreList] = useState([]);

  // 缺曠
  const [absenceList, setAbsenceList] = useState([]);

  // 缺曠總計
  const [totalAbsenceList, setTotalAbsenceList] = useState([]);

  // 獎懲
  const [disciplineList, setDisciplineList] = useState([]);

  // 成績畢業條件
  const [scoreCalcRule, setScoreCalcRule] = useState([]);

  // 學務畢業條件
  const [dailyCalcRule, setDailyCalcRule] = useState([]);

  // 等第對照表
  const [degreeList, setDegreeList] = useState([]);

  // 核可節次（有勾選"所有學期缺課結束合計未超過上課節數"才會有值）
  const [absenceAndPeriodsList, setAbsenceAndPeriods] = useState([]);


  const domainOrder = ['語文', '國語文', '英語', '本土語文', '數學', '社會', '自然科學', '自然與生活科技', '藝術', '藝術與人文', '健康與體育', '綜合活動', '科技'];

  const sortedScoreList = scoreList.sort((a, b) => {
    const aIndex = domainOrder.indexOf(a.Domain);
    const bIndex = domainOrder.indexOf(b.Domain);
    if (aIndex === -1 && bIndex === -1) {
      return 0;
    } else if (aIndex === -1) {
      return 1;
    } else if (bIndex === -1) {
      return -1;
    } else {
      return aIndex - bIndex;
    }
  });


  const position = window.gadget.params.system_position;

  var _connection = window.gadget.getContract("1campus.graduate.alarm.student");

  if (position === 'teacher')
    _connection = window.gadget.getContract("1campus.graduate.alarm.teacher");

  if (position === 'parent')
    _connection = window.gadget.getContract("1campus.graduate.alarm.parent");


  useEffect(() => {
    GetDegree();

    if (position === 'teacher')
      GetClass();
    else
      GetStudentList();

  }, []);

  useEffect(() => {
    if (position === 'teacher' && classID !== '') {
      GetStudentList();
    }
  }, [classID]);



  useEffect(() => {
    if (studentID !== '') {
      GetHistory();
      GetSemesterScore();
      GetScoreCalcRule();
      GetDailyCalcRule();
      GetDiscipline();
      GetAbsence();
      GetAbsenceAndPeriods();
      GetTotalAbsence();
    }
  }, [studentID]);





  // 取得學生清單
  async function GetStudentList() {
    await _connection.send({
      service: "_.GetStudentList",
      body: {
        ClassID: classID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetStudentList Error', error);
          return 'err';
        } else {
          if (response) {
            setStudentList([].concat(response.Student || []));

            // if (studentID === '' || studentID === null) {
            setStudent([].concat(response.Student || [])[0].id);
            // }
          }
        }
      }
    });
  }

  // 取得班級清單
  async function GetClass() {
    await _connection.send({
      service: "_.GetClass",
      body: {},
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetClass', error);
          return 'err';
        } else {
          if (response) {
            setClassList([].concat(response.Class || []));

            if (classID === '' || classID === null) {
              setClass([].concat(response.Class || [])[0].id);
            }
          }
        }
      }
    });
  }

  // 取得學習歷程
  async function GetHistory() {
    await _connection.send({
      service: "_.GetHistory",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetHistory Error', error);
          return 'err';
        } else {
          if (response) {
            setHistoryList([].concat(response.response || []));
          }
        }
      }
    });
  }
  // 取得學期成績
  async function GetSemesterScore() {
    await _connection.send({
      service: "_.GetSemesterScore",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetSemesterScoreError', error);
          return 'err';
        } else {
          if (response) {
            setScoreList([].concat(response.response || []));
          }
        }
      }
    });
  }

  // 取得缺曠
  async function GetAbsence() {
    await _connection.send({
      service: "_.GetAbsence",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetAbsence Error', error);
          return 'err';
        } else {
          if (response) {
            setAbsenceList([].concat(response.response || []));
            //console.log('GetAbsence', [].concat(response.response || []));
          }
        }
      }
    });
  }

  // 取得缺曠總計
  async function GetTotalAbsence() {
    await _connection.send({
      service: "_.GetTotalAbsence",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetTotalAbsence Error', error);
          return 'err';
        } else {
          if (response) {
            setTotalAbsenceList([].concat(response.response || []));
            //console.log('GetTotalAbsence', [].concat(response.response || []));
          }
        }
      }
    });
  }




  // 取得獎懲
  async function GetDiscipline() {
    await _connection.send({
      service: "_.GetDiscipline",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetDiscipline Error', error);
          return 'err';
        } else {
          if (response) {
            setDisciplineList([].concat(response.response || []));
          }
        }
      }
    });
  }

  // 取得核可假別
  async function GetAbsenceAndPeriods() {
    await _connection.send({
      service: "_.GetAbsenceAndPeriods",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetAbsenceAndPeriods Error', error);
          return 'err';
        } else {
          if (response) {
            setAbsenceAndPeriods([].concat(response.Rule || []));
            //console.log('GetAbsenceAndPeriods', [].concat(response.Rule || []));
          }
        }
      }
    });
  }

  // 取得成績畢業條件
  async function GetScoreCalcRule() {
    await _connection.send({
      service: "_.GetScoreCalcRule",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetScoreCalcRule Error', error);
          return 'err';
        } else {
          if (response) {
            setScoreCalcRule([].concat(response.Rule || []));
          }
        }
      }
    });
  }

  // 取得學務畢業條件
  async function GetDailyCalcRule() {
    await _connection.send({
      service: "_.GetDailyCalcRule",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetDailyCalcRule Error', error);
          return 'err';
        } else {
          if (response) {
            setDailyCalcRule([].concat(response.Rule || []));
            //console.log('GetDailyCalcRule', [].concat(response.response || []));
          }
        }
      }
    });
  }

  // 取得等第對照表
  async function GetDegree() {
    await _connection.send({
      service: "_.GetDegree",
      body: {
        StudentID: studentID,
      },
      result: function (response, error, http) {
        if (error !== null) {
          console.log('GetDegree Error', error);
          return 'err';
        } else {
          if (response) {
            setDegreeList([].concat(response.Rule || []));
          }
        }
      }
    });
  }

  const handleChangeStudent = (studentID) => {
    setStudent(studentID);
  }

  const handleChangeClass = (event) => {
    setClass(event.target.value);
  }
  const handleChangeClassStudent = (event) => {
    setStudent(event.target.value);
  }

  function ConvertStudentName(name) {
    const htmlText = `${name}`
    return <div dangerouslySetInnerHTML={{ __html: htmlText }} />;
  }

  return (
    <div className="App">
      <div className="container px-3 px-sm-4 py-5 ">
        <div className='title_border d-flex mb-2'>
          <div>
            <div className='ms-2 me-4 d-flex align-items-center fs-4'>畢業預警查詢</div>
            {position === 'parent' ? <div className='text-left'>
              {studentDateRange.map((student) => {
                if (student.id === studentID)
                  return <button type="button" className="btn btn-g active me-1 ms-1 mt-1" id={student.id} key={student.id} value={student.id} onClick={() => { handleChangeStudent(student.id); }} >{ConvertStudentName(student.name)}</button>
                else
                  return <button type="button" className="btn btn-g me-1 ms-1 mt-1" id={student.id} key={student.id} value={student.id} onClick={() => { handleChangeStudent(student.id); }}>{ConvertStudentName(student.name)}</button>
              })}
            </div> : <></>

            }

          </div>

        </div>

        {position === 'teacher' ? <div className='d-flex'>
          <div className='col-6 col-md-6 col-lg-3 pe-1 py-2'>
            <select className="form-select" value={classID} onChange={(e) => handleChangeClass(e)} >
              {[].concat(classDateRange || []).length < 1 ? <option value="Y" key="Y">(選擇班級)</option> : <></>}
              {classDateRange.map((cls, index) => {
                return <option key={cls.index} value={cls.id}>
                  {cls.class_name}
                </option>
              })}
            </select>
          </div>

          <div className="col-6 col-md-6 col-lg-3 ps-2 py-2">
            <select className="form-select" value={studentID} onChange={(e) => handleChangeClassStudent(e)}>
              {[].concat(studentDateRange || []).length < 1 ? <option value="Y" key="Y">(選擇學生)</option> : ''}
              {studentDateRange.map((stu, index) => {
                return <option key={stu.id} value={stu.id}>
                  {ConvertStudentName(stu.name)}
                </option>
              })}
            </select>
          </div>
        </div> : <></>}




        <div className="accordion-item " style={{ borderRadius: '5px', border: '0px solid #8A6D3B' }}>
          <h2 className="accordion-header" id="00">
            <button className="accordion-button align-items-end" type="button" data-bs-toggle="collapse" data-bs-target='#panel00' aria-expanded="false" aria-controls='panel00'>
              <div className='d-center'><HiInformationCircle /> <div className='ms-1'>領域成績說明 </div></div>
            </button>
          </h2>
          <div id='panel00' className="accordion-collapse collapse" aria-labelledby='00'>
            <div className="accordion-body pt-0">
              <div >

                {[].concat(scoreCalcRule || []).map((scr) => (
                  <>
                    <div className='d-center'> {scr.type === 'LearnDomainEach' && scr.checked === 'True' ?
                      '◇ 每學期' + scr.學習領域 + '個學習領域達' + scr.degree + '等以上，符合畢業資格。' : ''}</div>

                    <div className='d-center'> {scr.type === 'LearnDomainLast' && scr.checked === 'True' ?
                      '◇ 第六學期有' + scr.學習領域 + '個學習領域達' + scr.degree + '等以上，符合畢業資格。' : ''}</div>

                    <div className='d-center'> {scr.type === 'GraduateDomain' && scr.checked === 'True' ?
                      '◇ 所有學習領域有' + scr.學習領域 + '大學習領域以上畢業總平均成績' + scr.degree + '等以上，符合畢業資格。' : ''}</div>

                  </>

                ))}
                <div className='d-center'>◇ 成績等第對照：</div>

                {[].concat(degreeList || []).map((de) => (
                  <div className='d-center text-sm ms-3'>{de.degree}：{de.less !== '' ? '<' + de.less : ''}{de.less && de.greater_or_equal ? '，' : ''}{de.greater_or_equal !== '' ? '≧' + de.greater_or_equal : ''}</div>
                ))}

              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="table table-compact w-full">
            <thead>
              <tr>
                <th className="table-cell">
                  {/* <div className='text-end text-white'>學期</div> */}
                  <div>領域 / 學期</div>
                </th>

                {[].concat(allSemesters || []).map((semester) => (
                  <th style={{ background: '#a0cecb' }}>{semester.title}</th>
                ))}
                <th style={{ background: '#a0cecb' }}>平均</th>
              </tr>
            </thead>
            <tbody>

              {[].concat(sortedScoreList || []).map((score) => (
                <tr>
                  <th>{score.Domain}</th>
                  {[].concat(allSemesters || []).map((semester) => {
                    const matchedField = [].concat(score.Field || []).find((sf) => sf.SchoolYear + '-' + sf.Semester === semester.title);
                    return <td>{matchedField ? matchedField.Score : ''}</td>;
                  })}
                  <td>{score.Avg}</td>
                </tr>
              ))}



            </tbody>

          </table>
        </div>

        <div className="accordion-item " style={{ borderRadius: '5px', border: '0px solid #8A6D3B' }}>
          <h2 className="accordion-header" id="01">
            <button className="accordion-button align-items-end" type="button" data-bs-toggle="collapse" data-bs-target='#panel01' aria-expanded="false" aria-controls='panel01'>
              <div className='d-center'><HiInformationCircle /> <div className='ms-1'>懲戒標準說明 </div></div>
            </button>
          </h2>
          <div id='panel01' className="accordion-collapse collapse" aria-labelledby='01'>
            <div className="accordion-body pt-0">
              <div >

                {[].concat(dailyCalcRule || []).map((scr) => (
                  <>
                    <div className='d-center'> {scr.type === 'DemeritAmountEach' && scr.checked === 'True' ?
                      '◇ 每學期懲戒累積未超過' + scr.大過 + '大過，符合畢業資格。' : ''}{scr.type === 'DemeritAmountEach' && scr.checked === 'True' ? scr.功過相抵 === 'True' ? '（功過相抵後進行累計）' : '（僅以懲戒進行累計）' : ''}</div>

                    <div className='d-center'> {scr.type === 'DemeritAmountLast' && scr.checked === 'True' ?
                      '◇ 第六學期懲戒累積未超過' + scr.大過 + '大過，符合畢業資格。' : ''}{scr.type === 'DemeritAmountLast' && scr.checked === 'True' ? scr.功過相抵 === 'True' ? '（功過相抵後進行累計）' : '（僅以懲戒進行累計）' : ''}</div>

                    <div className='d-center'> {scr.type === 'DemeritAmountAll' && scr.checked === 'True' ?
                      '◇ 所有學期懲戒累積未超過' + scr.大過 + '大過，符合畢業資格。' : ''}{scr.type === 'DemeritAmountAll' && scr.checked === 'True' ? scr.功過相抵 === 'True' ? '（功過相抵後進行累計）' : '（僅以懲戒進行累計）' : ''}</div>

                  </>
                ))}

              </div>
            </div>
          </div>
        </div>


        <div className="overflow-x-auto mt-2">
          {/* _GetDiscipline 依照學期對照表顯示 */}
          {/* <table className="table table-compact w-full">
            <thead>
              <tr>
                <th className="table-cell">
                  // <div className='text-end text-white'>學期</div>
                  <div>獎懲</div>
                </th>

                {[].concat(allSemesters || []).map((semester) => (
                  <th style={{ background: '#a0cecb' }}>{semester.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>



              <tr>
                <th style={{ background: '#7BD8DC' }}>大功</th>
                {[].concat(allSemesters || []).map((semester) => (
                  [].concat(disciplineList || []).map((dis) => {
                    if (dis.school_year + '-' + dis.semester === semester.title)
                      return <td>{dis.大功}</td>;
                  })
                ))}
              </tr>

              <tr>
                <th style={{ background: '#7BD8DC' }}>小功</th>
                {[].concat(allSemesters || []).map((semester) => (
                  [].concat(disciplineList || []).map((dis) => {
                    if (dis.school_year + '-' + dis.semester === semester.title)
                      return <td>{dis.小功}</td>;
                  })
                ))}
              </tr>
              <tr>
                <th style={{ background: '#7BD8DC' }}>嘉獎</th>
                {[].concat(allSemesters || []).map((semester) => (
                  [].concat(disciplineList || []).map((dis) => {
                    if (dis.school_year + '-' + dis.semester === semester.title)
                      return <td>{dis.嘉獎}</td>;
                  })
                ))}
              </tr>
              <tr>
                <th style={{ background: '#7BD8DC' }}>大過</th>
                {[].concat(allSemesters || []).map((semester) => (
                  [].concat(disciplineList || []).map((dis) => {
                    if (dis.school_year + '-' + dis.semester === semester.title)
                      return <td>{dis.大過}</td>;
                  })
                ))}
              </tr>
              <tr>
                <th style={{ background: '#7BD8DC' }}>小過</th>
                {[].concat(allSemesters || []).map((semester) => (
                  [].concat(disciplineList || []).map((dis) => {
                    if (dis.school_year + '-' + dis.semester === semester.title)
                      return <td>{dis.小過}</td>;
                  })
                ))}
              </tr>
              <tr>
                <th style={{ background: '#7BD8DC' }}>警告</th>
                {[].concat(allSemesters || []).map((semester) => (
                  [].concat(disciplineList || []).map((dis) => {
                    if (dis.school_year + '-' + dis.semester === semester.title)
                      return <td>{dis.警告}</td>;
                  })
                ))}
              </tr>



            </tbody>

          </table> */}

          {/* GetDiscipline 顯示所有學期 */}
          {[].concat(disciplineList || []).length ?
            <table className="table table-compact w-full">
              <thead>
                <tr>
                  <th className="table-cell">
                    {/* <div className='text-end text-white'>學期</div> */}
                    <div>獎懲 / 學期</div>
                  </th>

                  {[].concat(disciplineList || []).map((d) => (
                    <th style={{ background: '#a0cecb' }}>{d.school_year}-{d.semester}</th>
                  ))}
                </tr>
              </thead>
              <tbody>



                <tr>
                  <th>大功</th>
                  {[].concat(disciplineList || []).map((dis) => {
                    return <td>{dis.大功}</td>;
                  })}
                </tr>

                <tr>
                  <th>小功</th>
                  {[].concat(disciplineList || []).map((dis) => {
                    return <td>{dis.小功}</td>;
                  })}
                </tr>
                <tr>
                  <th>嘉獎</th>
                  {[].concat(disciplineList || []).map((dis) => {
                    return <td>{dis.嘉獎}</td>;
                  })}
                </tr>
                <tr>
                  <th>大過</th>
                  {[].concat(disciplineList || []).map((dis) => {
                    return <td>{dis.大過}</td>;
                  })}
                </tr>
                <tr>
                  <th>小過</th>
                  {[].concat(disciplineList || []).map((dis) => {
                    return <td>{dis.小過}</td>;
                  })}
                </tr>
                <tr>
                  <th>警告</th>
                  {[].concat(disciplineList || []).map((dis) => {
                    return <td>{dis.警告}</td>;
                  })}
                </tr>



              </tbody>

            </table>
            : <div className="my-3">未有獎懲紀錄，或所有懲戒已銷過。</div>}
        </div>


        <div className="accordion-item " style={{ borderRadius: '5px', border: '0px solid #8A6D3B' }}>
          <h2 className="accordion-header" id="02">
            <button className="accordion-button align-items-end" type="button" data-bs-toggle="collapse" data-bs-target='#panel02' aria-expanded="false" aria-controls='panel02'>
              <div className='d-center'><HiInformationCircle /> <div className='ms-1'>缺曠標準說明 </div></div>
            </button>
          </h2>
          <div id='panel02' className="accordion-collapse collapse" aria-labelledby='02'>
            <div className="accordion-body pt-0">
              <div >

                {[].concat(dailyCalcRule || []).map((scr) => (
                  <>
                    <div className='d-center'> {scr.type === 'AbsenceAmountEach' && scr.checked === 'True' ?
                      '◇ 每學期缺課節數合計未超過' + scr.節數 + '節，符合畢業資格。（統計假別：' + scr.假別.replace(/,/g, "、") + '）' : ''}</div>

                    <div className='d-center'> {scr.type === 'AbsenceAmountLast' && scr.checked === 'True' ?
                      '◇ 第六學期缺課節數合計未超過' + scr.節數 + '節，符合畢業資格。（統計假別：' + scr.假別.replace(/,/g, "、") + '）' : ''}</div>

                    <div className='d-center'> {scr.type === 'AbsenceAmountAll' && scr.checked === 'True' ?
                      '◇ 所有學期缺課節數合計未超過' + scr.節數 + '節，符合畢業資格。（統計假別：' + scr.假別.replace(/,/g, "、") + '）' : ''}</div>


                    <div className='d-center'> {scr.type === 'AbsenceAmountEachFraction' && scr.checked === 'True' ?
                      <div> <div>◇ 每日上課節數{scr.每日節數}節。</div><div>◇ 每學期授課總節數扣除學校核可之公、喪、病，缺課節數合計未超過{scr.節數}，符合畢業資格。（統計假別：{scr.假別.replace(/,/g, "、")}）</div></div> : ''}</div>


                    <div className='d-center'> {scr.type === 'AbsenceAmountLastFraction' && scr.checked === 'True' ?
                      <div> <div>◇ 每日上課節數{scr.每日節數}節。</div><div>◇ 第六學期授課總節數扣除學校核可之公、喪、病，缺課節數合計未超過{scr.節數}，符合畢業資格。（統計假別：{scr.假別.replace(/,/g, "、")}）</div></div> : ''}</div>

                    <div className='d-center'> {scr.type === 'AbsenceAmountAllFraction' && scr.checked === 'True' ?
                      <div> <div>◇ 每日上課節數{scr.每日節數}節。</div><div>◇ 所有學期授課總節數扣除學校核可之公、喪、病（核可假別：{scr.核可假別.replace(/,/g, "、")}），缺課節數合計未超過{scr.節數}，符合畢業資格。（統計假別：{scr.假別.replace(/,/g, "、")}）</div></div> : ''}</div>





                  </>
                ))}

              </div>
            </div>
          </div>
        </div>


        <div className="overflow-x-auto mt-2">
          <table className="table table-compact w-full">
            <thead>
              <tr>
                <th className="table-cell">
                  {/* <div className='text-end text-white'>學期</div> */}
                  <div>假別 / 學期</div>
                </th>

                {[].concat(allSemesters || []).map((semester) => (
                  <th style={{ background: '#a0cecb' }}>{semester.title}</th>
                ))}
                <th style={{ background: '#a0cecb' }}>總計</th>
              </tr>
            </thead>
            <tbody>

              {/* {[].concat(absenceList || []).map((abs) => (

                absenceAndPeriodsList.includes(abs.Name) ?
                  <tr>
                    <th>{abs.Name}（節）</th>
                    {[].concat(allSemesters || []).map((semester) => {
                      const matchedField = [].concat(abs.Field || []).find((a) => a.SchoolYear + '-' + a.Semester === semester.title);
                      return <td>{matchedField ? matchedField.Sum : ''}</td>;
                    })}

                    {[].concat(totalAbsenceList || []).map((total) => {
                      if (abs.Name === total.name) {
                        return <td>{total.sum}</td>;
                      }
                      return null;
                    })}


                  </tr> : null
              ))} */}


              {[].concat(absenceList || []).map((abs) => {
                if (absenceAndPeriodsList.length > 0 && !absenceAndPeriodsList.includes(abs.Type)) {
                  return null;
                }
                return (
                  <tr key={abs.Name}>
                    <th>{abs.Name}（節）</th>
                    {[].concat(allSemesters || []).map((semester) => {
                      const matchedField = [].concat(abs.Field || []).find((a) => a.SchoolYear + '-' + a.Semester === semester.title);
                      return <td key={semester.title}>{matchedField ? matchedField.Sum : ''}</td>;
                    })}
                    {[].concat(totalAbsenceList || []).map((total) => {
                      if (abs.Name === total.name) {
                        return <td key={total.name}>{total.sum}</td>;
                      }
                      return null;
                    })}
                  </tr>
                );
              })}









              <tr>
                <th>上課天數（天）</th>
                {[].concat(allSemesters || []).map((semester) => {
                  return <td>{semester.days}</td>;
                })}
                {/* 上課天數總計 */}
                <td>{totalDays}</td>
              </tr>


            </tbody>

          </table>
        </div>



      </div>
    </div>

  );
}

export default App;
