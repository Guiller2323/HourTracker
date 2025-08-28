'use client';

import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface TimeEntry {
  id: number;
  employee_name: string;
  date: string;
  hours: number;
  lunch_taken: boolean;
}

export default function Home() {
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [lunchTaken, setLunchTaken] = useState(false);
  const [reportData, setReportData] = useState<TimeEntry[]>([]);
  const [showReport, setShowReport] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('timeEntries');
    if (savedEntries) {
      setReportData(JSON.parse(savedEntries));
    }
  }, []);

  // Save data to localStorage
  const saveToStorage = (entries: TimeEntry[]) => {
    localStorage.setItem('timeEntries', JSON.stringify(entries));
    setReportData(entries);
  };

  const handleSubmit = () => {
    if (!name.trim() || !hours || parseFloat(hours) <= 0) {
      toast.error('Please enter a valid name and hours');
      return;
    }

    const adjustedHours = lunchTaken ? parseFloat(hours) - 0.5 : parseFloat(hours);
    
    const newEntry: TimeEntry = {
      id: Date.now(),
      employee_name: name.trim(),
      date: new Date().toISOString().split('T')[0],
      hours: adjustedHours,
      lunch_taken: lunchTaken
    };

    const updatedEntries = [...reportData, newEntry];
    saveToStorage(updatedEntries);
    
    toast.success('Entry Saved!');
    setName('');
    setHours('');
    setLunchTaken(false);
  };

  const handleShowReport = () => {
    // Get current week's entries
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

    const weeklyEntries = reportData.filter(entry => 
      entry.date >= mondayStr && entry.date <= sundayStr
    );

    setReportData(weeklyEntries);
    setShowReport(true);
  };

  const clearForm = () => {
    setName('');
    setHours('');
    setLunchTaken(false);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all stored time entries? This cannot be undone.')) {
      localStorage.removeItem('timeEntries');
      setReportData([]);
      setShowReport(false);
      toast.success('All data cleared successfully!');
    }
  };

  const groupedData = reportData.reduce((acc, entry) => {
    if (!acc[entry.employee_name]) {
      acc[entry.employee_name] = [];
    }
    acc[entry.employee_name].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl p-8 relative overflow-hidden">
        {/* Header gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Employee Time Tracker</h1>
          <p className="text-sm text-gray-500">Track daily hours and generate weekly reports</p>
        </div>

        {/* Main Content - Side by side layout */}
        <div className="flex gap-8">
          {/* Input Section - Left side */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Employee Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter employee name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Hours Worked</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="8.0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="lunch-break"
                checked={lunchTaken}
                onChange={(e) => setLunchTaken(e.target.checked)}
                className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400"
              />
              <label htmlFor="lunch-break" className="text-sm text-gray-600">
                Took 30-min Lunch Break
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Add Entry
              </button>
              <button
                onClick={clearForm}
                className="flex-1 bg-gray-200 text-gray-600 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Section - Right side */}
      <div className="flex-1">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 h-full">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-semibold text-gray-800">Weekly Report</h3>
            <button
              onClick={handleShowReport}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 h-96 p-4 font-mono text-sm text-gray-600 overflow-y-auto">
            {showReport && reportData.length > 0 ? (
              <div className="space-y-4">
                <div className="font-bold text-base text-gray-800">Weekly Report (Current Week)</div>
                {Object.entries(groupedData).map(([employeeName, entries]) => {
                  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
                  return (
                    <div key={employeeName} className="space-y-2">
                      <div className="font-semibold text-gray-800 text-base">{employeeName}: {totalHours.toFixed(1)} hours</div>
                      {entries.map((entry) => (
                        <div key={entry.id} className="ml-4 text-gray-600">
                          • {entry.date}: {entry.hours}h {entry.lunch_taken ? '(lunch taken)' : ''}
                        </div>
                      ))}
                    </div>
                  );
                })}
                <div className="pt-4 border-t border-gray-200 font-bold text-gray-800 text-base">
                  Total tracked: {reportData.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} hours
                </div>
              </div>
            ) : showReport && reportData.length === 0 ? (
              <div className="text-gray-500 text-center pt-8">No entries found for this week.</div>
            ) : (
              <div className="text-gray-500">
                Click "Generate Report" to view weekly hours summary...
                <br/><br/>
                Sample output:
                <br/>
                John Doe: 40.0 hours (8/26: 7.5h, 8/27: 8.0h...)
                <br/>
                Jane Smith: 37.5 hours (8/26: 7.5h, 8/27: 7.5h...)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

        {/* Footer */}
        <div className="text-center mt-5 pt-4 border-t border-gray-200">
          <div className="flex justify-center gap-4">
            <button 
              onClick={clearAllData}
              className="text-xs text-red-500 hover:text-red-700 transition-colors duration-200 px-3 py-1 border border-red-200 rounded hover:bg-red-50"
            >
              Clear All Data
            </button>
            <button 
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
              onClick={() => {
                if (typeof window !== 'undefined' && window.__TAURI__) {
                  window.__TAURI__.app.exit();
                }
              }}
            >
              Exit Application
            </button>
          </div>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}
