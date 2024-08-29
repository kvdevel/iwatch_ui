
import 		React, { useState, useEffect, useReducer, useRef } from 'react';
import 		{Alert, Button, Modal, Descriptions, Spin, InputNumber} from 'antd';
import 		axios from 'axios';
import 		moment from 'moment';
import 		{format} from "d3-format";

import		{globTabCBs} from '../App.js';

const 		{ ErrorBoundary } = Alert;

export function safetypeof(val, arrayAsObject = false)
{
	if (val === undefined) {
		return 'undefined';
	}

	if (val === null) {
		return 'null';
	}	

	if (false === arrayAsObject && Array.isArray(val)) {
		return 'array';
	}	

	return typeof val;
}	

export function isEmptyObj(obj, ignUndefined = false) 
{
	for (let x in obj) { 
		if (obj.hasOwnProperty(x)) {
			if (obj[x] !== undefined || !ignUndefined) {
				return false; 
			}
		}	
	}

	return true;
}

export function getMinEndtime(starttime, minuteOffset, endtime)
{
	if (!starttime) {
		return moment().add(minuteOffset ?? 5, 'minute').format();
	}	

	if (!endtime) {
		return moment(starttime, moment.ISO_8601).add(minuteOffset, 'minute').format();
	}	

	let			moff = moment(starttime, moment.ISO_8601).add(minuteOffset, 'minute'), mend = moment(endtime, moment.ISO_8601);

	if (moff < mend) {
		return moff.format();
	}	

	return mend.format();
}	

export const Durmsec = {
	sec  	: 1000,
	min	: 60 * 1000,
	hour	: 60 * 60 * 1000,
	day	: 24 * 60 * 60 * 1000,
	week	: 7 * 24 * 60 * 60 * 1000,
};

export const NullPartha = '00000000000000000000000000000000';

export const NullID = '0000000000000000';

export function getStateColor(state)
{
	let		color;

	switch (state) {

	case 'Idle'	: color = "#29b355"; break;
	case 'Good'	: color = "#16592c"; break;
	case 'OK'	: color = "#b5b216"; break;
	case 'Bad'	: color = "#8f2121"; break;
	case 'Severe'	: color = "#ff0000"; break;
	case 'Down'	: color = "#300000"; break;

	default		: color = "#373138"; break;
	}	

	return color;
}	

export const stateEnum = [
	{ name : 'Idle', 		value : 'Idle' },
	{ name : 'Good',		value : 'Good' },
	{ name : 'OK',			value : 'OK' },
	{ name : 'Bad',			value : 'Bad' },
	{ name : 'Severe',		value : 'Severe' },
	{ name : 'Down',		value : 'Down' },
];

export function isStateIssue(state)
{
	return (state === 'Bad' || state === 'Severe' || state === 'Down');
}

export function numberOr1(num)
{
	return (num === 0 ? 1 : num);
}
	
export function formatFloat(fval, nDecimal = 3)
{
	return +parseFloat(fval).toFixed(nDecimal);
}

export function usecStrFormat(usec, invalidstr = 'NaN')
{
	if ((usec === undefined) || (true === isNaN(usec))) {
		return invalidstr;
	}	
	
	if (usec >= 1000) {
		if (usec >= 1000 * 1000) {
			return `${+parseFloat((usec/1000000).toFixed(3))} sec`; 
		}	

		return `${(usec/1000).toFixed(3)} msec`;
	}	
	
	return `${usec} usec`;
}

export function msecStrFormat(msec, invalidstr = 'NaN')
{
	if ((msec === undefined) || (true === isNaN(msec))) {
		return invalidstr;
	}	
	
	if (msec >= 1000) {
		return `${(msec/1000).toFixed(3)} sec`;
	}	
	
	return `${msec} msec`;
}

export function numSIFormat(num, fmt = '.3~s')
{
	return format(fmt)(num);
}
	

