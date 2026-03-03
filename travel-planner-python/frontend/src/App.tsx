import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import TripPlanner from './pages/TripPlanner';
import TripDetail from './pages/TripDetail';
import { useAuthStore } from './store/authStore';
import MyTrips from './pages/MyTrips';


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/auth" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/planner" 
          element={
            <PrivateRoute>
              <TripPlanner />
            </PrivateRoute>
          } 
        />
        <Route path="/trips" element={<PrivateRoute><MyTrips /></PrivateRoute>} />
        <Route 
          path="/trips/:id" 
          element={
            <PrivateRoute>
              <TripDetail />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}