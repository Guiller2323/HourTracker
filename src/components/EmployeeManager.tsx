'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Employee {
  id: number;
  name: string;
  active: boolean;
}

interface EmployeeManagerProps {
  onEmployeeAdded: () => void;
}

export default function EmployeeManager({ onEmployeeAdded }: EmployeeManagerProps) {
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      if (response.ok) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const addEmployee = async () => {
    if (!newEmployeeName.trim()) {
      toast.error('Please enter an employee name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newEmployeeName.trim()
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        toast.error('Server returned invalid response');
        return;
      }

      if (response.ok) {
        toast.success('Employee added successfully');
        setNewEmployeeName('');
        fetchEmployees();
        onEmployeeAdded();
      } else {
        toast.error(data.error || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (employeeId: number, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete employee "${employeeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Employee deleted successfully');
        fetchEmployees();
        onEmployeeAdded(); // Refresh the employee list in parent components
      } else {
        toast.error(data.error || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Employee Management</h3>
        <button
          onClick={() => setShowManager(!showManager)}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
        >
          {showManager ? 'Hide' : 'Manage Employees'}
        </button>
      </div>

      {showManager && (
        <>
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="Enter employee name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addEmployee()}
              />
              <button
                onClick={addEmployee}
                disabled={loading}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Current Employees:</h4>
            {employees.length === 0 ? (
              <p className="text-gray-500 text-sm">No employees added yet</p>
            ) : (
              <div className="space-y-2">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {employee.name}
                    </span>
                    <button
                      onClick={() => deleteEmployee(employee.id, employee.name)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                      title={`Delete ${employee.name}`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
