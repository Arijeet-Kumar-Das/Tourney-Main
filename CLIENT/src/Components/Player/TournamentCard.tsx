import { Badge } from "@/Components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
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
}

const TournamentCard = ({
  id,
  title,
  location,
  date,
  endDate,
  events = [], // Default to empty array
  imageUrl,
  sport,
  description
}: TournamentCardProps) => {
  // Debug log to check events data
  console.log(`Tournament: ${title}`, { 
    events,
    eventsLength: events?.length,
    firstEvent: events?.[0],
    eventsTypes: events?.map(e => ({
      name: e?.name,
      type: e?.eventType,
      entryFee: e?.entryFee,
      participants: e?.numberOfParticipants,
      maxTeams: e?.maxTeams
    }))
  });
  
  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];
  
  // Log the first event's structure for debugging
  if (safeEvents.length > 0) {
    console.log('First event structure:', {
      keys: Object.keys(safeEvents[0]),
      values: Object.values(safeEvents[0])
    });
  }
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
        participants: 64,
        description
      }}
      className="block h-full"
    >
      <div className="flex flex-col md:flex-row h-full overflow-hidden rounded-lg border border-red-200 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-tournament-hover hover:scale-[1.02] border-border shadow-tournament p-7">

        {/* Image Section - Left side */}
        <div className="relative w-full md:w-1/2 h-72 sm:h-70 md:h-80 lg:h-[20rem] xl:h-[25rem] rounded-lg overflow-hidden">

          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-primary text-primary-foreground font-medium">
              {sport}
            </Badge>
          </div>
        </div>

        {/* Content Section - Right side */}
        <div className="flex flex-col flex-1 p-6 justify-between">
          <div>
            <h3 className="text-xl font-bold text-card-foreground text-primary mb-3 line-clamp-2">
              {title}
            </h3>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{location}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  {date} {endDate && `- ${endDate}`}
                </span>
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Events</h4>
            {safeEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events available</p>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {safeEvents.slice(0, 4).map((event) => (
                <div 
                  key={event._id} 
                  className="bg-gradient-to-br from-red-400 to-red-500 dark:from-gray-800 dark:to-gray-900 p-3 rounded-4xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <h5 className="font-medium text-sm text-white dark:text-gray-100 text-center">
                    {event.name || 'Event Name'}
                  </h5>
                </div>
              ))}
              {safeEvents.length > 4 && (
                <div className="text-center text-sm text-muted-foreground col-span-full mt-2">
                  +{safeEvents.length - 4} more events
                </div>
              )}
            </div>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
};

export default TournamentCard;
