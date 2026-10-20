const steps = [
  {
    title: 'Add it to Chrome',
    text: 'Download the extension from this page and load it in Chrome from its extensions page, which takes about a minute and needs no account.',
  },
  {
    title: 'Save an address',
    text: "Search for an address in England on the settings page. Its map shows the address and colours the warnings' areas by how serious they are.",
  },
  {
    title: 'Turn on alerts',
    text: 'Switch alerts on in the popup. When a warning reaches your address, or the one there gets more serious, Chrome shows a notification.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="section-rule">
      <div className="wrap py-16 sm:py-24">
        <h2 id="how-it-works-title" className="section-title">
          How it works
        </h2>
        <ol
          role="list"
          className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12 xl:gap-20">
          {steps.map(({ title, text }, index) => (
            <li
              key={title}
              className="border-t-2 border-estuary pt-6 text-center">
              <p
                aria-hidden="true"
                className="font-display text-[2.5rem] font-bold leading-none text-estuary xl:text-[3rem] 2xl:text-[3.5rem]">
                {index + 1}
              </p>
              <h3 className="mt-4 font-sans text-[1.3125rem] font-semibold xl:text-2xl 2xl:text-[1.75rem]">
                {title}
              </h3>
              <p className="mx-auto mt-3 max-w-[44ch] text-balance xl:text-xl 2xl:text-2xl">
                {text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}