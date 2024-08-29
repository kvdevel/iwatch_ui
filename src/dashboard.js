import 			{ useState, useEffect, useMemo, useRef, useCallback } from "react";
import 			{ ResponsiveLine } from '@nivo/line'
import 			{ ResponsiveBar } from '@nivo/bar'

import 			axios from 'axios';
import 			moment from 'moment';
import 			{format} from "d3-format";
import 			{useMediaQuery} from 'react-responsive';

import 			{useRecoilState, useRecoilValue} from 'recoil';

import			{globBgColor, globCompBgColor, globTabCBs,} from './App.js';
import			{serverAppStateAtom, serverAppListAtom,} from './tabHandler.js';
import			{SlowestQueryTable} from './detailqueries.js';
import 			{safetypeof, bytesStrFormat, msecStrFormat, LoadingAlert, numSIFormat, usecStrFormat} from './components/util.js';

import			{Typography, Tag, Alert, notification, Card, Col, Row, Statistic, Result, Collapse} from 'antd';
import 			{ CheckCircleFilled, CloseCircleFilled, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

const 			{ErrorBoundary} = Alert;
const 			{Title} = Typography;
const 			{Panel} = Collapse;

export function AppStatsCard({appdata, servname, appname, noextended})
{
	const 		isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' });
	const 		isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
	const		span3 = isBigScreen ? 2 : (isTabletOrMobile ? 12 : 3);
	const		span4 = isBigScreen ? 3 : (isTabletOrMobile ? 16 : 4);

	if (!appdata || appdata.appname !== appname) {
		console.log('Invalid AppStatsCard data seen');
		return null;
	}	

	let			pcap = null, nqueries = null, avgresp = null, errors = null, alerts = null; 
	let			newapps = null, newips = null, newusers = null, newdbs = null, nrecbl = null, loginidb = null;
	
	if (appdata["pcapture Connected"] !== undefined) {
		pcap = <Col span={span3}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign : 'center' }}><span style={{ color : '#b76957'}}><strong><i>pcapture</i></strong></span></div>} bordered={true}>
			{appdata["pcapture Connected"] === 'Yes' ? (
					<div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', backgroundColor : globCompBgColor}}>
					<span style={{ color : 'green', marginRight : 10 }}><strong><i>Connected</i></strong></span>
					<CheckCircleFilled style={{ color : 'green', fontSize : 14 }} />
					</div>
					)
					: (
					<div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', backgroundColor : globCompBgColor}}>
					<span style={{ color : 'red', marginRight : 10 }}><strong><i>Disconnected</i></strong></span>
					<CloseCircleFilled style={{ color : 'red' }} />
					</div>
					)	
			}
			</Card>
			</Col>
	}

	if (appdata["Records Seen"] !== undefined) {
		nqueries = <Col span={span4}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>Queries</i></strong></span></div>} bordered={true}>
				<div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', backgroundColor : globCompBgColor}}>
				<Statistic value={numSIFormat(appdata["Records Seen"])} />
				<span style={{ marginRight : 10 }} />
				{appdata["Percent diff Records Seen"] > 0 && <Statistic value={numSIFormat(appdata["Percent diff Records Seen"])} precision={1} 
						valueStyle={{ color: 'green', fontSize : 16 }} prefix={<ArrowUpOutlined />} suffix="%" />}
				{appdata["Percent diff Records Seen"] < 0 && <Statistic value={numSIFormat(-appdata["Percent diff Records Seen"])} precision={1} 
						valueStyle={{ color: 'red', fontSize : 16 }} prefix={<ArrowDownOutlined />} suffix="%" />}
				</div>
			</Card>
			</Col>
	}

	if (appdata["Errors Seen"] !== undefined) {
		errors = <Col span={span4}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>Errors</i></strong></span></div>} bordered={true}>
				<div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', backgroundColor : globCompBgColor}}>
				<Statistic value={numSIFormat(appdata["Errors Seen"])} />
				<span style={{ marginRight : 10 }} />
				{appdata["Percent diff Errors Seen"] > 0 && <Statistic value={numSIFormat(appdata["Percent diff Errors Seen"])} precision={1} 
						valueStyle={{ color: 'red', fontSize : 16 }} prefix={<ArrowUpOutlined />} suffix="%" />}
				{appdata["Percent diff Errors Seen"] < 0 && <Statistic value={numSIFormat(-appdata["Percent diff Errors Seen"])} precision={1} 
						valueStyle={{ color: 'green', fontSize : 16 }} prefix={<ArrowDownOutlined />} suffix="%" />}
				</div>
			</Card>
			</Col>
	}

	if (appdata["Avg Response in microsecond"] !== undefined) {
		avgresp = <Col span={span4}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>Avg Response</i></strong></span></div>} bordered={true}>
				<div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', backgroundColor : globCompBgColor}}>
				<Statistic value={usecStrFormat(appdata["Avg Response in microsecond"])} valueStyle={{ fontSize : 16 }} />
				<span style={{ marginRight : 10 }} />
				{appdata["Percent diff Avg Response"] > 0 && <Statistic value={numSIFormat(appdata["Percent diff Avg Response"])} precision={1} 
						valueStyle={{ color: 'red', fontSize : 16 }} prefix={<ArrowUpOutlined />} suffix="%" />}
				{appdata["Percent diff Avg Response"] < 0 && <Statistic value={numSIFormat(-appdata["Percent diff Avg Response"])} precision={1} 
						valueStyle={{ color: 'green', fontSize : 16 }} prefix={<ArrowDownOutlined />} suffix="%" />}
				</div>
			</Card>
			</Col>
	}

	if (appdata["Alerts from day start"] !== undefined) {
		alerts = <Col span={span3}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>Alerts</i></strong></span></div>} bordered={true}>
				<div style={{ textAlign : 'center', backgroundColor : globCompBgColor }} >
				<Statistic value={numSIFormat(appdata["Alerts from day start"])} />
				</div>
			</Card>
			</Col>
	}

	if (appdata["New Apps Seen"] !== undefined) {
		newapps = <Col span={span3}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>New Apps</i></strong></span></div>} bordered={true}>
				<div style={{ textAlign : 'center', backgroundColor : globCompBgColor }} >
				<Statistic value={numSIFormat(appdata["New Apps Seen"])} />
				</div>
			</Card>
			</Col>
	}

	if (appdata["New IPs Seen"] !== undefined) {
		newips = <Col span={span3}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>New IPs</i></strong></span></div>} bordered={true}>
				<div style={{ textAlign : 'center', backgroundColor : globCompBgColor }} >
				<Statistic value={numSIFormat(appdata["New IPs Seen"])} />
				</div>
			</Card>
			</Col>
	}

	if (appdata["New DBs Seen"] !== undefined) {
		newdbs = <Col span={span3}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>New DBs</i></strong></span></div>} bordered={true}>
				<div style={{ textAlign : 'center', backgroundColor : globCompBgColor }} >
				<Statistic value={numSIFormat(appdata["New DBs Seen"])} />
				</div>
			</Card>
			</Col>
	}


	if (appdata["New Users Seen"] !== undefined) {
		newips = <Col span={span3}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>New Users</i></strong></span></div>} bordered={true}>
				<div style={{ textAlign : 'center', backgroundColor : globCompBgColor }} >
				<Statistic value={numSIFormat(appdata["New Users Seen"])} />
				</div>
			</Card>
			</Col>
	}

	if (appdata["Records Over 90 pct UniqSQL Baseline"] !== undefined) {
		nrecbl = <Col span={span4}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign: 'center' }}><span style={{ color : '#b76957'}}><strong><i>Queries over Baseline</i></strong></span></div>} bordered={true}>
				<div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', backgroundColor : globCompBgColor}}>
				<Statistic value={numSIFormat(appdata["Records Over 90 pct UniqSQL Baseline"])} />
				<span style={{ marginRight : 10 }} />
				{appdata["Percent diff Records Over 90 pct"] > 0 && <Statistic value={numSIFormat(appdata["Percent diff Records Over 90 pct"])} precision={1} 
						valueStyle={{ color: 'red', fontSize : 16 }} prefix={<ArrowUpOutlined />} suffix="%" />}
				{appdata["Percent diff Records Over 90 pct"] < 0 && <Statistic value={numSIFormat(-appdata["Percent diff Records Over 90 pct"])} precision={1} 
						valueStyle={{ color: 'green', fontSize : 16 }} prefix={<ArrowDownOutlined />} suffix="%" />}
				</div>
			</Card>
			</Col>
	}

	if (appdata["Login idb query"] !== undefined) {
		loginidb = <Col span={span3}>
			<Card title={<div style={{ backgroundColor : globCompBgColor, textAlign : 'center' }}><span style={{ color : '#b76957'}}><strong><i>Login idb</i></strong></span></div>} bordered={true}>
			{appdata["Login idb query"] === 'active' ? (
					<div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', backgroundColor : globCompBgColor}}>
					<span style={{ color : 'green', marginRight : 10 }}><strong><i>Active</i></strong></span>
					<CheckCircleFilled style={{ color : 'green', fontSize : 14 }} />
					</div>
					)
					: (
					<div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', backgroundColor : globCompBgColor}}>
					<span style={{ color : 'grey', marginRight : 10 }}><strong><i>Inactive</i></strong></span>
					<CloseCircleFilled style={{ color : 'grey' }} />
					</div>
					)	
			}
			</Card>
			</Col>
	}


	return (
		<>
		<Row justify="space-evenly" gutter={[16, 16]}>
		{pcap}
		{nqueries}
		{errors}
		{avgresp}
		{alerts}
		</Row>

		{!noextended && (
		<>

		<div style={{ marginTop : 20, marginBottom : 20 }} >
		<Row justify="space-evenly" gutter={[16, 16]}>
		{nrecbl}
		{newapps}
		{newips}
		{newusers}
		{newdbs}
		{loginidb}
		</Row>
		</div>

		</>
		)}

		</>
	);
}	


