import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, X, Mail, Calendar, Camera, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../UI/Card";
import api from "../../services/api";
import toast from "react-hot-toast";

const Navbar = ({ onMenuToggle }) => {
  const { user, logout, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const openProfile = () => {
    setIsClosing(false);
    setIsProfileOpen(true);
  };

  const closeProfile = () => {
    if (isUploading) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsProfileOpen(false);
      setIsClosing(false);
    }, 250);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setIsUploading(true);
        await api.patch('/users/profile', { avatar: reader.result });
        toast.success("Profile picture updated!");
        if (checkAuthStatus) await checkAuthStatus();
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Avatar rendering logic
  const renderAvatar = (sizeClasses, includeCamera = false) => {
    if (user?.avatar) {
      return (
        <div className={`relative ${sizeClasses} rounded-full overflow-hidden shrink-0 group ${includeCamera ? 'cursor-pointer' : ''}`} onClick={includeCamera ? () => fileInputRef.current?.click() : undefined}>
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          {includeCamera && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      );
    }
    
    // Initials fallback
    return (
      <div 
        className={`relative ${sizeClasses} rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-lg shrink-0 group ${includeCamera ? 'cursor-pointer' : ''}`}
        onClick={includeCamera ? () => fileInputRef.current?.click() : undefined}
      >
        {user?.name?.charAt(0).toUpperCase()}
        {includeCamera && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav className="h-16 flex items-center justify-between px-6 bg-white/20 backdrop-blur-xl border-b border-white/30 sticky top-0 z-10 w-full shadow-sm">
        <div className="flex items-center gap-3">
           <button 
             className="md:hidden p-1.5 -ml-2 text-gray-700 hover:bg-white/40 rounded-lg transition-colors"
             onClick={onMenuToggle}
             title="Open Menu"
           >
             <Menu className="w-6 h-6" />
           </button>
           <h2 className="text-xl font-bold text-gray-800 tracking-tight">EvolveHR</h2>
        </div>

        <div className="flex items-center gap-4">
          <div 
            onClick={openProfile}
            className="flex items-center gap-3 bg-white/30 px-3 py-1.5 rounded-full border border-white/40 cursor-pointer hover:bg-white/50 transition-colors"
          >
            {renderAvatar("w-8 h-8 text-sm")}
            <div className="hidden md:flex flex-col text-sm leading-tight pr-2">
              <span className="font-semibold text-gray-800">{user?.name}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-500 hover:bg-white/40 rounded-full transition-colors flex items-center gap-1"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeProfile}
        >
          <Card 
            className={`w-full max-w-sm bg-white/95 border border-white/60 shadow-2xl relative transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isClosing ? "scale-90 opacity-0 translate-y-8" : "scale-100 opacity-100 translate-y-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeProfile}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center mt-2 mb-6">
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg, image/webp"
              />
              
              <div className="relative mb-3">
                 {renderAvatar("w-20 h-20 text-3xl", true)}
                 {isUploading && (
                   <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center animate-pulse">
                     <span className="text-xs font-bold text-gray-800">Saving...</span>
                   </div>
                 )}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-1 uppercase tracking-wider">
                {user?.role}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100/80">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full Name</p>
                  <p className="font-medium text-gray-800">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100/80">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email Address</p>
                  <p className="font-medium text-gray-800">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100/80">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Date of Joining</p>
                  <p className="font-medium text-gray-800">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default Navbar;
