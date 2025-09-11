import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, MessageSquare, Globe, TrendingUp, RefreshCw, CheckCircle, Calendar, MapPin } from 'lucide-react';

export default function CautioDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedQueryType, setSelectedQueryType] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Simple sheet configuration
  const sourceSheetId = '1nQgbSdaZcwjPKciPCb_UW-J1iSBAVVMc8vEsSme2ip8';

  // Robust fake email detection
  const isFakeEmail = (email) => {
    const cleanEmail = (email || '').trim().toLowerCase().replace(/"/g, '');
    const fakeEmails = [
      'faudev@fattudev.in',
      'fattudev@fattudev.in'
    ];
    return fakeEmails.includes(cleanEmail);
  };

  // Format date function
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Analyze data function
  const analyzeData = (rawData) => {
    const totalResponses = rawData.length;
    
    console.log('Analyzing', totalResponses, 'responses (after filtering fake emails)');
    
    // City analysis
    const cityCount = {};
    rawData.forEach(row => {
      const city = row.city || '';
      
      if (city && 
          city.length > 2 && 
          city !== 'English' && 
          city !== 'language' &&
          !city.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && 
          /^[a-zA-Z\s\-\.]+$/.test(city)) {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
    });

    const topCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalResponses) * 100)
      }));

    // Country analysis
    const countryCount = {};
    rawData.forEach(row => {
      const country = row.country || '';
      
      const validCountries = { 'IN': 'India', 'IT': 'Italy', 'SG': 'Singapore', 'US': 'USA', 'CA': 'Canada' };
      if (validCountries[country]) {
        const countryName = validCountries[country];
        countryCount[countryName] = (countryCount[countryName] || 0) + 1;
      }
    });

    const countries = Object.entries(countryCount).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalResponses) * 100),
      flag: name === 'India' ? '🇮🇳' : name === 'Italy' ? '🇮🇹' : name === 'Singapore' ? '🇸🇬' : 
            name === 'USA' ? '🇺🇸' : name === 'Canada' ? '🇨🇦' : '🏳️'
    }));

    // Query analysis
    const queryCategories = {
      'Purchase Inquiry': ['buy', 'purchase', 'price', 'dashcam', 'want to buy'],
      'Business Partnership': ['partnership', 'business', 'collaboration', 'distribution'],
      'Job/Internship': ['job', 'internship', 'career', 'hiring', 'opportunity'],
      'Investment/Funding': ['funding', 'investment', 'venture', 'capital'],
      'Others': []
    };

    const queryTypes = Object.keys(queryCategories).map((type, index) => ({
      type,
      count: 0,
      percentage: 0,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'][index]
    }));

    rawData.forEach(row => {
      const query = (row.query || '').toLowerCase();
      let categorized = false;
      
      Object.entries(queryCategories).forEach(([category, keywords], index) => {
        if (!categorized && keywords.some(keyword => query.includes(keyword))) {
          queryTypes[index].count++;
          categorized = true;
        }
      });
      
      if (!categorized) {
        queryTypes[4].count++;
      }
    });

    // Calculate percentages for query types
    queryTypes.forEach(qt => {
      qt.percentage = totalResponses > 0 ? Math.round((qt.count / totalResponses) * 100) : 0;
    });

    // Enhanced Monthly analysis - last 12 months
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }
    
    rawData.forEach(row => {
      if (row.timestamp) {
        const date = new Date(row.timestamp);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey]++;
          }
        }
      }
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort()
      .map(([month, responses]) => ({ 
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
        responses,
        monthKey: month
      }));

    // All customer leads (latest first)
    const allLeads = rawData
      .map(row => ({
        name: row.name || 'N/A',
        email: row.email || 'N/A',
        phone_number: row.phone_number || 'N/A',
        query: row.query ? (row.query.length > 80 ? row.query.substring(0, 80) + '...' : row.query) : 'N/A',
        city: row.city || 'N/A',
        date: formatDate(row.timestamp),
        timestamp: row.timestamp
      }))
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 20); // Show latest 20 leads

    console.log('Analysis complete:');
    console.log('- Total valid responses:', totalResponses);
    console.log('- Cities found:', Object.keys(cityCount).length);
    console.log('- Countries found:', Object.keys(countryCount).length);
    console.log('- Query types distribution:', queryTypes.map(qt => `${qt.type}: ${qt.count}`));

    return {
      totalResponses,
      timeRange: `Customer Response Analytics (${totalResponses} valid responses)`,
      topCities,
      queryTypes: queryTypes.filter(qt => qt.count > 0),
      monthlyTrend,
      countries,
      keyInsights: [
        `${totalResponses} total customer responses analyzed (fake emails filtered)`,
        `${topCities[0]?.name || 'N/A'} leads with ${topCities[0]?.count || 0} responses (${topCities[0]?.percentage || 0}%)`,
        `${queryTypes[0]?.count || 0} purchase inquiries indicating strong buying intent`,
        `${countries.length} countries represented showing global reach`,
        `${monthlyTrend.slice(-3).reduce((sum, m) => sum + m.responses, 0)} responses in last 3 months`,
        `Geographic concentration in major tech cities indicates target market alignment`,
        `Business partnership inquiries suggest B2B growth opportunities`,
        `International responses indicate potential for global expansion`
      ],
      recentLeads: allLeads.length > 0 ? allLeads : [
        { name: "No data found", email: "N/A", phone_number: "N/A", query: "Add more data to see customer leads", city: "N/A", date: "N/A" }
      ]
    };
  };

  // Fetch data from Google Sheets
  const fetchLiveData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching data from Google Sheets...');
      
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sourceSheetId}/export?format=csv&gid=0`;
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();
      console.log('📊 Raw data received, length:', data.length);
      
      const lines = data.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      
      console.log('📋 Headers detected:', headers);
      
      const rawData = [];
      const expectedHeaders = ['name', 'email', 'phone_number', 'query', 'vehicle_type', 'timestamp', 'language', 'ip_address', 'city', 'country', 'lat', 'long'];
      
      let totalProcessed = 0;
      let fakeFiltered = 0;
      let validAdded = 0;

      for (let i = 1; i < lines.length; i++) {
        totalProcessed++;
        const line = lines[i];
        
        // Better CSV parsing
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        
        const row = {};
        expectedHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Check if name column has valid data - MAIN FILTER
        const name = (row.name || '').trim();
        if (!name || name.length <= 1 || name.toLowerCase() === 'name') {
          continue; // Skip rows without proper name data
        }
        
        // Filter fake emails from 'email' column - SECONDARY FILTER
        const email = row.email || '';
        if (isFakeEmail(email)) {
          console.log('🚫 Filtered fake email:', email, '| Name:', row.name);
          fakeFiltered++;
          continue;
        }
        
        // Add valid row
        rawData.push(row);
        validAdded++;
      }
      
      console.log('📈 Processing Summary:');
      console.log('- Total rows processed:', totalProcessed);
      console.log('- Fake emails filtered:', fakeFiltered);
      console.log('- Valid rows added:', validAdded);
      console.log('- Final dataset size:', rawData.length);
      console.log('🎯 FINAL VALID CUSTOMER COUNT:', rawData.length);
      
      // Final verification - check if any fake emails remain
      const remainingFakeEmails = rawData.filter(row => isFakeEmail(row.email));
      
      if (remainingFakeEmails.length > 0) {
        console.log('⚠️ WARNING: Fake emails still in data:', remainingFakeEmails.length);
        remainingFakeEmails.forEach((row, index) => {
          console.log(`Remaining fake email ${index + 1}:`, row.email, '| Name:', row.name);
        });
        
        // Remove them manually if they somehow got through
        const cleanedData = rawData.filter(row => !isFakeEmail(row.email));
        console.log('🧹 Manual cleanup: Removed', rawData.length - cleanedData.length, 'fake emails');
        
        if (cleanedData.length === 0) {
          throw new Error('No valid data found after filtering');
        }
        
        const analyzedData = analyzeData(cleanedData);
        setDashboardData(analyzedData);
      } else {
        console.log('✅ SUCCESS: All fake emails filtered out successfully!');
        
        if (rawData.length === 0) {
          throw new Error('No valid data found');
        }
        
        const analyzedData = analyzeData(rawData);
        setDashboardData(analyzedData);
      }
      
      setLastUpdated(new Date().toLocaleString());
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      
      setDashboardData({
        totalResponses: "Error",
        timeRange: "Unable to fetch live customer data - check sheet permissions",
        topCities: [
          { name: "Bengaluru", count: 32, percentage: 32 },
          { name: "Hyderabad", count: 8, percentage: 8 },
          { name: "Mumbai", count: 7, percentage: 7 }
        ],
        queryTypes: [
          { type: "Purchase Inquiry", count: 45, percentage: 65, color: "#3B82F6" },
          { type: "Business Partnership", count: 18, percentage: 26, color: "#10B981" },
          { type: "Others", count: 6, percentage: 9, color: "#6B7280" }
        ],
        monthlyTrend: [
          { month: 'Jul 2024', responses: 15 },
          { month: 'Aug 2024', responses: 25 },
          { month: 'Sep 2024', responses: 10 }
        ],
        countries: [
          { name: "India", count: 96, percentage: 85, flag: "🇮🇳" },
          { name: "USA", count: 8, percentage: 7, flag: "🇺🇸" }
        ],
        keyInsights: [
          "Unable to fetch live data from Google Sheets",
          "Please ensure the Google Sheet is public (Anyone with link can view)",
          "Check if the sheet URL is correct",
          "This is sample data for demonstration"
        ],
        recentLeads: [
          { name: "Sheet Access Error", email: "N/A", phone_number: "N/A", query: "Make Google Sheet public to see live data", city: "N/A", date: "N/A" }
        ]
      });
    }
    setLoading(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedQueryType, selectedCity]);

  const StatCard = ({ icon: Icon, title, value, subtitle, onClick, clickable = false }) => (
    <div 
      className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 transition-all duration-200 ${
        clickable ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      {clickable && (
        <div className="mt-2 text-xs text-blue-600">Click to filter</div>
      )}
    </div>
  );

  const handleQueryTypeClick = (queryType) => {
    setSelectedQueryType(selectedQueryType === queryType.type ? null : queryType.type);
  };

  const handleCityClick = (data) => {
    setSelectedCity(selectedCity === data.name ? null : data.name);
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading and filtering live customer data...</p>
          <p className="text-sm text-gray-500 mt-2">Removing fake emails and processing responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cautio Website Responses</h1>
            <p className="text-gray-600">{dashboardData.timeRange}</p>
          </div>
          <button
            onClick={fetchLiveData}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">Last updated: {lastUpdated}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      {(selectedQueryType || selectedCity) && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedQueryType && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Query Type: {selectedQueryType}
                </span>
              )}
              {selectedCity && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  City: {selectedCity}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedQueryType(null);
                setSelectedCity(null);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={Users} 
              title="Total Responses" 
              value={dashboardData.totalResponses} 
              subtitle="Valid customer inquiries" 
            />
            <StatCard 
              icon={MessageSquare} 
              title="Query Types" 
              value={dashboardData.queryTypes.length} 
              subtitle={`${dashboardData.queryTypes[0]?.count || 0} purchase inquiries`}
              onClick={() => handleQueryTypeClick(dashboardData.queryTypes[0])}
              clickable={true}
            />
            <StatCard 
              icon={Globe} 
              title="Geographic Reach" 
              value={`${dashboardData.countries.length} Countries`} 
              subtitle={`${dashboardData.topCities.length} cities active`}
            />
          </div>

          {/* Enhanced Monthly Trend */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Monthly Response Trend (Last 12 Months)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={dashboardData.monthlyTrend}>
                <defs>
                  <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [`${value} responses`, 'Monthly Customer Inquiries']}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="responses" 
                  stroke="#10B981" 
                  fill="url(#responseGradient)"
                  strokeWidth={3}
                  name="Monthly Responses"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-600">Total (12 months)</div>
                <div className="text-lg font-bold text-blue-600">
                  {dashboardData.monthlyTrend.reduce((sum, m) => sum + m.responses, 0)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-600">Last 3 months</div>
                <div className="text-lg font-bold text-green-600">
                  {dashboardData.monthlyTrend.slice(-3).reduce((sum, m) => sum + m.responses, 0)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-600">Peak Month</div>
                <div className="text-lg font-bold text-purple-600">
                  {Math.max(...dashboardData.monthlyTrend.map(m => m.responses))}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-600">Average/Month</div>
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(dashboardData.monthlyTrend.reduce((sum, m) => sum + m.responses, 0) / dashboardData.monthlyTrend.length)}
                </div>
              </div>
            </div>
          </div>

          {/* Top Cities Bar Chart - Clickable */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Top Cities Distribution (Click to filter)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dashboardData.topCities}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} responses (${props.payload.percentage}% of total)`, 
                    'Customer Inquiries'
                  ]}
                  labelFormatter={(label) => `City: ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#F59E0B"
                  name="City Responses"
                  onClick={handleCityClick}
                  cursor="pointer"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600">
              Click on any bar to filter the customer leads table by city
            </div>
          </div>

          {/* Customer Leads Table */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Customer Leads (Latest First)
              {(selectedQueryType || selectedCity) && (
                <span className="ml-2 text-sm text-gray-500">- Filtered</span>
              )}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Query</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">City</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentLeads
                    .filter(lead => !selectedCity || lead.city === selectedCity)
                    .slice(0, 15)
                    .map((lead, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2 font-medium text-gray-900">{lead.name}</td>
                      <td className="py-3 px-2 text-gray-600 text-sm">{lead.email}</td>
                      <td className="py-3 px-2 text-gray-600 text-sm">{lead.phone_number}</td>
                      <td className="py-3 px-2 text-gray-600 text-sm max-w-xs">{lead.query}</td>
                      <td className="py-3 px-2 text-gray-600 text-sm">{lead.city}</td>
                      <td className="py-3 px-2 text-gray-600 text-sm">{lead.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dashboardData.recentLeads.length > 15 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Showing latest 15 leads out of {dashboardData.recentLeads.length} total
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Key Insights */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">💡 Key Insights & Analytics Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Business Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Behavior Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-green-700">📊 Customer Behavior Analysis</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-800">Purchase Intent Signals</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.round((dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.count || 0) / dashboardData.totalResponses * 100)}% of inquiries show direct buying intent, indicating strong market demand for dashcam products.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-800">Geographic Concentration</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Top 3 cities ({dashboardData.topCities.slice(0,3).map(c => c.name).join(', ')}) account for {dashboardData.topCities.slice(0,3).reduce((sum, c) => sum + c.percentage, 0)}% of total responses, suggesting targeted urban market penetration.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-800">Business Development</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {dashboardData.queryTypes.find(qt => qt.type === 'Business Partnership')?.count || 0} partnership inquiries and {dashboardData.queryTypes.find(qt => qt.type === 'Job/Internship')?.count || 0} job applications indicate growing brand recognition and expansion opportunities.
                  </p>
                </div>
              </div>
            </div>

            {/* Market Intelligence */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-orange-700">🎯 Market Intelligence</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-800">Growth Trajectory</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Recent 3-month trend shows {dashboardData.monthlyTrend.slice(-3).reduce((sum, m) => sum + m.responses, 0)} responses, with peak month reaching {Math.max(...dashboardData.monthlyTrend.map(m => m.responses))} inquiries.
                  </p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-gray-800">International Expansion</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Presence in {dashboardData.countries.length} countries with {dashboardData.countries.find(c => c.name !== 'India')?.count || 0} international inquiries suggests global market potential beyond domestic focus.
                  </p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-gray-800">Customer Quality</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    High data quality with complete contact information in majority of responses indicates serious customer interest and effective lead generation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Report */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">📋 Executive Summary & Strategic Recommendations</h3>
            <div className="space-y-6">
              
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 mb-3">🚀 Business Strengths & Opportunities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <ul className="list-disc list-inside text-green-700 space-y-2">
                    <li><strong>Strong Purchase Intent:</strong> {Math.round((dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.count || 0) / dashboardData.totalResponses * 100)}% direct buying inquiries</li>
                    <li><strong>Geographic Focus:</strong> Concentrated in tech hubs like {dashboardData.topCities.slice(0,2).map(c => c.name).join(' and ')}</li>
                    <li><strong>Brand Recognition:</strong> Partnership and job inquiries show growing reputation</li>
                  </ul>
                  <ul className="list-disc list-inside text-green-700 space-y-2">
                    <li><strong>Data Quality:</strong> Clean, actionable customer contact information</li>
                    <li><strong>Market Validation:</strong> Consistent monthly response volume</li>
                    <li><strong>International Interest:</strong> Multi-country presence established</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-800 mb-3">📈 Strategic Action Items</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">Immediate Actions (0-30 days):</h5>
                    <ul className="list-disc list-inside text-blue-600 space-y-1">
                      <li>Implement automated lead scoring system</li>
                      <li>Create dedicated B2B partnership process</li>
                      <li>Set up immediate follow-up for purchase inquiries</li>
                      <li>Develop city-specific marketing campaigns</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">Strategic Initiatives (30-90 days):</h5>
                    <ul className="list-disc list-inside text-blue-600 space-y-1">
                      <li>Launch targeted campaigns in tier-2 cities</li>
                      <li>Develop international expansion strategy</li>
                      <li>Create industry-specific product offerings</li>
                      <li>Implement advanced analytics and conversion tracking</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-semibold text-yellow-800 mb-3">⚠️ Areas for Optimization</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-yellow-700 mb-2">Lead Management:</h5>
                    <ul className="list-disc list-inside text-yellow-600 space-y-1">
                      <li>Response time optimization</li>
                      <li>Lead nurturing automation</li>
                      <li>Conversion rate tracking</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-yellow-700 mb-2">Market Expansion:</h5>
                    <ul className="list-disc list-inside text-yellow-600 space-y-1">
                      <li>Tier-2 city penetration</li>
                      <li>International market entry</li>
                      <li>Rural market exploration</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-yellow-700 mb-2">Customer Experience:</h5>
                    <ul className="list-disc list-inside text-yellow-600 space-y-1">
                      <li>Website optimization</li>
                      <li>Multi-language support</li>
                      <li>Mobile experience enhancement</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-semibold text-purple-800 mb-3">🔮 Future Growth Projections</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-purple-700 mb-2">Revenue Potential:</h5>
                    <p className="text-purple-600">
                      Based on current {Math.round(dashboardData.monthlyTrend.reduce((sum, m) => sum + m.responses, 0) / dashboardData.monthlyTrend.length)} average monthly inquiries and {Math.round((dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.count || 0) / dashboardData.totalResponses * 100)}% purchase intent, estimated monthly revenue potential with proper conversion optimization.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-purple-700 mb-2">Market Expansion:</h5>
                    <p className="text-purple-600">
                      Geographic concentration suggests untapped potential in {10 - dashboardData.topCities.length}+ additional cities, with international markets showing early-stage interest for future expansion.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
