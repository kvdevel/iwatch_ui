
import 			{ useState, useEffect, useMemo, useRef, useCallback } from "react";

import 			axios from 'axios';
import 			moment from 'moment';
import 			{format} from "d3-format";

import 			{safetypeof, bytesStrFormat, msecStrFormat, strTruncateTo, usecStrFormat, timeDiffString, 
			JSONDescription, LoadingAlert, CreateTab, ButtonModal,removeUndefinedProps, numSIFormat} from './components/util.js';
import 			{GyTable, TimeFieldSorter, getTableScroll, getColumnNames, CsvDownloadButton, NumFieldSorter} from './components/gyTable.js';
import			{globBgColor, globCompBgColor, globTabCBs,} from './App.js';
import			{serverAppStateAtom} from './tabHandler.js';
import 			{TimeRangeAggrModal} from './components/dateTimeZone.js';

import			{Typography, Tag, Alert, notification, Modal, Tooltip, Button, Result, message, Space, Descriptions} from 'antd';
import 			{useRecoilValue} from 'recoil';

const 			{ErrorBoundary} = Alert;
const 			{Title} = Typography;

export const usqlSummSearchFields = [
	{ field : 'SUMM.uniq_sql_text',		desc : 'Unique SQL Request',			type : 'string',	subsys : 'usqlsumm',	valid : null, },
	{ field : 'SUMM.uniq_total_count',	desc : 'Total Count',				type : 'number',	subsys : 'usqlsumm',	valid : null, },
	{ field : 'SUMM.uniq_error_count',	desc : 'Error Count',				type : 'number',	subsys : 'usqlsumm',	valid : null, },
	{ field : 'SUMM.uniq_avg_resp',		desc : 'Avg Response in usec',			type : 'number',	subsys : 'usqlsumm',	valid : null, },
	{ field : 'SUMM.uniq_maxresp',		desc : 'Max Response in usec',			type : 'number',	subsys : 'usqlsumm',	valid : null, },
	{ field : 'SUMM.uniq_totbytesin',	desc : 'Total Bytes In',			type : 'number',	subsys : 'usqlsumm',	valid : null, },
	{ field : 'SUMM.uniq_totbytesout',	desc : 'Total Bytes Out',			type : 'number',	subsys : 'usqlsumm',	valid : null, },
	{ field : 'SUMM.uniq_fingerprint',	desc : 'Uniqsql Fingerprint',			type : 'string',	subsys : 'usqlsumm',	valid : null, },
];

export const appSummSearchFields = [
	{ field : 'SUMM.app_name',		desc : 'Application Name',			type : 'string',	subsys : 'appsumm',	valid : null, },
	{ field : 'SUMM.app_total_count',	desc : 'Total Count',				type : 'number',	subsys : 'appsumm',	valid : null, },
	{ field : 'SUMM.app_error_count',	desc : 'Error Count',				type : 'number',	subsys : 'appsumm',	valid : null, },
	{ field : 'SUMM.app_avg_resp',		desc : 'Avg Response in usec',			type : 'number',	subsys : 'appsumm',	valid : null, },
	{ field : 'SUMM.app_maxresp',		desc : 'Max Response in usec',			type : 'number',	subsys : 'appsumm',	valid : null, },
	{ field : 'SUMM.app_totbytesin',	desc : 'Total Bytes In',			type : 'number',	subsys : 'appsumm',	valid : null, },
	{ field : 'SUMM.app_totbytesout',	desc : 'Total Bytes Out',			type : 'number',	subsys : 'appsumm',	valid : null, },
];

export const loginSummSearchFields = [
	{ field : 'SUMM.user_name',		desc : 'Login Username',			type : 'string',	subsys : 'loginsumm',	valid : null, },
	{ field : 'SUMM.user_total_count',	desc : 'Total Count',				type : 'number',	subsys : 'loginsumm',	valid : null, },
	{ field : 'SUMM.user_error_count',	desc : 'Error Count',				type : 'number',	subsys : 'loginsumm',	valid : null, },
	{ field : 'SUMM.user_avg_resp',		desc : 'Avg Response in usec',			type : 'number',	subsys : 'loginsumm',	valid : null, },
	{ field : 'SUMM.user_maxresp',		desc : 'Max Response in usec',			type : 'number',	subsys : 'loginsumm',	valid : null, },
	{ field : 'SUMM.user_totbytesin',	desc : 'Total Bytes In',			type : 'number',	subsys : 'loginsumm',	valid : null, },
	{ field : 'SUMM.user_totbytesout',	desc : 'Total Bytes Out',			type : 'number',	subsys : 'loginsumm',	valid : null, },
];

export const errorSummSearchFields = [
	{ field : 'SUMM.error_code',		desc : 'Error Code',				type : 'number',	subsys : 'errorsumm',	valid : null, },
	{ field : 'SUMM.error_total_count',	desc : 'Error Count',				type : 'number',	subsys : 'errorsumm',	valid : null, },
	{ field : 'SUMM.error_text',		desc : 'Error Text',				type : 'string',	subsys : 'errorsumm',	valid : null, },
	{ field : 'SUMM.error_avg_resp',	desc : 'Avg Response in usec',			type : 'number',	subsys : 'errorsumm',	valid : null, },
	{ field : 'SUMM.error_maxresp',		desc : 'Max Response in usec',			type : 'number',	subsys : 'errorsumm',	valid : null, },
	{ field : 'SUMM.error_totbytesin',	desc : 'Total Bytes In',			type : 'number',	subsys : 'errorsumm',	valid : null, },
	{ field : 'SUMM.error_totbytesout',	desc : 'Total Bytes Out',			type : 'number',	subsys : 'errorsumm',	valid : null, },
];

export const dbSummSearchFields = [
	{ field : 'SUMM.db_name',		desc : 'Database Name',				type : 'string',	subsys : 'dbsumm',	valid : null, },
	{ field : 'SUMM.db_total_count',	desc : 'Total Count',				type : 'number',	subsys : 'dbsumm',	valid : null, },
	{ field : 'SUMM.db_error_count',	desc : 'Error Count',				type : 'number',	subsys : 'dbsumm',	valid : null, },
	{ field : 'SUMM.db_avg_resp',		desc : 'Avg Response in usec',			type : 'number',	subsys : 'dbsumm',	valid : null, },
	{ field : 'SUMM.db_maxresp',		desc : 'Max Response in usec',			type : 'number',	subsys : 'dbsumm',	valid : null, },
	{ field : 'SUMM.db_totbytesin',		desc : 'Total Bytes In',			type : 'number',	subsys : 'dbsumm',	valid : null, },
	{ field : 'SUMM.db_totbytesout',	desc : 'Total Bytes Out',			type : 'number',	subsys : 'dbsumm',	valid : null, },
];

export const ipSummSearchFields = [
	{ field : 'SUMM.ip_addr',		desc : 'Client IP Address',			type : 'string',	subsys : 'ipsumm',	valid : null, },
	{ field : 'SUMM.ip_total_count',	desc : 'Total Count',				type : 'number',	subsys : 'ipsumm',	valid : null, },
	{ field : 'SUMM.ip_error_count',	desc : 'Error Count',				type : 'number',	subsys : 'ipsumm',	valid : null, },
	{ field : 'SUMM.ip_avg_resp',		desc : 'Avg Response in usec',			type : 'number',	subsys : 'ipsumm',	valid : null, },
	{ field : 'SUMM.ip_maxresp',		desc : 'Max Response in usec',			type : 'number',	subsys : 'ipsumm',	valid : null, },
	{ field : 'SUMM.ip_totbytesin',		desc : 'Total Bytes In',			type : 'number',	subsys : 'ipsumm',	valid : null, },
	{ field : 'SUMM.ip_totbytesout',	desc : 'Total Bytes Out',			type : 'number',	subsys : 'ipsumm',	valid : null, },
];

export const crossSummSearchFields = [
	{ field : 'SUMM.uniq_sql_text',		desc : 'Unique SQL Request',			type : 'string',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.app_name',		desc : 'Application Name',			type : 'string',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.user_name',		desc : 'Login Username',			type : 'string',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.db_name',		desc : 'Database Name',				type : 'string',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.ip_addr',		desc : 'Client IP Address',			type : 'string',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.uniq_total_count',	desc : 'Total Count',				type : 'number',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.error_code',		desc : 'Error Code',				type : 'number',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.uniq_error_count',	desc : 'Error Count',				type : 'number',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.uniq_avg_resp',		desc : 'Avg Response in usec',			type : 'number',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.uniq_maxresp',		desc : 'Max Response in usec',			type : 'number',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.error_text',		desc : 'Error Text',				type : 'string',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.uniq_totbytesin',	desc : 'Total Bytes In',			type : 'number',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.uniq_totbytesout',	desc : 'Total Bytes Out',			type : 'number',	subsys : 'crosssumm',	valid : null, },
	{ field : 'SUMM.uniq_fingerprint',	desc : 'Uniqsql Fingerprint',			type : 'string',	subsys : 'crosssumm',	valid : null, },
];


