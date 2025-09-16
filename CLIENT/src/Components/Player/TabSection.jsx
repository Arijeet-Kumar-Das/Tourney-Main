import React, { useState, useEffect } from "react";
import EventCard from "@/components/Player/EventCard";
import FixturesCard from "@/components/Player/FixturesCard";
import MatchesTab from "@/components/Player/MatchesTab";
import OverviewEventCountdown from "@/components/Player/OverviewEventCountdown";

import { marked } from 'marked';

const TabSection = ({ tournament, selectedEvent, description, events = [] }) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = ["Overview", "Fixtures", "Matches", "Players"];

  useEffect(() => {
    const fetchPlayers = async () => {
      if (activeTab === 'Players' && tournament?._id) {
        setIsLoading(true);
        try {
          const apiUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/player/tournaments/${tournament._id}/players`;
          console.log('Fetching players from:', apiUrl);

          const response = await fetch(apiUrl, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          });

          console.log('Response status:', response.status);

          // First, check the content type to ensure it's JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Expected JSON but got:', text.substring(0, 200));
            throw new Error('Server returned non-JSON response. You might need to log in.');
          }

          const data = await response.json();
          console.log('Response data:', data);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          if (data.success) {
            console.log('Players data received:', data.players);
            setPlayers(data.players || []);
          } else {
            throw new Error(data.message || 'Failed to fetch players');
          }
        } catch (error) {
          console.error('Error fetching players:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPlayers();
  }, [activeTab, tournament?._id]);

  // Add null check for selectedEvent and ensure required fields exist
  if (!selectedEvent) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Select an event to view details</p>
      </div>
    );
  }

  // Ensure we have default values for required fields
  const safeEvent = {
    ...selectedEvent,
    numberOfParticipants: selectedEvent.numberOfParticipants || 0,
    maxTeams: selectedEvent.maxTeams || 0,
    participants: selectedEvent.participants || 0,
    fee: selectedEvent.fee || 0,
    name: selectedEvent.name || 'Unnamed Event',
    icon: selectedEvent.icon || '🏆'
  };

  console.log("Event data:", safeEvent);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex w-full border-b-4 border-red-600 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center font-semibold focus:outline-none transition-all duration-200
              py-2 sm:py-2 md:py-3 
              text-base sm:text-lg md:text-xl
              ${activeTab === tab
                ? 'bg-red-600 text-white rounded-tl-3xl rounded-tr-3xl  shadow-sm z-10 -mb-[2px] cursor-pointer transition-all duration-800'
                : 'bg-transparent text-black hover:bg-red-100 rounded-tl-3xl rounded-tr-3xl cursor-pointer hover:text-red-600'}
            `}
            // style={{ borderBottom: activeTab === tab ? '3xl solid #e11d48' : 'none' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 text-gray-700">
        {activeTab === "Overview" && (
          <>
            <h2 className="text-2xl font-bold mb-2">About this Tournament</h2>
            <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: marked(description || '') }} />
            {selectedEvent && (
              <>
                <div className="flex justify-center mb-8">
                  <OverviewEventCountdown tournamentId={tournament?._id} eventId={safeEvent.id} />
                </div>

                <div className="w-full max-w-sm mx-auto text-center">

                  {safeEvent.numberOfParticipants < safeEvent.maxTeams ? (
                    <EventCard
                      name={safeEvent.name}
                      fee={safeEvent.fee}
                      participants={safeEvent.participants}
                      icon={safeEvent.icon}
                      tournamentId={tournament?._id}
                      eventId={safeEvent.id}
                      sport={tournament?.sport}  // Pass the sport name from tournament
                      showFixtureButton={false}
                    />
                  ) : (
                    <span className="text-red-600 font-bold">Registration Closed</span>
                  )
                  }
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "Fixtures" && (
          <div className="grid grid-cols-1 gap-6">
            {events.length > 0 ? (
              events.map((event, idx) => (
                <FixturesCard
                  key={event.id || idx}
                  name={event.name}
                  fee={event.entryFee}
                  participants={event.participants}
                  icon={event.icon}
                  tournamentId={tournament?._id}
                  tournamentSport={tournament?.sport}
                  eventId={event.id}
                  eventType={event.eventType}
                  showFixtureButton={true}
                />
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">No events found for this tournament.</p>
            )}
          </div>
        )}
        {activeTab === "Matches" && selectedEvent && (
          <MatchesTab tournamentId={tournament?._id} eventId={selectedEvent.id} />
        )}

        {activeTab === "Players" && (
          <div className="py-4">
            <h2 className="text-2xl font-bold mb-6">Registered Players</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rondued-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : players.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {players.map((player, index) => (
                  <div key={player._id || index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                      {/* Left: Avatar + Name + Team */}
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                          {player.name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div className="capitalize">
                          <h3 className="font-medium text-gray-900">{player.name || 'Player'}</h3>
                          {player.teamName && (
                            <p className="text-sm text-gray-500">{player.teamName}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Event Name */}
                      {player.event && (
                        <div className="text-right text-sm text-gray-400 border bg-red-600 text-white rounded-lg px-2 py-1 capitalize">
                          {player.event}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No players registered yet</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TabSection;
