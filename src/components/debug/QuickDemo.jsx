import React from "react";
import { useMemberAuth } from "../../contexts/MemberAuthContext";
import { useData } from "../../contexts/DataContext";
import { User, Zap } from "lucide-react";

const QuickDemo = () => {
  const { memberLogin } = useMemberAuth();
  const { transactions, setTransactions } = useData();

  const createDemoUser = async () => {
    // Create demo transaction data if none exists
    if (transactions.length === 0) {
      const demoTransactions = [
        {
          id: "demo1",
          completionTime: "2024-12-15T10:30:00Z",
          amount: "5000",
          phone: "demo",
          sender: "Demo User",
          givingType: "Tithe",
          date: "2024-12-15",
          mpesaReference: "DEMO001",
        },
        {
          id: "demo2",
          completionTime: "2024-12-08T09:15:00Z",
          amount: "2000",
          phone: "demo",
          sender: "Demo User",
          givingType: "Offering",
          date: "2024-12-08",
          mpesaReference: "DEMO002",
        },
        {
          id: "demo3",
          completionTime: "2024-12-01T11:00:00Z",
          amount: "10000",
          phone: "demo",
          sender: "Demo User",
          givingType: "Building Fund",
          date: "2024-12-01",
          mpesaReference: "DEMO003",
        },
        {
          id: "demo4",
          completionTime: "2024-11-24T08:45:00Z",
          amount: "5000",
          phone: "demo",
          sender: "Demo User",
          givingType: "Tithe",
          date: "2024-11-24",
          mpesaReference: "DEMO004",
        },
        {
          id: "demo5",
          completionTime: "2024-11-17T14:20:00Z",
          amount: "3000",
          phone: "demo",
          sender: "Demo User",
          givingType: "Offering",
          date: "2024-11-17",
          mpesaReference: "DEMO005",
        },
      ];
      setTransactions(demoTransactions);
    }

    // Create demo member directly without phone verification
    const demoMember = {
      phone: "demo",
      name: "Demo User",
      email: "demo@church.com",
      totalGiving: 25000,
      transactionCount: 5,
      givingTypes: ["Tithe", "Offering", "Building Fund"],
      firstGiving: "2024-11-17",
      lastGiving: "2024-12-15",
      memberSince: "2024-11-17",
      isVerified: true,
      isDemoMode: true,
    };

    // Set member as logged in directly
    localStorage.setItem("member_user", JSON.stringify(demoMember));
    window.location.reload(); // Refresh to load the member portal
  };

  const availablePhones = [...new Set(transactions.map((t) => t.phone))].filter(
    Boolean
  );

  const loginWithExistingPhone = async (phone) => {
    try {
      // First try to send verification code
      const result = await memberLogin(phone);

      if (result.requiresVerification) {
        // Auto-login with demo code
        const loginResult = await memberLogin(phone, "123456");
        if (loginResult.success) {
          alert(`Successfully logged in as ${loginResult.member.name}!`);
        } else {
          alert(`Login failed: ${loginResult.message}`);
        }
      } else {
        alert(`Login failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 m-4">
      <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center">
        <Zap className="h-6 w-6 mr-2" />
        🚀 Quick Demo Access
      </h2>

      <div className="space-y-4">
        {/* Instant Demo Login */}
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-green-700 mb-2">🎯 Instant Demo</h3>
          <p className="text-sm text-gray-600 mb-3">
            Skip phone verification entirely - get instant access to the member
            portal with demo data.
          </p>
          <button
            onClick={createDemoUser}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            <User className="h-4 w-4 mr-2 inline" />
            Enter Demo Portal Now
          </button>
        </div>

        {/* Quick Login with Existing Data */}
        {availablePhones.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-700 mb-2">
              📱 Login with Existing Data
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Use phone numbers from your uploaded transaction data (auto-fills
              verification code).
            </p>
            <div className="space-y-2">
              {availablePhones.map((phone, index) => {
                const phoneTransactions = transactions.filter(
                  (t) => t.phone === phone
                );
                const memberName = phoneTransactions[0]?.sender || "Unknown";

                return (
                  <button
                    key={index}
                    onClick={() => loginWithExistingPhone(phone)}
                    className="w-full px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-left text-sm border border-blue-300"
                  >
                    <div className="font-medium text-blue-800">{phone}</div>
                    <div className="text-blue-600 text-xs">
                      {memberName} • {phoneTransactions.length} transactions
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-semibold text-yellow-700 mb-2">
            💡 How to Test:
          </h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>
              <strong>Easiest:</strong> Click "Enter Demo Portal Now" for
              instant access
            </li>
            <li>
              <strong>With Real Data:</strong> Upload CSV first, then click a
              phone number above
            </li>
            <li>
              <strong>Manual:</strong> Load test data, then use +254712345678
              with code 123456
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default QuickDemo;
