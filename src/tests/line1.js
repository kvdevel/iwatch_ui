
// install (please try to align the version of installed @nivo packages)
// yarn add @nivo/line
import { ResponsiveLine } from '@nivo/line'

import 	{bytesStrFormat} from '../components/util.js';

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

const data1 = [
    {
        "id": "BytesIn",
        "data": [
            {
                "x": "2024-08-11T19:51:00.000Z",
                "y": 2284
            },
            {
                "x": "2024-08-11T19:51:05.000Z",
                "y": 119
            },
            {
                "x": "2024-08-11T19:51:10.000Z",
                "y": 5988
            },
            {
                "x": "2024-08-11T19:51:15.000Z",
                "y": 0
            },
            {
                "x": "2024-08-11T19:51:20.000Z",
                "y": 5228
            },
            {
                "x": "2024-08-11T19:51:25.000Z",
                "y": 2544
            },
            {
                "x": "2024-08-11T19:51:30.000Z",
                "y": 0
            },
            {
                "x": "2024-08-11T19:51:35.000Z",
                "y": 421
            },
            {
                "x": "2024-08-11T19:51:40.000Z",
                "y": 3237
            },
            {
                "x": "2024-08-11T19:51:45.000Z",
                "y": 5184
            },
            {
                "x": "2024-08-11T19:51:50.000Z",
                "y": 119
            },
            {
                "x": "2024-08-11T19:51:55.000Z",
                "y": 1800
            },
            {
                "x": "2024-08-11T19:52:00.000Z",
                "y": 303
            },
            {
                "x": "2024-08-11T19:52:05.000Z",
                "y": 119
            },
            {
                "x": "2024-08-11T19:52:10.000Z",
                "y": 5947
            }
        ],
        "color": "hsl(11, 70%, 50%)"
    },
    {
        "id": "BytesOut",
        "data": [
            {
                "x": "2024-08-11T19:51:00.000Z",
                "y": 76
            },
            {
                "x": "2024-08-11T19:51:05.000Z",
                "y": 22
            },
            {
                "x": "2024-08-11T19:51:10.000Z",
                "y": 207
            },
            {
                "x": "2024-08-11T19:51:15.000Z",
                "y": 0
            },
            {
                "x": "2024-08-11T19:51:20.000Z",
                "y": 4309
            },
            {
                "x": "2024-08-11T19:51:25.000Z",
                "y": 106
            },
            {
                "x": "2024-08-11T19:51:30.000Z",
                "y": 0
            },
            {
                "x": "2024-08-11T19:51:35.000Z",
                "y": 44
            },
            {
                "x": "2024-08-11T19:51:40.000Z",
                "y": 106
            },
            {
                "x": "2024-08-11T19:51:45.000Z",
                "y": 161
            },
            {
                "x": "2024-08-11T19:51:50.000Z",
                "y": 22
            },
            {
                "x": "2024-08-11T19:51:55.000Z",
                "y": 105
            },
            {
                "x": "2024-08-11T19:52:00.000Z",
                "y": 22
            },
            {
                "x": "2024-08-11T19:52:05.000Z",
                "y": 22
            },
            {
                "x": "2024-08-11T19:52:10.000Z",
                "y": 207
            }
        ],
        "color": "hsl(11, 70%, 50%)"
    }
];