export function MBStrFormat(mb, decimals = 3, invalidstr = 'NaN')
{
	if ((mb === undefined) || (true === isNaN(mb))) {
		return invalidstr;
	}	
	
	if (mb >= 1024) {
		if (mb >= 1024 * 1024) {
			return `${+parseFloat((mb/(1024 * 1024)).toFixed(decimals))} TB`;
		}	

		return `${+parseFloat((mb/1024).toFixed(decimals))} GB`;
	}	
	
	return `${mb} MB`;
}

export function kbStrFormat(kb, decimals = 3, invalidstr = 'NaN')
{
	if ((kb === undefined) || (true === isNaN(kb))) {
		return invalidstr;
	}	
	
	if (kb >= 1024) {
		if (kb >= 1024 * 1024) {
			return `${+parseFloat((kb/(1024 * 1024)).toFixed(decimals))} GB`;
		}	

		return `${+parseFloat((kb/1024).toFixed(decimals))} MB`;
	}	
	
	return `${kb} KB`;
}

export function bytesStrFormat(bytes, decimals = 3, invalidstr = 'NaN')
{
	if ((bytes === undefined) || (true === isNaN(bytes))) {
		return invalidstr;
	}	

	let		u = 0, b = bytes;

	while (b >= 1024 || -b >= 1024) {
		b /= 1024;
		u++;
	}

	return (u ? b.toFixed(decimals) + ' ' : b) + ' KMGTPEZY'[u] + 'B';
}

// Will not recurse...
export function removeUndefinedProps(obj)
{
	if (obj) {
		Object.keys(obj).forEach(key => obj[key] === undefined ? delete obj[key] : {});
	}

	return obj;
}

// Returns string for use with nivo d3 charts : e.g. 'every 3 minutes'
export function getTickIntervalString(firstmsec, lastmsec, count = 10)
{
	if (!(firstmsec > 0 && lastmsec >= firstmsec && count > 0)) {
		return undefined;
	}	

	if (lastmsec - firstmsec <= 60000) {
		return `every ${numberOr1(Math.round((lastmsec - firstmsec)/1000/count))} seconds`;
	}	

	return `every ${numberOr1(Math.round((lastmsec - firstmsec)/(1000 * 60)/count))} minutes`;
}	

/*
 * Time Offset seconds from current time in sec/min/hours/days/months/years ago/later format
 */
export function timeoffsetString(diffsec, printago = true)
{
	if (typeof diffsec !== 'number' || Number.isNaN(diffsec)) {
		return 'NaN';
	}

	const			agostr = (printago ? (diffsec <= 0 ? 'ago' : 'later') : '');	

	if (diffsec < 0) {
		diffsec = -diffsec;
	}

	if (diffsec < 60) {
		return `${diffsec} second${diffsec !== 1 ? 's' : ''} ${agostr}`;
	}	
	else if (diffsec < 3600) {
		return `${(diffsec/60 | 0)} minute${diffsec >= 120 ? 's' : ''} ${agostr}`;
	}	
	else if (diffsec < 86400) {
		return `${(diffsec/3600 | 0)} hour${diffsec >= 7200 ? 's' : ''} ${agostr}`;
	}	
	else if (diffsec < 86400 * 30) {
		return `${(diffsec/86400 | 0)} day${diffsec >= 86400 * 2 ? 's' : ''} ${agostr}`;
	}	
	else if (diffsec < 86400 * 365) {
		return `${((diffsec/(86400 * 30)) | 0)} month${diffsec >= 86400 * 30 * 2 ? 's' : ''} ${agostr}`;
	}	
	else {
		return `${((diffsec/(86400 * 365)) | 0)} year${diffsec >= 86400 * 365 * 2 ? 's' : ''} ${agostr}`;
	}	
}	

/*
 * Difference from current time in sec/min/hours/days/months/years ago/later format
 */
export function timeDiffString(timestr, printago = true, printinvalid = true)
{
	if (typeof timestr !== 'string') {
		if (printinvalid) {
			return 'Invalid';
		}
		return '';
	}

	return timeoffsetString(moment(timestr, moment.ISO_8601).unix() - (Date.now()/1000 | 0), printago);
}

