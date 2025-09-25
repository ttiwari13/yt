const express=require("express");
const dotenv=require("dotenv");
const cors=require("cors");
const authRoutes = require("./routes/authRoute");
const userRoutes = require("./routes/userRoute");
const videoRoutes = require("./routes/videoRoute");

const pool=require("./configs/db");
dotenv.config();
const app=express();
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(express.json());
app.get("/",(req,res)=>{
   res.send("API is running");

});
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/videos", videoRoutes);

const PORT= process.env.PORT||5000;
app.listen(PORT,()=>console.log(`Server is listening`));