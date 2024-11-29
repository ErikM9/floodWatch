import '../global.css';
import { Mail } from 'lucide-react';
import logoImage from './../public/logo.svg';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { userAddress } from '../api/geocoding';
import { LatLngTuple } from 'leaflet';
import { useEffect, useState } from 'react';
import UkMap from '../app-components/Map';
import { optionMessage } from '@/types/alertMessage';

const formSchema = z.object({
  address: z.string().min(5, {
    message: 'Address must be at least 5 characters.'
  })
});

const Options = () => {
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [alertData, setAlertData] = useState<optionMessage | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: ''
    }
  });

  useEffect(() => {
    const loadSavedLocation = async () => {
      let savedLocation: LatLngTuple | null = null;

      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          const result = await chrome.storage.local.get(['userLocation']);
          savedLocation = result.userLocation;
        } catch (error) {
          console.error(
            'Error loading saved location from Chrome storage:',
            error
          );
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

  useEffect(() => {
    chrome.storage.local.get(['lastSentAlert'], (result) => {
      setAlertData(result.lastSentAlert ?? null);
      console.log('lastSentAlert from option', result.lastSentAlert);
    });
  }, []);

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      namespace: string
    ) => {
      if (namespace === 'local' && changes.lastSentAlert) {
        setAlertData(changes.lastSentAlert.newValue ?? null);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('Form data:', data);
    const location = await userAddress(data.address);

    if (location) {
      const newLocation: LatLngTuple = [location.latitude, location.longitude];
      console.log(
        `Latitude: ${location.latitude}, Longitude: ${location.longitude}`
      );
      setUserLocation(newLocation);

      chrome.storage.local.set({ userLocation: newLocation }, () => {
        console.log('location saved to chrome storage');
      });
    } else {
      console.log('Geocoding failed or no results found');
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center px-4 py-2 bg-white drop-shadow-xl w-full">
        <div className="flex items-center w-full max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center">
            <img
              src={logoImage}
              className="w-[200px] h-[100px] object-contain"
              alt="FloodWatch logo linking to contact us page"
            />
          </div>

          <ul className="flex items-center space-x-4 ml-auto">
            <li className="cursor-pointer">
              <a
                href="https://www.floodwatch.center/contact-us"
                target="_blank"
                rel="noopener noreferrer">
                <Mail size={35} className="cursor-pointer" />
              </a>
            </li>
          </ul>
        </div>
      </header>

      <div className="mt-16 flex flex-row justify-center items-start mx-auto max-w-[1400px] gap-8">
        <div className="flex flex-col justify-start items-start gap-8 w-full">
          <div className="w-full">
            <UkMap userLocation={userLocation} />
          </div>

          <div className="w-full">
            <div className="w-full">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area to Track</FormLabel>
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
          </div>
        </div>

        {/* Right Section: Flood Report */}
        <div className="w-full">
          <h2 className="text-xl font-bold mb-4 text-center">Flood Report</h2>
          {alertData ? (
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                {' '}
                <strong>County:</strong> {alertData?.county}
              </p>
              <p className="text-gray-600">
                {' '}
                <strong>Severity:</strong> {alertData?.severity}
              </p>
              <p className="text-gray-600">
                {' '}
                <strong>River or sea:</strong> {alertData?.riverOrSea}
              </p>
              <p className="text-gray-600">
                {' '}
                <strong>Message:</strong> {alertData?.message}
              </p>
              <p className="text-gray-600">
                {' '}
                <strong>Last time the message was changed:</strong>{' '}
                {alertData?.timeMessageChanged
                  ? format(
                      parseISO(alertData.timeMessageChanged),
                      'do MMMM yyyy HH:mm'
                    )
                  : 'no information available'}
              </p>
              <p className="text-center text-red-500">
                Flood report issued by the{' '}
                <span className="text-primaryFlood-dark">
                  <a
                    className="text-red-500"
                    href="https://www.gov.uk/government/organisations/environment-agency"
                    target="_blank"
                    rel="nofollow noopener noreferrer">
                    Environment Agency.
                  </a>
                </span>{' '}
              </p>
            </div>
          ) : (
            <p className="text-base text-center">No active alerts</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Options;
