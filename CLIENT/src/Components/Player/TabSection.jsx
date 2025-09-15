import React, { useState } from "react";

import EventCard from "@/components/Player/EventCard";
import FixturesCard from "@/components/Player/FixturesCard";
import MatchesTab from "@/components/Player/MatchesTab";
import OverviewEventCountdown from "@/components/Player/OverviewEventCountdown";

import { marked } from 'marked';

const TabSection = ({ tournament, selectedEvent, description, events = [] }) => {
  const [activeTab, setActiveTab] = useState("Overview");

  const tabs = ["Overview", "Fixtures", "Matches"];

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
      <div className="flex w-full border-b border-red-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center font-semibold focus:outline-none transition-all duration-200
              py-2 sm:py-2 md:py-3 
              text-base sm:text-lg md:text-xl
              ${activeTab === tab
                ? 'bg-red-600 text-white rounded-tl-lg rounded-tr-lg shadow-sm z-10 -mb-[2px]'
                : 'bg-transparent text-black hover:bg-red-50'}
            `}
            style={{ borderBottom: activeTab === tab ? '4px solid #e11d48' : 'none' }}
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
                    showFixtureButton={false}
                  />
):(
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
                  fee={event.fee}
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
        
      </div>
    </div>
  );
};

export default TabSection;
