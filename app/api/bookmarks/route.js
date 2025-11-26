import connectDB from "@/config/database";
import User from "@/models/User";
import Property from "@/models/Property";
import { getSessionUser } from "@/utils/getSessionUser";

// these is used during the deployment
// since i have to look these data freshly to check whether it is real or not
// export const dynamic = 'force-dynamic';

export const POST = async (request) => {
  try {
    await connectDB();

    // property id matra fetch garcha request gareko kura bata
    const { propertyId } = await request.json();

    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response("User Id is required", { status: 401 });
    }

    const { userId } = sessionUser;

    // Find user in database
    const user = await User.findOne({ _id: userId });

    // Check if the user has already bookmarked the property
    let isBookMarked = user.bookmarks.includes(propertyId);
    let message;
    if (isBookMarked) {
      // if already bookmarked, remove it
      user.bookmarks.pull(propertyId);
      message = "Bookmark removed successfully";
      isBookMarked = false;
    } else {
      // if not bookmarked, add it
      user.bookmarks.push(propertyId);
      message = "Bookmark added successfully";
      isBookMarked = true;
    }
    await user.save();

    return new Response(JSON.stringify({ message, isBookMarked }), {
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return new Response("Something went wrong", { status: 500 });
  }
};

// GET /api/bookmarks
export const GET = async () => {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response("User Id is required", { status: 401 });
    }

    const { userId } = sessionUser;

    const user = await User.findOne({_id:userId});

    // Get users bookmarks from the user modal which is inside the user array
    const bookmarks = await Property.find({_id:{$in: user.bookmarks}});

    return new Response(JSON.stringify(bookmarks),{status:200});
  } catch (error) {
    console.log(error);
    return new Response('Something went wrong',{status:500});
  }
};
