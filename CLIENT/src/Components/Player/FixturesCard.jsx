import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { PlayerContext } from "@/Contexts/PlayerContext/PlayerContext";
import { toast } from "react-toastify";

const FixturesCard = ({
  name,
  fee,
  participants,
  icon,
  tournamentId,
  tournamentSport,
  eventId,
  eventType,
  showFixtureButton = true,
}) => {
  const navigate = useNavigate();
  const { isPlayerLoggedIn } = useContext(PlayerContext);

  const handleRegister = () => {
    if (!isPlayerLoggedIn) {
      toast.info("Please sign in to register for events.");
      navigate("/login/player");
      return;
    }
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
    navigate("/fixtures", { state: { eventName: name, tournamentId, eventId } });
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-[2rem] border border-[#e11d48] overflow-hidden mb-6 bg-white shadow-md">
      <div className="flex justify-between items-center bg-[#e11d48] text-white px-8 py-3">
        <span className="font-bold text-lg">{tournamentSport || icon || name?.split(' ')[0]}</span>
        <span className="font-semibold text-base">{eventType?.charAt(0).toUpperCase() + eventType?.slice(1)}</span>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 gap-4">
        <div className="flex flex-col items-start">
          <span className="text-2xl md:text-3xl font-extrabold text-black mb-1">{name}</span>
          <span className="text-gray-500 font-semibold text-lg">{participants} entries</span>
        </div>
        {showFixtureButton && (
          <button
            onClick={handleViewFixture}
            className="border-2 border-[#e11d48] text-[#e11d48] font-bold rounded-2xl px-10 py-3 text-lg hover:bg-[#e11d48]/10 transition"
          >
            Fixtures
          </button>
        )}
      </div>
    </div>
  );
};

export default FixturesCard;