function AppStatsHandler({servname, appname, servernameoff, appserveroff, tabKey, noextended})
{
	const [{appdata, sertime}, setData] = useState({appdata : null, sertime : ''});
							
	useEffect(() => {

		const fetchData = () => {
			if (globTabCBs.isActiveTabCB && tabKey && !globTabCBs.isActiveTabCB(tabKey)) {
				return;
			}

			axios.get(`/getAppServerStats?servname=${servname}&cacheBrk=${Date.now()}`).then(({data}) => {
				if (data && safetypeof(data) === 'object' && data.servers && data.servers[servernameoff].appservers[appserveroff]) {
					setData({appdata : data.servers[servernameoff].appservers[appserveroff], sertime : data["idata System Time and Uptime"]});	
					return;
				}	

				console.log('Invalid appstats data format received : ', JSON.stringify(data));
			})
			.catch(console.log);
		};

		fetchData();

		let inter = setInterval(fetchData, 5000);

		return () => clearInterval(inter);

	}, [servname, appname, servernameoff, appserveroff, tabKey]);

	if (!appdata) {
		return <LoadingAlert message="Loading Server Statistics..." />;
	}

	if (noextended) {
		return (
			<div style={{ width : '95%', margin : '20px auto 20px auto', background: globCompBgColor }}>
				<AppStatsCard appdata={appdata} servname={servname} appname={appname} noextended={noextended} />
			</div>	
		);	
	}

	return (
		<div style={{ width : '95%', margin : '50px auto 20px auto', background: globCompBgColor }}>
			<div style={{ textAlign: 'center'}} >
			<Title level={5}><em>Statistics from Start of Day</em></Title>
			</div>
		
			<AppStatsCard appdata={appdata} servname={servname} appname={appname} />

			<div style={{ textAlign : 'center' }} >
				<span>idata System Time and Uptime : {sertime}</span>
			</div>
		</div>	
	);
}


