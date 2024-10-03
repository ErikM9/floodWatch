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
import { userAddress } from '@/chrome-extension/api/geocoding';
import UkMap from '@/chrome-extension/app-components/Map';
import { LatLngTuple } from 'leaflet';
import { useEffect, useState } from 'react';

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
      // Ensure latitude and longitude are parsed as numbers
      const userLocation = {
        lat: Number(location.latitude), // Convert to number using Number()
        lon: Number(location.longitude), // Convert to number using Number()
      };

      console.log(`Latitude: ${userLocation.lat}, Longitude: ${userLocation.lon}`);
      setUserLocation([userLocation.lat, userLocation.lon]); // Set state for the map

      // Save the user location as an object in Chrome storage
      chrome.storage.local.set({ userLocation }, () => {
        console.log('Location saved to Chrome storage:', userLocation);
      });

      // Optionally, you can check for floods here if you want to trigger it immediately after form submission
      chrome.runtime.sendMessage({ type: 'userLocation', ...userLocation }); // Send location to background
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
