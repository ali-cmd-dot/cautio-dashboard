import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Users, MessageSquare, Globe, TrendingUp, RefreshCw, CheckCircle } from 'lucide-react';

export default function CautioDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Google Sheet Configuration
  const SHEET_CONFIG = {
    sheetId: '1nQgbSdaZcwjPKciPCb_UW-J1iSBAVVMc8vEsSme2ip8',
    csvUrl: 'https://docs.google.com/spreadsheets/d/1nQgbSdaZcwjPKciPCb_UW-J1iSBAVVMc8vEsSme2ip8/export?format=csv&gid=0'
  };

  // Parse CSV data function
  const parseCSVData = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Handle complex CSV parsing
    const data = [];
    const headers = ['name', 'email', 'phone_number', 'query', 'vehicle_type', 'timestamp', 'language', 'ip_address', 'city', 'country'];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const row = {};
      
      // Simple CSV parsing for this specific format
      const values = line.split(',');
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
      });
      
      if (row.name && row.name !== '' && row.name !== 'name') {
        data.push(row);
      }
    }
    return data;
  };

  // Analyze data and create dashboard metrics
  const analyzeData = (rawData) => {
    const totalResponses = rawData.length;
    
    // City analysis
    const cityCount = {};
    rawData.forEach(row => {
      const city = row.city || 'Unknown';
      if (city !== 'Unknown' && city !== '' && city !== 'city') {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
    });

    const topCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, count]) => ({
        name: name.replace(/%20/g, ' '),
        count,
        percentage: Math.round((count / totalResponses) * 100)
      }));

    // Query type analysis
    const queryCategories = {
      'Purchase Inquiry': ['buy', 'purchase', 'price', 'cost', 'order', 'single unit', 'dashcam', 'want to buy', 'wish to purchase'],
      'Business Partnership': ['partnership', 'collaboration', 'distribution', 'dealer', 'resell', 'business', 'collaborate'],
      'Job/Internship': ['job', 'internship', 'career', 'vacancy', 'hiring', 'software', 'developer', 'opportunity', 'work'],
      'Investment/Funding': ['funding', 'investment', 'venture', 'capital', 'vc', 'investor', 'funds'],
      'Vendor/Supplier': ['vendor', 'supplier', 'fabrication', 'components', 'services', 'stall']
    };

    const queryTypes = [
      { type: "Purchase Inquiry", count: 0, color: "#3B82F6" },
      { type: "Business Partnership", count: 0, color: "#10B981" },
      { type: "Job/Internship", count: 0, color: "#F59E0B" },
      { type: "Investment/Funding", count: 0, color: "#EF4444" },
      { type: "Vendor/Supplier", count: 0, color: "#8B5CF6" },
      { type: "Others", count: 0, color: "#6B7280" }
    ];

    rawData.forEach(row => {
      const query = (row.query || '').toLowerCase();
      let categorized = false;
      
      Object.entries(queryCategories).forEach(([category, keywords], index) => {
        if (!categorized && keywords.some(keyword => query.includes(keyword))) {
          queryTypes[index].count++;
          categorized = true;
        }
      });
      
      if (!categorized && query.length > 0) {
        queryTypes[5].count++; // Others
      }
    });

    // Weekly trend analysis
    const weeklyData = {};
    rawData.forEach(row => {
      if (row.timestamp) {
        const date = new Date(row.timestamp);
        if (!isNaN(date.getTime())) {
          const weekKey = `${date.getMonth() + 1}/${Math.ceil(date.getDate() / 7)}`;
          weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
        }
      }
    });

    const weeklyTrend = Object.entries(weeklyData)
      .sort()
      .slice(-8)
      .map(([week, responses]) => ({ week, responses }));

    // Country analysis - STRICT VALIDATION
    const countryCount = {};
    rawData.forEach(row => {
      let country = row.country || '';
      
      // Clean country code/name
      country = country.trim();
      
      // STRICT country validation - only allow valid country codes/names
      const validCountries = ['IN', 'IT', 'SG', 'US', 'CA', 'India', 'Italy', 'Singapore', 'USA', 'Canada'];
      const isValidCountry = country && 
        country !== '' && 
        country !== 'country' &&
        country.length <= 15 &&
        !country.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && // Not IP address
        !country.match(/^\d+\.?\d*$/) && // Not numbers/coordinates
        !country.match(/^\d{1,2}:\d{1,2}:\d{1,2}$/) && // Not timestamps
        !country.match(/^-?\d+\.?\d*$/) && // Not coordinates
        !country.includes('experiment') && // Not text fragments
        !country.includes('@') && // Not email
        !country.includes('http') && // Not URL
        (validCountries.includes(country) || /^[A-Z]{2}$/.test(country) || /^[a-zA-Z\s]+$/.test(country));
      
      if (isValidCountry) {
        countryCount[country] = (countryCount[country] || 0) + 1;
      }
    });

    const countries = Object.entries(countryCount).map(([name, count]) => ({
      name: name === 'IN' ? 'India' : name === 'IT' ? 'Italy' : name === 'SG' ? 'Singapore' : 
            name === 'US' ? 'USA' : name === 'CA' ? 'Canada' : name,
      count,
      flag: name === 'IN' ? '🇮🇳' : name === 'IT' ? '🇮🇹' : name === 'SG' ? '🇸🇬' : 
            name === 'US' ? '🇺🇸' : name === 'CA' ? '🇨🇦' : '🏳️'
    }));

    console.log('Valid countries found:', Object.keys(countryCount));

    // High value leads
    const highValueLeads = rawData
      .filter(row => {
        const query = (row.query || '').toLowerCase();
        const name = (row.name || '').toLowerCase();
        return query.includes('fleet') || query.includes('vehicle') || 
               query.includes('commercial') || query.includes('business') ||
               query.includes('partnership') || query.includes('investment') ||
               name.includes('limited') || name.includes('ltd') || name.includes('company') ||
               query.includes('distributor') || query.includes('dealer') ||
               query.includes('logistics') || query.includes('transport');
      })
      .slice(0, 10)
      .map(row => ({
        name: row.name || 'N/A',
        company: row.query ? row.query.substring(0, 80) + '...' : 'N/A',
        type: row.query && row.query.toLowerCase().includes('fleet') ? 'B2B Fleet' : 
              row.query && row.query.toLowerCase().includes('investment') ? 'Investment' : 
              row.query && row.query.toLowerCase().includes('partnership') ? 'B2B Partner' : 'B2B Lead',
        priority: 'High'
      }));

    return {
      totalResponses,
      timeRange: "Live Data from Google Sheets",
      topCities,
      queryTypes: queryTypes.filter(qt => qt.count > 0),
      weeklyTrend,
      countries,
      keyInsights: [
        `${totalResponses} total responses received from website`,
        `${topCities[0]?.name || 'N/A'} is the top city with ${topCities[0]?.count || 0} responses (${topCities[0]?.percentage || 0}%)`,
        `${queryTypes[0]?.count || 0} purchase inquiries showing strong buying intent`,
        `${countries.length} countries represented in responses`,
        `${highValueLeads.length} high-value B2B leads identified`,
        "Real-time data updated every 5 minutes from Google Sheets"
      ],
      recentHighValueLeads: highValueLeads.length > 0 ? highValueLeads : [
        { name: "No B2B leads found", company: "Check data filters or add more responses", type: "N/A", priority: "Low" }
      ]
    };
  };

  // Fetch live data from Google Sheets
  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const response = await fetch(SHEET_CONFIG.csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const rawData = parseCSVData(csvText);
      
      if (rawData.length === 0) {
        throw new Error('No data found or sheet is private');
      }
      
      const analyzedData = analyzeData(rawData);
      setDashboardData(analyzedData);
      setLastUpdated(new Date().toLocaleString());
      
    } catch (error) {
      console.error('Error fetching live data:', error);
      
      // Fallback to sample data with message
      setDashboardData({
        totalResponses: "Check Sheet Access",
        timeRange: "Unable to fetch live data - using sample",
        topCities: [
          { name: "Bengaluru", count: 32, percentage: 32 },
          { name: "Hyderabad", count: 8, percentage: 8 },
          { name: "Mumbai", count: 7, percentage: 7 },
          { name: "Delhi", count: 6, percentage: 6 },
          { name: "Chennai", count: 4, percentage: 4 },
          { name: "Pune", count: 4, percentage: 4 },
          { name: "Others", count: 39, percentage: 39 }
        ],
        queryTypes: [
          { type: "Purchase Inquiry", count: 45, color: "#3B82F6" },
          { type: "Business Partnership", count: 18, color: "#10B981" },
          { type: "Job/Internship", count: 15, color: "#F59E0B" },
          { type: "Vendor/Supplier", count: 8, color: "#8B5CF6" },
          { type: "Investment/Funding", count: 6, color: "#EF4444" },
          { type: "Others", count: 8, color: "#6B7280" }
        ],
        weeklyTrend: [
          { week: "Jul 16-22", responses: 15 },
          { week: "Jul 23-29", responses: 12 },
          { week: "Jul 30-Aug 5", responses: 18 },
          { week: "Aug 6-12", responses: 14 },
          { week: "Aug 13-19", responses: 16 },
          { week: "Aug 20-26", responses: 13 },
          { week: "Aug 27-Sep 2", responses: 8 },
          { week: "Sep 3-9", responses: 4 }
        ],
        countries: [
          { name: "India", count: 96, flag: "🇮🇳" },
          { name: "Italy", count: 1, flag: "🇮🇹" },
          { name: "Singapore", count: 1, flag: "🇸🇬" },
          { name: "USA", count: 1, flag: "🇺🇸" },
          { name: "Canada", count: 1, flag: "🇨🇦" }
        ],
        keyInsights: [
          "⚠️ Unable to fetch live data from Google Sheets",
          "Please ensure the Google Sheet is public (Anyone with link can view)",
          "Current data shown is sample data for demonstration",
          "32% of inquiries from Bengaluru - major market concentration",
          "45% are direct purchase inquiries - strong buying intent",
          "18% business partnership requests - growth opportunities"
        ],
        recentHighValueLeads: [
          { name: "SUHAS SARWAD", company: "Fleet of 366 vehicles", type: "B2B Fleet", priority: "High" },
          { name: "Akhil", company: "259 EV fleets platform", type: "B2B Reseller", priority: "High" },
          { name: "Vitantonio Santoro", company: "Atlas SGR (VC Firm)", type: "Investment", priority: "High" },
          { name: "Vipul Vora", company: "Mining & Construction", type: "B2B Distributor", priority: "High" },
          { name: "Amit Jindal", company: "CJ Darcl Logistics", type: "Commercial Vehicles", priority: "Medium" }
        ]
      });
    }
    setLoading(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchLiveData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchLiveData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <Icon className={`h-8 w-8 text-blue-600`} />
      </div>
    </div>
  );

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live data from Google Sheets...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Cautio Website Analytics Dashboard</h1>
            <p className="text-gray-600">📊 {dashboardData.timeRange}</p>
          </div>
          <button
            onClick={fetchLiveData}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Live Data</span>
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
            {['overview', 'geography', 'insights'].map((tab) => (
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

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={Users} title="Total Responses" value={dashboardData.totalResponses} subtitle="Live from Google Sheets" />
            <StatCard icon={MessageSquare} title="Top City" value={dashboardData.topCities[0]?.name || 'N/A'} subtitle={`${dashboardData.topCities[0]?.count || 0} responses`} />
            <StatCard icon={Globe} title="Countries" value={dashboardData.countries.length} subtitle="Including international" />
            <StatCard icon={TrendingUp} title="Query Types" value={dashboardData.queryTypes.length} subtitle="Categories identified" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Types Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">📊 Inquiry Types Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.queryTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ type, count }) => `${type}: ${count}`}
                  >
                    {dashboardData.queryTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trend - NEW */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">📈 Monthly Response Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="responses" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Second Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Trend */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">📊 Weekly Response Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="responses" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top Cities Bar Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">🏙️ Top Cities Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.topCities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* High Value Leads */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">🎯 High-Value Leads (Priority Follow-up)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Company/Details</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentHighValueLeads.map((lead, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{lead.name}</td>
                      <td className="py-2">{lead.company}</td>
                      <td className="py-2">{lead.type}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          lead.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lead.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'geography' && (
        <div className="space-y-6">
          {/* Countries */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">🌍 Countries Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {dashboardData.countries.map((country, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">{country.flag}</div>
                  <div className="font-semibold">{country.name}</div>
                  <div className="text-sm text-gray-600">{country.count} responses</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">🏙️ Top Cities in India</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dashboardData.topCities} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Key Insights */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">💡 Key Insights & Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Report */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">📋 Executive Summary</h3>
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Positive Trends:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Strong purchase intent with 45% direct buying inquiries</li>
                  <li>Good geographic concentration in key tech cities</li>
                  <li>Multiple high-value B2B fleet inquiries</li>
                  <li>International interest including VC funding opportunity</li>
                  <li>Growing brand awareness evidenced by job applications</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Areas to Focus:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Follow up on high-value fleet leads immediately</li>
                  <li>Create dedicated B2B partnership process</li>
                  <li>Implement lead scoring to prioritize responses</li>
                  <li>Consider expanding marketing in tier-2 cities</li>
                  <li>Track response quality and conversion rates</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Immediate follow-up on fleet companies (SUHAS, Akhil, Vipul)</li>
                  <li>Schedule call with Atlas SGR for potential investment</li>
                  <li>Create separate landing pages for B2B vs B2C customers</li>
                  <li>Implement automated lead qualification process</li>
                  <li>Track geographical expansion opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
