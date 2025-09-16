import { Search, MapPin, Menu, X } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, UserCheck } from "lucide-react";
import { useState, useRef, useEffect, useContext } from "react";
import { toast } from "react-toastify";

import { OrganizerContext } from "../Contexts/OrganizerContext/OrganizerContext";
import { PlayerContext } from "../Contexts/PlayerContext/PlayerContext";
import { AppContext } from "../Contexts/AppContext/AppContext";
import HomeLogo from "./HomeLogo.png";

const Navigation = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { backend_URL } = useContext(OrganizerContext);
  const { isPlayerLoggedIn, setIsPlayerLoggedIn, playerData, setPlayerData, getAuthStatusPlayer } =
    useContext(PlayerContext);
  const { selectedLocation, setSelectedLocation } = useContext(AppContext);

  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const navigate = useNavigate();

  const handleLogOut = async () => {
    try {
      const response = await fetch(`${backend_URL}/api/player/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsPlayerLoggedIn(false);
        setPlayerData(false);
        getAuthStatusPlayer();
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(`Error In LogOut Route Player Side ${error}`);
    }
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
    if (location.pathname !== "/tournaments" && e.target.value !== "all") {
      navigate("/tournaments");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${isHomePage ? "bg-transparent" : "bg-white shadow-sm"
        }`}
    >
      <div className="container mx-auto px-4 py-2 md:px-30 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 flex justify-start">
            <Link to="/" className="flex items-center space-x-2">
              <div
                className={`flex items-center justify-center overflow-hidden rounded-full
                ${isHomePage ? "w-15 h-15" : "w-12 h-12 bg-red-500 border-2 border-white"}  
  `}
              >
                <img src={HomeLogo} alt="Logo" className={`object-contain ${isHomePage ? "w-15 h-15" : "w-12 h-12"}`} />
              </div>
            </Link>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex flex-1 ml-8 items-center space-x-6">
            <Link
              to="/"
              className={`hover:text-primary transition-colors ${isHomePage ? "text-white" : "text-gray-700"}`}
            >
              Home
            </Link>
            <Link
              to="/tournaments"
              className={`hover:text-primary transition-colors ${isHomePage ? "text-white" : "text-gray-700"}`}
            >
              Tournaments
            </Link>
            <Link
              to="/player/score"
              className={`hover:text-primary transition-colors ${isHomePage ? "text-white" : "text-gray-700"}`}
            >
              Score
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex-shrink-0 flex items-center space-x-7">
            <select
              className={`hidden md:block w-40 md:w-28 lg:w-30 truncate 
        ${isHomePage ? "text-white bg-transparent" : "text-gray-700 bg-white"}
        px-2 py-1 text-sm hover:cursor-pointer`}
              value={selectedLocation}
              onChange={handleLocationChange}
            >
              <option value="all" className="text-black">All Locations</option>
              <option value="Bengaluru" className="text-black">Bengaluru</option>
              <option value="Delhi" className="text-black">Delhi</option>
              <option value="Kolkata" className="text-black">Kolkata</option>
              <option value="Chennai" className="text-black">Chennai</option>
              <option value="Mumbai" className="text-black">Mumbai</option>
            </select>

            {/* Login / User */}
            {/* Login / User */}
            {isPlayerLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-green-600 cursor-pointer"
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  <UserCheck className="text-white w-5 h-5" />
                </div>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-20 bg-white rounded-lg shadow-lg hover:rounded-lg hover:bg-gray-700">
                    <button
                      onClick={handleLogOut}
                      className="block w-full text-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-700 hover:text-white hover:rounded-lg hover:cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/roleSelection">
                <Button className="bg-red-500 hover:bg-primary/90 text-white cursor-pointer">
                  Login
                </Button>
              </Link>
            )}
            {/* Hamburger (Mobile Only) */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden ${isHomePage ? "text-white" : "text-gray-700"}`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>


        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 bg-white rounded-lg shadow p-4">
            {/* Player Auth (Mobile) */}
            <div className="flex items-center justify-start mb-4">
              {isPlayerLoggedIn ? (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center 
            ${playerData?.isAccountVerified ? "bg-green-600" : "bg-gray-200"}`}
                >
                  {playerData?.isAccountVerified ? (
                    <UserCheck className="text-white w-6 h-6" />
                  ) : (
                    <User className="text-gray-600 w-6 h-6" />
                  )}
                </div>
              ) : (
                <Link
                  to="/roleSelection"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button className="bg-red-500 hover:bg-primary/90 text-white w-full">
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Links */}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 hover:text-primary"
            >
              Home
            </Link>
            <Link
              to="/tournaments"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 hover:text-primary"
            >
              Tournaments
            </Link>
            <Link
              to="/player/score"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 hover:text-primary"
            >
              Score
            </Link>

            {/* Logout for logged-in users */}
            {isPlayerLoggedIn && (
              <Button
                onClick={() => {
                  handleLogOut();
                  setMobileMenuOpen(false);
                }}
                className="bg-red-500 hover:bg-primary/90 text-white w-full"
              >
                Log Out
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
