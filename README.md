# SacredLedger: M-Church Records

A comprehensive church financial management system with dual interfaces - a powerful admin dashboard for treasurers and a self-service member portal. The system automates M-Pesa paybill statement processing and provides transparent financial tracking for church giving.

## 🚀 Features

### ✅ Admin Dashboard (Treasurer Interface)

- **🔐 Authentication System**: Secure login for Treasurer role
- **📤 M-Pesa Statement Upload**: CSV file upload with drag-and-drop support
- **🧠 Automatic Record Parsing**: Intelligent parsing of M-Pesa transactions with categorization
- **🔍 Duplicate Detection**: Automatic detection and handling of duplicate transactions
- **📊 Analytics Dashboard**: Real-time financial summaries and giving breakdowns
- **🔍 Advanced Filtering**: Search and filter transactions by various criteria
- **📁 Batch Management**: Organized tracking of upload batches
- **📋 Activity Logging**: Comprehensive audit trail of all system activities
- **📈 Export Functionality**: CSV export of filtered transaction data
- **🧾 Modern Receipt Generation**: Multi-format receipt system with PDF, digital, and SMS options
- **📱 Digital Receipts**: QR codes, web links, and mobile-optimized sharing
- **🖨️ Print-Optimized Receipts**: Professional print layouts with proper formatting
- **📊 Member Receipt Summaries**: Bulk receipt generation and SMS batch processing
- **📲 SMS Automation**: Automated SMS receipt delivery with multiple provider support

### ✅ Member Portal (Self-Service Interface)

- **📱 SMS Authentication**: Phone number verification with SMS codes (no passwords required)
- **📊 Personal Dashboard**: Individual giving analytics with charts and insights
- **📋 Transaction History**: Complete giving history with filtering and search
- **👤 Profile Management**: Personal information and notification preferences
- **📧 Receipt Access**: Download and view personal receipts instantly
- **📈 Giving Analytics**: Track giving patterns, frequency, and annual totals
- **🔔 Notification Center**: SMS delivery status and receipt confirmations
- **📱 Mobile Responsive**: Optimized for mobile devices and tablets

### 🛠 Technical Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Icons**: Lucide React
- **Charts**: Chart.js + React-Chartjs-2
- **CSV Parsing**: PapaParse
- **PDF Generation**: jsPDF + html2canvas
- **QR Codes**: qrcode library
- **SMS Integration**: Africa's Talking, Twilio support
- **Data Storage**: LocalStorage (for demo - easily replaceable with backend)
- **Authentication**: Context-based auth with SMS verification

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

4. Open your browser:
   - **Admin Dashboard**: `http://localhost:5173` 
   - **Member Portal**: `http://localhost:5173/member`

### Demo Access

#### Admin Dashboard
- **Email**: `treasurer@sacredledger.org`
- **Password**: `password123`

#### Member Portal
- **Phone Number**: Use any phone number from uploaded M-Pesa data
- **Verification Code**: `123456` (demo code works for all members)

## 📋 Usage Guide

### Admin Dashboard

#### 1. Authentication

- Access the admin system at `http://localhost:5173/login`
- Use the demo credentials provided above
- Successfully logged-in users are redirected to the dashboard

#### 2. Dashboard Overview

- View real-time financial summaries
- Monitor today's receipts and total transactions
- See giving breakdowns by type (Tithe, Offering, etc.)
- Track unique givers and upload activity

#### 3. M-Pesa Statement Upload

- Navigate to "Upload Statement" tab
- Drag and drop your CSV file or click to browse
- System automatically processes and categorizes transactions
- View upload summary with new transactions and duplicates

#### 4. Transaction Management

- View all transactions in a searchable, filterable table
- Filter by date range, giving type, or search by name/phone
- Sort by date, amount, or sender name
- Export filtered results to CSV

#### 5. Activity Monitoring

- Track all upload batches with detailed summaries
- View comprehensive activity logs
- Monitor system usage and file processing history

### Member Portal

#### 1. Access & Authentication

