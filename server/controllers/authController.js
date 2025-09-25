const bcrypt=require("bcryptjs");
const pool=require("../configs/db");
const jwt=require("jsonwebtoken");

const generateToken=(id)=>{
  return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"7d"});
};

const registerUser=async(req,res)=>{
  const {username,email,password}=req.body;
  if(!username||!email|!password){
     return res.status(400).json({message:"Please fill all fields"});
    
    }
   try{
      const userExists=await pool.query("SELECT * FROM users WHERE email=$1",[email]);
      if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
      );
      res.status(201).json({
      id: newUser.rows[0].id, //rows[0] new user added in the db
      username: newUser.rows[0].username,
      email: newUser.rows[0].email,
      token: generateToken(newUser.rows[0].id),
    });
   }catch(error){
     res.status(500).json({message:error.message});
   }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      id: user.rows[0].id,
      username: user.rows[0].username,
      email: user.rows[0].email,
      token: generateToken(user.rows[0].id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { registerUser, loginUser };