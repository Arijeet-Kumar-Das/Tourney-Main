import React, { useEffect, useState, useContext, useRef } from 'react';
import { PlayerContext } from '../Contexts/PlayerContext/PlayerContext';
import { ArrowLeft, ArrowRight } from "lucide-react";
import HomeTournCard from "../Components/Player/HomeTournCard";
import { IoChevronForward } from "react-icons/io5";
import { Link } from "react-router-dom";

const MAX_VISIBLE = 6;

const HomeTournamentsSection = () => {
  const { backend_URL } = useContext(PlayerContext);
  const [tournaments, setTournaments] = useState([]);
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [featuredCanScrollLeft, setFeaturedCanScrollLeft] = useState(false);
  const [featuredCanScrollRight, setFeaturedCanScrollRight] = useState(false);

  const scrollRef = useRef(null);
  const featuredScrollRef = useRef(null);

  const updateArrows = (ref, setLeft, setRight) => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setLeft(scrollLeft > 0);
    setRight(scrollLeft + clientWidth < scrollWidth - 1); // -1 for rounding
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch(`${backend_URL}/api/player/tournaments/public`, { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          const formatted = data.message.map(tournament => ({
            id: tournament._id,
            title: tournament.name,
            location: tournament.location,
            date: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            endDate: tournament.endDate ? new Date(tournament.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            ageGroups: tournament.events?.map(e => e.ageGroup) || [],
            imageUrl: tournament.coverImage,
            sport: tournament.sport,
            description: tournament.description,
            isFeatured: tournament.isFeatured,
          }));
          setTournaments(formatted);
          setFeaturedTournaments(formatted.filter(t => t.isFeatured));
        }
      } catch (err) {
        setTournaments([]);
        setFeaturedTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, [backend_URL]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      updateArrows(scrollRef, setCanScrollLeft, setCanScrollRight);
      updateArrows(featuredScrollRef, setFeaturedCanScrollLeft, setFeaturedCanScrollRight);
    };
  
    window.addEventListener("resize", handleScroll);
    scrollRef.current?.addEventListener("scroll", handleScroll);
    featuredScrollRef.current?.addEventListener("scroll", handleScroll);
  
    handleScroll();
  
    return () => {
      window.removeEventListener("resize", handleScroll);
      scrollRef.current?.removeEventListener("scroll", handleScroll);
      featuredScrollRef.current?.removeEventListener("scroll", handleScroll);
    };
  }, [tournaments, featuredTournaments]);

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.7;
      ref.current.scrollTo({
        left: direction === 'right' ? ref.current.scrollLeft + scrollAmount : ref.current.scrollLeft - scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) return null;
  if (!tournaments.length) return null;

  const visibleTournaments = tournaments.slice(0, MAX_VISIBLE);
  const visibleFeatured = featuredTournaments.slice(0, MAX_VISIBLE);

  return (
    <section className="py-12 px-2 md:px-0 max-w-7xl mx-auto space-y-16" >



      {/* Featured Tournaments */}
      
{featuredTournaments.length > 0 && (
  <div>
    <h2 className="text-3xl text-black md:text-4xl font-bold mb-8">Featured Tournaments</h2>
    <div className="relative">
      <div
        ref={featuredScrollRef}
        className="flex gap-4 pb-4 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {visibleFeatured.map(tournament => (
          <HomeTournCard key={tournament.id} {...tournament} />
        ))}
      </div>

      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {featuredCanScrollLeft && (
        <button
          onClick={() => scroll(featuredScrollRef, 'left')}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-800 transition z-10 opacity-60 hover:opacity-100 cursor-pointer hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      {featuredCanScrollRight && (
        <button
          onClick={() => scroll(featuredScrollRef, 'right')}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-800 transition z-10 opacity-60 hover:opacity-100 cursor-pointer hover:scale-110"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>

    {featuredTournaments.length > MAX_VISIBLE && (
      <div className="flex justify-end mt-4">
        <a
          href="/tournaments?featured=true"
          className="bg-primary text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:bg-primary/90 transition flex items-center gap-2"
        >
          View All
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    )}
  </div>
)}

      {/* Regular Tournaments */}
      <div>
        <h2 className="text-3xl text-black md:text-4xl font-bold mb-8">Explore Tournaments</h2>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 pb-4 overflow-x-auto scroll-smooth scrollbar-hide"
          >
            {visibleTournaments.map(tournament => (
              <HomeTournCard key={tournament.id} {...tournament} />
            ))}
          </div>

          {canScrollLeft && (
            <button
              onClick={() => scroll(scrollRef, 'left')}
              className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-800 transition z-10 opacity-60 hover:opacity-100 cursor-pointer hover:scale-120"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll(scrollRef, 'right')}
              className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-800 transition z-10 opacity-60 hover:opacity-100 cursor-pointer hover:scale-120"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {tournaments.length > MAX_VISIBLE && (
          <div className="flex justify-end mt-4">
            <a
              href="/tournaments"
              className="bg-primary hover:scale-105 hover:bg-red-800 text-white font-semibold px-6 py-2 rounded-full shadow-lg transition flex items-center gap-2"
            >
              Explore More
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="mb-16 md:px-30">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-black leading-snug mb-10">
          Effortlessly Easy To Play The{" "}
          <span className="text-red-600">Sport</span> You Love
        </h2>

        <div className="grid grid-cols-2 gap-8 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://images.pexels.com/photos/54326/runners-male-sport-run-54326.jpeg"
              alt="How it works"
              className="w-full md:max-h-[500px]  object-cover rounded-2xl"
            />
          </div>

          <div className="space-y-6">

            <div className="p-4 border rounded-2xl shadow-sm hover:shadow-md transition hover:scale-105">
              <Link to="/tournaments">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-red-600 ">01</h3>
                <IoChevronForward className="text-2xl text-red-600 ml-auto" />
                <p className="text-xl md:text-2xl font-semibold">
                  Explore <span className="text-red-600">Events</span>

                </p>
                <p className="text-xs md:text-sm text-gray-600">
                  Browse through a wide range of sports events, from football and
                  basketball to cricket and tennis.
                </p>
              </Link>

            </div>


            <div className="p-4 border rounded-2xl shadow-sm hover:shadow-md transition">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-red-600">02</h3>
              <p className="text-xl md:text-2xl font-semibold">
                Choose Your <span className="text-red-600">Spot</span>
              </p>
            </div>

            <div className="p-4 border rounded-2xl shadow-sm hover:shadow-md transition">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-red-600">03</h3>
              <p className="text-xl md:text-2xl font-semibold">
                Book And <span className="text-red-600">Enjoy</span>
              </p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HomeTournamentsSection;
