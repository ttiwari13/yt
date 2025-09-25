import React from "react";
import { Book, CheckSquare, Headset, User } from "lucide-react";

interface SidebarProps {
  onTabChange: React.Dispatch<React.SetStateAction<"library" | "profile">>;
}

const Sidebar: React.FC<SidebarProps> = ({ onTabChange }) => {
  return (
    <div className="w-64 bg-gray-950 p-6 flex flex-col justify-between min-h-screen">
      <div>
        <div className="text-xl font-bold mb-8">Kozu</div>
        <nav className="space-y-4 mb-10">
          <button
            className="flex items-center text-blue-400 font-bold p-3 rounded-lg bg-blue-900 bg-opacity-30 w-full text-left"
            onClick={() => onTabChange("library")}
          >
            <Book className="mr-3" size={20} /> Course
          </button>
          <button
            className="flex items-center text-gray-400 hover:text-white transition-colors p-3 rounded-lg w-full text-left"
          >
            <CheckSquare className="mr-3" size={20} /> Tasks
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
          <button
            className="flex items-center text-gray-400 hover:text-white transition-colors p-3 rounded-lg w-full text-left"
          >
            <Headset className="mr-3" size={20} /> Contact
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg flex items-center">
        <img
          src="https://via.placeholder.com/40"
          alt="User Profile"
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <div className="font-semibold text-sm">Tanishka Tiwari</div>
          <div className="text-xs text-gray-400">tiwaritanishka02@gmail.com</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
