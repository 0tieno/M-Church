import React, { useState, useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import { Search, Filter, Download, Calendar } from "lucide-react";

const TransactionList = () => {
  const { transactions } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("date-desc");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.sender.toLowerCase().includes(term) ||
          t.phone.includes(term) ||
          t.givingType.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.givingType === filterType);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(
        (t) => new Date(t.date) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (t) => new Date(t.date) <= new Date(dateRange.end)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "amount-desc":
          return parseFloat(b.amount) - parseFloat(a.amount);
        case "amount-asc":
          return parseFloat(a.amount) - parseFloat(b.amount);
        case "sender":
          return a.sender.localeCompare(b.sender);
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, filterType, dateRange, sortBy]);

  const givingTypes = [
    ...new Set(transactions.map((t) => t.givingType)),
  ].filter(Boolean);

  const totalAmount = filteredAndSortedTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0
  );

  const exportToCSV = () => {
    const headers = ["Date", "Sender", "Phone", "Amount", "Type", "Paybill"];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedTransactions.map((t) =>
        [
          t.date,
          `"${t.sender}"`,
          t.phone,
          t.amount,
          t.givingType,
          t.paybill,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 lg:mb-0">
            Transaction Records
          </h2>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredAndSortedTransactions.length} transactions •{" "}
              {formatCurrency(totalAmount)}
            </span>
            <button
              onClick={exportToCSV}
              disabled={filteredAndSortedTransactions.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {givingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start date"
            />
          </div>

          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="End date"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (Highest)</option>
              <option value="amount-asc">Amount (Lowest)</option>
              <option value="sender">Sender Name</option>
            </select>
          </div>

          {(searchTerm ||
            filterType !== "all" ||
            dateRange.start ||
            dateRange.end) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setDateRange({ start: "", end: "" });
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paybill
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.sender}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {transaction.givingType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.paybill}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {transactions.length === 0
                ? "No transactions found. Upload your first M-Pesa statement to get started."
                : "No transactions match your current filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
