import '../global.css';
import { Mail } from 'lucide-react';
import { BarLoader } from 'react-spinners';
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
  const [isActiveFlood, setIsActiveFlood] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: ''
    }
  });

  useEffect(() => {
    setLoading(true);
    chrome.storage.local.get(
      ['userLocation', 'lastSentAlert', 'isActiveFlood'],
      (result) => {
        setUserLocation(result.userLocation ?? null);
        setAlertData(result.lastSentAlert ?? null);
        setIsActiveFlood(result.isActiveFlood ?? false);
        setLoading(false);
      }
    );

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      namespace: string
    ) => {
      if (namespace === 'local') {
        if (changes.userLocation) {
          setUserLocation(changes.userLocation.newValue ?? null);
        }
        if (changes.lastSentAlert) {
          setAlertData(changes.lastSentAlert.newValue ?? null);
        }
        if (changes.isActiveFlood) {
          setIsActiveFlood(changes.isActiveFlood.newValue ?? false);
        }
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
        console.log('Location saved to Chrome storage');
      });
    } else {
      console.log('Geocoding failed or no results found');
    }
  };

  return (
    <div className="bg-gray-50">
      <header className="flex justify-between items-center px-4 py-2 bg-white drop-shadow-xl w-full">
        <div className="flex items-center w-full max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center">
            <a
              href="https://www.floodwatch.center"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Flood Watch's website">
              <img
                src={logoImage}
                className="w-[200px] h-[100px] object-contain cursor-pointer"
                alt="FloodWatch logo"
              />
            </a>
          </div>

          <ul className="flex items-center space-x-4 ml-auto">
            <li className="cursor-pointer">
              <a
                href="https://www.floodwatch.center/contact-us"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact us link">
                <Mail size={35} className="cursor-pointer" />
              </a>
            </li>
          </ul>
        </div>
      </header>

      <div className="mt-16 flex flex-col px-4 pb-10 lg:flex-row justify-center items-start mx-4 lg:mx-auto max-w-[1400px] gap-8 bg-gray-50">
        <div className="flex flex-col justify-start items-start gap-8 w-full">
          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center h-[50vh] shadow-lg border rounded-lg px-4 py-4">
                <BarLoader />
              </div>
            ) : (
              <UkMap userLocation={userLocation} />
            )}
          </div>

          <div className="w-full flex flex-col items-center">
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
                        <FormLabel className="text-primaryFlood-dark text-lg font-medium">
                          Location to monitor: service available only in England
                          🏴󠁧󠁢󠁥󠁮󠁧󠁿
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a valid address within England"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Type in your address to see your location on the map!
                          We only support locations in England.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-center lg:justify-start lg:items-start">
                    <Button
                      type="submit"
                      aria-label="button to show the user's location"
                      className="mx-auto lg:mx-0">
                      View my location
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* Right Section: Flood Report */}
        <div className="w-full shadow-lg h-[50vh] border rounded-lg px-4 py-4">
          <h2 className="text-xl font-bold mb-4 text-center">Flood Report</h2>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <BarLoader />
            </div>
          ) : isActiveFlood && alertData ? (
            <div className="space-y-3 text-sm overflow-y-auto h-[calc(50vh-5rem)] px-2">
              <p className="text-gray-600">
                <strong>County:</strong> {alertData.county}
              </p>
              <p className="text-gray-600">
                <strong>Severity:</strong> {alertData.severity}
              </p>
              <p className="text-gray-600">
                <strong>River or sea:</strong> {alertData.riverOrSea}
              </p>
              <p className="text-gray-600">
                <strong>Message:</strong> {alertData.message}
              </p>
              <p className="text-gray-600">
                <strong>Last time the message was changed:</strong>{' '}
                {alertData.timeMessageChanged
                  ? format(
                      parseISO(alertData.timeMessageChanged),
                      'do MMMM yyyy HH:mm'
                    )
                  : 'no information available'}
              </p>
              <p className="text-center text-red-500 ">
                Flood report issued by the{' '}
                <span className="underline ">
                  <a
                    className="text-red-500 cursor-pointer"
                    href="https://www.gov.uk/government/organisations/environment-agency"
                    target="_blank"
                    rel="nofollow noopener noreferrer">
                    Environment Agency
                  </a>
                </span>
                .
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(50vh-5rem)] px-2">
              <p className="text-base text-center">
                Your area currently has no active alerts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Options;
