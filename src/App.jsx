import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Trash2, Pause, Play, X, Calendar, LogOut, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Dashboard Filter Component
const DashboardFilter = ({ filter, setFilter }) => {
  return (
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="p-2 border rounded"
    >
      <option value="all">All Subscriptions</option>
      <option value="personal">Personal Only</option>
      <option value="business">Business Only</option>
    </select>
  );
};

// Helper function to filter subscriptions based on dashboard filter
const getFilteredSubscriptions = (subscriptions, filter) => {
  if (filter === 'all') return subscriptions;
  return subscriptions.filter(sub => sub.type === filter.toLowerCase());
};

// Format currency helper
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

// Main App Component
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <AuthPages setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />
      ) : (
        <SubscriptionTracker user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
};

// Authentication Component
const AuthPages = ({ setIsAuthenticated, setCurrentUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (isLogin) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === formData.email && u.password === formData.password);
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setError('Invalid credentials');
      }
    } else {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find(u => u.email === formData.email);
      
      if (existingUser) {
        setError('Email already exists');
        return;
      }

      const newUser = {
        id: Date.now(),
        email: formData.email,
        password: formData.password
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setCurrentUser(newUser);
      setIsAuthenticated(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold tracking-tight text-blue-600">SUBTRACK</h1>
            </div>
            <p className="text-gray-600">Keep track of your subscriptions with ease</p>
          </div>
          <CardTitle>{isLogin ? 'Login' : 'Create Account'}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            )}
            <Button type="submit" className="w-full">
              {isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>
          <Button
            variant="link"
            className="w-full mt-4"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Subscription Tracker Component
const SubscriptionTracker = ({ user, onLogout }) => {
  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem(`subscriptions_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardFilter, setDashboardFilter] = useState('all');
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    renewalDate: '',
    paymentMethod: '',
    amount: '',
    type: 'personal',
    status: 'active',
    priceHistory: []
  });

  useEffect(() => {
    localStorage.setItem(`subscriptions_${user.id}`, JSON.stringify(subscriptions));
  }, [subscriptions, user.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSubscription(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newSubscription.name || !newSubscription.amount) return;
    
    const now = new Date().toISOString();
    setSubscriptions(prev => [...prev, {
      ...newSubscription,
      id: Date.now(),
      amount: parseFloat(newSubscription.amount),
      createdAt: now,
      priceHistory: [{
        amount: parseFloat(newSubscription.amount),
        date: now,
        note: 'Initial price'
      }],
      statusHistory: [{
        status: 'active',
        date: now,
        note: 'Subscription created'
      }]
    }]);
    
    setNewSubscription({
      name: '',
      renewalDate: '',
      paymentMethod: '',
      amount: '',
      type: 'personal',
      status: 'active',
      priceHistory: []
    });
  };

  const handleDelete = (id) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  const handleStatusChange = (id, newStatus) => {
    const now = new Date().toISOString();
    setSubscriptions(prev => 
      prev.map(sub => 
        sub.id === id ? {
          ...sub,
          status: newStatus,
          statusHistory: [
            ...sub.statusHistory,
            {
              status: newStatus,
              date: now,
              note: `Status changed to ${newStatus}`
            }
          ]
        } : sub
      )
    );
  };

  const handlePriceUpdate = (subscriptionId, newPrice, note = '') => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subscriptionId) {
        return {
          ...sub,
          amount: parseFloat(newPrice),
          priceHistory: [
            ...sub.priceHistory,
            {
              amount: parseFloat(newPrice),
              date: new Date().toISOString(),
              note: note || 'Price updated'
            }
          ]
        };
      }
      return sub;
    }));
  };

  const calculateTotal = (type, period = 'monthly') => {
    const filtered = subscriptions.filter(sub => 
      sub.type === type && sub.status === 'active'
    );
    const total = filtered.reduce((sum, sub) => sum + sub.amount, 0);
    return period === 'yearly' ? total * 12 : total;
  };

  const StatusControls = ({ subscription }) => (
    <div className="flex gap-2">
      {subscription.status !== 'active' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange(subscription.id, 'active')}
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
      {subscription.status !== 'paused' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange(subscription.id, 'paused')}
        >
          <Pause className="h-4 w-4" />
        </Button>
      )}
      {subscription.status !== 'cancelled' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange(subscription.id, 'cancelled')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleDelete(subscription.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const ReportsTab = () => {
    const [dateRange, setDateRange] = useState('1y');
    const [customRange, setCustomRange] = useState({
      start: '',
      end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
      if (subscriptions.length > 0) {
        const firstSubDate = new Date(Math.min(...subscriptions.map(sub => new Date(sub.createdAt))));
        setCustomRange(prev => ({
          ...prev,
          start: firstSubDate.toISOString().split('T')[0]
        }));
      }
    }, [subscriptions]);

    const generateChartData = () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear() - 1, now.getMonth());
      const data = [];

      let currentDate = new Date(startDate);
      while (currentDate <= now) {
        let totalAmount = 0;
        subscriptions.forEach(sub => {
          const subStart = new Date(sub.createdAt);
          if (subStart <= currentDate && sub.status === 'active') {
            totalAmount += sub.amount;
          }
        });

        data.push({
          date: currentDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
          amount: totalAmount
        });

        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      }

      return data;
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => `£${value}`} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold tracking-tight text-blue-600">SUBTRACK</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.email}</span>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        <p className="text-gray-600">Keep track of your subscriptions with ease</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
              <CardTitle>Overview</CardTitle>
                <DashboardFilter filter={dashboardFilter} setFilter={setDashboardFilter} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {getFilteredSubscriptions(
                        subscriptions.filter(sub => sub.status === 'active'),
                        dashboardFilter
                      ).length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        getFilteredSubscriptions(
                          subscriptions.filter(sub => sub.status === 'active'),
                          dashboardFilter
                        ).reduce((sum, sub) => sum + sub.amount, 0)
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Yearly Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        getFilteredSubscriptions(
                          subscriptions.filter(sub => sub.status === 'active'),
                          dashboardFilter
                        ).reduce((sum, sub) => sum + sub.amount, 0) * 12
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upcoming Renewals</h3>
                {getFilteredSubscriptions(
                  subscriptions.filter(sub => sub.status === 'active'),
                  dashboardFilter
                )
                  .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
                  .map(sub => (
                    <div 
                      key={sub.id} 
                      className={`flex items-center justify-between p-4 border rounded ${
                        sub.status === 'active' ? 'bg-green-50' :
                        sub.status === 'paused' ? 'bg-orange-50' :
                        'bg-red-50'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold">{sub.name}</h3>
                        <p className="text-sm text-gray-600">
                          Next Payment: {new Date(sub.renewalDate).toLocaleDateString()} | {sub.paymentMethod} | {formatCurrency(sub.amount)}/mo
                        </p>
                        <p className="text-sm font-medium capitalize">
                          Type: {sub.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="mb-2"
                            onClick={() => {
                              const newAmount = prompt('Enter new amount:', sub.amount);
                              if (newAmount && !isNaN(newAmount)) {
                                handlePriceUpdate(
                                  sub.id,
                                  parseFloat(newAmount),
                                  'Price updated manually'
                                );
                              }
                            }}
                          >
                            Update Price
                          </Button>
                          <StatusControls subscription={sub} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {['personal', 'business'].map(type => (
          <TabsContent key={type} value={type}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Subscription Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={newSubscription.name}
                        onChange={handleInputChange}
                        placeholder="Netflix"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (£)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        value={newSubscription.amount}
                        onChange={handleInputChange}
                        placeholder="9.99"
                      />
                    </div>
                    <div>
                      <Label htmlFor="renewalDate">Payment Date</Label>
                      <Input
                        id="renewalDate"
                        name="renewalDate"
                        type="date"
                        value={newSubscription.renewalDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Input
                        id="paymentMethod"
                        name="paymentMethod"
                        value={newSubscription.paymentMethod}
                        onChange={handleInputChange}
                        placeholder="Credit Card"
                      />
                    </div>
                    <input
                      type="hidden"
                      name="type"
                      value={type}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button type="submit" className="w-full">Add Subscription</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{type} Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatCurrency(calculateTotal(type, 'monthly'))}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Yearly Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatCurrency(calculateTotal(type, 'yearly'))}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  {subscriptions
                    .filter(sub => sub.type === type)
                    .map(sub => (
                      <div 
                        key={sub.id} 
                        className={`flex items-center justify-between p-4 border rounded ${
                          sub.status === 'active' ? 'bg-green-50' :
                          sub.status === 'paused' ? 'bg-orange-50' :
                          'bg-red-50'
                        }`}
                      >
                        <div>
                          <h3 className="font-bold">{sub.name}</h3>
                          <p className="text-sm text-gray-600">
                            Renewal: {new Date(sub.renewalDate).toLocaleDateString()} | {sub.paymentMethod}
                          </p>
                          <p className="text-sm font-medium capitalize">
                            Status: {sub.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{formatCurrency(sub.amount)}/mo</span>
                          <StatusControls subscription={sub} />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default App;