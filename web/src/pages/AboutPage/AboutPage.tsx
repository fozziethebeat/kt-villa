import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

const AboutPage = () => {
  return (
    <>
      <MetaTags title="About" description="About page" />

      <div
        className="hero min-h-screen"
        style={{
          backgroundImage: 'url(/about/view-hakuba-main.jpeg)',
        }}
      >
        <div className="hero-overlay" />
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">Snow Time</h1>
            <p className="mb-5">
              This ski season, we're opening up our Hakuba home, KT Villa, to
              friends and friends of friends. find an upcoming trip and join us
              as we enjoy some chilly weather and fly down some snowy mountains.
            </p>
          </div>
        </div>
      </div>
      <div className="divider"></div>
      <div className="center-center m-8 flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">What to expect</h1>
        <p>
          At KT-Villa, we live about 1 kilometer from Hakuba 47 and about 2
          kilometers from Hakuba Goryu, two of the best ski slopes in Japan.
          Each week, we'll be driving from Tokyo to Hakuba in a Toyota Prius for
          a long weekend. To join, just pick a trip that works for you, follow
          the transit instructions, and it'll all work out for the fun.
        </p>
        <div className="carousel w-[512px]">
          <div id="view-hakuba" className="carousel-item w-full">
            <img src="/about/view-hakuba-mountains.jpeg" className="w-full" />
          </div>
          <div id="location-house" className="carousel-item w-[512px]">
            <img src="/about/location-house-snow.jpeg" className="w-full" />
          </div>
          <div id="view-hakuba-valley" className="carousel-item w-[512px]">
            <img src="/about/view-hakuba-valley.jpeg" className="w-full" />
          </div>
          <div id="location-snowy-yard" className="carousel-item w-[512px]">
            <img src="/about/location-snowy-yard.jpeg" className="w-full" />
          </div>
        </div>
        <div className="flex w-[512px] justify-center gap-2 py-2">
          <a href="#view-hakuba" className="btn btn-xs">
            1
          </a>
          <a href="#location-house" className="btn btn-xs">
            2
          </a>
          <a href="#view-hakuba-valley" className="btn btn-xs">
            3
          </a>
          <a href="#location-snowy-yard" className="btn btn-xs">
            4
          </a>
        </div>
        <h1 className="text-3xl font-bold">Weather</h1>
        <p>
          It can be quite cold, anywhere from -20 to 0, so be prepared. But
          that's why you're joining right?
        </p>
        <div className="carousel w-[512px]">
          <div id="perks-fireplace" className="carousel-item w-full">
            <img src="/about/perks-fireplace.jpeg" className="w-full" />
          </div>
          <div id="perks-mame" className="carousel-item w-[512px]">
            <img src="/about/perks-mame.jpeg" className="w-full" />
          </div>
          <div id="perks-mushrooms" className="carousel-item w-[512px]">
            <img src="/about/perks-mushrooms.jpeg" className="w-full" />
          </div>
        </div>
        <div className="flex w-[512px] justify-center gap-2 py-2">
          <a href="#perks-fireplace" className="btn btn-xs">
            1
          </a>
          <a href="#perks-mame" className="btn btn-xs">
            2
          </a>
          <a href="#perks-mushrooms" className="btn btn-xs">
            3
          </a>
        </div>
        <h1 className="text-3xl font-bold">Perks</h1>
        <p>
          On each trip, we'll have a few perks ready. We've got a lovely wood
          stove in the living room, a solid espresso machine, and everything
          needed for cooking. On some trips you can also expect our lovely
          little Mame to join along and even a wild mushroom.
        </p>
        <h1 className="text-3xl font-bold">How to Join</h1>
        <ul className="steps steps-vertical">
          <li className="step step-primary">
            Get an inviation code from Keith
          </li>
          <li className="step step-primary">Join a trip</li>
          <li className="step step-primary">Meet at the station</li>
          <li className="step step-primary">Cover transit and food costs</li>
          <li className="step step-primary">Be free on the mountain</li>
        </ul>
      </div>
    </>
  )
}

export default AboutPage
