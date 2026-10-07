import React from 'react';

export const CustomerManagement = ({ users }) => {
  return (
    <div className="admin-customers-view">
      <div className="dash-header">
        <div>
          <h2>Customer Directory</h2>
          <p>Customer accounts, order histories, and contact profiles</p>
        </div>
      </div>

      <div className="dash-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered Date</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'var(--sage)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                        }}
                      >
                        {u.firstName?.[0] || u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <strong>{u.fullName || u.email}</strong>
                        <div className="text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-growth">{u.role.replace('ROLE_', '')}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${u.status === 'ACTIVE' ? 'status-delivered' : 'status-cancelled'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>{u.ordersCount || 0}</td>
                  <td><strong>₹{(u.totalSpent || 0).toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
