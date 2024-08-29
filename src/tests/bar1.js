
import { ResponsiveBar } from '@nivo/bar'
import 	{format} from "d3-format";

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

const webdata = [
  {
    "country": "AD",
    "hot dog": 108,
    "hot dogColor": "hsl(327, 70%, 50%)",
    "burger": 163,
    "burgerColor": "hsl(183, 70%, 50%)",
    "sandwich": 145,
    "sandwichColor": "hsl(355, 70%, 50%)",
    "kebab": 92,
    "kebabColor": "hsl(145, 70%, 50%)",
    "fries": 158,
    "friesColor": "hsl(350, 70%, 50%)",
    "donut": 147,
    "donutColor": "hsl(236, 70%, 50%)"
  },
  {
    "country": "AE",
    "hot dog": 1,
    "hot dogColor": "hsl(20, 70%, 50%)",
    "burger": 64,
    "burgerColor": "hsl(356, 70%, 50%)",
    "sandwich": 86,
    "sandwichColor": "hsl(61, 70%, 50%)",
    "kebab": 145,
    "kebabColor": "hsl(47, 70%, 50%)",
    "fries": 52,
    "friesColor": "hsl(265, 70%, 50%)",
    "donut": 3,
    "donutColor": "hsl(275, 70%, 50%)"
  },
  {
    "country": "AF",
    "hot dog": 14,
    "hot dogColor": "hsl(165, 70%, 50%)",
    "burger": 64,
    "burgerColor": "hsl(242, 70%, 50%)",
    "sandwich": 54,
    "sandwichColor": "hsl(80, 70%, 50%)",
    "kebab": 33,
    "kebabColor": "hsl(139, 70%, 50%)",
    "fries": 18,
    "friesColor": "hsl(218, 70%, 50%)",
    "donut": 93,
    "donutColor": "hsl(135, 70%, 50%)"
  },
  {
    "country": "AG",
    "hot dog": 197,
    "hot dogColor": "hsl(268, 70%, 50%)",
    "burger": 46,
    "burgerColor": "hsl(86, 70%, 50%)",
    "sandwich": 85,
    "sandwichColor": "hsl(151, 70%, 50%)",
    "kebab": 62,
    "kebabColor": "hsl(271, 70%, 50%)",
    "fries": 189,
    "friesColor": "hsl(50, 70%, 50%)",
    "donut": 140,
    "donutColor": "hsl(6, 70%, 50%)"
  },
  {
    "country": "AI",
    "hot dog": 45,
    "hot dogColor": "hsl(316, 70%, 50%)",
    "burger": 94,
    "burgerColor": "hsl(280, 70%, 50%)",
    "sandwich": 10,
    "sandwichColor": "hsl(127, 70%, 50%)",
    "kebab": 43,
    "kebabColor": "hsl(358, 70%, 50%)",
    "fries": 44,
    "friesColor": "hsl(340, 70%, 50%)",
    "donut": 96,
    "donutColor": "hsl(217, 70%, 50%)"
  },
  {
    "country": "AL",
    "hot dog": 175,
    "hot dogColor": "hsl(42, 70%, 50%)",
    "burger": 152,
    "burgerColor": "hsl(281, 70%, 50%)",
    "sandwich": 33,
    "sandwichColor": "hsl(199, 70%, 50%)",
    "kebab": 110,
    "kebabColor": "hsl(231, 70%, 50%)",
    "fries": 139,
    "friesColor": "hsl(128, 70%, 50%)",
    "donut": 120,
    "donutColor": "hsl(176, 70%, 50%)"
  },
  {
    "country": "AM",
    "hot dog": 48,
    "hot dogColor": "hsl(55, 70%, 50%)",
    "burger": 149,
    "burgerColor": "hsl(333, 70%, 50%)",
    "sandwich": 63,
    "sandwichColor": "hsl(274, 70%, 50%)",
    "kebab": 37,
    "kebabColor": "hsl(275, 70%, 50%)",
    "fries": 160,
    "friesColor": "hsl(356, 70%, 50%)",
    "donut": 138,
    "donutColor": "hsl(312, 70%, 50%)"
  }
];

