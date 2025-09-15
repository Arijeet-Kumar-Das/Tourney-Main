import TournamentCard from "@/Components/Player/TournamentCard";
import { Button } from "@/Components/ui/button";
import Footer from "@/Components/Footer";
import Navigation from "@/Components/Navigation";
import { useState, useEffect, useMemo, useContext } from "react";
import { PlayerContext } from "@/Contexts/PlayerContext/PlayerContext";
import { AppContext } from "@/Contexts/AppContext/AppContext";
import { toast } from "react-toastify";

// Event type definition
interface Event {
  _id: string;
  name: string;
  entryFee: number;
  maxTeams: number;
  numberOfParticipants: number;
  eventType: string;
  matchType: string;
}

// Tournament type definition
interface Tournament {
  id: string | number;
  title: string;
  location: string;
  date: string;
  endDate?: string;
  events: Event[];
  imageUrl: string;
  sport: string;
  description?: string;
  status?: string;
  isVerified?: boolean;
}

// PlayerContext type definition
interface PlayerContextType {
  backend_URL: string;
  isPlayerLoggedIn: boolean;
  setIsPlayerLoggedIn: (value: boolean) => void;
  playerData: any;
  setPlayerData: (value: any) => void;
  playerMail: string;
  setPlayerMail: (value: string) => void;
  getAuthStatusPlayer: () => Promise<void>;
}

// AppContext type definition
interface AppContextType {
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
}

// Format date with ordinal suffix (e.g., 1st, 2nd, 3rd, 4th)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  // Add ordinal suffix
  const ordinal = (d: number) => {
    if (d > 3 && d < 21) return `${d}th`;
    switch (d % 10) {
      case 1: return `${d}st`;
      case 2: return `${d}nd`;
      case 3: return `${d}rd`;
      default: return `${d}th`;
    }
  };
  
  return `${ordinal(day)} ${month} ${year}`;
};

// Parse date from formatted string (e.g., "9th February 2025")
const parseDate = (dateString: string) => {
  const months: { [key: string]: number } = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  
  const parts = dateString.split(' ');
  if (parts.length < 3) return new Date();
  
  const day = parseInt(parts[0].replace(/\D/g, ''));
  const month = months[parts[1]];
  const year = parseInt(parts[2]);
  
  return new Date(year, month, day);
};

// Add CSS for animations
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUpFade {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.7s ease forwards;
  }
  
  .animate-slide-up {
    animation: slideUpFade 0.7s ease forwards;
  }
  
  .delay-100 {
    animation-delay: 100ms;
  }
  
  .delay-200 {
    animation-delay: 200ms;
  }
  
  .delay-300 {
    animation-delay: 300ms;
  }
  
  .card-animation {
    opacity: 0;
    animation: fadeIn 0.5s ease forwards;
  }
