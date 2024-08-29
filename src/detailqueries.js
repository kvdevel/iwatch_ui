
import 			{ useState, useEffect, useMemo, useRef, useCallback } from "react";

import 			axios from 'axios';
import 			moment from 'moment';
import 			{format} from "d3-format";

import 			{safetypeof, bytesStrFormat, msecStrFormat, strTruncateTo, usecStrFormat, timeDiffString, 
			JSONDescription, LoadingAlert, } from './components/util.js';
import 			{GyTable, TimeFieldSorter, getTableScroll, getColumnNames, CsvDownloadButton, NumFieldSorter} from './components/gyTable.js';
import			{globBgColor, globCompBgColor, globTabCBs,} from './App.js';

import			{Typography, Tag, Alert, notification, Modal, Tooltip, Button, Result} from 'antd';

const 			{ErrorBoundary} = Alert;
const 			{Title} = Typography;


export function getSlowestQueriesColumns()
{
	return [
		{
			title :		'Time',
			key :		'time',
			dataIndex :	'time',
			gytype :	'string',
			width :		170,
			render :	(val) => <Button type="link">{timeDiffString(val)}</Button>, 
		},	
		{
			title :		'Request Query',
			key :		'req',
			dataIndex :	'req',
			gytype : 	'string',
			render :	(val) => <Tooltip title={val.length > 2000 ? val.slice(0, 2000) : val} 
							color="#7095b8" placement="bottomRight" ><span>{strTruncateTo(val, 100)}</span></Tooltip>,
			width :		300,
		},	
		{
			title :		'Response Time',
			key :		'respusec',
			dataIndex :	'respusec',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
			sorter :	NumFieldSorter('respusec'),
			defaultSortOrder : 'descend',
		},
		{
			title :		'Baseline Response',
			key :		'blrespusec',
			dataIndex :	'blrespusec',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Error Code',
			key :		'errcode',
			dataIndex :	'errcode',
			gytype :	'number',
			width : 	100,
			render :	(num) => <span style={{ color : num > 0 ? 'red' : undefined }} >{num}</span>,
		},
		{
			title :		'Application Name',
			key :		'app',
			dataIndex :	'app',
			gytype :	'string',
			width : 	150,
			render :	(val) => strTruncateTo(val, 40),
		},
		{
			title :		'Login Username',
			key :		'user',
			dataIndex :	'user',
			gytype :	'string',
			width : 	140,
		},
		{
			title :		'DB Name',
			key :		'dbname',
			dataIndex :	'dbname',
			gytype :	'string',
			width : 	140,
		},
		{
			title :		'Error Text',
			key :		'errtxt',
			dataIndex :	'errtxt',
			gytype :	'string',
			width : 	160,
			render :	(str) => <Tooltip title={str} color="red" ><span style={{ color : 'red' }} >{strTruncateTo(str, 50)}</span></Tooltip>,
			responsive : 	['lg'],
		},
		{
			title :		'% Resp Deviation',
			key :		'pctdev',
			dataIndex :	'pctdev',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num < 0 ? 'red' : num > 0 ? 'green' : undefined }} >{num} %</span>,
		},
		{
			title :		'Reaction Time',
			key :		'reaction',
			dataIndex :	'reaction',
			gytype :	'number',
			width : 	120,
			render :	(num) => msecStrFormat(num),
		},
		{
			title :		'Inbound Bytes',
			key :		'bytesin',
			dataIndex :	'bytesin',
			gytype :	'number',
			width : 	140,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Outbound Bytes',
			key :		'bytesout',
			dataIndex :	'bytesout',
			gytype :	'number',
			width : 	140,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Client IP',
			key :		'clientip',
			dataIndex :	'clientip',
			gytype : 	'string',
			width :		140,
			responsive : 	['lg'],
		},	
		{
			title :		'Client Port',
			key :		'cliport',
			dataIndex :	'cliport',
			gytype : 	'number',
			width : 	100,
			responsive : 	['lg'],
		},	
		{
			title :		'Connection Start',
			key :		'connecttime',
			dataIndex :	'connecttime',
			gytype : 	'string',
			width :		160,
			responsive : 	['lg'],
			render : 	(val) => timeDiffString(val),
		},	
		{
			title :		'Session ID',
			key :		'spid',
			dataIndex :	'spid',
			gytype : 	'number',
			width : 	100,
			responsive : 	['lg'],
		},	
		{
			title :		'Error Class',
			key :		'errclass',
			dataIndex :	'errclass',
			gytype : 	'number',
			width : 	100,
			responsive : 	['lg'],
		},	
		{
			title :		'Host PID',
			key :		'hostpid',
			dataIndex :	'hostpid',
			gytype : 	'number',
			width : 	100,
			responsive : 	['lg'],
		},	
		{
			title :		'App Sleep Time',
			key :		'appslp',
			dataIndex :	'appslp',
			gytype :	'number',
			width : 	120,
			render :	(num) => msecStrFormat(num),
			responsive : 	['lg'],
		},
	];
}

