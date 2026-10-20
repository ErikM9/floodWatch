import { ReactNode } from 'react';

const questions: { question: string; answer: ReactNode }[] = [
  {
    question: 'Where does the flood data come from?',
    answer:
      "From the Environment Agency's real-time flood-monitoring API, which lists the flood warnings and alerts in force in England and keeps a lifted one on the list for about a day. FloodWatch downloads that list every minute, along with the outline of any flood area it doesn't have yet, and keeps each outline while its area is on the list.",
  },
  {
    question: 'Can I rely on FloodWatch alone?',
    answer: (
      <>
        No. The Environment Agency says its open data shouldn't be relied on for
        safety-critical uses, and FloodWatch only checks while Chrome is
        running. For warnings by phone, text or email,{' '}
        <a
          href="https://www.gov.uk/sign-up-for-flood-warnings"
          className="text-link">
          sign up for the Environment Agency's free flood warnings
        </a>{' '}
        or call Floodline on 0345 988 1188.
      </>
    ),
  },
  {
    question: 'Does it work outside England?',
    answer:
      'No. The Environment Agency only covers England, so the address search only accepts places in England.',
  },
  {
    question: 'Can I watch more than one address?',
    answer:
      'No, FloodWatch watches one address at a time, and saving a new one replaces it.',
  },
  {
    question: 'Does Chrome need to be open?',
    answer:
      'Yes. FloodWatch checks while Chrome is running, and checks straight away when Chrome starts.',
  },
  {
    question: 'What does it store, and what does it send?',
    answer:
      "Chrome keeps the location of your address, whether alerts are on and the warning there on your computer, along with the warnings FloodWatch has downloaded. The address you type goes to OpenStreetMap's Nominatim service to find it, and the map's tiles come from OpenStreetMap too, which sees the area the map shows. The popup and the settings page load their fonts from Google Fonts. FloodWatch has no accounts and no server of its own.",
  },
  {
    question: 'Is the demo on this page the real extension?',
    answer:
      "Yes. The popup and the settings page are the extension's own code, running in this page with a stand-in for Chrome's extension features, on the same live data. The page forgets the address you save there when you leave.",
  },
];

export default function Questions() {
  return (
    <section
      id="questions"
      aria-labelledby="questions-title"
      className="section-rule">
      <div className="wrap py-16 sm:py-24">
        <h2 id="questions-title" className="section-title">
          Questions
        </h2>
        <div className="mx-auto mt-10 max-w-[90ch] divide-y divide-line border-y border-estuary">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-semibold text-ink xl:text-xl 2xl:text-2xl [&::-webkit-details-marker]:hidden">
                {question}
                <span
                  aria-hidden="true"
                  className="text-2xl font-normal leading-none text-estuary transition-transform group-open:rotate-45 motion-reduce:transition-none">
                  +
                </span>
              </summary>
              <p className="pb-6">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}