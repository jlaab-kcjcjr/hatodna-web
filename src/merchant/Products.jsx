import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ImagePlus, X } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import { peso } from '../utils/format';

const EMPTY_PRODUCT = { name: '', price: '', category: '', description: '', image: '', available: true };
const MAX_IMAGE_BYTES = 800 * 1024;
const ART_COLORS = ['#B8202B', '#2E5E3E', '#2A1A16', '#8E1620'];

function ProductForm({ initial, categories, onCancel, onSave }) {
  const [form, setForm] = useState({ ...initial, price: String(initial.price ?? '') });
  const [error, setError] = useState('');

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError('That photo is too large. Use one under 800 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('image', reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim()) return setError('Enter the product name.');
    if (!price || price <= 0) return setError('Enter a price greater than ₱0.');
    if (!form.category.trim()) return setError('Choose or type a category.');
    onSave({
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="modal-head">
          <h2>{initial.id ? 'Edit product' : 'Add product'}</h2>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <label className="photo-pick">
          {form.image ? (
            <img src={form.image} alt="" />
          ) : (
            <span className="photo-empty">
              <ImagePlus size={26} aria-hidden="true" />
              Add a photo
            </span>
          )}
          <input type="file" accept="image/*" onChange={onImage} hidden />
        </label>

        <label className="field">
          <span>Product name</span>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Bicol Express with rice" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Price (₱)</span>
            <input
              type="number"
              min="1"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="95"
            />
          </label>
          <label className="field">
            <span>Category</span>
            <input
              list="product-categories"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="Ulam"
            />
            <datalist id="product-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ingredients, serving size, spice level."
          />
        </label>

        <label className="check">
          <input type="checkbox" checked={form.available} onChange={(e) => set('available', e.target.checked)} />
          Available to order
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {initial.id ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Products() {
  const { products, saveProduct, deleteProduct, toggleAvailable } = useMerchant();
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const soldOutCount = products.filter((p) => !p.available).length;
  const visible = products.filter(
    (p) => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())
  );

  const onDelete = (p) => {
    if (window.confirm(`Delete "${p.name}"? Customers will no longer see it.`)) deleteProduct(p.id);
  };

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>Products</h1>
          <p className="muted">
            {products.length} products, {soldOutCount} sold out
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing(EMPTY_PRODUCT)}>
          <Plus size={18} aria-hidden="true" />
          Add product
        </button>
      </header>

      <div className="toolbar">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
          />
        </label>
        <div className="chips">
          {['All', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${category === c ? ' active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>No products match.</p>
          <p className="muted small">Try another search or category, or add a new product.</p>
        </div>
      ) : (
        <div className="product-grid">
          {visible.map((p) => (
            <article key={p.id} className={`product${p.available ? '' : ' is-soldout'}`}>
              <div
                className="product-art"
                style={{ background: ART_COLORS[Math.max(0, categories.indexOf(p.category)) % ART_COLORS.length] }}
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} />
                ) : (
                  <span>
                    {p.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')}
                  </span>
                )}
                {!p.available && <span className="soldout-tag">Sold out</span>}
              </div>
              <div className="product-body">
                <p className="product-cat">{p.category}</p>
                <h3>{p.name}</h3>
                <p className="product-price">{peso(p.price)}</p>
                {p.description && <p className="muted small product-desc">{p.description}</p>}
              </div>
              <div className="product-actions">
                <label className="switch">
                  <input type="checkbox" checked={p.available} onChange={() => toggleAvailable(p.id)} />
                  <span className="switch-track" aria-hidden="true" />
                  <span className="small">{p.available ? 'Available' : 'Sold out'}</span>
                </label>
                <div className="product-icons">
                  <button type="button" className="icon-btn" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => onDelete(p)}
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSave={(p) => {
            saveProduct(p);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}