function RealTimeGraphs({servname, appname, servernameoff, appserveroff, maxpoints = 25, noextended, tabKey})
{
	const 			[{time, ndata}, setData] = useState( { time : 0, ndata : [] } );
	const 			objref = useRef({ lasttime : Date.now(), pauseRefresh : false });

	useEffect(() => {

		const fetchData = () => {

			const			oldpause = objref.current.pauseRefresh;

			objref.current.pauseRefresh = (globTabCBs.isActiveTabCB ? (!globTabCBs.isActiveTabCB(tabKey)) : false);

			if (objref.current.pauseRefresh) {
				const			tnow = Date.now();

				if (tnow > objref.current.lasttime + 45000 && objref.current.lasttime > 0) {
					setData({ time : 0, ndata : [] });
				}	
				return;
			}

			axios.get(`/getInterimLast?servname=${servname}&appname=${appname}&cacheBrk=${Date.now()}`).then(({data}) => {
				if (data && safetypeof(data) === 'object' && data.servers && data.servers[servernameoff] && data.servers[servernameoff].appservers[appserveroff]) {
					const obj = data.servers[servernameoff].appservers[appserveroff];

					objref.current.lasttime = Date.now();

					setData((prev) => {
						let 		arr = [];

						if (prev.ndata.length > maxpoints) {
							arr =  prev.ndata.slice(1);
						}	
						else {
							if (prev.time === obj.time) {
								arr = prev.ndata.slice(0, -1);
							}
							else {
								arr = prev.ndata.slice(0);
							}	
						}	

						arr.push(obj);

						return {time : obj.time, ndata : arr};
					});	

					return;
				}	

				console.log('Invalid data format received : ', JSON.stringify(data));
			})
			.catch(console.log);
		};

		fetchData();

		let inter = setInterval(fetchData, 5000);

		return () => clearInterval(inter);

	}, [servname, appname, servernameoff, appserveroff, maxpoints, tabKey, objref]);

	// console.log('ndata is ', ndata);
		
	const qpschart = useMemo(() => {

		if (ndata.length < 3) {
			if (objref.current.pauseRefresh) return <Tag color='blue'>Auto Refresh Paused</Tag>;

			return <LoadingAlert message="Loading QPS..." />;
		}	

		const data = [{ id : 'QPS', color: 'hsl(11, 40%, 53%)', data: [], }, ];
		const arr = data[0].data;
		let lasttime = '';

		for (let i = 0; i < ndata.length; ++i) {
			if (lasttime === ndata[i].time) continue;

			lasttime = ndata[i].time;

			arr.push({ x : new Date(ndata[i].time), y : ndata[i].QPS });
		}	

		// console.log('QPS Chart data is ', data);

		return <ResponsiveLine
			data={data}
			margin={{ top: 50, right: 70, bottom: 100, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: true,
				reverse: false
			}}
			xFormat="time:%Y-%m-%dT%H:%M:%SZ"
			yFormat=","
			curve="monotoneX"
			axisTop={null}
			axisRight={null}
			axisBottom={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Time',
				legendOffset: 36,
				legendPosition: 'middle',
				format: '%H:%M:%S',
				tickValues: 4,
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Queries per Sec (QPS)',
				legendOffset: -80,
				legendPosition: 'middle',
				truncateTickAt: 0,
				format: ",", 
			}}
			pointSize={4}
			pointColor={{ theme: 'background' }}
			pointBorderWidth={2}
			pointBorderColor={{ from: 'serieColor' }}
			pointLabel="data.yFormatted"
			pointLabelYOffset={-12}
			onClick = {(point, e) => console.log(JSON.stringify(point))}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ datum: 'color' }}
			sliceTooltip={({ slice }) => {
				return (
					<div style={{ background: 'white', padding: '9px 12px', border: '1px solid #ccc', }} >
						{slice.points[0] && 
							<div style={{ color: slice.points[0].serieColor, padding: '3px 0', }} >
								<strong>Time</strong> : {slice.points[0].data.xFormatted.replace('Z', ' ').replace('T', ' ')}
							</div>
						}
						{slice.points.map((point, index) => (
							<div key={point.id} style={{ color: point.serieColor, padding: '3px 0', }} >
								<strong>{point.serieId}</strong> : {point.data.yFormatted}
							</div>
						))}
					</div>
				);
			}}			
			legends={[
			    {
				anchor: 'bottom',
				direction: 'row',
				justify: false,
				translateX: -100,
				translateY: 50,
				itemsSpacing: 10,
				itemDirection: 'left-to-right',
				itemWidth: 80,
				itemHeight: 20,
				itemOpacity: 0.75,
				symbolSize: 12,
				symbolShape: 'circle',
				symbolBorderColor: 'rgba(0, 0, 0, .5)',
				toggleSerie: false,
				effects: [
				    {
					on: 'hover',
					style: {
					    itemBackground: 'rgba(0, 0, 0, .03)',
					    itemOpacity: 1
					}
				    }
				]
			    }
			]}
		/>;

	}, [ndata, objref]);	

	const respchart = useMemo(() => {

		if (ndata.length < 3) {
			if (objref.current.pauseRefresh) return <Tag color='blue'>Auto Refresh Paused</Tag>;

			return <LoadingAlert message="Loading Response Time..." />;
		}

		const data = [{ id : 'Avg Response', color: 'hsl(11, 40%, 53%)', data: [], }, ];
		const resparr = data[0].data;
		let lasttime = '';

		for (let i = 0; i < ndata.length; ++i) {
			if (lasttime === ndata[i].time) continue;

			lasttime = ndata[i].time;

			resparr.push({ x : new Date(ndata[i].time), y : ndata[i].Avg_Resp_sec * 1000 });
		}	

		// console.log('Response Time Chart data is ', data);

		return <ResponsiveLine
			data={data}
			margin={{ top: 50, right: 70, bottom: 100, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: true,
				reverse: false
			}}
			xFormat="time:%Y-%m-%dT%H:%M:%SZ"
			yFormat={msecStrFormat}
			curve="monotoneX"
			axisTop={null}
			axisRight={null}
			axisBottom={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Time',
				legendOffset: 36,
				legendPosition: 'middle',
				format: '%H:%M:%S',
				tickValues: 4,
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Avg Response Time',
				legendOffset: -80,
				legendPosition: 'middle',
				truncateTickAt: 0,
				format: msecStrFormat, 
			}}
			pointSize={4}
			pointColor={{ theme: 'background' }}
			pointBorderWidth={2}
			pointBorderColor={{ from: 'serieColor' }}
			pointLabel="data.yFormatted"
			pointLabelYOffset={-12}
			onClick = {(point, e) => console.log(JSON.stringify(point))}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ datum: 'color' }}
			sliceTooltip={({ slice }) => {
				return (
					<div style={{ background: 'white', padding: '9px 12px', border: '1px solid #ccc', }} >
						{slice.points[0] && 
							<div style={{ color: slice.points[0].serieColor, padding: '3px 0', }} >
								<strong>Time</strong> : {slice.points[0].data.xFormatted.replace('Z', ' ').replace('T', ' ')}
							</div>
						}
						{slice.points.map((point, index) => (
							<div key={point.id} style={{ color: point.serieColor, padding: '3px 0', }} >
								<strong>{point.serieId}</strong> : {point.data.yFormatted}
							</div>
						))}
					</div>
				);
			}}			
			legends={[
			    {
				anchor: 'bottom',
				direction: 'row',
				justify: false,
				translateX: -100,
				translateY: 50,
				itemsSpacing: 10,
				itemDirection: 'left-to-right',
				itemWidth: 80,
				itemHeight: 20,
				itemOpacity: 0.75,
				symbolSize: 12,
				symbolShape: 'circle',
				symbolBorderColor: 'rgba(0, 0, 0, .5)',
				toggleSerie: false,
				effects: [
				    {
					on: 'hover',
					style: {
					    itemBackground: 'rgba(0, 0, 0, .03)',
					    itemOpacity: 1
					}
				    }
				]
			    }
			]}
		/>;

	}, [ndata, objref]);	

	const byteschart = useMemo(() => {

		if (noextended) return null;

		if (ndata.length < 3) {
			if (objref.current.pauseRefresh) return <Tag color='blue'>Auto Refresh Paused</Tag>;
			
			return <LoadingAlert message="Loading Bytes In/Out..." />;
		}

		const data = [{ id : 'BytesIn', color: 'hsl(11, 40%, 53%)', data: [], }, {id : 'BytesOut', color: 'hsl(1, 50%, 20%)', data : [], }];
		const inarr = data[0].data, outarr = data[1].data;
		let lasttime = '';

		for (let i = 0; i < ndata.length; ++i) {
			if (lasttime === ndata[i].time) continue;

			lasttime = ndata[i].time;

			inarr.push({ x : new Date(ndata[i].time), y : ndata[i].BytesIn });
			outarr.push({ x : new Date(ndata[i].time), y : ndata[i].BytesOut });
		}	

		// console.log('Bytes In/Out Chart data is ', data);

		return <ResponsiveLine
			data={data}
			margin={{ top: 50, right: 70, bottom: 100, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: true,
				reverse: false
			}}
			xFormat="time:%Y-%m-%dT%H:%M:%SZ"
			yFormat={bytesStrFormat}
			curve="monotoneX"
			axisTop={null}
			axisRight={null}
			axisBottom={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Time',
				legendOffset: 36,
				legendPosition: 'middle',
				format: '%H:%M:%S',
				tickValues: 4,
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Bytes In / Out',
				legendOffset: -80,
				legendPosition: 'middle',
				truncateTickAt: 0,
				format: bytesStrFormat, 
			}}
			pointSize={4}
			pointColor={{ theme: 'background' }}
			pointBorderWidth={2}
			pointBorderColor={{ from: 'serieColor' }}
			pointLabel="data.yFormatted"
			pointLabelYOffset={-12}
			onClick = {(point, e) => console.log(JSON.stringify(point))}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ datum: 'color' }}
			sliceTooltip={({ slice }) => {
				return (
					<div style={{ background: 'white', padding: '9px 12px', border: '1px solid #ccc', }} >
						{slice.points[0] && 
							<div style={{ color: slice.points[0].serieColor, padding: '3px 0', }} >
								<strong>Time</strong> : {slice.points[0].data.xFormatted.replace('Z', ' ').replace('T', ' ')}
							</div>
						}
						{slice.points.map((point, index) => (
							<div key={point.id} style={{ color: point.serieColor, padding: '3px 0', }} >
								<strong>{point.serieId}</strong> : {point.data.yFormatted}
							</div>
						))}
					</div>
				);
			}}			
			legends={[
			    {
				anchor: 'bottom',
				direction: 'row',
				justify: false,
				translateX: -100,
				translateY: 50,
				itemsSpacing: 10,
				itemDirection: 'left-to-right',
				itemWidth: 80,
				itemHeight: 20,
				itemOpacity: 0.75,
				symbolSize: 12,
				symbolShape: 'circle',
				symbolBorderColor: 'rgba(0, 0, 0, .5)',
				toggleSerie: false,
				effects: [
				    {
					on: 'hover',
					style: {
					    itemBackground: 'rgba(0, 0, 0, .03)',
					    itemOpacity: 1
					}
				    }
				]
			    }
			]}
		/>;

	}, [ndata, noextended, objref]);	

	const errorchart = useMemo(() => {

		if (noextended) return null;

		if (ndata.length < 3) {
			if (objref.current.pauseRefresh) return <Tag color='blue'>Auto Refresh Paused</Tag>;
			
			return <LoadingAlert message="Loading Errors..." />;
		}

		const data = [{ id : 'Errors', color: 'hsl(11, 40%, 53%)', data: [], }, {id : 'Login Errors', color: 'hsl(1, 50%, 20%)', data : [], }];
		const errarr = data[0].data, logarr = data[1].data;
		let lasttime = '';

		for (let i = 0; i < ndata.length; ++i) {
			if (lasttime === ndata[i].time) continue;

			lasttime = ndata[i].time;

			errarr.push({ x : new Date(ndata[i].time), y : ndata[i].Errors });
			logarr.push({ x : new Date(ndata[i].time), y : ndata[i].FailedLogins });
		}	

		// console.log('Error Chart data is ', data);

		return <ResponsiveLine
			data={data}
			margin={{ top: 50, right: 70, bottom: 100, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: true,
				reverse: false
			}}
			xFormat="time:%Y-%m-%dT%H:%M:%SZ"
			yFormat=","
			curve="monotoneX"
			axisTop={null}
			axisRight={null}
			axisBottom={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Time',
				legendOffset: 36,
				legendPosition: 'middle',
				format: '%H:%M:%S',
				tickValues: 4,
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Errors & Login Errors',
				legendOffset: -80,
				legendPosition: 'middle',
				truncateTickAt: 0,
				format: ",", 
			}}
			pointSize={4}
			pointColor={{ theme: 'background' }}
			pointBorderWidth={2}
			pointBorderColor={{ from: 'serieColor' }}
			pointLabel="data.yFormatted"
			pointLabelYOffset={-12}
			onClick = {(point, e) => console.log(JSON.stringify(point))}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ datum: 'color' }}
			sliceTooltip={({ slice }) => {
				return (
					<div style={{ background: 'white', padding: '9px 12px', border: '1px solid #ccc', }} >
						{slice.points[0] && 
							<div style={{ color: slice.points[0].serieColor, padding: '3px 0', }} >
								<strong>Time</strong> : {slice.points[0].data.xFormatted.replace('Z', ' ').replace('T', ' ')}
							</div>
						}
						{slice.points.map((point, index) => (
							<div key={point.id} style={{ color: point.serieColor, padding: '3px 0', }} >
								<strong>{point.serieId}</strong> : {point.data.yFormatted}
							</div>
						))}
					</div>
				);
			}}						
			legends={[
			    {
				anchor: 'bottom',
				direction: 'row',
				justify: false,
				translateX: -100,
				translateY: 50,
				itemsSpacing: 10,
				itemDirection: 'left-to-right',
				itemWidth: 80,
				itemHeight: 20,
				itemOpacity: 0.75,
				symbolSize: 12,
				symbolShape: 'circle',
				symbolBorderColor: 'rgba(0, 0, 0, .5)',
				toggleSerie: false,
				effects: [
				    {
					on: 'hover',
					style: {
					    itemBackground: 'rgba(0, 0, 0, .03)',
					    itemOpacity: 1
					}
				    }
				]
			    }
			]}
		/>;

	}, [ndata, noextended, objref]);	

	return (
		<>
		
		{!noextended && 
		<div style={{ textAlign: 'center', marginTop: 30 }} >
		<Title level={5}>Real Time Graphs for {servname} / {appname}</Title>
		<span style={{ fontSize : 14 }}><strong>at time {moment().format("MMM DD HH:mm:ss Z")}</strong></span>
		</div>
		}

		<div style={{ textAlign: 'center', marginTop: 30 }} >
		<span style={{ fontSize : 14 }}><i>Click on a Point for further querying...</i></span>
		</div>

		<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', borderBottom : '1px dotted #d9d9d9', borderRadius: 5 }}>
			<div style={{ height: !noextended ? 400 : 300, width : 700 }}>
			{qpschart}
			</div>
			<div style={{ height: !noextended ? 400 : 300, width : 700 }}>
			{respchart}
			</div>
			<div style={{ height: !noextended ? 400 : 0, width : !noextended ? 700 : 0 }}>
			{byteschart}
			</div>
			<div style={{ height: !noextended ? 400 : 0, width : !noextended ? 700 : 0 }}>
			{errorchart}
			</div>
		</div>

		</>
	);
};

