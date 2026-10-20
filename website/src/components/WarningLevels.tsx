import { severityLevels } from '@/chrome-extension/severity';

const levels = [
  {
    level: 1,
    name: 'Severe flood warning',
    meaning:
      'Severe flooding, danger to life. Stay somewhere safe and be ready to leave your home.',
  },
  {
    level: 2,
    name: 'Flood warning',
    meaning:
      'Flooding is expected, immediate action required. Act now to protect yourself and your home.',
  },
  {
    level: 3,
    name: 'Flood alert',
    meaning:
      "Flooding is possible, be prepared. Get ready to act, usually with 2 to 12 hours' notice.",
  },
  {
    level: 4,
    name: 'Warning no longer in force',
    meaning:
      'Lifted in the last day or so. It still shows on the map and in the report, without a notification.',
  },
];

export default function WarningLevels() {
  return (
    <section aria-labelledby="levels-title" className="section-rule bg-tide">
      <div className="wrap py-16 sm:py-24">
        <h2 id="levels-title" className="section-title">
          What the colours mean
        </h2>
        <p className="section-intro xl:text-xl 2xl:text-2xl">
          FloodWatch uses the Environment Agency's warning levels. The map
          colours each area by its level, and where areas overlap, the most
          serious one counts.
        </p>
        <dl className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-16">
          {levels.map(({ level, name, meaning }) => (
            <div
              key={level}
              className="border-t-[6px] pt-4 text-center"
              style={{ borderColor: severityLevels[level].colour }}>
              <dt className="font-semibold text-ink xl:text-xl 2xl:text-2xl">
                {name}
              </dt>
              <dd className="mx-auto mt-1 max-w-[36ch] text-balance">
                {meaning}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}