export function getUsqlSummColumns()
{
	return [
		{
			title :		'Unique SQL',
			key :		'usql',
			dataIndex :	'usql',
			gytype : 	'string',
			render :	(val) => <Tooltip title={val.length > 2000 ? val.slice(0, 2000) : val} 
							color="#7095b8" placement="bottomRight" ><span>{strTruncateTo(val, 100)}</span></Tooltip>,
			width :		350,
		},	
		{
			title :		'Response Weightage',
			key :		'perctot',
			dataIndex :	'perctot',
			gytype :	'number',
			width : 	120,
			render :	(num) => `${num.toFixed(2)} %`,
			sorter :	NumFieldSorter('perctot'),
			defaultSortOrder : 'descend',
		},
		{
			title :		'Baseline Deviation',
			key :		'perctdev',
			dataIndex :	'perctdev',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num < 0 ? 'red' : (num > 0 ? 'green' : undefined) }} >{`${num.toFixed(2)} %`}</span>,
		},
		{
			title :		'Total Count',
			key :		'totcnt',
			dataIndex :	'totcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => <Button type="link" >{format(",")(num)}</Button>,
		},
		{
			title :		'Error Count',
			key :		'errcnt',
			dataIndex :	'errcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num > 0 ? 'red' : undefined }} >{format(",")(num)}</span>,
		},
		{
			title :		'Avg Response',
			key :		'avgresp',
			dataIndex :	'avgresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Max Response',
			key :		'maxresp',
			dataIndex :	'maxresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Baseline Response',
			key :		'cumblavg',
			dataIndex :	'cumblavg',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Total Response',
			key :		'totrespt',
			dataIndex :	'totrespt',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Avg Bytes In',
			key :		'avgbytesin',
			dataIndex :	'avgbytesin',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes In',
			dataIndex :	'totbytesin',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesin * rec.totcnt),
		},
		{
			title :		'Avg Bytes Out',
			key :		'avgbytesout',
			dataIndex :	'avgbytesout',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes Out',
			dataIndex :	'totbytesout',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesout * rec.totcnt),
		},
		{
			title :		'Min Response',
			key :		'minresp',
			dataIndex :	'minresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Count from Start',
			key :		'cumblcnt',
			dataIndex :	'cumblcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => format('.6~s')(num),
		},
		{
			title :		'# Resp < 300us',
			key :		'lt300us',
			dataIndex :	'lt300us',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'# Resp < 1ms',
			key :		'lt1ms',
			dataIndex :	'lt1ms',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'# Resp < 10ms',
			key :		'lt10ms',
			dataIndex :	'lt10ms',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'# Resp < 50ms',
			key :		'lt50ms',
			dataIndex :	'lt50ms',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'# Resp < 250ms',
			key :		'lt250ms',
			dataIndex :	'lt250ms',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'# Resp < 1sec',
			key :		'lt1s',
			dataIndex :	'lt1s',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'# Resp >= 1sec',
			key :		'gte1s',
			dataIndex :	'gte1s',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'Week Avg Resp',
			key :		'weekblavg',
			dataIndex :	'weekblavg',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Week Count',
			key :		'weekblcnt',
			dataIndex :	'weekblcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'Day Avg Resp',
			key :		'dayblavg',
			dataIndex :	'dayblavg',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Day Count',
			key :		'dayblcnt',
			dataIndex :	'dayblcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'Baseline Type',
			key :		'bltype',
			dataIndex :	'bltype',
			gytype :	'string',
			width : 	140,
		},
		{
			title :		'Fingerprint',
			key :		'ufp',
			dataIndex :	'ufp',
			gytype :	'string',
			width : 	140,
		},
	];
}	

export function getAppSummColumns()
{
	return [
		{
			title :		'Application Name',
			key :		'app',
			dataIndex :	'app',
			gytype : 	'string',
			render :	(val) => <Tooltip title={val} 
							color="#7095b8" placement="bottomRight" ><Button type="link" >{strTruncateTo(val, 50)}</Button></Tooltip>,
			width :		250,
		},	
		{
			title :		'Response Weightage',
			key :		'perctot',
			dataIndex :	'perctot',
			gytype :	'number',
			width : 	120,
			render :	(num) => `${num.toFixed(2)} %`,
			sorter :	NumFieldSorter('perctot'),
			defaultSortOrder : 'descend',
		},
		{
			title :		'Total Count',
			key :		'totcnt',
			dataIndex :	'totcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'Error Count',
			key :		'errcnt',
			dataIndex :	'errcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num > 0 ? 'red' : undefined }} >{format(",")(num)}</span>,
		},
		{
			title :		'Avg Response',
			key :		'avgresp',
			dataIndex :	'avgresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Max Response',
			key :		'maxresp',
			dataIndex :	'maxresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Total Response',
			key :		'totrespt',
			dataIndex :	'totrespt',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Avg Bytes In',
			key :		'avgbytesin',
			dataIndex :	'avgbytesin',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes In',
			dataIndex :	'totbytesin',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesin * rec.totcnt),
		},
		{
			title :		'Avg Bytes Out',
			key :		'avgbytesout',
			dataIndex :	'avgbytesout',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes Out',
			dataIndex :	'totbytesout',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesout * rec.totcnt),
		},
		{
			title :		'Baseline Deviation',
			key :		'perctdev',
			dataIndex :	'perctdev',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num < 0 ? 'red' : (num > 0 ? 'green' : undefined) }} >{`${num.toFixed(2)} %`}</span>,
		},
		{
			title :		'Baseline Response',
			key :		'cumblavg',
			dataIndex :	'cumblavg',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Min Response',
			key :		'minresp',
			dataIndex :	'minresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
	];
}

export function getLoginSummColumns()
{
	return [
		{
			title :		'Login Username',
			key :		'login',
			dataIndex :	'login',
			gytype : 	'string',
			render :	(val) => <Tooltip title={val} 
							color="#7095b8" placement="bottomRight" ><Button type="link" >{strTruncateTo(val, 50)}</Button></Tooltip>,
			width :		250,
		},	
		{
			title :		'Response Weightage',
			key :		'perctot',
			dataIndex :	'perctot',
			gytype :	'number',
			width : 	120,
			render :	(num) => `${num.toFixed(2)} %`,
			sorter :	NumFieldSorter('perctot'),
			defaultSortOrder : 'descend',
		},
		{
			title :		'Total Count',
			key :		'totcnt',
			dataIndex :	'totcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'Error Count',
			key :		'errcnt',
			dataIndex :	'errcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num > 0 ? 'red' : undefined }} >{format(",")(num)}</span>,
		},
		{
			title :		'Avg Response',
			key :		'avgresp',
			dataIndex :	'avgresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Max Response',
			key :		'maxresp',
			dataIndex :	'maxresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Total Response',
			key :		'totrespt',
			dataIndex :	'totrespt',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Avg Bytes In',
			key :		'avgbytesin',
			dataIndex :	'avgbytesin',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes In',
			dataIndex :	'totbytesin',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesin * rec.totcnt),
		},
		{
			title :		'Avg Bytes Out',
			key :		'avgbytesout',
			dataIndex :	'avgbytesout',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes Out',
			dataIndex :	'totbytesout',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesout * rec.totcnt),
		},
		{
			title :		'Baseline Deviation',
			key :		'perctdev',
			dataIndex :	'perctdev',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num < 0 ? 'red' : (num > 0 ? 'green' : undefined) }} >{`${num.toFixed(2)} %`}</span>,
		},
		{
			title :		'Baseline Response',
			key :		'cumblavg',
			dataIndex :	'cumblavg',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Min Response',
			key :		'minresp',
			dataIndex :	'minresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
	];
}

export function getDBSummColumns()
{
	return [
		{
			title :		'Database Name',
			key :		'dbname',
			dataIndex :	'dbname',
			gytype : 	'string',
			render :	(val) => <Tooltip title={val} 
							color="#7095b8" placement="bottomRight" ><Button type="link" >{strTruncateTo(val, 50)}</Button></Tooltip>,
			width :		250,
		},	
		{
			title :		'Response Weightage',
			key :		'perctot',
			dataIndex :	'perctot',
			gytype :	'number',
			width : 	120,
			render :	(num) => `${num.toFixed(2)} %`,
			sorter :	NumFieldSorter('perctot'),
			defaultSortOrder : 'descend',
		},
		{
			title :		'Total Count',
			key :		'totcnt',
			dataIndex :	'totcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'Error Count',
			key :		'errcnt',
			dataIndex :	'errcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num > 0 ? 'red' : undefined }} >{format(",")(num)}</span>,
		},
		{
			title :		'Avg Response',
			key :		'avgresp',
			dataIndex :	'avgresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Max Response',
			key :		'maxresp',
			dataIndex :	'maxresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Total Response',
			key :		'totrespt',
			dataIndex :	'totrespt',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Avg Bytes In',
			key :		'avgbytesin',
			dataIndex :	'avgbytesin',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes In',
			dataIndex :	'totbytesin',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesin * rec.totcnt),
		},
		{
			title :		'Avg Bytes Out',
			key :		'avgbytesout',
			dataIndex :	'avgbytesout',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes Out',
			dataIndex :	'totbytesout',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesout * rec.totcnt),
		},
		{
			title :		'Baseline Deviation',
			key :		'perctdev',
			dataIndex :	'perctdev',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num < 0 ? 'red' : (num > 0 ? 'green' : undefined) }} >{`${num.toFixed(2)} %`}</span>,
		},
		{
			title :		'Baseline Response',
			key :		'cumblavg',
			dataIndex :	'cumblavg',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Min Response',
			key :		'minresp',
			dataIndex :	'minresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
	];
}

