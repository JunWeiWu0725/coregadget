import React, { useState, useEffect } from 'react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import ScrollToTopButton from './ScrollToTopButton';
import { useAppContext } from './AppContext';

const RankDetail = () => {

	const { appData, setAppDataValues } = useAppContext();

	const studentID = appData.studentID;
	const semester = appData.semester;

	/**mixdomain、domain、subject */
	const subjectType = appData.subjectType;
	const defaultRankType = appData.rankType;
	const storageSubject = appData.subject;

	const storageScore = appData.score;

	// const studentID = localStorage.getItem('StudentID');
	// const semester = localStorage.getItem('Semester');
	// const subjectType = localStorage.getItem('SubjectType');
	// const defaultRankType = localStorage.getItem('RankType');
	// const storageSubject = localStorage.getItem('Subject');

	// 取得 學生成績與排名資料
	const [studentSubjectData, setStudentSubjectData] = useState([]);

	//所選的排名類別
	const [selectedRankType, setViewRankType] = useState("");

	//所選的成績類型 0-原始成績  1-擇優成績
	const [selectedScoreType, setScoreType] = useState('擇優成績');

	//所有的排名類別清單
	const [rankTypeList, setRankTypeList] = useState([]);

	// 班級學生即時組距資料
	const [scoreLevelData, setScoreLevel] = useState([]);

	//長條圖
	const [levelList, setLevelList] = useState([{ name: "100", count: 0 }, { name: "90-99", count: 0 }, { name: "80-89", count: 0 }, { name: "70-79", count: 0 }, { name: "60-69", count: 0 },{ name: "50-59", count: 0 }, { name: "40-49", count: 0 }, { name: "30-39", count: 0 }, { name: "20-29", count: 0 }, { name: "10-19", count: 0 }, { name: "0-9", count: 0 }]);


	const [levelImmediatelyList, setLevelImmediatelyList] = useState([{ name: "100", count: 0 }, { name: "90-99", count: 0 }, { name: "80-89", count: 0 }, { name: "70-79", count: 0 }, { name: "60-69", count: 0 },{ name: "50-59", count: 0 }, { name: "40-49", count: 0 }, { name: "30-39", count: 0 }, { name: "20-29", count: 0 }, { name: "10-19", count: 0 }, { name: "0-9", count: 0 }]);

	//取長條圖最大值
	const [chartMax, setChartMax] = useState(0);

	//取長條圖height
	const [chartHeight, setChartHeight] = useState('chartHeightNoShowRank');

	//預設不顯示排名
	const [showRank, setShowRank] = useState(false);

	const [SubjectWeightedAverage, setSubjectWeightedAverage] = useState(0);

	const position = window.gadget.params.system_position;

	var _connection = window.gadget.getContract("1campus.j.semester.parent");

	if (position === 'student')
		_connection = window.gadget.getContract("1campus.j.semester.student");


	useEffect(() => {
		GetRankDetailPageInfo();
		GetViewSetting();
	}, []);

	useEffect(() => {
		if (studentSubjectData.length === 1 && studentSubjectData[0].create_time === "") {
			if (subjectType === 'subject')
				CalculateSemesterSubjectScoreLevel();
			if (subjectType === 'domain')
				CalculateSemesterDomainScoreLevel();
			if (subjectType === 'mixdomain')
				CalculateSemesterMixDomainScoreLevel();

			//console.log('CalculateLevel');
		}
	}, [studentSubjectData]);



	useEffect(() => {
		GetChartHeight();
	}, [showRank]);

	useEffect(() => {
		GetRankTypeList();
	}, [studentSubjectData, selectedScoreType]);


	useEffect(() => {
		if (selectedRankType) {
			ToBarChart();
			//console.log('selectedRankType~~ToBarChart', selectedRankType);
		}
	}, [selectedRankType, selectedScoreType]);

	useEffect(() => {
		if (scoreLevelData.length > 0) {
			ToBarChartImmediately();
			//console.log('ToBarChartImmediately');
		}
	}, [scoreLevelData]);


	function ToBarChartImmediately() {
		const source = {};

		levelList.forEach(v => source[v.name] = v.count);

		if (scoreLevelData.length > 0) {
			scoreLevelData.forEach(data => {
				//擇優成績
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
				if (score < 60)
					position_name = '<60';

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
				if (score < 10)
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

	function ToBarChart() {
		const source = {};

		levelList.forEach(v => source[v.name] = v.count);

		if (studentSubjectData.length > 0) {
			studentSubjectData.forEach(data => {
				if (data.rank_type === selectedRankType && data.score_type === selectedScoreType) //所選的排名類別
				{
					//排名分數
					let score = Number(data.rank_score);
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
					if (score < 60)
						position_name = '<60';

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
					if (score < 10)
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
					source["0-9"] = Number(data.level_lt10);
					const merge = Object.getOwnPropertyNames(source).map(v => ({
						name: v,
						count: source[v],
						fill: v === position_name ? '#F8A1A4' : '#498ED0',
						labelFill: v === position_name ? '#F47378' : '#2196f3',
					}));

					setLevelList(merge);
					setChartMax(Math.ceil(Math.max(...merge.map(c => c.count)) / 4) * 4);
				}
			});
		}
	}

	function GetRankTypeList() {
		const typeList = [];
		if (studentSubjectData.length > 0)
			studentSubjectData.forEach(data => {
				if (data.score_type === selectedScoreType) {
					if (data.rank_type !== '')
						typeList.push(data.rank_type)
					if (data.rank_type === defaultRankType)
						setViewRankType(defaultRankType);
				}

			});
		//setViewRankType(typeList[0]);
		setRankTypeList(typeList);
	}

	function GetChartHeight() {
		if (showRank) //顯示排名
			setChartHeight('chartHeightShowRank');
		else
			setChartHeight('chartHeightNoShowRank');
	}



	// 取得該課程之評量之排名
	async function GetRankDetailPageInfo() {
		await _connection.send({
			service: "_.GetRankDetailPageInfo",
			body: {
				StudentID: studentID,
				ViewSemester: semester,
				Subject: storageSubject,
				SubjectType: subjectType
			},
			result: function (response, error, http) {
				if (error !== null) {
					console.log('GetRankDetailPageInfo', error);
					return 'err';
				} else {
					if (response) {
						setStudentSubjectData([].concat(response.RankMatrix || []));
					}
				}
			}
		});
	}

	// 取得顯示 時間、分數、等第、排名
	async function GetViewSetting() {
		await _connection.send({
			service: "_.GetViewSetting",
			body: {
				ViewSemester: semester,
			},
			result: function (response, error, http) {
				if (error !== null) {
					console.log('GetViewSettingError', error);
					return 'err';
				} else {
					if (response) {
						if ([].concat(response.Setting || []).length) {
							setShowRank(response.Setting.showrank.toLowerCase() === 'true');
						}
					}
				}
			}
		});
	}

	/** 計算 學期科目 班級組距資料*/
	async function CalculateSemesterSubjectScoreLevel() {
		await _connection.send({
			service: "_.CalculateSemesterSubjectScoreLevel",
			body: {
				StudentID: studentID,
				ViewSemester: semester,
				Subject: storageSubject,
			},
			result: function (response, error, http) {
				if (error !== null) {
					console.log('CalculateSemesterSubjectScoreLevel Error', error);
					return 'err';
				} else {
					if (response) {
						setScoreLevel([].concat(response.Response.Level || []));
					}
				}
			}
		});
	}
	/** 計算 學期領域 班級組距資料*/
	async function CalculateSemesterDomainScoreLevel() {
		await _connection.send({
			service: "_.CalculateSemesterDomainScoreLevel",
			body: {
				StudentID: studentID,
				ViewSemester: semester,
				Subject: storageSubject,
			},
			result: function (response, error, http) {
				if (error !== null) {
					console.log('CalculateSemesterDomainScoreLevel Error', error);
					return 'err';
				} else {
					if (response) {
						setScoreLevel([].concat(response.Response.Level || []));
					}
				}
			}
		});
	}
	/** 計算 學期總計領域 班級組距資料*/
	async function CalculateSemesterMixDomainScoreLevel() {
		await _connection.send({
			service: "_.CalculateSemesterMixDomainScoreLevel",
			body: {
				StudentID: studentID,
				ViewSemester: semester,
				Subject: storageSubject,
			},
			result: function (response, error, http) {
				if (error !== null) {
					console.log('CalculateSemesterMixDomainScoreLevel Error', error);
					return 'err';
				} else {
					if (response) {
						setScoreLevel([].concat(response.Response.Level || []));
					}
				}
			}
		});
	}

	const handleChangeViewRank = (e) => {
		setViewRankType(e.target.value);
		setAppDataValues({
			rankType: e.target.value,
		});
	};
	const handleChangeScoreType = (e) => {
		setScoreType(e.target.value);
	};

	const handleBackToHomePage = (e) => {
		// 按下去的時候才存

		setAppDataValues({
			rankType: selectedRankType,
			isBack: true,
		});
		window.history.go(-1);
	};




	const handleManual = (e) => {
		// alert(text);
	};

	const text = "【五標】\n" +
		"頂標：該項目前25%考生成績的平均分數\n" +
		"高標：該項目前50%考生成績的平均分數\n" +
		"均標：該項目全體考生成績的平均分數\n" +
		"低標：該項目後50%考生成績的平均分數\n" +
		"底標：該項目後25%考生成績的平均分數\n\n" +
		"【新五標】\n" +
		"新頂標：該項目成績位於第88百分位數之考生分數\n" +
		"新前標：該項目成績位於第75百分位數之考生分數\n" +
		"新均標：該項目成績位於第50百分位數之考生分數\n" +
		"新後標：該項目成績位於第25百分位數之考生分數\n" +
		"新底標：該項目成績位於第12百分位數之考生分數"

	return (
		<div className="App">
			<div className="container px-3 px-sm-4 py-5 ">

				<div className="d-flex justify-content-between">
					<button type="button" className="btn btn-back active d-flex justify-content-start px-0" onClick={handleBackToHomePage}>＜返回</button>
					{/* <OverlayTrigger key='' placement='left' containerPadding={100} overlay={<Tooltip id='0'>{text}</Tooltip>}> */}
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
						<button type="button" className="btn btn-back active d-flex justify-content-start me-2" onClick={handleManual}>五標說明</button>
					</OverlayTrigger>
				</div>


				{/* <div className='fs-2 text-white m-0 row align-items-center justify-content-center' style={{ width: '100%', height: '1px', background: "#5B9BD5" }}></div> */}

				{studentSubjectData.map((data) => {
					if (data.rank_type === selectedRankType && data.score_type === selectedScoreType) {
						// 					console.log('studentSubjectData', data);
						// console.log('levellllll', levelList);

						return <div className='detailBorder row row-cols-1 row-cols-md-2 row-cols-lg-2'>
							<div className='col'>
								<div className='d-flex me-auto align-items-center pt-2 ps-2'>
									<div className='fs-2 text-white me-1 row align-items-center justify-content-center' style={{ width: '80px', height: '80px', background: "#5B9BD5" }}>{selectedScoreType === '原始成績' ? data.oscore : data.score}</div>
									<div>
										<div className='fs-4 fw-bold'>{data.domain === "" || !data.domain ? "" : data.domain + "-"}{data.subject}</div>
										<div className='d-flex'>節/權數 {data.period === data.credit ? data.credit : data.period + '/' + data.credit}</div>
									</div>
								</div>								
								<div className='ms-4' style={{ visibility: !isNaN(SubjectWeightedAverage) && SubjectWeightedAverage !== null && SubjectWeightedAverage !== undefined && SubjectWeightedAverage !== '' && (scoreLevelData.length > 0) ? 'visible' : 'hidden' }}>班級平均：{SubjectWeightedAverage}</div>    

							</div>
							<div className='col align-self-end'>
								<div className='text-end pt-0 pt-md-2 pt-lg-2 pe-2'>
									{/* <div className=''></div> */}
									<div className=''>計算排名時間：{data.create_time === '' ? '未計算' : data.create_time}</div>
								</div>
							</div>
						</div>
					}


				})}



				<div className='row align-items-start mt-3'>
					<div className='col-12 col-md-6 col-lg-6'>
						<div className="card card-pass">
							<div className="card-body">
								{studentSubjectData.map((data) => {
									if (data.rank_type === selectedRankType && data.score_type === selectedScoreType)
										return <>
											<div className='row row row-cols-2 row-cols-md-2 row-cols-lg-2'>
												<div className='col'>
													<div className='fs-4-blue text-nowrap'>{data.oscore}</div>
													<div className=''>原始分數</div>
												</div>
												{subjectType === 'mixdomain' ?
													<div className='col'>
														<div className='fs-4-blue text-nowrap'>{data.score === '' ? '-' : data.score}</div>
														<div className=''>分數</div>
													</div> :

													<div className='col'>
														<div className='fs-4-blue text-nowrap'>{data.pscore === '' ? '-' : data.pscore}</div>
														<div className=''>補考分數</div>
													</div>
												}

											</div>

											<div className='d-flex text-start mt-2'>{data.textq}</div>
										</>
								})}

							</div>
						</div>

						{[].concat(rankTypeList || []).length < 1 ? '' :
							<>
								<div className="row">
									<div className="col-12 col-md-12 col-lg-6 my-2">
										<select className="form-select" value={selectedRankType} onChange={(e) => handleChangeViewRank(e)}>
											{rankTypeList.map((rankType, index) => {
												return <option key={index} value={rankType}>
													{rankType}</option>
											})}
										</select>
									</div>
									<div className="col-12 col-md-12 col-lg-6 my-2">
										<select className="form-select" value={selectedScoreType} onChange={(e) => handleChangeScoreType(e)}>
											<option value='原始成績'>原始成績</option>
											<option value='擇優成績'>擇優成績</option>
										</select>
									</div>
								</div>

								<table className="table table-bordered" style={{ border: '1px solid #fff' }}>
									{studentSubjectData.map((data) => {
										if (data.rank_type === selectedRankType && data.score_type === selectedScoreType)
											if (!showRank)
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


								{/* <div className={chartHeight}  > */}
								<ResponsiveContainer height={300} width="100%">
								<BarChart data={levelList} layout="vertical" margin={{ top: 30, right: 50, left: 10, bottom: 0 }}>
  <XAxis dataKey="count" type="number" label={{ value: '人數', position: 'right', offset: 10, dy: -15, fill: '#498ED0' }} axisLine={{ stroke: "#2196f3" }} allowDecimals={false} domain={[0, () => (chartMax === 0) ? 1 : chartMax]} />
  <YAxis dataKey="name" type="category" interval={0} width={100} tick={{ fontSize: 10 }} minTickGap={5} label={{ value: '組距', position: 'insideTopLeft', offset: 0, dy: -15, dx: 40, fill: '#498ED0' }} axisLine={{ stroke: "#2196f3" }} />
  <Bar dataKey="count" barSize={25} label={{ position: 'right' }} fillOpacity={0.8} />
</BarChart>

								</ResponsiveContainer>
								{/* </div> */}
							</>}
					</div>

					{[].concat(rankTypeList || []).length < 1 ? '' :
						<>
							{studentSubjectData.map((data) => {
								if (selectedRankType !== '' && data.rank_type === selectedRankType && data.score_type === selectedScoreType)
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
													<td>{data.avg_top_25 === '' ? '' : Math.round(data.avg_top_25 * 100) / 100}</td>
												</tr>
												<tr style={{ background: '#EAEFF7' }}>
													<td>高標</td>
													<td>{data.avg_top_50 === '' ? '' : Math.round(data.avg_top_50 * 100) / 100}</td>
												</tr>
												<tr style={{ background: '#D2DEEF' }}>
													<td>均標</td>
													<td>{data.avg === '' ? '' : Math.round(data.avg * 100) / 100}</td>
												</tr>
												<tr style={{ background: '#EAEFF7' }}>
													<td>低標</td>
													<td>{data.avg_bottom_50 === '' ? '' : Math.round(data.avg_bottom_50 * 100) / 100}</td>
												</tr>
												<tr style={{ background: '#D2DEEF' }}>
													<td>底標</td>
													<td>{data.avg_bottom_25 === '' ? '' : Math.round(data.avg_bottom_25 * 100) / 100}</td>
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
						</>}
				</div>

				{[].concat(scoreLevelData.length || []) > 0 ?
					<div className='mt-3'>
						<ResponsiveContainer height={450} width="100%">
							<BarChart data={levelImmediatelyList} layout="vertical" margin={{ top: 30, right: 50, left: 10, bottom: 0 }}>
								<XAxis dateKey="count" type="number" label={{ value: '人數', position: 'right', offset: 10, dy: -15, fill: '#498ED0' }} axisLine={{ stroke: "#2196f3" }} allowDecimals={false} domain={[0, () => (chartMax === 0) ? 1 : chartMax]} />
								<YAxis dataKey="name" type="category" label={{ value: '組距', position: 'insideTopLeft', offset: 0, dy: -15, dx: 40, fill: '#498ED0' }} axisLine={{ stroke: "#2196f3" }} />
								<Bar dataKey="count" barSize={25} label={{ position: 'right' }} fillOpacity={0.8} >
								</Bar>
							</BarChart>
						</ResponsiveContainer>

						<div>組距資訊為該班學生擇優成績（原始及補考成績進行擇優）即時統計。</div>
					</div>

					: <></>}


				<ScrollToTopButton />
			</div>
		</div>
	);
};

export default RankDetail;
