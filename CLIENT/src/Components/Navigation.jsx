import { Search, MapPin, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, UserCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// import { useAuth } from "@/contexts/AuthContext";


import { toast } from "react-toastify";


import { OrganizerContext } from "../Contexts/OrganizerContext/OrganizerContext";
import { useContext } from "react";


import { PlayerContext } from "../Contexts/PlayerContext/PlayerContext";
import { AppContext } from "../Contexts/AppContext/AppContext";







const Navigation = () => {

  const [showDropdown, setShowDropdown] = useState(false);


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


  const { isOrganizerLoggedIn, backend_URL, setOrganizerData, setIsOrganizerLoggedIn, getAuthStatusOrganizer } = useContext(OrganizerContext);

  const { isPlayerLoggedIn, setIsPlayerLoggedIn, playerData, setPlayerData, playerMail, setPlayerMail, getAuthStatusPlayer } = useContext(PlayerContext);

  const { selectedLocation, setSelectedLocation } = useContext(AppContext);

  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const navigate = useNavigate();

  console.log(isPlayerLoggedIn, playerData);


  const handleLogOut = async (evt) => {
    try {
      const fetchOptions = {
        method: "POST",
        credentials: "include",
      }

      const response = await fetch(`${backend_URL}/api/player/logout`, fetchOptions);
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsPlayerLoggedIn(false);
        setPlayerData(false);
        getAuthStatusPlayer();
        navigate('/');
        console.log("Player Logged Out Successfully");
      } else {
        console.log("Error In LogOut Route Frontend Player", data.message);
        toast.error(data.message);
      }

    } catch (error) {
      console.log("Error In LogOut Route Frontend Player", error);
      toast.error(`Error In LogOut Route Player Side ${error}`);
    }
  }

  // Handle location change
  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);

    // Navigate to tournaments page if not already there and a location is selected
    if (location.pathname !== '/tournaments' && e.target.value !== 'all') {
      navigate('/tournaments');
    }
  };








  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${isHomePage ? "bg-transparent" : "bg-white shadow-sm"}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`hover:text-primary transition-colors ${isHomePage ? "text-white" : "text-gray-700"}`}>
              Home
            </Link>
            <Link to="/tournaments" className={`hover:text-primary transition-colors ${isHomePage ? "text-white" : "text-gray-700"}`}>
              Tournaments
            </Link>
          </div>

          {/* Navigation spacer (replacing buttons) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8 justify-center">
          </div>

          <Link to="/player/score" className={`hover:text-primary transition-colors ${isHomePage ? "text-white" : "text-gray-700"}`}>
            Score
          </Link>

          {/* Location and Auth */}
          <div className="flex items-center space-x-4">
            <select
              className={`hidden md:flex items-center space-x-2 ${isHomePage ? "text-white" : "text-gray-700"} `}
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

            {/* {user ? (
              <div className="flex items-center space-x-2">
                <Link to={getDashboardLink()}>
                  <Button className="bg-primary hover:bg-primary/90 text-white">Dashboard</Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={logout}
                  className={isHomePage ? "text-black border-white hover:bg-white hover:text-gray-900" : ""}
                >
                  Logout
                </Button>
              </div>
            ) : ( */}





            {
  isPlayerLoggedIn ? (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <div onClick={() => setShowDropdown(prev => !prev)} className="cursor-pointer">
  <div className={`w-9 h-9 rounded-full flex items-center justify-center 
    ${playerData?.isAccountVerified ? "bg-green-600" : isHomePage ? "bg-white/30" : "bg-gray-200"}`}>
    {playerData?.isAccountVerified ? (
      <UserCheck className="text-white w-5 h-5" />
    ) : (
      <User className={`${isHomePage ? "text-white" : "text-gray-600"} w-5 h-5`} />
    )}
  </div>
</div>

      {/* Dropdown */}
      {showDropdown && (
          <div className="absolute top-full mt-2 right-0 w-20 z-50 bg-white border border-gray-200 rounded shadow">
          <Button
            onClick={() => {
              handleLogOut();
              setShowDropdown(false);
            }}
            className="w-full bg-white text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 hover:cursor-pointer"
          >
            Log Out
          </Button>
        </div>
      )}
    </div>
  ) : (
    <Link to="/roleSelection">
      <Button className="bg-red-500 hover:bg-primary/90 text-white cursor-pointer">Login</Button>
    </Link>
  )
}







            {/* )} */}

            <Button variant="ghost" size="icon" className={`md:hidden ${isHomePage ? "text-white" : "text-gray-700"}`}>
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;