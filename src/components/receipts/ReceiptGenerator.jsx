import React, { useState, useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import DigitalReceiptCard from "./DigitalReceiptCard";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Download,
  FileText,
  Mail,
  Printer,
  QrCode,
  Share2,
} from "lucide-react";

const ReceiptGenerator = ({
  dateRange,
  selectedMember,
  onDateRangeChange,
  onMemberChange,
  members,
}) => {
  const [receiptFormat, setReceiptFormat] = useState("detailed"); // detailed, summary, minimal
  const [includeQR, setIncludeQR] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { transactions } = useData();
  const { user } = useAuth();

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      return transactionDate >= startDate && transactionDate <= endDate;
    });

    if (selectedMember) {
      filtered = filtered.filter((t) => t.phone === selectedMember);
    }

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transactions, dateRange, selectedMember]);

  const receiptData = useMemo(() => {
    if (filteredTransactions.length === 0) return null;

    const memberInfo = selectedMember
      ? members.find((m) => m.phone === selectedMember)
      : null;

    const groupedByType = filteredTransactions.reduce((acc, t) => {
      acc[t.givingType] = acc[t.givingType] || [];
      acc[t.givingType].push(t);
      return acc;
    }, {});

    const totalAmount = filteredTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );

    return {
      memberInfo,
      transactions: filteredTransactions,
      groupedByType,
      totalAmount,
      period: {
        start: new Date(dateRange.start).toLocaleDateString(),
        end: new Date(dateRange.end).toLocaleDateString(),
      },
      generatedBy: user?.name || "System",
      generatedDate: new Date().toLocaleDateString(),
      church: user?.church || "Church",
    };
  }, [filteredTransactions, selectedMember, members, dateRange, user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const generateQRCode = (data) => {
    // Simple QR code data string - in production, use a proper QR library
    const qrData = `${data.church}|${
      data.memberInfo?.name || "Multiple Members"
    }|${formatCurrency(data.totalAmount)}|${data.period.start}-${
      data.period.end
    }`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
      qrData
    )}`;
  };

  const generatePDF = async () => {
    if (!receiptData) return;

    setGenerating(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(receiptData.church, 105, 20, { align: "center" });

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "normal");
      pdf.text("GIVING RECEIPT", 105, 30, { align: "center" });

      // Receipt details
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      let yPos = 50;

      if (receiptData.memberInfo) {
        pdf.text(`Name: ${receiptData.memberInfo.name}`, 20, yPos);
        yPos += 7;
        pdf.text(`Phone: ${receiptData.memberInfo.phone}`, 20, yPos);
        yPos += 7;
      }

      pdf.text(
        `Period: ${receiptData.period.start} - ${receiptData.period.end}`,
        20,
        yPos
      );
      yPos += 7;
      pdf.text(
        `Generated: ${receiptData.generatedDate} by ${receiptData.generatedBy}`,
        20,
        yPos
      );
      yPos += 15;

      // Transactions table
      pdf.setFont("helvetica", "bold");
      pdf.text("Date", 20, yPos);
      pdf.text("Type", 60, yPos);
      pdf.text("Amount", 140, yPos);
      yPos += 7;

      pdf.setFont("helvetica", "normal");

      if (receiptFormat === "detailed") {
        receiptData.transactions.forEach((transaction) => {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }

          pdf.text(new Date(transaction.date).toLocaleDateString(), 20, yPos);
          pdf.text(transaction.givingType, 60, yPos);
          pdf.text(formatCurrency(transaction.amount), 140, yPos);
          yPos += 7;
        });
      } else {
        Object.entries(receiptData.groupedByType).forEach(
          ([type, transactions]) => {
            const typeTotal = transactions.reduce(
              (sum, t) => sum + parseFloat(t.amount),
              0
            );
            pdf.text(`${type} (${transactions.length} payments)`, 20, yPos);
            pdf.text(formatCurrency(typeTotal), 140, yPos);
            yPos += 7;
          }
        );
      }

      // Total
      yPos += 10;
      pdf.setFont("helvetica", "bold");
      pdf.text("TOTAL:", 20, yPos);
      pdf.text(formatCurrency(receiptData.totalAmount), 140, yPos);

      // Footer
      yPos += 20;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "This is an official receipt for your giving records.",
        105,
        yPos,
        { align: "center" }
      );
      pdf.text("Thank you for your faithful support.", 105, yPos + 5, {
        align: "center",
      });

      // Save PDF
      const fileName = receiptData.memberInfo
        ? `receipt-${receiptData.memberInfo.name.replace(
            /\s+/g,
            "-"
          )}-${receiptData.period.start.replace(/\//g, "-")}.pdf`
        : `receipts-summary-${receiptData.period.start.replace(
            /\//g,
            "-"
          )}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const generateDigitalReceipt = () => {
    if (!receiptData) return;

    const digitalReceipt = {
      church: receiptData.church,
      member: receiptData.memberInfo,
      period: receiptData.period,
      transactions: receiptData.transactions,
      total: receiptData.totalAmount,
      generatedDate: receiptData.generatedDate,
      generatedBy: receiptData.generatedBy,
    };

    const blob = new Blob([JSON.stringify(digitalReceipt, null, 2)], {
      type: "application/json",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `digital-receipt-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateSMSReceipt = () => {
    if (!receiptData || !receiptData.memberInfo) {
      alert("Please select a specific member to generate SMS receipt");
      return;
    }

    const smsText = `Hello ${
      receiptData.memberInfo.name
    },\n\nYour giving summary for ${receiptData.period.start} - ${
      receiptData.period.end
    }:\n\n${Object.entries(receiptData.groupedByType)
      .map(([type, transactions]) => {
        const total = transactions.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );
        return `${type}: ${formatCurrency(total)}`;
      })
      .join("\n")}\n\nTotal: ${formatCurrency(
      receiptData.totalAmount
    )}\n\nThank you for your faithful support.\n- ${receiptData.church}`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(smsText)
      .then(() => {
        alert("SMS receipt copied to clipboard!");
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = smsText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("SMS receipt copied to clipboard!");
      });
  };

  if (!receiptData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Data Found
          </h3>
          <p className="text-gray-500">
            No transactions found for the selected period and member.
            {!selectedMember &&
              " Try selecting a specific member or adjusting the date range."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Receipt Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Receipt Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Format
            </label>
            <select
              value={receiptFormat}
              onChange={(e) => setReceiptFormat(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="detailed">Detailed (All Transactions)</option>
              <option value="summary">Summary by Type</option>
              <option value="minimal">Minimal (Total Only)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeQR"
              checked={includeQR}
              onChange={(e) => setIncludeQR(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="includeQR"
              className="text-sm font-medium text-gray-700"
            >
              Include QR Code
            </label>
          </div>
        </div>
      </div>

      {/* Receipt Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Receipt Preview</h2>

          <div className="flex items-center space-x-3">
            <button
              onClick={generateSMSReceipt}
              disabled={!receiptData.memberInfo}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Mail className="h-4 w-4 mr-1" />
              SMS
            </button>

            <button
              onClick={generateDigitalReceipt}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Digital
            </button>

            <button
              onClick={generatePDF}
              disabled={generating}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1" />
              {generating ? "Generating..." : "PDF"}
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {receiptData.church}
            </h1>
            <h2 className="text-lg font-medium text-gray-700">
              GIVING RECEIPT
            </h2>
          </div>

          <div className="mb-6 space-y-2 text-sm">
            {receiptData.memberInfo && (
              <>
                <div>
                  <strong>Name:</strong> {receiptData.memberInfo.name}
                </div>
                <div>
                  <strong>Phone:</strong> {receiptData.memberInfo.phone}
                </div>
              </>
            )}
            <div>
              <strong>Period:</strong> {receiptData.period.start} -{" "}
              {receiptData.period.end}
            </div>
            <div>
              <strong>Generated:</strong> {receiptData.generatedDate} by{" "}
              {receiptData.generatedBy}
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {receiptFormat === "detailed"
                  ? receiptData.transactions.map((transaction, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="py-2">{transaction.givingType}</td>
                        <td className="py-2 text-right">
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))
                  : Object.entries(receiptData.groupedByType).map(
                      ([type, transactions]) => {
                        const typeTotal = transactions.reduce(
                          (sum, t) => sum + parseFloat(t.amount),
                          0
                        );
                        return (
                          <tr key={type} className="border-b border-gray-200">
                            <td className="py-2">{type}</td>
                            <td className="py-2">
                              {transactions.length} payments
                            </td>
                            <td className="py-2 text-right">
                              {formatCurrency(typeTotal)}
                            </td>
                          </tr>
                        );
                      }
                    )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-900 font-bold">
                  <td className="py-2" colSpan="2">
                    TOTAL:
                  </td>
                  <td className="py-2 text-right">
                    {formatCurrency(receiptData.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {includeQR && (
            <div className="flex justify-center mb-4">
              <img
                src={generateQRCode(receiptData)}
                alt="QR Code"
                className="border rounded"
              />
            </div>
          )}

          <div className="text-center text-xs text-gray-500">
            <p>This is an official receipt for your giving records.</p>
            <p>Thank you for your faithful support.</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Receipt Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {receiptData.transactions.length}
            </div>
            <div className="text-sm text-gray-500">Total Transactions</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(receiptData.totalAmount)}
            </div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(receiptData.groupedByType).length}
            </div>
            <div className="text-sm text-gray-500">Giving Types</div>
          </div>
        </div>
      </div>

      {/* Digital Receipt Card */}
      <DigitalReceiptCard receiptData={receiptData} />
    </div>
  );
};

export default ReceiptGenerator;