export function getIPSummColumns()
{
	return [
		{
			title :		'Client IP',
			key :		'clientip',
			dataIndex :	'clientip',
			gytype : 	'string',
			render :	(val) => <Tooltip title={val} 
							color="#7095b8" placement="bottomRight" ><Button type="link" >{strTruncateTo(val, 50)}</Button></Tooltip>,
			width :		250,
		},	
		{
			title :		'Response Weightage',
			key :		'perctot',
			dataIndex :	'perctot',
			gytype :	'number',
			width : 	120,
			render :	(num) => `${num.toFixed(2)} %`,
			sorter :	NumFieldSorter('perctot'),
			defaultSortOrder : 'descend',
		},
		{
			title :		'Total Count',
			key :		'totcnt',
			dataIndex :	'totcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => format(",")(num),
		},
		{
			title :		'Error Count',
			key :		'errcnt',
			dataIndex :	'errcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num > 0 ? 'red' : undefined }} >{format(",")(num)}</span>,
		},
		{
			title :		'Avg Response',
			key :		'avgresp',
			dataIndex :	'avgresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Max Response',
			key :		'maxresp',
			dataIndex :	'maxresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Total Response',
			key :		'totrespt',
			dataIndex :	'totrespt',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Avg Bytes In',
			key :		'avgbytesin',
			dataIndex :	'avgbytesin',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes In',
			dataIndex :	'totbytesin',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesin * rec.totcnt),
		},
		{
			title :		'Avg Bytes Out',
			key :		'avgbytesout',
			dataIndex :	'avgbytesout',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes Out',
			dataIndex :	'totbytesout',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesout * rec.totcnt),
		},
		{
			title :		'Baseline Deviation',
			key :		'perctdev',
			dataIndex :	'perctdev',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num < 0 ? 'red' : (num > 0 ? 'green' : undefined) }} >{`${num.toFixed(2)} %`}</span>,
		},
		{
			title :		'Baseline Response',
			key :		'cumblavg',
			dataIndex :	'cumblavg',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Min Response',
			key :		'minresp',
			dataIndex :	'minresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
	];
}

export function getErrorSummColumns()
{
	return [
		{
			title :		'Error Code',
			key :		'errcode',
			dataIndex :	'errcode',
			gytype : 	'number',
			render :	(num) => <Button type="link">{num}</Button>,
			width :		120,
		},	
		{
			title :		'Error Text',
			key :		'errtxt',
			dataIndex :	'errtxt',
			gytype : 	'string',
			render :	(str) => <Tooltip title={str} color="red" ><span style={{ color : 'red' }} >{strTruncateTo(str, 50)}</span></Tooltip>,
			width :		300,
		},	
		{
			title :		'Error Count',
			key :		'errcnt',
			dataIndex :	'errcnt',
			gytype :	'number',
			width : 	120,
			render :	(num) => <span style={{ color : num > 0 ? 'red' : undefined }} >{format(",")(num)}</span>,
			sorter :	NumFieldSorter('errcnt'),
			defaultSortOrder : 'descend',
		},
		{
			title :		'Response Weightage',
			key :		'perctot',
			dataIndex :	'perctot',
			gytype :	'number',
			width : 	120,
			render :	(num) => `${num.toFixed(2)} %`,
		},
		{
			title :		'Avg Response',
			key :		'avgresp',
			dataIndex :	'avgresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Max Response',
			key :		'maxresp',
			dataIndex :	'maxresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Total Response',
			key :		'totrespt',
			dataIndex :	'totrespt',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
		{
			title :		'Avg Bytes In',
			key :		'avgbytesin',
			dataIndex :	'avgbytesin',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes In',
			dataIndex :	'totbytesin',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesin * rec.errcnt),
		},
		{
			title :		'Avg Bytes Out',
			key :		'avgbytesout',
			dataIndex :	'avgbytesout',
			gytype :	'number',
			width : 	120,
			render :	(num) => bytesStrFormat(num),
		},
		{
			title :		'Total Bytes Out',
			dataIndex :	'totbytesout',
			gytype :	'number',
			width : 	120,
			render :	(_, rec) => bytesStrFormat(rec.avgbytesout * rec.errcnt),
		},
		{
			title :		'Min Response',
			key :		'minresp',
			dataIndex :	'minresp',
			gytype :	'number',
			width : 	120,
			render :	(num) => usecStrFormat(num),
		},
	];
}

function SummaryTrailer({trailer, isErrorSumm})
{
	if (safetypeof(trailer) !== 'object' || trailer.errcnt === undefined) {
		return null;
	}	

	return (
		<div style={{ marginTop : 20, textAlign : 'center' }} >
		<Descriptions bordered size='small' column={{  md: 3, sm: 2, xs: 1 }}>
			{!isErrorSumm && <Descriptions.Item label=<span><strong>Total Requests</strong></span>>
				<span><strong><em>{numSIFormat(trailer.totcnt)}</em></strong></span>
			</Descriptions.Item>}
			<Descriptions.Item label=<span><strong>Errors</strong></span>>
				<span><strong><em>{numSIFormat(trailer.errcnt)}</em></strong></span>
			</Descriptions.Item>
			<Descriptions.Item label=<span><strong>Avg Response</strong></span>>
				<span><strong><em>{usecStrFormat(trailer.totrespt/(trailer.totcnt ?? 1), '')}</em></strong></span>
			</Descriptions.Item>
		</Descriptions>	
		</div>
	);		
}


export function UniqsqlSummaryTable({servname, appname, starttime, endtime, filter, maxrecs = 100000, nohdr})
{
	const			[{data, isloading, isapierror}, setApiData] = useState({data : [], isloading : true, isapierror : false});
	const			objref = useRef({tstart : null, tend : null, modalCount : 0});
	const			[selectedRows, setSelectedRows] = useState([]);

	const validProps = useMemo(() => {	
		
		if (!servname || !appname) {
			throw new Error("No valid servname or appname specified");
		}	

		if (starttime && endtime) {
			let		mstart = moment(starttime, moment.ISO_8601), mend;

			if (false === mstart.isValid()) {
				throw new Error(`Invalid starttime specified : ${starttime}`);
			}	

			mend = moment(endtime, moment.ISO_8601);

			if (false === mend.isValid()) {
				throw new Error(`Invalid endtime specified : ${endtime}`);
			}
			else if (mend.unix() < mstart.unix()) {
				throw new Error(`Invalid endtime specified : endtime less than starttime : ${endtime}`);
			}	

			if (mend.unix() - mstart.unix() < 300) {
				mstart.subtract(200, 'seconds');

			}	

			objref.current.tstart = mstart;
			objref.current.tend = mend;

		}
		else {
			objref.current.tstart = moment().subtract(60, 'minutes');
			objref.current.tend = moment();
		}	
		
		return true;

	}, [servname, appname, starttime, endtime, objref]);	

	if (validProps === false) {
		throw new Error(`Internal Error : Unique SQL validProps check failed`);
	}	

	const modalCount = useCallback((isup) => {
		if (isup === true) {
			objref.current.modalCount++;
		}	
		else if (isup === false && objref.current.modalCount > 0) {
			objref.current.modalCount--;
		}	
	}, [objref]);	

	useEffect(() => {
		const fetchData = () => {
			const conf = 
			{
				url 	: "/getUniqueSQLQueriesData",
				method	: 'get',
				params 	: new URLSearchParams(removeUndefinedProps({
						servname,
						appname,
						starttime : objref.current.tstart.format(),
						endtime : objref.current.tend.format(),
						filtstr : filter,
						maxrecs,
					})),	
			};	

			axios(conf).then(({data}) => {
				if (!data || safetypeof(data) !== 'object' || !data.data || safetypeof(data.data) !== 'array') {
					console.log(`Invalid data received for Uniqsql fetch response\n`);
					setApiData({data : JSON.stringify(data).slice(0, 128), isloading : false, isapierror : true});
					
					return;
				}

				setApiData({data : data, isloading : false, isapierror : false});
			})
			.catch(() => {
				console.log(`Exception caught while waiting for Unique SQL fetch response`);
				setApiData({data : 'Exception caught while waiting for Unique SQL fetch response', isloading : false, isapierror : true});
			})
		};

		fetchData();

	}, [servname, appname, filter, maxrecs]);

	const tableOnRow = useCallback((record, rowIndex) => {
		return {
			onClick: event => {
				Modal.info({
					title : <span><strong>Unique SQL for {servname} : {appname}</strong></span>,
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

	const handleRowSelect = useCallback((selectedRowKeys, selectedRows) => {
		setSelectedRows(selectedRows);
	}, [setSelectedRows]);


	const onTimeBreakup = useCallback(() => {
		CreateTab({title : 'Uniqsql Breakup', contentCB : () => <div>TODO...</div>, tabKey : `UniqBreakup_${Date.now()}`});
	}, [selectedRows, servname, appname, filter, maxrecs, objref]);

	const onHistorical = useCallback((date, dateString) => {
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

		const			tabKey = `Uniqsql_${Date.now()}`;
		
		CreateTab({title : 'Uniqsql Breakup', contentCB : () => <div>TODO...</div>, tabKey});

	}, [selectedRows, servname, appname, filter, maxrecs, objref]);	

	let			hinfo = null, hdr = null, seldiv = null;
	let			timestr = '';

	if (objref.current?.tstart && objref.current.tend) {
		if (!(starttime && endtime)) {
			timestr = 'For last hour : '
		}	

		timestr += `Start Time ${objref.current.tstart.format("MMM DD HH:mm:ss Z")} : End Time ${objref.current.tend.format("MMM DD HH:mm:ss Z")}`;
	}

	hdr = (
		<div style={{ textAlign: 'center', marginTop: 40, marginBottom : 20, }} >
		{!nohdr && <Title level={5}>Unique SQL Summary for {servname} / {appname}</Title>}
		<span style={{ fontSize : 14 }}><strong>{timestr}</strong></span>
		</div>
	);


	if (isloading === false && isapierror === false) { 
		if (safetypeof(data) === 'object' && safetypeof(data.data) === 'array') {
			let			columns, rowKey;
			const			sdata = data.data, trailer = data.trailer;

			seldiv = (
				<>
				
				<div style={{ marginBottom: 20, textAlign: sdata.length > 0 ? undefined : 'center'  }} >
				<span style={{ fontSize : 14 }}><em>{sdata.length > 0 ? 'Select 1 or more rows for further querying or click on a row for more info...' : 'No Data Seen'}</em></span>
				</div>

				<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere',}} >
					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} onClick={onTimeBreakup}>Duration 5 min Breakups</Button>

					<TimeRangeAggrModal onChange={onHistorical} title='Historical 5 min Breakups' showTime={false} showRange={true} buttontype='primary'
							minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} buttondisabled={!selectedRows || selectedRows.length === 0} />

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Multi Summary Breakups</Button>

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Detail Queries</Button>
				</div>

				</>
			);

			rowKey = 'ufp';

			columns = getUsqlSummColumns();

			hinfo = (
				<>
				<div style={{ marginBottom: 70 }} >
				<GyTable columns={columns} onRow={tableOnRow} dataSource={sdata} rowKey={rowKey} scroll={getTableScroll()} 
					title={() => seldiv}
					footer={(pagedata) => <CsvDownloadButton data={sdata} headers={getColumnNames(columns)} />}	
					rowSelection={{ onChange : handleRowSelect }} bordered defaultPageSize={10} />

				<SummaryTrailer trailer={trailer} />
				</div>
				</>
			);
		}
		else {

			hinfo = <Alert type="error" showIcon message="Unique SQL Response Format Error Encountered" />;

			console.log(`Uniqsql Data Format Error seen : ${JSON.stringify(data).slice(0, 512)}`);
		}
		
	}
	else if (isapierror) {
		const emsg = `Error while fetching data : ${typeof data === 'string' ? data.slice(0, 128) : ""}`;

		hinfo = <Alert type="error" showIcon message="Unique SQL Request Error Encountered" description={emsg} />;
	}	
	else {
		hinfo = <LoadingAlert />;
	}

	return (
		<ErrorBoundary>

		<>
		{hdr}
		{filter && <Tag color='green'>Filters set...</Tag>}
		{hinfo}

		</>
		</ErrorBoundary>
	);
}

export function UniqsqlSummaryPage({servname, appname, starttime, endtime, ...props})
{
	const	[refreshID, setRefreshID]	= useState(0);

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

		const			tabKey = `Uniqsql_${Date.now()}`;
		
		CreateTab({title : 'Unique SQL History', contentCB : () => { return <UniqsqlSummaryPage {...props} servname={servname} appname={appname} 
					starttime={tstarttime} endtime={tendtime} /> }, tabKey});

	}, [servname, appname, props]);	

	const onRefresh = useCallback(() => setRefreshID((num) => num + 1), []);

	const optionDiv = () => {
		const searchtitle = `Search Unique SQLs`;

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

			{!starttime && <Button shape='round' type='primary' onClick={onRefresh}>Refresh Summary</Button>}

			<TimeRangeAggrModal onChange={onHistorical} title='Historical Unique SQLs' buttontype='primary' showTime={false} showRange={true} 
						minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} />

			</Space>
			</div>

			</div>
			</>
		);
	};

	return (
		<>
		<div style={{ background: globBgColor }}>
		
		<div style={{ textAlign: 'center' }} >
		<Title level={3}><em>Unique SQL Summary</em></Title>
		<span style={{ fontSize : 14 }}><strong>Server {servname} : Appname {appname}</strong></span>
		</div>

		<ErrorBoundary>
		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>

		<>
		{optionDiv()}

		<UniqsqlSummaryTable {...props} key={refreshID} servname={servname} appname={appname} starttime={starttime} endtime={endtime} nohdr={true} />

		<div style={{ marginBottom : 30 }} />
		</>

		</div>

		</ErrorBoundary>
		
		</div>
		</>
	);
}

