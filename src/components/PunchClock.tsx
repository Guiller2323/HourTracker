'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface PunchClockProps {
  selectedEmployee: string;
  onEmployeeChange: (employee: string) => void;
  employees: string[];
  onPunchRecorded: () => void;
}

export default function PunchClock({ 
  selectedEmployee, 
  onEmployeeChange, 
  employees, 
  onPunchRecorded 
}: PunchClockProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [mounted, setMounted] = useState(false);
  const [punchStatus, setPunchStatus] = useState<'OUT' | 'IN' | 'LUNCH'>('OUT');
  const [loading, setLoading] = useState(false);

  // Update current time every second
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get punch status when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      fetchPunchStatus();
    }
  }, [selectedEmployee]);

  const fetchPunchStatus = async () => {
    try {
      const response = await fetch(`/api/punch?employee=${encodeURIComponent(selectedEmployee)}`);
      const data = await response.json();
      
      if (response.ok) {
        setPunchStatus(data.status);
      } else if (response.status === 404) {
        // Employee is inactive/deleted
        setPunchStatus('OUT');
        toast.error(`Employee "${selectedEmployee}" is not active`);
      }
    } catch (error) {
      console.error('Error fetching punch status:', error);
      setPunchStatus('OUT');
    }
  };

    const handlePunch = async (type: 'IN' | 'OUT' | 'LUNCH' | 'LUNCH_END') => {
    try {
      const response = await fetch('/api/punch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee: selectedEmployee,
          type: type
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPunchStatus(data.status);
        toast.success(`Punched ${type} at ${new Date().toLocaleTimeString()}`);
      } else if (response.status === 404) {
        // Employee is inactive/deleted
        toast.error(`Employee "${selectedEmployee}" is not active`);
      } else {
        toast.error('Failed to record punch');
      }
    } catch (error) {
      console.error('Error recording punch:', error);
      toast.error('Failed to record punch');
    }
  };

  const getNextAction = () => {
    switch (punchStatus) {
      case 'OUT': return { action: 'IN', label: 'Clock In', color: 'bg-green-500 hover:bg-green-600' };
      case 'IN': return { action: 'OUT', label: 'Clock Out', color: 'bg-red-500 hover:bg-red-600' };
      case 'LUNCH': return { action: 'LUNCH_END', label: 'Return from Lunch', color: 'bg-blue-500 hover:bg-blue-600' };
      default: return { action: 'IN', label: 'Clock In', color: 'bg-green-500 hover:bg-green-600' };
    }
  };

  const nextAction = getNextAction();

  const getStatusDisplay = () => {
    switch (punchStatus) {
      case 'OUT': return { text: 'Clocked Out', color: 'text-red-600 bg-red-50' };
      case 'IN': return { text: 'Clocked In', color: 'text-green-600 bg-green-50' };
      case 'LUNCH': return { text: 'On Lunch Break', color: 'text-yellow-600 bg-yellow-50' };
      default: return { text: 'Unknown Status', color: 'text-gray-600 bg-gray-50' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Punch Clock</h2>
        <div className="text-3xl font-mono text-blue-600 mb-4">
          <span suppressHydrationWarning>{mounted ? currentTime : ' '}</span>
        </div>
        <div className="text-sm text-gray-500">
          <span suppressHydrationWarning>{mounted ? currentDate : ' '}</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Employee
        </label>
        <select
          value={selectedEmployee}
          onChange={(e) => onEmployeeChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          suppressHydrationWarning
        >
          <option value="">Choose an employee...</option>
          {employees.map((employee) => (
            <option key={employee} value={employee}>
              {employee}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div className="mb-6">
          <div className={`text-center py-2 px-4 rounded-lg ${statusDisplay.color}`}>
            <span className="font-medium">{statusDisplay.text}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handlePunch(nextAction.action as any)}
          disabled={!selectedEmployee || loading}
          className={`w-full py-4 px-6 text-white font-bold rounded-lg transition-colors ${nextAction.color} disabled:bg-gray-400`}
        >
          {loading ? 'Recording...' : nextAction.label}
        </button>

        {punchStatus === 'IN' && (
          <button
            onClick={() => handlePunch('LUNCH')}
            disabled={!selectedEmployee || loading}
            className="w-full py-3 px-6 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"
          >
            Start Lunch Break
          </button>
        )}
      </div>
    </div>
  );
}
