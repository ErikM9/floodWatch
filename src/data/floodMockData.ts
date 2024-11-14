const floodResponse = {
  '@context': 'https://environment.data.gov.uk/flood-monitoring/id/floods',
  meta: {
    publisher: 'Environment Agency',
    licence: 'Open Government Licence',
    documentation:
      'https://environment.data.gov.uk/flood-monitoring/doc/reference',
    version: '1.0',
    comment: 'This is mock data for flood alerts in England.',
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
        'Flooding is possible in the River Thames area. Take care and avoid low-lying roads and footpaths near rivers.',
      severity: 'Warning',
      severityLevel: 3,
      timeMessageChanged: '2024-11-14T08:30:00Z',
      timeRaised: '2024-11-14T07:00:00Z'
    },
    {
      '@id': 'floodItem-2',
      description: 'Flood warning for the River Severn area',
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
        'Flood warning in the River Severn area. Please avoid travel if possible.',
      severity: 'Severe Warning',
      severityLevel: 1,
      timeMessageChanged: '2024-11-14T09:00:00Z',
      timeRaised: '2024-11-14T08:00:00Z'
    }
  ]
};

const polygonResponse = {
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
        TA_NAME: 'Thames',
        DESCRIP: 'Flooding possible along River Thames',
        LA_NAME: 'Oxfordshire',
        PARENT: 'South East',
        QDIAL: '123456',
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
        TA_NAME: 'Severn',
        DESCRIP: 'Severe flood warning along River Severn',
        LA_NAME: 'Gloucestershire',
        PARENT: 'Midlands',
        QDIAL: '654321',
        RIVER_SEA: 'River Severn'
      }
    }
  ]
};
