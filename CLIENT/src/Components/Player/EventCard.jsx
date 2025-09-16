import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { PlayerContext } from "@/Contexts/PlayerContext/PlayerContext";
import { toast } from "react-toastify";

const EventCard = ({
  name,
  fee,
  participants,
  icon,
  tournamentId,
  eventId,
  sport, // Added sport prop
  showFixtureButton = true,
}) => {
  const navigate = useNavigate();
  const { isPlayerLoggedIn } = useContext(PlayerContext);

  const handleRegister = () => {
    // Temporarily disabled login check to allow registration form editing
    if (!isPlayerLoggedIn) {
      toast.info("Please sign in to register for events.");
      navigate("/login/player");
      return;
    }

    // Always proceed to registration for now (temporarily bypassing auth check)
    navigate("/register", {
      state: {
        eventName: name,
        entryFee: fee,
        TournamentId: tournamentId,
        eventId: eventId,
      },
    });
  };

  const handleViewFixture = () => {
    // No auth checks here; allow all users to view fixtures
    navigate("/fixtures", { state: { eventName: name, tournamentId, eventId } });
  };


  return (
    <Card className="mb-8 w-full max-w-3xl mx-auto shadow-md border border-gray-200 flex flex-col">
      <CardContent className="px-6 py-2 flex flex-col">
        <div className="flex items-center justify-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Click here to register</h3>
          
          {/* {sport && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {sport}
            </span>
          )} */}
        </div>

        {/* <div className="space-y-2 text-gray-700 mb-6">
          <div className="flex justify-between">
            <span>Entry Fee:</span>
            <span className="font-medium">₹{fee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Participants:</span>
            <span className="font-medium">{participants} </span>
          </div>
        </div> */}

        <div className="flex flex-col gap-2">
          {!showFixtureButton && (
            <Button
              className="w-auto mx-auto bg-red-500 lg:text-2xl text-md hover:bg-red-800 text-white lg:p-7 p-3 rounded-full hover:scale-105 cursor-pointer transition-all duration-300"
              onClick={handleRegister}
            >
              Register Now
            </Button>
          )}
          {showFixtureButton && (
            <Button
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-blue-50 py-2 rounded-full cursor-pointer"
              onClick={handleViewFixture}
            >
              View Fixture
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
