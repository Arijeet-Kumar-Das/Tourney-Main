import { Badge } from "@/Components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
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
<div className="w-[350px] h-[420px] rounded-2xl overflow-hidden border bg-card text-card-foreground shadow-md hover:shadow-lg transition-transform hover:scale-105">
        {/* Image */}
        <div className="relative w-full h-48 sm:h-56 md:h-64">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-3 right-3">
            {/* Optional: like/heart icon */}
            <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
          <div className="text-sm font-medium mb-2">{date} {endDate && `- ${endDate}`}</div>
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {location}
          </div>

          {/* Age Groups */}
          <div className="flex flex-wrap gap-1 mt-2">
            {ageGroups.map((ageGroup, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-accent/20 text-accent-foreground border-accent/30 font-medium px-2 py-0.5 text-xs"
              >
                {ageGroup}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HomeTournCard;
