import React, { useState, useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
  User,
  Users,
  Phone,
  Calendar,
  DollarSign,
  Download,
  Mail,
  Search,
  Receipt,
  TrendingUp,
  History,
  Send,
  MessageSquare,
  Settings,
  Zap,
  CheckCircle,
} from "lucide-react";

const IndividualMemberReceipts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], // Start of year
    end: new Date().toISOString().split("T")[0],
  });
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [smsTemplate, setSmsTemplate] = useState("detailed"); // "detailed" or "simple"
  const [showSmsSettings, setShowSmsSettings] = useState(false);
  const [smsConfig, setSmsConfig] = useState({
    apiKey: localStorage.getItem("sms_api_key") || "",
    senderId: localStorage.getItem("sms_sender_id") || "SacredLedger",
    provider: localStorage.getItem("sms_provider") || "africastalking", // africastalking, twilio, etc.
    autoSend: localStorage.getItem("sms_auto_send") === "true" || false,
  });
  const [sendingSMS, setSendingSMS] = useState(false);
  const [smsHistory, setSmsHistory] = useState(
    JSON.parse(localStorage.getItem("sms_history") || "[]")
  );

  const { transactions } = useData();
  const { user } = useAuth();

  // Get all unique members with their giving statistics
  const allMembers = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    const memberStats = new Map();

    transactions.forEach((transaction) => {
      if (transaction?.phone && transaction?.sender) {
        const key = transaction.phone;

        if (!memberStats.has(key)) {
          memberStats.set(key, {
            phone: transaction.phone,
            name: transaction.sender,
            totalAmount: 0,
            transactionCount: 0,
            givingTypes: new Set(),
            firstGiving: transaction.date,
            lastGiving: transaction.date,
            transactions: [],
          });
        }

        const member = memberStats.get(key);
        member.totalAmount += parseFloat(transaction.amount || 0);
        member.transactionCount += 1;
        member.givingTypes.add(transaction.givingType);
        member.transactions.push(transaction);

        // Update first and last giving dates
        if (new Date(transaction.date) < new Date(member.firstGiving)) {
          member.firstGiving = transaction.date;
        }
        if (new Date(transaction.date) > new Date(member.lastGiving)) {
          member.lastGiving = transaction.date;
        }
      }
    });

    return Array.from(memberStats.values())
      .map((member) => ({
        ...member,
        givingTypes: Array.from(member.givingTypes),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions]);

  // Filter members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return allMembers;

    const term = searchTerm.toLowerCase();
    return allMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(term) || member.phone.includes(term)
    );
  }, [allMembers, searchTerm]);

  // Get transactions for selected member in date range
  const memberTransactions = useMemo(() => {
    if (!selectedMember) return [];

    return transactions
      .filter((t) => {
        const matchesMember = t.phone === selectedMember.phone;
        const transactionDate = new Date(t.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        return (
          matchesMember &&
          transactionDate >= startDate &&
          transactionDate <= endDate
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transactions, selectedMember, dateRange]);

  // Group transactions by type for the selected member
  const transactionsByType = useMemo(() => {
    return memberTransactions.reduce((acc, transaction) => {
      const type = transaction.givingType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(transaction);
      return acc;
    }, {});
  }, [memberTransactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  // Save SMS configuration to localStorage
  const saveSmsConfig = (config) => {
    localStorage.setItem("sms_api_key", config.apiKey);
    localStorage.setItem("sms_sender_id", config.senderId);
    localStorage.setItem("sms_provider", config.provider);
    localStorage.setItem("sms_auto_send", config.autoSend.toString());
    setSmsConfig(config);
  };

  // Generate detailed SMS receipt
  const generateDetailedSMS = () => {
    if (!selectedMember || memberTransactions.length === 0) return "";

    const totalAmount = memberTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );
    const breakdown = Object.entries(transactionsByType)
      .map(([type, typeTransactions]) => {
        const typeTotal = typeTransactions.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );
        return `${type}: ${formatCurrency(typeTotal)}`;
      })
      .join("\n");

    const receiptId = `SL-${selectedMember.phone.slice(-4)}-${Date.now()
      .toString()
      .slice(-6)}`;

    return `🏛️ ${user?.church || "KYUSDA Church"}
📧 PERSONAL GIVING RECEIPT

👤 Dear ${selectedMember.name},
📱 ${selectedMember.phone}
📅 Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(
      dateRange.end
    ).toLocaleDateString()}

💰 YOUR GIVING BREAKDOWN:
${breakdown}

🎯 TOTAL GIVING: ${formatCurrency(totalAmount)}
📊 Total Transactions: ${memberTransactions.length}

✅ Receipt ID: ${receiptId}
📱 Generated: ${new Date().toLocaleDateString()}

🙏 Thank you for your faithful stewardship!
"God loves a cheerful giver" - 2 Cor 9:7

${user?.church || "KYUSDA Church"} Finance Team`;
  };

  // Generate simple SMS receipt
  const generateSimpleSMS = () => {
    if (!selectedMember || memberTransactions.length === 0) return "";

    const totalAmount = memberTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );
    const receiptId = `SL-${new Date().getFullYear()}-${String(
      Date.now()
    ).slice(-4)}`;
    const latestTransaction = memberTransactions[memberTransactions.length - 1];

    return `Hi ${
      selectedMember.name.split(" ")[0]
    }, we've received your giving of ${formatCurrency(
      totalAmount
    )} for the period ${new Date(
      dateRange.start
    ).toLocaleDateString()} - ${new Date(
      dateRange.end
    ).toLocaleDateString()}. Receipt No: ${receiptId}. Thank you for giving faithfully. – ${
      smsConfig.senderId
    }`;
  };

  // Send SMS via Africa's Talking API (demo implementation)
  const sendSMSViaProvider = async (phoneNumber, message) => {
    if (!smsConfig.apiKey) {
      throw new Error("SMS API key not configured");
    }

    // This is a demo implementation - replace with actual SMS provider API
    const smsPayload = {
      to: phoneNumber,
      message: message,
      from: smsConfig.senderId,
    };

    try {
      // Demo API call - replace with actual provider endpoint
      if (smsConfig.provider === "africastalking") {
        // Africa's Talking API format
        const response = await fetch(
          "https://api.africastalking.com/version1/messaging",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              apiKey: smsConfig.apiKey,
              Accept: "application/json",
            },
            body: new URLSearchParams({
              username: "sandbox", // Replace with your username
              to: phoneNumber,
              message: message,
              from: smsConfig.senderId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`SMS API error: ${response.statusText}`);
        }

        return await response.json();
      } else if (smsConfig.provider === "twilio") {
        // Twilio API format (demo)
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(
                `YOUR_ACCOUNT_SID:${smsConfig.apiKey}`
              )}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: smsConfig.senderId,
              To: phoneNumber,
              Body: message,
            }),
          }
        );

        return await response.json();
      }
    } catch (error) {
      console.error("SMS sending error:", error);
      throw error;
    }
  };

  // Send automated SMS receipt
  const sendAutomatedSMS = async () => {
    if (!selectedMember || memberTransactions.length === 0) {
      alert("Please select a member with transactions");
      return;
    }

    if (!smsConfig.apiKey) {
      alert("Please configure SMS settings first");
      setShowSmsSettings(true);
      return;
    }

    setSendingSMS(true);

    try {
      const message =
        smsTemplate === "detailed"
          ? generateDetailedSMS()
          : generateSimpleSMS();

      // For demo purposes, we'll simulate the SMS sending
      // In production, replace this with actual SMS API call
      const result = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            messageId: `msg_${Date.now()}`,
            cost: 1.0,
            status: "sent",
          });
        }, 2000);
      });

      // In production, use this instead:
      // const result = await sendSMSViaProvider(selectedMember.phone, message);

      // Save to SMS history
      const smsRecord = {
        id: Date.now(),
        memberName: selectedMember.name,
        phone: selectedMember.phone,
        message: message,
        template: smsTemplate,
        timestamp: new Date().toISOString(),
        status: "sent",
        cost: result.cost || 1.0,
        messageId: result.messageId,
      };

      const updatedHistory = [smsRecord, ...smsHistory].slice(0, 100); // Keep last 100
      setSmsHistory(updatedHistory);
      localStorage.setItem("sms_history", JSON.stringify(updatedHistory));

      alert(
        `SMS receipt sent successfully to ${selectedMember.name} (${selectedMember.phone})`
      );
    } catch (error) {
      console.error("Error sending SMS:", error);
      alert(`Failed to send SMS: ${error.message}`);
    } finally {
      setSendingSMS(false);
    }
  };

  const generateIndividualPDF = async () => {
    if (!selectedMember || memberTransactions.length === 0) {
      alert(
        "Please select a member with transactions in the selected date range"
      );
      return;
    }

    setGeneratingReceipt(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Church Header
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text(user?.church || "Church Name", 105, 25, { align: "center" });

      // Receipt Title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "normal");
      pdf.text("INDIVIDUAL GIVING RECEIPT", 105, 35, { align: "center" });

      // Receipt Number and Date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const receiptNumber = `SL-${selectedMember.phone.slice(-4)}-${Date.now()
        .toString()
        .slice(-6)}`;
      pdf.text(`Receipt #: ${receiptNumber}`, 20, 50);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        20,
        57
      );

      // Member Information Box
      pdf.setFillColor(245, 245, 245);
      pdf.rect(20, 65, 170, 25, "F");
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("MEMBER INFORMATION", 25, 75);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Name: ${selectedMember.name}`, 25, 82);
      pdf.text(`Phone: ${selectedMember.phone}`, 120, 82);
      pdf.text(
        `Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(
          dateRange.end
        ).toLocaleDateString()}`,
        25,
        87
      );

      let yPos = 105;

      // Summary Box
      const totalAmount = memberTransactions.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0
      );
      pdf.setFillColor(220, 252, 231); // Light green
      pdf.rect(20, yPos, 170, 20, "F");
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("TOTAL GIVING:", 25, yPos + 8);
      pdf.text(formatCurrency(totalAmount), 140, yPos + 8);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${memberTransactions.length} transaction(s)`, 25, yPos + 15);

      yPos += 35;

      // Giving Breakdown by Type
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("GIVING BREAKDOWN BY TYPE", 25, yPos);
      yPos += 10;

      Object.entries(transactionsByType).forEach(([type, typeTransactions]) => {
        const typeTotal = typeTransactions.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${type}:`, 30, yPos);
        pdf.text(formatCurrency(typeTotal), 140, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `(${typeTransactions.length} payment${
            typeTransactions.length > 1 ? "s" : ""
          })`,
          100,
          yPos
        );
        yPos += 6;
      });

      yPos += 10;

      // Detailed Transaction List
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("DETAILED TRANSACTION HISTORY", 25, yPos);
      yPos += 10;

      // Table Headers
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Date", 25, yPos);
      pdf.text("Type", 65, yPos);
      pdf.text("Amount", 140, yPos);
      yPos += 5;

      // Table Data
      pdf.setFont("helvetica", "normal");
      memberTransactions.forEach((transaction) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.text(new Date(transaction.date).toLocaleDateString(), 25, yPos);
        pdf.text(transaction.givingType, 65, yPos);
        pdf.text(formatCurrency(transaction.amount), 140, yPos);
        yPos += 5;
      });

      // Generate QR Code for verification
      try {
        const qrData = {
          church: user?.church,
          member: selectedMember.name,
          phone: selectedMember.phone,
          period: `${dateRange.start} to ${dateRange.end}`,
          total: totalAmount,
          receiptNumber,
          transactions: memberTransactions.length,
        };

        const qrString = JSON.stringify(qrData);
        const qrDataUrl = await QRCode.toDataURL(qrString, { width: 60 });

        // Add QR code to PDF
        yPos += 10;
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.addImage(qrDataUrl, "PNG", 150, yPos, 30, 30);
        pdf.setFontSize(8);
        pdf.text("Scan for verification", 155, yPos + 35);
      } catch (qrError) {
        console.warn("Could not generate QR code:", qrError);
      }

      // Footer
      yPos += 45;
      if (yPos > 260) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "This is an official receipt for your personal giving records.",
        105,
        yPos,
        { align: "center" }
      );
      pdf.text(
        "Thank you for your faithful stewardship and support.",
        105,
        yPos + 5,
        { align: "center" }
      );
      pdf.text(
        '"Each of you should give what you have decided in your heart to give,',
        105,
        yPos + 12,
        { align: "center" }
      );
      pdf.text(
        'not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7',
        105,
        yPos + 17,
        { align: "center" }
      );

      // Save the PDF
      const fileName = `${selectedMember.name.replace(/\s+/g, "-")}-Receipt-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating receipt. Please try again.");
    } finally {
      setGeneratingReceipt(false);
    }
  };

  const generateSMSReceipt = () => {
    if (!selectedMember || memberTransactions.length === 0) {
      alert("Please select a member with transactions");
      return;
    }

    const totalAmount = memberTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );
    const breakdown = Object.entries(transactionsByType)
      .map(([type, typeTransactions]) => {
        const typeTotal = typeTransactions.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );
        return `${type}: ${formatCurrency(typeTotal)}`;
      })
      .join("\n");

    const smsText = `🏛️ ${
      user?.church || "Church"
    }\n📧 PERSONAL GIVING RECEIPT\n\n👤 Dear ${selectedMember.name},\n📱 ${
      selectedMember.phone
    }\n📅 Period: ${new Date(
      dateRange.start
    ).toLocaleDateString()} - ${new Date(
      dateRange.end
    ).toLocaleDateString()}\n\n💰 YOUR GIVING BREAKDOWN:\n${breakdown}\n\n🎯 TOTAL GIVING: ${formatCurrency(
      totalAmount
    )}\n📊 Total Transactions: ${
      memberTransactions.length
    }\n\n✅ Receipt ID: SL-${selectedMember.phone.slice(-4)}-${Date.now()
      .toString()
      .slice(
        -6
      )}\n📱 Generated: ${new Date().toLocaleDateString()}\n\n🙏 Thank you for your faithful stewardship!\n"God loves a cheerful giver" - 2 Cor 9:7\n\n${
      user?.church || "Church"
    } Finance Team`;

    navigator.clipboard
      .writeText(smsText)
      .then(() => {
        alert(
          "SMS receipt copied to clipboard! You can now send it to the member."
        );
      })
      .catch(() => {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = smsText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("SMS receipt copied to clipboard!");
      });
  };

  const totalAmount = memberTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0
  );

  return (
    <div className="space-y-6">
      {/* SMS Settings Modal */}
      {showSmsSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  SMS Configuration
                </h3>
                <button
                  onClick={() => setShowSmsSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMS Provider
                  </label>
                  <select
                    value={smsConfig.provider}
                    onChange={(e) =>
                      setSmsConfig((prev) => ({
                        ...prev,
                        provider: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="africastalking">Africa's Talking</option>
                    <option value="twilio">Twilio</option>
                    <option value="custom">Custom Provider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={smsConfig.apiKey}
                    onChange={(e) =>
                      setSmsConfig((prev) => ({
                        ...prev,
                        apiKey: e.target.value,
                      }))
                    }
                    placeholder="Enter your SMS API key"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender ID
                  </label>
                  <input
                    type="text"
                    value={smsConfig.senderId}
                    onChange={(e) =>
                      setSmsConfig((prev) => ({
                        ...prev,
                        senderId: e.target.value,
                      }))
                    }
                    placeholder="e.g., SacredLedger, ChurchName"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoSend"
                    checked={smsConfig.autoSend}
                    onChange={(e) =>
                      setSmsConfig((prev) => ({
                        ...prev,
                        autoSend: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="autoSend"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Enable auto-send (send immediately when generating receipts)
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSmsSettings(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    saveSmsConfig(smsConfig);
                    setShowSmsSettings(false);
                    alert("SMS configuration saved successfully!");
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Individual Member Receipts
          </h2>

          <div className="flex items-center space-x-2">
            {/* SMS Template Selector */}
            <select
              value={smsTemplate}
              onChange={(e) => setSmsTemplate(e.target.value)}
              className="text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="detailed">Detailed SMS</option>
              <option value="simple">Simple SMS</option>
            </select>

            {/* SMS Settings Button */}
            <button
              onClick={() => setShowSmsSettings(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="h-4 w-4 mr-1" />
              SMS Setup
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Member Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Member Count */}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {filteredMembers.length} member(s) found
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Select Member</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredMembers.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <div
                    key={member.phone}
                    onClick={() => setSelectedMember(member)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMember?.phone === member.phone
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
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

                    <div className="mt-2 flex flex-wrap gap-1">
                      {member.givingTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Members Found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search terms.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Member Details and Receipt Generation */}
        <div className="space-y-6">
          {selectedMember ? (
            <>
              {/* Member Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Member Details
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={generateSMSReceipt}
                      disabled={memberTransactions.length === 0}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Copy SMS
                    </button>

                    <button
                      onClick={sendAutomatedSMS}
                      disabled={
                        memberTransactions.length === 0 ||
                        sendingSMS ||
                        !smsConfig.apiKey
                      }
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {sendingSMS ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Auto SMS
                        </>
                      )}
                    </button>

                    <button
                      onClick={generateIndividualPDF}
                      disabled={
                        memberTransactions.length === 0 || generatingReceipt
                      }
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {generatingReceipt ? "Generating..." : "PDF Receipt"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <User className="h-4 w-4 mr-2" />
                      Name
                    </div>
                    <div className="font-medium">{selectedMember.name}</div>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone
                    </div>
                    <div className="font-medium">{selectedMember.phone}</div>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      First Giving
                    </div>
                    <div className="font-medium">
                      {new Date(
                        selectedMember.firstGiving
                      ).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <History className="h-4 w-4 mr-2" />
                      Last Giving
                    </div>
                    <div className="font-medium">
                      {new Date(selectedMember.lastGiving).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Period Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Period Summary (
                  {new Date(dateRange.start).toLocaleDateString()} -{" "}
                  {new Date(dateRange.end).toLocaleDateString()})
                </h3>

                {memberTransactions.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total Amount
                        </div>
                      </div>

                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {memberTransactions.length}
                        </div>
                        <div className="text-sm text-gray-500">
                          Transactions
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Breakdown by Type:
                      </h4>
                      {Object.entries(transactionsByType).map(
                        ([type, typeTransactions]) => {
                          const typeTotal = typeTransactions.reduce(
                            (sum, t) => sum + parseFloat(t.amount),
                            0
                          );
                          return (
                            <div
                              key={type}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                              <div>
                                <div className="font-medium">{type}</div>
                                <div className="text-sm text-gray-500">
                                  {typeTransactions.length} payment(s)
                                </div>
                              </div>
                              <div className="font-bold text-lg">
                                {formatCurrency(typeTotal)}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Transactions
                    </h3>
                    <p className="text-gray-500">
                      No giving records found for this member in the selected
                      period.
                    </p>
                  </div>
                )}
              </div>

              {/* SMS Preview */}
              {selectedMember && memberTransactions.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      SMS Preview
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Template:</span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          smsTemplate === "detailed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {smsTemplate === "detailed" ? "Detailed" : "Simple"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-2">
                          To: {selectedMember.phone} ({selectedMember.name})
                        </div>
                        <div className="text-sm whitespace-pre-line font-mono bg-white p-3 rounded border">
                          {smsTemplate === "detailed"
                            ? generateDetailedSMS()
                            : generateSimpleSMS()}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Character count:{" "}
                          {
                            (smsTemplate === "detailed"
                              ? generateDetailedSMS()
                              : generateSimpleSMS()
                            ).length
                          }
                          {(smsTemplate === "detailed"
                            ? generateDetailedSMS()
                            : generateSimpleSMS()
                          ).length > 160 &&
                            ` (${Math.ceil(
                              (smsTemplate === "detailed"
                                ? generateDetailedSMS()
                                : generateSimpleSMS()
                              ).length / 160
                            )} SMS parts)`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS History */}
              {smsHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Recent SMS History
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {smsHistory.slice(0, 5).map((sms) => (
                      <div
                        key={sms.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {sms.memberName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {sms.phone}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                sms.status === "sent"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sms.status === "sent" ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sent
                                </>
                              ) : (
                                "Failed"
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(sms.timestamp).toLocaleString()} •{" "}
                            {sms.template} template
                            {sms.cost && ` • KES ${sms.cost.toFixed(2)}`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {sms.messageId}
                        </div>
                      </div>
                    ))}
                  </div>

                  {smsHistory.length > 5 && (
                    <div className="text-center mt-3">
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        View all {smsHistory.length} SMS records
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Member
                </h3>
                <p className="text-gray-500">
                  Choose a member from the list to generate their individual
                  receipt.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndividualMemberReceipts;
