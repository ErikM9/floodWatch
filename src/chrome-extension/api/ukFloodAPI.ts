import { handlePolygonData } from '../utils/polygonhandler';

const FLOOD_API_URL =
  'https://environment.data.gov.uk/flood-monitoring/id/floods';

interface FloodArea {
  county: string;
  polygon: string;
  riverOrSea: string;
}

interface FloodItem {
  description: string;
  eaAreaName: string;
  floodArea: FloodArea;
  isTidal: boolean;
  message: string;
  severity: string;
  severityLevel: number;
}

interface FloodApiResponse {
  items: FloodItem[];
}

async function fetchPolygonData(polygonUrl: string): Promise<any | null> {
  try {
    const response = await fetch(polygonUrl);
    if (!response.ok) {
      throw new Error(`Error fetching data from: ${polygonUrl}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

export default async function fetchFloodData() {
  try {
    const floodResponse = await fetch(FLOOD_API_URL);
    if (!floodResponse.ok) {
      throw new Error('Error fetching flood data');
    }

    const data: FloodApiResponse = await floodResponse.json();
    const floodDescriptions = data.items.map((item) => item.description);
    const floodAreaNames = data.items.map((item) => item.eaAreaName);

    const polygons = await Promise.all(
      data.items.map(async (item) => {
        const polygonData = await fetchPolygonData(item.floodArea.polygon);
        return handlePolygonData(polygonData);
      })
    );

    console.log('flood description:', floodDescriptions);
    console.log('flood area name:', floodAreaNames);

    // polygons.map(polygon => {
    //   polygon.map(p => {
    //     console.log("polygon coordinates:", p.coordinates)
    //   })
    // })

    return polygons;
  } catch (error) {
    console.error('Error fetching flood data:', error);
    return [];
  }
}
