import React, { useState } from "react";
import { useMemberAuth } from "../../contexts/MemberAuthContext";
import MemberLogin from "./MemberLogin";
import MemberNavigation from "./MemberNavigation";
import MemberDashboard from "./MemberDashboard";
import MemberTransactions from "./MemberTransactions";
import MemberProfile from "./MemberProfile";
import { Loader, AlertCircle } from "lucide-react";

const MemberPortal = () => {
  const { currentMember, isLoading, error } = useMemberAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading member portal...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Portal
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentMember) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MemberLogin />
      </div>
    );
  }

  // Render the appropriate view based on activeView
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <MemberDashboard />;
      case "transactions":
        return <MemberTransactions />;
      case "profile":
        return <MemberProfile />;
      default:
        return <MemberDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <MemberNavigation 
        activeTab={activeView} 
        setActiveTab={setActiveView}
        onSidebarToggle={setSidebarCollapsed}
      />

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 Siloh Church Member Portal. Secure giving management.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MemberPortal;