function getDistributionData(odata, type, desc)
{
	if (!odata || !odata["0"] || !odata["1"] || !odata["7"] || !odata["-1"]) return null;

	if (!type || type === "respdist") return [
		{
			"slot" 		: "< 300 usec",
			"Last 1 min" 	: odata["0"].data.lt300us,
			"Baseline" 	: odata["-1"].data.lt300us,
			"Yesterday"	: odata["1"].data.lt300us,
			"Last Week"	: odata["7"].data.lt300us,
		},
		{
			"slot" 		: "< 1 msec",
			"Last 1 min" 	: odata["0"].data.lt1ms,
			"Baseline" 	: odata["-1"].data.lt1ms,
			"Yesterday"	: odata["1"].data.lt1ms,
			"Last Week"	: odata["7"].data.lt1ms,
		},
		{
			"slot" 		: "< 10 msec",
			"Last 1 min" 	: odata["0"].data.lt10ms,
			"Baseline" 	: odata["-1"].data.lt10ms,
			"Yesterday"	: odata["1"].data.lt10ms,
			"Last Week"	: odata["7"].data.lt10ms,
		},
		{
			"slot" 		: "< 50 msec",
			"Last 1 min" 	: odata["0"].data.lt50ms,
			"Baseline" 	: odata["-1"].data.lt50ms,
			"Yesterday"	: odata["1"].data.lt50ms,
			"Last Week"	: odata["7"].data.lt50ms,
		},
		{
			"slot" 		: "< 250 msec",
			"Last 1 min" 	: odata["0"].data.lt250ms,
			"Baseline" 	: odata["-1"].data.lt250ms,
			"Yesterday"	: odata["1"].data.lt250ms,
			"Last Week"	: odata["7"].data.lt250ms,
		},
		{
			"slot" 		: "< 1 sec",
			"Last 1 min" 	: odata["0"].data.lt1s,
			"Baseline" 	: odata["-1"].data.lt1s,
			"Yesterday"	: odata["1"].data.lt1s,
			"Last Week"	: odata["7"].data.lt1s,
		},
		{
			"slot" 		: ">= 1 sec",
			"Last 1 min" 	: odata["0"].data.gte1s,
			"Baseline" 	: odata["-1"].data.gte1s,
			"Yesterday"	: odata["1"].data.gte1s,
			"Last Week"	: odata["7"].data.gte1s,
		},
	];

	if (odata["0"].data[type] === undefined) {
		return null;
	}	

	if (type === 'avgrespt' || type === 'avg99respt') {
		return [{
			"dist"		: desc,
			"Last 1 min" 	: (odata["0"].data[type]/1000).toFixed(3),
			"Baseline" 	: (odata["-1"].data[type]/1000).toFixed(3),
			"Yesterday"	: (odata["1"].data[type]/1000).toFixed(3),
			"Last Week"	: (odata["7"].data[type]/1000).toFixed(3),
		}];
	}	

	return [{
		"dist"		: desc,
		"Last 1 min" 	: odata["0"].data[type],
		"Baseline" 	: odata["-1"].data[type],
		"Yesterday"	: odata["1"].data[type],
		"Last Week"	: odata["7"].data[type],
	}];
}	

