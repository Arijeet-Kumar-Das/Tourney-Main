// Centralised API helpers for Fixtures-related calls only

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const defaultFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

export const fetchEvents = async (tournamentId) => {
  const data = await defaultFetch(
    `${BASE_URL}/api/organizer/allEvents/${tournamentId}`
  );
  // BE returns { success: true, message: [events] }
  if (Array.isArray(data?.message)) return data.message;
  if (Array.isArray(data?.events)) return data.events;
  return [];
};

export const fetchTeams = async (tournamentId, eventId) => {
  const url = new URL(
    `${BASE_URL}/api/organizer/fixtures/${tournamentId}/teams`
  );
  if (eventId) url.searchParams.append("eventId", eventId);
  const { teams } = await defaultFetch(url.toString());
  return teams;
};

export const fetchFixtures = async (tournamentId, eventId) => {
  const url = new URL(`${BASE_URL}/api/organizer/fixtures/${tournamentId}`);
  if (eventId) url.searchParams.append("eventId", eventId);
  const { fixtures } = await defaultFetch(url.toString());
  return fixtures;
};

export const generateFixtures = async (tournamentId, eventId) => {
  const body = eventId ? { eventId } : {};
  const { fixtures } = await defaultFetch(
    `${BASE_URL}/api/organizer/fixtures/${tournamentId}/generate`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return fixtures;
};

export const fetchStandings = async (tournamentId, eventId) => {
  const url = new URL(`${BASE_URL}/api/organizer/fixtures/${tournamentId}/standings`);
  if (eventId) url.searchParams.append("eventId", eventId);
  const { standings } = await defaultFetch(url.toString());
  return standings;
};

export const generateKnockout = async (tournamentId, eventId, qualifiers = 4) => {
  const body = { eventId, qualifiers };
  const { fixtures } = await defaultFetch(
    `${BASE_URL}/api/organizer/fixtures/${tournamentId}/generate-knockout`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return fixtures;
};

export const deleteTeam = async (teamId) => {
  await defaultFetch(`${BASE_URL}/api/organizer/teams/${teamId}`, {
    method: "DELETE",
  });
};

// Delete knockout fixtures for a tournament (optionally filtered by event)
export const deleteKnockoutFixtures = async (tournamentId, eventId) => {
  if (!tournamentId) throw new Error("Tournament ID required");
  const url = new URL(`${BASE_URL}/api/organizer/fixtures/${tournamentId}/knockout`);
  if (eventId) url.searchParams.append("eventId", eventId);
  await defaultFetch(url.toString(), { method: "DELETE" });
};

// Delete fixture by ID
export const deleteFixture = async (fixtureId) => {
  await defaultFetch(`${BASE_URL}/api/organizer/fixtures/fixture/${fixtureId}`, {
    method: "DELETE",
  });
};

export const updateFixture = async (fixtureId, payload) => {
  const { fixture } = await defaultFetch(
    `${BASE_URL}/api/organizer/fixtures/fixture/${fixtureId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
  return fixture;
};

export const createFixture = async (fixtureData) => {
  const { tournamentId, ...restData } = fixtureData;
  if (!tournamentId) {
    throw new Error("Tournament ID is required");
  }
  const { fixture } = await defaultFetch(
    `${BASE_URL}/api/organizer/fixtures/${tournamentId}/create`,
    {
      method: "POST",
      body: JSON.stringify(restData),
    }
  );
  return fixture;
};

// NEW: Fetch single fixture by ID
export const fetchFixture = async (fixtureId) => {
  const { fixture } = await defaultFetch(
    `${BASE_URL}/api/organizer/fixtures/fixture/${fixtureId}`,
    {
      method: "GET",
    }
  );
  return fixture;
};



export const fetchMatchFixtures = async (tournamentId, eventId) => {
  if (!eventId) throw new Error("Event ID required for public fixture fetch");
  const url = new URL(`${BASE_URL}/api/player/events/${eventId}/fixtures`);
  const res = await defaultFetch(url.toString());
  return res.fixtures;
};


export const fetchTournamentDetails = async (tournamentId) => {
  const url = `${BASE_URL}/api/player/tournaments/${tournamentId}`;
  const data = await defaultFetch(url);
  // BE returns { success: true, message: { ...tournamentData } }
  return data.message;
};