export function getLocalTime(timestr, dispmsec)
{
	if (typeof timestr !== 'string') {
		return 'Invalid';
	}

	if (!dispmsec) {
		return moment(timestr, moment.ISO_8601).format("MMM DD YYYY HH:mm:ss Z");
	}

	return moment(timestr, moment.ISO_8601).format("MMM DD YYYY HH:mm:ss.SSS Z");
}


export function splitInArray(strin)
{
	return '' + strin.split(',').map((str) => `'${str}'`);
}	

export function splitInArrayChecked(strin)
{
	return '' + strin.split(',').map((str) => {
		if (str[0] === "'") {
			if (str.endsWith("'")) {
				return str;
			}	

			return str.slice(1);
		}	
		else if (str.endsWith("'")) {
			return str.slice(0, str.length - 1);
		}	
		
		return `'${str}'`;
	});
}

export function splitAndTrim(strin, separator = ',')
{
	return strin.split(separator).map((str) => str.trim()).filter((str) => str.length > 0);
}	

export function arrayFilter(filtercb, array, startidx, endidx, maxrecs)
{
	const			narr = [];

	if (safetypeof(array) === 'array') {
		let		i = (startidx >= 0 ? startidx : 0), j = (endidx >= 0 && endidx <= array.length ? endidx : array.length);
		const		filt = (typeof filtercb === 'function' ? filtercb : null);

		for (; i < j; ++i) {
			if (filt && (true !== filt(array[i], i, array))) {
				continue;
			}	

			narr.push(array[i]);

			if (narr.length >= maxrecs) {
				break;
			}	
		}	
	}	

	return narr;
}	

// Input : 'test string' Output : 'Test string'
export function capitalFirstLetter(str)
{
	if (typeof str === 'string' && str.length > 0) {
		return str[0].toUpperCase() + str.slice(1);
	}	

	return str;
}

// If str.length >= maxlen will be truncated along with ..
export function strTruncateTo(str, maxlen, truncIndicator = '..')
{
	if (typeof str === 'string' && str.length >= maxlen) {
		return str.slice(0, maxlen) + truncIndicator;
	}

	return str;
}	

export function getRandomInt(min, max) 
{
	return Math.floor(Math.random() * (max - min + 1) ) + min;
}

export function getRandomFloat(min, max, ndecimal = 2) 
{
	let		num = Math.random() * (max - min + 1) + min;

	return num.toFixed(ndecimal);
}

export function gyMax(num1, num2)
{
	if (typeof num1 === 'number') {
		if (typeof num2 === 'number') {
			return num1 > num2 ? num1 : num2;
		}	
		else {
			return num1;
		}	
	}	
	else if (typeof num2 === 'number') {
		return num2;
	}	

	return Number.NaN;
}	

export function gyMin(num1, num2)
{
	if (typeof num1 === 'number') {
		if (typeof num2 === 'number') {
			return num1 < num2 ? num1 : num2;
		}	
		else {
			return num1;
		}	
	}	
	else if (typeof num2 === 'number') {
		return num2;
	}	

	return Number.NaN;
}	

// Returns a promise
export function delayExec(millisec) 
{
	return new Promise(resolve => setTimeout(resolve, millisec));
}

export function CreateLink(linktext, href, target = '_self', onclick = null)
{
	if (!onclick) return <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>{linktext}</a>;

	return <Button type='link' onClick={onclick}>{linktext}</Button>;
}	

export function CreateRectSvg(color, width = 7, height = 7)
{
	return <svg width={width + 1} height={height + 1}><rect width={width} height={height} style={{ fill: color }} /></svg>;
}	

export function CreateCircleSvg(color, radius = 4)
{
	return <svg width={(radius + 1) * 2} height={(radius + 1) * 2}><circle cx={radius + 1} cy={radius + 1} r={radius} style={{ fill: color }} /></svg>;
}	

