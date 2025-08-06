import React, { useState } from "react";
import {
  Settings,
  Phone,
  Key,
  Send,
  Info,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const SMSSettings = () => {
  const [config, setConfig] = useState({
    apiKey: localStorage.getItem("sms_api_key") || "",
    senderId: localStorage.getItem("sms_sender_id") || "SacredLedger",
    provider: localStorage.getItem("sms_provider") || "africastalking",
    username: localStorage.getItem("sms_username") || "",
    autoSend: localStorage.getItem("sms_auto_send") === "true" || false,
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const providers = [
    {
      id: "africastalking",
      name: "Africa's Talking",
      description: "Popular SMS gateway for Africa",
      setupUrl: "https://africastalking.com",
      fields: ["username", "apiKey"],
    },
    {
      id: "twilio",
      name: "Twilio",
      description: "Global SMS and communication platform",
      setupUrl: "https://twilio.com",
      fields: ["accountSid", "authToken"],
    },
    {
      id: "textlocal",
      name: "TextLocal",
      description: "UK-based SMS service",
      setupUrl: "https://textlocal.com",
      fields: ["apiKey"],
    },
  ];

  const saveConfig = () => {
    localStorage.setItem("sms_api_key", config.apiKey);
    localStorage.setItem("sms_sender_id", config.senderId);
    localStorage.setItem("sms_provider", config.provider);
    localStorage.setItem("sms_username", config.username);
    localStorage.setItem("sms_auto_send", config.autoSend.toString());

    alert("SMS configuration saved successfully!");
  };

  const testConnection = async () => {
    if (!config.apiKey) {
      alert("Please enter your API key first");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Simulate API test - replace with actual test
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful test
      setTestResult({
        success: true,
        message: "Connection successful! SMS service is ready.",
        balance: "KES 250.50", // Mock balance
        credit: "125 SMS credits",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Connection failed. Please check your credentials.",
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const selectedProvider = providers.find((p) => p.id === config.provider);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                SMS Configuration
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure your SMS provider to send automated receipts to
                members
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              SMS Provider
            </label>
            <div className="grid grid-cols-1 gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    config.provider === provider.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, provider: provider.id }))
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={config.provider === provider.id}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            provider: provider.id,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {provider.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    <a
                      href={provider.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Provider-specific Configuration */}
          {selectedProvider && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedProvider.name} Configuration
              </h3>

              {/* Username field for Africa's Talking */}
              {config.provider === "africastalking" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Your Africa's Talking username"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usually 'sandbox' for testing or your app name for
                    production
                  </p>
                </div>
              )}

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Key className="inline h-4 w-4 mr-1" />
                  {config.provider === "twilio" ? "Auth Token" : "API Key"}
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                  placeholder={`Enter your ${selectedProvider.name} ${
                    config.provider === "twilio" ? "auth token" : "API key"
                  }`}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sender ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Sender ID
                </label>
                <input
                  type="text"
                  value={config.senderId}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, senderId: e.target.value }))
                  }
                  placeholder="e.g., SacredLedger, ChurchName"
                  maxLength={11}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 11 characters. This appears as the sender name in SMS
                  messages.
                </p>
              </div>

              {/* Auto-send Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSend"
                  checked={config.autoSend}
                  onChange={(e) =>
                    setConfig((prev) => ({
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
                  Enable automatic SMS sending
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                When enabled, SMS receipts will be sent automatically when
                generating individual receipts
              </p>
            </div>
          )}

          {/* Test Connection */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Test Connection
              </h3>
              <button
                onClick={testConnection}
                disabled={testing || !config.apiKey}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`rounded-md p-4 ${
                  testResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-start">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4
                      className={`text-sm font-medium ${
                        testResult.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {testResult.success
                        ? "Connection Successful"
                        : "Connection Failed"}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${
                        testResult.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {testResult.message}
                    </p>
                    {testResult.success && testResult.balance && (
                      <div className="mt-2 text-sm text-green-700">
                        <div>Account Balance: {testResult.balance}</div>
                        <div>Available Credits: {testResult.credit}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="border-t pt-6">
            <div className="flex justify-end space-x-3">
              <button
                onClick={saveConfig}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Configuration
              </button>
            </div>
          </div>

          {/* Help Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <h4 className="font-medium mb-1">SMS Setup Help</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Create an account with your chosen SMS provider</li>
                  <li>
                    Get your API credentials from the provider's dashboard
                  </li>
                  <li>Test the connection before using in production</li>
                  <li>
                    Monitor your SMS credits and account balance regularly
                  </li>
                  <li>Ensure your sender ID is approved by the provider</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSSettings;
