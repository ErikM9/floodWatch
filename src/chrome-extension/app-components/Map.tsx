// import React from "react";
// import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
import { Icon, LatLngTuple } from "leaflet";
import { MapUpdater } from "./MapUpdater"

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import fetchFloodData from '../api/ukFloodAPI';
import { processPolygons } from '../utils/polygonhandler';

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    AREA: string;
    TA_NAME: string;
    DESCRIP: string;
    LA_NAME: string;
    RIVER_SEA: string;
  };
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface MapProps {
  userLocation: LatLngTuple | null;
}

// const UkMap = () => {
const UkMap: React.FC<MapProps> = ({ userLocation }) => {
  const ukCenter: LatLngTuple = [54.00, -2.00];
  const center = userLocation || ukCenter;
  const zoom = userLocation ? 13 : 5.4;

  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);



  useEffect(() => {
    const loadPolygons = async () => {
      try {
        const polygonData = await fetchFloodData();
        // console.log("Raw flood data:", JSON.stringify(polygonData, null, 2));

        const geoJson = processPolygons(polygonData);

        // const geoJson: GeoJSONFeatureCollection = {

        //   type: "FeatureCollection",
        //   features: polygonData.map((polygon: any, polygonIndex: number) => {
        //     console.log(`Processing polygon ${polygonIndex}:`, JSON.stringify(polygon, null, 2));

        //     return {
        //       type: "Feature",
        //       geometry: {
        //         type: "MultiPolygon",
        //         coordinates: polygon.map((p: any, pIndex: number) => {
        //           console.log(`Processing p ${pIndex} in polygon ${polygonIndex}:`, JSON.stringify(p, null, 2));

        //           if (!p.coordinates) {
        //             console.error(`Missing coordinates in p ${pIndex} of polygon ${polygonIndex}`);
        //             return [];
        //           }


        //           const validCoords = p.coordinates.map((coordSet: any, coordSetIndex: number) => {
        //             console.log(` ${coordSetIndex} in p ${pIndex} of polygon ${polygonIndex}:`, JSON.stringify(coordSet, null, 2));


        //             const coords = Array.isArray(coordSet[0]) ? coordSet[0] : coordSet;


        //             return coords.filter((point: any) => {
        //               return Array.isArray(point) && point.length === 2 && !isNaN(point[0]) && !isNaN(point[1]);
        //             });
        //           });
        //           console.log('Coordinates should be in [lon, lat]:', validCoords)
        //           return validCoords;
        //         }),
        //       },
        //       properties: {
        //         AREA: polygon[0]?.AREA || "",
        //         TA_NAME: polygon[0]?.TA_NAME || "",
        //         DESCRIP: polygon[0]?.DESCRIP || "",
        //         LA_NAME: polygon[0]?.LA_NAME || "",
        //         RIVER_SEA: polygon[0]?.RIVER_SEA || "",
        //       }
        //     };
        //   })
        // };

        // console.log("Processed GeoJSON data:", JSON.stringify(geoJson, null, 2));
        setGeoJsonData(geoJson);

      } catch (error) {
        console.error('Error fetching or processing polygon data:', error);
      }
    };

    loadPolygons();
  }, []);

  //   return (
  //     <MapContainer center={[51.6, -1.1]} zoom={10} style={{ height: "400px", width: "100%" }} >
  //       <TileLayer
  //         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  //         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  //       />
  //       {
  //         geoJsonData && (
  //           <GeoJSON data={geoJsonData} style={{ color: 'blue', weight: 2 }} />
  //         )
  //       }
  //     </MapContainer >
  //   );
  // }




  const customIcon = new Icon({

    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "50vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {
        geoJsonData && (
          <GeoJSON data={geoJsonData} style={{ color: 'blue', weight: 2 }} />
        )
      }

      <MapUpdater center={center} zoom={zoom} />
      {userLocation && (
        <Marker position={userLocation} icon={customIcon}>
          <Popup>Your location</Popup>
        </Marker>
      )
      }
    </MapContainer >
  );
};

// export default Map;

export default UkMap;