`;

const Tournaments = () => {
  // Get context values
  const { backend_URL } = useContext(PlayerContext) as PlayerContextType;
  const { selectedLocation } = useContext(AppContext) as AppContextType;
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Upcoming' | 'Active' | 'Completed' | 'cancelled'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Add animation state
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    // Set page loaded to true after a short delay to trigger animations
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Helper function to fetch event details
    const fetchEventDetails = async (eventId: string) => {
      try {
        const response = await fetch(`${backend_URL}/api/player/events/${eventId}`);
        if (!response.ok) {
          console.error(`Failed to fetch event ${eventId}:`, response.status);
          return null;
        }
        const data = await response.json();
        return data.success ? data.message : null;
      } catch (error) {
        console.error(`Error fetching event ${eventId}:`, error);
        return null;
      }
    };

    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backend_URL}/api/player/tournaments/public`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('Raw API Response:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed API Response:', data);
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError);
          throw new Error('Invalid JSON response from server');
        }
        
        if (data.success) {
          console.log('Processing tournaments:', data.message.length, 'tournaments found');
          
          // Process all tournaments and their events
          const formattedTournaments = await Promise.all(
            data.message.map(async (tournament: any) => {
              console.log(`Processing tournament: ${tournament.name} with ${tournament.events?.length || 0} events`);
              
              // If no events, return early with empty events array
              if (!Array.isArray(tournament.events) || tournament.events.length === 0) {
                return {
                  id: tournament._id,
                  title: tournament.name,
                  location: tournament.location,
                  date: formatDate(tournament.startDate),
                  endDate: formatDate(tournament.endDate),
                  events: [],
                  imageUrl: tournament.coverImage,
                  sport: tournament.sport,
                  description: tournament.description,
                  status: tournament.status,
                  isVerified: tournament.isVerified
                };
              }
              
              // Fetch details for all events in parallel
              const eventPromises = tournament.events
                .filter((eventId: string) => typeof eventId === 'string')
                .map((eventId: string) => fetchEventDetails(eventId));
              
              const eventResults = await Promise.allSettled(eventPromises);
              const validEvents = eventResults
                .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);
              
              console.log(`Fetched ${validEvents.length} valid events for tournament: ${tournament.name}`, validEvents);
              
              // Process event data with proper fallbacks
              const processedEvents = validEvents.map((event: any) => ({
                _id: event._id,
                name: event.name || 'Unnamed Event',
                entryFee: event.entryFee || 0,
                maxTeams: event.maxTeams || 0,
                numberOfParticipants: event.numberOfParticipants || 0,
                eventType: event.eventType || 'knockout',
                matchType: event.matchType || 'knockout' // Default to 'knockout' if not provided
              }));
              
              return {
                id: tournament._id,
                title: tournament.name,
                location: tournament.location,
                date: formatDate(tournament.startDate),
                endDate: formatDate(tournament.endDate),
                events: processedEvents,
                imageUrl: tournament.coverImage,
                sport: tournament.sport,
                description: tournament.description,
                status: tournament.status,
                isVerified: tournament.isVerified
              };
            })
          );
          
          console.log('Formatted tournaments with events:', formattedTournaments);
          setTournaments(formattedTournaments);
        } else {
          console.error("API returned success:false", data);
          toast.error("Failed to load tournaments");
          // Fallback to demo data
          console.log('Falling back to demo data');
          setTournaments([
            {
              id: 1,
              title: "State Level Basketball Tournament",
              location: "Bangalore stadium", 
              date: "5th July 2025",
              endDate: "7th July 2025",
              events: [
                { _id: '1', name: 'Men\'s Singles', entryFee: 500, maxTeams: 32, numberOfParticipants: 24, eventType: 'knockout', matchType: 'knockout' },
                { _id: '2', name: 'Women\'s Singles', entryFee: 500, maxTeams: 24, numberOfParticipants: 16, eventType: 'knockout', matchType: 'knockout' },
                { _id: '3', name: 'Men\'s Doubles', entryFee: 800, maxTeams: 16, numberOfParticipants: 12, eventType: 'round-robin', matchType: 'round-robin' },
              ],
              imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
              sport: "Basketball",
              description: "# State Level Basketball Tournament\n\nJoin us for an exciting basketball tournament featuring teams from across the state. Multiple age categories available.\n\n## Tournament Format\n\n- Group stage followed by knockout rounds\n- Professional referees\n- State-of-the-art facilities\n\n## Prizes\n\nWinners will receive trophies and certificates."
            },
            {
              id: 2,
              title: "District Football Tournament",
              location: "Chennai stadium",
              date: "15th March 2025", 
              endDate: "17th March 2025",
              events: [
                { _id: '4', name: 'U-14 Boys', entryFee: 400, maxTeams: 20, numberOfParticipants: 16, eventType: 'knockout', matchType: 'knockout' },
                { _id: '5', name: 'U-16 Boys', entryFee: 500, maxTeams: 16, numberOfParticipants: 12, eventType: 'knockout', matchType: 'knockout' },
                { _id: '6', name: 'U-14 Girls', entryFee: 400, maxTeams: 16, numberOfParticipants: 10, eventType: 'knockout', matchType: 'knockout' },
              ],
              imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop",
              sport: "Football",
              description: "# District Football Tournament\n\nCompete in our annual district football tournament. Teams from across the region will participate in this prestigious event.\n\n## Tournament Details\n\n- League format followed by playoffs\n- Qualified referees\n- Multiple age categories\n\n## Awards\n\nChampionship trophies and individual awards for outstanding players."
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast.error("Error loading tournaments. Using demo data.");
        // Fallback to demo data with events
        setTournaments([
          {
            id: 1,
            title: "State Level Basketball Tournament",
            location: "Bangalore stadium", 
            date: "5th July 2025",
            endDate: "7th July 2025",
            events: [
              { _id: '1', name: 'Men\'s Singles', entryFee: 500, maxTeams: 32, numberOfParticipants: 24, eventType: 'knockout', matchType: 'knockout' },
              { _id: '2', name: 'Women\'s Singles', entryFee: 500, maxTeams: 24, numberOfParticipants: 16, eventType: 'knockout', matchType: 'knockout' },
              { _id: '3', name: 'Men\'s Doubles', entryFee: 800, maxTeams: 16, numberOfParticipants: 12, eventType: 'round-robin', matchType: 'round-robin' },
              { _id: '4', name: 'Mixed Doubles', entryFee: 700, maxTeams: 20, numberOfParticipants: 12, eventType: 'knockout', matchType: 'knockout' },
            ],
            imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
            sport: "Basketball",
            description: "# State Level Basketball Tournament\n\nJoin us for an exciting basketball tournament featuring teams from across the state. Multiple age categories available.\n\n## Tournament Format\n\n- Group stage followed by knockout rounds\n- Professional referees\n- State-of-the-art facilities\n\n## Prizes\n\nWinners will receive trophies and certificates."
          },
          {
            id: 2,
            title: "District Football Tournament",
            location: "Chennai stadium",
            date: "15th March 2025", 
            endDate: "17th March 2025",
            events: [
              { _id: '5', name: 'U-14 Boys', entryFee: 400, maxTeams: 20, numberOfParticipants: 16, eventType: 'knockout', matchType: 'knockout' },
              { _id: '6', name: 'U-16 Boys', entryFee: 500, maxTeams: 16, numberOfParticipants: 12, eventType: 'knockout', matchType: 'knockout' },
              { _id: '7', name: 'U-14 Girls', entryFee: 400, maxTeams: 16, numberOfParticipants: 10, eventType: 'knockout', matchType: 'knockout' },
              { _id: '8', name: 'U-16 Girls', entryFee: 400, maxTeams: 16, numberOfParticipants: 8, eventType: 'knockout', matchType: 'knockout' },
            ],
            imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop",
            sport: "Football",
            description: "# District Football Tournament\n\nCompete in our annual district football tournament. Teams from across the region will participate in this prestigious event.\n\n## Tournament Details\n\n- League format followed by playoffs\n- Qualified referees\n- Multiple age categories\n\n## Awards\n\nChampionship trophies and individual awards for outstanding players."
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [backend_URL]);

  const categorizeDate = (dateString: string) => {
    const tournamentDate = parseDate(dateString);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tournamentStart = new Date(tournamentDate.getFullYear(), tournamentDate.getMonth(), tournamentDate.getDate());
    
    if (tournamentStart < todayStart) return 'past';
    if (tournamentStart.getTime() === todayStart.getTime()) return 'ongoing';
    return 'upcoming';
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      const statusMatch = selectedStatus === 'all' || tournament.status === selectedStatus;
      const categoryMatch = selectedCategory === 'all' || tournament.sport?.toLowerCase() === selectedCategory.toLowerCase();
    const locationMatch = selectedLocation === 'all' || (tournament.location && tournament.location.toLowerCase().includes(selectedLocation.toLowerCase()));
      const searchMatch =
        searchTerm.trim() === '' ||
        tournament.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.sport?.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && categoryMatch && locationMatch && searchMatch;
    });
  }, [tournaments, selectedStatus, selectedCategory, selectedLocation, searchTerm]);

  const getFilterCount = (filter: 'all' | 'upcoming' | 'ongoing' | 'past') => {
    if (filter === 'all') return tournaments.length;
    return tournaments.filter(tournament => categorizeDate(tournament.date) === filter).length;
  };

  // Map through filtered tournaments and render TournamentCard for each
  const renderTournamentCards = () => {
    return filteredTournaments.map((tournament, index) => {
      // Ensure events is always an array
      const tournamentEvents = Array.isArray(tournament.events) ? tournament.events : [];
      
      return (
        <div 
          key={tournament.id} 
          className={`${pageLoaded ? 'animate-fade-in card-animation' : 'opacity-0'}`}
          style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
        >
          <TournamentCard
            id={tournament.id}
            title={tournament.title}
            location={tournament.location}
            date={tournament.date}
            endDate={tournament.endDate}
            events={tournamentEvents}
            imageUrl={tournament.imageUrl}
            sport={tournament.sport}
            description={tournament.description}
          />
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-gray-100">
      {/* Add the animation styles */}
      <style>{animationStyles}</style>
      
      <Navigation />
      <div className="container mx-auto px-4 py-8">
      
        <div className={`text-center mb-12 ${pageLoaded ? 'animate-fade-in' : 'opacity-0'}`}>
          
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent max-w-3xl mx-auto text-center leading-snug mb-8 mt-14">
            Unleash your potential — compete, connect, and conquer tournaments across disciplines!
          </p>
          <div className="w-full md:w-1/2 mx-auto">
  <input
    type="text"
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    placeholder="Search tournaments by name, location, or sport..."
    className="w-full px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
  />
</div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-4 text-muted-foreground">Loading tournaments...</p>
          </div>
        ) : (
          <>
            {/* Filter Buttons + Category Dropdown Row */}
            <div className={`flex flex-wrap justify-between items-center mb-8 max-w-6xl mx-auto px-4 ${pageLoaded ? 'animate-slide-up delay-100' : 'opacity-0'}`}>
              
              {/* Filters Group */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                {/* Search Bar */}
                <div className="flex flex-col md:flex-row w-full md:items-center md:gap-4">
                  <div className="flex gap-2 flex-wrap mb-2 md:mb-0">
                    <Button
                      variant={selectedStatus === 'all' ? 'default' : 'outline'}
                      onClick={() => setSelectedStatus('all')}
                      className="px-6 py-2"
                    >
                      All ({tournaments.length})
                    </Button>
                    <Button
                      variant={selectedStatus === 'Upcoming' ? 'default' : 'outline'}
                      onClick={() => setSelectedStatus('Upcoming')}
                      className="px-6 py-2"
                    >
                      Upcoming ({tournaments.filter(t => t.status === 'Upcoming').length})
                    </Button>
                    <Button
                      variant={selectedStatus === 'Active' ? 'default' : 'outline'}
                      onClick={() => setSelectedStatus('Active')}
                      className="px-6 py-2"
                    >
                      Active ({tournaments.filter(t => t.status === 'Active').length})
                    </Button>
                    <Button
                      variant={selectedStatus === 'Completed' ? 'default' : 'outline'}
                      onClick={() => setSelectedStatus('Completed')}
                      className="px-6 py-2"
                    >
                      Completed ({tournaments.filter(t => t.status === 'Completed').length})
                    </Button>
                  </div>
                  
                </div>
               
                
              </div>
              
              {/* Display current location filter if active */}
              {selectedLocation !== 'all' && (
                <div className="mt-2 md:mt-0 px-4 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium flex items-center">
                  <span>Location: {selectedLocation}</span>
                </div>
              )}
              
              <div className="mt-4 md:mt-0 flex gap-4 items-center">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-6 py-2 rounded-md focus:outline-none cursor-pointer
                  ${selectedCategory === 'all' ? 'bg-transparent text-red-500' : 'bg-transparent text-red-500'}
                `}
                >
                  
                  <option value="all">All Sports</option>
                  <option value="basketball">Basketball</option>
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                  <option value="badminton">Badminton</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Table Tennis">Table Tennis</option>
                  <option value="Chess">Chess</option>
                  <option value="Kabaddi">Kabaddi</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Archery">Archery</option>
                  <option value="Swimming">Swimming</option>
                </select>
                
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-6 max-w-2xl mx-auto ${pageLoaded ? 'animate-fade-in delay-200' : 'opacity-0'}`}>
              {renderTournamentCards()}
            </div>

            {filteredTournaments.length === 0 && (
              <div className={`text-center py-12 ${pageLoaded ? 'animate-fade-in delay-200' : 'opacity-0'}`}>
                <p className="text-muted-foreground text-lg">
                  No {selectedStatus === 'all' ? '' : selectedStatus} tournaments found
                  {selectedLocation !== 'all' ? ` in ${selectedLocation}` : ''}.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="py-8" />
      <Footer />
    </div>
  );
};

export default Tournaments;
