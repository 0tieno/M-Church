import React, { useState, useRef, useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import ReceiptGenerator from "./ReceiptGenerator";
import ReceiptPreview from "./ReceiptPreview";
import MemberReceiptSummary from "./MemberReceiptSummary";
import {
  Receipt,
  FileText,
  Users,
  Download,
  Calendar,
  Filter,
} from "lucide-react";

const ReceiptManagement = () => {
  const [activeTab, setActiveTab] = useState("generator");
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [selectedMember, setSelectedMember] = useState("");
  const { transactions } = useData();
  const { user } = useAuth();

  const tabs = [
    { id: "generator", name: "Generate Receipts", icon: Receipt },
    { id: "preview", name: "Preview & Print", icon: FileText },
    { id: "member-summary", name: "Member Summaries", icon: Users },
  ];

  const uniqueMembers = React.useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    const memberMap = new Map();

    transactions.forEach((transaction) => {
      if (transaction?.phone && transaction?.sender) {
        const key = transaction.phone;
        if (!memberMap.has(key)) {
          memberMap.set(key, {
            phone: transaction.phone,
            name: transaction.sender,
          });
        }
      }
    });

    return Array.from(memberMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [transactions]);

  const renderContent = () => {
    switch (activeTab) {
      case "generator":
        return (
          <ReceiptGenerator
            dateRange={selectedDateRange}
            selectedMember={selectedMember}
            onDateRangeChange={setSelectedDateRange}
            onMemberChange={setSelectedMember}
            members={uniqueMembers}
          />
        );
      case "preview":
        return (
          <ReceiptPreview
            dateRange={selectedDateRange}
            selectedMember={selectedMember}
          />
        );
      case "member-summary":
        return (
          <MemberReceiptSummary
            dateRange={selectedDateRange}
            members={uniqueMembers}
          />
        );
      default:
        return <ReceiptGenerator />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Receipt Management
            </h1>
            <p className="text-gray-600 mt-1">
              Generate, preview, and manage giving receipts
            </p>
          </div>

          {/* Global Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDateRange.start}
                onChange={(e) =>
                  setSelectedDateRange((prev) => ({
                    ...prev,
                    start: e.target.value,
                  }))
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={selectedDateRange.end}
                onChange={(e) =>
                  setSelectedDateRange((prev) => ({
                    ...prev,
                    end: e.target.value,
                  }))
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Members</option>
                {uniqueMembers.map((member) => (
                  <option key={member.phone} value={member.phone}>
                    {member.name} ({member.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

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

export default ReceiptManagement;
