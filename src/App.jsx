import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { MemberAuthProvider } from "./contexts/MemberAuthContext";
import Login from "./components/auth/Login";
import TreasurerDashboard from "./components/dashboard/TreasurerDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import MemberPortal from "./components/member/MemberPortal";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MemberAuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Member Portal Route */}
                <Route path="/member" element={<MemberPortal />} />

                {/* Protected Admin Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <TreasurerDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Redirect root to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </MemberAuthProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
