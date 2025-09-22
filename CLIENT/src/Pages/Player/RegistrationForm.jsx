import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { PlayerContext } from "@/Contexts/PlayerContext/PlayerContext";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";


const backend_URL = import.meta.env.VITE_BACKEND_URL;

const RegistrationForm = () => {
  const { backend_URL } = useContext(PlayerContext);
  const location = useLocation();
  const { tournamentId: urlTournamentId } = useParams();

  // State for events and loading
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Get tournament ID from URL or location state
  const TournamentId = urlTournamentId || location.state?.TournamentId;

  // Get event details from selected event or location state
  const eventName = selectedEvent?.name || selectedEvent?.eventName || location.state?.eventName || "Event";
  const entryFee = selectedEvent?.entryFee || location.state?.entryFee || 0;
  const eventId = selectedEvent?._id || location.state?.eventId;
  const navigate = useNavigate();

  const [customFields, setCustomFields] = useState([]);
  const [members, setMembers] = useState([
    {
      customFieldValues: {}
    }
  ]);
  const [errors, setErrors] = useState([{}]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");

  // Fetch events for the tournament
  useEffect(() => {
    const fetchEvents = async () => {
      if (!TournamentId) return;
      setLoadingEvents(true);
      try {
        const response = await fetch(`${backend_URL}/api/player/tournaments/${TournamentId}/events`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
          setEvents(data.message || []);
          // If there's an eventId in location state, select it
          // if (location.state?.eventId) {
          //   const event = data.message.find(e => e._id === location.state.eventId);
          //   if (event) setSelectedEvent(event);
          // }
        } else {
          toast.error("Failed to load events");
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Error loading events");
      } finally {
        setLoadingEvents(false);
      }
    };



    fetchEvents();
  }, [TournamentId, backend_URL, location.state?.eventId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Handle event selection
  const handleEventSelect = (eventId) => {
    if (!eventId) {
      setSelectedEvent(null);
      return;
    }
    const event = events.find(e => e._id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  // Auto-select first event when events are loaded
  // useEffect(() => {
  //   if (!selectedEvent && events.length > 0) {
  //     setSelectedEvent(events[0]);
  //   }
  // }, [events, selectedEvent]);

  // Fetch customFields from backend
  useEffect(() => {
    const fetchTournament = async () => {
      if (!TournamentId || !selectedEvent) {
        console.log('No TournamentId or selectedEvent'); // Debug log
        setLoading(false);
        return;
      }
      try {
        console.log('Fetching tournament data for:', TournamentId); // Debug log
        const res = await fetch(`${backend_URL}/api/player/tournaments/${TournamentId}`);
        const data = await res.json();
        console.log('Tournament data:', data); // Debug log
        if (data.success && data.message?.settings?.customFields) {
          console.log('Custom fields found:', data.message.settings.customFields); // Debug log
          setCustomFields(data.message.settings.customFields);
          // Reinitialize members with new custom fields
          setMembers(members => members.map(member => ({
            customFieldValues: data.message.settings.customFields.reduce((acc, field) => {
              acc[field.fieldName] = member.customFieldValues?.[field.fieldName] || "";
              return acc;
            }, {})
          })));

        } else {
          console.log('No custom fields found in response'); // Debug log
        }
      } catch (err) {
        toast.error("Failed to load tournament custom fields");
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, [TournamentId, selectedEvent, backend_URL]);

  const validate = () => {
    return members.map(member => {
      const memberErrors = {};
      customFields.forEach(field => {
        if (field.isMandatory && !member.customFieldValues[field.fieldName]?.trim()) {
          memberErrors[field.fieldName] = `${field.fieldName} is required`;
        }
      });
      return memberErrors;
    });
  };
  

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = {
        customFieldValues: {
          ...updated[index].customFieldValues,
          [name]: value
        }
      };
      return updated;
    });
  };
  

  const addMember = () => {
    setMembers(prev => [
      ...prev,
      {
        customFieldValues: customFields.reduce((acc, field) => {
          acc[field.fieldName] = "";
          return acc;
        }, {})
      }
    ]);
    setErrors(prev => [...prev, {}]);
  };

  const removeMember = (index) => {
    if (members.length > 1) {
      const updatedMembers = [...members];
      updatedMembers.splice(index, 1);
      setMembers(updatedMembers);

      const updatedErrors = [...errors];
      updatedErrors.splice(index, 1);
      setErrors(updatedErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Full form validation before payment
    const validationErrors = validate();
    setErrors(validationErrors);
    const hasErrors = validationErrors.some(error => Object.keys(error).length > 0);
    if (hasErrors) {
      toast.error('Please fix all form errors before proceeding to payment.');
      return;
    }

    // Validate team name for group registration before payment
    if (members.length > 1 && (!teamName || !teamName.trim())) {
      toast.error('Team name is required for group registration.');
      return;
    }

    if (entryFee <= 0) {
      await submitRegistration();
      return;
    }

    try {
      setLoading(true);

      // 1. Create order on server
      const paymentAmount = entryFee * members.length;

      console.log('Frontend - Sending payment request:', {
        amount: paymentAmount,
        members: members.length,
        backend_URL
      });

      const orderResponse = await fetch(`${backend_URL}/api/payments/create-order`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          eventId,
          teamName: teamName || null,
          members: members.map(m => ({
            
            customFields: m.customFieldValues
          }))
        })
      });

      const orderData = await orderResponse.json();
      console.log('Frontend - Received order response:', {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        data: orderData,
        headers: Object.fromEntries(orderResponse.headers.entries())
      });

      if (orderResponse.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        // Redirect to login
        window.location.href = '/login/player?sessionExpired=true';
        return;
      }

      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // 2. Initialize Razorpay
      console.log('Order data received:', orderData);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount, // Access amount from order object
        currency: orderData.order.currency, // Access currency from order object
        order_id: orderData.order.id, // Access id from order object
        name: 'Tourney',
        description: `Registration for ${eventName}`,
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyResponse = await fetch(`${backend_URL}/api/payments/verify`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                eventId,
                teamName: teamName || null,
                members: members.map(m => ({
                  
                  customFields: m.customFieldValues
                }))
              })
            });
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.message || 'Verification failed');
            }
            await submitRegistration();
          } catch (error) {
            console.error('Payment error:', error);
            toast.error(`Payment failed: ${error.message}`);
            setLoading(false);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: members[0]?.name || '',
          email: members[0]?.email || '',
          contact: members[0]?.mobile || ''
        },
        theme: { color: '#F37254' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment failed or was cancelled. Please try again.");
          }
        }
      };

      // Load Razorpay script if needed
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => new window.Razorpay(options).open();
        document.body.appendChild(script);
      } else {
        new window.Razorpay(options).open();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Payment processing failed');
      setLoading(false);
    }
  };

  // Registration API logic only
  const submitRegistration = async () => {
    let allSuccess = true;
    let errorMsg = '';

    try {
      setLoading(true);
      const validationErrors = validate();
      setErrors(validationErrors);

      const hasErrors = validationErrors.some(error => Object.keys(error).length > 0);
      if (hasErrors) {
        setLoading(false);
        return;
      }

      if (!TournamentId || !eventId) {
        alert("Tournament or Event ID missing!");
        setLoading(false);
        return;
      }

      let allSuccess = true;
      let errorMsg = '';

      if (members.length > 1) {
        // Group registration
        if (!teamName || !teamName.trim()) {
          toast.error("Team name is required for group registration.");
          setLoading(false);
          return;
        }
        const membersPayload = members.map(member => ({
          
          customFields: member.customFieldValues,
          entry: 'online'
        }));
        try {
          const res = await fetch(
            `${backend_URL}/api/player/registerGroupTeam/${TournamentId}/${eventId}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teamName, members: membersPayload, entry: 'online' }),
              credentials: 'include',
            }
          );
          const data = await res.json();
          if (!data.success) {
            allSuccess = false;
            errorMsg = data.message || 'Group registration failed.';
          }
        } catch (err) {
          allSuccess = false;
          errorMsg = err.message || 'Network error during group registration.';
          setLoading(false);
        }
      } else {
        // Individual registration (keep previous logic)
        const member = members[0];
        const payload = {
          
          customFields: member.customFieldValues,
          entry: 'online'
        };
        try {
          const res = await fetch(
            `${backend_URL}/api/player/registerIndividualTeam/${TournamentId}/${eventId}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              credentials: 'include',
            }
          );
          const data = await res.json();
          if (!data.success) {
            allSuccess = false;
            errorMsg = data.message || 'Registration failed.';
          }
        } catch (err) {
          allSuccess = false;
          errorMsg = err.message || 'Network error during registration.';
        }
      }

      if (allSuccess) {
        toast.success('Registration submitted successfully!');
        setTimeout(() => {
          navigate('/tournaments');
        });
      } else {
        console.log("Error in registration:", errorMsg);
        toast.error(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Navigation />
      <main className="flex-grow flex items-center justify-center pt-30 pb-12">
        <Card className="w-full max-w-2xl rounded-2xl shadow-lg p-0 mx-4">
          <div className="bg-red-500 text-white py-4 px-6 rounded-t-2xl text-center">
            <h2 className="text-2xl font-bold">
              {selectedEvent ? `Register for ${eventName}` : "Select an Event"}
            </h2>
          </div>
          <CardContent className="p-8">


            {/* Event Selection Dropdown */}
            <div className="mb-6">
              <label className="block text-lg md:text-xl font-medium text-gray-700 mb-2">
                Select Event
              </label>
              <select
                onChange={(e) => handleEventSelect(e.target.value)}
                value={selectedEvent?._id || ""}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingEvents || events.length === 0}
              >
                <option value="">Select an event...</option>
                {events.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.name || event.eventName} (₹{event.entryFee || "0"})
                  </option>
                ))}
              </select>
            </div>

            {/* Empty State */}
            {!selectedEvent ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="flex flex-col items-center space-y-2">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 font-medium">
                    Please select an event to continue
                  </p>
                </div>
              </div>
            ) : loading ? (
              // Loading State
              <div className="flex flex-col justify-center items-center h-48 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                <p className="text-sm text-gray-500">Loading registration form...</p>
              </div>
            ) : (
              // Registration Form
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Team Name (for group registration) */}
                

                {members.map((member, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition hover:scale-[1.01]"
                  >
                    {/* 🔴 Member Header Bar */}
                    <div className="bg-red-500 text-white px-4 py-2 flex justify-between items-center">
                      <h3 className="font-semibold">Member {index + 1}</h3>
                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="text-white hover:text-gray-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="p-5 space-y-4">
                  

                      {/* Custom Fields */}
                      {customFields.map((field) => (
                        <div key={field.fieldName}>
                          <label className="block text-sm font-medium mb-1">
                            {field.fieldName}
                            {field.isMandatory && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            name={field.fieldName}
                            value={member.customFieldValues[field.fieldName] || ""}
                            onChange={(e) => handleChange(index, e)}
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder={field.hintText || `Enter ${field.fieldName}`}
                          />
                          {errors[index]?.[field.fieldName] && (
                            <p className="text-red-500 text-xs mt-1">{errors[index][field.fieldName]}</p>
                          )}
                        </div>
                      ))}

                    </div>
                  </div>
                ))}

                {/* Add Member Button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={addMember}
                    variant="outline"
                    className="border border-dashed border-gray-300 hover:border-red-500 text-gray-600 hover:text-red-500 rounded-lg px-4 py-2 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Member
                  </Button>
                </div>
                {members.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">
                      Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="teamName"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter team name"
                    />
                  </div>
                )}

                {/* Entry Fee Display */}
                <div className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-lg">
                  <span className="font-medium text-gray-700">Total Entry Fee</span>
                  <span className="font-semibold text-red-500 text-lg">
                    ₹{(entryFee * members.length).toLocaleString()}
                  </span>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-primary/90"
                >
                  Submit Registration
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default RegistrationForm;
