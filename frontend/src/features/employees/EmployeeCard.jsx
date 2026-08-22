import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/common/Avatar.jsx';
import { StatusDot } from '../../components/common/StatusDot.jsx';

export function EmployeeCard({ employee }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/employees/${employee.id}`)}
      className="relative flex items-center gap-3 rounded-lg border border-border bg-surface p-4
                 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none
                 focus:ring-2 focus:ring-primary"
    >
      <StatusDot status={employee.status} className="absolute right-3 top-3" />
      <Avatar
        firstName={employee.firstName}
        lastName={employee.lastName}
        avatarUrl={employee.avatarUrl}
      />
      <div className="min-w-0 flex-1 pr-4">
        <p className="truncate font-medium text-text">
          {employee.firstName} {employee.lastName}
        </p>
        <p className="truncate text-sm text-text-muted">{employee.jobPosition || '—'}</p>
        <p className="truncate text-xs text-text-muted">{employee.departmentName || '—'}</p>
      </div>
    </button>
  );
}