function getDistAxisType(data)
{
	let 			maxval = 0, minval = Number.MAX_SAFE_INTEGER;
	const			odata = safetypeof(data !== 'array' ? [data] : data);
	
	for (let o of odata) {
		if (o["Last 1 min"] > maxval) maxval = o["Last 1 min"];
		if (o["Baseline"] > maxval) maxval = o["Baseline"];
		if (o["Yesterday"] > maxval) maxval = o["Yesterday"];
		if (o["Last Week"] > maxval) maxval = o["Last Week"];

		if (o["Last 1 min"] < minval) minval = o["Last 1 min"];
		if (o["Baseline"] < minval) minval = o["Baseline"];
		if (o["Yesterday"] < minval) minval = o["Yesterday"];
		if (o["Last Week"] < minval) minval = o["Last Week"];
	}	

	if (maxval > 1000000 || maxval - minval > 50000) return 'symlog';

	return 'linear';
}

function RespDistChart({servname, appname, tabKey})
{
	const [{respdistdata, qpsdata, errordata, avgrespdata, avg99respdata, bytesindata, bytesoutdata}, setData] = useState({
															respdistdata : null,
															qpsdata : null,
															errordata : null,
															avgrespdata : null,
															avg99respdata : null,
															bytesindata : null,
															bytesoutdata : null,
															});
							
	useEffect(() => {

		const fetchData = () => {

			if (globTabCBs.isActiveTabCB && tabKey && !globTabCBs.isActiveTabCB(tabKey)) {
				return;
			}

			axios.get(`/getRespTimeDistrib?servname=${servname}&appname=${appname}&dayoffset=0+-1+1+7&cacheBrk=${Date.now()}`).then(({data}) => {
				if (data && safetypeof(data) === 'object' && data["0"] && data["-1"]) {
					const newdata = {};

					newdata.respdistdata = getDistributionData(data, "respdist", "Response Distribution");
					
					if (!newdata.respdistdata) {
						throw new Error(`Invalid Response Distribution data received : ${JSON.stringify(data).slice(0, 64)}`);
					}

					newdata.qpsdata = getDistributionData(data, "qps", "QPS");
					
					if (!newdata.qpsdata) {
						throw new Error(`Invalid Response Distribution qps data received : ${JSON.stringify(data).slice(0, 64)}`);
					}

					newdata.errordata = getDistributionData(data, "errors", "Errors");
					
					if (!newdata.errordata) {
						throw new Error(`Invalid Response Distribution error data received : ${JSON.stringify(data).slice(0, 64)}`);
					}

					newdata.avgrespdata = getDistributionData(data, "avgrespt", "Avg Response in msec");
					
					if (!newdata.avgrespdata) {
						throw new Error(`Invalid Response Distribution avgrespt data received : ${JSON.stringify(data).slice(0, 64)}`);
					}

					newdata.avg99respdata = getDistributionData(data, "avg99respt", "Avg p99 Response in msec");
					
					if (!newdata.avg99respdata) {
						throw new Error(`Invalid Response Distribution avg99respt data received : ${JSON.stringify(data).slice(0, 64)}`);
					}

					newdata.bytesindata = getDistributionData(data, "bytesin", "Bytes In");
					
					if (!newdata.bytesindata) {
						throw new Error(`Invalid Response Distribution bytesin data received : ${JSON.stringify(data).slice(0, 64)}`);
					}

					newdata.bytesoutdata = getDistributionData(data, "bytesout", "Bytes Out");
					
					if (!newdata.bytesoutdata) {
						throw new Error(`Invalid Response Distribution bytesout data received : ${JSON.stringify(data).slice(0, 64)}`);
					}

					setData(newdata);	
					return;
				}	

				console.log('Invalid data format received : ', JSON.stringify(data));
			})
			.catch(console.log);
		};

		fetchData();

		let inter = setInterval(fetchData, 60000);

		return () => clearInterval(inter);

	}, [servname, appname, tabKey]);

	if (!respdistdata) {
		return <LoadingAlert message="Loading Response Distribution..." />;
	}

	const getSingleBar = (sdata, formatstr) => (
		<>

		<div style={{ textAlign: 'center' }} >
		<Title level={5}>{sdata[0].dist}</Title>
		<span>in last minute</span>
		</div>

		<ResponsiveBar
			data={sdata}
			keys={[ 'Last 1 min', 'Baseline', 'Yesterday', 'Last Week' ]}
			indexBy="dist"
			margin={{ top: 50, right: 130, bottom: 50, left: 90 }}
			padding={0.3}
			innerPadding={24}
			groupMode="grouped"
			valueScale={{ type: getDistAxisType(sdata) }}
			indexScale={{ type: 'band', round: true }}
			colors={{ scheme: 'accent' }}
			borderRadius={4}
			borderColor={{
				from: 'color',
				modifiers: [ [ 'darker', 1.6 ] ]
			}}
			axisTop={null}
			axisRight={null}
			axisBottom={{
				tickSize: 15,
				tickPadding: 5,
				tickRotation: 0,
				legend : '',
				legendPosition: 'middle',
				legendOffset: 32,
				truncateTickAt: 0
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: '',
				legendPosition: 'middle',
				legendOffset: -50,
				truncateTickAt: 0,
				format: ",",
			}}
			onClick = {(node, e) => console.log(JSON.stringify(node))}
			label={d => formatstr(d.value)}
			labelSkipWidth={12}
			labelSkipHeight={12}
			labelTextColor={{
				from: 'color',
				modifiers: [
					[
						'darker',
						1.6
					]
				]
			}}
			legends={[
				{
					dataFrom: 'keys',
					anchor: 'bottom-right',
					direction: 'column',
					justify: false,
					translateX: 120,
					translateY: 0,
					itemsSpacing: 2,
					itemWidth: 100,
					itemHeight: 20,
					itemDirection: 'left-to-right',
					itemOpacity: 0.85,
					symbolSize: 20,
					effects: [
						{
							on: 'hover',
							style: {
							    itemOpacity: 1
							}
						}
					]
				}
			]}
		/>

		</>
	);	

	return (
		
		<>
		<div style={{ width : '95%', margin : '50px auto 20px auto', background: globCompBgColor }}>

		<div style={{ textAlign: 'center', marginTop: 30 }} >
		<Title level={5}>Query Distribution per minute by Response Time for {servname} / {appname}</Title>
		<span style={{ fontSize : 14 }}><strong>at time {moment().format("MMM DD HH:mm:ss Z")}</strong></span>
		</div>

		<div style={{ height : 500 }} >
		<ResponsiveBar
			data={respdistdata}
			keys={[ 'Last 1 min', 'Baseline', 'Yesterday', 'Last Week' ]}
			indexBy="slot"
			margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
			padding={0.3}
			innerPadding={3}
			groupMode="grouped"
			valueScale={{ type: getDistAxisType(respdistdata) }}
			indexScale={{ type: 'band', round: true }}
			colors={{ scheme: 'accent' }}
			borderRadius={4}
			borderColor={{
				from: 'color',
				modifiers: [ [ 'darker', 1.6 ] ]
			}}
			axisTop={null}
			axisRight={null}
			axisBottom={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Query Distribution by Response Time Slots',
				legendPosition: 'middle',
				legendOffset: 32,
				truncateTickAt: 0
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Query Count',
				legendPosition: 'middle',
				legendOffset: -50,
				truncateTickAt: 0,
				format: ",",
			}}
			onClick = {(node, e) => console.log(JSON.stringify(node))}
			label={d => format(".0s")(d.value)}
			labelSkipWidth={12}
			labelSkipHeight={12}
			labelTextColor={{
				from: 'color',
				modifiers: [
					[
						'darker',
						1.6
					]
				]
			}}
			legends={[
				{
					dataFrom: 'keys',
					anchor: 'bottom-right',
					direction: 'column',
					justify: false,
					translateX: 120,
					translateY: 0,
					itemsSpacing: 2,
					itemWidth: 100,
					itemHeight: 20,
					itemDirection: 'left-to-right',
					itemOpacity: 0.85,
					symbolSize: 20,
					effects: [
						{
							on: 'hover',
							style: {
							    itemOpacity: 1
							}
						}
					]
				}
			]}
		/>
		</div>

		</div>

		
		<div style={{ width : '95%', display: 'flex', justifyContent: 'space-around', placeItems: 'center', flexWrap: 'wrap', borderBottom : '1px dotted #d9d9d9', borderRadius: 5, 
				margin : '50px auto 20px auto', }}>
			<div style={{ height: 400, width : 700, marginTop : 50, background: globCompBgColor, }}>
			{getSingleBar(qpsdata, format(','))}
			</div>
			<div style={{ height: 400, width : 700, marginTop : 50, background: globCompBgColor, }}>
			{getSingleBar(errordata, format('.3~s'))}
			</div>
			<div style={{ height: 400, width : 700, marginTop : 50, background: globCompBgColor, }}>
			{getSingleBar(avgrespdata, msecStrFormat)}
			</div>
			<div style={{ height: 400, width : 700, marginTop : 50, background: globCompBgColor, }}>
			{getSingleBar(avg99respdata, msecStrFormat)}
			</div>
			<div style={{ height: 400, width : 700, marginTop : 50, background: globCompBgColor, }}>
			{getSingleBar(bytesindata, bytesStrFormat)}
			</div>
			<div style={{ height: 400, width : 700, marginTop : 50, background: globCompBgColor, }}>
			{getSingleBar(bytesoutdata, bytesStrFormat)}
			</div>
		</div>
	
		</>
	);	
}		

