import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, MessageSquare, TrendingUp, RefreshCw, CheckCircle, Calendar, MapPin, X, Eye } from 'lucide-react';

export default function CautioDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedQueryType, setSelectedQueryType] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState('');
  const leadsPerPage = 20;

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

  // Enhanced query validation for English, Hinglish, and Hindi
  const isValidQuery = (query) => {
    if (!query || typeof query !== 'string') return false;
    
    const cleanQuery = query.trim();
    
    // Must be at least 3 characters
    if (cleanQuery.length < 3) return false;
    
    // Check if it's just a single character repeated
    if (new Set(cleanQuery.toLowerCase()).size <= 2) return false;
    
    // Must contain at least one letter (English, Hindi, or other scripts)
    if (!/[a-zA-Z\u0900-\u097F\u00C0-\u017F]/.test(cleanQuery)) return false;
    
    // Should not be just numbers or special characters
    if (/^[\d\s\-\.\,\!\?\@\#\$\%\^\&\*\(\)\_\+\=\[\]\{\}\|\\\:\;\"\'\<\>\,\.\/\?]+$/.test(cleanQuery)) return false;
    
    // Should contain some meaningful words (at least 2 characters each)
    const words = cleanQuery.split(/\s+/).filter(word => word.length >= 2);
    if (words.length === 0) return false;
    
    // Common invalid patterns to filter out
    const invalidPatterns = [
      /^test\s*$/i,
      /^hello\s*$/i,
      /^hi\s*$/i,
      /^ok\s*$/i,
      /^yes\s*$/i,
      /^no\s*$/i,
      /^good\s*$/i,
      /^nice\s*$/i,
      /^thanks\s*$/i,
      /^thank you\s*$/i,
      /^\d+\s*$/,
      /^[a-zA-Z]\s*$/,
      /^[a-zA-Z]{1,2}\s*$/
    ];
    
    // Check against invalid patterns
    for (const pattern of invalidPatterns) {
      if (pattern.test(cleanQuery)) return false;
    }
    
    // Must have some sentence structure (contains vowels and consonants or valid Hindi characters)
    const hasVowels = /[aeiouAEIOU\u0905-\u0914\u0960-\u0961]/.test(cleanQuery);
    const hasConsonants = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ\u0915-\u0939\u0958-\u095F]/.test(cleanQuery);
    const hasHindiChars = /[\u0900-\u097F]/.test(cleanQuery);
    
    if (!hasHindiChars && (!hasVowels || !hasConsonants)) return false;
    
    return true;
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
    
    // Enhanced city analysis - ALL cities
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

    // ALL cities for the new tab
    const allCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
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

    // Query analysis with validation
    const queryCategories = {
      'Purchase Inquiry': ['buy', 'purchase', 'price', 'dashcam', 'want to buy', 'cost', 'order'],
      'Business Partnership': ['partnership', 'business', 'collaboration', 'distribution', 'dealer'],
      'Job/Internship': ['job', 'internship', 'career', 'hiring', 'opportunity', 'work'],
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

    // All customer leads with enhanced query validation (latest first)
    const allLeads = rawData
      .filter(row => isValidQuery(row.query)) // Filter out invalid queries
      .map(row => ({
        name: row.name || 'N/A',
        email: row.email || 'N/A',
        phone_number: row.phone_number || 'N/A',
        query: row.query || 'N/A',
        queryPreview: row.query ? (row.query.length > 80 ? row.query.substring(0, 80) + '...' : row.query) : 'N/A',
        city: row.city || 'N/A',
        date: formatDate(row.timestamp),
        timestamp: row.timestamp
      }))
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    console.log('Analysis complete:');
    console.log('- Total valid responses:', totalResponses);
    console.log('- Valid queries after filtering:', allLeads.length);
    console.log('- Cities found:', Object.keys(cityCount).length);
    console.log('- Countries found:', Object.keys(countryCount).length);

    return {
      totalResponses: allLeads.length, // Use filtered count
      originalTotal: totalResponses, // Keep original for reference
      timeRange: `Customer Response Analytics (${allLeads.length} valid responses with proper queries)`,
      topCities,
      allCities,
      queryTypes: queryTypes.filter(qt => qt.count > 0),
      monthlyTrend,
      countries,
      keyInsights: [
        `${allLeads.length} total customer responses with valid queries analyzed`,
        `${topCities[0]?.name || 'N/A'} leads with ${topCities[0]?.count || 0} responses (${topCities[0]?.percentage || 0}%)`,
        `${queryTypes[0]?.count || 0} purchase inquiries indicating strong buying intent`,
        `${countries.length} countries represented showing global reach`,
        `${monthlyTrend.slice(-3).reduce((sum, m) => sum + m.responses, 0)} responses in last 3 months`,
        `Geographic concentration in major tech cities indicates target market alignment`,
        `Business partnership inquiries suggest B2B growth opportunities`,
        `International responses indicate potential for global expansion`,
        `Advanced query filtering ensures only meaningful customer inquiries are analyzed`
      ],
      recentLeads: allLeads.length > 0 ? allLeads : [
        { name: "No valid data found", email: "N/A", phone_number: "N/A", query: "Add more data with valid queries to see customer leads", queryPreview: "N/A", city: "N/A", date: "N/A" }
      ]
    };
  };

  // Fetch data from Google Sheets
  const fetchLiveData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching live data from Google Sheets...');
      
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
      
      if (rawData.length === 0) {
        throw new Error('No valid data found');
      }
      
      const analyzedData = analyzeData(rawData);
      setDashboardData(analyzedData);
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
        allCities: [
          { name: "Bengaluru", count: 32, percentage: 32 },
          { name: "Hyderabad", count: 8, percentage: 8 },
          { name: "Mumbai", count: 7, percentage: 7 },
          { name: "Delhi", count: 5, percentage: 5 },
          { name: "Chennai", count: 4, percentage: 4 }
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
          { name: "Sheet Access Error", email: "N/A", phone_number: "N/A", query: "Make Google Sheet public to see live data", queryPreview: "Make Google Sheet public...", city: "N/A", date: "N/A" }
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

  const StatCard = ({ icon: Icon, title, value, subtitle, onClick, clickable = false, description }) => (
    <div 
      className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 transition-all duration-200 ${
        clickable ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:border-blue-600' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {description && <p className="text-xs text-blue-600 mt-1">{description}</p>}
        </div>
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      {clickable && (
        <div className="mt-2 text-xs text-blue-600 font-medium">👆 Click to explore</div>
      )}
    </div>
  );

  const handleQueryTypeClick = (queryType) => {
    setSelectedQueryType(selectedQueryType === queryType.type ? null : queryType.type);
  };

  const handleCityClick = (data) => {
    setSelectedCity(selectedCity === data.name ? null : data.name);
  };

  const handleAllResponsesClick = () => {
    setSelectedQueryType(null);
    setSelectedCity(null);
    setCurrentPage(1);
  };

  const handleTopCitiesClick = () => {
    setActiveTab('overview');
    setTimeout(() => {
      document.getElementById('cities-chart')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleQueryClick = (query) => {
    setSelectedQuery(query);
    setShowQueryModal(true);
  };

  // Query Modal Component
  const QueryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Customer Query</h3>
          <button
            onClick={() => setShowQueryModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {selectedQuery}
            </p>
          </div>
        </div>
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={() => setShowQueryModal(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading and filtering live customer data...</p>
          <p className="text-sm text-gray-500 mt-2">Processing valid queries from sheet...</p>
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
            {['overview', 'all-cities', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all-cities' ? 'All Cities' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
              title="Total Valid Responses" 
              value={dashboardData.totalResponses} 
              subtitle="Customers with proper queries" 
              description="View all customer data"
              onClick={handleAllResponsesClick}
              clickable={true}
            />
            <StatCard 
              icon={MessageSquare} 
              title="Purchase Inquiries" 
              value={dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.count || 0}
              subtitle={`${dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.percentage || 0}% of total queries`}
              description="Direct buying interest"
              onClick={() => handleQueryTypeClick(dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry'))}
              clickable={true}
            />
            <StatCard 
              icon={MapPin} 
              title="Geographic Reach" 
              value={`${dashboardData.allCities.length} Cities`} 
              subtitle={`${dashboardData.topCities[0]?.name || 'N/A'} leads with ${dashboardData.topCities[0]?.count || 0}`}
              description="Jump to cities analysis"
              onClick={handleTopCitiesClick}
              clickable={true}
            />
          </div>

          {/* Enhanced Monthly Trend */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Monthly Customer Response Analysis (Last 12 Months)
              </h3>
              <div className="text-sm text-gray-500">
                Data shows customer inquiry trends over time
              </div>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                📈 <strong>Trend Analysis:</strong> This chart displays monthly customer response patterns, helping identify peak periods, growth trends, and seasonal variations in customer interest.
              </p>
            </div>
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
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Number of Responses', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${value} customer inquiries`, 'Monthly Responses']}
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
          </div>

          {/* Top Cities Bar Chart - Clickable */}
          <div id="cities-chart" className="bg-white p-6 rounded-lg shadow-md">
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
              Customer Leads
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
                  {(() => {
                    const filteredLeads = dashboardData.recentLeads.filter(lead => 
                      (!selectedCity || lead.city === selectedCity) &&
                      (!selectedQueryType || (lead.query && lead.query.toLowerCase().includes(selectedQueryType.toLowerCase())))
                    );
                    
                    const startIndex = (currentPage - 1) * leadsPerPage;
                    const endIndex = startIndex + leadsPerPage;
                    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
                    
                    return (
                      <>
                        {paginatedLeads.map((lead, index) => (
                          <tr key={startIndex + index} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2 font-medium text-gray-900">{lead.name}</td>
                            <td className="py-3 px-2 text-gray-600 text-sm">{lead.email}</td>
                            <td className="py-3 px-2 text-gray-600 text-sm">{lead.phone_number}</td>
                            <td className="py-3 px-2 text-gray-600 text-sm max-w-xs">
                              <div className="flex items-center space-x-2">
                                <span className="flex-1">{lead.queryPreview}</span>
                                {lead.query && lead.query !== 'N/A' && (
                                  <button
                                    onClick={() => handleQueryClick(lead.query)}
                                    className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                    title="View full query"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-gray-600 text-sm">{lead.city}</td>
                            <td className="py-3 px-2 text-gray-600 text-sm">{lead.date}</td>
                          </tr>
                        ))}
                        {paginatedLeads.length === 0 && (
                          <tr>
                            <td colSpan="6" className="py-8 px-2 text-center text-gray-500">
                              No leads found matching the current filters
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {(() => {
              const filteredLeads = dashboardData.recentLeads.filter(lead => 
                (!selectedCity || lead.city === selectedCity) &&
                (!selectedQueryType || (lead.query && lead.query.toLowerCase().includes(selectedQueryType.toLowerCase())))
              );
              const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
              
              if (totalPages <= 1) return null;
              
              return (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {Math.min((currentPage - 1) * leadsPerPage + 1, filteredLeads.length)} to {Math.min(currentPage * leadsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <div className="flex space-x-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm border rounded-md ${
                                currentPage === page 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 3 || page === currentPage + 3) {
                          return <span key={page} className="px-2 text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'all-cities' && (
        <div className="space-y-6">
          {/* All Cities Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Complete Cities Analysis - All {dashboardData.allCities.length} Cities
            </h3>
            
            {/* Cities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {dashboardData.allCities.map((city, index) => (
                <div 
                  key={city.name}
                  className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedCity === city.name 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCityClick(city)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{city.name}</h4>
                      <p className="text-2xl font-bold text-blue-600 mb-1">{city.count}</p>
                      <p className="text-sm text-gray-600">{city.percentage}% of total</p>
                      {index < 3 && (
                        <div className="mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            #{index + 1} Top City
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedCity === city.name ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <MapPin className={`h-6 w-6 ${
                          selectedCity === city.name ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cities Bar Chart */}
            <div className="mt-8">
              <h4 className="text-md font-semibold mb-4">All Cities Response Distribution</h4>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart 
                  data={dashboardData.allCities} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
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
                    fill="#3B82F6"
                    name="City Responses"
                    onClick={handleCityClick}
                    cursor="pointer"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* City Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="font-semibold text-blue-600 mb-1">Total Cities</div>
                <div className="text-2xl font-bold text-blue-800">{dashboardData.allCities.length}</div>
                <div className="text-xs text-blue-600">Geographic reach</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="font-semibold text-green-600 mb-1">Top 3 Cities</div>
                <div className="text-2xl font-bold text-green-800">
                  {dashboardData.allCities.slice(0, 3).reduce((sum, city) => sum + city.percentage, 0)}%
                </div>
                <div className="text-xs text-green-600">of total responses</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="font-semibold text-purple-600 mb-1">Leading City</div>
                <div className="text-2xl font-bold text-purple-800">{dashboardData.allCities[0]?.count || 0}</div>
                <div className="text-xs text-purple-600">{dashboardData.allCities[0]?.name || 'N/A'}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="font-semibold text-orange-600 mb-1">Average per City</div>
                <div className="text-2xl font-bold text-orange-800">
                  {Math.round(dashboardData.allCities.reduce((sum, city) => sum + city.count, 0) / dashboardData.allCities.length)}
                </div>
                <div className="text-xs text-orange-600">responses per city</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                💡 <strong>Insight:</strong> Click on any city card or bar to filter customer leads. Geographic distribution shows strong urban concentration with opportunities for expansion.
              </p>
            </div>
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

          {/* Query Quality Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-indigo-700">🔍 Query Quality & Filtering Analysis</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-gray-800">Advanced Query Validation</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Implemented intelligent filtering to process English, Hinglish, and Hindi queries. Only meaningful customer inquiries with valid sentence structure are included in the analysis.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-800">Data Quality Improvement</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {dashboardData.originalTotal ? `Processed ${dashboardData.originalTotal} raw entries, filtered to ${dashboardData.totalResponses} valid customer queries` : 'Advanced filtering ensures only legitimate customer inquiries are analyzed'}, removing test data, spam, and incomplete entries.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-800">Multi-language Support</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Query validation supports multiple languages and formats including pure English, Hinglish (Hindi-English mix), and Hindi Devanagari script, ensuring comprehensive customer inquiry analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Rest of insights content remains the same... */}
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
        </div>
      )}

      {/* Query Modal */}
      {showQueryModal && <QueryModal />}
    </div>
  );
}