// Lazily create content in a Link for a new Tab only if same tabkey not present
export function CreateLinkTab({buttontext, buttontype = 'dashed', title, contentCB, tabkey, addTabCB = globTabCBs.addTabCB})
{
	const modonclick = () => {

		const content = () => { 
			return (
				<>
				<ErrorBoundary>
				{contentCB()}
				</ErrorBoundary>
				</>
			);
		};

		addTabCB(title, content, tabkey);
	};	
	
	if (typeof contentCB === 'function' && typeof addTabCB === 'function') {
		return <Button type={buttontype} shape='round' onClick={modonclick} >{buttontext}</Button>;
	}

	return null;
}

// Lazily create content in a new tab only if same tabkey not present
export function CreateTab({title, contentCB, tabKey, addTabCB = globTabCBs.addTabCB})
{
	const content = () => { 
		return (
			<>
			<ErrorBoundary>
			{contentCB()}
			</ErrorBoundary>
			</>
		);
	};

	if (typeof contentCB === 'function' && typeof addTabCB === 'function') {
		addTabCB(title, content, tabKey);
	}

	return null;
}

export function ButtonModal({buttontext, buttontype, title, contentCB, width = '70%', maskClosable, isconfirm, okText = 'OK', okType = 'default', cancelType = 'default', ...props})
{

	const modonclick = () => {
		let			modal;

		if (isconfirm === true) {
			modal = Modal.confirm();
		}
		else {
			modal = Modal.info();
		}	

		modal.update({
			title : title ?? buttontext,
			content : typeof contentCB === 'function' ? contentCB(modal) : contentCB,

			width : width,
			closable : true,
			destroyOnClose : true,
			maskClosable : maskClosable,
			okText : okText,
			okType : okType,
			cancelType : isconfirm ? cancelType : undefined,
			okButtonProps : { shape: 'round', },
			cancelButtonProps : { shape: 'round', },
			...props,
		});
	};	
	
	return <Button type={buttontype} shape='round' onClick={modonclick} >{buttontext}</Button>;
}

// Number Input with Button 
export function NumButton({max, min, defaultValue, okText = 'Set Input', buttontype, onCB, ...props})
{
	const [currval, setval] = useState(defaultValue);

	const onset = () => {
		if (typeof onCB === 'function') {
			onCB(currval);
		}	
	};

	return (
		<>
		<div style={{ display: 'inline-flex', }} >
		<InputNumber {...props} min={min} max={max} defaultValue={defaultValue} value={currval} onChange={setval} />
		<Button type={buttontype} shape='round' onClick={onset} disabled={typeof currval !== 'number'}>{okText}</Button>
		</div>
		</>
	);	
}
	
// Sorts in-place
export function sortTimeArray(arr, field = 'time')
{
	const comparator = (a, b) => {
		if (a[field] < b[field]) {
			return -1;
		}
		if (a[field] > b[field]) {
			return 1;
		}
		return 0;			
	};	

	arr.sort(comparator);
}	

/*
 * Supports 3 level of objects : e.g.  { a : 1, o : { x : 1, y : { p : 1 } } }
 * Either of keyNames or fieldCols can be supplied to xlate the key to Desc. keyNames.key is needed.
 * xfrmDataCB if supplied must handle all value types including array and subobject, boolean.
 * ignoreKeyArr can be an Array of strings or regex
 */
