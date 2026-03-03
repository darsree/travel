import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Wallet, 
  Clock, 
  ChevronLeft, 
  Plus, 
  Download, 
  Trash2, 
  Sparkles,
  Utensils,
  Navigation,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import jsPDF from 'jspdf';
import L from 'leaflet';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function TripDetail() {
  const { id } = useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ category: 'Food', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });

  const fetchTrip = async () => {
    try {
      const response = await axios.get(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(response.data);
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate('/auth');
    else fetchTrip();
  }, [id, token]);

  const generateAIItinerary = async () => {
    setGenerating(true);
    try {
      await axios.post(`/api/trips/${id}/generate-itinerary`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTrip();
    } catch (err) {
      alert('Failed to generate itinerary');
    } finally {
      setGenerating(false);
    }
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/expenses', { ...expenseData, trip_id: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowExpenseModal(false);
      setExpenseData({ category: 'Food', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      fetchTrip();
    } catch (err) {
      alert('Failed to add expense');
    }
  };

  const deleteTrip = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await axios.delete(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete trip');
    }
  };

  /*map*/
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);

useEffect(() => {
  if (trip?.destination) {
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trip.destination)}&format=json&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data[0]) {
          setMapCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      });
  }
}, [trip?.destination]);
/************** */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Trip to ${trip.destination}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Dates: ${format(new Date(trip.start_date), 'MMM d, yyyy')} - ${format(new Date(trip.end_date), 'MMM d, yyyy')}`, 20, 30);
    doc.text(`Budget: $${trip.budget}`, 20, 37);
    
    let y = 50;
    trip.itineraries.forEach((day: any) => {
      const data = JSON.parse(day.activities);
      doc.setFontSize(16);
      doc.text(`Day ${data.day_number}`, 20, y);
      y += 10;
      doc.setFontSize(10);
      data.activities.forEach((act: string) => {
        doc.text(`- ${act}`, 25, y);
        y += 7;
      });
      y += 5;
    });
    
    doc.save(`${trip.destination}-itinerary.pdf`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
    </div>
  );

  const totalSpent = trip.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
  const budgetRemaining = trip.budget - totalSpent;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="relative h-[40vh] overflow-hidden">
        <img 
          src={`https://picsum.photos/seed/${trip.destination}/1920/1080`} 
          className="w-full h-full object-cover"
          alt={trip.destination}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <Link to="/dashboard" className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white hover:bg-white/30 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex gap-2">
            <button onClick={exportPDF} className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white hover:bg-white/30 transition-all">
              <Download className="w-6 h-6" />
            </button>
            <button onClick={deleteTrip} className="bg-red-500/80 backdrop-blur-md p-2 rounded-xl text-white hover:bg-red-600 transition-all">
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-6 right-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{trip.destination}</h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <Calendar className="w-4 h-4" />
                {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <Users className="w-4 h-4" />
                {trip.travelers} Travelers
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <Sparkles className="w-4 h-4" />
                {trip.style}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Itinerary */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Navigation className="text-indigo-600 w-6 h-6" />
                  Your Itinerary
                </h2>
                {trip.itineraries.length === 0 && (
                  <button 
                    onClick={generateAIItinerary}
                    disabled={generating}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-70"
                  >
                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {generating ? 'Generating...' : 'Generate with AI'}
                  </button>
                )}
              </div>

              {trip.itineraries.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No itinerary yet</h3>
                  <p className="text-slate-500 mb-6">Let our AI create a personalized daily plan for you.</p>
                  <button 
                    onClick={generateAIItinerary}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Generate Now
                  </button>
                </div>
              ) : (
                <div className="space-y-10">
                  {trip.itineraries.map((day: any, idx: number) => {
                    const data = JSON.parse(day.activities);
                    return (
                      <div key={day.id} className="relative pl-8 border-l-2 border-indigo-100">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white shadow-sm" />
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Day {data.day_number}</h3>
                        
                        <div className="grid gap-4">
                          <div className="bg-slate-50 p-6 rounded-2xl">
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-indigo-600" />
                              Activities
                            </h4>
                            <ul className="space-y-2">
                              {data.activities.map((act: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-slate-600">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                  {act}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-amber-50/50 p-6 rounded-2xl">
                              <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                <Utensils className="w-4 h-4" />
                                Food Suggestions
                              </h4>
                              <ul className="space-y-1 text-sm text-amber-900/70">
                                {data.food_suggestions.map((food: string, i: number) => (
                                  <li key={i}>• {food}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-blue-50/50 p-6 rounded-2xl">
                              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                <Navigation className="w-4 h-4" />
                                Transport Tips
                              </h4>
                              <p className="text-sm text-blue-900/70">{data.transport_tips}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Budget & Map */}
          <div className="space-y-8">
            {/* Budget Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Budget Tracker</h2>
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-500">Spent: ${totalSpent}</span>
                    <span className="text-slate-900">${trip.budget}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalSpent / trip.budget) * 100, 100)}%` }}
                      className={`h-full ${budgetRemaining < 0 ? 'bg-red-500' : 'bg-indigo-600'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Remaining</p>
                    <p className={`text-lg font-bold ${budgetRemaining < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      ${budgetRemaining}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Daily Avg</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${(totalSpent / (trip.itineraries.length || 1)).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recent Expenses</h3>
                  {trip.expenses.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No expenses recorded</p>
                  ) : (
                    trip.expenses.slice(-3).reverse().map((exp: any) => (
                      <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{exp.description || exp.category}</p>
                          <p className="text-xs text-slate-500">{exp.date}</p>
                        </div>
                        <span className="font-bold text-slate-900">${exp.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Map */}
<div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 h-80">
  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
    <h2 className="font-bold text-slate-900">Destination Map</h2>
    <MapPin className="text-indigo-600 w-5 h-5" />
  </div>
  <div style={{ height: '256px' }}>
    {mapCoords ? (
      <MapContainer
        center={mapCoords}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={mapCoords}>
          <Popup>{trip.destination}</Popup>
        </Marker>
      </MapContainer>
    ) : (
      <div className="h-full flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading map...
      </div>
    )}
  </div>
</div>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Expense</h2>
              <form onSubmit={addExpense} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Category</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={expenseData.category}
                    onChange={(e) => setExpenseData({...expenseData, category: e.target.value})}
                  >
                    <option>Food</option>
                    <option>Transport</option>
                    <option>Accommodation</option>
                    <option>Activities</option>
                    <option>Shopping</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Amount ($)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Description</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}