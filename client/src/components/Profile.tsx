import { useState, useEffect } from "react";
import { LogOut, User, Mail } from "lucide-react";

const Profile = () => {
  const [userData, setUserData] = useState<{ username: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/user/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            throw new Error("Session expired. Please log in again.");
          }
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        console.log("Profile data received:", data);
        setUserData(data);
      } catch (err) {
        console.error("Profile fetch error:", err);
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
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    
    try {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await fetch("http://localhost:5000/api/auth/logout", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          console.log("Backend logout failed, but continuing with local logout");
        }
      }
    } finally {
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user"); 
      window.location.href = '/'; 
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-64">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-center">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg w-full transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Sign Out Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {signingOut ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing Out...
            </>
          ) : (
            <>
              <LogOut className="mr-2" size={16} />
              Sign Out
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl text-white shadow-lg">
        {/* Profile Header */}
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
            {userData?.username ? userData.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{userData?.username || 'N/A'}</h2>
            <p className="text-gray-400">{userData?.email || 'N/A'}</p>
          </div>
        </div>
        
        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="mr-2 text-blue-400" size={16} />
              <h3 className="text-sm text-gray-400 font-semibold">Username</h3>
            </div>
            <p className="text-lg font-medium">{userData?.username || 'Not set'}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Mail className="mr-2 text-green-400" size={16} />
              <h3 className="text-sm text-gray-400 font-semibold">Email</h3>
            </div>
            <p className="text-lg font-medium">{userData?.email || 'Not set'}</p>
          </div>
        </div> 
      </div>
    </div>
  );
};

export default Profile;