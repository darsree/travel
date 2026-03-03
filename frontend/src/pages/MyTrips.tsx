import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Calendar, Clock, ChevronRight, MapPin, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import { format } from 'date-fns';

export default function MyTrips() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/auth'); return; }
    axios.get('/api/trips', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTrips(res.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Trips</h1>
        <Link to="/planner" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all">
          <Plus className="w-5 h-5" /> New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No trips yet</h3>
          <p className="text-slate-500 mb-6">Start planning your first adventure!</p>
          <Link to="/planner" className="text-indigo-600 font-semibold hover:underline">Create a trip →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <motion.div
              key={trip.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/trips/${trip.id}`)}
            >
              <div className="h-40 overflow-hidden relative">
                <img
                  src={`https://picsum.photos/seed/${trip.destination}/600/400`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={trip.destination}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600 uppercase">
                  {trip.style}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{trip.destination}</h3>
                <div className="flex items-center gap-4 text-slate-500 text-sm mb-4">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(trip.start_date), 'MMM d')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />
                    {Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000)} Days
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                  <span className="font-bold text-slate-900">${trip.budget?.toLocaleString()}</span>
                  <span className="text-indigo-600 font-medium flex items-center gap-1">Details <ChevronRight className="w-4 h-4" /></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}