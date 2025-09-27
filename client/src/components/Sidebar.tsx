import React from "react";
import { Book, Headset, User } from "lucide-react";
import { useAuth } from '../context/authContext'; 

interface SidebarProps {
    onTabChange: React.Dispatch<React.SetStateAction<"library" | "profile" | "tasks">>;
}

const Sidebar: React.FC<SidebarProps> = ({ onTabChange }) => {
    const { user, isLoading } = useAuth();
    const userName = user?.username || (isLoading ? "Loading..." : "Guest User");
    const userEmail = user?.email || "";

    const getInitial = (name: string): string => {
        if (!name || name === "Loading...") return isLoading ? "⟳" : "?";
        return name.charAt(0).toUpperCase();
    };

    const userInitial = getInitial(userName);

    return (
        <div className="w-64 bg-gray-950 p-6 flex flex-col justify-between min-h-screen text-white">
            <div>
                <div className="text-xl font-bold mb-8">Kozmic</div>
                <nav className="space-y-4 mb-10">
                    <button
                        className="flex items-center text-gray-400 hover:text-white transition-colors p-3 rounded-lg w-full text-left"
                        onClick={() => onTabChange("library")}
                    >
                        <Book className="mr-3" size={20} /> Course
                    </button>
                    <button
                        className="flex items-center text-gray-400 hover:text-white transition-colors p-3 rounded-lg w-full text-left"
                        onClick={() => onTabChange("tasks")}
                    >
                        <Headset className="mr-3" size={20} /> Tasks
                    </button>
                </nav>

                <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">
                        More
                    </h3>
                    <button
                        className="flex items-center text-gray-400 hover:text-white transition-colors p-3 rounded-lg w-full text-left"
                        onClick={() => onTabChange("profile")}
                    >
                        <User className="mr-3" size={20} /> My Profile
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg flex items-center">
                <div
                    className={`flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0 ${
                        isLoading ? 'animate-pulse bg-gray-600' : 'bg-blue-600'
                    }`}
                    style={{
                        width: 40,
                        height: 40,
                        fontSize: 18,
                    }}
                    title={userName}
                >
                    {userInitial}
                </div>
                
                <div className="ml-3 overflow-hidden">
                    <div className="font-semibold text-sm truncate">{userName}</div>
                    <div className="text-xs text-gray-400 truncate">{userEmail}</div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
