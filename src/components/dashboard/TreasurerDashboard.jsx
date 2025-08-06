import React, { useState } from "react";
import { useData } from "../../contexts/DataContext";
import StatementUpload from "../upload/StatementUpload";
import DashboardStats from "../dashboard/DashboardStats";
import TransactionList from "../transactions/TransactionList";
import ActivityLogs from "../logs/ActivityLogs";
import { Upload, BarChart3, List, Activity } from "lucide-react";

const TreasurerDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { transactions, uploadBatches, activityLogs } = useData();

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3 },
    { id: "upload", name: "Upload Statement", icon: Upload },
    { id: "transactions", name: "Transactions", icon: List },
    { id: "logs", name: "Activity Logs", icon: Activity },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardStats />;
      case "upload":
        return <StatementUpload />;
      case "transactions":
        return <TransactionList />;
      case "logs":
        return <ActivityLogs />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{renderContent()}</div>
    </div>
  );
};

export default TreasurerDashboard;
