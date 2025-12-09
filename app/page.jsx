export const dynamic = 'force-dynamic';

import Hero from '@/components/Hero.jsx';
import InfoBoxes from '@/components/InfoBoxes.jsx';
import HomeProperties from '@/components/HomeProperties';
// import connectDB from '@/config/database';
import FeaturedProperties from '@/components/FeaturedProperties';

const HomePage = () => {
  // console.log(process.env.MONGODB_URL);
  // await connectDB();

    return (
        <>
          <Hero/>
          <InfoBoxes/>
          <FeaturedProperties/>
          <HomeProperties/>
        </>
    )
};

export default HomePage;