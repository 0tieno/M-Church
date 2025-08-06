import React, { createContext, useContext, useState, useEffect } from "react";
import { useData } from "./DataContext";

const MemberAuthContext = createContext();

export const useMemberAuth = () => {
  const context = useContext(MemberAuthContext);
  if (!context) {
    throw new Error("useMemberAuth must be used within a MemberAuthProvider");
  }
  return context;
};

export const MemberAuthProvider = ({ children }) => {
  const [memberUser, setMemberUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { transactions } = useData();

  // Check for existing member session on mount
  useEffect(() => {
    const savedMember = localStorage.getItem("member_user");
    if (savedMember) {
      try {
        const memberData = JSON.parse(savedMember);
        setMemberUser(memberData);
      } catch (error) {
        console.error("Error parsing saved member:", error);
        localStorage.removeItem("member_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Verify member exists in system by phone number
  const verifyMember = (phone) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return null;
    }

    // Find member by phone number in transactions
    const memberTransaction = transactions.find((t) => t.phone === phone);
    if (!memberTransaction) {
      return null;
    }

    // Get all transactions for this member
    const memberTransactions = transactions.filter((t) => t.phone === phone);

    // Calculate member statistics
    const totalGiving = memberTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0
    );
    const givingTypes = [
      ...new Set(memberTransactions.map((t) => t.givingType)),
    ];
    const firstGiving = memberTransactions.reduce((earliest, t) =>
      new Date(t.date) < new Date(earliest.date) ? t : earliest
    );
    const lastGiving = memberTransactions.reduce((latest, t) =>
      new Date(t.date) > new Date(latest.date) ? t : latest
    );

    return {
      phone: memberTransaction.phone,
      name: memberTransaction.sender,
      email: "", // Will be set during registration
      totalGiving,
      transactionCount: memberTransactions.length,
      givingTypes,
      firstGiving: firstGiving.date,
      lastGiving: lastGiving.date,
      memberSince: firstGiving.date,
      isVerified: true,
    };
  };

  // Member login with phone and SMS verification
  const memberLogin = async (phone, verificationCode = null) => {
    try {
      // In a real app, you'd send SMS verification first
      if (!verificationCode) {
        // Simulate sending SMS verification code
        const randomCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        // Store verification code temporarily (in real app, store server-side)
        sessionStorage.setItem(`verification_${phone}`, randomCode);
        sessionStorage.setItem(
          `verification_${phone}_expiry`,
          (Date.now() + 5 * 60 * 1000).toString()
        );

        // In real app, send SMS here
        console.log(`SMS Verification Code for ${phone}: ${randomCode}`);

        return {
          success: false,
          requiresVerification: true,
          message: `Verification code sent to ${phone}`,
          // For demo purposes, show the code
          demoCode: randomCode,
        };
      }

      // Verify the SMS code
      const storedCode = sessionStorage.getItem(`verification_${phone}`);
      const expiry = sessionStorage.getItem(`verification_${phone}_expiry`);

      if (!storedCode || !expiry || Date.now() > parseInt(expiry)) {
        return {
          success: false,
          message: "Verification code expired. Please request a new one.",
        };
      }

      if (storedCode !== verificationCode) {
        return {
          success: false,
          message: "Invalid verification code.",
        };
      }

      // Verify member exists in system
      const member = verifyMember(phone);
      if (!member) {
        return {
          success: false,
          message:
            "No giving records found for this phone number. Please contact the church office.",
        };
      }

      // Clean up verification
      sessionStorage.removeItem(`verification_${phone}`);
      sessionStorage.removeItem(`verification_${phone}_expiry`);

      // Set member as logged in
      setMemberUser(member);
      localStorage.setItem("member_user", JSON.stringify(member));

      return {
        success: true,
        member,
        message: "Login successful!",
      };
    } catch (error) {
      console.error("Member login error:", error);
      return {
        success: false,
        message: "Login failed. Please try again.",
      };
    }
  };

  // Member logout
  const memberLogout = () => {
    setMemberUser(null);
    localStorage.removeItem("member_user");
    // Clear any verification codes
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith("verification_")) {
        sessionStorage.removeItem(key);
      }
    });
  };

  // Update member profile
  const updateMemberProfile = (updates) => {
    if (!memberUser) return false;

    const updatedMember = { ...memberUser, ...updates };
    setMemberUser(updatedMember);
    localStorage.setItem("member_user", JSON.stringify(updatedMember));
    return true;
  };

  // Get member's transactions
  const getMemberTransactions = (dateRange = null) => {
    if (!memberUser || !Array.isArray(transactions)) {
      return [];
    }

    let memberTransactions = transactions.filter(
      (t) => t.phone === memberUser.phone
    );

    if (dateRange && dateRange.start && dateRange.end) {
      memberTransactions = memberTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    return memberTransactions.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  };

  // Get member's giving analytics
  const getMemberAnalytics = (year = new Date().getFullYear()) => {
    if (!memberUser) return null;

    const yearTransactions = transactions.filter(
      (t) =>
        t.phone === memberUser.phone && new Date(t.date).getFullYear() === year
    );

    const monthlyGiving = new Array(12).fill(0);
    const givingByType = {};

    yearTransactions.forEach((t) => {
      const month = new Date(t.date).getMonth();
      monthlyGiving[month] += parseFloat(t.amount || 0);

      if (!givingByType[t.givingType]) {
        givingByType[t.givingType] = 0;
      }
      givingByType[t.givingType] += parseFloat(t.amount || 0);
    });

    const totalYearGiving = yearTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0
    );
    const avgMonthlyGiving = totalYearGiving / 12;

    return {
      year,
      monthlyGiving,
      givingByType,
      totalYearGiving,
      avgMonthlyGiving,
      transactionCount: yearTransactions.length,
      consistencyScore:
        (monthlyGiving.filter((amount) => amount > 0).length / 12) * 100,
    };
  };

  const value = {
    currentMember: memberUser, // Alias for consistency
    memberUser,
    isLoading,
    error: null, // Add error state
    memberLogin,
    memberLogout,
    logout: memberLogout, // Alias for consistency
    updateMemberProfile,
    getMemberTransactions,
    getMemberAnalytics,
    verifyMember,
  };

  return (
    <MemberAuthContext.Provider value={value}>
      {children}
    </MemberAuthContext.Provider>
  );
};

export default MemberAuthContext;
