import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
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

// Context for subscription management
const SubscriptionContext = createContext(null);

// Custom hook for form validation
const useFormValidation = (initialState) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});

  const validate = useCallback(() => {
    const newErrors = {};
    if (!values.name?.trim()) newErrors.name = 'Name is required';
    if (!values.amount || values.amount <= 0) newErrors.amount = 'Valid amount is required';
    if (!values.renewalDate) newErrors.renewalDate = 'Renewal date is required';
    if (!values.paymentMethod?.trim()) newErrors.paymentMethod = 'Payment method is required';
    
    const renewalDate = new Date(values.renewalDate);
    if (renewalDate < new Date()) {
      newErrors.renewalDate = 'Renewal date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  return { values, setValues, errors, validate };
};

// Custom hook for subscription management
const useSubscriptions = (userId) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const storageKey = `subscriptions_${userId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSubscriptions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(subscriptions));
    } catch (error) {
      console.error('Error saving subscriptions:', error);
    }
  }, [subscriptions, storageKey]);

  const addSubscription = useCallback((newSub) => {
    const now = new Date().toISOString();
    setSubscriptions(prev => [...prev, {
      ...newSub,
      id: Date.now(),
      createdAt: now,
      priceHistory: [{
        amount: parseFloat(newSub.amount),
        date: now,
        note: 'Initial price'
      }],
      statusHistory: [{
        status: 'active',
        date: now,
        note: 'Subscription created'
      }]
    }]);
  }, []);

  const updateSubscription = useCallback((id, updates) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, ...updates } : sub
    ));
  }, []);

  const deleteSubscription = useCallback((id) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  }, []);

  return {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription
  };
};

// Custom hook for authentication
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return !!localStorage.getItem('currentUser');
    } catch {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const register = useCallback((userData) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUser = {
      id: Date.now(),
      ...userData
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    login(newUser);
  }, [login]);

  return {
    isAuthenticated,
    currentUser,
    login,
    logout,
    register
  };
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Something went wrong. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}

// Authentication Component with Form Validation
const AuthPages = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { values, setValues, errors, validate } = useFormValidation({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!isLogin && values.password !== values.confirmPassword) {
      return;
    }

    try {
      if (isLogin) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => 
          u.email === values.email && u.password === values.password
        );
        if (user) {
          onLogin(user);
        } else {
          throw new Error('Invalid credentials');
        }
      } else {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(u => u.email === values.email)) {
          throw new Error('Email already exists');
        }
        onRegister(values);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold tracking-tight text-blue-600">
                SUBTRACK
              </h1>
            </div>
            <p className="text-gray-600">
              Keep track of your subscriptions with ease
            </p>
          </div>
          <CardTitle>{isLogin ? 'Login' : 'Create Account'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full">
              {isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>
          <Button
            variant="link"
            className="w-full mt-4"
            onClick={() => {
              setIsLogin(!isLogin);
              setValues({ email: '', password: '', confirmPassword: '' });
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Subscription Form Component
const SubscriptionForm = ({ onSubmit, type }) => {
  const initialState = {
    name: '',
    renewalDate: '',
    paymentMethod: '',
    amount: '',
    type,
    status: 'active'
  };

  const { values, setValues, errors, validate } = useFormValidation(initialState);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(values);
      setValues(initialState);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Subscription Name</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <Label htmlFor="amount">Amount (£)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={values.amount}
            onChange={(e) => setValues({ ...values, amount: e.target.value })}
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>
        <div>
          <Label htmlFor="renewalDate">Payment Date</Label>
          <Input
            id="renewalDate"
            type="date"
            value={values.renewalDate}
            onChange={(e) => setValues({ ...values, renewalDate: e.target.value })}
            className={errors.renewalDate ? 'border-red-500' : ''}
          />
          {errors.renewalDate && (
            <p className="text-red-500 text-sm mt-1">{errors.renewalDate}</p>
          )}
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Input
            id="paymentMethod"
            value={values.paymentMethod}
            onChange={(e) => setValues({ ...values, paymentMethod: e.target.value })}
            className={errors.paymentMethod ? 'border-red-500' : ''}
          />
          {errors.paymentMethod && (
            <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full">Add Subscription</Button>
    </form>
  );
};

// Main App Component
const App = () => {
  const {
    isAuthenticated,
    currentUser,
    login,
    logout,
    register
  } = useAuth();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {!isAuthenticated ? (
          <AuthPages onLogin={login} onRegister={register} />
        ) : (
          <SubscriptionContext.Provider value={{ currentUser, logout }}>
            <SubscriptionTracker />
          </SubscriptionContext.Provider>
        )}
      </div>
    </ErrorBoundary>
  );
};

// Main Subscription Tracker Component
const SubscriptionTracker = () => {
  const { currentUser, logout } = useContext(SubscriptionContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardFilter, setDashboardFilter] = useState('all');
  
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription
  } = useSubscriptions(currentUser.id);

  // Memoized filtering function
  const getFilteredSubscriptions = useCallback((filter) => {
    return subscriptions.filter(sub => {
      if (filter === 'all') return true;
      return sub.type === filter.toLowerCase();
    });
  }, [subscriptions]);

  // Memoized calculations
  const calculateTotals = useCallback((type) => {
    const filtered = subscriptions.filter(sub => 
      sub.type === type && sub.status === 'active'
    );
    const monthly = filtered.reduce((sum, sub) => sum + parseFloat(sub.amount), 0);
    return {
      monthly,
      yearly: monthly * 12
    };
  }, [subscriptions]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Header user={currentUser} onLogout={logout} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <ErrorBoundary>
        {activeTab === 'dashboard' && (
            <TabsContent value="dashboard">
              <DashboardView
                subscriptions={subscriptions}
                filter={dashboardFilter}
                setFilter={setDashboardFilter}
                getFilteredSubscriptions={getFilteredSubscriptions}
                onUpdateStatus={(id, status) => updateSubscription(id, { status })}
                onUpdatePrice={(id, amount) => updateSubscription(id, { 
                  amount,
                  priceHistory: [
                    ...subscriptions.find(s => s.id === id).priceHistory,
                    { amount, date: new Date().toISOString(), note: 'Price updated manually' }
                  ]
                })}
                onDelete={deleteSubscription}
              />
            </TabsContent>
          )}

          {['personal', 'business'].map(type => (
            <TabsContent key={type} value={type}>
              <SubscriptionTypeView
                type={type}
                subscriptions={getFilteredSubscriptions(type)}
                totals={calculateTotals(type)}
                onAddSubscription={addSubscription}
                onUpdateStatus={(id, status) => updateSubscription(id, { status })}
                onUpdatePrice={(id, amount) => updateSubscription(id, {
                  amount,
                  priceHistory: [
                    ...subscriptions.find(s => s.id === id).priceHistory,
                    { amount, date: new Date().toISOString(), note: 'Price updated manually' }
                  ]
                })}
                onDelete={deleteSubscription}
              />
            </TabsContent>
          ))}

          {activeTab === 'reports' && (
            <TabsContent value="reports">
              <ReportsView subscriptions={subscriptions} />
            </TabsContent>
          )}
        </ErrorBoundary>
      </Tabs>
    </div>
  );
};

// Header Component
const Header = ({ user, onLogout }) => (
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
);

// Dashboard View Component
const DashboardView = ({
  subscriptions,
  filter,
  setFilter,
  getFilteredSubscriptions,
  onUpdateStatus,
  onUpdatePrice,
  onDelete
}) => {
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }, []);

  const activeSubscriptions = useMemo(() => 
    getFilteredSubscriptions(filter).filter(sub => sub.status === 'active'),
    [filter, getFilteredSubscriptions]
  );

  const totals = useMemo(() => {
    const monthly = activeSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount), 0);
    return {
      monthly,
      yearly: monthly * 12,
      count: activeSubscriptions.length
    };
  }, [activeSubscriptions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Overview</CardTitle>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Subscriptions</option>
            <option value="personal">Personal Only</option>
            <option value="business">Business Only</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Active Subscriptions"
            value={totals.count.toString()}
          />
          <StatCard
            title="Monthly Total"
            value={formatCurrency(totals.monthly)}
          />
          <StatCard
            title="Yearly Total"
            value={formatCurrency(totals.yearly)}
          />
        </div>

        <SubscriptionList
          subscriptions={activeSubscriptions}
          onUpdateStatus={onUpdateStatus}
          onUpdatePrice={onUpdatePrice}
          onDelete={onDelete}
          formatCurrency={formatCurrency}
        />
      </CardContent>
    </Card>
  );
};

// Subscription Type View Component
const SubscriptionTypeView = ({
  type,
  subscriptions,
  totals,
  onAddSubscription,
  onUpdateStatus,
  onUpdatePrice,
  onDelete
}) => {
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }, []);

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm onSubmit={onAddSubscription} type={type} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{type} Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Monthly Total"
              value={formatCurrency(totals.monthly)}
            />
            <StatCard
              title="Yearly Total"
              value={formatCurrency(totals.yearly)}
            />
          </div>

          <SubscriptionList
            subscriptions={subscriptions}
            onUpdateStatus={onUpdateStatus}
            onUpdatePrice={onUpdatePrice}
            onDelete={onDelete}
            formatCurrency={formatCurrency}
          />
        </CardContent>
      </Card>
    </>
  );
};

// Reports View Component with Memoization
const ReportsView = ({ subscriptions }) => {
  const [dateRange, setDateRange] = useState('1y');
  const [customRange, setCustomRange] = useState({
    start: '',
    end: new Date().toISOString().split('T')[0]
  });

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate;
    
    switch(dateRange) {
      case '1m': startDate = new Date(now.getFullYear(), now.getMonth() - 1); break;
      case '3m': startDate = new Date(now.getFullYear(), now.getMonth() - 3); break;
      case '6m': startDate = new Date(now.getFullYear(), now.getMonth() - 6); break;
      case '1y': default: startDate = new Date(now.getFullYear() - 1, now.getMonth());
    }

    const data = [];
    let currentDate = new Date(startDate);

    while (currentDate <= now) {
      const monthData = {
        date: currentDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        personal: 0,
        business: 0,
        total: 0
      };

      subscriptions.forEach(sub => {
        if (new Date(sub.createdAt) <= currentDate && sub.status === 'active') {
          const amount = parseFloat(sub.amount);
          if (sub.type === 'personal') monthData.personal += amount;
          else monthData.business += amount;
        }
      });

      monthData.total = monthData.personal + monthData.business;
      data.push(monthData);

      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }

    return data;
  }, [subscriptions, dateRange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Subscription Trends</CardTitle>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `£${value}`}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  formatter={(value) => `£${value.toFixed(2)}`}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="personal"
                  name="Personal"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="business"
                  name="Business"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <ReportsSummary subscriptions={subscriptions} />
    </div>
  );
};

// Utility Components
const StatCard = ({ title, value }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

const StatusControls = ({ subscription, onUpdateStatus, onDelete }) => (
  <div className="flex gap-2">
    {subscription.status !== 'active' && (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onUpdateStatus(subscription.id, 'active')}
      >
        <Play className="h-4 w-4" />
      </Button>
    )}
    {subscription.status !== 'paused' && (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onUpdateStatus(subscription.id, 'paused')}
      >
        <Pause className="h-4 w-4" />
      </Button>
    )}
    {subscription.status !== 'cancelled' && (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onUpdateStatus(subscription.id, 'cancelled')}
      >
        <X className="h-4 w-4" />
      </Button>
    )}
    <Button
      size="sm"
      variant="destructive"
      onClick={() => onDelete(subscription.id)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

export default App;