- Visit `http://localhost:5173/member`
- Enter your phone number (use format: +254712345678, 254712345678, or 0712345678)
- Enter verification code `123456` (demo code)
- No passwords required - SMS-based authentication only

#### 2. Personal Dashboard

- View your giving summary with total amount and transaction count
- See giving breakdown by type (Tithe, Offering, Special Projects)
- Track giving frequency and patterns with interactive charts
- Monitor recent transactions and receipt status

#### 3. Transaction History

- Browse complete giving history with search and filtering
- Filter by date range, giving type, or amount
- Download individual receipts as PDF
- View transaction details and M-Pesa reference numbers

#### 4. Profile Management

- Update personal information and contact details
- Manage SMS notification preferences
- View account activity and login history
- Configure receipt delivery preferences

### Expected CSV Format

```csv
Completion Time,Amount,Account Number,Sender Name,Phone Number
06/08/2025 10:21 AM,500.00,768769#Tithe,John Doe,254712345678
06/08/2025 11:00 AM,1000.00,768769#Offering,Jane Smith,254798765432
```

**Account Number Format**: `PaybillNumber#GivingType`

- Examples: `768769#Tithe`, `768769#Offering`, `768769#Camp Meeting`

**Phone Number Formats Supported**:
- International: `+254712345678`
- National: `254712345678` 
- Local: `0712345678`

(All formats are automatically normalized for member portal access)

## 🧪 Testing with Sample Data

A sample M-Pesa statement is provided at `/public/sample-mpesa-statement.csv` with 20 test transactions. Use this file to test the upload and processing functionality.

## 🏗 Architecture Overview

### Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx              # Admin login
│   │   └── ProtectedRoute.jsx     # Route protection
│   ├── dashboard/
│   │   ├── TreasurerDashboard.jsx # Admin dashboard
│   │   └── DashboardStats.jsx     # Statistics widgets
│   ├── upload/
│   │   └── StatementUpload.jsx    # CSV upload interface
│   ├── transactions/
│   │   └── TransactionList.jsx    # Transaction management
│   ├── logs/
│   │   └── ActivityLogs.jsx       # Activity monitoring
│   ├── member/                    # Member Portal Components
│   │   ├── MemberPortal.jsx       # Main member container
│   │   ├── MemberLogin.jsx        # SMS authentication
│   │   ├── MemberDashboard.jsx    # Member analytics
│   │   ├── MemberTransactions.jsx # Member transaction history
│   │   ├── MemberProfile.jsx      # Member profile management
│   │   └── MemberNavigation.jsx   # Member navigation
│   └── layout/
│       └── Layout.jsx             # Admin layout wrapper
├── contexts/
│   ├── AuthContext.jsx            # Admin authentication
│   ├── DataContext.jsx            # Transaction data management
│   └── MemberAuthContext.jsx      # Member authentication & SMS
└── App.jsx                        # Main router and providers
```

## 🔒 Security Features

- **Dual Authentication**: Separate admin and member authentication systems
- **SMS Verification**: Passwordless authentication for members using phone verification
- **Route Protection**: Protected admin routes with role-based access
- **Session Management**: Secure session handling with automatic expiry
- **Phone Number Normalization**: Flexible phone format handling for member access
- **Data Isolation**: Separate contexts for admin and member data access

## 🚀 Deployment Ready

The system is designed for easy deployment with:
- Environment-based configuration
- Modular component architecture
- Responsive design for all screen sizes
- Production-ready build with Vite
- Easy backend integration points
- SMS provider flexibility (Africa's Talking, Twilio)

## 📱 Mobile Experience

Both admin and member interfaces are fully responsive:
- **Admin Dashboard**: Tablet and desktop optimized for data management
- **Member Portal**: Mobile-first design for easy smartphone access
- **Touch-Friendly**: Large buttons and gesture-friendly interactions
- **Offline Capability**: Works with cached data when connectivity is limited

**"For where your treasure is, there your heart will be also."** - Matthew 6:21

_SacredLedger: Empowering both church leadership and members with transparent, efficient financial stewardship._
