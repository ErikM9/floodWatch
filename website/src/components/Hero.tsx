import Demo from './Demo';

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="bg-tide">
      <div className="wrap pb-16 pt-10 sm:pb-24 sm:pt-16 xl:pt-20">
        <div className="flex flex-col items-center text-center">
          <h1
            id="hero-title"
            className="max-w-[26ch] text-[clamp(2rem,1.25rem+3.25vw,4.5rem)] font-bold leading-[1.08]">
            Know when a flood warning covers your address
          </h1>
          <p className="mt-6 max-w-[70ch] text-balance text-xl leading-relaxed sm:text-2xl xl:text-[1.75rem] 2xl:text-[2rem]">
            FloodWatch is a Chrome extension for England. It checks the
            Environment Agency's flood warnings every minute and, once alerts
            are on, shows a notification when one covers the address you saved.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#install" className="button-primary">
              Install FloodWatch
            </a>
            <a
              href="https://github.com/ErikM9/floodWatch"
              className="button-secondary">
              See the code on GitHub
            </a>
          </div>
          <p className="mt-6 max-w-[70ch] text-balance text-lg text-muted xl:text-xl 2xl:text-2xl">
            FloodWatch isn't an official warning service. For warnings by phone,
            text or email,{' '}
            <a
              href="https://www.gov.uk/sign-up-for-flood-warnings"
              className="text-link">
              sign up for the Environment Agency's free flood warnings
            </a>
            .
          </p>
        </div>

        <Demo />
      </div>
    </section>
  );
}