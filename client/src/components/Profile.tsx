import { useState, useEffect } from "react";

const Profile = () => {
 const [userData,setUserData]=useState<{ username: string; email: string } | null>(null);
 const [loading,setLoading]=useState(true);
 const [error, setError] = useState<string | null>(null);
 useEffect(()=>{
     const fetchUserProfile= async()=>{
        const token=localStorage.getItem("token");
        if(!token){
            setError("User not authenticated. Please log in."); 
            setLoading(false);
           return;
        }try{
          const response=await fetch("http://localhost:5000/api/user/profile",{
              method:"GET",
              headers:{
                 "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
              },
          });
          if(!response.ok){
            throw new Error("Failed to fetch user profile.");
          }
          const data=await response.json();
          setUserData(data);

        }catch(err){
          if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
     };
     fetchUserProfile();
 },[]);
  if (loading) {
    return (
      <div className="p-6">
        <p className="text-white text-center">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500 text-center">Error: {error}</p>
      </div>
    );
  }
 return (
    <>
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-white">My Profile</h1>
      <div className="bg-gray-800 p-6 rounded-lg text-white">
        <p className="text-lg">
          Name: {userData?.username || 'N/A'}
        </p>
        <p className="text-lg">
          Email: {userData?.email || 'N/A'}
        </p>
      </div>
    </div>
    </>
  )
}

export default Profile;
