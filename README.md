# SacredLedger: M-Church Records - Treasurer Module

A comprehensive church financial management system focused on automating M-Pesa paybill statement processing and providing transparent financial tracking for church giving.

## 🚀 Features

### ✅ Implemented

- **🔐 Authentication System**: Secure login for Treasurer role
- **📤 M-Pesa Statement Upload**: CSV file upload with drag-and-drop support
- **🧠 Automatic Record Parsing**: Intelligent parsing of M-Pesa transactions with categorization
- **🔍 Duplicate Detection**: Automatic detection and handling of duplicate transactions
- **📊 Analytics Dashboard**: Real-time financial summaries and giving breakdowns
- **🔍 Advanced Filtering**: Search and filter transactions by various criteria
- **📁 Batch Management**: Organized tracking of upload batches
- **📋 Activity Logging**: Comprehensive audit trail of all system activities
- **📈 Export Functionality**: CSV export of filtered transaction data

### 🛠 Technical Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Icons**: Lucide React
- **CSV Parsing**: PapaParse
- **Data Storage**: LocalStorage (for demo - easily replaceable with backend)

## 🎯 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Demo Login

- **Email**: `treasurer@sacredledger.org`
- **Password**: `password123`

## 📋 Usage Guide

### 1. Authentication

- Access the system at the login page
- Use the demo credentials provided above
- Successfully logged-in users are redirected to the dashboard

### 2. Dashboard Overview

- View real-time financial summaries
- Monitor today's receipts and total transactions
- See giving breakdowns by type (Tithe, Offering, etc.)
- Track unique givers and upload activity

### 3. M-Pesa Statement Upload

- Navigate to "Upload Statement" tab
- Drag and drop your CSV file or click to browse
- System automatically processes and categorizes transactions
- View upload summary with new transactions and duplicates

### 4. Expected CSV Format

```csv
Completion Time,Amount,Account Number,Sender Name,Phone Number
06/08/2025 10:21 AM,500.00,768769#Tithe,John Doe,254712345678
06/08/2025 11:00 AM,1000.00,768769#Offering,Jane Smith,254798765432
```

**Account Number Format**: `PaybillNumber#GivingType`

- Examples: `768769#Tithe`, `768769#Offering`, `768769#Camp Meeting`

### 5. Transaction Management

- View all transactions in a searchable, filterable table
- Filter by date range, giving type, or search by name/phone
- Sort by date, amount, or sender name
- Export filtered results to CSV

### 6. Activity Monitoring

- Track all upload batches with detailed summaries
- View comprehensive activity logs
- Monitor system usage and file processing history

## 🧪 Testing with Sample Data

A sample M-Pesa statement is provided at `/public/sample-mpesa-statement.csv` with 20 test transactions. Use this file to test the upload and processing functionality.

## 🏗 Architecture Overview

### Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── ProtectedRoute.jsx
│   ├── dashboard/
│   │   ├── TreasurerDashboard.jsx
│   │   └── DashboardStats.jsx
│   ├── upload/
│   │   └── StatementUpload.jsx
│   ├── transactions/
│   │   └── TransactionList.jsx
│   ├── logs/
│   │   └── ActivityLogs.jsx
│   └── layout/
│       └── Layout.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── DataContext.jsx
└── App.jsx
```

**"For where your treasure is, there your heart will be also."** - Matthew 6:21

_SacredLedger: Bringing transparency and efficiency to church financial stewardship._
