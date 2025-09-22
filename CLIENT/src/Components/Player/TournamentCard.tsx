import { Badge } from "@/Components/ui/badge";
import { MapPin, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface Event {
  _id: string;
  name: string;
  entryFee: number;
  maxTeams: number;
  numberOfParticipants: number;
  eventType: string;
  matchType: string;
}

interface TournamentCardProps {
  id: string | number;
  title: string;
  location: string;
  date: string;
  endDate?: string;
  events?: Event[];
  imageUrl: string;
  sport: string;
  description?: string;
  status?: string; // Can be 'upcoming', 'ongoing', 'completed', or any other status from the database
}

const sportColors: Record<string, { bg: string; text: string }> = {
  Cricket: { bg: "bg-green-100", text: "text-green-700" },
  Football: { bg: "bg-blue-100", text: "text-blue-700" },
  Badminton: { bg: "bg-amber-100", text: "text-amber-700" },
  Tennis: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Hockey: { bg: "bg-orange-100", text: "text-orange-700" },
  default: { bg: "bg-gray-100", text: "text-gray-700" }
};


const TournamentCard = ({
  id,
  title,
  location,
  date,
  endDate,
  events = [],
  imageUrl,
  sport,
  description,
  status
}: TournamentCardProps) => {
  const safeEvents = Array.isArray(events) ? events : [];

  return (
    <Link
      to={`/events/${id}`}
      state={{
        _id: id,
        title,
        location,
        date,
        endDate,
        events,
        imageUrl,
        sport,
        description
      }}
      className="block"
    >
      <div
  className="
    flex flex-row md:flex-row
    border rounded-xl shadow-md overflow-hidden 
    hover:shadow-lg transition-all duration-300 
    bg-white dark:bg-gray-900
    w-full max-w-2xl md:max-w-4xl 
    h-auto md:h-[30rem] hover:scale-105 transition-all
  "
>
  {/* Left Poster Image */}
<div className="relative w-28 h-28 sm:w-40 sm:h-40 md:w-1/2 md:h-full flex-shrink-0">
  <img
    src={imageUrl}
    alt={title}
    className="w-full h-full object-cover rounded-xl sm:rounded-xl md:rounded-none"
  />

  {/* Overlay status badge */}
  <div className="absolute top-2 left-2 flex flex-wrap gap-1 sm:gap-2">
    <Badge
      variant="secondary"
      className={`${
        status === "completed" || status === "Completed"
          ? "bg-gray-500 hover:bg-gray-600"
          : status === "ongoing" || status === "Ongoing"
          ? "bg-yellow-500 hover:bg-yellow-600"
          : status === "cancelled" || status === "Cancelled"
          ? "bg-red-400 hover:bg-red-400"
          : "bg-blue-500 hover:bg-blue-600"
      } text-white text-[10px] sm:text-sm capitalize p-1 px-2 rounded-xl`}
    >
      {status || "Upcoming"}
    </Badge>
  </div>

  {/* Sport badge for md+ only */}
  <div className="absolute top-2 right-2 hidden md:block">
    <Badge
      variant="secondary"
      className={`${
        sportColors[sport]?.bg || sportColors.default.bg
      } ${sportColors[sport]?.text || sportColors.default.text} 
      text-[10px] sm:text-sm p-1 px-2 rounded-xl`}
    >
      {sport}
    </Badge>
  </div>
</div>

{/* Right Content */}
<div className="flex flex-col flex-1 p-3 sm:p-6">
  {/* Title */}
  <h3 className="text-base sm:text-lg md:text-lg lg:text-2xl font-bold text-black mb-2 line-clamp-2 capitalize">
    {title}
  </h3>

  {/* Sport badge for mobile only */}
  <div className="mb-2 md:hidden">
    <Badge
      variant="secondary"
      className={`${
        sportColors[sport]?.bg || sportColors.default.bg
      } ${sportColors[sport]?.text || sportColors.default.text} 
      text-[10px] sm:text-sm p-1 px-2 rounded-xl`}
    >
      {sport}
    </Badge>
  </div>


    {description && (
      <p className="text-xs sm:text-sm md:text-sm lg:text-md text-muted-foreground mb-2 sm:mb-4 line-clamp-2">
        {description}
      </p>
    )}

    {/* Location */}
    <div className="flex items-start gap-2 sm:gap-4 text-muted-foreground text-xs sm:text-sm md:text-sm lg:text-md mb-2 sm:mb-4">
      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="font-semibold whitespace-normal break-words text-black line-clamp-2">
        {location}
      </span>
    </div>

    {/* Dates */}
    <div className="flex items-start gap-2 sm:gap-4 text-muted-foreground text-xs sm:text-sm md:text-sm lg:text-md mb-2 sm:mb-4">
      <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="font-semibold whitespace-normal break-words text-black">
        {date} {endDate && `- ${endDate}`}
      </span>
    </div>

    {/* Events */}
    <div className="flex items-start gap-2 sm:gap-4 text-muted-foreground text-xs sm:text-sm md:text-sm lg:text-md mb-2 sm:mb-4">
      <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex flex-col">
        <h4 className="font-semibold text-xs sm:text-sm md:text-sm lg:text-md font-medium text-black mb-1">
          Events
        </h4>
        {safeEvents.length === 0 ? (
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            No events available
          </p>
        ) : (
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {safeEvents.slice(0, 3).map((event) => (
              <Badge
                key={event._id}
                className="flex items-center justify-center font-semibold bg-gray-100 rounded-full text-black dark:bg-gray-800 dark:text-gray-200 outline outline-1 outline-gray-400 text-[10px] sm:text-xs px-2 py-1"
              >
                {event.name}
              </Badge>
            ))}
            {safeEvents.length > 3 && (
              <span className="flex text-[10px] sm:text-xs lg:text-md text-muted-foreground justify-center items-center">
                +{safeEvents.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Footer */}
    <div className="mt-auto pt-2 sm:pt-4 border-t flex items-center justify-between">
      <p className="text-xs sm:text-sm md:text-md lg:text-lg font-bold text-gray-900 dark:text-gray-300">
        Total Events:{" "}
        <span className="font-semibold text-grey-900 dark:text-white">
          {safeEvents.length}
        </span>
      </p>
      <Badge
        variant="outline"
        className="rounded-full text-grey-600 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-1"
      >
        {sport}
      </Badge>
    </div>
  </div>
</div>

    </Link>
  );
};

export default TournamentCard;