export function JSONDescription({jsondata, titlestr, column = 2, keyNames, fieldCols, xfrmDataCB, spanCols = {}, ignoreKeyArr = [ 'rowid' ]})
{
	if (!jsondata) {
		return null;
	}	

	if (!Array.isArray(ignoreKeyArr)) {
		ignoreKeyArr = [];	
	}	

	const getKeyName = (key) => {
		if (keyNames && typeof keyNames[key] === 'string') {
			return keyNames[key];
		}	

		if (safetypeof(fieldCols) === 'array') {
			for (let obj of fieldCols) {
				if (safetypeof(obj) === 'object' && obj.field === key && obj.desc) {
					return obj.desc;
				}	
			}	
		}	

		return key;
	}	

	const printData = (key, value) => {
		if (typeof xfrmDataCB === 'function') {
			return xfrmDataCB(key, value, jsondata);
		}
		else {
			if (typeof value === 'object' || typeof value === 'boolean') {
				return JSON.stringify(value);
			}	
		}	
		
		return value;
	};	

	const isValidKey = (parentObj, key) => {
		if (parentObj.hasOwnProperty(key)) {
			for (let ikey of ignoreKeyArr) {
				if (typeof ikey === 'string') {
					if (key === ikey) {
						return false;
					}	
				}
				else if (typeof ikey === 'object') {
					if (true === ikey.test(key)) {
						return false;
					}	
				}	
			}	

			return true;
		}	

		return false;
	};

	const getarr = () => {
		const			descarr = [];

		for (let key in jsondata) {
			if (isValidKey(jsondata, key)) {
				if (safetypeof(jsondata[key]) === 'object') {
					const			jo = jsondata[key];

					for (let ikey in jo) {
						if (isValidKey(jo, ikey)) {
							if (safetypeof(jo[ikey]) === 'object') {
								const			o2 = jo[ikey];
								
								for (let i2key in o2) {
									if (isValidKey(o2, i2key)) {
										descarr.push(React.createElement(Descriptions.Item, 
												{ label: `${key}.${ikey}.${getKeyName(i2key)}`, key : `${key}.${ikey}.${i2key}`, span : spanCols[i2key], }, 
														printData(i2key, o2[i2key])));
									}
								}
							}
							else {
								descarr.push(React.createElement(Descriptions.Item, { label: `${key}.${getKeyName(ikey)}`, key : `${key}.${ikey}`, span : spanCols[ikey], }, 
										printData(ikey, jo[ikey])));
							}

						}
					}
				}
				else {
					descarr.push(React.createElement(Descriptions.Item, { label: getKeyName(key), key : key, span : spanCols[key] }, printData(key, jsondata[key])));
				}
			}
		}

		return descarr;
	};	

	return (
		<>
		<ErrorBoundary>
		<Descriptions title={titlestr} bordered={true} column={column} style={{ textAlign: 'center' }}>
			{getarr()}
		</Descriptions>
		</ErrorBoundary>			
		</>
	);	
}	

export function ButtonJSONDescribe({record, buttontext = 'View Complete Record Description', titlestr = 'Record', buttontype, column, keyNames, fieldCols, xfrmDataCB, ...props})
{
	return <ButtonModal buttontext={buttontext} buttontype={buttontype} title="Record JSON fields" maskClosable={true} 
				contentCB={() => <JSONDescription jsondata={record} titlestr={titlestr} column={column} keyNames={keyNames} fieldCols={fieldCols}
								xfrmDataCB={xfrmDataCB} {...props} />} />	
}	

export function onRowJSONDescribe({titlestr = 'Record', column, keyNames, fieldCols, xfrmDataCB, ...props})
{
	return (record, rowIndex) => {
		return {
			onClick: event => {
				Modal.info({
					title : <span><strong>Record {record.name} State</strong></span>,
					content : (
						<>
						<JSONDescription jsondata={record} titlestr={titlestr} column={column} keyNames={keyNames} fieldCols={fieldCols}
								xfrmDataCB={xfrmDataCB} {...props} />	
						</>
						),

					width : '90%',	
					closable : true,
					destroyOnClose : true,
					maskClosable : true,
					okButtonProps : { shape: 'round', },
					cancelButtonProps : { shape: 'round', },
				});
			}
		};		
	};
}					

export function LoadingAlert({message = "Fetching Data..."})
{
	return (
		<>
		<Spin spinning={true}>
			<Alert type="info" showIcon message={message} />
		</Spin>
		</>
	);
}	

/*
 * Takes in an array and returns an object or null on error. 
 * The same madhavaid can be repeated if called from mergeMultiFetchMadhava() below...
 */