export function GlobalDashboard({tabKey})
{
	const			globServerAppList = useRecoilValue(serverAppListAtom);

	const getHeader = (text) => {
		return <div style={{ textAlign: 'center', }}><Title level={5}><em>{text}</em></Title></div>;
	};

	return (
		<>

		<div style={{ textAlign: 'center', marginBottom: 20 }} >
		<Title level={3}><em>Global Dashboard</em></Title>
		</div>
	
		<div style={{ width : '95%', margin : '50px auto 50px auto', }}>
		<Collapse  defaultActiveKey="0" >
			{globServerAppList.map((serv, id) => (
				<Panel 
					header={getHeader(`Servername : ${serv.value} (${serv.children.length} Apps)`)} 
					key={String(id)}
				>
					<Collapse defaultActiveKey={`${id}:0`}>
						{serv.children.map((app, aid) => (

						<Panel 
							header={getHeader(app.value)} 
							key={`${id}:${aid}`}
						>
							<div style={{ background: globBgColor }}>

							<ErrorBoundary>

							<AppStatsHandler servname={serv.value} appname={app.value} servernameoff={id} appserveroff={aid} tabKey={tabKey} noextended={true} />

							<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>
								<RealTimeGraphs key={`${id}.${aid}`} servname={serv.value} appname={app.value} 
										servernameoff={id} appserveroff={aid} tabKey={tabKey} noextended={true} />
							</div>	

							</ErrorBoundary>
							
							</div>
						</Panel>
						))}
					</Collapse>
				</Panel>
			))}
			
		</Collapse>
		</div>

		</>
	);
}


