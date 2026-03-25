import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Users, Home, Plus, Edit, Check, X, Search } from 'lucide-react';

const WasteManagementApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  useEffect(() => {
    const demoUsers = [
      { id: 1, email: 'admin@waste.com', password: 'admin123', role: 'admin', name: 'Admin User' },
      { id: 2, email: 'operator@waste.com', password: 'op123', role: 'operator', name: 'Field Operator' }
    ];
    
    const demoCustomers = [
      { id: 1, name: 'John Doe', address: '123 Main St', phone: '555-0101', email: 'john@email.com', zone: 'Zone A', status: 'active' },
      { id: 2, name: 'Jane Smith', address: '456 Oak Ave', phone: '555-0102', email: 'jane@email.com', zone: 'Zone B', status: 'active' },
      { id: 3, name: 'Bob Johnson', address: '789 Pine Rd', phone: '555-0103', email: 'bob@email.com', zone: 'Zone A', status: 'active' }
    ];

    const demoRequests = [
      { id: 1, customerId: 1, customerName: 'John Doe', address: '123 Main St', date: '2025-12-12', time: '09:00', status: 'pending', wasteType: 'General', priority: 'normal' },
      { id: 2, customerId: 2, customerName: 'Jane Smith', address: '456 Oak Ave', date: '2025-12-12', time: '10:30', status: 'in-progress', wasteType: 'Recyclable', priority: 'high' },
      { id: 3, customerId: 3, customerName: 'Bob Johnson', address: '789 Pine Rd', date: '2025-12-13', time: '14:00', status: 'pending', wasteType: 'Organic', priority: 'normal' }
    ];

    setUsers(demoUsers);
    setCustomers(demoCustomers);
    setPickupRequests(demoRequests);
  }, []);

  const handleLogin = () => {
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setCurrentView('dashboard');
      setLoginEmail('');
      setLoginPassword('');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleRegister = () => {
    if (!regName || !regEmail || !regPhone || !regAddress || !regPassword) {
      alert('Please fill all fields');
      return;
    }
    const newUser = {
      id: users.length + 1,
      name: regName,
      email: regEmail,
      password: regPassword,
      role: 'customer',
      address: regAddress,
      phone: regPhone
    };
    
    setUsers([...users, newUser]);
    setCustomers([...customers, {
      id: customers.length + 1,
      name: newUser.name,
      email: newUser.email,
      address: newUser.address,
      phone: newUser.phone,
      zone: 'Unassigned',
      status: 'active'
    }]);
    alert('Account created successfully!');
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegAddress('');
    setRegPassword('');
    setCurrentView('login');
  };

  const CustomerForm = ({ customer, onSave, onCancel }) => {
    const [name, setName] = useState(customer?.name || '');
    const [email, setEmail] = useState(customer?.email || '');
    const [phone, setPhone] = useState(customer?.phone || '');
    const [address, setAddress] = useState(customer?.address || '');
    const [zone, setZone] = useState(customer?.zone || 'Zone A');

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{customer?.id ? 'Edit Customer' : 'Add New Customer'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <select value={zone} onChange={(e) => setZone(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            <option>Zone A</option>
            <option>Zone B</option>
            <option>Zone C</option>
          </select>
          <div className="flex gap-2">
            <button onClick={() => onSave({ name, email, phone, address, zone })} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex-1">
              Save
            </button>
            <button onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const addCustomer = (customerData) => {
    const newCustomer = { id: customers.length + 1, ...customerData, status: 'active' };
    setCustomers([...customers, newCustomer]);
    setEditingCustomer(null);
  };

  const updateCustomer = (id, updatedData) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updatedData } : c));
    setEditingCustomer(null);
  };

  const deleteCustomer = (id) => {
    if (window.confirm('Delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const addPickupRequest = () => {
    const customerId = prompt('Enter customer ID:');
    const date = prompt('Enter date (YYYY-MM-DD):');
    const time = prompt('Enter time (HH:MM):');
    const wasteType = prompt('Waste type (General/Recyclable/Organic):');
    if (customerId && date && time && wasteType) {
      const customer = customers.find(c => c.id === parseInt(customerId));
      const newRequest = {
        id: pickupRequests.length + 1,
        customerId: parseInt(customerId),
        customerName: customer?.name || 'Unknown',
        address: customer?.address || '',
        date,
        time,
        wasteType,
        priority: 'normal',
        status: 'pending'
      };
      setPickupRequests([newRequest, ...pickupRequests]);
    }
  };

  const updateRequestStatus = (id, status) => {
    setPickupRequests(pickupRequests.map(r => r.id === id ? { ...r, status } : r));
  };

  const filteredRequests = pickupRequests.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || r.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Trash2 className="w-12 h-12 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">WasteWise</h1>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="admin@waste.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="admin123" />
            </div>
            <button onClick={handleLogin} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
              Login
            </button>
          </div>
          <button onClick={() => setCurrentView('register')} className="w-full mt-4 text-green-600 hover:text-green-700 font-medium">
            Create New Account
          </button>
          <p className="text-xs text-gray-500 mt-4">Demo: admin@waste.com / admin123</p>
        </div>
      </div>
    );
  }

  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={regEmail} onChange={(e) => setRegEmail(e.target.value)} type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={regAddress} onChange={(e) => setRegAddress(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input value={regPassword} onChange={(e) => setRegPassword(e.target.value)} type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <button onClick={handleRegister} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
              Register
            </button>
          </div>
          <button onClick={() => setCurrentView('login')} className="w-full mt-4 text-green-600 hover:text-green-700 font-medium">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Trash2 className="w-8 h-8 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">WasteWise Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {currentUser?.name}</span>
            <button onClick={() => { setCurrentUser(null); setCurrentView('login'); }} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4">
            <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-3 font-medium ${currentView === 'dashboard' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'}`}>
              <Home className="w-4 h-4 inline mr-1" /> Dashboard
            </button>
            <button onClick={() => setCurrentView('customers')} className={`px-4 py-3 font-medium ${currentView === 'customers' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'}`}>
              <Users className="w-4 h-4 inline mr-1" /> Customers
            </button>
            <button onClick={() => setCurrentView('pickups')} className={`px-4 py-3 font-medium ${currentView === 'pickups' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'}`}>
              <Calendar className="w-4 h-4 inline mr-1" /> Pickup Requests
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Customers</p>
                    <p className="text-3xl font-bold text-gray-800">{customers.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pending Pickups</p>
                    <p className="text-3xl font-bold text-gray-800">{pickupRequests.filter(r => r.status === 'pending').length}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Completed Today</p>
                    <p className="text-3xl font-bold text-gray-800">{pickupRequests.filter(r => r.status === 'completed').length}</p>
                  </div>
                  <Check className="w-12 h-12 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Pickup Requests</h3>
              <div className="space-y-3">
                {pickupRequests.slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{req.customerName}</p>
                      <p className="text-sm text-gray-600">{req.address}</p>
                      <p className="text-xs text-gray-500">{req.date} at {req.time}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'customers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Customer Management</h2>
              <button onClick={() => setEditingCustomer({ isNew: true })} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Add Customer
              </button>
            </div>

            {editingCustomer && (
              <CustomerForm
                customer={editingCustomer.isNew ? null : editingCustomer}
                onSave={(data) => {
                  if (editingCustomer.isNew) {
                    addCustomer(data);
                  } else {
                    updateCustomer(editingCustomer.id, data);
                  }
                }}
                onCancel={() => setEditingCustomer(null)}
              />
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map(customer => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{customer.email}</div>
                        <div>{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.address}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.zone}</td>
                      <td className="px-6 py-4 text-sm">
                        <button onClick={() => setEditingCustomer(customer)} className="text-blue-600 hover:text-blue-800 mr-3">
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button onClick={() => deleteCustomer(customer.id)} className="text-red-600 hover:text-red-800">
                          <X className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'pickups' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Pickup Requests</h2>
              <button onClick={addPickupRequest} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center">
                <Plus className="w-4 h-4 mr-1" /> New Request
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by customer name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredRequests.map(req => (
                <div key={req.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{req.customerName}</h3>
                      <p className="text-sm text-gray-600">{req.address}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">{req.date}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time</p>
                      <p className="font-medium">{req.time}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Waste Type</p>
                      <p className="font-medium">{req.wasteType}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {req.status === 'pending' && (
                      <button onClick={() => updateRequestStatus(req.id, 'in-progress')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                        Start Pickup
                      </button>
                    )}
                    {req.status === 'in-progress' && (
                      <button onClick={() => updateRequestStatus(req.id, 'completed')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm">
                        Complete
                      </button>
                    )}
                    {req.status === 'completed' && (
                      <span className="text-green-600 text-sm font-medium flex items-center">
                        <Check className="w-4 h-4 mr-1" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WasteManagementApp;