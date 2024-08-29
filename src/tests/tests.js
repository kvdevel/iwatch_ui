import 			React from 'react';

import 			{NivoLine1} from './line1.js';
import 			{NivoTree1} from './tree1.js';
import 			{NivoBar1} from './bar1.js';
import 			{Card1} from './card1.js';

export function NivoTest()
{
	return (
		<>
		<div style={{ marginBottom : 50 }} >
		<Card1 />
		</div>

		<div style={{ display: 'flex', justifyContent: 'space-around', placeItems: 'center', flexWrap: 'wrap', borderBottom : '1px dotted #d9d9d9', borderRadius: 5, margin : 50, marginBottom : 100 }}>
			<div style={{ height: 400, width : 700 }}>
			<NivoLine1 />
			</div>

			<div style={{ height: 600, width : 800 }}>
			<NivoTree1 />
			</div>

			<div style={{ height: 600, width : 800 }}>
			<NivoBar1 />
			</div>
		</div>	

		</>
	);
}


