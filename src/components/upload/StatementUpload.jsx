import React, { useState, useRef } from 'react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import Papa from 'papaparse'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'

const StatementUpload = () => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const fileInputRef = useRef(null)
  const { addTransaction, addBatch, addActivityLog, checkDuplicateTransaction } = useData()
  const { user } = useAuth()

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const parseAccountNumber = (accountNumber) => {
    // Expected format: "768769#Tithe" or "768769#Offering"
    if (!accountNumber || !accountNumber.includes('#')) {
      return { paybill: '', givingType: 'Unknown' }
    }
    
    const [paybill, givingType] = accountNumber.split('#')
    return { paybill: paybill.trim(), givingType: givingType.trim() }
  }

  const processTransactionRow = (row) => {
    // Expected CSV columns: Completion Time, Amount, Account Number, Sender Name, Phone Number
    const completionTime = row['Completion Time'] || row['completion_time'] || ''
    const amount = parseFloat((row['Amount'] || row['amount'] || '0').toString().replace(/[^\d.-]/g, ''))
    const accountNumber = row['Account Number'] || row['account_number'] || ''
    const senderName = row['Sender Name'] || row['sender_name'] || ''
    const phoneNumber = row['Phone Number'] || row['phone_number'] || ''

    const { paybill, givingType } = parseAccountNumber(accountNumber)

    return {
      completionTime,
      amount,
      accountNumber,
      paybill,
      givingType,
      sender: senderName,
      phone: phoneNumber,
      date: new Date().toISOString().split('T')[0], // Today's date as processing date
      church: user?.church || 'Unknown Church',
      uploadedBy: user?.email || 'unknown'
    }
  }

  const handleFileUpload = (file) => {
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus({
        type: 'error',
        message: 'Please upload a CSV file'
      })
      return
    }

    setProcessing(true)
    setUploadStatus(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error(`CSV parsing error: ${results.errors[0].message}`)
          }

          const transactions = results.data.map(processTransactionRow)
          const validTransactions = transactions.filter(t => t.amount > 0 && t.sender && t.phone)

          if (validTransactions.length === 0) {
            throw new Error('No valid transactions found in the file')
          }

          // Check for duplicates
          const newTransactions = []
          const duplicates = []

          validTransactions.forEach(transaction => {
            if (checkDuplicateTransaction(transaction)) {
              duplicates.push(transaction)
            } else {
              newTransactions.push(transaction)
            }
          })

          // Create batch record
          const batch = {
            fileName: file.name,
            totalTransactions: validTransactions.length,
            newTransactions: newTransactions.length,
            duplicates: duplicates.length,
            uploadedBy: user?.email,
            church: user?.church
          }

          const savedBatch = addBatch(batch)

          // Add new transactions
          newTransactions.forEach(transaction => {
            addTransaction({
              ...transaction,
              batchId: savedBatch.id,
              sourceFile: file.name
            })
          })

          // Log activity
          addActivityLog({
            type: 'file_upload',
            description: `Uploaded ${file.name}`,
            details: {
              totalRecords: validTransactions.length,
              newRecords: newTransactions.length,
              duplicates: duplicates.length,
              fileName: file.name
            },
            userId: user?.email
          })

          setParsedData({
            batch: savedBatch,
            newTransactions,
            duplicates,
            total: validTransactions.length
          })

          setUploadStatus({
            type: 'success',
            message: `Successfully processed ${newTransactions.length} new transactions`
          })

        } catch (error) {
          console.error('Processing error:', error)
          setUploadStatus({
            type: 'error',
            message: error.message
          })
        } finally {
          setProcessing(false)
        }
      },
      error: (error) => {
        console.error('Parse error:', error)
        setUploadStatus({
          type: 'error',
          message: `Failed to parse CSV: ${error.message}`
        })
        setProcessing(false)
      }
    })
  }

  const resetUpload = () => {
    setUploadStatus(null)
    setParsedData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload M-Pesa Statement</h2>
        
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop your M-Pesa statement here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Or click to browse for a CSV file
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <File className="h-4 w-4 mr-2" />
            {processing ? 'Processing...' : 'Choose File'}
          </button>
        </div>

        {/* Status Messages */}
        {uploadStatus && (
          <div className={`mt-4 p-4 rounded-lg flex items-center justify-between ${
            uploadStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center">
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              <span>{uploadStatus.message}</span>
            </div>
            <button onClick={resetUpload} className="ml-4">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Processing Results */}
        {parsedData && (
          <div className="mt-6 space-y-4">
            <h3 className="font-medium text-gray-900">Upload Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-900">{parsedData.total}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">New Transactions</p>
                <p className="text-2xl font-bold text-green-900">{parsedData.newTransactions.length}</p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">Duplicates Skipped</p>
                <p className="text-2xl font-bold text-yellow-900">{parsedData.duplicates.length}</p>
              </div>
            </div>

            {parsedData.duplicates.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Duplicate Transactions Found</h4>
                <p className="text-sm text-yellow-700">
                  {parsedData.duplicates.length} transactions were skipped because they already exist in the system.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sample Format */}
        <div className="mt-8 border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-3">Expected CSV Format</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`Completion Time,Amount,Account Number,Sender Name,Phone Number
06/08/2025 10:21 AM,500.00,768769#Tithe,John Doe,254712345678
06/08/2025 11:00 AM,1000.00,768769#Offering,Jane Smith,254798765432
06/08/2025 02:30 PM,2000.00,768769#Camp Meeting,Peter Kim,254723456789`}
            </pre>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Account Number format should be: PaybillNumber#GivingType (e.g., 768769#Tithe)
          </p>
        </div>
      </div>
    </div>
  )
}

export default StatementUpload
