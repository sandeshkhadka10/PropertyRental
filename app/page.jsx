import Hero from '@/components/Hero.jsx';
import InfoBoxes from '@/components/InfoBoxes.jsx';
import HomeProperties from '@/components/HomeProperties';
// import connectDB from '@/config/database';

const HomePage = async() => {
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