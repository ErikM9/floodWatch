export default function Footer() {
  return (
    <footer className="bg-ink text-[15px] text-white/80 xl:text-base 2xl:text-lg">
      <div className="wrap space-y-4 py-10 text-center [&_a:focus-visible]:outline-white [&_p]:mx-auto [&_p]:max-w-[105ch]">
        <p>
          FloodWatch was built by Brice Fromm and Erik Moldovan as a free Chrome
          extension for England, with this page as its live demo. The extension,
          the website and their tests are on{' '}
          <a
            href="https://github.com/ErikM9/floodWatch"
            className="footer-link">
            GitHub
          </a>
          , and more of their work is on{' '}
          <a href="https://www.codebybrice.com/" className="footer-link">
            Brice's portfolio
          </a>{' '}
          and{' '}
          <a href="https://erikm9.github.io/Portfolio/" className="footer-link">
            Erik's portfolio
          </a>
          .
        </p>
        <p>
          This uses Environment Agency flood and river level data from the
          real-time data API (Beta), under the{' '}
          <a
            href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
            className="footer-link">
            Open Government Licence v3.0
          </a>
          . The extension downloads the warnings and the outlines of the flood
          areas straight from the Environment Agency, and nothing passes through
          a server of its own. Map data and address search ©{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="footer-link">
            OpenStreetMap contributors
          </a>
          , through its map tiles and Nominatim.
        </p>
      </div>
    </footer>
  );
}