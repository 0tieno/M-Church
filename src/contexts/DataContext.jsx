import React, { createContext, useContext, useState, useEffect } from "react";

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [uploadBatches, setUploadBatches] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load data from localStorage on init
  useEffect(() => {
    const savedTransactions = localStorage.getItem("sacredledger_transactions");
    const savedBatches = localStorage.getItem("sacredledger_batches");
    const savedLogs = localStorage.getItem("sacredledger_logs");

    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (error) {
        console.error("Error loading transactions:", error);
      }
    }

    if (savedBatches) {
      try {
        setUploadBatches(JSON.parse(savedBatches));
      } catch (error) {
        console.error("Error loading batches:", error);
      }
    }

    if (savedLogs) {
      try {
        setActivityLogs(JSON.parse(savedLogs));
      } catch (error) {
        console.error("Error loading logs:", error);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(
      "sacredledger_transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("sacredledger_batches", JSON.stringify(uploadBatches));
  }, [uploadBatches]);

  useEffect(() => {
    localStorage.setItem("sacredledger_logs", JSON.stringify(activityLogs));
  }, [activityLogs]);

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setTransactions((prev) => [...prev, newTransaction]);
    return newTransaction;
  };

  const addBatch = (batch) => {
    const newBatch = {
      ...batch,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      uploadDate: new Date().toISOString(),
    };
    setUploadBatches((prev) => [...prev, newBatch]);
    return newBatch;
  };

  const addActivityLog = (log) => {
    const newLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const checkDuplicateTransaction = (transaction) => {
    return transactions.some(
      (t) =>
        t.completionTime === transaction.completionTime &&
        t.amount === transaction.amount &&
        t.phone === transaction.phone &&
        t.sender === transaction.sender
    );
  };

  const getTransactionsSummary = () => {
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(
      (t) => new Date(t.date).toDateString() === today
    );

    const totalToday = todayTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );

    const typeBreakdown = transactions.reduce((acc, t) => {
      acc[t.givingType] = (acc[t.givingType] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

    return {
      totalToday,
      totalTransactions: transactions.length,
      todayTransactions: todayTransactions.length,
      typeBreakdown,
    };
  };

  const value = {
    transactions,
    uploadBatches,
    activityLogs,
    loading,
    setLoading,
    addTransaction,
    addBatch,
    addActivityLog,
    checkDuplicateTransaction,
    getTransactionsSummary,
    setTransactions,
    setUploadBatches,
    setActivityLogs,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
