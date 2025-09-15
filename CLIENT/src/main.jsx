// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )



import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import OrganizerContextProvider from './Contexts/OrganizerContext/OrganizerContext';
import AdminContextProvider from './Contexts/AdminContext/AdminContext';
import PlayerContextProvider from './Contexts/PlayerContext/PlayerContext';
import AppContextProvider from './Contexts/AppContext/AppContext';

import { ClerkProvider } from '@clerk/clerk-react'
// Live visitors: connect to backend via socket.io
import { io } from 'socket.io-client';
const socketBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
io(socketBackendUrl, { transports: ['websocket'] });

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
   <BrowserRouter> 
  <AppContextProvider>
   <AdminContextProvider>
    <OrganizerContextProvider>
     <PlayerContextProvider>
       <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
     </PlayerContextProvider>
    </OrganizerContextProvider>
   </AdminContextProvider>
  </AppContextProvider>
  </BrowserRouter>
  </QueryClientProvider>
)
