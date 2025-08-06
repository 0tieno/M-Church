import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { Share2, Smartphone, Globe, Copy } from "lucide-react";

const DigitalReceiptCard = ({ receiptData }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [shareMethod, setShareMethod] = useState("link");
  const canvasRef = useRef();
  const { user } = useAuth();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  useEffect(() => {
    if (receiptData) {
      generateQRCode();
    }
  }, [receiptData]);

  const generateQRCode = async () => {
    if (!receiptData) return;

    const qrData = {
      church: receiptData.church,
      member: receiptData.memberInfo?.name || "Multiple Members",
      phone: receiptData.memberInfo?.phone || "Various",
      period: `${receiptData.period.start} - ${receiptData.period.end}`,
      total: receiptData.totalAmount,
      breakdown: Object.entries(receiptData.groupedByType).map(
        ([type, transactions]) => ({
          type,
          amount: transactions.reduce(
            (sum, t) => sum + parseFloat(t.amount),
            0
          ),
          count: transactions.length,
        })
      ),
      generatedDate: receiptData.generatedDate,
      receiptId: `SL-${Date.now().toString().slice(-8)}`,
      verification: `https://sacredledger.org/verify/${Date.now()
        .toString()
        .slice(-8)}`,
    };

    try {
      const qrString = JSON.stringify(qrData);
      const qrUrl = await QRCode.toDataURL(qrString, {
        width: 200,
        margin: 2,
        color: {
          dark: "#1f2937",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const generateWebLink = () => {
    const webData = {
      church: receiptData.church,
      member: receiptData.memberInfo?.name || "Multiple Members",
      total: receiptData.totalAmount,
      period: `${receiptData.period.start} - ${receiptData.period.end}`,
      transactions: receiptData.transactions.length,
    };

    const encodedData = btoa(JSON.stringify(webData));
    return `https://sacredledger.org/receipt/${encodedData}`;
  };

  const generateSMSText = () => {
    const breakdown = Object.entries(receiptData.groupedByType)
      .map(([type, transactions]) => {
        const total = transactions.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );
        return `${type}: ${formatCurrency(total)}`;
      })
      .join("\n");

    return `🏛️ ${receiptData.church}\n📧 GIVING RECEIPT\n\n👤 ${
      receiptData.memberInfo?.name || "Multiple Members"
    }\n📅 ${receiptData.period.start} - ${
      receiptData.period.end
    }\n\n💰 BREAKDOWN:\n${breakdown}\n\n🎯 TOTAL: ${formatCurrency(
      receiptData.totalAmount
    )}\n\n✅ Receipt ID: SL-${Date.now().toString().slice(-8)}\n📱 Generated: ${
      receiptData.generatedDate
    }\n\n🙏 Thank you for your faithful support!\n"Each of you should give what you have decided in your heart to give" - 2 Cor 9:7`;
  };

  const generateWhatsAppLink = () => {
    const message = generateSMSText();
    return `https://wa.me/${receiptData.memberInfo?.phone?.replace(
      /\D/g,
      ""
    )}?text=${encodeURIComponent(message)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Copied to clipboard!");
      })
      .catch(() => {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Copied to clipboard!");
      });
  };

  const shareViaWeb = () => {
    if (navigator.share) {
      navigator.share({
        title: `${receiptData.church} - Giving Receipt`,
        text: `Giving receipt for ${receiptData.period.start} - ${receiptData.period.end}`,
        url: generateWebLink(),
      });
    } else {
      copyToClipboard(generateWebLink());
    }
  };

  const shareViaSMS = () => {
    copyToClipboard(generateSMSText());
  };

  const openWhatsApp = () => {
    if (receiptData.memberInfo?.phone) {
      window.open(generateWhatsAppLink(), "_blank");
    } else {
      alert("Phone number required for WhatsApp sharing");
    }
  };

  if (!receiptData) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Digital Receipt</h3>

        <div className="flex items-center space-x-2">
          <select
            value={shareMethod}
            onChange={(e) => setShareMethod(e.target.value)}
            className="text-sm rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="link">Web Link</option>
            <option value="sms">SMS Text</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Receipt QR Code" className="mx-auto" />
            ) : (
              <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">Generating QR...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Scan to view receipt details
          </p>
        </div>

        {/* Share Options */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Share Receipt</h4>

            <div className="space-y-3">
              <button
                onClick={shareViaWeb}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Globe className="h-4 w-4 mr-2" />
                Share Web Link
              </button>

              <button
                onClick={shareViaSMS}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Copy SMS Text
              </button>

              <button
                onClick={openWhatsApp}
                disabled={!receiptData.memberInfo?.phone}
                className="w-full flex items-center justify-center px-4 py-3 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Send WhatsApp
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <h5 className="font-medium text-gray-900 mb-2">Receipt Details</h5>
            <div className="text-sm space-y-1 text-gray-600">
              <div>ID: SL-{Date.now().toString().slice(-8)}</div>
              <div>Member: {receiptData.memberInfo?.name || "Multiple"}</div>
              <div>Total: {formatCurrency(receiptData.totalAmount)}</div>
              <div>
                Period: {receiptData.period.start} - {receiptData.period.end}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 bg-white rounded-lg border text-sm">
        <h5 className="font-medium text-gray-900 mb-2">
          Preview ({shareMethod})
        </h5>
        <div className="text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
          {shareMethod === "link" && (
            <code className="text-xs break-all">{generateWebLink()}</code>
          )}
          {shareMethod === "sms" && generateSMSText()}
          {shareMethod === "whatsapp" && generateSMSText()}
        </div>
      </div>
    </div>
  );
};

export default DigitalReceiptCard;
