import React from 'react';

export const AuditLogsView = ({ auditLogs }) => {
  return (
    <div className="admin-audit-view">
      <div className="dash-header">
        <div>
          <h2>Security & Admin Audit Trail</h2>
          <p>Immutable forensic log of every administrative operation and role change</p>
        </div>
      </div>

      <div className="dash-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Email</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Details</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <small>{new Date(log.timestamp).toLocaleString()}</small>
                  </td>
                  <td><strong>{log.actorEmail}</strong></td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        background: 'rgba(36, 45, 29, 0.08)',
                        color: 'var(--moss)',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>{log.resourceType} ({log.resourceId})</td>
                  <td><small className="text-muted">{log.ipAddress}</small></td>
                  <td>{log.details}</td>
                  <td>
                    <span className="status-pill status-delivered">{log.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
