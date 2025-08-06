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
} from "lucide-react";

const IndividualMemberReceipts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], // Start of year
    end: new Date().toISOString().split("T")[0],
  });
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

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
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Individual Member Receipts
        </h2>

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
                      SMS
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
