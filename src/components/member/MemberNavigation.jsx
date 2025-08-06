import React, { useState, useEffect } from "react";
import { useMemberAuth } from "../../contexts/MemberAuthContext";
import {
  Home,
  FileText,
  TrendingUp,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  Church,
  User,
  ChevronLeft,
} from "lucide-react";

const MemberNavigation = ({ activeTab, setActiveTab, onSidebarToggle }) => {
  const { memberUser, memberLogout } = useMemberAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  const navigationItems = [
    { id: "dashboard", name: "Dashboard", icon: Home },
    { id: "transactions", name: "Transactions", icon: FileText },
    { id: "analytics", name: "Analytics", icon: TrendingUp },
    { id: "receipts", name: "Receipts", icon: Download },
    { id: "profile", name: "Profile", icon: Settings },
  ];

  const handleLogout = () => {
    memberLogout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDesktopSidebar = () => {
    const newCollapsedState = !isDesktopSidebarCollapsed;
    setIsDesktopSidebarCollapsed(newCollapsedState);
    if (onSidebarToggle) {
      onSidebarToggle(newCollapsedState);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Desktop Navigation */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${
          isDesktopSidebarCollapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo and Collapse Button */}
          <div className="flex items-center justify-between px-4 mb-8">
            {!isDesktopSidebarCollapsed && (
              <div className="flex items-center">
                <div className="bg-blue-600 rounded-lg p-2 mr-3">
                  <Church className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    SacredLedger
                  </h1>
                  <p className="text-sm text-gray-500">Member Portal</p>
                </div>
              </div>
            )}

            {isDesktopSidebarCollapsed && (
              <div className="w-full flex justify-center">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Church className="h-6 w-6 text-white" />
                </div>
              </div>
            )}

            <button
              onClick={toggleDesktopSidebar}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              title={
                isDesktopSidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform duration-200 ${
                  isDesktopSidebarCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Member Info */}
          {!isDesktopSidebarCollapsed && (
            <div className="px-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="bg-blue-600 rounded-full p-2 mr-3">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {memberUser?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {memberUser?.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 px-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                    isActive
                      ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${isDesktopSidebarCollapsed ? "justify-center" : ""}`}
                  title={isDesktopSidebarCollapsed ? item.name : ""}
                >
                  <Icon
                    className={`${
                      isDesktopSidebarCollapsed ? "" : "mr-3"
                    } flex-shrink-0 h-5 w-5 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {!isDesktopSidebarCollapsed && item.name}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="flex-shrink-0 px-2 pb-4">
            <button
              onClick={handleLogout}
              className={`group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors duration-150 ${
                isDesktopSidebarCollapsed ? "justify-center" : ""
              }`}
              title={isDesktopSidebarCollapsed ? "Sign Out" : ""}
            >
              <LogOut
                className={`${
                  isDesktopSidebarCollapsed ? "" : "mr-3"
                } flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-red-500`}
              />
              {!isDesktopSidebarCollapsed && "Sign Out"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center">
            <div className="bg-blue-600 rounded-lg p-2 mr-3">
              <Church className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                SacredLedger
              </h1>
              <p className="text-xs text-gray-500">Member Portal</p>
            </div>
          </div>

          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={closeMobileMenu}
            />

            <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl transform transition-transform">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
                  <div className="flex items-center">
                    <div className="bg-blue-600 rounded-lg p-2 mr-3">
                      <Church className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">
                        SacredLedger
                      </h1>
                      <p className="text-xs text-gray-500">Member Portal</p>
                    </div>
                  </div>

                  <button
                    onClick={closeMobileMenu}
                    className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Member Info */}
                <div className="p-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center">
                      <div className="bg-blue-600 rounded-full p-2 mr-3">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {memberUser?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {memberUser?.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Items */}
                <nav className="flex-1 px-2 space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          closeMobileMenu();
                        }}
                        className={`group flex items-center w-full px-2 py-3 text-sm font-medium rounded-md transition-colors duration-150 ${
                          isActive
                            ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon
                          className={`mr-3 flex-shrink-0 h-5 w-5 ${
                            isActive
                              ? "text-blue-600"
                              : "text-gray-400 group-hover:text-gray-500"
                          }`}
                        />
                        {item.name}
                      </button>
                    );
                  })}
                </nav>

                {/* Mobile Logout */}
                <div className="p-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="group flex items-center w-full px-2 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                  >
                    <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Tabs (Bottom) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  isActive ? "text-blue-600" : "text-gray-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MemberNavigation;
