
import 			{ useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';

import			{Typography, Space, PageHeader, Tabs, Alert, Modal, Menu, notification, Cascader} from 'antd';
import			{UnorderedListOutlined, AreaChartOutlined, DashboardOutlined, BarChartOutlined, SearchOutlined,
			GlobalOutlined, ConsoleSqlOutlined, TableOutlined, UserOutlined, LaptopOutlined, CodeOutlined,
			WarningOutlined, DatabaseOutlined, DiffOutlined} from '@ant-design/icons';

import 			{useSearchParams} from 'react-router-dom';
import 			moment from 'moment';
import 			axios from 'axios';

import 			{atom, useRecoilState, useSetRecoilState, useRecoilValue} from 'recoil';
import 			equal from 'fast-deep-equal/es6/react';

import 			{safetypeof,} from './components/util.js';
import			{globCompBgColor, globTabCBs} from './App.js';

import 			{Dashboard, GlobalDashboard} from './dashboard.js';
import 			{IntradayDashboard} from './intraday.js';
import			{UniqsqlSummaryMenuPage, AppSummaryMenuPage, LoginSummaryMenuPage, DBSummaryMenuPage, IPSummaryMenuPage, ErrorSummaryMenuPage} from './summaries.js';


const {ErrorBoundary} = Alert;
const {Title} = Typography;
const {TabPane} = Tabs;
const {SubMenu} = Menu;

export const 		dashboardKey = 'dashboardKey', globalDashKey = 'globalDashKey', intradayKey = 'intradayKey', 
			usqlSummKey = 'usqlSummKey', appSummKey = 'appSummKey', loginSummKey = 'loginSummKey', dbSummKey = 'dbSummKey', 
			clientipSummKey = 'clientipSummKey', errorSummKey = 'errorSummKey', operTableSummKey = 'operTableSummKey', 
			compUsqlSummKey = 'compUsqlSummKey', compAppSummKey = 'compAppSummKey', compLoginSummKey = 'compLoginSummKey', 
			compDbSummKey = 'compDbSummKey', compClientIpSummKey = 'compClientIpSummKey', compErrorSummKey = 'compErrorSummKey',
			searchKey = 'searchKey', loginKey = 'loginKey';

export const serverAppStateAtom = atom({
	key		: 	'serverAppStateAtom',
	default 	: 	{
					servname	:	'',
					appname		:	'',
					servernameoff	:	0,
					appserveroff	:	0,
				},	
});

export const serverAppListAtom = atom({
	key		:	'serverAppListAtom',
	default		:	[],
});	

function getServerAppNamesFromStats(sdata)
{
	const			ndata = [];

	if (sdata.length === 0 || (safetypeof(sdata[0]) !== 'object') || (safetypeof(sdata[0].appservers) !== 'array')) {		
		return ndata;
	}	
	
	for (let i = 0; i < sdata.length; ++i) {
		const			s = sdata[i];

		const n = {
			value		: s.servername,
			label		: s.servername,
			children	: [],
		};
		
		for (let j = 0; j < s.appservers.length; ++j) {
			const			a = s.appservers[j];

			n.children.push({ value : a.appname, label : a.appname });
		}	

		ndata.push(n);
	}
	
	return ndata;
}

function checkServerAppChanges({serverAppList, currServerAppList, servname, appname, setServerAppState, setServerAppList})
{
	if (equal(serverAppList, currServerAppList)) {
		return;
	}

	setServerAppList(serverAppList);

	let			chgserver = true, chgapp = true;

oloop :	
	for (let i = 0; i < serverAppList.length; ++i) {
		if (servname === serverAppList[i].value) {
			chgserver = false;

			for (let j = 0; j < serverAppList[i].children.length; ++j) {
				if (appname === serverAppList[i].children[j].value) {
					chgapp = false;
					break oloop;
				}	
			}	
		}	
	}	

	if (chgserver === true || chgapp === true) {
		let			firstserv = '', firstapp = '';

		if (serverAppList[0]) {
			firstserv = serverAppList[0].value;
			
			if (serverAppList[0].children[0]) {
				firstapp = serverAppList[0].children[0].value;
			}	
		}	

		setServerAppState({ servname : firstserv, appname : firstapp, servernameoff : 0, appserveroff : 0});
	}
}

function ServerAppnameSelector()
{
	const			[globServerAppState, setServerAppState] = useRecoilState(serverAppStateAtom);
	const			globServerAppList = useRecoilValue(serverAppListAtom);

	const			{servname, appname} = globServerAppState;

	let			value;

	if (servname && appname) {
		value = [servname, appname];
	}

	const onChange = useCallback((value) => {
		const			{oldservername, oldappname} = globServerAppState;
		
		if (safetypeof(value) !== 'array' || value.length !== 2) {
			console.log('Invalid Value seen from Server Appname Select', value);
			return;
		}
		
		if (value[0] === oldservername && value[1] === oldappname) {
			return;
		}

		for (let i = 0; i < globServerAppList.length; ++i) {
			if (value[0] === globServerAppList[i].value) {
				for (let j = 0; j < globServerAppList[i].children.length; ++j) {
					if (value[1] === globServerAppList[i].children[j].value) {
						
						const newobj = { servname : value[0], appname : value[1], servernameoff : i, appserveroff : j };

						setServerAppState(newobj);
						
						console.log(`New Server/Appname set : ${JSON.stringify(newobj)}`);
						return;
					}	
				}	
			}	
		}	

		console.log('Invalid Value seen from Server Appname Select as no matching server or appname found', value);
		
	}, [globServerAppState, setServerAppState, globServerAppList,]);	

	const dropdownRender = useCallback(menus => (
		<div style={{ background: '#decaca' }}>
			{menus}
		</div>	
	), []);

	return (
		<span style={{ paddingLeft : 10}}>{' Server/Appname '} &nbsp; 
			<Cascader options={globServerAppList} onChange={onChange} value={value} multiple={false} allowClear={false} dropdownRender={dropdownRender} 
					status={!value ? "error" : undefined} placeholder={!value ? "No Capture Server/Appnames seen" : undefined} />
		</span>
	);
}


export function TabHandler({startTabKey = dashboardKey})
{
	const 			[searchParams, /* setSearchParams */] = useSearchParams();
	const			objref = useRef();
	
	const			[globServerAppState, setServerAppState] = useRecoilState(serverAppStateAtom);
	const			[globServerAppList, setServerAppList] = useRecoilState(serverAppListAtom);

	const 			[activekey, setActiveKey] = useState('');
	const 			[, forceUpdate] = useReducer(x => x + 1, 0);

	const			{servname, appname, servernameoff, appserveroff} = globServerAppState;

	if (!objref.current) {
		objref.current 		= {
			panearr		: [],
			timeoutobj	: {},
			activekey 	: '',
			prevtabkey	: '',
			tabwidth	: window.innerWidth > 600 ? window.innerWidth * 0.95 : 600,
			firstTab	: true,
			tmodal		: null,
			servname	: '',
			appname		: '',
		};
	}

	const taddTabCB = useCallback((title, content, key, closable = (key !== loginKey)) => {

		if (objref.current.activekey === loginKey) {
			return false;
		}

		for (let i = 0; i < objref.current.panearr.length; ++i) {
			let 		pane = objref.current.panearr[i];

			if (pane.key === key) {
				Modal.destroyAll();

				if (objref.current.activekey !== key) {
					objref.current.activekey = key;
	
					setActiveKey(key);
				}
				
				return false;
			}	
		}

		Modal.destroyAll();

		objref.current.tabwidth = (window.innerWidth > 600 ? window.innerWidth * 0.95 : 600);

		let			tab;

		try {
			tab = {
				title : typeof title !== 'function' ? title : title(), 
				content : typeof content !== 'function' ? content : content(),
				key, 
				closable
			};
		}
		catch(e) {
			let		emsg;

			console.log(`Exception seen while creating new tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

			if (e.response && e.response.data) {
				emsg = e.response.data;
			}	
			else if (e.message) {
				emsg = e.message;
			}	
			else {
				emsg = 'Exception Caught while creating new tab content';
			}	

			notification.error({message : "Tab Content", description : `Exception during Tab Content creation : ${emsg}`});
			return;
		}	

		objref.current.panearr.push(tab);

		objref.current.prevtabkey = objref.current.activekey;
		objref.current.activekey = key;

		setActiveKey(key);

		return true;
	}, [objref]);	
	
	// Specify timeoutms to have the tab close after those many msec
	const tremTabCB = useCallback((key, timeoutms) => {
		
		let		newactiveid = 0, newactivekey, i, found;
		
		if (objref.current.panearr.length <= 1) {
			return;
		}	

		for (i = 0; i < objref.current.panearr.length; ++i) {
			let 		pane = objref.current.panearr[i];

			if (pane.key === key) {
				found = true;
				newactiveid = i > 0 ? i - 1 : 1;
				break;
			}	
		}

		if (timeoutms > 0 && found) {
			if (objref.current.timeoutobj[key] === undefined) {

				objref.current.timeoutobj[key] = setTimeout(() => {
					try {
						delete objref.current.timeoutobj[key];
						globTabCBs.remTabCB(key);
					}
					catch(e) {
					}	
				}, timeoutms);	
			}

			return;
		}	

		if (objref.current.timeoutobj[key]) {
			clearTimeout(objref.current.timeoutobj[key]);
			delete objref.current.timeoutobj[key];
		}	
		
		newactivekey = objref.current.panearr[newactiveid].key;

		const panes = objref.current.panearr.filter(pane => pane.key !== key);
		objref.current.panearr = panes;

		if (objref.current.prevtabkey && objref.current.prevtabkey !== key) {
			for (i = 0; i < objref.current.panearr.length; ++i) {
				let 		pane = objref.current.panearr[i];

				if (pane.key === objref.current.prevtabkey) {
					newactiveid = i;
					newactivekey = objref.current.prevtabkey;
					
					objref.current.prevtabkey = '';
					break;
				}	
			}
		}

		if (objref.current.activekey === newactivekey) {
			forceUpdate();
		}	
		else {
			objref.current.activekey = newactivekey;
			setActiveKey(objref.current.activekey);
		}	

	}, [objref]);	

	const tisActiveTabCB = useCallback((key) => {
		return objref.current.activekey === key;
	}, [objref]);	

	if (globTabCBs.addTabCB !== taddTabCB || globTabCBs.remTabCB !== tremTabCB || globTabCBs.isActiveTabCB !== tisActiveTabCB) {
		globTabCBs.addTabCB 		= taddTabCB;
		globTabCBs.remTabCB		= tremTabCB;
		globTabCBs.isActiveTabCB	= tisActiveTabCB;
	}	

	useEffect(() => {

		const fetchData = () => {
			axios.get(`/getAppServerStats?cacheBrk=${Date.now()}`).then(({data}) => {
				if (data && safetypeof(data) === 'object' && data.servers) {

					checkServerAppChanges({ serverAppList : getServerAppNamesFromStats(data.servers), currServerAppList : globServerAppList, 
									servname : globServerAppState.servname, appname : globServerAppState.appname,
									setServerAppState, setServerAppList });
					return;
				}	

				console.log('Invalid appstats data format received : ', JSON.stringify(data));
			})
			.catch(console.log);
		};

		fetchData();

		let inter = setInterval(fetchData, 30000);

		return () => clearInterval(inter);

	}, [globServerAppState, globServerAppList, setServerAppState, setServerAppList]);	
	
	useEffect(() => {
		
		objref.current.servname = servname;
		objref.current.appname = appname;

	}, [servname, appname, objref]);	

	const onTabChange = useCallback((activekey) => {
		/*console.log(`onTabChange called : New activekey = ${activekey}`);*/

		if (objref.current.activekey === loginKey) {
			return;
		}

		objref.current.prevtabkey = objref.current.activekey;
		objref.current.activekey = activekey;

		setActiveKey(activekey);

	}, [objref]);

	const onTabEdit = useCallback((targetKey, action) => {
		/*console.log(`onTabEdit called for targetKey ${targetKey} and action '${action}'`);*/

		if (action === 'remove') {
			globTabCBs.remTabCB(targetKey);
		}	
	}, []);	

	const closeModalCB = useCallback((isClosing = true) => {
		if (objref.current.tmodal) {
			// console.log('Closing Tab List Modal...');

			if (!isClosing) {
				objref.current.tmodal.destroy();
			}

			objref.current.tmodal = null;
		}	
	}, [objref])	

	const onMenuClick = useCallback((e, filterobj, name) => {

		switch (e.key) {
		
		case dashboardKey :
			
			try {

				const		tabKey = dashboardKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<Dashboard tabKey={dashboardKey} />
					</ErrorBoundary>
					</>
				);	
				
				globTabCBs.addTabCB('Dashboard', dash, tabKey);
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding Dashboard tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding Dashboard';
				}	

				notification.error({message : "Dashboard", description : `Exception during Dashboard tab creation : ${emsg}`});
			}	
			break;

		case intradayKey :
			
			try {

				const		tabKey = intradayKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<IntradayDashboard autoRefresh={true} tabKey={intradayKey} />
					</ErrorBoundary>
					</>
				);	
				
				if (objref.current.servname && objref.current.appname) {
					globTabCBs.addTabCB('Intraday', dash, tabKey);
				}
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding Intraday tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding Intraday';
				}	

				notification.error({message : "Intraday", description : `Exception during Intraday tab creation : ${emsg}`});
			}	
			break;

		case globalDashKey :
			
			try {

				const		tabKey = globalDashKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<GlobalDashboard tabKey={globalDashKey} />
					</ErrorBoundary>
					</>
				);	
				
				globTabCBs.addTabCB('Global Dashboard', dash, tabKey);
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding Global Dashboard tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding Global Dashboard';
				}	

				notification.error({message : "Global Dashboard", description : `Exception during Global Dashboard tab creation : ${emsg}`});
			}	
			break;

		case usqlSummKey :
			
			try {

				const		tabKey = usqlSummKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<UniqsqlSummaryMenuPage tabKey={usqlSummKey} />
					</ErrorBoundary>
					</>
				);	
				
				globTabCBs.addTabCB('Uniqsql Summary', dash, tabKey);
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding Uniqsql Summary tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding Uniqsql Summary';
				}	

				notification.error({message : "Uniqsql Summary", description : `Exception during Uniqsql Summary tab creation : ${emsg}`});
			}	
			break;
			
		case appSummKey :
			
			try {

				const		tabKey = appSummKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<AppSummaryMenuPage tabKey={appSummKey} />
					</ErrorBoundary>
					</>
				);	
				
				globTabCBs.addTabCB('App Summary', dash, tabKey);
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding App Summary tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding App Summary';
				}	

				notification.error({message : "App Summary", description : `Exception during App Summary tab creation : ${emsg}`});
			}	
			break;
			
		case loginSummKey :
			
			try {

				const		tabKey = loginSummKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<LoginSummaryMenuPage tabKey={loginSummKey} />
					</ErrorBoundary>
					</>
				);	
				
				globTabCBs.addTabCB('Login Summary', dash, tabKey);
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding Login Summary tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding Login Summary';
				}	

				notification.error({message : "Login Summary", description : `Exception during Login Summary tab creation : ${emsg}`});
			}	
			break;
			
		case dbSummKey :
			
			try {

				const		tabKey = dbSummKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<DBSummaryMenuPage tabKey={dbSummKey} />
					</ErrorBoundary>
					</>
				);	
				
				globTabCBs.addTabCB('DB Summary', dash, tabKey);
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding DB Summary tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding DB Summary';
				}	

				notification.error({message : "DB Summary", description : `Exception during DB Summary tab creation : ${emsg}`});
			}	
			break;
			
		case clientipSummKey :
			
			try {

				const		tabKey = clientipSummKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<IPSummaryMenuPage tabKey={clientipSummKey} />
					</ErrorBoundary>
					</>
				);	
				
				globTabCBs.addTabCB('ClientIP Summary', dash, tabKey);
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding Client IP Summary tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding ClientIP Summary';
				}	

				notification.error({message : "Client IP Summary", description : `Exception during Client IP Summary tab creation : ${emsg}`});
			}	
			break;
			
		case errorSummKey :
			
			try {

				const		tabKey = errorSummKey;

				const		dash = () => (
					<>
					<ErrorBoundary>
					<ErrorSummaryMenuPage tabKey={errorSummKey} />
					</ErrorBoundary>
					</>
				);	
				
				globTabCBs.addTabCB('Error Summary', dash, tabKey);
			}
			catch(e) {
				let		emsg;

				console.log(`Exception seen while adding Error Summary tab : ${e.response ? JSON.stringify(e.response.data) : e.message}`);

				if (e.response && e.response.data) {
					emsg = e.response.data;
				}	
				else if (e.message) {
					emsg = e.message;
				}	
				else {
					emsg = 'Exception Caught while adding Error Summary';
				}	

				notification.error({message : "Error Summary", description : `Exception during Error Summary tab creation : ${emsg}`});
			}	
			break;
			
	
		default :
			break;
			
		}			

	}, [objref]);	


	useEffect(() => {
		console.log(`Starting First Tab content...`);

		let			startKey = startTabKey, filterobj;

		if (objref.current.firstTab) {
			objref.current.firstTab = false;

			filterobj = {};

			const		pstarttime 	= searchParams.get('starttime')
			const		pendtime 	= searchParams.get('endtime')
			const		pfilter  	= searchParams.get('filter')
			

			if (pstarttime) {
				filterobj.starttime = pstarttime;
			}	

			if (pendtime) {
				filterobj.endtime = pendtime;
			}	

			if (pfilter) {
				filterobj.filter = pfilter;
			}	
		}

		switch (startKey) {

		case dashboardKey : 
		case globalDashKey :
		case usqlSummKey : 
		case appSummKey : 
		case loginSummKey : 
		case dbSummKey : 
		case clientipSummKey : 
		case errorSummKey : 
		case searchKey :
		case loginKey :
			break;

		default :
			startKey = dashboardKey;
			break;
		}	
		
		onMenuClick({ key : startKey }, filterobj);

	}, [objref, onTabChange, onMenuClick, startTabKey, searchParams]);	

	const pgMenu = useMemo(() => {

		const menuitems = [
			{
				label 	: <ServerAppnameSelector />,
				key 	: 'servappsel',
			},
			{
				label 	: 'Dashboards',
				key	: 'DashboardsMenu',
				icon	: <AreaChartOutlined />,
				children : [
					{
						label	:	'DB Specific Dashboard',
						key	:	dashboardKey,
						icon	:	<DashboardOutlined />,
					},
					{
						label	:	'Intraday per Minute',
						key	:	intradayKey,
						icon	:	<BarChartOutlined />,
					},
					{
						label	:	'Global Dashboard',
						key	:	globalDashKey,
						icon	:	<GlobalOutlined />,
					},
				],
			},
			{
				label 	: 'Summaries',
				key 	: 'SummariesMenu',
				icon	: <TableOutlined />,
				children : [
					{
						label	: 'Unique SQL Summary',
						key	: usqlSummKey,
						icon	: <ConsoleSqlOutlined />,
					},
					{
						label	: 'Application Summary',
						key	: appSummKey,
						icon	: <CodeOutlined />,
					},					
					{
						label	: 'Login Summary',
						key	: loginSummKey,
						icon	: <UserOutlined />,
					},					
					{
						label	: 'Error Summary',
						key	: errorSummKey,
						icon	: <WarningOutlined />,
					},					
					{
						label	: 'DB Summary',
						key	: dbSummKey,
						icon	: <DatabaseOutlined />,
					},					
					{
						label	: 'Client IP Summary',
						key	: clientipSummKey,
						icon	: <LaptopOutlined />,
					},
					{
						label	: 'Operation & Table Summary',
						key	: operTableSummKey,
						icon	: <TableOutlined />,
					},
					{
						label	: 'Compare Summaries',
						key	: 'compareSummMenu',
						icon	: <DiffOutlined />,
						children : [
							{
								label	: 'Unique SQLs',
								key	: compUsqlSummKey,
								icon	: <ConsoleSqlOutlined />,
							},	
							{
								label	: 'Applications',
								key	: compAppSummKey,
								icon	: <CodeOutlined />,
							},					
							{
								label	: 'Logins',
								key	: compLoginSummKey,
								icon	: <UserOutlined />,
							},					
							{
								label	: 'Errors',
								key	: compErrorSummKey,
								icon	: <WarningOutlined />,
							},					
							{
								label	: 'DBs',
								key	: compDbSummKey,
								icon	: <DatabaseOutlined />,
							},					
							{
								label	: 'Client IPs',
								key	: compClientIpSummKey,
								icon	: <LaptopOutlined />,
							},
						],
					},
				],
			},
			{
				label 	: 'Search',
				key 	: searchKey,
				icon	: <SearchOutlined />,
			},
		];

		return (
			<PageHeader backIcon={false} ghost={false} 
				title={<span style={{ fontSize : 18, color : '#834545' }}><em>iWatch</em></span>} 
				avatar={{ src: '/iwatch.png', size : 'medium' }} 
				>

				<>
				<div style={{ marginLeft : 20, marginBottom : 15, marginRight : 10 }} >

				<Menu onClick={onMenuClick} mode="horizontal" style={{ background: '#f1d4b0a3'}} items={menuitems} theme='light' />

				</div>
				</>
			</PageHeader>
		);
	}, [onMenuClick]);	
	
	return (
		<>
		<div style={{ marginLeft : 10, marginTop : 10, marginRight : 10, marginBottom : 20, width: objref.current.tabwidth + 10 }} >

		{pgMenu}
			
		<div>

		<Tabs hideAdd onChange={onTabChange} activeKey={activekey} type="editable-card" onEdit={onTabEdit} 
			tabBarStyle={{ width: objref.current.tabwidth - 80, marginLeft : 50, paddingLeft : 10, background: globCompBgColor  }} >
			
			{objref.current.panearr.map(pane => (
				<TabPane tab={pane.title} key={pane.key} closable={pane.closable}> 
					<>
						<div style={{ padding: 10, marginBottom : 10, width: objref.current.tabwidth, minHeight : 700, margin : 'auto' }} >
						{pane.content} 
						</div>
					</>
				</TabPane>
			))}
		</Tabs>

		</div>

		</div>

		</>
	);


}

