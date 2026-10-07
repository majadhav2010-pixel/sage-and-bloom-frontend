import React, { useState } from 'react';

export const CategoryManagement = ({ categories, setCategories, onRecordAudit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const newCat = {
      id: Date.now(),
      name: name.trim(),
      slug,
      count: 0,
      description: description.trim(),
    };

    setCategories([...categories, newCat]);
    onRecordAudit?.('CATEGORY_CREATED', 'CATEGORY', String(newCat.id), `Created category: ${name}`);
    setName('');
    setDescription('');
    setIsModalOpen(false);
  };

  return (
    <div className="admin-categories-view">
      <div className="dash-header">
        <div>
          <h2>Botanical Categories</h2>
          <p>Organize soap lines into aromatic and herbal collections</p>
        </div>
        <button type="button" className="btn btn-admin-primary" onClick={() => setIsModalOpen(true)}>
          + Add Category
        </button>
      </div>

      <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {categories.map((c) => (
          <div key={c.id} className="dash-card">
            <div className="dash-card-header">
              <div>
                <h3>{c.name}</h3>
                <small className="text-muted">Slug: /{c.slug}</small>
              </div>
              <span className="badge-growth">{c.count || 0} Products</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: '12px 0 16px' }}>
              {c.description || 'No description provided.'}
            </p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Botanical Category</h3>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddCategory} className="modal-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Citrus & Sun Essences"
                  className="admin-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the botanical focus of this category..."
                  className="admin-textarea"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-admin-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-admin-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
