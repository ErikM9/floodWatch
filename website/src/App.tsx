import Footer from './components/Footer';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Install from './components/Install';
import Questions from './components/Questions';
import WarningLevels from './components/WarningLevels';

export default function App() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <HowItWorks />
        <WarningLevels />
        <Install />
        <Questions />
      </main>
      <Footer />
    </>
  );
}