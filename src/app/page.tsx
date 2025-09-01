'use client';

import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PunchClock from '@/components/PunchClock';
import TimecardView from '@/components/TimecardView';
import EmployeeManager from '@/components/EmployeeManager';

// Extend the Window interface to include Tauri API
declare global {
  interface Window {
    __TAURI__?: {
      app: {
        exit(): Promise<void>;
      };
    };
  }
}

export default function Home() {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<string[]>([]);
  const [weekEndingDate, setWeekEndingDate] = useState('');
  const [activeTab, setActiveTab] = useState<'punch' | 'timecard'>('punch');

  useEffect(() => {
    // Set default week ending date (Saturday of current week)
    // Week runs Sunday to Saturday, so we need to find this Saturday
    const today = new Date();
    const saturday = new Date(today);
    const daysUntilSaturday = today.getDay() === 0 ? 6 : 6 - today.getDay();
    saturday.setDate(today.getDate() + daysUntilSaturday);
    setWeekEndingDate(saturday.toISOString().split('T')[0]);
    
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      if (response.ok) {
        const activeEmployeeNames = data.employees.map((emp: any) => emp.name);
        setEmployees(activeEmployeeNames);
        
        // Reset selected employee if they're no longer active
        if (selectedEmployee && !activeEmployeeNames.includes(selectedEmployee)) {
          setSelectedEmployee('');
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handlePunchRecorded = () => {
    // Refresh timecard when punch is recorded
    // This will be handled by TimecardView component
  };

  const handleEmployeeAdded = () => {
    fetchEmployees();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl mx-auto p-8 relative overflow-hidden">
        {/* Header gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Employee Time Tracker</h1>
          <p className="text-gray-600">Modern timecard system with traditional formatting</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('punch')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'punch'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Punch Clock
            </button>
            <button
              onClick={() => setActiveTab('timecard')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'timecard'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Timecard View
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'punch' && (
          <div className="space-y-6">
            <EmployeeManager onEmployeeAdded={handleEmployeeAdded} />
            <div className="flex justify-center">
              <PunchClock 
                selectedEmployee={selectedEmployee}
                onEmployeeChange={setSelectedEmployee}
                employees={employees}
                onPunchRecorded={handlePunchRecorded}
              />
            </div>
          </div>
        )}

        {activeTab === 'timecard' && (
          <TimecardView 
            selectedEmployee={selectedEmployee}
            weekEndingDate={weekEndingDate}
            onWeekChange={setWeekEndingDate}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Built with Next.js • Traditional timecard formatting with modern features</p>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="z-50"
      />
    </div>
  );
}