export function SlowestQueryTable({servname, appname, refreshsec = 30, tabKey})
{
	const			[{data, isloading, isapierror}, setApiData] = useState({data : [], isloading : true, isapierror : false});
	const 			objref = useRef({ modalCount : 0, nxtupdtime : Date.now(), pauseRefresh : false});

	useEffect(() => {
		objref.current.nxtupdtime = Date.now();

		const fetchData = () => {
			const conf = 
			{
				url 	: "/getSlowestQueriesData",
				method	: 'get',
				params : {
					servname,
					appname,
					cacheBrk : Date.now(),
				},
			};	

			axios(conf).then(({data}) => {
				if (!data || safetypeof(data) !== 'object' || !data.SlowestQueries || safetypeof(data.SlowestQueries.data) !== 'array') {
					console.log(`Invalid data received for Slowest Queries fetch response\n`);
					setApiData({data : [], isloading : false, isapierror : true});
					
					return;
				}

				objref.current.nxtupdtime = Date.now() + refreshsec * 1000;

				setApiData({data : data.SlowestQueries.data, isloading : false, isapierror : false});
			})
			.catch(() => {
				console.log(`Exception caught while waiting for Slowest Queries fetch response\n`);
				objref.current.nxtupdtime = Date.now() + refreshsec * 1000;
			})
		};

		let timer1 = setInterval(() => {

			const		oldpause = objref.current.pauseRefresh;

			if (globTabCBs.isActiveTabCB && tabKey) {
				objref.current.pauseRefresh = !globTabCBs.isActiveTabCB(tabKey);
			}

			if (objref.current.modalCount > 0) {
				objref.current.pauseRefresh = true;
			}	

			if (false === objref.current.pauseRefresh && Date.now() >= objref.current.nxtupdtime) {
				objref.current.nxtupdtime = Date.now() + 1000;

				fetchData();
			}	
		}, 5000);

		return () => { 
			if (timer1) clearInterval(timer1);
		}

	}, [objref, servname, appname, refreshsec, tabKey]);

	const modalCount = useCallback((isup) => {
		if (isup === true) {
			objref.current.modalCount++;
		}	
		else if (isup === false && objref.current.modalCount > 0) {
			objref.current.modalCount--;
		}	

	}, [objref]);	

	const tableOnRow = useCallback((record, rowIndex) => {
		return {
			onClick: event => {
				Modal.info({
					title : <span><strong>Slowest Query Record for {servname} : {appname}</strong></span>,
					content : (
						<>
						<JSONDescription jsondata={record} />
						</>
						),

					width : '90%',	
					closable : true,
					destroyOnClose : true,
					maskClosable : true,
				});
			}
		};		
	}, [servname, appname]);

	let			hinfo = null;

	if (isloading === false && isapierror === false) { 

			let			columns, rowKey;

			rowKey = ((record) => record.time + record.session);

			columns = getSlowestQueriesColumns();

			hinfo = (
				<>
				<div style={{ textAlign: 'center', marginTop: 40 }} >
				<Title level={5}>Queries with Max Response Time in last 5 Minutes for {servname} / {appname}</Title>
				<span style={{ fontSize : 14 }}><strong>at time {moment().format("MMM DD HH:mm:ss Z")}</strong></span>
				</div>

				<div style={{ marginBottom: 70 }} >
				<GyTable columns={columns} onRow={tableOnRow} dataSource={data} rowKey={rowKey} scroll={getTableScroll()} 
					footer={(pagedata) => <CsvDownloadButton data={data} headers={getColumnNames(columns)} />}	
					bordered size="small" defaultPageSize={5} />
				</div>
				</>
			);
	}
	else if (isapierror) {
		const emsg = `Error while fetching data : ${typeof data === 'string' ? data.slice(0, 128) : ""}`;

		hinfo = <Alert type="error" showIcon message="Slowest Queries Request Error Encountered" description={emsg} />;
	}	
	else {
		hinfo = <LoadingAlert />;
	}

	return (
		<>
		<ErrorBoundary>
		{hinfo}
		</ErrorBoundary>
		</>
	);
}