export function Dashboard({tabKey})
{
	const {servname, appname, servernameoff, appserveroff} = useRecoilValue(serverAppStateAtom);

	if (!servname || !appname || servernameoff === undefined || appserveroff === undefined) {
		return (
			<>
			<div style={{ background: globBgColor }}>

			<div style={{ textAlign: 'center', marginTop: 20 }} >
			<Title level={3}><em>DB Realtime Dashboard</em></Title>
			</div>

			<Result status="warning" title="No Valid Capture Servers found. Please register pcapture with idata first..." />

			</div>
			</>
		);	
	}

	return (
		<>
		<div style={{ background: globBgColor }}>

		<div style={{ textAlign: 'center' }} >
		<Title level={3}><em>DB Realtime Dashboard</em></Title>
		<span style={{ fontSize : 14 }}><strong>Server {servname} : Appname {appname}</strong></span>
		</div>

		<ErrorBoundary>

		<AppStatsHandler servname={servname} appname={appname} servernameoff={servernameoff} appserveroff={appserveroff} tabKey={tabKey} />

		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>
			<RealTimeGraphs key={`${servernameoff}.${appserveroff}`} servname={servname} appname={appname} servernameoff={servernameoff} appserveroff={appserveroff} tabKey={tabKey} />
		</div>	

		<RespDistChart servname={servname} appname={appname} tabKey={tabKey} />

		<div style={{ marginTop : 90 }} />

		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>
			<SlowestQueryTable servname={servname} appname={appname} tabKey={tabKey} />
		</div>	

		</ErrorBoundary>
		
		</div>
		</>
	);
}	
