

import 			React from 'react';
import 			{Routes, Route} from "react-router-dom";
import 			'antd/dist/antd.min.css'
import 			'./App.less';
import 			{Alert} from 'antd';
import 			{RecoilRoot} from 'recoil';

import 			{TabHandler, dashboardKey, globalDashKey, searchKey, loginKey} from './tabHandler.js';
import 			{NivoTest} from './tests/tests.js';

const 			{ErrorBoundary} = Alert;

export			let globCompBgColor = '#e9e4bc73', globBgColor = '#ededed00' ;
export 			const globTabCBs = { addTabCB : null, remTabCB : null, isActiveTabCB : null, };	


function App()
{
	return (
		<ErrorBoundary>
		<RecoilRoot>
		
		<Routes>
			<Route path="/" element={<TabHandler />} />
			<Route path="/dashboard" element={<TabHandler startTabKey={dashboardKey} />} />
			<Route path="/globaldash" element={<TabHandler startTabKey={globalDashKey} />} />
			<Route path="/search" element={<TabHandler startTabKey={searchKey} />} />
			<Route path="/login" element={<TabHandler startTabKey={loginKey} />} />

			<Route path="/test" element={<NivoTest />} />

			<Route path="*" element={<TabHandler />} />
		</Routes>		

		</RecoilRoot>
		</ErrorBoundary>	
	);
}

export default App;


