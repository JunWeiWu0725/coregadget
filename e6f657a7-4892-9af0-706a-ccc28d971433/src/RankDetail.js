import React, { useState, useEffect } from 'react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import ScrollToTopButton from './ScrollToTopButton';
import Loading from './Loading';
import { useAppContext } from './AppContext';

const RankDetail = () => {

	const { appData, setAppDataValues } = useAppContext();

	const studentID = appData.studentID;
	const examID = appData.examID;
	const semester = appData.semester;
	const courseID = appData.courseID;
	const defaultRankType = appData.rankType;
	const storageSubject = appData.subject;
	const passingStandard = appData.passingStandard;

	const [loading, setLoading] = useState(true);
	// 取得 學生成績與排名資料
	const [studentSubjectData, setStudentSubjectData] = useState([]);

	//所選的排名類別
	const [selectedRankType, setSelectedRankType] = useState("");

	//所有的排名類別清單
	const [rankTypeList, setRankTypeList] = useState([]);

	//長條圖
	const [levelList, setLevelList] = useState([{ name: "100", count: 0 }, { name: "90-99", count: 0 }, { name: "80-89", count: 0 }, { name: "70-79", count: 0 }, { name: "60-69", count: 0 }, { name: "50-59", count: 0 }, { name: "40-49", count: 0 }, { name: "30-39", count: 0 }, { name: "20-29", count: 0 }, { name: "10-19", count: 0 }, { name: "0-9", count: 0 }, { name: "0-9", count: 0 }]);

	//取長條圖最大值
	const [chartMax, setChartMax] = useState(0);

	//取長條圖height
	const [chartHeight, setChartHeight] = useState('chartHeightShowRank');

	// 該校設定 不顯示排名(true:不顯示，false:顯示) (desktop設定需要同時更新才可生效)
	const [showNoRankSetting, setShowNoRankSetting] = useState(true);


	const position = window.gadget.params.system_position;

	var _connection = window.gadget.getContract("1campus.h.exam.parent");

	if (position === 'student')
		_connection = window.gadget.getContract("1campus.h.exam.student");



	useEffect(() => {
		const init = async () => {
			try {
				setLoading(true);
				const [rankDetail, viewSetting] = await Promise.all([GetRankDetailPageInfo(), GetViewSetting()]);
				const rankTypes = getRankTypes(rankDetail);
				setRankTypeList(rankTypes);
				if(rankTypes.find(rankType => rankType === defaultRankType)) 
					setSelectedRankType(defaultRankType);
				// setChartHeight(viewSetting ? 'chartHeightNoShowRank' : 'chartHeightShowRank');

			} catch (error) {
				console.error("init Error:", error);
			} finally {
				setLoading(false);
			}
		};

		init();
	}, []);

	useEffect(() => {
		ToBarChart();
	}, [selectedRankType, studentSubjectData]);

	const GetRankDetailPageInfo = async () => {
		return new Promise((resolve, reject) => {
			_connection.send({
				service: "_.GetRankDetailPageInfo",
				body: {
					StudentID: studentID,
					ViewSemester: semester,
					ExamID: examID,
					Subject: storageSubject,
					CourseID: courseID,
				},
				result: (response, error) => {
					if (error) {
						console.log('GetRankDetailPageInfo Error:', error);
						return reject(error);
					}
					const rankMatrix = [].concat(response?.RankMatrix || []);
					setStudentSubjectData(rankMatrix);
					resolve(rankMatrix);
				}
			});
		});
	};

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
					resolve(isShowRank);
				}
			});
		});
	};

	const getRankTypes = (data) => {
		const types = new Set();
		data.forEach((item) => {
			if (item.rank_type) types.add(item.rank_type);
		});
		return Array.from(types);
	};
	const ToBarChart = () => {
		const source = {};

		levelList.forEach((v) => (source[v.name] = v.count));

		if (studentSubjectData.length > 0) {
			studentSubjectData.forEach((data) => {
				if (data.rank_type === selectedRankType) {
					// 排名分數
					const score = Number(data.rank_score);
					let position_name = "";

					if (score >= 100) position_name = "100";
					else if (score >= 90) position_name = "90-99";
					else if (score >= 80) position_name = "80-89";
					else if (score >= 70) position_name = "70-79";
					else if (score >= 60) position_name = "60-69";
					else if (score >= 50) position_name = "50-59";
					else if (score >= 40) position_name = "40-49";
					else if (score >= 30) position_name = "30-39";
					else if (score >= 20) position_name = "20-29";
					else if (score >= 10) position_name = "10-19";
					else position_name = "0-9";

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
					source["0-9"] = Number(data.level_lt10);

					const merge = Object.keys(source).map((range) => ({
						name: range,
						count: source[range],
						fill: range === position_name ? "#F8A1A4" : "#498ED0",
						labelFill: range === position_name ? "#F47378" : "#2196f3",
					}));

					setLevelList(merge);
					setChartMax(Math.ceil(Math.max(...merge.map((c) => c.count)) / 4) * 4);
				}
			});
		}
	}

	const handleRankTypeChange = (e) => {
		setSelectedRankType(e.target.value);
		//localStorage.setItem('RankType', e.target.value);

		setAppDataValues({
			rankType: e.target.value,
		});

	};

	const handleBackToHomePage = (e) => {
		// 按下去的時候才存
		setAppDataValues({
			rankType: selectedRankType,
			isBack: true,
		});
		window.history.go(-1);
	};


	return (
		<div className="App">
			{loading ? (		
				<Loading/>
			)
				: (

					<div className="container px-3 px-sm-4 py-5 ">

						<div className="d-flex justify-content-between">
							<button type="button" className="btn btn-back active d-flex justify-content-start px-0" onClick={handleBackToHomePage}>＜返回</button>
							<OverlayTrigger key='' placement='bottom' containerPadding={30} overlay={<Popover id='popover-contained'>
								<Popover.Header as="h3">五標說明</Popover.Header>
								<Popover.Body>
									<strong>【五標】</strong> <br />
									頂標：該項目前25%考生成績的平均分數<br />
									高標：該項目前50%考生成績的平均分數<br />
									均標：該項目全體考生成績的平均分數<br />
									低標：該項目後50%考生成績的平均分數<br />
									底標：該項目後25%考生成績的平均分數<br />
									<strong>【新五標】</strong> <br />
									新頂標：該項目成績位於第88百分位數之考生分數<br />
									新前標：該項目成績位於第75百分位數之考生分數<br />
									新均標：該項目成績位於第50百分位數之考生分數<br />
									新後標：該項目成績位於第25百分位數之考生分數<br />
									新底標：該項目成績位於第12百分位數之考生分數
								</Popover.Body>
							</Popover>}>
								<button type="button" className="btn btn-back active d-flex justify-content-start me-2">五標說明</button>
							</OverlayTrigger>

						</div>
						{[].concat(studentSubjectData || []).map((data) => {
							if (data.rank_type === selectedRankType)
								return <div className='detailBorder row row row-cols-1 row-cols-md-2 row-cols-lg-2'>
									<div className='col'>
										<div className='d-flex me-auto align-items-center pt-2 ps-2'>
											<div className='fs-2 text-white me-1 row align-items-center justify-content-center' style={{ width: '80px', height: '80px', background: "#5B9BD5" }}>
												{data.subject === '加權平均' || data.subject === '算術平均' ? Math.round(Number(data.score) * 100) / 100 : data.final_show_score}
											</div>
											<div className='fs-4 fw-bold'>{data.domain === "" ? "" : data.domain + "-"}{data.subject}</div>
										</div>
									</div>

									<div className='col align-self-end'>
										<div className='text-end pt-0 pt-md-2 pt-lg-2 pe-2'>
											<div className=''>及格標準：{passingStandard}分</div>
											<div className=''>計算排名時間：{data.create_time}</div>
										</div>
									</div>
								</div>
						})}


						{([].concat(rankTypeList || []).length > 0) &&
							<>
								<div className='d-flex align-items-center my-2'>
									<div className="col-12 col-md-6 col-lg-6 mt-2">
										<select className="form-select" value={selectedRankType} onChange={(e) => handleRankTypeChange(e)}>
											{rankTypeList.map((rankType, index) => {
												return <option key={index} value={rankType}>
													{rankType}</option>
											})}
										</select>
									</div>
								</div>

								<div className='row align-items-start mt-2'>
									<div className='col-12 col-md-6 col-lg-6'>

										<table className="table table-bordered" style={{ border: '1px solid #fff' }}>
											{[].concat(studentSubjectData || []).map((data) => {
												if (data.rank_type === selectedRankType)
													if (showNoRankSetting) //true: 不顯示 false:顯示
														return <tbody style={{ borderTop: '4px solid #fff' }}>
															<tr>
																<td className='w-50' style={{ background: '#BDD7EE' }}>標準差</td>
																<td style={{ background: '#DEEBF7' }}>{data.std_dev_pop === '' ? '' : Math.round(data.std_dev_pop * 100) / 100}</td>
															</tr>
														</tbody>
													else

														return <tbody style={{ borderTop: '4px solid #fff' }}>
															<tr>
																<td style={{ background: '#BDD7EE' }}>名次/母數</td>
																<td style={{ background: '#DEEBF7' }}>{data.rank}/{data.matrix_count}</td>
															</tr>
															<tr>
																<td style={{ background: '#BDD7EE' }}>PR</td>
																<td style={{ background: '#DEEBF7' }}>{data.pr}</td>
															</tr>
															<tr>
																<td style={{ background: '#BDD7EE' }}>百分比</td>
																<td style={{ background: '#DEEBF7' }}>{data.percentile}</td>
															</tr>

															<tr>
																<td className='w-50' style={{ background: '#BDD7EE' }}>標準差</td>
																<td style={{ background: '#DEEBF7' }}>{data.std_dev_pop === '' ? '' : Math.round(data.std_dev_pop * 100) / 100}</td>
															</tr>
														</tbody>

											})}
										</table>

										<div className={chartHeight}  >
											<ResponsiveContainer height="100%" width="100%">
												<BarChart data={levelList} layout="vertical" margin={{ top: 30, right: 50, left: 10, bottom: 0 }}>
													<XAxis dataKey="count" type="number"
														label={{ value: '人數', position: 'right', offset: 10, dy: -15, fill: '#498ED0' }}
														axisLine={{ stroke: "#2196f3" }}
														allowDecimals={false} domain={[0, () => (chartMax === 0) ? 1 : chartMax]} />
													<YAxis dataKey="name" type="category" interval={0} width={100} tick={{ fontSize: 10 }} minTickGap={5}
														label={{ value: '組距', position: 'insideTopLeft', offset: 0, dy: -15, dx: 40, fill: '#498ED0' }}
														axisLine={{ stroke: "#2196f3" }} />
													<Bar dataKey="count" barSize={25} label={{ position: 'right' }} fillOpacity={0.8} />
												</BarChart>
											</ResponsiveContainer>
										</div>
									</div>

									{[].concat(studentSubjectData || []).map((data) => {
										if (data.rank_type === selectedRankType)
											return <div className='col-12 col-md-6 col-lg-6'>
												<table className="table table-bordered mt-1" style={{ border: '1px solid #fff' }}>
													<thead>
														<tr style={{ background: '#5B9BD5' }}>
															<th colSpan="2">五標</th>
														</tr>
													</thead>
													<tbody style={{ borderTop: '4px solid #fff' }}>
														<tr style={{ background: '#D2DEEF' }}>
															<td className='w-50'>頂標</td>
															<td>{Math.round(data.avg_top_25 * 100) / 100}</td>
														</tr>
														<tr style={{ background: '#EAEFF7' }}>
															<td>高標</td>
															<td>{Math.round(data.avg_top_50 * 100) / 100}</td>
														</tr>
														<tr style={{ background: '#D2DEEF' }}>
															<td>均標</td>
															<td>{Math.round(data.avg * 100) / 100}</td>
														</tr>
														<tr style={{ background: '#EAEFF7' }}>
															<td>低標</td>
															<td>{Math.round(data.avg_bottom_50 * 100) / 100}</td>
														</tr>
														<tr style={{ background: '#D2DEEF' }}>
															<td>底標</td>
															<td>{Math.round(data.avg_bottom_25 * 100) / 100}</td>
														</tr>
													</tbody>
												</table>

												<table className="table table-bordered mt-2" style={{ border: '1px solid #fff' }}>
													<thead>
														<tr style={{ background: '#5B9BD5' }}>
															<th colSpan="2">新五標</th>
														</tr>
													</thead>
													<tbody style={{ borderTop: '4px solid #fff' }}>
														<tr style={{ background: '#D2DEEF' }}>
															<td className='w-50'>新頂標</td>
															<td>{data.pr_88 === '' ? '' : Math.round(data.pr_88 * 100) / 100}</td>
														</tr>
														<tr style={{ background: '#EAEFF7' }}>
															<td>新前標</td>
															<td>{data.pr_75 === '' ? '' : Math.round(data.pr_75 * 100) / 100}</td>
														</tr>
														<tr style={{ background: '#D2DEEF' }}>
															<td>新均標</td>
															<td>{data.pr_50 === '' ? '' : Math.round(data.pr_50 * 100) / 100}</td>
														</tr>
														<tr style={{ background: '#EAEFF7' }}>
															<td>新後標</td>
															<td>{data.pr_25 === '' ? '' : Math.round(data.pr_25 * 100) / 100}</td>
														</tr>
														<tr style={{ background: '#D2DEEF' }}>
															<td>新底標</td>
															<td>{data.pr_12 === '' ? '' : Math.round(data.pr_12 * 100) / 100}</td>
														</tr>
													</tbody>
												</table>
											</div>
									})}

								</div>
							</>
						}

						<ScrollToTopButton />
					</div>
				)
			}
		</div>
	);
};

export default RankDetail;
