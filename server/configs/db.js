const { Pool }= require("pg");
const bcrypt=require("bcryptjs");
require("dotenv").config();

const pool= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:{
      rejectUnauthorized:false,
    },
});

pool.on("connect",()=>{
   console.log("PostgresSQL connected successfully");
});

pool.on("error",(err)=>{
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports=pool;