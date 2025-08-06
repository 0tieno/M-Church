import React, { useState, useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import { Download, Mail, Users, TrendingUp } from "lucide-react";

const MemberReceiptSummary = ({ dateRange, members }) => {
  const [sortBy, setSortBy] = useState("amount-desc");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const { transactions } = useData();

  const memberSummaries = useMemo(() => {
    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const summaryMap = {};

    filteredTransactions.forEach((transaction) => {
      const phone = transaction.phone;
      if (!summaryMap[phone]) {
        summaryMap[phone] = {
          phone,
          name: transaction.sender,
          transactions: [],
          totalAmount: 0,
          givingTypes: {},
        };
      }

      summaryMap[phone].transactions.push(transaction);
      summaryMap[phone].totalAmount += parseFloat(transaction.amount);

      if (!summaryMap[phone].givingTypes[transaction.givingType]) {
        summaryMap[phone].givingTypes[transaction.givingType] = {
          count: 0,
          amount: 0,
        };
      }

      summaryMap[phone].givingTypes[transaction.givingType].count += 1;
      summaryMap[phone].givingTypes[transaction.givingType].amount +=
        parseFloat(transaction.amount);
    });

    let summaries = Object.values(summaryMap);

    // Filter by minimum amount
    if (filterMinAmount) {
      const minAmount = parseFloat(filterMinAmount);
      summaries = summaries.filter((s) => s.totalAmount >= minAmount);
    }

    // Sort
    summaries.sort((a, b) => {
      switch (sortBy) {
        case "amount-desc":
          return b.totalAmount - a.totalAmount;
        case "amount-asc":
          return a.totalAmount - b.totalAmount;
        case "name":
          return a.name.localeCompare(b.name);
        case "transactions-desc":
          return b.transactions.length - a.transactions.length;
        default:
          return 0;
      }
    });

    return summaries;
  }, [transactions, dateRange, sortBy, filterMinAmount]);

  const overallStats = useMemo(() => {
    const totalMembers = memberSummaries.length;
    const totalAmount = memberSummaries.reduce(
      (sum, m) => sum + m.totalAmount,
      0
    );
    const totalTransactions = memberSummaries.reduce(
      (sum, m) => sum + m.transactions.length,
      0
    );
    const avgPerMember = totalMembers > 0 ? totalAmount / totalMembers : 0;

    return {
      totalMembers,
      totalAmount,
      totalTransactions,
      avgPerMember,
    };
  }, [memberSummaries]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const generateBulkReceipts = () => {
    const receiptsData = memberSummaries.map((member) => ({
      member: member.name,
      phone: member.phone,
      period: `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(
        dateRange.end
      ).toLocaleDateString()}`,
      transactions: member.transactions.length,
      total: member.totalAmount,
      breakdown: Object.entries(member.givingTypes).map(([type, data]) => ({
        type,
        count: data.count,
        amount: data.amount,
      })),
    }));

    const csvContent = [
      "Member Name,Phone,Period,Total Transactions,Total Amount,Giving Breakdown",
      ...receiptsData.map(
        (receipt) =>
          `"${receipt.member}","${receipt.phone}","${receipt.period}",${
            receipt.transactions
          },"${formatCurrency(receipt.total)}","${receipt.breakdown
            .map((b) => `${b.type}: ${formatCurrency(b.amount)}`)
            .join("; ")}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `member-receipts-summary-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateSMSBatch = () => {
    const smsMessages = memberSummaries.map((member) => {
      const breakdown = Object.entries(member.givingTypes)
        .map(([type, data]) => `${type}: ${formatCurrency(data.amount)}`)
        .join("\n");

      return {
        phone: member.phone,
        message: `Hello ${member.name},\n\nYour giving summary for ${new Date(
          dateRange.start
        ).toLocaleDateString()} - ${new Date(
          dateRange.end
        ).toLocaleDateString()}:\n\n${breakdown}\n\nTotal: ${formatCurrency(
          member.totalAmount
        )}\n\nThank you for your faithful support.\n- Church`,
      };
    });

    const smsContent = smsMessages
      .map((sms) => `Phone: ${sms.phone}\nMessage:\n${sms.message}\n\n---\n`)
      .join("");

    navigator.clipboard
      .writeText(smsContent)
      .then(() => {
        alert(
          `SMS batch for ${smsMessages.length} members copied to clipboard!`
        );
      })
      .catch(() => {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = smsContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert(
          `SMS batch for ${smsMessages.length} members copied to clipboard!`
        );
      });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Member Summary Statistics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {overallStats.totalMembers}
            </div>
            <div className="text-sm text-gray-500">Active Members</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(overallStats.totalAmount)}
            </div>
            <div className="text-sm text-gray-500">Total Giving</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {overallStats.totalTransactions}
            </div>
            <div className="text-sm text-gray-500">Total Transactions</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(overallStats.avgPerMember)}
            </div>
            <div className="text-sm text-gray-500">Avg per Member</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="amount-desc">Amount (Highest)</option>
                <option value="amount-asc">Amount (Lowest)</option>
                <option value="name">Name</option>
                <option value="transactions-desc">Transactions (Most)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Amount (KES)
              </label>
              <input
                type="number"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value)}
                placeholder="0"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={generateSMSBatch}
              disabled={memberSummaries.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Mail className="h-4 w-4 mr-1" />
              SMS Batch
            </button>

            <button
              onClick={generateBulkReceipts}
              disabled={memberSummaries.length === 0}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Member Summary List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Member Receipt Summaries ({memberSummaries.length} members)
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {memberSummaries.length > 0 ? (
            memberSummaries.map((member, index) => (
              <div key={member.phone} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-500">{member.phone}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(member.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.transactions.length} transaction(s)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(member.givingTypes).map(([type, data]) => (
                    <div key={type} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900">
                        {type}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(data.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {data.count} payment(s)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Member Data
              </h3>
              <p className="text-gray-500">
                No member giving data found for the selected period and filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberReceiptSummary;
