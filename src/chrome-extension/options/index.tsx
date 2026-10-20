import '../global.css';
import { BarLoader } from 'react-spinners';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { LatLngTuple } from 'leaflet';
import { House } from 'lucide-react';
import { useEffect, useState } from 'react';

import { userAddress } from '../api/geocoding';
import logoImage from './../public/logo.svg';
import UkMap from '../app-components/Map';

import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { AlertMessage } from '@/types/types';

const formSchema = z.object({
  address: z.string().trim().min(1, {
    message: 'Please enter an address.',
  }),
});

const lookupErrors = {
  'not-found':
    "We couldn't find that address. Try adding the town or postcode.",
  'outside-england':
    'That address is outside England. We only support locations in England.',
  failed: "We couldn't look up that address. Please try again.",
};

const Options = () => {
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [alertData, setAlertData] = useState<AlertMessage | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '',
    },
  });

  useEffect(() => {
    chrome.storage.local.get(['userLocation', 'lastSentAlert'], (result) => {
      setUserLocation(result.userLocation ?? null);
      setAlertData(result.lastSentAlert ?? null);
      setLoading(false);
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      namespace: string,
    ) => {
      if (namespace === 'local') {
        if (changes.userLocation) {
          setUserLocation(changes.userLocation.newValue ?? null);
        }
        if (changes.lastSentAlert) {
          setAlertData(changes.lastSentAlert.newValue ?? null);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const location = await userAddress(data.address);

    if (location.status !== 'found') {
      form.setError('address', { message: lookupErrors[location.status] });
      return;
    }

    const newLocation: LatLngTuple = [location.latitude, location.longitude];
    /* Setting the location here as well centres the map again when the same address is searched twice */
    setUserLocation(newLocation);
    chrome.storage.local.set({ userLocation: newLocation });
    form.reset();
  };

  return (
    <div className="bg-gray-50">
      {/* The logo's picture has a pixel of space under its letters, which the bottom padding leaves out */}
      {/* The side padding keeps the logo clear of the website link, so a narrow window shrinks the logo instead */}
      <header className="relative flex justify-center items-center px-14 pt-3 pb-[11px] bg-white border-b border-line w-full">
        <img
          src={logoImage}
          className="w-[302px] h-[29px] object-contain"
          alt="FloodWatch logo"
        />
        <a
          href="https://erikm9.github.io/floodWatch/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="FloodWatch's website"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-black transition-colors duration-300 hover:text-alert motion-reduce:transition-none">
          <House size={26} aria-hidden="true" />
        </a>
      </header>

      <div className="mt-3 flex flex-col px-4 pb-2 lg:flex-row justify-center items-start gap-8 bg-gray-50">
        <div className="flex flex-col justify-start items-start gap-2 w-full">
          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center h-[560px] border border-line rounded-lg px-4 py-4">
                <BarLoader />
              </div>
            ) : (
              <UkMap userLocation={userLocation} />
            )}
          </div>

          {/* The form shrinks to its note's width, so the field and the button line up with the note */}
          <div className="w-full flex flex-col items-start">
            <div className="w-fit max-w-full">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-1">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primaryFlood-dark text-2xl font-medium">
                          Location to monitor: the service is available only in
                          England 🏴󠁧󠁢󠁥󠁮󠁧󠁿
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a valid address within England"
                            className="border-line"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-base">
                          Type in your address to see your location on the map!
                          We only support locations in England.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      className="px-3 text-lg font-bold">
                      View my location
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>

        <div className="w-full h-[560px] border border-line rounded-lg px-4 py-4">
          <h2 className="text-3xl font-bold mb-4 text-center text-primaryFlood">
            Flood Report
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <BarLoader />
            </div>
          ) : alertData ? (
            <div className="space-y-3 text-base overflow-y-auto h-[calc(560px-5rem)] px-2">
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
                      'do MMMM yyyy HH:mm',
                    )
                  : 'no information available'}
              </p>
              <p className="text-center text-red-500">
                Flood report issued by the{' '}
                <span className="underline">
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
            <div className="flex items-center justify-center h-[calc(560px-5rem)] px-2">
              <p className="text-xl text-center">
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