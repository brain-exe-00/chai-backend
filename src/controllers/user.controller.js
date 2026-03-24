import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// this method will register user
const registerUser = asyncHandler( async (req , res)=> {
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
    const {fullName , email ,username , password } = req.body ;
    // console.log("email:" , email)
    if(
        [fullName , email ,username , password].some((field) => field?.trim() === "" )
        // if any of the field is empty it will return true
    ){
        throw new ApiError(400 , "All fields are required")
    }

    // check if user already exists: username , email
    const existedUser = User.findOne({
        //use operator using $ or can compare as many fields
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409 , "User with email or username already exists")
    }

    // check for images , check for avatar
    //using multer --->> gives access of files  ....files? -- optional chaining -- may be we are having access or not of files
    //avatar[0] -- (optinally) first property mei jho object milta hai usee optinally lenge to uska path  multer data hai
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required")
    }

    //upload on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar) {
        throw new ApiError(400 , "Avatar file is required")
    }


    //data base entry....remove password and refresh token field from response
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),

    })

    const createdUser =  await User.findById(user._id).select(
        //these fields are not selected & are written in "" doubleQuotes with - sign
        "-password -refreshToken"
    )
    if(!createdUser) {
        throw new ApiError( 500 , "Something went wrong while registering the user ")
    }

    //return res

    return res.status(201).json(
        new ApiResponse(200 , createdUser, "User registered Successfully" )
    )
})


export { registerUser }