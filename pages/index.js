import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, ComposedChart, ScatterChart, Scatter } from 'recharts';
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

  const sourceSheetId = '1nQgbSdaZcwjPKciPCb_UW-J1iSBAVVMc8vEsSme2ip8';

  const isFakeEmail = (email) => {
    const cleanEmail = (email || '').trim().toLowerCase().replace(/"/g, '');
    const fakeEmails = [
      'faudev@fattudev.in',
      'fattudev@fattudev.in',
      'test@test.com',
      'example@example.com',
      'rohit@cautio.in'
    ];
    
    if (fakeEmails.includes(cleanEmail)) return true;
    if (cleanEmail.includes('test') || cleanEmail.includes('fake') || cleanEmail.includes('spam')) return true;
    if (!cleanEmail || cleanEmail === '' || !cleanEmail.includes('@')) return true;
    
    return false;
  };

  const isValidQuery = (query) => {
    if (!query || typeof query !== 'string') return false;
    
    const cleanQuery = query.trim();
    
    // Must be at least 8 characters
    if (cleanQuery.length < 8) return false;
    
    // Block obvious system/test data
    const invalidPatterns = [
      /^test\s*$/i,
      /^testing\s*$/i,
      /^hello\s*$/i,
      /^hi\s*$/i,
      /^#ERROR!/i,
      /^Private\s*$/i,
      /^English\s*$/i,
      /^\d+\s*$/,
      /^[b-z]{3,}\s+[a-z]{2,}\s+[a-z]{3,}/i, // Pattern like "Bbdnbdh de djndbvf"
      /^\*{10,}/, // Multiple asterisks
      /^[^aeiou\s]{6,}/i, // Too many consonants without vowels (gibberish)
      /^Fast\s+hgfajjgvbjew/i, // Specific pattern from screenshot
      /^Ch\s+dhhd\s+hdhvbdhh/i, // Another specific pattern
    ];
    
    // Block queries that are mostly consonants (gibberish detection)
    const vowels = (cleanQuery.match(/[aeiou]/gi) || []).length;
    const consonants = (cleanQuery.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
    if (consonants > vowels * 3 && consonants > 10) {
      return false;
    }
    
    // Only reject clear system/gibberish data
    for (const pattern of invalidPatterns) {
      if (pattern.test(cleanQuery)) {
        return false;
      }
    }
    
    return true;
  };

  const parseDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return null;
    
    try {
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0]) - 1;
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          return new Date(year, month, day);
        }
      }
      
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    
    const date = typeof dateInput === 'string' ? parseDate(dateInput) : dateInput;
    if (!date || isNaN(date.getTime())) return 'N/A';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const cityCoordinates = {
    'Bengaluru': { lat: 12.9716, lng: 77.5946, region: 'South' },
    'Bangalore': { lat: 12.9716, lng: 77.5946, region: 'South' },
    'Mumbai': { lat: 19.0760, lng: 72.8777, region: 'West' },
    'Delhi': { lat: 28.7041, lng: 77.1025, region: 'North' },
    'Hyderabad': { lat: 17.3850, lng: 78.4867, region: 'South' },
    'Chennai': { lat: 13.0827, lng: 80.2707, region: 'South' },
    'Kolkata': { lat: 22.5726, lng: 88.3639, region: 'East' },
    'Pune': { lat: 18.5204, lng: 73.8567, region: 'West' },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714, region: 'West' },
    'Jaipur': { lat: 26.9124, lng: 75.7873, region: 'North' },
    'Surat': { lat: 21.1702, lng: 72.8311, region: 'West' },
    'Lucknow': { lat: 26.8467, lng: 80.9462, region: 'North' },
    'Kanpur': { lat: 26.4499, lng: 80.3319, region: 'North' },
    'Nagpur': { lat: 21.1458, lng: 79.0882, region: 'Central' },
    'Indore': { lat: 22.7196, lng: 75.8577, region: 'Central' },
    'Thane': { lat: 19.2183, lng: 72.9781, region: 'West' },
    'Bhopal': { lat: 23.2599, lng: 77.4126, region: 'Central' },
    'Visakhapatnam': { lat: 17.6868, lng: 83.2185, region: 'South' },
    'Pimpri': { lat: 18.6298, lng: 73.7997, region: 'West' },
    'Patna': { lat: 25.5941, lng: 85.1376, region: 'East' }
  };

  const analyzeData = (rawData) => {
    const totalResponses = rawData.length;
    
    console.log('📊 Analyzing', totalResponses, 'responses after filtering');
    
    const cityCount = {};
    const totalResponsesWithValidCities = rawData.filter(row => {
      const city = (row.city || '').trim();
      return city && city.length > 2 && 
             city !== 'English' && 
             city !== 'language' &&
             city !== 'N/A' &&
             !city.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && 
             /^[a-zA-Z\s\-\.]+$/.test(city);
    });

    totalResponsesWithValidCities.forEach(row => {
      const city = (row.city || '').trim();
      cityCount[city] = (cityCount[city] || 0) + 1;
    });

    const cityData = [];
    Object.entries(cityCount).forEach(([city, count]) => {
      const coords = cityCoordinates[city] || { lat: 20 + Math.random() * 10, lng: 75 + Math.random() * 10, region: 'Other' };
      cityData.push({
        name: city,
        count,
        percentage: Math.round((count / totalResponses) * 100),
        lat: coords.lat,
        lng: coords.lng,
        region: coords.region,
        size: Math.max(8, Math.min(50, count * 3))
      });
    });

    const topCities = cityData
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const allCities = cityData.sort((a, b) => b.count - a.count);

    const responsesWithoutCity = totalResponses - totalResponsesWithValidCities.length;
    if (responsesWithoutCity > 0) {
      topCities.push({
        name: 'Other Locations',
        count: responsesWithoutCity,
        percentage: Math.round((responsesWithoutCity / totalResponses) * 100),
        lat: 0,
        lng: 0,
        region: 'Unknown',
        size: Math.max(8, Math.min(50, responsesWithoutCity * 3))
      });
    }

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

    const queryCategories = {
      'Purchase Inquiry': ['buy', 'purchase', 'price', 'dashcam', 'dash cam', 'cost', 'order', 'enquire', 'inquiry', 'interested', 'single unit', 'looking to buy', 'required', 'need dashcam', 'want to buy', 'looking for', 'personal use'],
      'Business Partnership': ['partnership', 'business', 'collaboration', 'distribution', 'dealer', 'distributor', 'franchise', 'exhibiting', 'rental', 'fleet', 'platform'],
      'Job/Internship': ['job', 'internship', 'career', 'hiring', 'opportunity', 'work', 'hr team', 'employment', 'kia carens', 'gravity', 'device'],
      'Investment/Funding': ['funding', 'investment', 'venture', 'capital', 'investor'],
      'Technical Support': ['support', 'help', 'issue', 'problem', 'technical', 'installation', 'surveillance', 'hospital', 'solution'],
      'Fleet Management': ['fleet', 'rental', 'platform', '3000 car', 'multiple', 'commercial'],
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
        queryTypes[queryTypes.length - 1].count++;
      }
    });

    queryTypes.forEach(qt => {
      qt.percentage = totalResponses > 0 ? Math.round((qt.count / totalResponses) * 100) : 0;
    });

    const monthlyData = {};
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { 
        month: monthLabel,
        responses: 0,
        monthKey 
      };
    }
    
    rawData.forEach(row => {
      const date = parseDate(row.timestamp);
      if (date && !isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].responses++;
        }
      }
    });

    const monthlyTrend = Object.values(monthlyData).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    const allLeads = rawData
      .filter(row => isValidQuery(row.query))
      .map(row => {
        const timestamp = parseDate(row.timestamp) || new Date(0);
        return {
          name: row.name || 'N/A',
          email: row.email || 'N/A',
          phone_number: row.phone_number || 'N/A',
          query: row.query || 'N/A',
          queryPreview: row.query ? (row.query.length > 50 ? row.query.substring(0, 50) + '...' : row.query) : 'N/A',
          city: row.city || 'N/A',
          date: formatDate(timestamp),
          timestamp: timestamp,
          sortDate: timestamp.getTime(),
          queryType: (() => {
            const query = (row.query || '').toLowerCase();
            for (const [category, keywords] of Object.entries(queryCategories)) {
              if (keywords.some(keyword => query.includes(keyword))) {
                return category;
              }
            }
            return 'Others';
          })()
        };
      })
      .sort((a, b) => b.sortDate - a.sortDate);

    console.log('✅ Analysis complete:');
    console.log('- Valid customer responses:', allLeads.length);
    console.log('- Cities mapped:', topCities.length);
    console.log('- Monthly data points:', monthlyTrend.length);

    return {
      totalResponses: allLeads.length,
      originalTotal: totalResponses,
      timeRange: `Live Customer Analytics Dashboard (${allLeads.length} verified responses)`,
      topCities,
      allCities,
      cityMapData: cityData,
      queryTypes: queryTypes.filter(qt => qt.count > 0),
      monthlyTrend,
      countries,
      keyInsights: [
        `${allLeads.length} validated customer responses with quality queries`,
        `${topCities[0]?.name || 'N/A'} leads with ${topCities[0]?.count || 0} responses (${topCities[0]?.percentage || 0}%)`,
        `${queryTypes[0]?.count || 0} purchase inquiries showing buying intent`,
        `${countries.length} countries with ${topCities.length} major cities covered`,
        `${monthlyTrend.slice(-3).reduce((sum, m) => sum + m.responses, 0)} responses in recent quarter`,
        `Advanced filtering ensures only meaningful customer inquiries`,
        `Real-time dashboard with live data updates every 5 minutes`,
        `Geographic reach spans ${allCities.length} cities across India`
      ],
      recentLeads: allLeads.length > 0 ? allLeads : []
    };
  };

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
      
      const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());
      console.log('📋 Headers detected:', headers);
      
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
        
        const name = (row.name || '').trim();
        const email = (row.email || '').trim();
        const query = (row.query || '').trim();
        
        if (!name || name.length <= 2 || name.toLowerCase() === 'name') continue;
        if (isFakeEmail(email)) continue;
        if (!isValidQuery(query)) {
          console.log('🚫 Skipped invalid query:', query.substring(0, 50));
          continue;
        }
        
        row.name = name;
        row.email = email;
        row.query = query;
        row.city = (row.city || '').trim();
        row.phone_number = (row.phone_number || '').trim();
        
        rawData.push(row);
        validAdded++;
      }
      
      console.log('📈 Processing Complete:');
      console.log('- Rows processed:', totalProcessed);
      console.log('- Valid entries:', validAdded);
      console.log('🎯 FINAL COUNT:', rawData.length);
      
      if (rawData.length === 0) {
        throw new Error('No valid customer data found');
      }
      
      const analyzedData = analyzeData(rawData);
      setDashboardData(analyzedData);
      setLastUpdated(new Date().toLocaleString());
      
    } catch (error) {
      console.error('❌ Error:', error);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const demoMonthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const responses = i < 3 ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 8);
        demoMonthlyTrend.push({
          month: monthLabel,
          responses,
          monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        });
      }
      
      setDashboardData({
        totalResponses: 0,
        timeRange: "Unable to fetch live data - Demo Mode",
        topCities: [
          { name: "Bengaluru", count: 45, percentage: 35, lat: 12.9716, lng: 77.5946, region: 'South', size: 30 },
          { name: "Mumbai", count: 18, percentage: 14, lat: 19.0760, lng: 72.8777, region: 'West', size: 20 }
        ],
        allCities: [
          { name: "Bengaluru", count: 45, percentage: 35 },
          { name: "Mumbai", count: 18, percentage: 14 }
        ],
        cityMapData: [
          { name: "Bengaluru", count: 45, lat: 12.9716, lng: 77.5946, region: 'South', size: 30 },
          { name: "Mumbai", count: 18, lat: 19.0760, lng: 72.8777, region: 'West', size: 20 }
        ],
        queryTypes: [
          { type: "Purchase Inquiry", count: 25, percentage: 62, color: "#3B82F6" },
          { type: "Business Partnership", count: 10, percentage: 25, color: "#10B981" }
        ],
        monthlyTrend: demoMonthlyTrend,
        countries: [
          { name: "India", count: 40, percentage: 95, flag: "🇮🇳" }
        ],
        keyInsights: [
          "Demo mode - Please check Google Sheets access",
          "Ensure sheet is publicly accessible",
          "Verify sheet ID and data format"
        ],
        recentLeads: [
          { 
            name: "Demo Customer", 
            email: "demo@example.com", 
            phone_number: "9999999999", 
            query: "Interested in dashcam for my car. Can you please share pricing details?", 
            queryPreview: "Interested in dashcam for my car...", 
            city: "Bengaluru", 
            date: "01-11-2024", 
            queryType: "Purchase Inquiry",
            timestamp: new Date(),
            sortDate: Date.now()
          }
        ]
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedQueryType, selectedCity]);

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

  const QueryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg font-medium">
              "{selectedQuery}"
            </p>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 This is a verified customer inquiry. Consider following up for better conversion rates.
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-2xl text-gray-700 font-bold">Loading Customer Analytics...</p>
          <p className="text-sm text-gray-500 mt-2">Processing live data from Google Sheets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Cautio Analytics Dashboard
            </h1>
            <p className="text-gray-600 text-xl">{dashboardData.timeRange}</p>
          </div>
          <button
            onClick={fetchLiveData}
            disabled={loading}
            className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-semibold">Refresh Data</span>
          </button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-3 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            Last updated: {lastUpdated}
          </p>
        )}
      </div>

      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'all-cities', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-4 border-b-2 font-bold text-sm transition-all ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all-cities' ? 'All Cities' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {(selectedQueryType || selectedCity) && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold text-gray-700">🔍 Active Filters:</span>
              {selectedQueryType && (
                <span className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold shadow-md">
                  📊 {selectedQueryType}
                </span>
              )}
              {selectedCity && (
                <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold shadow-md">
                  📍 {selectedCity}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedQueryType(null);
                setSelectedCity(null);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-bold px-4 py-2 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              Clear All Filters ✕
            </button>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={Users} 
              title="Total Customer Responses" 
              value={dashboardData.totalResponses} 
              subtitle="Verified quality inquiries" 
              description="Click to view all customer data"
              onClick={handleAllResponsesClick}
              clickable={true}
              isActive={!selectedQueryType && !selectedCity}
            />
            <StatCard 
              icon={ShoppingCart} 
              title="Purchase Inquiries" 
              value={dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.count || 0}
              subtitle={`${dashboardData.queryTypes.find(qt => qt.type === 'Purchase Inquiry')?.percentage || 0}% ready-to-buy customers`}
              description="Filter by purchase intent"
              onClick={handlePurchaseInquiriesClick}
              clickable={true}
              isActive={selectedQueryType === 'Purchase Inquiry'}
            />
            <StatCard 
              icon={Globe} 
              title="Geographic Coverage" 
              value={`${dashboardData.allCities.length} Cities`} 
              subtitle={`Leading: ${dashboardData.topCities[0]?.name || 'N/A'} (${dashboardData.topCities[0]?.count || 0})`}
              description="Explore geographic distribution"
              onClick={handleGeographicReachClick}
              clickable={true}
              isActive={activeTab === 'all-cities'}
            />
          </div>



          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center">
                <TrendingUp className="h-7 w-7 mr-3 text-green-600" />
                Monthly Response Trends
              </h3>
              <div className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                📈 12-month analysis
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <p className="text-sm text-green-700 font-medium">
                📊 <strong>Trend Analytics:</strong> Track monthly customer inquiry patterns to identify growth trends, seasonal variations, and peak business periods.
              </p>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={dashboardData.monthlyTrend}>
                <defs>
                  <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  label={{ value: 'Customer Responses', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontWeight: 'bold' } }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} customer inquiries`, 'Monthly Responses']}
                  labelFormatter={(label) => `📅 ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="responses" 
                  stroke="#10b981" 
                  fill="url(#monthlyGradient)"
                  strokeWidth={4}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center border-2 border-blue-200">
                <div className="font-bold text-blue-600 mb-1">Total (12 months)</div>
                <div className="text-2xl font-bold text-blue-800">
                  {dashboardData.monthlyTrend.reduce((sum, m) => sum + m.responses, 0)}
                </div>
                <div className="text-xs text-blue-600">Customer responses</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center border-2 border-green-200">
                <div className="font-bold text-green-600 mb-1">Recent Quarter</div>
                <div className="text-2xl font-bold text-green-800">
                  {dashboardData.monthlyTrend.slice(-3).reduce((sum, m) => sum + m.responses, 0)}
                </div>
                <div className="text-xs text-green-600">Last 3 months</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl text-center border-2 border-purple-200">
                <div className="font-bold text-purple-600 mb-1">Peak Month</div>
                <div className="text-2xl font-bold text-purple-800">
                  {(() => {
                    const peakMonth = dashboardData.monthlyTrend.reduce((prev, current) => 
                      (prev.responses > current.responses) ? prev : current
                    );
                    return peakMonth.responses;
                  })()}
                </div>
                <div className="text-xs text-purple-600">
                  {(() => {
                    const peakMonth = dashboardData.monthlyTrend.reduce((prev, current) => 
                      (prev.responses > current.responses) ? prev : current
                    );
                    return peakMonth.month;
                  })()}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center border-2 border-orange-200">
                <div className="font-bold text-orange-600 mb-1">Monthly Average</div>
                <div className="text-2xl font-bold text-orange-800">
                  {Math.round(dashboardData.monthlyTrend.reduce((sum, m) => sum + m.responses, 0) / 12)}
                </div>
                <div className="text-xs text-orange-600">Average per month</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="p-8 border-b bg-gradient-to-r from-gray-50 to-blue-50">
              <h3 className="text-2xl font-bold flex items-center">
                <Users className="h-7 w-7 mr-3 text-blue-600" />
                Customer Leads Database
                {(selectedQueryType || selectedCity) && (
                  <span className="ml-4 text-sm text-orange-600 bg-yellow-100 px-4 py-2 rounded-full font-bold border-2 border-yellow-300">
                    🔍 Filtered Results
                  </span>
                )}
              </h3>
              <p className="text-gray-600 mt-2">Latest customer inquiries shown first • Click 👁️ to view full query</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <th className="text-left py-4 px-6 font-bold text-gray-800">Customer Name</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-800">Contact Email</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-800">Phone Number</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-800 min-w-[300px]">Customer Query</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-800">Location</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-800">Date</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-800">Type</th>
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
                          <tr key={startIndex + index} className="border-b hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                            <td className="py-5 px-6">
                              <div className="font-bold text-gray-900 text-base">{lead.name}</div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="text-blue-600 text-sm font-semibold">{lead.email}</div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="text-gray-700 text-sm font-mono bg-gray-100 px-2 py-1 rounded">{lead.phone_number}</div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <span className="text-gray-800 text-sm leading-relaxed font-medium">{lead.queryPreview}</span>
                                </div>
                                {lead.query && lead.query !== 'N/A' && (
                                  <button
                                    onClick={() => handleQueryClick(lead.query)}
                                    className="text-blue-600 hover:text-blue-800 flex-shrink-0 p-2 hover:bg-blue-100 rounded-full transition-all shadow-sm"
                                    title="View full query"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center text-gray-700 text-sm font-medium">
                                <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                                {lead.city}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="text-gray-600 text-sm font-medium bg-gray-100 px-2 py-1 rounded">{lead.date}</div>
                            </td>
                            <td className="py-5 px-6">
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                lead.queryType === 'Purchase Inquiry' ? 'bg-green-100 text-green-800 border border-green-300' :
                                lead.queryType === 'Business Partnership' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                lead.queryType === 'Job/Internship' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                'bg-gray-100 text-gray-800 border border-gray-300'
                              }`}>
                                {lead.queryType}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {paginatedLeads.length === 0 && (
                          <tr>
                            <td colSpan="7" className="py-16 px-6 text-center">
                              <div className="flex flex-col items-center">
                                <Users className="h-16 w-16 text-gray-300 mb-6" />
                                <p className="text-xl font-bold text-gray-500 mb-2">No Customer Leads Found</p>
                                <p className="text-sm text-gray-400">Try adjusting your filters or check back later for new inquiries</p>
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
            
            {(() => {
              const filteredLeads = dashboardData.recentLeads.filter(lead => 
                (!selectedCity || lead.city === selectedCity) &&
                (!selectedQueryType || lead.queryType === selectedQueryType)
              );
              const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
              
              if (totalPages <= 1) return null;
              
              return (
                <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t-2 flex items-center justify-between">
                  <div className="text-sm text-gray-700 font-bold">
                    Showing <span className="text-blue-600">{Math.min((currentPage - 1) * leadsPerPage + 1, filteredLeads.length)}</span> to <span className="text-blue-600">{Math.min(currentPage * leadsPerPage, filteredLeads.length)}</span> of <span className="text-blue-600">{filteredLeads.length}</span> customer leads
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm border-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 transition-colors font-bold shadow-sm"
                    >
                      ← Previous
                    </button>
                    <div className="flex space-x-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 text-sm border-2 rounded-lg transition-colors font-bold shadow-sm ${
                                currentPage === page 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'hover:bg-blue-50 border-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 3 || page === currentPage + 3) {
                          return <span key={page} className="px-2 text-gray-400 font-bold">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm border-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 transition-colors font-bold shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'all-cities' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h3 className="text-2xl font-bold mb-8 flex items-center">
              <MapPin className="h-7 w-7 mr-3 text-blue-600" />
              Complete Geographic Analysis - {dashboardData.allCities.length} Cities Covered
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {dashboardData.allCities.map((city, index) => (
                <div 
                  key={city.name}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                    selectedCity === city.name 
                      ? 'bg-blue-50 border-blue-500 shadow-xl scale-105' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-102'
                  }`}
                  onClick={() => handleCityClick(city)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900 text-lg">{city.name}</h4>
                    {index < 3 && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-500'
                      }`}>
                        #{index + 1}
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-3">{city.count}</p>
                  <p className="text-sm text-gray-600 mb-4">{city.percentage}% of total responses</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${city.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <h4 className="text-xl font-bold mb-6">Complete Geographic Distribution</h4>
              <ResponsiveContainer width="100%" height={600}>
                <BarChart 
                  data={dashboardData.allCities} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                    angle={-45}
                    textAnchor="end"
                    height={140}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fontWeight: 'bold' }}
                    label={{ value: 'Customer Responses', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontWeight: 'bold' } }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} responses (${props.payload.percentage}%)`, 
                      'Customer Inquiries'
                    ]}
                    labelFormatter={(label) => `📍 ${label}`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontWeight: 'bold'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6"
                    onClick={handleCityClick}
                    cursor="pointer"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl text-center border-2 border-blue-200 shadow-md">
                <div className="font-bold text-blue-600 mb-2 text-lg">Total Cities</div>
                <div className="text-4xl font-bold text-blue-800">{dashboardData.allCities.length}</div>
                <div className="text-xs text-blue-600 mt-2 font-medium">Geographic coverage</div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl text-center border-2 border-green-200 shadow-md">
                <div className="font-bold text-green-600 mb-2 text-lg">Top 3 Cities</div>
                <div className="text-4xl font-bold text-green-800">
                  {dashboardData.allCities.slice(0, 3).reduce((sum, city) => sum + city.percentage, 0)}%
                </div>
                <div className="text-xs text-green-600 mt-2 font-medium">Market concentration</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl text-center border-2 border-purple-200 shadow-md">
                <div className="font-bold text-purple-600 mb-2 text-lg">Leading City</div>
                <div className="text-4xl font-bold text-purple-800">{dashboardData.allCities[0]?.count || 0}</div>
                <div className="text-xs text-purple-600 mt-2 font-medium">{dashboardData.allCities[0]?.name || 'N/A'}</div>
              </div>
              <div className="bg-orange-50 p-6 rounded-xl text-center border-2 border-orange-200 shadow-md">
                <div className="font-bold text-orange-600 mb-2 text-lg">Average</div>
                <div className="text-4xl font-bold text-orange-800">
                  {Math.round(dashboardData.allCities.reduce((sum, city) => sum + city.count, 0) / dashboardData.allCities.length)}
                </div>
                <div className="text-xs text-orange-600 mt-2 font-medium">Per city</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h3 className="text-2xl font-bold mb-6">💡 Strategic Business Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardData.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
                  <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-800 leading-relaxed">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showQueryModal && <QueryModal />}
    </div>
  );
}
