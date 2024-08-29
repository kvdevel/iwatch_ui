
// install (please try to align the version of installed @nivo packages)
// yarn add @nivo/tree
import { ResponsiveTree } from '@nivo/tree'

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
const MyResponsiveTree = ({ data /* see data tab */ }) => (
    <ResponsiveTree
        data={data}
        identity="name"
        nodeSize={7}
        activeNodeSize={10}
        inactiveNodeSize={12}
        nodeColor={{ scheme: 'tableau10' }}
        fixNodeColorAtDepth={1}
        linkThickness={2}
        activeLinkThickness={8}
        inactiveLinkThickness={2}
        linkColor={{
            from: 'target.color',
            modifiers: [
                [
                    'opacity',
                    0.4
                ]
            ]
        }}
        margin={{ top: 90, right: 90, bottom: 90, left: 90 }}
        motionConfig="stiff"
        meshDetectionRadius={80}
        highlightDescendantNodes={true}
        highlightDescendantLinks={true}
    />
)

const data = {
  "name": "nivo",
  "color": "hsl(155, 70%, 50%)",
  "children": [
    {
      "name": "viz",
      "color": "hsl(231, 70%, 50%)",
      "children": [
        {
          "name": "stack",
          "color": "hsl(344, 70%, 50%)",
          "children": [
            {
              "name": "cchart",
              "color": "hsl(10, 70%, 50%)",
              "loc": 53778
            },
            {
              "name": "xAxis",
              "color": "hsl(275, 70%, 50%)",
              "loc": 138591
            },
            {
              "name": "yAxis",
              "color": "hsl(326, 70%, 50%)",
              "loc": 10975
            },
            {
              "name": "layers",
              "color": "hsl(139, 70%, 50%)",
              "loc": 183536
            }
          ]
        },
        {
          "name": "ppie",
          "color": "hsl(154, 70%, 50%)",
          "children": [
            {
              "name": "chart",
              "color": "hsl(186, 70%, 50%)",
              "children": [
                {
                  "name": "pie",
                  "color": "hsl(185, 70%, 50%)",
                  "children": [
                    {
                      "name": "outline",
                      "color": "hsl(280, 70%, 50%)",
                      "loc": 190413
                    },
                    {
                      "name": "slices",
                      "color": "hsl(341, 70%, 50%)",
                      "loc": 100249
                    },
                    {
                      "name": "bbox",
                      "color": "hsl(141, 70%, 50%)",
                      "loc": 56188
                    }
                  ]
                },
                {
                  "name": "donut",
                  "color": "hsl(251, 70%, 50%)",
                  "loc": 92815
                },
                {
                  "name": "gauge",
                  "color": "hsl(50, 70%, 50%)",
                  "loc": 171759
                }
              ]
            },
            {
              "name": "legends",
              "color": "hsl(227, 70%, 50%)",
              "loc": 116175
            }
          ]
        }
      ]
    },
    {
      "name": "colors",
      "color": "hsl(174, 70%, 50%)",
      "children": [
        {
          "name": "rgb",
          "color": "hsl(162, 70%, 50%)",
          "loc": 142327
        },
        {
          "name": "hsl",
          "color": "hsl(73, 70%, 50%)",
          "loc": 130629
        }
      ]
    },
    {
      "name": "utils",
      "color": "hsl(171, 70%, 50%)",
      "children": [
        {
          "name": "randomize",
          "color": "hsl(132, 70%, 50%)",
          "loc": 169641
        },
        {
          "name": "resetClock",
          "color": "hsl(186, 70%, 50%)",
          "loc": 138806
        },
        {
          "name": "noop",
          "color": "hsl(234, 70%, 50%)",
          "loc": 40328
        },
        {
          "name": "tick",
          "color": "hsl(155, 70%, 50%)",
          "loc": 53095
        },
        {
          "name": "forceGC",
          "color": "hsl(348, 70%, 50%)",
          "loc": 51725
        },
        {
          "name": "stackTrace",
          "color": "hsl(83, 70%, 50%)",
          "loc": 38822
        },
        {
          "name": "dbg",
          "color": "hsl(16, 70%, 50%)",
          "loc": 39199
        }
      ]
    },
    {
      "name": "generators",
      "color": "hsl(231, 70%, 50%)",
      "children": [
        {
          "name": "address",
          "color": "hsl(30, 70%, 50%)",
          "loc": 188385
        },
        {
          "name": "city",
          "color": "hsl(165, 70%, 50%)",
          "loc": 9901
        },
        {
          "name": "animal",
          "color": "hsl(192, 70%, 50%)",
          "loc": 150265
        },
        {
          "name": "movie",
          "color": "hsl(336, 70%, 50%)",
          "loc": 6449
        },
        {
          "name": "user",
          "color": "hsl(161, 70%, 50%)",
          "loc": 128866
        }
      ]
    },
    {
      "name": "set",
      "color": "hsl(113, 70%, 50%)",
      "children": [
        {
          "name": "clone",
          "color": "hsl(312, 70%, 50%)",
          "loc": 154314
        },
        {
          "name": "intersect",
          "color": "hsl(168, 70%, 50%)",
          "loc": 165714
        },
        {
          "name": "merge",
          "color": "hsl(170, 70%, 50%)",
          "loc": 140343
        },
        {
          "name": "reverse",
          "color": "hsl(302, 70%, 50%)",
          "loc": 3106
        },
        {
          "name": "toArray",
          "color": "hsl(230, 70%, 50%)",
          "loc": 40806
        },
        {
          "name": "toObject",
          "color": "hsl(140, 70%, 50%)",
          "loc": 137926
        },
        {
          "name": "fromCSV",
          "color": "hsl(29, 70%, 50%)",
          "loc": 165810
        },
        {
          "name": "slice",
          "color": "hsl(9, 70%, 50%)",
          "loc": 143345
        },
        {
          "name": "append",
          "color": "hsl(296, 70%, 50%)",
          "loc": 129541
        },
        {
          "name": "prepend",
          "color": "hsl(239, 70%, 50%)",
          "loc": 60491
        },
        {
          "name": "shuffle",
          "color": "hsl(2, 70%, 50%)",
          "loc": 132070
        },
        {
          "name": "pick",
          "color": "hsl(272, 70%, 50%)",
          "loc": 120655
        },
        {
          "name": "plouc",
          "color": "hsl(71, 70%, 50%)",
          "loc": 95922
        }
      ]
    },
    {
      "name": "text",
      "color": "hsl(27, 70%, 50%)",
      "children": [
        {
          "name": "trim",
          "color": "hsl(155, 70%, 50%)",
          "loc": 141631
        },
        {
          "name": "slugify",
          "color": "hsl(34, 70%, 50%)",
          "loc": 7284
        },
        {
          "name": "snakeCase",
          "color": "hsl(261, 70%, 50%)",
          "loc": 175188
        },
        {
          "name": "camelCase",
          "color": "hsl(36, 70%, 50%)",
          "loc": 176410
        },
        {
          "name": "repeat",
          "color": "hsl(65, 70%, 50%)",
          "loc": 191282
        },
        {
          "name": "padLeft",
          "color": "hsl(176, 70%, 50%)",
          "loc": 175966
        },
        {
          "name": "padRight",
          "color": "hsl(214, 70%, 50%)",
          "loc": 56826
        },
        {
          "name": "sanitize",
          "color": "hsl(33, 70%, 50%)",
          "loc": 199490
        },
        {
          "name": "ploucify",
          "color": "hsl(26, 70%, 50%)",
          "loc": 113043
        }
      ]
    },
    {
      "name": "misc",
      "color": "hsl(338, 70%, 50%)",
      "children": [
        {
          "name": "greetings",
          "color": "hsl(75, 70%, 50%)",
          "children": [
            {
              "name": "hey",
              "color": "hsl(143, 70%, 50%)",
              "loc": 180010
            },
            {
              "name": "HOWDY",
              "color": "hsl(89, 70%, 50%)",
              "loc": 192712
            },
            {
              "name": "aloha",
              "color": "hsl(252, 70%, 50%)",
              "loc": 173100
            },
            {
              "name": "AHOY",
              "color": "hsl(22, 70%, 50%)",
              "loc": 106808
            }
          ]
        },
        {
          "name": "other",
          "color": "hsl(75, 70%, 50%)",
          "loc": 104289
        },
        {
          "name": "path",
          "color": "hsl(2, 70%, 50%)",
          "children": [
            {
              "name": "pathA",
              "color": "hsl(70, 70%, 50%)",
              "loc": 10134
            },
            {
              "name": "pathB",
              "color": "hsl(93, 70%, 50%)",
              "children": [
                {
                  "name": "pathB1",
                  "color": "hsl(305, 70%, 50%)",
                  "loc": 85251
                },
                {
                  "name": "pathB2",
                  "color": "hsl(169, 70%, 50%)",
                  "loc": 186787
                },
                {
                  "name": "pathB3",
                  "color": "hsl(48, 70%, 50%)",
                  "loc": 150515
                },
                {
                  "name": "pathB4",
                  "color": "hsl(156, 70%, 50%)",
                  "loc": 52946
                }
              ]
            },
            {
              "name": "pathC",
              "color": "hsl(260, 70%, 50%)",
              "children": [
                {
                  "name": "pathC1",
                  "color": "hsl(36, 70%, 50%)",
                  "loc": 136762
                },
                {
                  "name": "pathC2",
                  "color": "hsl(286, 70%, 50%)",
                  "loc": 119536
                },
                {
                  "name": "pathC3",
                  "color": "hsl(53, 70%, 50%)",
                  "loc": 71661
                },
                {
                  "name": "pathC4",
                  "color": "hsl(75, 70%, 50%)",
                  "loc": 148561
                },
                {
                  "name": "pathC5",
                  "color": "hsl(314, 70%, 50%)",
                  "loc": 12642
                },
                {
                  "name": "pathC6",
                  "color": "hsl(238, 70%, 50%)",
                  "loc": 62289
                },
                {
                  "name": "pathC7",
                  "color": "hsl(89, 70%, 50%)",
                  "loc": 68504
                },
                {
                  "name": "pathC8",
                  "color": "hsl(105, 70%, 50%)",
                  "loc": 188709
                },
                {
                  "name": "pathC9",
                  "color": "hsl(211, 70%, 50%)",
                  "loc": 88221
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};


export function NivoTree1()
{
	return <MyResponsiveTree data={data} />;
}	

