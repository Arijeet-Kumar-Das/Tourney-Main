import React, { useEffect, useState } from "react";

function getTimeLeft(scheduledAt) {
  const now = new Date();
  const target = new Date(scheduledAt);
  const diff = target - now;
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
}

const pad = (n) => n.toString().padStart(2, '0');

const EventCountdown = ({ scheduledAt }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(scheduledAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(scheduledAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledAt]);

  if (!scheduledAt) return null;

  const { hours, minutes, seconds } = timeLeft;
  const isPast = hours === 0 && minutes === 0 && seconds === 0;

  return (
    <div className="bg-red-600 text-white rounded-xl flex flex-col items-center justify-center px-8 py-6 w-full max-w-xs mx-auto">
      <div className="text-5xl font-bold tracking-wider mb-2">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </div>
      <div className="text-lg font-semibold">
        {isPast ? "Event Started" : "Event Starts in"}
      </div>
    </div>
  );
};

export default EventCountdown;