export function mergeMultiMadhava(origdata, field)
{
	if (typeof field !== 'string') {
		throw new Error(`Invalid field type for merging Madhava data specified : ${typeof field}`);
	}

	if (Array.isArray(origdata) !== true) {
		return null;
	}	
	
	if (origdata.length === 0) {
		return null;
	}	
	
	if (origdata.length === 1) {
		if (!origdata[0][field]) {
			return null;
		}	
		return origdata[0];
	}	

	let		normdata = {}, rowid = 1;

	normdata[field] = [];
	
	if (origdata[1].madid && origdata[0].madid && origdata[0][field]) {
		// Need to preserve order for offset handling...
		origdata.sort((a, b) => a.madid.localeCompare(b.madid));
	}

	for (let elem of origdata) {
		if (elem[field]) {
			if (safetypeof(elem[field]) === 'array') {
				for (let obj of elem[field]) {
					if (safetypeof(obj) === 'object') {
						// Overwrite the rowid
						obj.rowid = rowid.toString();
						rowid++;
					}

					normdata[field].push(obj);
				}
			}	
			else {
				normdata[field].push(...elem[field]);
			}
		}	
	}

	return normdata;
}	

// Merge output of Multiple Fetches (Promise.all format)
export function mergeMultiFetchMadhava(origdata, field)
{
	if (typeof field !== 'string') {
		throw new Error(`Invalid field type for merging multiple fetch data specified : ${typeof field}`);
	}

	if (Array.isArray(origdata) !== true) {
		return null;
	}	
	
	if (origdata.length === 0) {
		return null;
	}	

	let			newarr = [];

	for (let arr of origdata) {
		if (Array.isArray(arr)) {
			newarr.push(...arr);
		}	
	}	

	return mergeMultiMadhava(newarr, field);
}	

// useEffect skipping initial mount callback
export function useDidMountEffect(func, deps = [])
{
	const didMount = useRef(false);

	useEffect(() => {
		if (didMount.current) {
			if (typeof func === 'function') {
				func();
			}
		}
		else {
			didMount.current = true;
		}	
	// eslint-disable-next-line	
	}, [func, ...deps]);
}


export function useDebounce(value, timeout)
{
	const [state, setState] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => setState(value), timeout);

		return () => clearTimeout(handler);
	}, [value, timeout]);

	return state;
}

