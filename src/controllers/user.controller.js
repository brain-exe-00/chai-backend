import {asyncHandler} from "../utils/asyncHandler.js"

// this method will register user
const registerUser = asyncHandler( async (req , res)=> {
    res.status(200).json({
        message: "OK"
    })
})

export { registerUser }