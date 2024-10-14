// import React, { useEffect } from 'react';
// import { useEffect } from 'react';
// import { fetchFloodWarnings } from '../api/testApi'; // Adjust the path as necessary

// const FloodWarningsLogger: React.FC = () => {
//   useEffect(() => {
//     const getFloodWarnings = async () => {
//       const data = await fetchFloodWarnings();
//       console.log('Flood Warnings with Polygons:', data);
//     };

//     getFloodWarnings();
//   }, []);

//   return null; // This component doesn't render anything in the UI
// };

// export default FloodWarningsLogger;




import "../global.css";
import { Mail } from 'lucide-react';
import logoImage from './../public/logo.png'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { userAddress } from '../api/geocoding';
import { LatLngTuple } from 'leaflet';
import { useEffect, useState } from 'react';
import UkMap from '../app-components/Map';
import { formatPolygonData, getAndLogFloodData, logPolygonsFromFloodWarnings } from '../services/FloodDataService'
const formSchema = z.object({
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
})



const Options = () => {
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });

  // TODO this is for testing purpose only. Change location later.
  // getAndLogFloodData((floodData) => {
  //   console.log('flood data from option page', floodData)
  // })
  // logPolygonsFromFloodWarnings()
  // checkIfUserIsFlooded()


  // Call flood-related functions only once when the component mounts
  useEffect(() => {
    getAndLogFloodData((floodData) => {
      console.log('flood data from option page', floodData);
    });

    logPolygonsFromFloodWarnings();
    formatPolygonData();
  }, []); // Empty dependency array to ensure this runs only once on mount

  useEffect(() => {
    const loadSavedLocation = async () => {
      let savedLocation: LatLngTuple | null = null;

      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          const result = await chrome.storage.local.get(['userLocation']);
          savedLocation = result.userLocation;
        } catch (error) {
          console.error('Error loading saved location from Chrome storage:', error);
        }
      } else {
        const localStorageLocation = localStorage.getItem('userLocation');
        if (localStorageLocation) {
          savedLocation = JSON.parse(localStorageLocation);
        }
      }

      if (savedLocation) {
        console.log('Loaded saved location:', savedLocation);
        setUserLocation(savedLocation);
      }
    };

    loadSavedLocation();
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('Form data:', data);
    const location = await userAddress(data.address);

    if (location) {
      const newLocation: LatLngTuple = [location.latitude, location.longitude]
      console.log(`Latitude: ${location.latitude}, Longitude: ${location.longitude}`)
      setUserLocation(newLocation);

      chrome.storage.local.set({ userLocation: newLocation }, () => {
        console.log('location saved to chrome storage');
      })
    } else {
      console.log('Geocoding failed or no results found');
    }
  };

  return (

    <div>
      <header className='flex flex-row justify-between px-10 pt-2 mb-14 bg-white drop-shadow-xl'>

        <div className='flex flex-row'>
          <div>
            <img src={logoImage} className="size-20" alt="FloodWatch icon" />
          </div>
          <div className='flex justify-center items-center'>
            <h4 className='text-xl font-bold text-blue-700 px-3'>FloodWatch</h4>
          </div>
        </div>
        <ul className='flex justify-center items-center'>
          <li className='pt-2'>
            <Mail
              size={35}
              className='cursor-pointer'
            />
          </li>
        </ul>
      </header>
      <section className='mx-16'>
        <div>
          <UkMap userLocation={userLocation} />
        </div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your address" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter your address to locate yourself on the map.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </div>
      </section>

    </div >

  );
};

export default Options;