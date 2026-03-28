import express from'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app= express()
app.use(express.json());

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true , limit: "16kb"})) //extented =>nested obj can be given
app.use(express.static("public")) //images ,favicon 
app.use(cookieParser())

// routes Import
import userRouter from './routes/user.routes.js'

// routes decleration
//uses middleware .....control==>>/user =>calls userRouter ==>> user.routes.js
app.use("/api/v1/users" , userRouter)
//http:localhost:8000/api/v1/user/register

export { app }