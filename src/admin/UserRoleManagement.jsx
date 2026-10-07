import React from 'react';

export const UserRoleManagement = ({ users, setUsers, onRecordAudit }) => {
  const handleRoleChange = (userId, newRole) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (user.role === 'ROLE_SUPER_ADMIN') {
      alert('Super Admin role cannot be demoted directly from standard interface.');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    onRecordAudit?.('USER_ROLE_CHANGED', 'USER', userId, `Role for ${user.email} updated to ${newRole}`);
  };

  const handleStatusToggle = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );

    onRecordAudit?.('USER_STATUS_CHANGED', 'USER', userId, `Account status for ${user.email} set to ${nextStatus}`);
  };

  return (
    <div className="admin-roles-view">
      <div className="dash-header">
        <div>
          <h2>RBAC & Access Control</h2>
          <p>Grant and audit administrative permissions (`CUSTOMER`, `ADMIN`, `SUPER_ADMIN`)</p>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: '20px', background: '#fffdf5', borderColor: '#e5b95c' }}>
        <h4 style={{ color: '#92400e', marginBottom: '6px' }}>🔒 Strict Authorization Policy</h4>
        <p style={{ fontSize: '0.84rem', color: '#78350f', margin: 0 }}>
          Google OAuth authenticates identity. Authorization is strictly governed in the database.
          A Google account never automatically receives ADMIN privileges without explicit assignment.
        </p>
      </div>

      <div className="dash-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Current Role</th>
                <th>Account Status</th>
                <th>Change Role</th>
                <th>Account Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.fullName || u.email}</strong>
                    <div className="text-muted">{u.email}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        background: u.role.includes('SUPER') ? '#fee2e2' : u.role.includes('ADMIN') ? '#e0f2fe' : '#f3f4f6',
                        color: u.role.includes('SUPER') ? '#991b1b' : u.role.includes('ADMIN') ? '#075985' : '#374151',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${u.status === 'ACTIVE' ? 'status-delivered' : 'status-cancelled'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={u.role}
                      disabled={u.role === 'ROLE_SUPER_ADMIN'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="admin-select"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <option value="ROLE_CUSTOMER">CUSTOMER</option>
                      <option value="ROLE_ADMIN">ADMIN</option>
                      <option value="ROLE_SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={u.role === 'ROLE_SUPER_ADMIN'}
                      className={`btn btn-admin-small ${u.status === 'ACTIVE' ? 'btn-danger' : ''}`}
                      onClick={() => handleStatusToggle(u.id)}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                    </button>
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
