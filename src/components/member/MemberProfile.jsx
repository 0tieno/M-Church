import React, { useState, useEffect } from "react";
import { useMemberAuth } from "../../contexts/MemberAuthContext";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Bell,
  Shield,
  Download,
  Key,
  CreditCard,
  Heart,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const MemberProfile = () => {
  const { currentMember, updateMemberProfile, logout } = useMemberAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePhone, setShowChangePhone] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    address: "",
    dateOfBirth: "",
    memberSince: "",
    emergencyContact: "",
    preferredContact: "sms",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    smsReceipts: true,
    emailReceipts: false,
    givingReminders: true,
    eventNotifications: true,
    weeklyReports: false,
    monthlyStatements: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    shareGivingHistory: false,
    allowDirectContact: true,
    dataRetention: "7years",
    communicationPreference: "essential",
  });

  useEffect(() => {
    if (currentMember) {
      setProfileData({
        name: currentMember.name || "",
        email: currentMember.email || "",
        address: currentMember.address || "",
        dateOfBirth: currentMember.dateOfBirth || "",
        memberSince:
          currentMember.memberSince || new Date().toISOString().split("T")[0],
        emergencyContact: currentMember.emergencyContact || "",
        preferredContact: currentMember.preferredContact || "sms",
      });

      // Load saved settings from localStorage
      const savedNotifications = localStorage.getItem(
        `notifications_${currentMember.phone}`
      );
      if (savedNotifications) {
        setNotificationSettings(JSON.parse(savedNotifications));
      }

      const savedPrivacy = localStorage.getItem(
        `privacy_${currentMember.phone}`
      );
      if (savedPrivacy) {
        setPrivacySettings(JSON.parse(savedPrivacy));
      }
    }
  }, [currentMember]);

  const handleProfileSave = async () => {
    try {
      setSaveStatus("saving");

      // Update profile in context and localStorage
      const updatedProfile = { ...currentMember, ...profileData };
      updateMemberProfile(updatedProfile);

      // Save notification settings
      localStorage.setItem(
        `notifications_${currentMember.phone}`,
        JSON.stringify(notificationSettings)
      );

      // Save privacy settings
      localStorage.setItem(
        `privacy_${currentMember.phone}`,
        JSON.stringify(privacySettings)
      );

      setSaveStatus("success");
      setIsEditing(false);

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handlePhoneChange = () => {
    // Simulate sending verification code to new phone
    setShowVerificationCode(true);
    // In real implementation, this would call SMS API
    console.log(`Sending verification code to ${newPhone}`);
  };

  const verifyNewPhone = () => {
    if (verificationCode === "123456") {
      // Demo verification
      const updatedMember = { ...currentMember, phone: newPhone };
      updateMemberProfile(updatedMember);
      setShowChangePhone(false);
      setShowVerificationCode(false);
      setVerificationCode("");
      setNewPhone("");
      setSaveStatus("success");
    } else {
      setSaveStatus("error");
    }
  };

  const exportMemberData = () => {
    const memberData = {
      profile: { ...currentMember, ...profileData },
      notifications: notificationSettings,
      privacy: privacySettings,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(memberData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `member-data-${currentMember.phone}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatPhone = (phone) => {
    if (!phone) return "Not provided";
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "security", label: "Security", icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentMember?.name}
              </h2>
              <p className="text-gray-600">
                {formatPhone(currentMember?.phone)}
              </p>
              <p className="text-sm text-gray-500">
                Member since{" "}
                {new Date(profileData.memberSince).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            {saveStatus && (
              <div
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  saveStatus === "success"
                    ? "bg-green-100 text-green-800"
                    : saveStatus === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {saveStatus === "success" && (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {saveStatus === "error" && (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                {saveStatus === "saving" && (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                )}
                {saveStatus === "success" && "Settings saved successfully"}
                {saveStatus === "error" && "Error saving settings"}
                {saveStatus === "saving" && "Saving..."}
              </div>
            )}

            <button
              onClick={exportMemberData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Personal Information
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formatPhone(currentMember?.phone)}
                        disabled
                        className="pl-10 w-full rounded-l-md border border-r-0 border-gray-300 px-3 py-2 bg-gray-50"
                      />
                    </div>
                    <button
                      onClick={() => setShowChangePhone(true)}
                      className="px-3 py-2 border border-gray-300 rounded-r-md text-sm text-blue-600 hover:bg-blue-50"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      rows={3}
                      className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={profileData.emergencyContact}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          emergencyContact: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Contact Method
                  </label>
                  <select
                    value={profileData.preferredContact}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        preferredContact: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Notification Preferences
              </h3>

              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {key === "smsReceipts" &&
                          "Receive SMS receipts for your giving"}
                        {key === "emailReceipts" &&
                          "Receive email receipts for your giving"}
                        {key === "givingReminders" &&
                          "Get gentle reminders about consistent giving"}
                        {key === "eventNotifications" &&
                          "Stay updated on church events and announcements"}
                        {key === "weeklyReports" &&
                          "Weekly summary of your giving activity"}
                        {key === "monthlyStatements" &&
                          "Monthly detailed giving statements"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            [key]: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleProfileSave}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Privacy Settings
              </h3>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Data Sharing
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Share Giving History
                        </p>
                        <p className="text-xs text-gray-500">
                          Allow church leadership to view your giving patterns
                          for pastoral care
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.shareGivingHistory}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              shareGivingHistory: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Allow Direct Contact
                        </p>
                        <p className="text-xs text-gray-500">
                          Permit church staff to contact you directly for
                          ministry purposes
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.allowDirectContact}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              allowDirectContact: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Data Retention
                  </h4>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      How long should we keep your data?
                    </label>
                    <select
                      value={privacySettings.dataRetention}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          dataRetention: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1year">1 Year</option>
                      <option value="3years">3 Years</option>
                      <option value="7years">
                        7 Years (Recommended for tax purposes)
                      </option>
                      <option value="indefinite">Indefinitely</option>
                    </select>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Communication Preferences
                  </h4>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      What communications would you like to receive?
                    </label>
                    <select
                      value={privacySettings.communicationPreference}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          communicationPreference: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="essential">
                        Essential Only (Receipts, Security)
                      </option>
                      <option value="pastoral">
                        Essential + Pastoral Care
                      </option>
                      <option value="ministry">
                        Essential + Ministry Updates
                      </option>
                      <option value="all">All Communications</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleProfileSave}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Save Privacy Settings
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Security & Access
              </h3>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Phone Verification
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Current phone: {formatPhone(currentMember?.phone)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last verified: Today
                      </p>
                    </div>
                    <button
                      onClick={() => setShowChangePhone(true)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Change Phone
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Access History
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Last login</span>
                      <span className="text-gray-500">Today at 2:30 PM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Previous login</span>
                      <span className="text-gray-500">
                        Yesterday at 8:45 AM
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Account created</span>
                      <span className="text-gray-500">
                        {new Date(profileData.memberSince).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="text-sm font-medium text-red-900 mb-3">
                    Danger Zone
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-red-700 mb-2">
                        Signing out will require phone verification to access
                        your account again.
                      </p>
                      <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>

                    <div className="border-t border-red-200 pt-3">
                      <p className="text-sm text-red-700 mb-2">
                        Request complete account data deletion. This action
                        cannot be undone.
                      </p>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                        Request Data Deletion
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Phone Modal */}
      {showChangePhone && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Phone Number
              </h3>

              {!showVerificationCode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+254712345678"
                        className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowChangePhone(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePhoneChange}
                      disabled={!newPhone}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Send Verification
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      We've sent a verification code to {newPhone}
                    </p>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Demo: Use 123456
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowChangePhone(false);
                        setShowVerificationCode(false);
                        setVerificationCode("");
                        setNewPhone("");
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={verifyNewPhone}
                      disabled={!verificationCode}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Verify & Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfile;