const MyResponsiveBar = ({ data /* see data tab */ }) => (
    <ResponsiveBar
        data={data}
        keys={[
            'hot dog',
            'burger',
            'sandwich',
            'kebab',
            'fries',
            'donut'
        ]}
        indexBy="country"
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        innerPadding={2}
        groupMode="grouped"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={{ scheme: 'nivo' }}
        defs={[
            {
                id: 'dots',
                type: 'patternDots',
                background: 'inherit',
                color: '#38bcb2',
                size: 4,
                padding: 1,
                stagger: true
            },
            {
                id: 'lines',
                type: 'patternLines',
                background: 'inherit',
                color: '#eed312',
                rotation: -45,
                lineWidth: 6,
                spacing: 10
            }
        ]}
        fill={[
            {
                match: {
                    id: 'fries'
                },
                id: 'dots'
            },
            {
                match: {
                    id: 'sandwich'
                },
                id: 'lines'
            }
        ]}
        borderRadius={4}
        borderColor={{
            from: 'color',
            modifiers: [
                [
                    'darker',
                    1.6
                ]
            ]
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'country',
            legendPosition: 'middle',
            legendOffset: 32,
            truncateTickAt: 0
        }}
        axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'food',
            legendPosition: 'middle',
            legendOffset: -40,
            truncateTickAt: 0
        }}
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
)

const data1 = {
    "0": {
        "data": {
            "lt300us": 11234455,
            "lt1ms": 0,
            "lt10ms": 14,
            "lt50ms": 4,
            "lt250ms": 0,
            "lt1s": 0,
            "gte1s": 0,
            "resp_lt300us": 79,
            "resp_lt1ms": 0,
            "resp_lt10ms": 75244,
            "resp_lt50ms": 78703,
            "resp_lt250ms": 0,
            "resp_lt1s": 0,
            "resp_gte1s": 0,
            "qps": 0,
            "errors": 0,
            "logins": 13,
            "bytesin": 2043,
            "bytesout": 5523,
            "avgrespt": 5311.241,
            "avg99respt": 5311
        }
    },
    "-1": {
        "data": {
            "lt300us": 7234556,
            "lt1ms": 5,
            "lt10ms": 18,
            "lt50ms": 4,
            "lt250ms": 2,
            "lt1s": 0,
            "gte1s": 0,
            "resp_lt300us": 101,
            "resp_lt1ms": 3723,
            "resp_lt10ms": 69893,
            "resp_lt50ms": 83006,
            "resp_lt250ms": 305597,
            "resp_lt1s": 251799,
            "resp_gte1s": 149828,
            "qps": 0,
            "errors": 0,
            "logins": 0,
            "bytesin": 18765,
            "bytesout": 4167,
            "avgrespt": 23998.527,
            "avg99respt": 23998
        }
    },
    "1": {
        "data": {
            "lt300us": 3,
            "lt1ms": 0,
            "lt10ms": 14,
            "lt50ms": 5,
            "lt250ms": 9,
            "lt1s": 1,
            "gte1s": 1,
            "resp_lt300us": 118,
            "resp_lt1ms": 0,
            "resp_lt10ms": 63186,
            "resp_lt50ms": 124384,
            "resp_lt250ms": 1203718,
            "resp_lt1s": 437197,
            "resp_gte1s": 1048799,
            "qps": 0,
            "errors": 0,
            "logins": 0,
            "bytesin": 30246,
            "bytesout": 6827,
            "avgrespt": 87194,
            "avg99respt": 87194
        }
    },
    "7": {
        "data": {
            "lt300us": 0,
            "lt1ms": 0,
            "lt10ms": 0,
            "lt50ms": 0,
            "lt250ms": 0,
            "lt1s": 0,
            "gte1s": 0,
            "resp_lt300us": 0,
            "resp_lt1ms": 0,
            "resp_lt10ms": 0,
            "resp_lt50ms": 0,
            "resp_lt250ms": 0,
            "resp_lt1s": 0,
            "resp_gte1s": 0,
            "qps": 0,
            "errors": 0,
            "logins": 0,
            "bytesin": 0,
            "bytesout": 0,
            "avgrespt": 0,
            "avg99respt": 0
        }
    }
};

function getBarData(odata, type)
{
	if (!odata || !odata["0"] || !odata["1"] || !odata["7"] || !odata["-1"]) return null;

	if (!type || type === "resp") return [
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

	return {
		"Last 1 min" 	: odata["0"].data[type],
		"Baseline" 	: odata["-1"].data[type],
		"Yesterday"	: odata["1"].data[type],
		"Last Week"	: odata["7"].data[type],
	};

}	

export function NivoBar1()
{
	const respdata = getBarData(data1, "resp");

	return  <ResponsiveBar
        data={respdata}
        keys={[
            'Last 1 min',
            'Baseline',
            'Yesterday',
            'Last Week',
        ]}
        indexBy="slot"
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        innerPadding={3}
        groupMode="grouped"
        valueScale={{ type: 'symlog' }}
        indexScale={{ type: 'band', round: true }}
        colors={{ scheme: 'accent' }}
        borderRadius={4}
        borderColor={{
            from: 'color',
            modifiers: [
                [
                    'darker',
                    1.6
                ]
            ]
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Query Distribution by Response Slots',
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


	// return <MyResponsiveBar data={webdata} />;
}

