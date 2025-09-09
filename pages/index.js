import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
      });
      if (row.name && row.name !== '') {
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
      if (city !== 'Unknown' && city !== '') {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
    });

    const topCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalResponses) * 100)
      }));

    // Query type analysis
    const queryCategories = {
      'Purchase Inquiry': ['buy', 'purchase', 'price', 'cost', 'order', 'single unit', 'dashcam', 'want to buy'],
      'Business Partnership': ['partnership', 'collaboration', 'distribution', 'dealer', 'resell', 'business'],
      'Job/Internship': ['job', 'internship', 'career', 'vacancy', 'hiring', 'software', 'developer', 'opportunity'],
      'Investment/Funding': ['funding', 'investment', 'venture', 'capital', 'vc', 'investor'],
      'Vendor/Supplier': ['vendor', 'supplier', 'fabrication', 'components', 'services']
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
      
      if (!categorized) {
        queryTypes[5].count++; // Others
      }
    });

    // High value leads
    const highValueLeads = rawData
      .filter(row => {
        const query = (row.query || '').toLowerCase();
        return query.includes('fleet') || query.includes('vehicle') || 
               query.includes('commercial') || query.includes('business') ||
               query.includes('partnership') || query.includes('investment');
      })
      .slice(0, 10)
      .map(row => ({
        name: row.name || 'N/A',
        company: row.query ? row.query.substring(0, 60) + '...' : 'N/A',
        type: row.query && row.query.toLowerCase().includes('fleet') ? 'B2B Fleet' : 
              row.query && row.query.toLowerCase().includes('investment') ? 'Investment' : 'B2B Partner',
        priority: 'High'
      }));

    return {
      totalResponses,
      timeRange: "Live Data from Google Sheets",
      topCities,
      queryTypes: queryTypes.filter(qt => qt.count > 0),
      keyInsights: [
        `${totalResponses} total responses received`,
        `${topCities[0]?.name || 'N/A'} is the top city with ${topCities[0]?.count || 0} responses`,
        `${queryTypes[0]?.count || 0} purchase inquiries show strong buying intent`,
        `${highValueLeads.length} high-value B2B leads identified`
      ],
      recentHighValueLeads: highValueLeads.length > 0 ? highValueLeads : [
        { name: "No leads found", company: "Check data", type: "N/A", priority: "Low" }
      ]
    };
  };

  // Fetch live data from Google Sheets
  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const response = await fetch(SHEET_CONFIG.csvUrl);
      const csvText = await response.text();
      const rawData = parseCSVData(csvText);
      const analyzedData = analyzeData(rawData);
      setDashboardData(analyzedData);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback data
      setDashboardData({
        totalResponses: "Error",
        timeRange: "Unable to fetch live data",
        topCities: [{ name: "Bengaluru", count: 32, percentage: 32 }],
        queryTypes: [{ type: "Purchase Inquiry", count: 45, color: "#3B82F6" }],
        keyInsights: ["Make Google Sheet public to see live data"],
        recentHighValueLeads: [{ name: "Data Error", company: "Check sheet access", type: "Error", priority: "High" }]
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, subtitle, icon: Icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
    </div>
  );

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <head>
        <title>Cautio Analytics Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Cautio Live Analytics</h1>
            <p className="text-gray-600">📊 {dashboardData.timeRange}</p>
          </div>
          <button
            onClick={fetchLiveData}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">Last updated: {lastUpdated}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Users} title="Total Responses" value={dashboardData.totalResponses} subtitle="Live from Sheets" />
        <StatCard icon={MessageSquare} title="Top City" value={dashboardData.topCities[0]?.name || 'N/A'} subtitle={`${dashboardData.topCities[0]?.count || 0} responses`} />
        <StatCard icon={Globe} title="Query Types" value={dashboardData.queryTypes.length} subtitle="Categories found" />
        <StatCard icon={TrendingUp} title="High Value Leads" value={dashboardData.recentHighValueLeads.length} subtitle="B2B opportunities" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Query Types */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">📊 Inquiry Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.queryTypes}
                cx="50%"
                cy="50%"
                outerRadius={100}
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

        {/* Top Cities */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">🏙️ Top Cities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.topCities}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High Value Leads */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">🎯 High-Value Leads</h3>
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

      {/* Key Insights */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">💡 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardData.keyInsights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <span className="text-sm">{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
