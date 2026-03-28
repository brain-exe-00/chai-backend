import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true //used for searching 
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar:{
            type: String, //Cloudinary url
            required: true,
        },
        coverImage: {
            type: String, //Cloudinary url

        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: { //challenge to compare
            type: String,
            required: [true , 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {timestamps: true})


userSchema.pre("save" , async function(next){
    if(!this.isModified("password")) return;
    //password encryption just before code runs ...Data save hone se pahile use karo
    this.password = await bcrypt.hash(this.password , 10)
    
})

//we can eject/create our own methods...custom methods''''
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)
    // bcrypt checks password "compares password"__true or false
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id ,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id ,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User" , userSchema)



//jwt ==> bearer token...
