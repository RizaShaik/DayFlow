import { useEffect, useState } from 'react';
import { employeesApi } from '../../api/employeesApi.js';
import { departmentsApi } from '../../api/departmentsApi.js';
import { EmployeeCard } from './EmployeeCard.jsx';

export function EmployeeListPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true);
      employeesApi
        .list(
          { search: search || undefined, departmentId: departmentId || undefined },
          { signal: controller.signal }
        )
        .then((data) => {
          setEmployees(data);
          setError('');
        })
        .catch((err) => {
          if (err.name !== 'CanceledError') {
            setError('Could not load employees.');
          }
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, departmentId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text">Employees</h1>
        <div className="flex gap-3">
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text
                       placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text
                       focus:border-primary focus:outline-none"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-text-muted">No employees found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}
    </div>
  );
}
