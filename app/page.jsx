import Hero from '@/components/Hero.jsx';
import InfoBoxes from '@/components/InfoBoxes.jsx';
import HomeProperties from '@/components/HomeProperties';
// import connectDB from '@/config/database';

const HomePage = () => {
  // console.log(process.env.MONGODB_URL);
  // await connectDB();

    return (
        <>
          <Hero/>
          <InfoBoxes/>
          <HomeProperties/>
        </>
    )
};

export default HomePage;