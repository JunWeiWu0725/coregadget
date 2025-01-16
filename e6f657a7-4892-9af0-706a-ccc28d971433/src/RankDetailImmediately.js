import React, { useState, useEffect } from 'react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import ScrollToTopButton from './ScrollToTopButton';
import Loading from './Loading';
import { useAppContext } from './AppContext';

const RankDetailImmediately = () => {

    const { appData, setAppDataValues } = useAppContext();

    const studentID = appData.studentID;
    const examID = appData.examID;
    const semester = appData.semester;
    const storageSubject = appData.subject;
    const passingStandard = appData.passingStandard;


    const courseID = appData.courseID;
    const storageDomain = appData.domain;
    const storagePeriod = appData.period;
    const storageCredit = appData.credit;
    const storageScore = appData.score;
    const scoreType = appData.scoreType;

    const [loading, setLoading] = useState(true);
    // 班級學生即時組距資料
    const [scoreLevelData, setScoreLevel] = useState([]);

    const [levelImmediatelyList, setLevelImmediatelyList] = useState([{ name: "100", count: 0 }, { name: "90-99", count: 0 }, { name: "80-89", count: 0 }, { name: "70-79", count: 0 }, { name: "60-69", count: 0 }, { name: "50-59", count: 0 }, { name: "40-49", count: 0 }, { name: "30-39", count: 0 }, { name: "20-29", count: 0 }, { name: "10-19", count: 0 }, { name: "0-9", count: 0 }]);

    //取長條圖最大值
    const [chartMax, setChartMax] = useState(0);

    const position = window.gadget.params.system_position;

    var _connection = window.gadget.getContract("1campus.h.exam.parent");

    if (position === 'student')
        _connection = window.gadget.getContract("1campus.h.exam.student");


    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                if (storageSubject === '算術平均' || storageSubject === '加權平均') {
                    await CalculateExamAvgLevel();
                } else {
                    await CalculateSubjectExamScoreLevel();
                }
            } catch (error) {
                console.error("init Error:", error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    useEffect(() => {
        ToBarChartImmediately();
    }, [scoreLevelData]);


    const ToBarChartImmediately = () => {
        const source = {};

        levelImmediatelyList.forEach(v => source[v.name] = v.count);

        if (scoreLevelData.length > 0) {
            scoreLevelData.forEach(data => {
                //擇優成績
                let score = Number(storageScore);
                if (scoreType === '0分')
                    score = 0;
                let position_name = '';

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

                setLevelImmediatelyList(merge);
                setChartMax(Math.ceil(Math.max(...merge.map(c => c.count)) / 4) * 4);

            });
        }
    }

    /** 計算 科目 班級組距資料*/
    const CalculateSubjectExamScoreLevel = async () => {
        return new Promise((resolve, reject) => {
            _connection.send({
                service: "_.CalculateSubjectExamScoreLevel",
                body: {
                    StudentID: studentID,
                    ViewSemester: semester,
                    Subject: storageSubject,
                    ExamID: examID,
                },
                result: (response, error) => {
                    if (error) {
                        console.log('CalculateSubjectExamScoreLevel Error:', error);
                        return reject(error);
                    }
                    const level = [].concat(response.Response.Level || []);
                    setScoreLevel(level);
                    resolve(level);
                }
            });
        });
    };

    /** 計算 科目總計 (加權平均/算術平均) 班級組距資料*/
    const CalculateExamAvgLevel = async () => {
        return new Promise((resolve, reject) => {
            _connection.send({
                service: "_.CalculateExamAvgLevel",
                body: {
                    StudentID: studentID,
                    ViewSemester: semester,
                    Subject: storageSubject,
                    ExamID: examID,
                },
                result: (response, error) => {
                    if (error) {
                        console.log('CalculateExamAvgLevel Error:', error);
                        return reject(error);
                    }
                    const level = [].concat(response.Response.Level || []);
                    setScoreLevel(level);
                    resolve(level);
                }
            });
        });
    };

    const handleBackToHomePage = (e) => {
        setAppDataValues({
            isBack: true,
        });
        window.history.go(-1);
    };



    return (
        <div className="App">
            {loading ? (
                <Loading />
            )
                : (
                    <div className="container px-3 px-sm-4 py-5 ">
                        <div className="d-flex justify-content-between">
                            <button type="button" className="btn btn-back active d-flex justify-content-start px-0" onClick={handleBackToHomePage}>＜返回</button>
                        </div>
                        <div className='detailBorder row row row-cols-1 row-cols-md-2 row-cols-lg-2'>
                            <div className='col'>
                                <div className='d-flex me-auto align-items-center pt-2 ps-2'>
                                    <div className='fs-2 text-white me-1 row align-items-center justify-content-center' style={{ width: '80px', height: '80px', background: "#5B9BD5" }}>
                                        {storageSubject === '加權平均' || storageSubject === '算術平均' ? Math.round(Number(storageScore) * 100) / 100 : storageScore}
                                    </div>
                                    <div className='fs-4 fw-bold'>{storageDomain === "" ? "" : storageDomain + "-"}{storageSubject}</div>
                                </div>
                            </div>

                            {/* <div className='col align-self-end'>
                        <div className='text-end pt-0 pt-md-2 pt-lg-2 pe-2'>
                            <div className=''>及格標準：{passingStandard}分</div>
                            <div className=''>計算排名時間：{data.create_time}</div>
                        </div>
                    </div> */}
                        </div>

                        <div className='row align-items-start mt-2'>
                            <div className='col-12 mt-3'>
                                <div className='chartHeightNoShowRank'>
                                    <ResponsiveContainer height="100%" width="100%">
                                        <BarChart data={levelImmediatelyList} layout="vertical" margin={{ top: 30, right: 50, left: 10, bottom: 0 }}>
                                            <XAxis dateKey="count" type="number"
                                                label={{ value: '人數', position: 'right', offset: 10, dy: -15, fill: '#498ED0' }}
                                                axisLine={{ stroke: "#2196f3" }} allowDecimals={false} domain={[0, () => (chartMax === 0) ? 1 : chartMax]} />
                                            <YAxis dataKey="name" type="category"
                                                label={{ value: '組距', position: 'insideTopLeft', offset: 0, dy: -15, dx: 40, fill: '#498ED0' }}
                                                axisLine={{ stroke: "#2196f3" }} />
                                            <Bar dataKey="count" barSize={25} label={{ position: 'right' }} fillOpacity={0.8} >
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className='mt-3'>組距資訊為該班學生定期評量成績即時統計。</div>

                            </div>

                        </div>

                        <ScrollToTopButton />
                    </div>
                )
            }
        </div>
    );
};

export default RankDetailImmediately;
