import logo from '@/chrome-extension/public/logo.svg';

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#install', label: 'Install' },
  { href: '#questions', label: 'Questions' },
  { href: 'https://github.com/ErikM9/floodWatch', label: 'GitHub' },
];

export default function Header() {
  return (
    <header className="border-b-2 border-estuary bg-white">
      <a
        href="#main"
        className="sr-only left-4 top-4 z-20 rounded-md bg-white px-4 py-2 font-semibold text-estuary focus:not-sr-only focus:absolute">
        Skip to content
      </a>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-3 py-5 sm:px-4 sm:py-6">
        <img
          src={logo}
          alt="FloodWatch"
          width={365}
          height={35}
          className="h-7 w-auto sm:h-8 xl:h-10 2xl:h-12"
        />
        <nav aria-label="Main" className="w-full sm:w-auto">
          <ul className="-mx-3 flex flex-wrap justify-between gap-x-1 gap-y-1 text-lg font-semibold text-ink sm:justify-end sm:gap-x-3 sm:text-xl xl:gap-x-5 xl:text-[1.75rem] 2xl:text-3xl">
            {links.map(({ href, label }) => (
              <li key={href}>
                <a href={href} className="nav-link">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}