// Uniqsql page subscribed to serv/appname changes
export function UniqsqlSummaryMenuPage(props)
{
	const 		{servname, appname} = useRecoilValue(serverAppStateAtom);

	if (!servname || !appname) {
		return (
			<>
			<div style={{ background: globBgColor }}>

			<div style={{ textAlign: 'center', marginTop: 20 }} >
			<Title level={3}><em>Unique SQL Summary</em></Title>
			</div>

			<Result status="warning" title="No Valid Capture Servers found. Please register pcapture with idata first..." />

			</div>
			</>
		);	
	}

	return <UniqsqlSummaryPage {...props} servname={servname} appname={appname} />;
}	

export function AppSummaryTable({servname, appname, starttime, endtime, filter, maxrecs = 100000, nohdr})
{
	const			[{data, isloading, isapierror}, setApiData] = useState({data : [], isloading : true, isapierror : false});
	const			objref = useRef({tstart : null, tend : null, modalCount : 0});
	const			[selectedRows, setSelectedRows] = useState([]);

	const validProps = useMemo(() => {	
		
		if (!servname || !appname) {
			throw new Error("No valid servname or appname specified");
		}	

		if (starttime && endtime) {
			let		mstart = moment(starttime, moment.ISO_8601), mend;

			if (false === mstart.isValid()) {
				throw new Error(`Invalid starttime specified : ${starttime}`);
			}	

			mend = moment(endtime, moment.ISO_8601);

			if (false === mend.isValid()) {
				throw new Error(`Invalid endtime specified : ${endtime}`);
			}
			else if (mend.unix() < mstart.unix()) {
				throw new Error(`Invalid endtime specified : endtime less than starttime : ${endtime}`);
			}	

			if (mend.unix() - mstart.unix() < 300) {
				mstart.subtract(200, 'seconds');

			}	

			objref.current.tstart = mstart;
			objref.current.tend = mend;

		}
		else {
			objref.current.tstart = moment().subtract(60, 'minutes');
			objref.current.tend = moment();
		}	
		
		return true;

	}, [servname, appname, starttime, endtime, objref]);	

	if (validProps === false) {
		throw new Error(`Internal Error : Application Summary validProps check failed`);
	}	

	const modalCount = useCallback((isup) => {
		if (isup === true) {
			objref.current.modalCount++;
		}	
		else if (isup === false && objref.current.modalCount > 0) {
			objref.current.modalCount--;
		}	
	}, [objref]);	

	useEffect(() => {
		const fetchData = () => {
			const conf = 
			{
				url 	: "/getAppSQLQueriesData",
				method	: 'get',
				params 	: new URLSearchParams(removeUndefinedProps({
						servname,
						appname,
						starttime : objref.current.tstart.format(),
						endtime : objref.current.tend.format(),
						filtstr : filter,
						maxrecs,
					})),	
			};	

			axios(conf).then(({data}) => {
				if (!data || safetypeof(data) !== 'object' || !data.data || safetypeof(data.data) !== 'array') {
					console.log(`Invalid data received for App Summary fetch response\n`);
					setApiData({data : JSON.stringify(data).slice(0, 128), isloading : false, isapierror : true});
					
					return;
				}

				setApiData({data : data, isloading : false, isapierror : false});
			})
			.catch(() => {
				console.log(`Exception caught while waiting for App Summary fetch response`);
				setApiData({data : 'Exception caught while waiting for App Summary fetch response', isloading : false, isapierror : true});
			})
		};

		fetchData();

	}, [servname, appname, filter, maxrecs]);

	const tableOnRow = useCallback((record, rowIndex) => {
		return {
			onClick: event => {
				Modal.info({
					title : <span><strong>Application Summary for {servname} : {appname}</strong></span>,
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

	const handleRowSelect = useCallback((selectedRowKeys, selectedRows) => {
		setSelectedRows(selectedRows);
	}, [setSelectedRows]);


	const onTimeBreakup = useCallback(() => {
		CreateTab({title : 'AppSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey : `AppSummBreakup_${Date.now()}`});
	}, [selectedRows, servname, appname, filter, maxrecs, objref]);

	const onHistorical = useCallback((date, dateString) => {
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

		const			tabKey = `AppSumm_${Date.now()}`;
		
		CreateTab({title : 'AppSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey});

	}, [selectedRows, servname, appname, filter, maxrecs, objref]);	

	let			hinfo = null, hdr = null, seldiv = null;
	let			timestr = '';

	if (objref.current?.tstart && objref.current.tend) {
		if (!(starttime && endtime)) {
			timestr = 'For last hour : '
		}	

		timestr += `Start Time ${objref.current.tstart.format("MMM DD HH:mm:ss Z")} : End Time ${objref.current.tend.format("MMM DD HH:mm:ss Z")}`;
	}

	hdr = (
		<div style={{ textAlign: 'center', marginTop: 40, marginBottom : 20, }} >
		{!nohdr && <Title level={5}>Application Summary for {servname} / {appname}</Title>}
		<span style={{ fontSize : 14 }}><strong>{timestr}</strong></span>
		</div>
	);


	if (isloading === false && isapierror === false) { 
		if (safetypeof(data) === 'object' && safetypeof(data.data) === 'array') {
			let			columns, rowKey;
			const			sdata = data.data, trailer = data.trailer;

			seldiv = (
				<>
				
				<div style={{ marginBottom: 20, textAlign: sdata.length > 0 ? undefined : 'center'  }} >
				<span style={{ fontSize : 14 }}><em>{sdata.length > 0 ? 'Select 1 or more rows for further querying or click on a row for more info...' : 'No Data Seen'}</em></span>
				</div>

				<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere',}} >
					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} onClick={onTimeBreakup}>Duration 5 min Breakups</Button>

					<TimeRangeAggrModal onChange={onHistorical} title='Historical 5 min Breakups' showTime={false} showRange={true} buttontype='primary'
							minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} buttondisabled={!selectedRows || selectedRows.length === 0} />

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Multi Summary Breakups</Button>

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Detail Queries</Button>
				</div>

				</>
			);

			rowKey = 'app';

			columns = getAppSummColumns();

			hinfo = (
				<>
				<div style={{ marginBottom: 70 }} >
				<GyTable columns={columns} onRow={tableOnRow} dataSource={sdata} rowKey={rowKey} scroll={getTableScroll()} 
					title={() => seldiv}
					footer={(pagedata) => <CsvDownloadButton data={sdata} headers={getColumnNames(columns)} />}	
					rowSelection={{ onChange : handleRowSelect }} bordered defaultPageSize={10} />

				<SummaryTrailer trailer={trailer} />
				</div>
				</>
			);
		}
		else {

			hinfo = <Alert type="error" showIcon message="Application Summary Response Format Error Encountered" />;

			console.log(`Application Summary Data Format Error seen : ${JSON.stringify(data).slice(0, 512)}`);
		}
		
	}
	else if (isapierror) {
		const emsg = `Error while fetching data : ${typeof data === 'string' ? data.slice(0, 128) : ""}`;

		hinfo = <Alert type="error" showIcon message="Application Summary Request Error Encountered" description={emsg} />;
	}	
	else {
		hinfo = <LoadingAlert />;
	}

	return (
		<ErrorBoundary>

		<>
		{hdr}
		{filter && <Tag color='green'>Filters set...</Tag>}
		{hinfo}

		</>
		</ErrorBoundary>
	);
}

export function AppSummaryPage({servname, appname, starttime, endtime, ...props})
{
	const	[refreshID, setRefreshID]	= useState(0);

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

		const			tabKey = `Appsumm_${Date.now()}`;
		
		CreateTab({title : 'AppSummary History', contentCB : () => { return <AppSummaryPage {...props} servname={servname} appname={appname} 
					starttime={tstarttime} endtime={tendtime} /> }, tabKey});

	}, [servname, appname, props]);	

	const onRefresh = useCallback(() => setRefreshID((num) => num + 1), []);

	const optionDiv = () => {
		const searchtitle = `Search Application Summaries`;

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

			{!starttime && <Button shape='round' type='primary' onClick={onRefresh}>Refresh Summary</Button>}

			<TimeRangeAggrModal onChange={onHistorical} title='Historical Application Summary' buttontype='primary' showTime={false} showRange={true} 
						minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} />

			</Space>
			</div>

			</div>
			</>
		);
	};

	return (
		<>
		<div style={{ background: globBgColor }}>
		
		<div style={{ textAlign: 'center' }} >
		<Title level={3}><em>Application Summary</em></Title>
		<span style={{ fontSize : 14 }}><strong>Server {servname} : Appname {appname}</strong></span>
		</div>

		<ErrorBoundary>
		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>

		<>
		{optionDiv()}

		<AppSummaryTable {...props} key={refreshID} servname={servname} appname={appname} starttime={starttime} endtime={endtime} nohdr={true} />

		<div style={{ marginBottom : 30 }} />
		</>

		</div>

		</ErrorBoundary>
		
		</div>
		</>
	);
}

// Summary page subscribed to serv/appname changes
export function AppSummaryMenuPage(props)
{
	const 		{servname, appname} = useRecoilValue(serverAppStateAtom);

	if (!servname || !appname) {
		return (
			<>
			<div style={{ background: globBgColor }}>

			<div style={{ textAlign: 'center', marginTop: 20 }} >
			<Title level={3}><em>Application Summary</em></Title>
			</div>

			<Result status="warning" title="No Valid Capture Servers found. Please register pcapture with idata first..." />

			</div>
			</>
		);	
	}

	return <AppSummaryPage {...props} servname={servname} appname={appname} />;
}	

export function LoginSummaryTable({servname, appname, starttime, endtime, filter, maxrecs = 100000, nohdr})
{
	const			[{data, isloading, isapierror}, setApiData] = useState({data : [], isloading : true, isapierror : false});
	const			objref = useRef({tstart : null, tend : null, modalCount : 0});
	const			[selectedRows, setSelectedRows] = useState([]);

	const validProps = useMemo(() => {	
		
		if (!servname || !appname) {
			throw new Error("No valid servname or appname specified");
		}	

		if (starttime && endtime) {
			let		mstart = moment(starttime, moment.ISO_8601), mend;

			if (false === mstart.isValid()) {
				throw new Error(`Invalid starttime specified : ${starttime}`);
			}	

			mend = moment(endtime, moment.ISO_8601);

			if (false === mend.isValid()) {
				throw new Error(`Invalid endtime specified : ${endtime}`);
			}
			else if (mend.unix() < mstart.unix()) {
				throw new Error(`Invalid endtime specified : endtime less than starttime : ${endtime}`);
			}	

			if (mend.unix() - mstart.unix() < 300) {
				mstart.subtract(200, 'seconds');

			}	

			objref.current.tstart = mstart;
			objref.current.tend = mend;

		}
		else {
			objref.current.tstart = moment().subtract(60, 'minutes');
			objref.current.tend = moment();
		}	
		
		return true;

	}, [servname, appname, starttime, endtime, objref]);	

	if (validProps === false) {
		throw new Error(`Internal Error : Login Summary validProps check failed`);
	}	

	const modalCount = useCallback((isup) => {
		if (isup === true) {
			objref.current.modalCount++;
		}	
		else if (isup === false && objref.current.modalCount > 0) {
			objref.current.modalCount--;
		}	
	}, [objref]);	

	useEffect(() => {
		const fetchData = () => {
			const conf = 
			{
				url 	: "/getLoginSQLQueriesData",
				method	: 'get',
				params 	: new URLSearchParams(removeUndefinedProps({
						servname,
						appname,
						starttime : objref.current.tstart.format(),
						endtime : objref.current.tend.format(),
						filtstr : filter,
						maxrecs,
					})),	
			};	

			axios(conf).then(({data}) => {
				if (!data || safetypeof(data) !== 'object' || !data.data || safetypeof(data.data) !== 'array') {
					console.log(`Invalid data received for Login Summary fetch response\n`);
					setApiData({data : JSON.stringify(data).slice(0, 128), isloading : false, isapierror : true});
					
					return;
				}

				setApiData({data : data, isloading : false, isapierror : false});
			})
			.catch(() => {
				console.log(`Exception caught while waiting for Login Summary fetch response`);
				setApiData({data : 'Exception caught while waiting for Login Summary fetch response', isloading : false, isapierror : true});
			})
		};

		fetchData();

	}, [servname, appname, filter, maxrecs]);

	const tableOnRow = useCallback((record, rowIndex) => {
		return {
			onClick: event => {
				Modal.info({
					title : <span><strong>Login Summary for {servname} : {appname}</strong></span>,
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

	const handleRowSelect = useCallback((selectedRowKeys, selectedRows) => {
		setSelectedRows(selectedRows);
	}, [setSelectedRows]);


	const onTimeBreakup = useCallback(() => {
		CreateTab({title : 'LoginSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey : `LoginSummBreakup_${Date.now()}`});
	}, [selectedRows, servname, appname, filter, maxrecs, objref]);

	const onHistorical = useCallback((date, dateString) => {
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

		const			tabKey = `LoginSumm_${Date.now()}`;
		
		CreateTab({title : 'LoginSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey});

	}, [selectedRows, servname, appname, filter, maxrecs, objref]);	

	let			hinfo = null, hdr = null, seldiv = null;
	let			timestr = '';

	if (objref.current?.tstart && objref.current.tend) {
		if (!(starttime && endtime)) {
			timestr = 'For last hour : '
		}	

		timestr += `Start Time ${objref.current.tstart.format("MMM DD HH:mm:ss Z")} : End Time ${objref.current.tend.format("MMM DD HH:mm:ss Z")}`;
	}

	hdr = (
		<div style={{ textAlign: 'center', marginTop: 40, marginBottom : 20, }} >
		{!nohdr && <Title level={5}>Login Summary for {servname} / {appname}</Title>}
		<span style={{ fontSize : 14 }}><strong>{timestr}</strong></span>
		</div>
	);


	if (isloading === false && isapierror === false) { 
		if (safetypeof(data) === 'object' && safetypeof(data.data) === 'array') {
			let			columns, rowKey;
			const			sdata = data.data, trailer = data.trailer;

			seldiv = (
				<>
				
				<div style={{ marginBottom: 20, textAlign: sdata.length > 0 ? undefined : 'center'  }} >
				<span style={{ fontSize : 14 }}><em>{sdata.length > 0 ? 'Select 1 or more rows for further querying or click on a row for more info...' : 'No Data Seen'}</em></span>
				</div>

				<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere',}} >
					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} onClick={onTimeBreakup}>Duration 5 min Breakups</Button>

					<TimeRangeAggrModal onChange={onHistorical} title='Historical 5 min Breakups' showTime={false} showRange={true} buttontype='primary'
							minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} buttondisabled={!selectedRows || selectedRows.length === 0} />

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Multi Summary Breakups</Button>

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Detail Queries</Button>
				</div>

				</>
			);

			rowKey = 'login';

			columns = getLoginSummColumns();

			hinfo = (
				<>
				<div style={{ marginBottom: 70 }} >
				<GyTable columns={columns} onRow={tableOnRow} dataSource={sdata} rowKey={rowKey} scroll={getTableScroll()} 
					title={() => seldiv}
					footer={(pagedata) => <CsvDownloadButton data={sdata} headers={getColumnNames(columns)} />}	
					rowSelection={{ onChange : handleRowSelect }} bordered defaultPageSize={10} />

				<SummaryTrailer trailer={trailer} />
				</div>
				</>
			);
		}
		else {

			hinfo = <Alert type="error" showIcon message="Login Summary Response Format Error Encountered" />;

			console.log(`Login Summary Data Format Error seen : ${JSON.stringify(data).slice(0, 512)}`);
		}
		
	}
	else if (isapierror) {
		const emsg = `Error while fetching data : ${typeof data === 'string' ? data.slice(0, 128) : ""}`;

		hinfo = <Alert type="error" showIcon message="Login Summary Request Error Encountered" description={emsg} />;
	}	
	else {
		hinfo = <LoadingAlert />;
	}

	return (
		<ErrorBoundary>

		<>
		{hdr}
		{filter && <Tag color='green'>Filters set...</Tag>}
		{hinfo}

		</>
		</ErrorBoundary>
	);
}

export function LoginSummaryPage({servname, appname, starttime, endtime, ...props})
{
	const	[refreshID, setRefreshID]	= useState(0);

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

		const			tabKey = `Loginsumm_${Date.now()}`;
		
		CreateTab({title : 'LoginSummary History', contentCB : () => { return <LoginSummaryPage {...props} servname={servname} appname={appname} 
					starttime={tstarttime} endtime={tendtime} /> }, tabKey});

	}, [servname, appname, props]);	

	const onRefresh = useCallback(() => setRefreshID((num) => num + 1), []);

	const optionDiv = () => {
		const searchtitle = `Search Login Summaries`;

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

			{!starttime && <Button shape='round' type='primary' onClick={onRefresh}>Refresh Summary</Button>}

			<TimeRangeAggrModal onChange={onHistorical} title='Historical Login Summary' buttontype='primary' showTime={false} showRange={true} 
						minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} />

			</Space>
			</div>

			</div>
			</>
		);
	};

	return (
		<>
		<div style={{ background: globBgColor }}>
		
		<div style={{ textAlign: 'center' }} >
		<Title level={3}><em>Login Summary</em></Title>
		<span style={{ fontSize : 14 }}><strong>Server {servname} : Appname {appname}</strong></span>
		</div>

		<ErrorBoundary>
		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>

		<>
		{optionDiv()}

		<LoginSummaryTable {...props} key={refreshID} servname={servname} appname={appname} starttime={starttime} endtime={endtime} nohdr={true} />

		<div style={{ marginBottom : 30 }} />
		</>

		</div>

		</ErrorBoundary>
		
		</div>
		</>
	);
}

// Summary page subscribed to serv/appname changes
export function LoginSummaryMenuPage(props)
{
	const 		{servname, appname} = useRecoilValue(serverAppStateAtom);

	if (!servname || !appname) {
		return (
			<>
			<div style={{ background: globBgColor }}>

			<div style={{ textAlign: 'center', marginTop: 20 }} >
			<Title level={3}><em>Login Summary</em></Title>
			</div>

			<Result status="warning" title="No Valid Capture Servers found. Please register pcapture with idata first..." />

			</div>
			</>
		);	
	}

	return <LoginSummaryPage {...props} servname={servname} appname={appname} />;
}	

export function DBSummaryTable({servname, appname, starttime, endtime, filter, maxrecs = 100000, nohdr})
{
	const			[{data, isloading, isapierror}, setApiData] = useState({data : [], isloading : true, isapierror : false});
	const			objref = useRef({tstart : null, tend : null, modalCount : 0});
	const			[selectedRows, setSelectedRows] = useState([]);

	const validProps = useMemo(() => {	
		
		if (!servname || !appname) {
			throw new Error("No valid servname or appname specified");
		}	

		if (starttime && endtime) {
			let		mstart = moment(starttime, moment.ISO_8601), mend;

			if (false === mstart.isValid()) {
				throw new Error(`Invalid starttime specified : ${starttime}`);
			}	

			mend = moment(endtime, moment.ISO_8601);

			if (false === mend.isValid()) {
				throw new Error(`Invalid endtime specified : ${endtime}`);
			}
			else if (mend.unix() < mstart.unix()) {
				throw new Error(`Invalid endtime specified : endtime less than starttime : ${endtime}`);
			}	

			if (mend.unix() - mstart.unix() < 300) {
				mstart.subtract(200, 'seconds');

			}	

			objref.current.tstart = mstart;
			objref.current.tend = mend;

		}
		else {
			objref.current.tstart = moment().subtract(60, 'minutes');
			objref.current.tend = moment();
		}	
		
		return true;

	}, [servname, appname, starttime, endtime, objref]);	

	if (validProps === false) {
		throw new Error(`Internal Error : DB Summary validProps check failed`);
	}	

	const modalCount = useCallback((isup) => {
		if (isup === true) {
			objref.current.modalCount++;
		}	
		else if (isup === false && objref.current.modalCount > 0) {
			objref.current.modalCount--;
		}	
	}, [objref]);	

	useEffect(() => {
		const fetchData = () => {
			const conf = 
			{
				url 	: "/getDBSQLQueriesData",
				method	: 'get',
				params 	: new URLSearchParams(removeUndefinedProps({
						servname,
						appname,
						starttime : objref.current.tstart.format(),
						endtime : objref.current.tend.format(),
						filtstr : filter,
						maxrecs,
					})),	
			};	

			axios(conf).then(({data}) => {
				if (!data || safetypeof(data) !== 'object' || !data.data || safetypeof(data.data) !== 'array') {
					console.log(`Invalid data received for DB Summary fetch response\n`);
					setApiData({data : JSON.stringify(data).slice(0, 128), isloading : false, isapierror : true});
					
					return;
				}

				setApiData({data : data, isloading : false, isapierror : false});
			})
			.catch(() => {
				console.log(`Exception caught while waiting for DB Summary fetch response`);
				setApiData({data : 'Exception caught while waiting for DB Summary fetch response', isloading : false, isapierror : true});
			})
		};

		fetchData();

	}, [servname, appname, filter, maxrecs]);

	const tableOnRow = useCallback((record, rowIndex) => {
		return {
			onClick: event => {
				Modal.info({
					title : <span><strong>DB Summary for {servname} : {appname}</strong></span>,
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

	const handleRowSelect = useCallback((selectedRowKeys, selectedRows) => {
		setSelectedRows(selectedRows);
	}, [setSelectedRows]);


	const onTimeBreakup = useCallback(() => {
		CreateTab({title : 'DBSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey : `DBSummBreakup_${Date.now()}`});
	}, [selectedRows, servname, appname, filter, maxrecs, objref]);

	const onHistorical = useCallback((date, dateString) => {
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

		const			tabKey = `DBSumm_${Date.now()}`;
		
		CreateTab({title : 'DBSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey});

	}, [selectedRows, servname, appname, filter, maxrecs, objref]);	

	let			hinfo = null, hdr = null, seldiv = null;
	let			timestr = '';

	if (objref.current?.tstart && objref.current.tend) {
		if (!(starttime && endtime)) {
			timestr = 'For last hour : '
		}	

		timestr += `Start Time ${objref.current.tstart.format("MMM DD HH:mm:ss Z")} : End Time ${objref.current.tend.format("MMM DD HH:mm:ss Z")}`;
	}

	hdr = (
		<div style={{ textAlign: 'center', marginTop: 40, marginBottom : 20, }} >
		{!nohdr && <Title level={5}>Database Summary for {servname} / {appname}</Title>}
		<span style={{ fontSize : 14 }}><strong>{timestr}</strong></span>
		</div>
	);


	if (isloading === false && isapierror === false) { 
		if (safetypeof(data) === 'object' && safetypeof(data.data) === 'array') {
			let			columns, rowKey;
			const			sdata = data.data, trailer = data.trailer;

			seldiv = (
				<>
				
				<div style={{ marginBottom: 20, textAlign: sdata.length > 0 ? undefined : 'center'  }} >
				<span style={{ fontSize : 14 }}><em>{sdata.length > 0 ? 'Select 1 or more rows for further querying or click on a row for more info...' : 'No Data Seen'}</em></span>
				</div>

				<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere',}} >
					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} onClick={onTimeBreakup}>Duration 5 min Breakups</Button>

					<TimeRangeAggrModal onChange={onHistorical} title='Historical 5 min Breakups' showTime={false} showRange={true} buttontype='primary'
							minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} buttondisabled={!selectedRows || selectedRows.length === 0} />

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Multi Summary Breakups</Button>

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Detail Queries</Button>
				</div>

				</>
			);

			rowKey = 'dbname';

			columns = getDBSummColumns();

			hinfo = (
				<>
				<div style={{ marginBottom: 70 }} >
				<GyTable columns={columns} onRow={tableOnRow} dataSource={sdata} rowKey={rowKey} scroll={getTableScroll()} 
					title={() => seldiv}
					footer={(pagedata) => <CsvDownloadButton data={sdata} headers={getColumnNames(columns)} />}	
					rowSelection={{ onChange : handleRowSelect }} bordered defaultPageSize={10} />

				<SummaryTrailer trailer={trailer} />
				</div>
				</>
			);
		}
		else {

			hinfo = <Alert type="error" showIcon message="DB Summary Response Format Error Encountered" />;

			console.log(`DB Summary Data Format Error seen : ${JSON.stringify(data).slice(0, 512)}`);
		}
		
	}
	else if (isapierror) {
		const emsg = `Error while fetching data : ${typeof data === 'string' ? data.slice(0, 128) : ""}`;

		hinfo = <Alert type="error" showIcon message="DB Summary Request Error Encountered" description={emsg} />;
	}	
	else {
		hinfo = <LoadingAlert />;
	}

	return (
		<ErrorBoundary>

		<>
		{hdr}
		{filter && <Tag color='green'>Filters set...</Tag>}
		{hinfo}

		</>
		</ErrorBoundary>
	);
}

export function DBSummaryPage({servname, appname, starttime, endtime, ...props})
{
	const	[refreshID, setRefreshID]	= useState(0);

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

		const			tabKey = `DBsumm_${Date.now()}`;
		
		CreateTab({title : 'DBSummary History', contentCB : () => { return <DBSummaryPage {...props} servname={servname} appname={appname} 
					starttime={tstarttime} endtime={tendtime} /> }, tabKey});

	}, [servname, appname, props]);	

	const onRefresh = useCallback(() => setRefreshID((num) => num + 1), []);

	const optionDiv = () => {
		const searchtitle = `Search DB Summaries`;

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

			{!starttime && <Button shape='round' type='primary' onClick={onRefresh}>Refresh Summary</Button>}

			<TimeRangeAggrModal onChange={onHistorical} title='Historical DB Summary' buttontype='primary' showTime={false} showRange={true} 
						minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} />

			</Space>
			</div>

			</div>
			</>
		);
	};

	return (
		<>
		<div style={{ background: globBgColor }}>
		
		<div style={{ textAlign: 'center' }} >
		<Title level={3}><em>Database Summary</em></Title>
		<span style={{ fontSize : 14 }}><strong>Server {servname} : Appname {appname}</strong></span>
		</div>

		<ErrorBoundary>
		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>

		<>
		{optionDiv()}

		<DBSummaryTable {...props} key={refreshID} servname={servname} appname={appname} starttime={starttime} endtime={endtime} nohdr={true} />

		<div style={{ marginBottom : 30 }} />
		</>

		</div>

		</ErrorBoundary>
		
		</div>
		</>
	);
}

// Summary page subscribed to serv/appname changes
export function DBSummaryMenuPage(props)
{
	const 		{servname, appname} = useRecoilValue(serverAppStateAtom);

	if (!servname || !appname) {
		return (
			<>
			<div style={{ background: globBgColor }}>

			<div style={{ textAlign: 'center', marginTop: 20 }} >
			<Title level={3}><em>DB Summary</em></Title>
			</div>

			<Result status="warning" title="No Valid Capture Servers found. Please register pcapture with idata first..." />

			</div>
			</>
		);	
	}

	return <DBSummaryPage {...props} servname={servname} appname={appname} />;
}	

export function IPSummaryTable({servname, appname, starttime, endtime, filter, maxrecs = 100000, nohdr})
{
	const			[{data, isloading, isapierror}, setApiData] = useState({data : [], isloading : true, isapierror : false});
	const			objref = useRef({tstart : null, tend : null, modalCount : 0});
	const			[selectedRows, setSelectedRows] = useState([]);

	const validProps = useMemo(() => {	
		
		if (!servname || !appname) {
			throw new Error("No valid servname or appname specified");
		}	

		if (starttime && endtime) {
			let		mstart = moment(starttime, moment.ISO_8601), mend;

			if (false === mstart.isValid()) {
				throw new Error(`Invalid starttime specified : ${starttime}`);
			}	

			mend = moment(endtime, moment.ISO_8601);

			if (false === mend.isValid()) {
				throw new Error(`Invalid endtime specified : ${endtime}`);
			}
			else if (mend.unix() < mstart.unix()) {
				throw new Error(`Invalid endtime specified : endtime less than starttime : ${endtime}`);
			}	

			if (mend.unix() - mstart.unix() < 300) {
				mstart.subtract(200, 'seconds');

			}	

			objref.current.tstart = mstart;
			objref.current.tend = mend;

		}
		else {
			objref.current.tstart = moment().subtract(60, 'minutes');
			objref.current.tend = moment();
		}	
		
		return true;

	}, [servname, appname, starttime, endtime, objref]);	

	if (validProps === false) {
		throw new Error(`Internal Error : IP Summary validProps check failed`);
	}	

	const modalCount = useCallback((isup) => {
		if (isup === true) {
			objref.current.modalCount++;
		}	
		else if (isup === false && objref.current.modalCount > 0) {
			objref.current.modalCount--;
		}	
	}, [objref]);	

	useEffect(() => {
		const fetchData = () => {
			const conf = 
			{
				url 	: "/getClientSQLQueriesData",
				method	: 'get',
				params 	: new URLSearchParams(removeUndefinedProps({
						servname,
						appname,
						starttime : objref.current.tstart.format(),
						endtime : objref.current.tend.format(),
						filtstr : filter,
						maxrecs,
					})),	
			};	

			axios(conf).then(({data}) => {
				if (!data || safetypeof(data) !== 'object' || !data.data || safetypeof(data.data) !== 'array') {
					console.log(`Invalid data received for Client IP Summary fetch response\n`);
					setApiData({data : JSON.stringify(data).slice(0, 128), isloading : false, isapierror : true});
					
					return;
				}

				setApiData({data : data, isloading : false, isapierror : false});
			})
			.catch(() => {
				console.log(`Exception caught while waiting for Client IP Summary fetch response`);
				setApiData({data : 'Exception caught while waiting for Client IP Summary fetch response', isloading : false, isapierror : true});
			})
		};

		fetchData();

	}, [servname, appname, filter, maxrecs]);

	const tableOnRow = useCallback((record, rowIndex) => {
		return {
			onClick: event => {
				Modal.info({
					title : <span><strong>Client IP Summary for {servname} : {appname}</strong></span>,
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

	const handleRowSelect = useCallback((selectedRowKeys, selectedRows) => {
		setSelectedRows(selectedRows);
	}, [setSelectedRows]);


	const onTimeBreakup = useCallback(() => {
		CreateTab({title : 'IPSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey : `IPSummBreakup_${Date.now()}`});
	}, [selectedRows, servname, appname, filter, maxrecs, objref]);

	const onHistorical = useCallback((date, dateString) => {
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

		const			tabKey = `IPSumm_${Date.now()}`;
		
		CreateTab({title : 'IPSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey});

	}, [selectedRows, servname, appname, filter, maxrecs, objref]);	

	let			hinfo = null, hdr = null, seldiv = null;
	let			timestr = '';

	if (objref.current?.tstart && objref.current.tend) {
		if (!(starttime && endtime)) {
			timestr = 'For last hour : '
		}	

		timestr += `Start Time ${objref.current.tstart.format("MMM DD HH:mm:ss Z")} : End Time ${objref.current.tend.format("MMM DD HH:mm:ss Z")}`;
	}

	hdr = (
		<div style={{ textAlign: 'center', marginTop: 40, marginBottom : 20, }} >
		{!nohdr && <Title level={5}>Client IP Summary for {servname} / {appname}</Title>}
		<span style={{ fontSize : 14 }}><strong>{timestr}</strong></span>
		</div>
	);


	if (isloading === false && isapierror === false) { 
		if (safetypeof(data) === 'object' && safetypeof(data.data) === 'array') {
			let			columns, rowKey;
			const			sdata = data.data, trailer = data.trailer;

			seldiv = (
				<>
				
				<div style={{ marginBottom: 20, textAlign: sdata.length > 0 ? undefined : 'center'  }} >
				<span style={{ fontSize : 14 }}><em>{sdata.length > 0 ? 'Select 1 or more rows for further querying or click on a row for more info...' : 'No Data Seen'}</em></span>
				</div>

				<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere',}} >
					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} onClick={onTimeBreakup}>Duration 5 min Breakups</Button>

					<TimeRangeAggrModal onChange={onHistorical} title='Historical 5 min Breakups' showTime={false} showRange={true} buttontype='primary'
							minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} buttondisabled={!selectedRows || selectedRows.length === 0} />

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Multi Summary Breakups</Button>

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Detail Queries</Button>
				</div>

				</>
			);

			rowKey = 'clientip';

			columns = getIPSummColumns();

			hinfo = (
				<>
				<div style={{ marginBottom: 70 }} >
				<GyTable columns={columns} onRow={tableOnRow} dataSource={sdata} rowKey={rowKey} scroll={getTableScroll()} 
					title={() => seldiv}
					footer={(pagedata) => <CsvDownloadButton data={sdata} headers={getColumnNames(columns)} />}	
					rowSelection={{ onChange : handleRowSelect }} bordered defaultPageSize={10} />

				<SummaryTrailer trailer={trailer} />
				</div>
				</>
			);
		}
		else {

			hinfo = <Alert type="error" showIcon message="Client IP Summary Response Format Error Encountered" />;

			console.log(`Client IP Summary Data Format Error seen : ${JSON.stringify(data).slice(0, 512)}`);
		}
		
	}
	else if (isapierror) {
		const emsg = `Error while fetching data : ${typeof data === 'string' ? data.slice(0, 128) : ""}`;

		hinfo = <Alert type="error" showIcon message="Client IP Summary Request Error Encountered" description={emsg} />;
	}	
	else {
		hinfo = <LoadingAlert />;
	}

	return (
		<ErrorBoundary>

		<>
		{hdr}
		{filter && <Tag color='green'>Filters set...</Tag>}
		{hinfo}

		</>
		</ErrorBoundary>
	);
}

export function IPSummaryPage({servname, appname, starttime, endtime, ...props})
{
	const	[refreshID, setRefreshID]	= useState(0);

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

		const			tabKey = `IPsumm_${Date.now()}`;
		
		CreateTab({title : 'IPSummary History', contentCB : () => { return <IPSummaryPage {...props} servname={servname} appname={appname} 
					starttime={tstarttime} endtime={tendtime} /> }, tabKey});

	}, [servname, appname, props]);	

	const onRefresh = useCallback(() => setRefreshID((num) => num + 1), []);

	const optionDiv = () => {
		const searchtitle = `Search Client IP Summaries`;

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

			{!starttime && <Button shape='round' type='primary' onClick={onRefresh}>Refresh Summary</Button>}

			<TimeRangeAggrModal onChange={onHistorical} title='Historical Client IP Summary' buttontype='primary' showTime={false} showRange={true} 
						minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} />

			</Space>
			</div>

			</div>
			</>
		);
	};

	return (
		<>
		<div style={{ background: globBgColor }}>
		
		<div style={{ textAlign: 'center' }} >
		<Title level={3}><em>Client IP Summary</em></Title>
		<span style={{ fontSize : 14 }}><strong>Server {servname} : Appname {appname}</strong></span>
		</div>

		<ErrorBoundary>
		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>

		<>
		{optionDiv()}

		<IPSummaryTable {...props} key={refreshID} servname={servname} appname={appname} starttime={starttime} endtime={endtime} nohdr={true} />

		<div style={{ marginBottom : 30 }} />
		</>

		</div>

		</ErrorBoundary>
		
		</div>
		</>
	);
}

// Summary page subscribed to serv/appname changes
export function IPSummaryMenuPage(props)
{
	const 		{servname, appname} = useRecoilValue(serverAppStateAtom);

	if (!servname || !appname) {
		return (
			<>
			<div style={{ background: globBgColor }}>

			<div style={{ textAlign: 'center', marginTop: 20 }} >
			<Title level={3}><em>IP Summary</em></Title>
			</div>

			<Result status="warning" title="No Valid Capture Servers found. Please register pcapture with idata first..." />

			</div>
			</>
		);	
	}

	return <IPSummaryPage {...props} servname={servname} appname={appname} />;
}	

export function ErrorSummaryTable({servname, appname, starttime, endtime, filter, maxrecs = 100000, nohdr})
{
	const			[{data, isloading, isapierror}, setApiData] = useState({data : [], isloading : true, isapierror : false});
	const			objref = useRef({tstart : null, tend : null, modalCount : 0});
	const			[selectedRows, setSelectedRows] = useState([]);

	const validProps = useMemo(() => {	
		
		if (!servname || !appname) {
			throw new Error("No valid servname or appname specified");
		}	

		if (starttime && endtime) {
			let		mstart = moment(starttime, moment.ISO_8601), mend;

			if (false === mstart.isValid()) {
				throw new Error(`Invalid starttime specified : ${starttime}`);
			}	

			mend = moment(endtime, moment.ISO_8601);

			if (false === mend.isValid()) {
				throw new Error(`Invalid endtime specified : ${endtime}`);
			}
			else if (mend.unix() < mstart.unix()) {
				throw new Error(`Invalid endtime specified : endtime less than starttime : ${endtime}`);
			}	

			if (mend.unix() - mstart.unix() < 300) {
				mstart.subtract(200, 'seconds');

			}	

			objref.current.tstart = mstart;
			objref.current.tend = mend;

		}
		else {
			objref.current.tstart = moment().subtract(60, 'minutes');
			objref.current.tend = moment();
		}	
		
		return true;

	}, [servname, appname, starttime, endtime, objref]);	

	if (validProps === false) {
		throw new Error(`Internal Error : Error Summary validProps check failed`);
	}	

	const modalCount = useCallback((isup) => {
		if (isup === true) {
			objref.current.modalCount++;
		}	
		else if (isup === false && objref.current.modalCount > 0) {
			objref.current.modalCount--;
		}	
	}, [objref]);	

	useEffect(() => {
		const fetchData = () => {
			const conf = 
			{
				url 	: "/getErrorSQLQueriesData",
				method	: 'get',
				params 	: new URLSearchParams(removeUndefinedProps({
						servname,
						appname,
						starttime : objref.current.tstart.format(),
						endtime : objref.current.tend.format(),
						filtstr : filter,
						maxrecs,
					})),	
			};	

			axios(conf).then(({data}) => {
				if (!data || safetypeof(data) !== 'object' || !data.data || safetypeof(data.data) !== 'array') {
					console.log(`Invalid data received for Error Summary fetch response\n`);
					setApiData({data : JSON.stringify(data).slice(0, 128), isloading : false, isapierror : true});
					
					return;
				}

				setApiData({data : data, isloading : false, isapierror : false});
			})
			.catch(() => {
				console.log(`Exception caught while waiting for Error Summary fetch response`);
				setApiData({data : 'Exception caught while waiting for Error Summary fetch response', isloading : false, isapierror : true});
			})
		};

		fetchData();

	}, [servname, appname, filter, maxrecs]);

	const tableOnRow = useCallback((record, rowIndex) => {
		return {
			onClick: event => {
				Modal.info({
					title : <span><strong>Error Summary for {servname} : {appname}</strong></span>,
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

	const handleRowSelect = useCallback((selectedRowKeys, selectedRows) => {
		setSelectedRows(selectedRows);
	}, [setSelectedRows]);


	const onTimeBreakup = useCallback(() => {
		CreateTab({title : 'ErrorSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey : `ErrorSummBreakup_${Date.now()}`});
	}, [selectedRows, servname, appname, filter, maxrecs, objref]);

	const onHistorical = useCallback((date, dateString) => {
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

		const			tabKey = `ErrorSumm_${Date.now()}`;
		
		CreateTab({title : 'ErrorSumm Breakup', contentCB : () => <div>TODO...</div>, tabKey});

	}, [selectedRows, servname, appname, filter, maxrecs, objref]);	

	let			hinfo = null, hdr = null, seldiv = null;
	let			timestr = '';

	if (objref.current?.tstart && objref.current.tend) {
		if (!(starttime && endtime)) {
			timestr = 'For last hour : '
		}	

		timestr += `Start Time ${objref.current.tstart.format("MMM DD HH:mm:ss Z")} : End Time ${objref.current.tend.format("MMM DD HH:mm:ss Z")}`;
	}

	hdr = (
		<div style={{ textAlign: 'center', marginTop: 40, marginBottom : 20, }} >
		{!nohdr && <Title level={5}>Error Summary for {servname} / {appname}</Title>}
		<span style={{ fontSize : 14 }}><strong>{timestr}</strong></span>
		</div>
	);


	if (isloading === false && isapierror === false) { 
		if (safetypeof(data) === 'object' && safetypeof(data.data) === 'array') {
			let			columns, rowKey;
			const			sdata = data.data, trailer = data.trailer;

			seldiv = (
				<>
				
				<div style={{ marginBottom: 20, textAlign: sdata.length > 0 ? undefined : 'center'  }} >
				<span style={{ fontSize : 14 }}><em>{sdata.length > 0 ? 'Select 1 or more rows for further querying or click on a row for more info...' : 'No Data Seen'}</em></span>
				</div>

				<div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', placeItems: 'center', overflowX : 'auto', overflowWrap : 'anywhere',}} >
					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} onClick={onTimeBreakup}>Duration 5 min Breakups</Button>

					<TimeRangeAggrModal onChange={onHistorical} title='Historical 5 min Breakups' showTime={false} showRange={true} buttontype='primary'
							minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} buttondisabled={!selectedRows || selectedRows.length === 0} />

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Multi Summary Breakups</Button>

					<Button shape='round' type='primary' disabled={!selectedRows || selectedRows.length === 0} >Detail Queries</Button>
				</div>

				</>
			);

			rowKey = 'errcode';

			columns = getErrorSummColumns();

			hinfo = (
				<>
				<div style={{ marginBottom: 70 }} >
				<GyTable columns={columns} onRow={tableOnRow} dataSource={sdata} rowKey={rowKey} scroll={getTableScroll()} 
					title={() => seldiv}
					footer={(pagedata) => <CsvDownloadButton data={sdata} headers={getColumnNames(columns)} />}	
					rowSelection={{ onChange : handleRowSelect }} bordered defaultPageSize={10} />

				<SummaryTrailer trailer={trailer} isErrorSumm={true} />
				</div>
				</>
			);
		}
		else {

			hinfo = <Alert type="error" showIcon message="Error Summary Response Format Error Encountered" />;

			console.log(`Error Summary Data Format Error seen : ${JSON.stringify(data).slice(0, 512)}`);
		}
		
	}
	else if (isapierror) {
		const emsg = `Error while fetching data : ${typeof data === 'string' ? data.slice(0, 128) : ""}`;

		hinfo = <Alert type="error" showIcon message="Error Summary Request Error Encountered" description={emsg} />;
	}	
	else {
		hinfo = <LoadingAlert />;
	}

	return (
		<ErrorBoundary>

		<>
		{hdr}
		{filter && <Tag color='green'>Filters set...</Tag>}
		{hinfo}

		</>
		</ErrorBoundary>
	);
}

export function ErrorSummaryPage({servname, appname, starttime, endtime, ...props})
{
	const	[refreshID, setRefreshID]	= useState(0);

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

		const			tabKey = `Errorsumm_${Date.now()}`;
		
		CreateTab({title : 'ErrorSummary History', contentCB : () => { return <ErrorSummaryPage {...props} servname={servname} appname={appname} 
					starttime={tstarttime} endtime={tendtime} /> }, tabKey});

	}, [servname, appname, props]);	

	const onRefresh = useCallback(() => setRefreshID((num) => num + 1), []);

	const optionDiv = () => {
		const searchtitle = `Search Error Summaries`;

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

			{!starttime && <Button shape='round' type='primary' onClick={onRefresh}>Refresh Summary</Button>}

			<TimeRangeAggrModal onChange={onHistorical} title='Historical Error Summary' buttontype='primary' showTime={false} showRange={true} 
						minAggrRangeMin={0} maxAggrRangeMin={0} disableFuture={true} />

			</Space>
			</div>

			</div>
			</>
		);
	};

	return (
		<>
		<div style={{ background: globBgColor }}>
		
		<div style={{ textAlign: 'center' }} >
		<Title level={3}><em>Error Summary</em></Title>
		<span style={{ fontSize : 14 }}><strong>Server {servname} : Appname {appname}</strong></span>
		</div>

		<ErrorBoundary>
		<div style={{ width : '95%', margin : '50px auto 50px auto', background: globCompBgColor }}>

		<>
		{optionDiv()}

		<ErrorSummaryTable {...props} key={refreshID} servname={servname} appname={appname} starttime={starttime} endtime={endtime} nohdr={true} />

		<div style={{ marginBottom : 30 }} />
		</>

		</div>

		</ErrorBoundary>
		
		</div>
		</>
	);
}

// Summary page subscribed to serv/appname changes
export function ErrorSummaryMenuPage(props)
{
	const 		{servname, appname} = useRecoilValue(serverAppStateAtom);

	if (!servname || !appname) {
		return (
			<>
			<div style={{ background: globBgColor }}>

			<div style={{ textAlign: 'center', marginTop: 20 }} >
			<Title level={3}><em>Error Summary</em></Title>
			</div>

			<Result status="warning" title="No Valid Capture Servers found. Please register pcapture with idata first..." />

			</div>
			</>
		);	
	}

	return <ErrorSummaryPage {...props} servname={servname} appname={appname} />;
}	


