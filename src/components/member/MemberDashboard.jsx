import React, { useState, useMemo } from "react";
import { useMemberAuth } from "../../contexts/MemberAuthContext";
import {
  Heart,
  TrendingUp,
  Calendar,
  Download,
  User,
  Phone,
  Mail,
  DollarSign,
  BarChart3,
  PieChart,
  Award,
  Target,
  Clock,
  FileText,
} from "lucide-react";

const MemberDashboard = () => {
  const { memberUser, getMemberTransactions, getMemberAnalytics } =
    useMemberAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Get current year transactions and analytics
  const currentYearTransactions = getMemberTransactions({
    start: `${selectedYear}-01-01`,
    end: `${selectedYear}-12-31`,
  });

  const analytics = getMemberAnalytics(selectedYear);

  // Recent transactions (last 5)
  const recentTransactions = getMemberTransactions().slice(0, 5);

  // Get available years
  const allTransactions = getMemberTransactions();
  const availableYears = [
    ...new Set(allTransactions.map((t) => new Date(t.date).getFullYear())),
  ].sort((a, b) => b - a);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Calculate giving streak (consecutive months with giving)
  const calculateGivingStreak = () => {
    if (!analytics) return 0;

    const currentMonth = new Date().getMonth();
    let streak = 0;

    for (let i = currentMonth; i >= 0; i--) {
      if (analytics.monthlyGiving[i] > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const givingStreak = calculateGivingStreak();

  // Get consistency rating
  const getConsistencyRating = (score) => {
    if (score >= 90)
      return {
        rating: "Excellent",
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    if (score >= 75)
      return {
        rating: "Great",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      };
    if (score >= 50)
      return {
        rating: "Good",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      };
    return {
      rating: "Getting Started",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    };
  };

  const consistencyRating = getConsistencyRating(
    analytics?.consistencyScore || 0
  );

  if (!memberUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {memberUser.name.split(" ")[0]}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Track your stewardship journey and access your giving records
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Giving This Year */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Giving {selectedYear}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.totalYearGiving || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Average Monthly Giving */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Monthly</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.avgMonthlyGiving || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Giving Streak */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Giving Streak
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {givingStreak} month{givingStreak !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Consistency Score */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Consistency</p>
                <div className="flex items-center space-x-2">
                  <p className="text-xl font-bold text-gray-900">
                    {Math.round(analytics?.consistencyScore || 0)}%
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${consistencyRating.bgColor} ${consistencyRating.color}`}
                  >
                    {consistencyRating.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts and Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Monthly Giving Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Monthly Giving - {selectedYear}
                </h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {analytics?.monthlyGiving.map((amount, index) => {
                  const maxAmount = Math.max(...analytics.monthlyGiving);
                  const percentage =
                    maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                  const currentMonth = new Date().getMonth();
                  const isCurrentMonth =
                    index === currentMonth &&
                    selectedYear === new Date().getFullYear();

                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 text-sm text-gray-600 font-medium">
                        {monthNames[index]}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className={`h-6 rounded-full ${
                            isCurrentMonth ? "bg-blue-600" : "bg-blue-500"
                          } transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                        {amount > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        )}
                      </div>
                      {isCurrentMonth && (
                        <span className="text-xs text-blue-600 font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Giving by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Giving by Type - {selectedYear}
                </h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>

              {analytics?.givingByType &&
              Object.keys(analytics.givingByType).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analytics.givingByType).map(
                    ([type, amount], index) => {
                      const percentage =
                        (amount / analytics.totalYearGiving) * 100;
                      const colors = [
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-purple-500",
                        "bg-yellow-500",
                        "bg-red-500",
                        "bg-indigo-500",
                      ];

                      return (
                        <div
                          key={type}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                colors[index % colors.length]
                              }`}
                            />
                            <span className="font-medium text-gray-900">
                              {type}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(amount)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No giving records for {selectedYear}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Profile and Recent Activity */}
          <div className="space-y-8">
            {/* Member Profile */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Profile
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {memberUser.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-900">
                      {memberUser.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {new Date(memberUser.memberSince).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Total Giving (All Time)
                    </p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(memberUser.totalGiving)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Giving
                </h3>
                <button
                  onClick={() => setShowAllTransactions(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.givingType}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No giving records found</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      Download Annual Receipt
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">
                      View All Transactions
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900">
                      Email Receipt
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
