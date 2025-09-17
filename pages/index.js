import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import { Users, MessageSquare, TrendingUp, RefreshCw, CheckCircle, Calendar, MapPin, X, Eye, ShoppingCart, Globe } from 'lucide-react';

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

  // Enhanced fake email detection
  const isFakeEmail = (email) => {
    const cleanEmail = (email || '').trim().toLowerCase().replace(/"/g, '');
    const fakeEmails = [
      'faudev@fattudev.in',
      'fattudev@fattudev.in',
      'test@test.com',
      'example@example.com'
    ];
    return fakeEmails.includes(cleanEmail) || cleanEmail.includes('test') || cleanEmail === '';
  };

  // Enhanced query validation for English, Hinglish, and Hindi
  const isValidQuery = (query) => {
    if (!query || typeof query !== 'string') return false;
    
    const cleanQuery = query.trim();
    
    // Must be at least 5 characters for meaningful query
    if (cleanQuery.length < 5) return false;
    
    // Filter out common invalid patterns
    const invalidPatterns = [
      /^test\s*$/i,
      /^hello\s*$/i,
      /^hi\s*$/i,
      /^ok\s*$/i,
      /^yes\s*$/i,
      /^no\s*$/i,
      /^good\s*$/i,
      /^#ERROR!/i,
      /^\d+\s*$/,
      /^[a-zA-Z]{1,3}\s*$/,
      /^Private\s*$/i,
      /^English\s*$/i
    ];
    
    // Check against invalid patterns
    for (const pattern of invalidPatterns) {
      if (pattern.test(cleanQuery)) return false;
    }
    
    // Must contain meaningful words
    const words = cleanQuery.split(/\s+/).filter(word => word.length >= 2);
    if (words.length < 2) return false;
    
    // Must have some sentence structure
    const hasVowels = /[aeiouAEIOU\u0905-\u0914\u0960-\u0961]/.test(cleanQuery);
    const hasConsonants = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ\u0915-\u0939\u0958-\u095F]/.test(cleanQuery);
    const hasHindiChars = /[\u0900-\u097F]/.test(cleanQuery);
    
    if (!hasHindiChars && (!hasVowels || !hasConsonants)) return false;
    
    return true;
  };

  // Enhanced date parsing
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Handle different date formats from sheet
      let date;
      if (dateString.includes('/')) {
        // Format: M/D/YYYY or MM/DD/YYYY
        const parts = dateString.split('/');
        if (parts.length === 3) {
          date = new Date(parts[2], parts[0] - 1, parts[1]);
        }
      } else if (dateString.includes('-')) {
        // Format: YYYY-MM-DD or DD-MM-YYYY
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }
      
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.log('Date parsing error:', error);
      return null;
    }
  };

  // Format date function
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = parseDate(timestamp) || new Date(timestamp);
    if (!date || isNaN(date.getTime())) return 'N/A';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Analyze data function
  const analyzeData = (rawData) => {
    const totalResponses = rawData.length;
    
    console.log('Analyzing', totalResponses, 'responses after filtering');
    
    // Enhanced city analysis with coordinates
    const cityCount = {};
    const cityCoordinates = {};
    
    rawData.forEach(row => {
      const city = row.city || '';
      const lat = parseFloat(row.lat) || null;
      const lng = parseFloat(row.long) || null;
      
      if (city && city.length > 2 && 
          city !== 'English' && 
          city !== 'language' &&
          !city.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && 
          /^[a-zA-Z\s\-\.]+$/.test(city)) {
        
        cityCount[city] = (cityCount[city] || 0) + 1;
        
        // Store coordinates for mapping
        if (lat && lng && lat !== 0 && lng !== 0) {
          cityCoordinates[city] = { lat, lng, count: cityCount[city] };
        }
      }
    });

    const topCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalResponses) * 100),
        coordinates: cityCoordinates[name] || null
      }));

    // ALL cities for the cities tab
    const allCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalResponses) * 100),
        coordinates: cityCoordinates[name] || null
      }));

    // Geographic data for map visualization
    const geoData = Object.entries(cityCoordinates)
      .map(([city, data]) => ({
        city,
        x: data.lng,
        y: data.lat,
        count: data.count,
        size: Math.max(20, data.count * 5) // Size based on count
      }))
      .sort((a, b) => b.count - a.count);

    // Country analysis
    const countryCount = {};
    rawData.forEach(row => {
      const country = row.country || '';
      const validCountries = { 'IN': 'India', 'IT': 'Italy', 'SG': 'Singapore', 'US': 'USA', 'CA': 'Canada', 'UK': 'United Kingdom' };
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
            name === 'USA' ? '🇺🇸' : name === 'Canada' ? '🇨🇦' : name === 'United Kingdom' ? '🇬🇧' : '🏳️'
    }));

    // Enhanced query analysis with better categorization
    const queryCategories = {
      'Purchase Inquiry': ['buy', 'purchase', 'price', 'dashcam', 'want to buy', 'cost', 'order', 'enquire', 'inquiry', 'need dashcam', 'need dash cam', 'want dashcam'],
      'Business Partnership': ['partnership', 'business', 'collaboration', 'distribution', 'dealer', 'distributor', 'franchise'],
      'Job/Internship': ['job', 'internship', 'career', 'hiring', 'opportunity', 'work', 'hr team', 'employment'],
      'Investment/Funding': ['funding', 'investment', 'venture', 'capital', 'investor'],
      'Technical Support': ['support', 'help', 'issue', 'problem', 'technical', 'installation'],
      'Others': []
    };

    const queryTypes = Object.keys(queryCategories).map((type, index) => ({
      type,
      count: 0,
      percentage: 0,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'][index]
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
        queryTypes[queryTypes.length - 1].count++; // Add to Others
      }
    });

    // Calculate percentages for query types
    queryTypes.forEach(qt => {
      qt.percentage = totalResponses > 0 ? Math.round((qt.count / totalResponses) * 100) : 0;
    });

    // Enhanced Monthly analysis
    const monthlyData = {};
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }
    
    rawData.forEach(row => {
      const date = parseDate(row.timestamp);
      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
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

    // Enhanced customer leads with better validation and sorting
    const allLeads = rawData
      .filter(row => isValidQuery(row.query))
      .map(row => ({
        name: row.name || 'N/A',
        email: row.email || 'N/A',
        phone_number: row.phone_number || 'N/A',
        query: row.query || 'N/A',
        queryPreview: row.query ? (row.query.length > 60 ? row.query.substring(0, 60) + '...' : row.query) : 'N/A',
        city: row.city || 'N/A',
        date: formatDate(row.timestamp),
        timestamp: parseDate(row.timestamp) || new Date(0),
        queryType: (() => {
          const query = (row.query || '').toLowerCase();
          for (const [category, keywords] of Object.entries(queryCategories)) {
            if (keywords.some(keyword => query.includes(keyword))) {
              return category;
            }
          }
          return 'Others';
        })()
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Latest first

    console.log('Analysis complete:');
    console.log('- Total valid responses:', totalResponses);
    console.log('- Valid queries after filtering:', allLeads.length);
    console.log('- Cities with coordinates:', Object.keys(cityCoordinates).length);
    console.log('- Purchase inquiries:', queryTypes[0]?.count || 0);

    return {
      totalResponses: allLeads.length,
      originalTotal: totalResponses,
      timeRange: `Live Customer Response Analytics (${allLeads.length} valid responses)`,
      topCities,
      allCities,
      geoData,
      queryTypes: queryTypes.filter(qt => qt.count > 0),
      monthlyTrend,
      countries,
      keyInsights: [
        `${allLeads.length} validated customer responses with meaningful queries`,
        `${topCities[0]?.name || 'N/A'} leads with ${topCities[0]?.count || 0} responses (${topCities[0]?.percentage || 0}%)`,
        `${queryTypes[0]?.count || 0} purchase inquiries showing strong buying intent`,
        `${countries.length} countries represented with global reach potential`,
        `${monthlyTrend.slice(-3).reduce((sum, m) => sum + m.responses, 0)} responses in recent quarter`,
        `${geoData.length} cities mapped with geographic coordinates`,
        `Advanced filtering removes test data and ensures data quality`,
        `Real-time dashboard updates every 5 minutes from live sheet`
      ],
      recentLeads: allLeads.length > 0 ? allLeads : [
        { name: "No valid data found", email: "N/A", phone_number: "N/A", query: "Add customer data to see leads", queryPreview: "N/A", city: "N/A", date: "N/A", queryType: "Others" }
      ]
    };
  };

  // Enhanced CSV parsing function
  const parseCSVRow = (csvRow) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvRow.length; i++) {
      const char = csvRow[i];
      
      if (char === '"' && (i === 0 || csvRow[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === csvRow.length - 1 || csvRow[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else if (char !== '"' || inQuotes) {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Fetch data from Google Sheets with enhanced parsing
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
      console.log('📊 Raw data received, processing...');
      
      const lines = data.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('No data found in sheet');
      }
      
      // Parse header row
      const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());
      console.log('📋 Headers detected:', headers);
      
      // Expected headers mapping
      const headerMap = {
        'name': 'name',
        'email': 'email', 
        'phone_number': 'phone_number',
        'query': 'query',
        'vehicle_type': 'vehicle_type',
        'timestamp': 'timestamp',
        'language': 'language',
        'ip_address': 'ip_address',
        'city': 'city',
        'country': 'country',
        'lat': 'lat',
        'long': 'long'
      };
      
      const rawData = [];
      let totalProcessed = 0;
      let validAdded = 0;

      for (let i = 1; i < lines.length; i++) {
        totalProcessed++;
        const values = parseCSVRow(lines[i]);
        
        const row = {};
        headers.forEach((header, index) => {
          const mappedHeader = headerMap[header] || header;
          row[mappedHeader] = values[index] || '';
        });
        
        // Enhanced validation
        const name = (row.name || '').trim();
        const email = (row.email || '').trim();
        const query = (row.query || '').trim();
        
        // Skip if invalid name or email
        if (!name || name.length <= 1 || name.toLowerCase() === 'name') continue;
        if (isFakeEmail(email)) continue;
        if (!isValidQuery(query)) continue;
        
        // Clean up data
        row.name = name;
        row.email = email;
        row.query = query;
        row.city = (row.city || '').trim();
        row.phone_number = (row.phone_number || '').trim();
        
        rawData.push(row);
        validAdded++;
      }
      
      console.log('📈 Processing Summary:');
      console.log('- Total rows processed:', totalProcessed);
      console.log('- Valid entries added:', validAdded);
      console.log('🎯 FINAL CUSTOMER COUNT:', rawData.length);
      
      if (rawData.length === 0) {
        throw new Error('No valid customer data found after filtering');
      }
      
      const analyzedData = analyzeData(rawData);
      setDashboardData(analyzedData);
      setLastUpdated(new Date().toLocaleString());
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      
      // Fallback demo data
      setDashboardData({
        totalResponses: "Error",
        timeRange: "Unable to fetch live data - using demo data",
        topCities: [
          { name: "Bengaluru", count: 45, percentage: 35, coordinates: { lat: 12.9716, lng: 77.5946 } },
          { name: "Hyderabad", count: 18, percentage: 14, coordinates: { lat: 17.3850, lng: 78.4867 } },
          { name: "Mumbai", count: 15, percentage: 12, coordinates: { lat: 19.0760, lng: 72.8777 } }
        ],
        allCities: [
          { name: "Bengaluru", count: 45, percentage: 35 },
          { name: "Hyderabad", count: 18, percentage: 14 },
          { name: "Mumbai", count: 15, percentage: 12 }
        ],
        geoData: [
          { city: "Bengaluru", x: 77.5946, y: 12.9716, count: 45, size: 40 },
          { city: "Hyderabad", x: 78.4867, y: 17.3850, count: 18, size: 25 }
        ],
        queryTypes: [
          { type: "Purchase Inquiry", count: 65, percentage: 52, color: "#3B82F6" },
          { type: "Business Partnership", count: 25, percentage: 20, color: "#10B981" }
        ],
        monthlyTrend: [
          { month: 'Aug 2024', responses: 25 },
          { month: 'Sep 2024', responses: 35 },
          { month: 'Oct 2024', responses: 42 }
        ],
        countries: [
          { name: "India", count: 120, percentage: 85, flag: "🇮🇳" }
        ],
        keyInsights: [
          "Demo data - Unable to fetch live Google Sheets data",
          "Ensure sheet is publicly accessible",
          "Check sheet ID and permissions"
        ],
        recentLeads: [
          { name: "Demo Customer", email: "demo@example.com", phone_number: "9999999999", query: "Interested in dashcam for car", queryPreview: "Interested in dashcam...", city: "Bengaluru", date: "01-01-2024", queryType: "Purchase Inquiry" }
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

  // Enhanced StatCard with better styling
  const StatCard = ({ icon: Icon, title, value, subtitle, onClick, clickable = false, description, isActive = false }) => (
    <div 
      className={`bg-white p-6 rounded-xl shadow-lg border-l-4 transition-all duration-300 ${
        isActive ? 'border-blue-600 bg-blue-50 shadow-xl scale-105' :
        clickable ? 'border-blue-500 cursor-pointer hover:shadow-xl hover:scale-105 hover:border-blue-600' : 'border-blue-500'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold mb-2 ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mb-2">{subtitle}</p>}
          {description && <p className="text-xs text-blue-600 font-medium">{description}</p>}
          {clickable && (
            <div className="mt-3 text-xs text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded-full inline-block">
              👆 Click to filter
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className={`p-3 rounded-full ${isActive ? 'bg-blue-600' : 'bg-blue-100'}`}>
            <Icon className={`h-8 w-8 ${isActive ? 'text-white' : 'text-blue-600'}`} />
          </div>
        </div>
      </div>
    </div>
  );

  const handleQueryTypeClick = (queryType) => {
    setSelectedQueryType(selectedQueryType === queryType.type ? null : queryType.type);
  };

  const handleCityClick = (data) => {
    setSelectedCity(selectedCity === data.name ? null : data.name);
  };

  const handlePurchaseInquiriesClick = () => {
    const purchaseInquiry = dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry');
    if (purchaseInquiry) {
      setSelectedQueryType(selectedQueryType === 'Purchase Inquiry' ? null : 'Purchase Inquiry');
    }
  };

  const handleGeographicReachClick = () => {
    setActiveTab('all-cities');
  };

  const handleAllResponsesClick = () => {
    setSelectedQueryType(null);
    setSelectedCity(null);
    setCurrentPage(1);
  };

  const handleQueryClick = (query) => {
    setSelectedQuery(query);
    setShowQueryModal(true);
  };

  // Enhanced Query Modal Component
  const QueryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
            Customer Query Details
          </h3>
          <button
            onClick={() => setShowQueryModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
              "{selectedQuery}"
            </p>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 This is a real customer inquiry from your website contact form. Consider following up for better conversion.
            </p>
          </div>
        </div>
        <div className="flex justify-end p-6 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={() => setShowQueryModal(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-700 font-semibold">Loading Live Customer Data...</p>
          <p className="text-sm text-gray-500 mt-2">Processing and validating queries from your Google Sheet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Cautio Website Analytics
            </h1>
            <p className="text-gray-600 text-lg">{dashboardData.timeRange}</p>
          </div>
          <button
            onClick={fetchLiveData}
            disabled={loading}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Refresh Data</span>
          </button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            Last updated: {lastUpdated}
          </p>
        )}
      </div>

      {/* Enhanced Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'all-cities', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-2 border-b-2 font-semibold text-sm transition-all ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all-cities' ? 'All Cities' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Enhanced Filters */}
      {(selectedQueryType || selectedCity) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {selectedQueryType && (
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                  📊 {selectedQueryType}
                </span>
              )}
              {selectedCity && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                  📍 {selectedCity}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedQueryType(null);
                setSelectedCity(null);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 hover:bg-white rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={Users} 
              title="Total Valid Responses" 
              value={dashboardData.totalResponses} 
              subtitle="Verified customer inquiries" 
              description="Click to view all customer data"
              onClick={handleAllResponsesClick}
              clickable={true}
              isActive={!selectedQueryType && !selectedCity}
            />
            <StatCard 
              icon={ShoppingCart} 
              title="Purchase Inquiries" 
              value={dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.count || 0}
              subtitle={`${dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.percentage || 0}% ready to buy`}
              description="Filter by purchase intent"
              onClick={handlePurchaseInquiriesClick}
              clickable={true}
              isActive={selectedQueryType === 'Purchase Inquiry'}
            />
            <StatCard 
              icon={Globe} 
              title="Geographic Reach" 
              value={`${dashboardData.allCities.length} Cities`} 
              subtitle={`${dashboardData.topCities[0]?.name || 'N/A'} leads (${dashboardData.topCities[0]?.count || 0})`}
              description="View geographic distribution"
              onClick={handleGeographicReachClick}
              clickable={true}
              isActive={activeTab === 'all-cities'}
            />
          </div>

          {/* Geographic Visualization */}
          {dashboardData.geoData && dashboardData.geoData.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Globe className="h-6 w-6 mr-2 text-blue-600" />
                Geographic Distribution Map
              </h3>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  🌍 <strong>Interactive Map:</strong> Each point represents a city with customer responses. Size indicates response volume.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={dashboardData.geoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="x" 
                    type="number"
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Longitude', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="y" 
                    type="number"
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Latitude', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (name === 'count') return [`${value} responses`, 'Customer Count'];
                      return [value, name];
                    }}
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        return `City: ${payload[0].payload.city}`;
                      }
                      return '';
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Scatter 
                    dataKey="count" 
                    fill="#3B82F6"
                    onClick={(data) => handleCityClick({name: data.city})}
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-gray-600">
                Click on any point to filter customer leads by that city
              </div>
            </div>
          )}

          {/* Enhanced Monthly Trend */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
                Monthly Response Trends
              </h3>
              <div className="text-sm text-gray-500">
                12-month analysis
              </div>
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
                  label={{ value: 'Responses', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} inquiries`, 'Customer Responses']}
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Enhanced Customer Leads Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-xl font-semibold flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-600" />
                Customer Leads Database
                {(selectedQueryType || selectedCity) && (
                  <span className="ml-3 text-sm text-gray-500 bg-yellow-100 px-3 py-1 rounded-full">
                    Filtered Results
                  </span>
                )}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Customer Name</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Contact Email</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Phone Number</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Customer Query</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Location</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Date</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredLeads = dashboardData.recentLeads.filter(lead => 
                      (!selectedCity || lead.city === selectedCity) &&
                      (!selectedQueryType || lead.queryType === selectedQueryType)
                    );
                    
                    const startIndex = (currentPage - 1) * leadsPerPage;
                    const endIndex = startIndex + leadsPerPage;
                    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
                    
                    return (
                      <>
                        {paginatedLeads.map((lead, index) => (
                          <tr key={startIndex + index} className="border-b hover:bg-blue-50 transition-colors duration-200">
                            <td className="py-4 px-4">
                              <div className="font-semibold text-gray-900">{lead.name}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-blue-600 text-sm font-medium">{lead.email}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-gray-600 text-sm font-mono">{lead.phone_number}</div>
                            </td>
                            <td className="py-4 px-4 max-w-xs">
                              <div className="flex items-center space-x-3">
                                <span className="flex-1 text-gray-700 text-sm leading-relaxed">{lead.queryPreview}</span>
                                {lead.query && lead.query !== 'N/A' && (
                                  <button
                                    onClick={() => handleQueryClick(lead.query)}
                                    className="text-blue-600 hover:text-blue-800 flex-shrink-0 p-2 hover:bg-blue-100 rounded-full transition-colors"
                                    title="View full query"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-gray-600 text-sm">
                                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                {lead.city}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-600 text-sm">{lead.date}</td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                lead.queryType === 'Purchase Inquiry' ? 'bg-green-100 text-green-800' :
                                lead.queryType === 'Business Partnership' ? 'bg-blue-100 text-blue-800' :
                                lead.queryType === 'Job/Internship' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lead.queryType}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {paginatedLeads.length === 0 && (
                          <tr>
                            <td colSpan="7" className="py-12 px-4 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <Users className="h-12 w-12 text-gray-300 mb-4" />
                                <p className="text-lg font-medium">No leads found</p>
                                <p className="text-sm">Try adjusting your filters or check back later</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Enhanced Pagination */}
            {(() => {
              const filteredLeads = dashboardData.recentLeads.filter(lead => 
                (!selectedCity || lead.city === selectedCity) &&
                (!selectedQueryType || lead.queryType === selectedQueryType)
              );
              const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
              
              if (totalPages <= 1) return null;
              
              return (
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700 font-medium">
                    Showing {Math.min((currentPage - 1) * leadsPerPage + 1, filteredLeads.length)} to {Math.min(currentPage * leadsPerPage, filteredLeads.length)} of {filteredLeads.length} customer leads
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
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
                              className={`px-4 py-2 text-sm border rounded-lg transition-colors font-medium ${
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
                      className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
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
          {/* Enhanced All Cities Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-blue-600" />
              Complete Geographic Analysis - {dashboardData.allCities.length} Cities
            </h3>
            
            {/* Cities Grid with enhanced styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {dashboardData.allCities.map((city, index) => (
                <div 
                  key={city.name}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                    selectedCity === city.name 
                      ? 'bg-blue-50 border-blue-500 shadow-lg scale-105' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-102'
                  }`}
                  onClick={() => handleCityClick(city)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 text-lg">{city.name}</h4>
                    {index < 3 && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{city.count}</p>
                  <p className="text-sm text-gray-600 mb-3">{city.percentage}% of total responses</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${city.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Cities Bar Chart */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Complete Geographic Distribution</h4>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart 
                  data={dashboardData.allCities} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} responses (${props.payload.percentage}%)`, 
                      'Customer Inquiries'
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3B82F6"
                    onClick={handleCityClick}
                    cursor="pointer"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Enhanced City Statistics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-6 rounded-xl text-center border border-blue-200">
                <div className="font-bold text-blue-600 mb-2">Total Cities</div>
                <div className="text-3xl font-bold text-blue-800">{dashboardData.allCities.length}</div>
                <div className="text-xs text-blue-600 mt-1">Geographic reach</div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl text-center border border-green-200">
                <div className="font-bold text-green-600 mb-2">Top 3 Cities</div>
                <div className="text-3xl font-bold text-green-800">
                  {dashboardData.allCities.slice(0, 3).reduce((sum, city) => sum + city.percentage, 0)}%
                </div>
                <div className="text-xs text-green-600 mt-1">Market concentration</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl text-center border border-purple-200">
                <div className="font-bold text-purple-600 mb-2">Leading City</div>
                <div className="text-3xl font-bold text-purple-800">{dashboardData.allCities[0]?.count || 0}</div>
                <div className="text-xs text-purple-600 mt-1">{dashboardData.allCities[0]?.name || 'N/A'}</div>
              </div>
              <div className="bg-orange-50 p-6 rounded-xl text-center border border-orange-200">
                <div className="font-bold text-orange-600 mb-2">Average</div>
                <div className="text-3xl font-bold text-orange-800">
                  {Math.round(dashboardData.allCities.reduce((sum, city) => sum + city.count, 0) / dashboardData.allCities.length)}
                </div>
                <div className="text-xs text-orange-600 mt-1">Per city</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Enhanced Key Insights */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">💡 Key Business Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Query Modal */}
      {showQueryModal && <QueryModal />}
    </div>
  );
}
