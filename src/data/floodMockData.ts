// // mockData.ts

// export const floodResponse = {
//   '@context': 'https://environment.data.gov.uk/flood-monitoring/id/floods',
//   meta: {
//     /* meta data */
//   },
//   items: [
//     {
//       '@id': 'floodItem-1',
//       description: 'Flood alert for the River Thames area',
//       eaAreaName: 'Thames',
//       eaRegionName: 'South East',
//       floodArea: {
//         '@id': 'floodArea-1',
//         county: 'Oxfordshire',
//         notation: '034WAFSDER',
//         polygon:
//           'MULTIPOLYGON (((-1.5 51.8, -1.3 51.7, -1.2 51.8, -1.5 51.8)))',
//         riverOrSea: 'River Thames'
//       },
//       floodAreaID: '034WAFSDER',
//       isTidal: false,
//       message: 'Flooding is possible in the River Thames area.',
//       severity: 'Warning',
//       severityLevel: 3,
//       timeMessageChanged: '2024-11-14T08:30:00Z',
//       timeRaised: '2024-11-14T07:00:00Z'
//     }
//   ]
// };

// export const polygonResponse = {
//   type: 'FeatureCollection',
//   features: [
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'MultiPolygon',
//         coordinates: [
//           [
//             [
//               [-1.5, 51.8],
//               [-1.3, 51.7],
//               [-1.2, 51.8],
//               [-1.5, 51.8]
//             ]
//           ]
//         ]
//       },
//       properties: {
//         AREA: 'River Thames Area',
//         FWS_TACODE: '034WAFSDER',
//         DESCRIP: 'Flooding possible along River Thames',
//         TA_NAME: 'Thames',
//         LA_NAME: 'Oxfordshire',
//         RIVER_SEA: 'River Thames'
//       }
//     }
//   ]
// };

export const floodResponse = {
  '@context': 'https://environment.data.gov.uk/flood-monitoring/id/floods',
  meta: {
    publisher: 'Environment Agency',
    licence: 'Open Government Licence',
    documentation:
      'https://environment.data.gov.uk/flood-monitoring/doc/reference',
    version: '1.0',
    comment: 'Mock data for flood alerts in England',
    hasFormat: ['application/json', 'application/xml']
  },
  items: [
    {
      '@id': 'floodItem-1',
      description: 'Flood alert for the River Thames area',
      eaAreaName: 'Thames',
      eaRegionName: 'South East',
      floodArea: {
        '@id': 'floodArea-1',
        county: 'Oxfordshire',
        notation: '034WAFSDER',
        polygon:
          'MULTIPOLYGON (((-1.5 51.8, -1.3 51.7, -1.2 51.8, -1.5 51.8)))',
        riverOrSea: 'River Thames'
      },
      floodAreaID: '034WAFSDER',
      isTidal: false,
      message:
        'Flooding is possible in the River Thames area. Avoid low-lying roads and footpaths near rivers.',
      severity: 'Warning',
      severityLevel: 3,
      timeMessageChanged: '2024-11-14T08:30:00Z',
      timeRaised: '2024-11-14T07:00:00Z'
    },
    {
      '@id': 'floodItem-2',
      description: 'Flood alert for the River Severn area',
      eaAreaName: 'Severn',
      eaRegionName: 'Midlands',
      floodArea: {
        '@id': 'floodArea-2',
        county: 'Gloucestershire',
        notation: '023WAERAGT',
        polygon:
          'MULTIPOLYGON (((-2.2 52.0, -2.1 51.9, -2.0 52.1, -2.2 52.0)))',
        riverOrSea: 'River Severn'
      },
      floodAreaID: '023WAERAGT',
      isTidal: true,
      message:
        'Flooding is possible in the River Severn area. Avoid travel if possible.',
      severity: 'Severe Warning',
      severityLevel: 1,
      timeMessageChanged: '2024-11-14T09:00:00Z',
      timeRaised: '2024-11-14T08:00:00Z'
    },
    {
      '@id': 'floodItem-3',
      description: 'Flood alert for the River Trent area',
      eaAreaName: 'Trent',
      eaRegionName: 'East Midlands',
      floodArea: {
        '@id': 'floodArea-3',
        county: 'Nottinghamshire',
        notation: '045WAFTREN',
        polygon:
          'MULTIPOLYGON (((-1.2 53.0, -1.0 52.9, -1.1 53.1, -1.2 53.0)))',
        riverOrSea: 'River Trent'
      },
      floodAreaID: '045WAFTREN',
      isTidal: false,
      message: 'Flooding is possible in the River Trent area. Stay vigilant.',
      severity: 'Warning',
      severityLevel: 2,
      timeMessageChanged: '2024-11-14T10:00:00Z',
      timeRaised: '2024-11-14T09:30:00Z'
    },
    {
      '@id': 'floodItem-4',
      description: 'Flood alert for the River Eden area',
      eaAreaName: 'Eden',
      eaRegionName: 'North West',
      floodArea: {
        '@id': 'floodArea-4',
        county: 'Cumbria',
        notation: '056WAEDEN',
        polygon:
          'MULTIPOLYGON (((-2.8 54.7, -2.7 54.6, -2.6 54.7, -2.8 54.7)))',
        riverOrSea: 'River Eden'
      },
      floodAreaID: '056WAEDEN',
      isTidal: false,
      message:
        'Flooding is possible in the River Eden area. Keep away from riverbanks.',
      severity: 'Warning',
      severityLevel: 3,
      timeMessageChanged: '2024-11-14T11:00:00Z',
      timeRaised: '2024-11-14T10:30:00Z'
    }
  ]
};

export const polygonResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-1.5, 51.8],
              [-1.3, 51.7],
              [-1.2, 51.8],
              [-1.5, 51.8]
            ]
          ]
        ]
      },
      properties: {
        AREA: 'River Thames Area',
        FWS_TACODE: '034WAFSDER',
        DESCRIP: 'Flooding possible along River Thames',
        TA_NAME: 'Thames',
        LA_NAME: 'Oxfordshire',
        RIVER_SEA: 'River Thames'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-2.2, 52.0],
              [-2.1, 51.9],
              [-2.0, 52.1],
              [-2.2, 52.0]
            ]
          ]
        ]
      },
      properties: {
        AREA: 'River Severn Area',
        FWS_TACODE: '023WAERAGT',
        DESCRIP: 'Flooding possible along River Severn',
        TA_NAME: 'Severn',
        LA_NAME: 'Gloucestershire',
        RIVER_SEA: 'River Severn'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-1.2, 53.0],
              [-1.0, 52.9],
              [-1.1, 53.1],
              [-1.2, 53.0]
            ]
          ]
        ]
      },
      properties: {
        AREA: 'River Trent Area',
        FWS_TACODE: '045WAFTREN',
        DESCRIP: 'Flooding possible along River Trent',
        TA_NAME: 'Trent',
        LA_NAME: 'Nottinghamshire',
        RIVER_SEA: 'River Trent'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-2.8, 54.7],
              [-2.7, 54.6],
              [-2.6, 54.7],
              [-2.8, 54.7]
            ]
          ]
        ]
      },
      properties: {
        AREA: 'River Eden Area',
        FWS_TACODE: '056WAEDEN',
        DESCRIP: 'Flooding possible along River Eden',
        TA_NAME: 'Eden',
        LA_NAME: 'Cumbria',
        RIVER_SEA: 'River Eden'
      }
    }
  ]
};
