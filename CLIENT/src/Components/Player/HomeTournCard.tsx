import { Badge } from "@/Components/ui/badge";
import { MapPin, Calendar, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface TournamentCardProps {
  id: string | number;
  title: string;
  location: string;
  date: string;
  endDate?: string;
  ageGroups: string[];
  imageUrl: string;
  sport: string;
  description?: string;
}

const HomeTournCard = ({
  id,
  title,
  location,
  date,
  endDate,
  ageGroups,
  imageUrl,
  sport,
  description,
}: TournamentCardProps) => {
  return (
    <Link
      to={`/events/${id}`}
      state={{
        _id: id,
        title,
        location,
        date,
        endDate,
        ageGroups,
        imageUrl,
        sport,
        participants: 64,
        description,
      }}
      className="block"
    >
      <div className="w-[270px] h-[440px] border bg-card text-card-foreground shadow-md rounded-3xl overflow-hidden">
        <div className="w-full h-full transition-transform hover:scale-105">
          {/* Image */}
          <div className="relative w-full h-64 sm:h-64 md:h-64 overflow-hidden rounded-3xl">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover rounded-t-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-3xl" />
            <div className="absolute top-3 right-3">
              {/* <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </div> */}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Title - always 2 lines height */}
            <h3 className="text-lg font-bold mb-2 pb-3 leading-5 h-[2.5rem] overflow-hidden">
              {title}
            </h3>

            {/* Date */}
            <div className="text-xs text mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{date} {endDate && `- ${endDate}`}</span>
            </div>

            {/* Location */}
            <div className="text-xs text mb-2 flex items-center gap-1 w-full overflow-hidden">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>

            {/* Age Groups */}
            {/* <div className="flex flex-wrap gap-1 mt-2">
              {ageGroups.map((ageGroup, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-accent/20 text-accent-foreground border-accent/30 font-medium px-2 py-0.5 text-xs"
                >
                  {ageGroup}
                </Badge>
              ))}
            </div> */}
            <div className="mt-7 ">
              <Link
                to={`/events/${id}`}
                state={{
                  _id: id,
                  title,
                  location,
                  date,
                  endDate,
                  ageGroups,
                  imageUrl,
                  sport,
                  participants: 64,
                  description,
                }}
                className="flex w-full justify-between items-center bg-primary text-white text-md py-1.5 px-4 rounded-2xl shadow hover:bg-red-800 hover:scale-105 transition-all duration-300"
                >
                See Details
                <ArrowUpRight className="w-6 h-6 ml-2" />
              </Link>
            </div>



          </div>

        </div>
      </div>

    </Link>
  );
};

export default HomeTournCard;
