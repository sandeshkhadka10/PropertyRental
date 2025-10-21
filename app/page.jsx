import Hero from '@/components/Hero.jsx';
import InfoBoxes from '@/components/InfoBoxes.jsx';
import HomeProperties from '@/components/HomeProperties';

const HomePage = () => {
  // console.log(process.env.MONGODB_URL);
    return (
        <>
          <Hero/>
          <InfoBoxes/>
          <HomeProperties/>
        </>
    )
};

export default HomePage;