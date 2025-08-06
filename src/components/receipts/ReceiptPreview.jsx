import React, { useRef } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { Printer, Download, Eye } from "lucide-react";

const ReceiptPreview = ({ dateRange, selectedMember }) => {
  const printRef = useRef();
  const { transactions } = useData();
  const { user } = useAuth();

  const filteredTransactions = transactions
    .filter((t) => {
      const transactionDate = new Date(t.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      let inDateRange =
        transactionDate >= startDate && transactionDate <= endDate;

      if (selectedMember) {
        inDateRange = inDateRange && t.phone === selectedMember;
      }

      return inDateRange;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const memberInfo = selectedMember
    ? transactions.find((t) => t.phone === selectedMember)
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const printStyles = `
    <style>
      @media print {
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
        @page {
          margin: 1in;
          size: A4;
        }
        .page-break {
          page-break-after: always;
        }
      }
    </style>
  `;

  React.useEffect(() => {
    // Inject print styles
    const styleElement = document.createElement("style");
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  if (filteredTransactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Preview Available
          </h3>
          <p className="text-gray-500">
            No transactions found for the selected period and member.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6 no-print">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Print Preview</h2>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Print-Optimized Receipt */}
      <div
        ref={printRef}
        className="print-area bg-white rounded-lg shadow-lg mx-auto max-w-4xl"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          lineHeight: "1.4",
          color: "#000",
        }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "#1f2937" }}
            >
              {user?.church || "Church Name"}
            </h1>
            <h2 className="text-xl font-semibold" style={{ color: "#4b5563" }}>
              OFFICIAL GIVING RECEIPT
            </h2>
            <div className="mt-4 text-sm" style={{ color: "#6b7280" }}>
              Receipt #: {Date.now().toString().slice(-8)} | Generated:{" "}
              {new Date().toLocaleDateString()}{" "}
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Member Information */}
          <div className="mb-8">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "#1f2937" }}
            >
              Member Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Name:</strong>{" "}
                {memberInfo?.sender || "Multiple Members"}
              </div>
              <div>
                <strong>Phone:</strong> {memberInfo?.phone || "Various"}
              </div>
              <div>
                <strong>Period:</strong>{" "}
                {new Date(dateRange.start).toLocaleDateString()} -{" "}
                {new Date(dateRange.end).toLocaleDateString()}
              </div>
              <div>
                <strong>Church:</strong> {user?.church || "Church Name"}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="mb-8">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "#1f2937" }}
            >
              Giving Details
            </h3>

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Date
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Type
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "" : "bg-gray-50"}
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {transaction.givingType}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary by Type */}
          <div className="mb-8">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "#1f2937" }}
            >
              Summary by Giving Type
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(groupedByType).map(([type, transactions]) => {
                const typeTotal = transactions.reduce(
                  (sum, t) => sum + parseFloat(t.amount),
                  0
                );
                return (
                  <div
                    key={type}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded"
                  >
                    <div>
                      <div className="font-medium">{type}</div>
                      <div className="text-sm text-gray-600">
                        {transactions.length} payment(s)
                      </div>
                    </div>
                    <div className="font-bold text-lg">
                      {formatCurrency(typeTotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div
            className="mb-8 p-6 border-2 border-gray-900 rounded-lg"
            style={{ backgroundColor: "#f9fafb" }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold" style={{ color: "#1f2937" }}>
                  TOTAL GIVING
                </h3>
                <p className="text-sm text-gray-600">
                  Period: {new Date(dateRange.start).toLocaleDateString()} -{" "}
                  {new Date(dateRange.end).toLocaleDateString()}
                </p>
              </div>
              <div className="text-3xl font-bold" style={{ color: "#059669" }}>
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="border-t-2 border-gray-300 pt-6 text-center text-sm"
            style={{ color: "#6b7280" }}
          >
            <div className="mb-4">
              <p className="mb-2">
                <strong>
                  This is an official receipt for your giving records.
                </strong>
              </p>
              <p>
                Please retain this receipt for your tax and personal records.
              </p>
            </div>

            <div className="mb-4">
              <p>
                "Each of you should give what you have decided in your heart to
                give,
              </p>
              <p>
                not reluctantly or under compulsion, for God loves a cheerful
                giver."
              </p>
              <p className="font-medium">- 2 Corinthians 9:7</p>
            </div>

            <div className="text-xs">
              <p>
                Generated by: {user?.name || "System"} | SacredLedger: M-Church
                Records
              </p>
              <p>
                For questions about this receipt, please contact the church
                treasurer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 no-print">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Print Instructions
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Click "Print Receipt" to open the print dialog</li>
                <li>For best results, use A4 paper size</li>
                <li>
                  Ensure "Print backgrounds" is enabled in your browser settings
                </li>
                <li>Consider printing in portrait orientation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;
