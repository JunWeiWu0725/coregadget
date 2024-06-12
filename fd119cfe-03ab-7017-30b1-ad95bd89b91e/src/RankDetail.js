import React, { useState, useEffect } from 'react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import ScrollToTopButton from './ScrollToTopButton';
import { useAppContext } from './AppContext';

const RankDetail = () => {

    const { appData } = useAppContext();

    const studentID = appData.studentID;

    const examID = appData.examID;

    const semester = appData.semester;

    const subject = appData.subject;
    const domain = appData.domain;
    const storageScore = appData.score;
    
    const exam_type = appData.exam_type;
    const total_type = appData.total_type;
    
    // 科目加權平均
  const [SubjectWeightedAverage, setSubjectWeightedAverage] = useState(0);

    // 班級學生組距資料
    const [scoreLevelData, setScoreLevel] = useState([]);

    //長條圖
    const [levelList, setLevelList] = useState([{ name: "100", count: 0 }, { name: "90-99", count: 0 }, { name: "80-89", count: 0 }, { name: "70-79", count: 0 }, { name: "60-69", count: 0 },{ name: "50-59", count: 0 }, { name: "40-49", count: 0 }, { name: "30-39", count: 0 }, { name: "20-29", count: 0 }, { name: "10-19", count: 0 }, { name: "0-9", count: 0 }]);

    //取長條圖最大值
    const [chartMax, setChartMax] = useState(0);


    const position = window.gadget.params.system_position;

    var _connection = window.gadget.getContract("1campus.j.exam.parent");

    if (position === 'student')
        _connection = window.gadget.getContract("1campus.j.exam.student");



    useEffect(() => {

        if (exam_type === 'exam') //定期評量
        {
            if (subject === '') //領域
            {
                CalculateDomainExamScoreLevelKH();
                console.log('CalculateDomainExamScoreLevelKH');
            } else if (subject === '算術平均' || subject === '加權平均') {
                
                CalculateTotalExamLevelKH();
                console.log('CalculateTotalExamLevelKH');
            } else {//科目
                CalculateSubjectExamScoreLevelKH();
                console.log('CalculateSubjectExamScoreLevelKH');
            }
        }
        else {//平時評量
            if (subject === ''){ //領
                CalculateDomainAssignmentScoreLevelKH();
                console.log('CalculateDomainAssignmentScoreLevelKH');
            } else if (subject === '算術平均' || subject === '加權平均') {
                CalculateTotalAssignmentLevelKH();
                console.log('CalculateTotalAssignmentLevelKH');
            } else {//科目
                CalculateSubjectAssignmentScoreLevelKH();
                console.log('CalculateSubjectAssignmentScoreLevelKH');
            }
        }

        //console.log('appData!!!!!!!!!!!!', appData);

    }, []);


    useEffect(() => {
        ToBarChart();
    }, [scoreLevelData]);


    function ToBarChart() {
        const source = {};

        levelList.forEach(v => source[v.name] = v.count);

        if (scoreLevelData.length > 0) {
            scoreLevelData.forEach(data => {

                //分數
                let score = Number(storageScore);
                let position_name = '';

                // 取得加權平均
                setSubjectWeightedAverage(Number(data.weighted_average));

                if (score >= 100)
                    position_name = '100';
                if (score >= 90 && score < 100)
                    position_name = '90-99';
                if (score >= 80 && score < 90)
                    position_name = '80-89';
                if (score >= 70 && score < 80)
                    position_name = '70-79';
                if (score >= 60 && score < 70)
                    position_name = '60-69';
                // if (score < 60)
                //     position_name = '<60';
                if (score >= 50 && score < 60)
                    position_name = '50-59';
                if (score >= 40 && score < 50)
                    position_name = '40-49';
                if (score >= 30 && score < 40)
                    position_name = '30-39';
                if (score >= 20 && score < 30)
                    position_name = '20-29';
                if (score >= 10 && score < 20)
                    position_name = '10-19';
                if (score >= 0 && score < 10)
                    position_name = '0-9';               

                source["100"] = Number(data.level_gte100);
                source["90-99"] = Number(data.level_90);
                source["80-89"] = Number(data.level_80);
                source["70-79"] = Number(data.level_70);
                source["60-69"] = Number(data.level_60);
                // source["<60"] = Number(data.under60);
                source["50-59"] = Number(data.level_50);
                source["40-49"] = Number(data.level_40);
                source["30-39"] = Number(data.level_30);
                source["20-29"] = Number(data.level_20);
                source["10-19"] = Number(data.level_10);
                source["0-9"] = Number(data.level_0);

                const merge = Object.getOwnPropertyNames(source).map(v => ({
                    name: v,
                    count: source[v],
                    fill: v === position_name ? '#F8A1A4' : '#498ED0',
                    labelFill: v === position_name ? '#F47378' : '#2196f3',
                }));

                setLevelList(merge);
                setChartMax(Math.ceil(Math.max(...merge.map(c => c.count)) / 4) * 4);

            });
        }
    }


    /** 計算 科目 定期 班級組距資料*/
    async function CalculateSubjectExamScoreLevelKH() {
        await _connection.send({
            service: "_.CalculateSubjectExamScoreLevelKH",
            body: {
                StudentID: studentID,
                ViewSemester: semester,
                ExamID: examID,
                Subject: subject,
            },
            result: function (response, error, http) {
                if (error !== null) {
                    console.log('CalculateSubjectExamScoreLevelKH Error', error);
                    return 'err';
                } else {
                    if (response) {
                        setScoreLevel([].concat(response.Response.Level || []));
                    }
                }
            }
        });
    }

    /** 計算 領域 定期 班級組距資料*/
    async function CalculateDomainExamScoreLevelKH() {
        await _connection.send({
            service: "_.CalculateDomainExamScoreLevelKH",
            body: {
                StudentID: studentID,
                ViewSemester: semester,
                ExamID: examID,
                Domain: domain,
            },
            result: function (response, error, http) {
                if (error !== null) {
                    console.log('CalculateDomainExamScoreLevelKH Error', error);
                    return 'err';
                } else {
                    if (response) {
                        setScoreLevel([].concat(response.Response.Level || []));
                    }
                }
            }
        });
    }

    /** 計算 (加權/算術)平均(含彈性領域/八大領域) 定期 班級組距資料*/
    async function CalculateTotalExamLevelKH() {
        await _connection.send({
            service: "_.CalculateTotalExamLevelKH",
            body: {
                StudentID: studentID,
                ViewSemester: semester,
                ExamID: examID,
                Subject: subject,
                TotalType: total_type,
            },
            result: function (response, error, http) {
                if (error !== null) {
                    console.log('CalculateTotalExamLevelKH Error', error);
                    return 'err';
                } else {
                    if (response) {
                        setScoreLevel([].concat(response.Response.Level || []));
                    }
                }
            }
        });
    }


    /** 計算 科目 平時 班級組距資料*/
    async function CalculateSubjectAssignmentScoreLevelKH() {
        await _connection.send({
            service: "_.CalculateSubjectAssignmentScoreLevelKH",
            body: {
                StudentID: studentID,
                ViewSemester: semester,
                Subject: subject,
            },
            result: function (response, error, http) {
                if (error !== null) {
                    console.log('CalculateSubjectAssignmentScoreLevelKH Error', error);
                    return 'err';
                } else {
                    if (response) {
                        setScoreLevel([].concat(response.Response.Level || []));
                    }
                }
            }
        });
    }

    /** 計算 領域 平時 班級組距資料*/
    async function CalculateDomainAssignmentScoreLevelKH() {
        await _connection.send({
            service: "_.CalculateDomainAssignmentScoreLevelKH",
            body: {
                StudentID: studentID,
                ViewSemester: semester,
                Domain: domain,
            },
            result: function (response, error, http) {
                if (error !== null) {
                    console.log('CalculateDomainAssignmentScoreLevelKH Error', error);
                    return 'err';
                } else {
                    if (response) {
                        setScoreLevel([].concat(response.Response.Level || []));
                    }
                }
            }
        });
    }

    /** 計算 (加權/算術)平均(含彈性領域/八大領域) 平時 班級組距資料*/
    async function CalculateTotalAssignmentLevelKH() {
        await _connection.send({
            service: "_.CalculateTotalAssignmentLevelKH",
            body: {
                StudentID: studentID,
                ViewSemester: semester,
                ExamID: examID,
                Subject: subject,
                TotalType: total_type,
            },
            result: function (response, error, http) {
                if (error !== null) {
                    console.log('CalculateTotalAssignmentLevelKH Error', error);
                    return 'err';
                } else {
                    if (response) {
                        setScoreLevel([].concat(response.Response.Level || []));
                    }
                }
            }
        });
    }

    const handleBackToHomePage = (e) => {
        window.history.go(-1);
    };


    return (
        <div className="App">            
            <div className="container px-3 px-sm-4 py-5 ">

                <div className="d-flex justify-content-between">
                    <button type="button" className="btn btn-back active d-flex justify-content-start px-0" onClick={handleBackToHomePage}>＜返回</button>
                </div>


                <div className='detailBorder row row row-cols-1 row-cols-md-2 row-cols-lg-2'>
                    <div className='col'>
                        <div className='d-flex me-auto align-items-center pt-2 ps-2'>
                            <div className='fs-2 text-white me-1 row align-items-center justify-content-center' style={{ width: '80px', height: '80px', background: "#5B9BD5" }}>{subject === '加權平均' || subject === '算術平均' || subject === '' ? Math.round(Number(storageScore) * 100) / 100 : storageScore}</div>

                            <div className='fs-4 fw-bold'>{domain === "" ? "" : subject === "" ? domain : domain + "-"}{subject === '加權平均' || subject === '算術平均' ? subject + '(' + total_type + ')' : subject}</div>
                            <div className='ms-4' style={{ visibility: subject !== "" && !isNaN(SubjectWeightedAverage) && SubjectWeightedAverage !== null && SubjectWeightedAverage !== undefined && SubjectWeightedAverage !== '' ? 'visible' : 'hidden' }}>班級平均：{SubjectWeightedAverage}</div>                            
                        </div>                        
                    </div>

                    <div className='col align-self-end'>
                        <div className='text-end pt-0 pt-md-2 pt-lg-2 pe-2'>

                        </div>
                    </div>
                </div>

                <>
                    <div className='row align-items-start mt-2'>
                        <div className='col-12 mt-3'>
                            <div className='chartHeightNoShowRank'>
                                <ResponsiveContainer height="100%" width="100%">
                                    <BarChart data={levelList} layout="vertical" margin={{ top: 30, right: 50, left: 10, bottom: 0 }}>
                                        <XAxis dateKey="count" type="number" label={{ value: '人數', position: 'right', offset: 10, dy: -15, fill: '#498ED0' }} axisLine={{ stroke: "#2196f3" }} allowDecimals={false} domain={[0, () => (chartMax === 0) ? 1 : chartMax]} />
                                        <YAxis dataKey="name" type="category" label={{ value: '組距', position: 'insideTopLeft', offset: 0, dy: -15, dx: 40, fill: '#498ED0' }} axisLine={{ stroke: "#2196f3" }} />
                                        <Bar dataKey="count" barSize={25} label={{ position: 'right' }} fillOpacity={0.8} >
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className='mt-3'>{exam_type==='assignment'?'組距資訊為該班學生平時評量成績即時統計。':'組距資訊為該班學生定期評量成績即時統計。'}</div>

                        </div>

                    </div>
                </>



                <ScrollToTopButton />
            </div>
        </div>
    );
};

export default RankDetail;
