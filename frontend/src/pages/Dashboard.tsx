import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Plane, 
  Calendar, 
  TrendingUp, 
  Plus, 
  MapPin, 
  Clock, 
  ChevronRight,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalTrips: 0, upcomingTrips: 0, totalSpent: 0 });
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, tripsRes] = await Promise.all([
          axios.get('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/trips', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStats(statsRes.data);
        setTrips(tripsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar / Nav */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Plane className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-900">TravelAI</span>
        </div>

        <div className="space-y-2 flex-1">
          <Link to="/dashboard" className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-600 rounded-xl font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/planner" className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <Plus className="w-5 h-5" />
            Plan New Trip
          </Link>
          <Link to="/trips" className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <Calendar className="w-5 h-5" />
            My Trips
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <UserIcon className="text-slate-600 w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 p-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.name.split(' ')[0]}!</h1>
            <p className="text-slate-500">Ready for your next adventure?</p>
          </div>
          <Link 
            to="/planner"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Plan a New Trip
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Plane className="text-blue-600 w-6 h-6" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Trips</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalTrips}</h3>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="text-emerald-600 w-6 h-6" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Upcoming</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.upcomingTrips}</h3>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
              <Wallet className="text-amber-600 w-6 h-6" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Spent</p>
            <h3 className="text-2xl font-bold text-slate-900">${stats.totalSpent.toLocaleString()}</h3>
          </motion.div>
        </div>

        {/* Recent Trips */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Recent Trips</h2>
            <Link to="/trips" className="text-indigo-600 font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-slate-400 w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No trips planned yet</h3>
              <p className="text-slate-500 mb-6">Start your journey by creating your first travel itinerary.</p>
              <Link 
                to="/planner"
                className="inline-flex items-center gap-2 text-indigo-600 font-semibold"
              >
                Create your first trip <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {trips.slice(0, 3).map((trip) => (
                <motion.div 
                  key={trip.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group cursor-pointer"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <div className="h-40 bg-slate-200 relative overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${trip.destination}/600/400`} 
                      alt={trip.destination}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      {trip.style}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{trip.destination}</h3>
                    <div className="flex items-center gap-4 text-slate-500 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(trip.start_date), 'MMM d')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))} Days
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <span className="text-slate-900 font-bold">${trip.budget?.toLocaleString()}</span>
                      <span className="text-indigo-600 font-medium flex items-center gap-1">
                        Details <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}