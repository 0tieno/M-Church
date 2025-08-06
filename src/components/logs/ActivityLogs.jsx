import React from "react";
import { useData } from "../../contexts/DataContext";
import {
  Activity,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

const ActivityLogs = () => {
  const { activityLogs, uploadBatches } = useData();

  const getLogIcon = (type) => {
    switch (type) {
      case "file_upload":
        return <Upload className="h-5 w-5 text-blue-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Upload Batches Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Upload Batches
        </h2>

        {uploadBatches.length > 0 ? (
          <div className="space-y-4">
            {uploadBatches
              .slice()
              .reverse()
              .map((batch) => (
                <div
                  key={batch.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {batch.fileName}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(batch.uploadDate)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Records:</span>
                      <span className="ml-1 font-medium">
                        {batch.totalTransactions}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">New:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {batch.newTransactions}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duplicates:</span>
                      <span className="ml-1 font-medium text-yellow-600">
                        {batch.duplicates}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    Uploaded by: {batch.uploadedBy} • Church: {batch.church}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No upload batches yet. Upload your first M-Pesa statement to see
            batch history.
          </p>
        )}
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Activity Logs
        </h2>

        {activityLogs.length > 0 ? (
          <div className="space-y-4">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {log.description}
                    </p>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  {log.details && (
                    <div className="mt-2 text-xs text-gray-600">
                      {log.details.fileName && (
                        <div>File: {log.details.fileName}</div>
                      )}
                      {log.details.totalRecords && (
                        <div>Total Records: {log.details.totalRecords}</div>
                      )}
                      {log.details.newRecords !== undefined && (
                        <div>New Records: {log.details.newRecords}</div>
                      )}
                      {log.details.duplicates !== undefined && (
                        <div>Duplicates: {log.details.duplicates}</div>
                      )}
                    </div>
                  )}

                  {log.userId && (
                    <div className="mt-1 text-xs text-gray-500">
                      By: {log.userId}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No activity logs yet. System activities will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
