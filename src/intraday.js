import 			{ useState, useEffect, useMemo, useRef, useCallback } from 'react';
import 			{ ResponsiveLine } from '@nivo/line'
import 			{ ResponsiveBar } from '@nivo/bar'

import 			axios from 'axios';
import 			moment from 'moment';
import 			{format} from "d3-format";
import 			{useRecoilState, useRecoilValue} from 'recoil';

import			{globBgColor, globCompBgColor, globTabCBs,} from './App.js';
import			{serverAppStateAtom, serverAppListAtom, intradayKey} from './tabHandler.js';
import 			{safetypeof, bytesStrFormat, msecStrFormat, LoadingAlert, numSIFormat, usecStrFormat,
			numberOr1, getTickIntervalString, ComponentLife, CreateTab, ButtonModal, removeUndefinedProps} from './components/util.js';
import 			{TimeRangeAggrModal} from './components/dateTimeZone.js';

import			{Typography, Tag, Alert, notification, Card, Col, Row, Statistic, Modal, message, Space, Button} from 'antd';
import 			{ CheckCircleFilled, CloseCircleFilled, ArrowUpOutlined, ArrowDownOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'

const 			{ErrorBoundary} = Alert;
const 			{Title} = Typography;

const			fetchIntervalmsec = 60000;

export function IntradayDashboard({autoRefresh, starttime, endtime, tabKey})
{
	const 		objref 						= useRef(null);

	const		[{idata, isloading, isapierror}, setApiData] 	= useState({idata : null, isloading : true, isapierror : false});
	const		[isPauseRefresh, pauseRefresh] 			= useState(false);
	const		[, setForceRefresh] 				= useState();

	const		[bytesinMarkers, setbytesinMarkers] 		= useState();
	const		[qpsMarkers, setqpsMarkers] 			= useState();
	const		[avgrespMarkers, setavgrespMarkers] 		= useState();
	const		[errorMarkers, seterrorMarkers] 		= useState();
	const		[p99respMarkers, setp99respMarkers] 		= useState();
	const		[loginMarkers, setloginMarkers] 		= useState();
	const		[failloginMarkers, setfailloginMarkers] 	= useState();
	const		[bytesoutMarkers, setbytesoutMarkers] 		= useState();
	const		[pctblMarkers, setpctblMarkers] 		= useState();
	const		[activesessMarkers, setactivesessMarkers]	= useState();
	const		[alertMarkers, setalertMarkers] 		= useState();
	const		[newusqlMarkers, setnewusqlMarkers] 		= useState();
	const		[newappMarkers, setnewappMarkers] 		= useState();
	const 		{servname, appname, servernameoff, appserveroff} = useRecoilValue(serverAppStateAtom);


	if (objref.current === null) {
		objref.current = {
			nextfetchtime		: Date.now(),
			nerrorretries		: 0,
			pauseRefresh		: false,
			isPauseRefresh		: false,
			inactivetab		: false,
			modalCount		: 0,
			isstarted		: false,
			prevdata		: null,
			timestr 		: '', 
		};	
	}

	useEffect(() => {
		console.log(`Intraday Dashboard initial Effect called...`);

		return () => {
			console.log(`Intraday Dashboard destructor called...`);
		};	
	}, []);

	const validProps = useMemo(() => {	
		
		if (!servname || !appname) {
			throw new Error("No valid servname or appname specified");
		}	

		if (starttime && endtime) {
			let		mstart = moment(starttime, moment.ISO_8601), mend;

			if (false === mstart.isValid()) {
				throw new Error(`Invalid starttime specified : ${starttime}`);
			}	

			if (endtime) {
				mend = moment(endtime, moment.ISO_8601);

				if (false === mend.isValid()) {
					throw new Error(`Invalid endtime specified : ${endtime}`);
				}
				else if (mend.unix() < mstart.unix()) {
					throw new Error(`Invalid endtime specified : endtime less than starttime : ${endtime}`);
				}	
			}	
			
			objref.current.pauseRefresh = true;
		}
		else if (!autoRefresh && (!starttime || !endtime)) {
			throw new Error(`autoRefresh disabled but no starttime or endtime specified`);
		}	

		return true;

	}, [objref, servname, appname, starttime, endtime, autoRefresh]);	

	if (validProps === false) {
		throw new Error(`Internal Error : Intraday Dashboard validProps check failed`);
	}	

	useEffect(() => {
		console.log(`isPauseRefresh Changes seen : isPauseRefresh = ${isPauseRefresh}`);

		objref.current.isPauseRefresh = isPauseRefresh;
		objref.current.pauseRefresh = isPauseRefresh;
	}, [isPauseRefresh, objref]);

	const modalCount = useCallback((isup) => {
		if (isup === true) {
			objref.current.modalCount++;
		}	
		else if (isup === false && objref.current.modalCount > 0) {
			objref.current.modalCount--;
		}	
	}, [objref]);	

	useEffect(() => {
		
		let 		timer1;

		timer1 = setTimeout(async function apiCall() {
			try {
				let		conf, currtime = Date.now(), tstart, tend, forcerefresh;
				const		oldpause = objref.current.pauseRefresh;

				if (globTabCBs.isActiveTabCB && tabKey) {
					objref.current.pauseRefresh = !globTabCBs.isActiveTabCB(tabKey);
					
					if (!objref.current.pauseRefresh && objref.current.inactivetab === true) {
						forcerefresh = true;
					}

					objref.current.inactivetab = objref.current.pauseRefresh;
				}

				if (objref.current.modalCount > 0) {
					objref.current.pauseRefresh = true;
				}	

				if (objref.current.isPauseRefresh === true) {
					objref.current.pauseRefresh = true;
				}	

				if (true === objref.current.pauseRefresh || currtime < objref.current.nextfetchtime || (0 === objref.current.nextfetchtime && objref.current.isstarted)) {
					if (forcerefresh || (oldpause === false && objref.current.pauseRefresh)) {
						setForceRefresh();
					}	

					return;
				}

				if (!autoRefresh) {
					tstart = starttime;
					tend = (+moment(endtime, moment.ISO_8601) > currtime ? moment().format() : endtime);
				}
				else {
					tstart = moment().subtract(60, 'minute').format();
					tend = moment().format();
				}	

				setApiData({idata : [], isloading : true, isapierror : false});

				let 		res = await axios.get('/getIntraDayInfo', 
									{
										params : new URLSearchParams(removeUndefinedProps({
											servname,
											appname,
											starttime : tstart,
											endtime : tend,
										})),	
									});
												

				if (autoRefresh === true) {
					objref.current.nextfetchtime = Date.now() + fetchIntervalmsec;
				}
				else {
					objref.current.nextfetchtime = 0;
				}	

				if (safetypeof(res.data) === 'object' && safetypeof(res.data.ActiveSessions) === 'array') { 
					setApiData({idata : res.data, isloading : false, isapierror : false});
				
					objref.current.nerrorretries = 0
					objref.current.isstarted = true;
				}
				else {
					setApiData({idata : null, isloading : false, isapierror : true});
					notification.error({message : "Data Fetch Error", description : "Invalid Data format during Intraday Data fetch... Will retry a few times later."});

					if (objref.current.nerrorretries++ < 5) {
						objref.current.nextfetchtime = Date.now() + 10000;
					}	
					else {
						objref.current.nextfetchtime = Date.now() + 60000;
					}	
				}	
			}
			catch(e) {
				setApiData({idata : null, isloading : false, isapierror : true});

				if (e.response && (e.response.status === 401)) {
					notification.error({message : "Authentication Failure", 
						description : `Authentication Error occured while waiting for new data : ${e.response ? JSON.stringify(e.response.data) : e.message}`});

				}
				else {
					notification.error({message : "Data Fetch Exception Error", 
						description : `Exception occured while waiting for new data : ${e.response ? JSON.stringify(e.response.data) : e.message}`});
				}

				console.log(`Exception caught while waiting for Intraday response : ${e}\n${e.stack}\n`);

				if (objref.current.nerrorretries++ < 5) {
					objref.current.nextfetchtime = Date.now() + 10000;
				}
				else {
					objref.current.nextfetchtime = Date.now() + 60000;
				}	
			}	
			finally {
				timer1 = setTimeout(apiCall, 2000);
			}
		}, 0);

		return () => { 
			if (timer1) clearTimeout(timer1);

			objref.current.nextfetchtime = Date.now() + 3000;
		};
		
	}, [objref, servname, appname, autoRefresh, starttime, endtime, tabKey]);	
	
	console.log('Received intraday data : ', idata);
	
	let			hdrtag = null, bodycont = null;
	

	const qpschart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.QPS) === 'array' && safetypeof(idata.QPS_Cum) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.QPS, bdata = idata.QPS_Cum;
		const 			data = [{ id : 'QPS', data: [], }, { id : 'Baseline', data: [], }];
		const 			qarr = data[0].data, barr = data[1].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});

			if (bdata[i]) {
				barr.push({ x : new Date(bdata[i][0]), y : bdata[i][1]});
			}	
			else {
				barr.push({ x : new Date(qdata[i][0]), y : 0});
			}	
		}	

		if (lasttime && firsttime) {
			objref.current.timestr = (autoRefresh ? 'Last 1 Hour : ' : '');

			objref.current.timestr += `Start Time ${moment(firsttime).format("MMM DD HH:mm:ss Z")} - End Time ${moment(lasttime).format("MMM DD HH:mm:ss Z")} in 1 minute intervals`;
		}	

		// console.log('QPS Chart data is ', data);

		const handleqpsClick = ({points}) => {
			if (points[1] && points[1].data) {

				if (qpsMarkers && qpsMarkers[0]) {
					const tstart = qpsMarkers[0].value, tend = points[1].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setqpsMarkers(), 100);

					return;
				}	

				setTimeout(() => setqpsMarkers(), 15000);
				setqpsMarkers([ 
					{ 
						axis: 'x', 
						value: points[1].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[1] for handleqpsClick()');
			}	
		};	

		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'QPS vs Baseline QPS',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handleqpsClick(point)}}
			markers={qpsMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>
		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Queries per Sec (QPS)</Title>
				{!qpsMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);

	}, [idata, qpsMarkers, modalCount, objref, autoRefresh]);	


	const avgrespchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.Avg_Resp_usec) === 'array' && safetypeof(idata.Avg_Resp_usec_Cum) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.Avg_Resp_usec, bdata = idata.Avg_Resp_usec_Cum;
		const 			data = [{ id : 'Avg Response msec', data: [], }, { id : 'Baseline', data: [], }];
		const 			qarr = data[0].data, barr = data[1].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]/1000});

			if (bdata[i]) {
				barr.push({ x : new Date(bdata[i][0]), y : bdata[i][1]/1000});
			}	
			else {
				barr.push({ x : new Date(qdata[i][0]), y : 0});
			}	
		}	

		// console.log('Avg Response Chart data is ', data);

		const handleavgrespClick = ({points}) => {
			if (points[1] && points[1].data) {

				if (avgrespMarkers && avgrespMarkers[0]) {
					const tstart = avgrespMarkers[0].value, tend = points[1].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setavgrespMarkers(), 100);

					return;
				}	

				setTimeout(() => setavgrespMarkers(), 15000);
				setavgrespMarkers([ 
					{ 
						axis: 'x', 
						value: points[1].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[1] for handleavgrespClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Avg Response msec vs Baseline',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handleavgrespClick(point)}}
			markers={avgrespMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Avg Response msec</Title>
				{!avgrespMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, avgrespMarkers, modalCount]);	


	const errorschart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.Errors) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.Errors;
		const 			data = [{ id : 'Errors', data: [], },];
		const 			qarr = data[0].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});
		}	

		// console.log('Errors Chart data is ', data);

		const handleerrorClick = ({points}) => {
			if (points[0] && points[0].data) {

				if (errorMarkers && errorMarkers[0]) {
					const tstart = errorMarkers[0].value, tend = points[0].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => seterrorMarkers(), 100);

					return;
				}	

				setTimeout(() => seterrorMarkers(), 15000);
				seterrorMarkers([ 
					{ 
						axis: 'x', 
						value: points[0].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[0] for handleerrorClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Errors',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handleerrorClick(point)}}
			markers={errorMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Errors</Title>
				{!errorMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, errorMarkers, modalCount]);	


	const p99avgrespchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.Avg_99pct_respusec) === 'array' && safetypeof(idata.Avg_99pct_respusec_Cum) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.Avg_99pct_respusec, bdata = idata.Avg_99pct_respusec_Cum;
		const 			data = [{ id : 'p99 Avg Response msec', data: [], }, { id : 'Baseline p99', data: [], }];
		const 			qarr = data[0].data, barr = data[1].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]/1000});

			if (bdata[i]) {
				barr.push({ x : new Date(bdata[i][0]), y : bdata[i][1]/1000});
			}	
			else {
				barr.push({ x : new Date(qdata[i][0]), y : 0});
			}	
		}	

		// console.log('p99 Avg Response Chart data is ', data);

		const handlep99respClick = ({points}) => {
			if (points[1] && points[1].data) {

				if (p99respMarkers && p99respMarkers[0]) {
					const tstart = p99respMarkers[0].value, tend = points[1].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setp99respMarkers(), 100);

					return;
				}	

				setTimeout(() => setp99respMarkers(), 15000);
				setp99respMarkers([ 
					{ 
						axis: 'x', 
						value: points[1].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[1] for handlep99respClick()');
			}	
		};	

		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'p99 Avg Response msec vs Baseline',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handlep99respClick(point)}}
			markers={p99respMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>p99 Avg Response msec</Title>
				{!p99respMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, p99respMarkers, modalCount]);	


	const loginchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.Logins) === 'array' && safetypeof(idata.Logins_Cum) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.Logins, bdata = idata.Logins_Cum;
		const 			data = [{ id : 'Logins', data: [], }, { id : 'Baseline', data: [], }];
		const 			qarr = data[0].data, barr = data[1].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});

			if (bdata[i]) {
				barr.push({ x : new Date(bdata[i][0]), y : bdata[i][1]});
			}	
			else {
				barr.push({ x : new Date(qdata[i][0]), y : 0});
			}	
		}	

		// console.log('Logins Chart data is ', data);

		const handleloginClick = ({points}) => {
			if (points[1] && points[1].data) {

				if (loginMarkers && loginMarkers[0]) {
					const tstart = loginMarkers[0].value, tend = points[1].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setloginMarkers(), 100);

					return;
				}	

				setTimeout(() => setloginMarkers(), 15000);
				setloginMarkers([ 
					{ 
						axis: 'x', 
						value: points[1].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[1] for handleloginClick()');
			}	
		};	

		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Logins vs Baseline',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handleloginClick(point)}}
			markers={loginMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>
		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Logins</Title>
				{!loginMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, loginMarkers, modalCount]);	


	const failedloginchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.FailedLogins) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.FailedLogins;
		const 			data = [{ id : 'Failed Logins', data: [], },];
		const 			qarr = data[0].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});
		}	

		// console.log('Failed Logins Chart data is ', data);

		const handlefailloginClick = ({points}) => {
			if (points[0] && points[0].data) {

				if (failloginMarkers && failloginMarkers[0]) {
					const tstart = failloginMarkers[0].value, tend = points[0].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setfailloginMarkers(), 100);

					return;
				}	

				setTimeout(() => setfailloginMarkers(), 15000);
				setfailloginMarkers([ 
					{ 
						axis: 'x', 
						value: points[0].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[0] for handlefailloginClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Failed Logins',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handlefailloginClick(point)}}
			markers={failloginMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Failed Logins</Title>
				{!failloginMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, failloginMarkers, modalCount]);	

	const bytesinchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.BytesIn) === 'array' && safetypeof(idata.BytesIn_Cum) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.BytesIn, bdata = idata.BytesIn_Cum;
		const 			data = [{ id : 'Bytes In', data: [], }, { id : 'Baseline', data: [], }];
		const 			qarr = data[0].data, barr = data[1].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});

			if (bdata[i]) {
				barr.push({ x : new Date(bdata[i][0]), y : bdata[i][1]});
			}	
			else {
				barr.push({ x : new Date(qdata[i][0]), y : 0});
			}	
		}	

		// console.log('Bytes In Chart data is ', data);
		
		const handlebytesinClick = ({points}) => {
			if (points[1] && points[1].data) {

				if (bytesinMarkers && bytesinMarkers[0]) {
					const tstart = bytesinMarkers[0].value, tend = points[1].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setbytesinMarkers(), 100);

					return;
				}	

				setTimeout(() => setbytesinMarkers(), 15000);
				setbytesinMarkers([ 
					{ 
						axis: 'x', 
						value: points[1].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[1] for handlebytesinClick()');
			}	
		};	

		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Bytes In vs Baseline',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handlebytesinClick(point)}}
			markers={bytesinMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Bytes In</Title>
				{!bytesinMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, bytesinMarkers, modalCount]);	


	const bytesoutchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.BytesOut) === 'array' && safetypeof(idata.BytesOut_Cum) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.BytesOut, bdata = idata.BytesOut_Cum;
		const 			data = [{ id : 'Bytes Out', data: [], }, { id : 'Baseline', data: [], }];
		const 			qarr = data[0].data, barr = data[1].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});

			if (bdata[i]) {
				barr.push({ x : new Date(bdata[i][0]), y : bdata[i][1]});
			}	
			else {
				barr.push({ x : new Date(qdata[i][0]), y : 0});
			}	
		}	

		// console.log('Bytes Out Chart data is ', data);

		const handlebytesoutClick = ({points}) => {
			if (points[1] && points[1].data) {

				if (bytesoutMarkers && bytesoutMarkers[0]) {
					const tstart = bytesoutMarkers[0].value, tend = points[1].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setbytesoutMarkers(), 100);

					return;
				}	

				setTimeout(() => setbytesoutMarkers(), 15000);
				setbytesoutMarkers([ 
					{ 
						axis: 'x', 
						value: points[1].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[1] for handlebytesoutClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Bytes Out vs Baseline',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handlebytesoutClick(point)}}
			markers={bytesoutMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Bytes Out</Title>
				{!bytesoutMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, bytesoutMarkers, modalCount]);	


	const respdistchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.QueryDistribution) === 'object' && safetypeof(idata.QueryDistribution.lt300us) === 'array')) { 
			return null;
		}	

		const			odist = idata.QueryDistribution;
		const			ndataorig = odist.lt300us.length, nticks = 10, naggr = Math.round(ndataorig/nticks) + 1;

		if (ndataorig === 0) return <Tag color='blue'>No Data seen...</Tag>;

		const			fdata = [], alt300us = odist.lt300us, alt1ms = odist.lt1ms, alt10ms = odist.lt10ms, alt50ms = odist.lt50ms,
					alt250ms = odist.lt250ms, alt1s = odist.lt1s, agte1s = odist.gte1s;

		for (let i = 0; i < ndataorig; ) {
			let o = { 
				tstart 		: alt300us[i][0], 
				tend 		: 0, 
				time 		: '', 
				'< 300 usec' 	: 0,  
				'< 1 msec' 	: 0,  
				'< 10 msec' 	: 0,  
				'< 50 msec' 	: 0,  
				'< 250 msec' 	: 0,  
				'< 1 sec' 	: 0,  
				'>= 1 sec' 	: 0,  
			};
	
			for (let j = 0; j < naggr; ++j, ++i) {
				if (alt300us[i] === undefined) break;
				
				o.tend 			= 	alt300us[i][0];

				o['< 300 usec']		+= 	alt300us[i][1];
				o['< 1 msec']		+= 	alt1ms[i][1];
				o['< 10 msec']		+= 	alt10ms[i][1];
				o['< 50 msec']		+= 	alt50ms[i][1];
				o['< 250 msec']		+= 	alt250ms[i][1];
				o['< 1 sec']		+= 	alt1s[i][1];
				o['>= 1 sec']		+= 	agte1s[i][1];
			}	
		
			if (o.tend === 0) break;

			o.time = moment(o.tend).format('HH:mm');

			fdata.push(o);
		}

		// console.log('Response Dist Chart data is ', fdata);

		const getChart = () => (
		<ResponsiveBar
			data={fdata}
			keys={[ '< 300 usec', '< 1 msec', '< 10 msec', '< 50 msec', '< 250 msec', '< 1 sec', '>= 1 sec' ]}
			indexBy="time"
			margin={{ top: 20, right: 30, bottom: 80, left: 90 }}
			padding={0.3}
			innerPadding={0}
			groupMode="stacked"
			valueScale={{ type: 'linear' }}
			indexScale={{ type: 'band', round: true }}
			colors={{ scheme: 'set2' }}
			borderRadius={0}
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
				legend: 'Time',
				legendPosition: 'middle',
				truncateTickAt: 0,
				legendOffset: 36,
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Query Count',
				legendPosition: 'middle',
				legendOffset: -80,
				truncateTickAt: 0,
				format: ",",
			}}
			enableTotals={true}
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
					direction: 'row',
					justify: false,
					translateX: 0,
					translateY: 70,
					itemsSpacing: 5,
					itemWidth: 80,
					itemHeight: 20,
					itemDirection: 'left-to-right',
					itemOpacity: 0.85,
					symbolSize: 20,
					toggleSerie: true,
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

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Response Time Distribution</Title>
			</div>
			<div style={{ height: 400, width : 700 }}>
				{getChart()}
			</div>
		</div>

		);

	}, [idata]);	

	const pctoverblchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.UsqlsOverBl) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.UsqlsOverBl;
		const 			data = [{ id : '% Queries over Baseline', data: [], }, ];
		const 			qarr = data[0].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});
		}	

		// console.log('% Queries over Baseline Chart data is ', data);

		const handlepctblClick = ({points}) => {
			if (points[0] && points[0].data) {

				if (pctblMarkers && pctblMarkers[0]) {
					const tstart = pctblMarkers[0].value, tend = points[0].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setpctblMarkers(), 100);

					return;
				}	

				setTimeout(() => setpctblMarkers(), 15000);
				setpctblMarkers([ 
					{ 
						axis: 'x', 
						value: points[0].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[0] for handlepctblClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: '% Queries over p90 Uniqsql Baseline',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handlepctblClick(point)}}
			markers={pctblMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>% Queries over p90 Uniqsql Baseline</Title>
				{!pctblMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, pctblMarkers, modalCount]);	

	const activesesschart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.ActiveSessions) === 'array' && safetypeof(idata.ActiveSessions_Cum) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.ActiveSessions, bdata = idata.ActiveSessions_Cum;
		const 			data = [{ id : 'Active Sessions', data: [], }, { id : 'Baseline', data: [], }];
		const 			qarr = data[0].data, barr = data[1].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});

			if (bdata[i]) {
				barr.push({ x : new Date(bdata[i][0]), y : bdata[i][1]});
			}	
			else {
				barr.push({ x : new Date(qdata[i][0]), y : 0});
			}	
		}	

		// console.log('Activesess Chart data is ', data);

		const handleactivesessClick = ({points}) => {
			if (points[1] && points[1].data) {

				if (activesessMarkers && activesessMarkers[0]) {
					const tstart = activesessMarkers[0].value, tend = points[1].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setactivesessMarkers(), 100);

					return;
				}	

				setTimeout(() => setactivesessMarkers(), 15000);
				setactivesessMarkers([ 
					{ 
						axis: 'x', 
						value: points[1].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[1] for handleactivesessClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Active Sessions vs Baseline',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handleactivesessClick(point)}}
			markers={activesessMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Active Sessions</Title>
				{!activesessMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, activesessMarkers, modalCount]);	

	const alertschart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.Alerts) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.Alerts;
		const 			data = [{ id : 'Alerts', data: [], }, ];
		const 			qarr = data[0].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});
		}	

		// console.log('Alerts data is ', data);

		const handlealertClick = ({points}) => {
			if (points[0] && points[0].data) {

				if (alertMarkers && alertMarkers[0]) {
					const tstart = alertMarkers[0].value, tend = points[0].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setalertMarkers(), 100);

					return;
				}	

				setTimeout(() => setalertMarkers(), 15000);
				setalertMarkers([ 
					{ 
						axis: 'x', 
						value: points[0].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[0] for handlealertClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'Alerts',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handlealertClick(point)}}
			markers={alertMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>Alerts</Title>
				{!alertMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, alertMarkers, modalCount]);	

	const newusqlchart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.NewUsqls) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.NewUsqls;
		const 			data = [{ id : 'New Uniqsqls', data: [], }, ];
		const 			qarr = data[0].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});
		}	

		// console.log('New Uniqsqls data is ', data);

		const handlenewusqlClick = ({points}) => {
			if (points[0] && points[0].data) {

				if (newusqlMarkers && newusqlMarkers[0]) {
					const tstart = newusqlMarkers[0].value, tend = points[0].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setnewusqlMarkers(), 100);

					return;
				}	

				setTimeout(() => setnewusqlMarkers(), 15000);
				setnewusqlMarkers([ 
					{ 
						axis: 'x', 
						value: points[0].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[0] for handlenewusqlClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'New Uniqsqls',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handlenewusqlClick(point)}}
			markers={newusqlMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>New Uniqsqls</Title>
				{!newusqlMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, newusqlMarkers, modalCount]);	

	const newappschart = useMemo(() => {
		
		if (!(safetypeof(idata) === 'object' && safetypeof(idata.NewApps) === 'array')) { 
			return null;
		}	

		const 			qdata = idata.NewApps;
		const 			data = [{ id : 'New Applications', data: [], }, ];
		const 			qarr = data[0].data;
		let 			firsttime = qdata[0] && qdata[0][0], lasttime = 0;

		for (let i = 0; i < qdata.length; ++i) {
			if (lasttime === qdata[i][0]) continue;

			lasttime = qdata[i][0];

			qarr.push({ x : new Date(qdata[i][0]), y : qdata[i][1]});
		}	

		// console.log('New Applications data is ', data);

		const handlenewappClick = ({points}) => {
			if (points[0] && points[0].data) {

				if (newappMarkers && newappMarkers[0]) {
					const tstart = newappMarkers[0].value, tend = points[0].data.x;

					Modal.info({
						title : <span><strong>Search data </strong></span>,
						content : (
							<>
							<ComponentLife stateCB={modalCount} />
							<div><span><strong>Start Time : {tstart.toISOString()}</strong></span></div>
							<div><span><strong>End Time : {tend.toISOString()}</strong></span></div>
							</>
							),
							
						width : '90%',	
						closable : true,
						destroyOnClose : true,
						maskClosable : true,
					});					

					setTimeout(() => setnewappMarkers(), 100);

					return;
				}	

				setTimeout(() => setnewappMarkers(), 15000);
				setnewappMarkers([ 
					{ 
						axis: 'x', 
						value: points[0].data.x, 
						lineStyle: { stroke: '#b0413e', strokeWidth: 2 }, 
						legend: 'Click End Time Point for the Search', 
						legendOrientation: 'horizontal',
						legendOffsetX: 10,
						legendOffsetY: 10,
					}, ]);
			}
			else {
				console.log('Invalid points[0] for handlenewappClick()');
			}	
		};	


		const getChart = () => (
		<ResponsiveLine
			data={data}
			margin={{ top: 30, right: 30, bottom: 50, left: 90 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%SZ',
				useUTC: false,
			}}
			yScale={{
				type: 'linear',
				min: 'auto',
				max: 'auto',
				stacked: false,
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
				legendPosition: 'left',
				format: '%H:%M',
				tickValues: getTickIntervalString(firsttime, lasttime, 10),
			}}
			axisLeft={{
				tickSize: 5,
				tickPadding: 5,
				tickRotation: 0,
				legend: 'New Applications',
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
			onClick = {(point, e) => { console.log(JSON.stringify(point)); handlenewappClick(point)}}
			markers={newappMarkers}
			enableTouchCrosshair={false}
			useMesh={false}
			enableSlices="x"
			enableArea={true}
			animate={true}
			colors={{ scheme: 'tableau10' }}
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
		/>

		);

		return (
		<div style={{ marginTop : 30, border: '1px groove #d9d9d9' }}>
			<div style={{ textAlign: 'center' }} >
				<Title level={5}>New Applications</Title>
				{!newappMarkers && <span><i>Click on a point for further querying...</i></span>}
			</div>

			<div style={{ height: 400, width : 700 }}>
			{getChart()}
			</div>
		</div>
		);
	}, [idata, newappMarkers, modalCount]);	

	const onHistorical = useCallback((date, dateString, useAggr, aggrMin, aggrType) => {
		if (!date || !dateString) {
			return;
		}

		let			tstarttime, tendtime;

		if (safetypeof(date) === 'array') {
			if (date.length !== 2 || safetypeof(dateString) !== 'array' || false === date[0].isValid() || false === date[1].isValid()) {
				message.error(`Invalid Historical Date Range set...`);
				return;
			}	

			tstarttime = dateString[0];
			tendtime = dateString[1];
		}
		else {
			return;
		}

		const			tabKey = `Intraday_${Date.now()}`;
		
		CreateTab({title : 'Intraday History', contentCB : () => { 
					return <IntradayDashboard autoRefresh={false} starttime={tstarttime} endtime={tendtime} tabKey={tabKey} /> 
				}, tabKey});

	}, []);	

	const onNewAutoRefresh = useCallback(() => {
		const			tabKey = intradayKey;
		
		CreateTab({title : 'Intraday', contetCB : () => { return <IntradayDashboard autoRefresh={true} tabKey={tabKey} /> }, tabKey});

	}, []);	


	const optionDiv = () => {
		const searchtitle = `Search Intraday Data`;

		return (
			<>
			<div style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', border : '1px groove #7a7aa0', padding : 10 }} >

			<div style={{ display: 'flex', flexDirection: 'row' }}>
			<Space>

			<ButtonModal buttontext={searchtitle} buttontype='primary' width={'90%'} okText="Cancel"
				contentCB={() => (
					<div>TODO...</div>
				)} />
					

			</Space>
			</div>

			<div style={{ marginLeft : 20 }}>
			<Space>

			{autoRefresh && isPauseRefresh === false && (<Button shape='round' type='primary' icon={<PauseCircleOutlined />} onClick={() => {pauseRefresh(true)}}>Pause Auto Refresh</Button>)}
			{autoRefresh && isPauseRefresh === true && (<Button shape='round' type='primary' icon={<PlayCircleOutlined />} 
						onClick={() => {objref.current.nextfetchtime = Date.now() + 1000; pauseRefresh(false)}}>Resume Auto Refresh</Button>)}

			{!autoRefresh && (<Button shape='round' type='primary' onClick={() => {onNewAutoRefresh()}}>Auto Refreshed Dashboard</Button>)}

			<TimeRangeAggrModal onChange={onHistorical} title='Historical Intraday Dashboard' showTime={false} showRange={true} 
						buttontype='primary' minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} />

			</Space>
			</div>

			</div>
			</>
		);
	};


	const getContent = (condata, alertdata) => {

		if (!(safetypeof(condata) === 'object' && safetypeof(condata.ActiveSessions) === 'array')) { 
			return (
				<>
				{alertdata}
				{objref.current.prevdata}
				</>
			);
		}

		return (
			<>
			{alertdata}

			<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere', 
					borderBottom : '1px dotted #d9d9d9', borderRadius: 5 }}>

				{qpschart}

				{avgrespchart}

				{errorschart}

				{p99avgrespchart}

			</div>
			<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere', 
					borderBottom : '1px dotted #d9d9d9', borderRadius: 5 }}>

				{loginchart}

				{failedloginchart}

				{bytesinchart}

				{bytesoutchart}

			</div>
			<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere', 
					borderBottom : '1px dotted #d9d9d9', borderRadius: 5 }}>

				{respdistchart}

				{pctoverblchart}

				{activesesschart}

				{alertschart}

			</div>
			<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere', 
					borderBottom : '1px dotted #d9d9d9', borderRadius: 5 }}>

				{newusqlchart}

				{newappschart}
			</div>
			
			</>
		);
	};	

	if (isloading === false && isapierror === false) { 

		if (safetypeof(idata) === 'object' && safetypeof(idata.ActiveSessions) === 'array') { 
			if (autoRefresh) {
				
				let		pausetag = null;

				if (true === objref.current.pauseRefresh || true === isPauseRefresh) {
					pausetag = <Tag color='blue'>Auto Refresh Paused</Tag>;
				}

				hdrtag = (
					<>
					<Tag color='green'>Running with Auto Refresh every {fetchIntervalmsec/1000} sec</Tag>
					{pausetag}
					</>);
			}
			else {
				hdrtag = <Tag color='blue'>Auto Refresh Disabled</Tag>;
			}	

			bodycont = getContent(idata, <Alert style={{ visibility: "hidden" }} type="info" showIcon message="Data Valid" />);

			objref.current.prevdata = bodycont;

		}
		else {
			hdrtag = (<Tag color='red'>Data Error</Tag>);

			let			emsg;

			if (objref.current.nerrorretries++ < 5) {
				objref.current.nextfetchtime = Date.now() + 10000;

				emsg = "Invalid or no data seen. Will retry after a few seconds...";
			}
			else {
				objref.current.nextfetchtime = Date.now() + 60000;

				emsg = "Invalid or no data seen. Too many retry errors...";
			}	

			bodycont = objref.current.prevdata;

			console.log(`Intraday Dashboard Data Error seen : ${JSON.stringify(idata).slice(0, 1024)}`);
		}
	}	
	else {

		if (isapierror) {
			const emsg = `Error while fetching data : ${typeof idata === 'string' ? idata : ""} : Will retry after a few seconds...`;

			hdrtag = <Tag color='red'>Data Error</Tag>;

			bodycont = objref.current.prevdata;
			
			console.log(`Intraday Dashboard Error seen : ${JSON.stringify(idata).slice(0, 256)}`);

			objref.current.nextfetchtime = Date.now() + 10000;
		}
		else if (isloading) {
			hdrtag = <Tag color='blue'>Loading Data</Tag>;

			bodycont = objref.current.prevdata;
		}
		else {
			if (autoRefresh && false === objref.current.pauseRefresh && false === isPauseRefresh) {
				hdrtag = <Tag color='green'>Running with Auto Refresh every {fetchIntervalmsec/1000} sec</Tag>;
			}
			else if (autoRefresh) {
				hdrtag = (
					<>
					<Tag color='green'>Running with Auto Refresh every {fetchIntervalmsec/1000} sec</Tag>
					<Tag color='blue'>Auto Refresh Paused</Tag>
					</>);

			}	
			else {
				hdrtag = <Tag color='blue'>Auto Refresh Paused</Tag>;
			}	

			bodycont = objref.current.prevdata;
		}	
	}

	
	return (
		<>
		<div style={{ background: globBgColor }}>

		<>
		<div style={{ textAlign: 'center' }} >
		<Title level={3}><em>Intraday Dashboard</em></Title>
		<span style={{ fontSize : 14 }}><strong>Server {servname} : Appname {appname}</strong></span>
		</div>
		
		<ErrorBoundary>
		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>

		<>
		{hdrtag}
		{optionDiv()}

		<div style={{ textAlign: 'center', marginTop: 20 }}><span style={{ fontSize : 14 }}><strong>{objref.current?.timestr}</strong></span></div> 

		{bodycont}
		</>

		</div>

		</ErrorBoundary>

		</>

		</div>
		</>
	);
}

