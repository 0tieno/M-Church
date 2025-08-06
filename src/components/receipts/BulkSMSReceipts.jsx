import React, { useState, useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  Send,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
  Filter,
  Download,
} from "lucide-react";

const BulkSMSReceipts = () => {
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [smsTemplate, setSmsTemplate] = useState("detailed");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [minAmount, setMinAmount] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [sendingProgress, setSendingProgress] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const { transactions } = useData();
  const { user } = useAuth();

  // Get eligible members with their giving data
  const eligibleMembers = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    const memberStats = new Map();

    transactions.forEach((transaction) => {
      if (transaction?.phone && transaction?.sender) {
        const transactionDate = new Date(transaction.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        if (transactionDate >= startDate && transactionDate <= endDate) {
          const key = transaction.phone;

          if (!memberStats.has(key)) {
            memberStats.set(key, {
              phone: transaction.phone,
              name: transaction.sender,
              totalAmount: 0,
              transactionCount: 0,
              transactions: [],
            });
          }

          const member = memberStats.get(key);
          member.totalAmount += parseFloat(transaction.amount || 0);
          member.transactionCount += 1;
          member.transactions.push(transaction);
        }
      }
    });

    return Array.from(memberStats.values())
      .filter((member) => {
        const meetsMinAmount =
          !minAmount || member.totalAmount >= parseFloat(minAmount);
        return meetsMinAmount;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions, dateRange, minAmount]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const generateSMSForMember = (member, template) => {
    const transactionsByType = member.transactions.reduce(
      (acc, transaction) => {
        const type = transaction.givingType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(transaction);
        return acc;
      },
      {}
    );

    const receiptId = `SL-${member.phone.slice(-4)}-${Date.now()
      .toString()
      .slice(-6)}`;

    if (template === "detailed") {
      const breakdown = Object.entries(transactionsByType)
        .map(([type, typeTransactions]) => {
          const typeTotal = typeTransactions.reduce(
            (sum, t) => sum + parseFloat(t.amount),
            0
          );
          return `${type}: ${formatCurrency(typeTotal)}`;
        })
        .join("\n");

      return `🏛️ ${user?.church || "KYUSDA Church"}
📧 PERSONAL GIVING RECEIPT

👤 Dear ${member.name},
📱 ${member.phone}
📅 Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(
        dateRange.end
      ).toLocaleDateString()}

💰 YOUR GIVING BREAKDOWN:
${breakdown}

🎯 TOTAL GIVING: ${formatCurrency(member.totalAmount)}
📊 Total Transactions: ${member.transactionCount}

✅ Receipt ID: ${receiptId}
📱 Generated: ${new Date().toLocaleDateString()}

🙏 Thank you for your faithful stewardship!
"God loves a cheerful giver" - 2 Cor 9:7

${user?.church || "KYUSDA Church"} Finance Team`;
    } else {
      return `Hi ${
        member.name.split(" ")[0]
      }, we've received your giving of ${formatCurrency(
        member.totalAmount
      )} for the period ${new Date(
        dateRange.start
      ).toLocaleDateString()} - ${new Date(
        dateRange.end
      ).toLocaleDateString()}. Receipt No: ${receiptId}. Thank you for giving faithfully. – SacredLedger`;
    }
  };

  const toggleMemberSelection = (phone) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(phone)) {
      newSelected.delete(phone);
    } else {
      newSelected.add(phone);
    }
    setSelectedMembers(newSelected);
  };

  const selectAll = () => {
    setSelectedMembers(new Set(eligibleMembers.map((m) => m.phone)));
  };

  const clearAll = () => {
    setSelectedMembers(new Set());
  };

  const sendBulkSMS = async () => {
    if (selectedMembers.size === 0) {
      alert("Please select at least one member");
      return;
    }

    const smsConfig = {
      apiKey: localStorage.getItem("sms_api_key"),
      senderId: localStorage.getItem("sms_sender_id") || "SacredLedger",
    };

    if (!smsConfig.apiKey) {
      alert("Please configure SMS settings first");
      return;
    }

    setSendingBulk(true);
    setSendingProgress([]);

    const selectedMembersList = eligibleMembers.filter((m) =>
      selectedMembers.has(m.phone)
    );
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < selectedMembersList.length; i++) {
      const member = selectedMembersList[i];
      const message = generateSMSForMember(member, smsTemplate);

      try {
        // Simulate SMS sending with delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock API call - replace with actual SMS provider
        const result = await new Promise((resolve) => {
          // Simulate 95% success rate
          const success = Math.random() > 0.05;
          setTimeout(() => {
            resolve({
              success,
              messageId: success ? `msg_${Date.now()}_${i}` : null,
              error: success ? null : "Network timeout",
            });
          }, 500);
        });

        const progressItem = {
          member: member.name,
          phone: member.phone,
          status: result.success ? "sent" : "failed",
          timestamp: new Date().toISOString(),
          messageId: result.messageId,
          error: result.error,
        };

        setSendingProgress((prev) => [...prev, progressItem]);

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        setSendingProgress((prev) => [
          ...prev,
          {
            member: member.name,
            phone: member.phone,
            status: "failed",
            timestamp: new Date().toISOString(),
            error: error.message,
          },
        ]);
        failureCount++;
      }
    }

    setSendingBulk(false);
    alert(
      `Bulk SMS complete!\nSuccessfully sent: ${successCount}\nFailed: ${failureCount}`
    );
  };

  const exportSMSList = () => {
    const selectedMembersList = eligibleMembers.filter((m) =>
      selectedMembers.has(m.phone)
    );
    const csvContent = [
      ["Name", "Phone", "Total Amount", "Transactions", "SMS Message"],
      ...selectedMembersList.map((member) => [
        member.name,
        member.phone,
        member.totalAmount,
        member.transactionCount,
        generateSMSForMember(member, smsTemplate).replace(/\n/g, " | "),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-sms-receipts-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Bulk SMS Receipts
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Send individual receipts to multiple members at once
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={smsTemplate}
              onChange={(e) => setSmsTemplate(e.target.value)}
              className="text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="detailed">Detailed SMS</option>
              <option value="simple">Simple SMS</option>
            </select>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {showPreview ? "Hide" : "Show"} Preview
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Amount (KES)
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <div className="font-medium">
                {eligibleMembers.length} eligible members
              </div>
              <div>{selectedMembers.size} selected</div>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportSMSList}
              disabled={selectedMembers.size === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export List
            </button>

            <button
              onClick={sendBulkSMS}
              disabled={selectedMembers.size === 0 || sendingBulk}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {sendingBulk ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending... ({sendingProgress.length}/{selectedMembers.size})
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedMembers.size} Members
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SMS Preview */}
      {showPreview && eligibleMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            SMS Preview
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="text-xs text-gray-500 mb-2">
              Sample message for: {eligibleMembers[0].name}
            </div>
            <div className="text-sm font-mono whitespace-pre-line bg-white p-3 rounded border">
              {generateSMSForMember(eligibleMembers[0], smsTemplate)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Character count:{" "}
              {generateSMSForMember(eligibleMembers[0], smsTemplate).length}
              {generateSMSForMember(eligibleMembers[0], smsTemplate).length >
                160 &&
                ` (${Math.ceil(
                  generateSMSForMember(eligibleMembers[0], smsTemplate).length /
                    160
                )} SMS parts)`}
            </div>
          </div>
        </div>
      )}

      {/* Member List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Eligible Members ({eligibleMembers.length})
          </h3>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {eligibleMembers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {eligibleMembers.map((member) => (
                <div key={member.phone} className="p-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member.phone)}
                      onChange={() => toggleMemberSelection(member.phone)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {member.name}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {member.phone}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(member.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.transactionCount} transaction(s)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Eligible Members
              </h3>
              <p className="text-gray-500">
                No members found with giving records in the selected period.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sending Progress */}
      {sendingProgress.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Sending Progress ({sendingProgress.length}/{selectedMembers.size})
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sendingProgress.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-3">
                  {item.status === "sent" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{item.member}</div>
                    <div className="text-xs text-gray-500">{item.phone}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${
                      item.status === "sent" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.status === "sent" ? "Sent" : "Failed"}
                  </div>
                  {item.error && (
                    <div className="text-xs text-red-500">{item.error}</div>
                  )}
                  {item.messageId && (
                    <div className="text-xs text-gray-400">
                      {item.messageId}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkSMSReceipts;