export function useDebouncedEffect(callback, delay, deps = [], ignorefirst = false) 
{
	const firstUpdate = useRef(true);

	useEffect(() => {
		if (firstUpdate.current) {
			firstUpdate.current = false;

			if (ignorefirst) {
				return;
			}
		}
		const handler = setTimeout(() => {
			if (typeof callback === 'function') {
				callback();
			}
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	// eslint-disable-next-line	
	}, [callback, delay, ignorefirst, ...deps]);
}


export function useInterval(callback, delay) 
{
	const savedCallback = useRef();

	useEffect(() => {
		savedCallback.current = callback;
	});

	useEffect(() => {
		function tick() {
			if (savedCallback.current) {
				savedCallback.current();
			}
		}

		if (delay !== null) {
			let id = setInterval(tick, delay);
			return () => clearInterval(id);
		}
	}, [delay]);
}

export function combineChartDimensions(dimensions)
{
	const parsedDimensions = {
		...dimensions,
		marginTop: dimensions.marginTop || 10,
		marginRight: dimensions.marginRight || 10,
		marginBottom: dimensions.marginBottom || 40,
		marginLeft: dimensions.marginLeft || 75,
	};

	return {
		...parsedDimensions,
		
		boundedHeight: Math.max(parsedDimensions.height - parsedDimensions.marginTop - parsedDimensions.marginBottom, 0,),
		boundedWidth: Math.max(parsedDimensions.width - parsedDimensions.marginLeft - parsedDimensions.marginRight, 0,),
	};
}

export function useChartDimensions(passedSettings)
{
	const ref = useRef();
	const dimensions = combineChartDimensions(passedSettings);

	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);

	useEffect(() => {
		if (dimensions.width && dimensions.height)
			return [ref, dimensions];

		const element = ref.current;
		const resizeObserver = new ResizeObserver(
				entries => {
					if (!Array.isArray(entries)) return;
					if (!entries.length) return;

					const entry = entries[0];

					if (width !== entry.contentRect.width) setWidth(entry.contentRect.width);
					if (height !== entry.contentRect.height) setHeight(entry.contentRect.height);
				}
			);
		resizeObserver.observe(element);

		return () => resizeObserver.unobserve(element);
	}, [dimensions, height, width]);

	const newSettings = combineChartDimensions({
			...dimensions,
			width: dimensions.width || width,
			height: dimensions.height || height,
	});

	return [ref, newSettings];
}

export function getPointFromAngleAndDistance(angle, distance)
{
	return {
		x: Math.cos(angle * Math.PI / 180) * distance,
		y: Math.sin(angle * Math.PI / 180) * distance,
	};
}	

export function arrayShiftLeft(array, nshifts)
{
	const		narray_size = array.length;
	const		nshiftmin = nshifts > array.length ? array.length : nshifts;

	if (nshiftmin <= 0) {
		return;
	}

	for (let i = nshiftmin; i < narray_size; ++i) {
		array[i - nshiftmin] = array[i];
	}

	for (let i = 0; i < nshiftmin; ++i) {
		array.pop();
	}	
}	

export function fixedArrayAddItems(itemarray, fixedarray, fixedsize)
{
	let		nshifts = 0;
	
	if (false === Array.isArray(itemarray)) {
		throw new Error("Invalid data format for adding elements to Fixed Array");
	}	

	if (itemarray.length + fixedarray.length >= fixedsize) {
		nshifts = itemarray.length + fixedarray.length - fixedsize;
	}	

	arrayShiftLeft(fixedarray, nshifts);

	for (let i = 0; i < itemarray.length; ++i) {
		fixedarray.push(itemarray[i]);
	}
}	

// Simple Component which can be used to figure when sibling or children components mount and unmount
export function ComponentLife({stateCB})
{
	useEffect(() => {
		if (typeof stateCB === 'function') {
			stateCB(true);
		}

		return () => {
			if (typeof stateCB === 'function') {
				stateCB(false);
			}
		};	

	}, [stateCB]);

	return null;
}	

export function wrapImmutObject(data, lastObject = null)
{
	return {
		data 	: data,
		dummy1	: lastObject && lastObject.dummy1 ? lastObject.dummy1 + 1 : 1
	};	
}	

export function getErrorString(apidata)
{
	const 		type = safetypeof(apidata);

	if (type === 'array') {
		for (let i = 0; i < apidata.length; ++i) {
			if (apidata[i].error !== undefined && typeof apidata[i].errmsg === 'string') {
				return apidata[i].errmsg;
			}	
		}	
	}	
	else if (type === 'object' && apidata.error !== undefined && typeof apidata.errmsg === 'string') {
		return apidata.errmsg;
	}	
	else if (type === 'string') {
		return apidata;
	}	

	return JSON.stringify(apidata);
}	

// Like Promise.allSettled but output as in Promise.all but ignoring any errors
export function promiseAllErrorIgnored(promarr)
{
	return new Promise((resolve, reject) => {

		return Promise.allSettled(promarr)
			.then(data => {
				if (Array.isArray(data)) {
					let			resarr = [];
					
					for (let i = 0; i < data.length; ++i) {
						if (data[i].status === 'fulfilled') {
							resarr.push(data[i].value);
						}
					}

					resolve(resarr);
				}
				else {
					reject('Response Promise.allSettled did not return the data in the format needed');
				}	
			})
			.catch((error) => {
				reject(error); 
			});
	});	
}	

export function validateApi(apidata, desc = 'Server API')
{
	const 		type = safetypeof(apidata);

	if (type === 'array') {
		for (let i = 0; i < apidata.length; ++i) {
			if (apidata[i].error !== undefined && apidata[i].errmsg !== undefined) {
				throw new Error(`${desc} Error : ${apidata[i].errmsg}`);
			}	
		}	
	}	
	else if (type === 'object' && apidata.error !== undefined && apidata.errmsg !== undefined) {
		throw new Error(`${desc} Error : ${apidata.errmsg}`);
	}	
	else if (!apidata) {
		throw new Error(`${desc} : Null Data seen`);
	}

	return apidata;
}	

export async function fetchValidate({conf, validateCB = validateApi, desc = 'Server API', errorCB, ignerror})
{
	if (!conf) {
		if (!ignerror) {
			throw new Error(`Missing Axios Fetch config for ${desc}`);
		}

		return null;
	}	

	try {
		const			res = await axios(conf);
		
		if (typeof validateCB === 'function') {
			return validateCB(res.data, desc) ?? res.data;
		}	

		return res.data;
	}
	catch(e) {
		if (typeof errorCB === 'function') {
			return errorCB(e, desc) ?? null;
		}	

		console.log(`Exception caught while waiting for ${desc} fetch response : ${e}\n${e.stack}\n`);

		if (!ignerror) {
			throw e;
		}

		return null;
	}	
}	

const fetchReducer = (state, action) => 
{
	/*console.log(`fetch Reducer State '${action.type}' seen..`);*/

	switch (action.type) {

	case 'fetch_init':
		return { ...state, isloading: true, isapierror: false };

	case 'fetch_success':
		return { ...state, isloading: false, isapierror: false, data: action.payload, };

	case 'fetch_failure':
		return { ...state, isloading: false, isapierror: true, data: action.payload, };

	default:
		throw new Error('fetch Reducer state error');
	}
};

/*
 * Will call the fetch on every state setUrl call. i.e. no API caching.
 * Specify init_loading as false if initialdata already contains pre-fetched data to be displayed.
 */
export function useFetchApi(initAxiosConfig, initxfrmresp = null, initialdata = [], printstr = 'rest api call', init_loading = true)
{
	const [{config, xfrmresp}, setConfig] = useState({config : initAxiosConfig, xfrmresp : initxfrmresp});

	const [state, dispatch] = useReducer(fetchReducer, {
		isloading : init_loading === false && initialdata ? false : true,
		isapierror : false,
		data : (init_loading === false && initialdata && (typeof xfrmresp === 'function')) ? xfrmresp(initialdata) : initialdata,
	});

	useEffect(() => {
		let 			iscancelled = false;

		const fetchData = async () => {
			dispatch({ type : 'fetch_init' });

			try {
				let		tconfig = config;
				
				if (typeof tconfig === 'string') {
					tconfig = {
						url : config
					};	
				}

				/*console.log(`axios fetching started for ${JSON.stringify(tconfig)}`);*/

				let 		res = await axios(tconfig);

				if (typeof xfrmresp === 'function')  {
					res.data = await Promise.resolve(xfrmresp(res.data));		
				}	

				if (!iscancelled) {
					dispatch({ type : 'fetch_success', payload : res.data });
				}
			} 
			catch (error) {
				if (!iscancelled) {
					let		payload;

					if ((typeof(error.response?.data) === 'object') || (typeof(error.response?.data) === 'string')) {
						payload = getErrorString(error.response.data);
					}
					else if (error.message) {
						payload = error.message;
					}	
					else {
						payload = `Exception Caught while fetching data for ${printstr}`;
					}	

					console.log(`Exception seen while fetching data : ${payload}`);

					dispatch({ type : 'fetch_failure', payload : payload });
				}
			}
		};

		if (config) {
			fetchData();
		}

		return () => {
			iscancelled = true;
		};
	}, [config, xfrmresp, dispatch, printstr]);

	// {data, isloading, isapierror}, setConfig
	return [state, setConfig, dispatch];
}


