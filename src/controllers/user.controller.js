import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //adding refreshToken to DataBase
    user.refreshToken = refreshToken
    //save it
    await user.save(
      {
        validateBeforeSave: false
      }
    )
    return { accessToken, refreshToken }

  } catch (error) {
    console.log("🔥 TOKEN ERROR:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token "
    );
  }
};

// this method will register user
const registerUser = asyncHandler(async (req, res) => {
  // get users detail from frontend
  // validation - not empty
  // check if user already exists: username , email
  // check for images , check for avatar
  // upload them to cloudinary
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  //validation

  const { fullName, email, username, password } = req.body;
  //extracted all the points from req.body

  // console.log(req.body)
  // console.log("email:" , email)

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
    // if any of the field is empty it will return true
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists: username , email
  const existedUser = await User.findOne({
    //use operator using ($ or) can compare as many fields
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // console.log(req.files)
  // check for images , check for avatar
  //using multer --->> gives access of files  ....files? -- optional chaining -- may be we are having access or not of files
  //avatar[0] -- (optinally) first property mei jho object milta hai usee optinally lenge to uska path  multer data hai
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  //isArray() --> checks whether argument is having array or not
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //avatar if not found throw error
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //upload on Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // create a object using User.create( { , , ,} )
  //data base entry....remove password and refresh token field from response

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    //these fields are not selected & are written in "" doubleQuotes with - sign
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user ");
  }

  //return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

// login 
const loginUser = asyncHandler(async (req, res) => {
  /* 
    1.  req.body se data collect karo
    2. username or email
    3. find the user exist or not
    4. if exist check password
    5. if password is valid generate, access refresh token and send to user
    6. sends cookies and then response
    */

  const { email, username, password } = req.body || {};

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    //use mongodb operator
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist ");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Crediential");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  //define option for cookies
  //
  const options = {
    httpOnly: true, //  due to this field cookies are server modifiable only , cant be modified by frontend
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
          //whether if user want to save ascces,refresh token locally ,in mobile application cookie are not present
        },
        "User loggedIn  Successfully"
      )
    )
  //send it to cookies

});

//logout
const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})
//refresh access token's endpoint
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request")
  }

 try {
   // incoming token is converted into decoded token
   const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   )
   // remove or find id from decodedToken 
   const user = await User.findById(decodedToken?._id)
   if (!user) {
     throw new ApiError(401, "Invalid refresh token")
   }
 
   if (incomingRefreshToken !== user?.refreshToken) {
     throw new ApiError(401, "Refresh token is invalid or used")
   }
 
   const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
   const options = {
     httpOnly: true,
     secure: true
   }
 
   return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
       new ApiResponse(
         200,
         { accessToken, refreshtoken: newRefreshToken },
         "Access Token refreshed successfully"
       )
     )
 } catch (error) {
  throw new ApiError(401, error?.message || "Invalid Refresh Token")
 }

})


export { registerUser, loginUser, logoutUser ,refreshAccessToken };