const data2 = [
	{
		"id": "japan",
			"color": "hsl(314, 70%, 50%)",
			"data": [
			{
				"x": "plane",
				"y": 16
			},
			{
				"x": "helicopter",
				"y": 284
			},
			{
				"x": "boat",
				"y": 293
			},
			{
				"x": "train",
				"y": 238
			},
			{
				"x": "subway",
				"y": 110
			},
			{
				"x": "bus",
				"y": 38
			},
			{
				"x": "car",
				"y": 236
			},
			{
				"x": "moto",
				"y": 93
			},
			{
				"x": "bicycle",
				"y": 103
			},
			{
				"x": "horse",
				"y": 87
			},
			{
				"x": "skateboard",
				"y": 144
			},
			{
				"x": "others",
				"y": 32
			}
		]
	},
	{
		"id": "france",
		"color": "hsl(220, 70%, 50%)",
		"data": [
		{
			"x": "plane",
			"y": 13
		},
		{
			"x": "helicopter",
			"y": 237
		},
		{
			"x": "boat",
			"y": 180
		},
		{
			"x": "train",
			"y": 254
		},
		{
			"x": "subway",
			"y": 210
		},
		{
			"x": "bus",
			"y": 97
		},
		{
			"x": "car",
			"y": 288
		},
		{
			"x": "moto",
			"y": 276
		},
		{
			"x": "bicycle",
			"y": 11
		},
		{
			"x": "horse",
			"y": 235
		},
		{
			"x": "skateboard",
			"y": 223
		},
		{
			"x": "others",
			"y": 241
		}
		]
	},
	{
		"id": "us",
		"color": "hsl(348, 70%, 50%)",
		"data": [
		{
			"x": "plane",
			"y": 86
		},
		{
			"x": "helicopter",
			"y": 126
		},
		{
			"x": "boat",
			"y": 215
		},
		{
			"x": "train",
			"y": 63
		},
		{
			"x": "subway",
			"y": 248
		},
		{
			"x": "bus",
			"y": 242
		},
		{
			"x": "car",
			"y": 57
		},
		{
			"x": "moto",
			"y": 134
		},
		{
			"x": "bicycle",
			"y": 162
		},
		{
			"x": "horse",
			"y": 232
		},
		{
			"x": "skateboard",
			"y": 38
		},
		{
			"x": "others",
			"y": 104
		}
		]
	},
	{
		"id": "germany",
		"color": "hsl(255, 70%, 50%)",
		"data": [
		{
			"x": "plane",
			"y": 5
		},
		{
			"x": "helicopter",
			"y": 221
		},
		{
			"x": "boat",
			"y": 258
		},
		{
			"x": "train",
			"y": 133
		},
		{
			"x": "subway",
			"y": 19
		},
		{
			"x": "bus",
			"y": 19
		},
		{
			"x": "car",
			"y": 227
		},
		{
			"x": "moto",
			"y": 279
		},
		{
			"x": "bicycle",
			"y": 188
		},
		{
			"x": "horse",
			"y": 12
		},
		{
			"x": "skateboard",
			"y": 231
		},
		{
			"x": "others",
			"y": 194
		}
		]
	},
	{
		"id": "norway",
		"color": "hsl(335, 70%, 50%)",
		"data": [
		{
			"x": "plane",
			"y": 72
		},
		{
			"x": "helicopter",
			"y": 252
		},
		{
			"x": "boat",
			"y": 146
		},
		{
			"x": "train",
			"y": 55
		},
		{
			"x": "subway",
			"y": 104
		},
		{
			"x": "bus",
			"y": 34
		},
		{
			"x": "car",
			"y": 112
		},
		{
			"x": "moto",
			"y": 107
		},
		{
			"x": "bicycle",
			"y": 265
		},
		{
			"x": "horse",
			"y": 134
		},
		{
			"x": "skateboard",
			"y": 60
		},
		{
			"x": "others",
			"y": 184
		}
		]
	}
];

// Refer to https://nivo.rocks/line/
const MyResponsiveLine = ({ data /* see data tab */ }) => (
    <ResponsiveLine
        data={data}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: true,
            reverse: false
        }}
        yFormat=" >-.2f"
        axisTop={null}
        axisRight={null}
        axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'transportation',
            legendOffset: 36,
            legendPosition: 'middle',
            truncateTickAt: 0
        }}
        axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'count',
            legendOffset: -40,
            legendPosition: 'middle',
            truncateTickAt: 0
        }}
        pointSize={10}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabel="data.yFormatted"
        pointLabelYOffset={-12}
	onClick = {(point, e) => console.log(JSON.stringify(point))}
        enableTouchCrosshair={false}
	enableArea={true}
        useMesh={true}
        legends={[
            {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
		toggleSerie: true,
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
)


export function NivoLine1()
{
		return <ResponsiveLine
			data={data1}
			margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
			xScale={{ 
				type: 'time', 
				format: '%Y-%m-%dT%H:%M:%S.%LZ',
				useUTC: false,
			}}
			yScale={{
			    type: 'linear',
			    min: 'auto',
			    max: 'auto',
			    stacked: true,
			    reverse: false
			}}
			xFormat="time:%Y-%m-%dT%H:%M:%S.%LZ"
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
				tickValues: 'every 30 seconds',
			}}
			axisLeft={{
			    tickSize: 5,
			    tickPadding: 5,
			    tickRotation: 0,
			    legend: 'Bytes In/Out',
			    legendOffset: -40,
			    legendPosition: 'middle',
			    truncateTickAt: 0
			}}
			pointSize={10}
			pointColor={{ theme: 'background' }}
			pointBorderWidth={2}
			pointBorderColor={{ from: 'serieColor' }}
			pointLabel="data.yFormatted"
			pointLabelYOffset={-12}
			onClick = {(point, e) => console.log(JSON.stringify(point))}
			enableTouchCrosshair={false}
			useMesh={true}
			legends={[
			    {
				anchor: 'bottom-right',
				direction: 'column',
				justify: false,
				translateX: 100,
				translateY: 0,
				itemsSpacing: 0,
				itemDirection: 'left-to-right',
				itemWidth: 80,
				itemHeight: 20,
				itemOpacity: 0.75,
				symbolSize: 12,
				symbolShape: 'circle',
				symbolBorderColor: 'rgba(0, 0, 0, .5)',
				// toggleSerie: true,
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
	
	// return <MyResponsiveLine data={data2} />;
}	

