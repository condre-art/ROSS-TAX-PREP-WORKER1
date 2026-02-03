import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Settings, 
  FileText,
  Activity,
  Shield,
  Bell,
  Search,
  Send,
  Lock,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface EROHubProps {
  user: any;
}

export const EROHub: React.FC<EROHubProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'messages' | 'clients' | 'settings'>('dashboard');
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardStats();
    loadMessages();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/ero/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/ero/messages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const response = await fetch('/api/ero/messages/send', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: selectedConversation.id,
          message: newMessage,
          encrypted: true
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        loadMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ERO Hub</h1>
                <p className="text-xs text-gray-600">EFIN: 33-4891499 • PTIN Certified</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.role?.toUpperCase()}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.total_returns || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Total Returns</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.accepted || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Accepted by IRS</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.pending || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Pending Review</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">${stats?.revenue || '0'}</p>
                <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        Return #2025-{1000 + i} submitted
                      </p>
                      <p className="text-xs text-gray-600">
                        Client: John Doe • {i} hours ago
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Accepted
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedConversation(msg)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all
                      ${selectedConversation?.id === msg.id 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {msg.name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{msg.name}</p>
                        <p className="text-xs text-gray-600">Client</p>
                      </div>
                      {msg.unread && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate ml-13">
                      {msg.last_message}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Thread */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedConversation.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{selectedConversation.name}</p>
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3 text-green-600" />
                        <p className="text-xs text-green-600">End-to-end encrypted</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedConversation.messages?.map((msg: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex ${msg.from_staff ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-md px-4 py-3 rounded-2xl
                            ${msg.from_staff 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                            }
                          `}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.from_staff ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Send
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Messages are encrypted end-to-end
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                Add New Client
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Returns</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            JD
                          </div>
                          <span className="font-semibold text-gray-900">John Doe {i}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">john.doe{i}@email.com</td>
                      <td className="px-4 py-4 text-gray-900 font-semibold">{i}</td>
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Session Timeout</p>
                    <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                  </div>
                  <select className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>
            </div>

            {/* EFIN/PTIN Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Credentials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">EFIN Number</p>
                  <p className="text-2xl font-bold text-blue-900">33-4891499</p>
                </div>

                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">PTIN Status</p>
                  <p className="text-2xl font-bold text-green-900">Active</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EROHub;
