import React from 'react'
import { useData } from '../../contexts/DataContext'
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react'

const DashboardStats = () => {
  const { getTransactionsSummary, transactions, uploadBatches } = useData()
  const summary = getTransactionsSummary()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const stats = [
    {
      name: 'Today\'s Receipts',
      value: formatCurrency(summary.totalToday),
      change: `${summary.todayTransactions} transactions`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      name: 'Total Transactions',
      value: summary.totalTransactions.toLocaleString(),
      change: `${uploadBatches.length} upload batches`,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      name: 'Unique Givers',
      value: new Set(transactions.map(t => t.phone)).size.toLocaleString(),
      change: 'Active members',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      name: 'Last Upload',
      value: uploadBatches.length > 0 
        ? new Date(uploadBatches[uploadBatches.length - 1].uploadDate).toLocaleDateString()
        : 'No uploads',
      change: uploadBatches.length > 0 ? 'Recent activity' : 'Upload needed',
      icon: Calendar,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      {stat.change}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Giving Types Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Giving by Type</h3>
        <div className="space-y-4">
          {Object.entries(summary.typeBreakdown).map(([type, amount]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">{type}</span>
              </div>
              <span className="text-sm text-gray-500">{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
        {Object.keys(summary.typeBreakdown).length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No transactions yet. Upload your first M-Pesa statement to get started.
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{transaction.sender}</p>
                <p className="text-xs text-gray-500">{transaction.givingType} • {transaction.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
        {transactions.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No transactions to display. Upload a statement to see recent activity.
          </p>
        )}
      </div>
    </div>
  )
}

export default DashboardStats
