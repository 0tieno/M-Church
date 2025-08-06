import React, { useState } from "react";
import { useMemberAuth } from "../../contexts/MemberAuthContext";
import {
  Phone,
  Shield,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Church,
  Heart,
  Users,
  TrendingUp,
} from "lucide-react";

const MemberLogin = () => {
  const [step, setStep] = useState("phone"); // 'phone' or 'verification'
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [demoCode, setDemoCode] = useState("");

  const { memberLogin } = useMemberAuth();

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format as 254XXXXXXXXX for Kenyan numbers
    if (digits.startsWith("0")) {
      return "254" + digits.slice(1);
    } else if (digits.startsWith("254")) {
      return digits;
    } else if (digits.length <= 9) {
      return "254" + digits;
    }

    return digits;
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();

    if (phone.length < 12) {
      setMessage({ type: "error", text: "Please enter a valid phone number" });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await memberLogin(phone);

      if (result.requiresVerification) {
        setStep("verification");
        setMessage({ type: "success", text: result.message });
        if (result.demoCode) {
          setDemoCode(result.demoCode);
        }
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setMessage({
        type: "error",
        text: "Please enter the 6-digit verification code",
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await memberLogin(phone, verificationCode);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // The context will handle the redirect to dashboard
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setIsLoading(true);
    setVerificationCode("");

    try {
      const result = await memberLogin(phone);
      if (result.requiresVerification) {
        setMessage({ type: "success", text: "New verification code sent!" });
        if (result.demoCode) {
          setDemoCode(result.demoCode);
        }
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to resend code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="flex justify-center">
          <div className="bg-blue-600 rounded-full p-3 mb-6">
            <Church className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SacredLedger Member Portal
        </h1>
        <p className="text-gray-600">Access your giving records and receipts</p>
      </div>

      {/* Features Preview */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Track Your Giving
            </h3>
            <p className="text-sm text-gray-600">
              View your complete giving history and patterns
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Analytics & Insights
            </h3>
            <p className="text-sm text-gray-600">
              Understand your stewardship journey
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Digital Receipts
            </h3>
            <p className="text-sm text-gray-600">
              Download and share your giving receipts
            </p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border">
          {step === "phone" ? (
            <>
              <div className="mb-6 text-center">
                <Phone className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Enter Your Phone Number
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  We'll send you a verification code to access your records
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) =>
                        setPhone(formatPhoneNumber(e.target.value))
                      }
                      placeholder="254712345678"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <Phone className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the phone number associated with your giving records
                  </p>
                </div>

                {message.text && (
                  <div
                    className={`rounded-md p-3 ${
                      message.type === "error"
                        ? "bg-red-50 border border-red-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <div className="flex">
                      {message.type === "error" ? (
                        <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          message.type === "error"
                            ? "text-red-800"
                            : "text-green-800"
                        }`}
                      >
                        {message.text}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || phone.length < 12}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Code...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Send Verification Code
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Enter Verification Code
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Enter the 6-digit code sent to {phone}
                </p>
                {demoCode && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Demo Code:</strong> {demoCode}
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="verification"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Verification Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="verification"
                      name="verification"
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="123456"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
                    />
                  </div>
                </div>

                {message.text && (
                  <div
                    className={`rounded-md p-3 ${
                      message.type === "error"
                        ? "bg-red-50 border border-red-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <div className="flex">
                      {message.type === "error" ? (
                        <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          message.type === "error"
                            ? "text-red-800"
                            : "text-green-800"
                        }`}
                      >
                        {message.text}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      "Verify & Login"
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-gray-50 rounded-md border">
            <div className="flex items-start">
              <Shield className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Your Privacy is Protected</p>
                <p>
                  We use SMS verification to ensure only you can access your
                  giving records. Your data is encrypted and secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Need help? Contact your church office</p>
      </div>
    </div>
  );
};

export default MemberLogin;
