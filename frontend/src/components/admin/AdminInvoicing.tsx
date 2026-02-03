import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  Download,
  Send,
  Filter,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  PrinterIcon,
  MailIcon
} from 'lucide-react';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: number;
  client?: Client;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const AdminInvoicing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'create' | 'clients'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Create invoice form state
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unit_price: 0 }],
    tax_rate: 0,
    notes: ''
  });

  // Load invoices
  React.useEffect(() => {
    loadInvoices();
    loadClients();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/admin/invoices', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/workflows/admin/users?role=client', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = !searchTerm || 
        inv.invoice_number.includes(searchTerm) ||
        inv.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, filterStatus]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newInvoice = await response.json();
        setInvoices([...invoices, newInvoice]);
        setFormData({
          client_id: '',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: [{ description: '', quantity: 1, unit_price: 0 }],
          tax_rate: 0,
          notes: ''
        });
        setActiveTab('invoices');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        loadInvoices();
      }
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          setInvoices(invoices.filter(inv => inv.id !== invoiceId));
        }
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Invoice Management</h1>
            <p className="text-gray-600 mt-2">Create and manage client invoices</p>
          </div>
          {activeTab === 'invoices' && (
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Invoice
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-4 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'invoices'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Invoice
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'clients'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5 inline mr-2" />
            Clients
          </button>
        </div>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-2" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Invoice # or client name"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="issued">Issued</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <strong>{filteredInvoices.length}</strong> invoices found
                </div>
              </div>
            </div>
          </div>

          {/* Invoice List */}
          <div className="space-y-4">
            {filteredInvoices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No invoices found</p>
              </div>
            ) : (
              filteredInvoices.map(invoice => (
                <div
                  key={invoice.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {invoice.invoice_number}
                        </h3>
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            invoice.status === 'issued' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'}
                        `}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">
                        <User className="w-4 h-4 inline mr-2" />
                        {invoice.client?.name}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Issued:</span>
                          <p className="font-semibold">{new Date(invoice.issue_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Due:</span>
                          <p className="font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Items:</span>
                          <p className="font-semibold">{invoice.items.length}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-bold text-lg text-blue-600">
                            ${invoice.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowDetails(true);
                        }}
                        title="View Details"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {invoice.status !== 'sent' && invoice.status !== 'paid' && (
                        <button
                          onClick={() => handleSendInvoice(invoice.id)}
                          title="Send Invoice"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <MailIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        title="Print Invoice"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <PrinterIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        title="Delete Invoice"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Invoice Tab */}
      {activeTab === 'create' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Invoice</h2>
            
            <form onSubmit={handleCreateInvoice} className="space-y-6">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  value={formData.client_id}
                  onChange={e => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id.toString()}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={e => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Invoice Items *
                </label>
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={e => {
                          const newItems = [...formData.items];
                          newItems[idx].description = e.target.value;
                          setFormData(prev => ({ ...prev, items: newItems }));
                        }}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...formData.items];
                          newItems[idx].quantity = parseInt(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, items: newItems }));
                        }}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={e => {
                          const newItems = [...formData.items];
                          newItems[idx].unit_price = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, items: newItems }));
                        }}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <div className="px-4 py-2 bg-gray-100 rounded-lg font-semibold">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }]
                    }))}
                    className="text-blue-600 font-semibold hover:text-blue-700"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tax Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={e => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes for the invoice"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 h-24"
                />
              </div>

              {/* Totals Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-right">
                  <div className="flex justify-end gap-4">
                    <span className="font-semibold">Subtotal:</span>
                    <span>${(formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-4">
                    <span className="font-semibold">Tax ({formData.tax_rate}%):</span>
                    <span>${((formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)) * (formData.tax_rate / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-4 border-t-2 border-gray-200 pt-2 text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      ${(formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) * (1 + formData.tax_rate / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">City, State</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, idx) => (
                  <tr key={client.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">{client.name}</td>
                    <td className="px-6 py-4">{client.email}</td>
                    <td className="px-6 py-4">{client.phone}</td>
                    <td className="px-6 py-4">{client.city}, {client.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetails && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">{selectedInvoice.invoice_number}</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Client</h3>
                  <p>{selectedInvoice.client?.name}</p>
                  <p className="text-gray-600">{selectedInvoice.client?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Issue Date</h3>
                    <p>{new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Due Date</h3>
                    <p>{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left font-semibold">Description</th>
                        <th className="text-right font-semibold">Qty</th>
                        <th className="text-right font-semibold">Price</th>
                        <th className="text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td>{item.description}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">${item.unit_price.toFixed(2)}</td>
                          <td className="text-right font-semibold">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Tax ({selectedInvoice.tax_rate}%):</span>
                    <span>${selectedInvoice.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-blue-600 border-t-2 border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoicing;
