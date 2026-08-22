function Tag({ children }) {
  return (
    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      {children}
    </span>
  );
}

export function ResumeTab({ employee }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text">About</h3>
        <p className="mt-1 text-sm text-text-muted">{employee.about || 'No bio added yet.'}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text">Skills</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {employee.skills?.length ? (
            employee.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)
          ) : (
            <p className="text-sm text-text-muted">No skills added yet.</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text">Certifications</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {employee.certifications?.length ? (
            employee.certifications.map((cert) => <Tag key={cert}>{cert}</Tag>)
          ) : (
            <p className="text-sm text-text-muted">No certifications added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
