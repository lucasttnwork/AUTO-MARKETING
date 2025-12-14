import { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';

// Landing page sections template
const landingPageSections = [
  { id: 'headline', name: 'Headline', icon: '📰', description: 'Main attention-grabbing headline' },
  { id: 'subheadline', name: 'Subheadline', icon: '📝', description: 'Supporting headline text' },
  { id: 'hero', name: 'Hero Copy', icon: '🎯', description: 'Compelling hero section copy' },
  { id: 'features', name: 'Features', icon: '✨', description: 'Key product/service features' },
  { id: 'social_proof', name: 'Social Proof', icon: '⭐', description: 'Trust signals and testimonials' },
  { id: 'cta', name: 'Call to Action', icon: '🔘', description: 'Primary and secondary CTAs' }
];

const emailTypes = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Greet new subscribers and set expectations',
    icon: '👋',
    elements: ['Greeting', 'Introduction', 'Key Benefits', 'First Steps', 'Support CTA']
  },
  {
    id: 'abandoned_cart',
    name: 'Abandoned Cart',
    description: 'Remind customers about items left in cart',
    icon: '🛒',
    elements: ['Reminder', 'Product Image', 'Urgency Element', 'Discount Offer', 'CTA Button']
  },
  {
    id: 'post_purchase',
    name: 'Post-Purchase',
    description: 'Thank customers and guide next steps',
    icon: '🎉',
    elements: ['Thank You Message', 'Order Details', 'Next Steps', 'Support Info', 'Related Products']
  },
  {
    id: 're_engagement',
    name: 'Re-engagement',
    description: 'Win back inactive subscribers',
    icon: '💫',
    elements: ['Personal Touch', 'New Features', 'Special Offer', 'Easy Return CTA']
  }
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('reports');
  const [selectedEmailType, setSelectedEmailType] = useState(null);
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [productName, setProductName] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [error, setError] = useState(null);
  const [savedEmails, setSavedEmails] = useState([]);
  const { selectedClient } = useClient();

  // Landing Page Builder State
  const [landingPageBrief, setLandingPageBrief] = useState('');
  const [landingPageCampaign, setLandingPageCampaign] = useState('');
  const [generatedLandingPage, setGeneratedLandingPage] = useState(null);
  const [isGeneratingLandingPage, setIsGeneratingLandingPage] = useState(false);
  const [landingPageError, setLandingPageError] = useState(null);

  // Report State
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    client_id: '',
    report_type: 'weekly',
    schedule_frequency: 'weekly',
    delivery_day: 'monday',
    delivery_time: '09:00'
  });

  // Investment Optimization State
  const [investmentData, setInvestmentData] = useState(null)
  const [investmentLoading, setInvestmentLoading] = useState(false)

  // Meeting Agenda State
  const [meetingAgenda, setMeetingAgenda] = useState(null);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [agendaForm, setAgendaForm] = useState({
    meetingType: 'weekly_review',
    dateRange: 'last_7_days',
    includeMetrics: true,
    includeRecommendations: true,
    includeNextSteps: true
  });
  const [editingAgenda, setEditingAgenda] = useState(false);
  const [editedAgendaContent, setEditedAgendaContent] = useState('');

  // Fetch campaigns on mount
  useEffect(() => {
    fetch('http://localhost:3001/api/campaigns')
      .then(res => res.json())
      .then(data => {
        setCampaigns(data.campaigns || data || []);
      })
      .catch(err => console.error('Error fetching campaigns:', err));
  }, []);

  // Fetch saved emails
  useEffect(() => {
    if (activeTab === 'emails') {
      fetch('http://localhost:3001/api/creative/assets?type=email')
        .then(res => res.json())
        .then(data => {
          setSavedEmails(data.assets || []);
        })
        .catch(err => console.error('Error fetching emails:', err));
    }
  }, [activeTab]);

  const handleGenerateEmail = async () => {
    if (!selectedEmailType) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedEmailType.id,
          campaign_id: selectedCampaign || null,
          brand_name: brandName || selectedClient?.name || 'Your Brand',
          product_name: productName || 'Your Product'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();
      setGeneratedEmail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch weekly report
  const fetchWeeklyReport = async () => {
    if (!selectedClient?.id) {
      setReportError('Please select a client first');
      return;
    }
    setLoadingReport('weekly');
    setReportError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/reports/${selectedClient.id}/weekly`);
      if (!response.ok) throw new Error('Failed to fetch weekly report');
      const data = await response.json();
      setWeeklyReport(data);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setLoadingReport(null);
    }
  };

  // Fetch monthly report
  const fetchMonthlyReport = async () => {
    if (!selectedClient?.id) {
      setReportError('Please select a client first');
      return;
    }
    setLoadingReport('monthly');
    setReportError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/reports/${selectedClient.id}/monthly`);
      if (!response.ok) throw new Error('Failed to fetch monthly report');
      const data = await response.json();
      setMonthlyReport(data);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setLoadingReport(null);
    }
  };

  // Generate Meeting Agenda
  const generateMeetingAgenda = () => {
    if (!selectedClient?.id) {
      setReportError('Please select a client first');
      return;
    }

    const meetingTypes = {
      weekly_review: 'Weekly Performance Review',
      monthly_review: 'Monthly Business Review',
      strategy_session: 'Strategy Planning Session',
      campaign_kickoff: 'Campaign Kickoff Meeting',
      optimization_review: 'Optimization Review'
    };

    const dateRanges = {
      last_7_days: { start: '7 days ago', end: 'Today' },
      last_14_days: { start: '14 days ago', end: 'Today' },
      last_30_days: { start: '30 days ago', end: 'Today' },
      this_month: { start: 'First of month', end: 'Today' }
    };

    const dateRange = dateRanges[agendaForm.dateRange];

    // Generate agenda based on client data and form settings
    const agenda = {
      title: meetingTypes[agendaForm.meetingType],
      client: selectedClient.name,
      date: new Date().toLocaleDateString(),
      dateRange: `${dateRange.start} - ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          title: 'Opening & Introductions',
          duration: '5 min',
          items: [
            'Welcome and attendee introductions',
            'Review meeting objectives',
            'Confirm agenda items'
          ]
        },
        ...(agendaForm.includeMetrics ? [{
          title: 'Performance Metrics Review',
          duration: '15 min',
          items: [
            `Review overall campaign performance for ${selectedClient.name}`,
            'Key metrics: ROAS, CTR, CPA, Conversion Rate',
            'Compare to previous period benchmarks',
            'Highlight top performing campaigns/ad sets',
            'Identify underperforming areas'
          ]
        }] : []),
        {
          title: 'Campaign Updates',
          duration: '10 min',
          items: [
            'Current campaign status overview',
            'Recent optimizations made',
            'A/B test results and learnings',
            'Creative performance insights'
          ]
        },
        ...(agendaForm.includeRecommendations ? [{
          title: 'Recommendations & Opportunities',
          duration: '15 min',
          items: [
            'Budget reallocation opportunities',
            'New audience targeting suggestions',
            'Creative refresh recommendations',
            'Platform expansion opportunities',
            'Competitive insights to leverage'
          ]
        }] : []),
        ...(agendaForm.includeNextSteps ? [{
          title: 'Action Items & Next Steps',
          duration: '10 min',
          items: [
            'Review action items from previous meeting',
            'Assign new action items with owners',
            'Set deadlines and priorities',
            'Schedule follow-up meeting'
          ]
        }] : []),
        {
          title: 'Q&A and Wrap-Up',
          duration: '5 min',
          items: [
            'Open floor for questions',
            'Confirm next meeting date',
            'Closing remarks'
          ]
        }
      ],
      talkingPoints: [
        `${selectedClient.name} campaign performance highlights`,
        'Key wins and successes to celebrate',
        'Challenges and how we addressed them',
        'Upcoming initiatives and timeline',
        'Resource needs and support required'
      ]
    };

    setMeetingAgenda(agenda);
    setEditedAgendaContent(JSON.stringify(agenda, null, 2));
    setShowAgendaModal(false);
    setEditingAgenda(false);
  };

  // Save edited agenda
  const saveEditedAgenda = () => {
    try {
      const parsed = JSON.parse(editedAgendaContent);
      setMeetingAgenda(parsed);
      setEditingAgenda(false);
    } catch (e) {
      alert('Invalid JSON format. Please check your edits.');
    }
  };

  // Export report to PDF
  const exportToPDF = async (reportData, filename) => {
    try {
      const response = await fetch('http://localhost:3001/api/reports/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_data: reportData, filename })
      });
      if (!response.ok) throw new Error('Failed to export PDF');
      const data = await response.json();
      alert(`PDF exported successfully: ${data.export.filename}`);
    } catch (err) {
      alert('Error exporting PDF: ' + err.message);
    }
  };

  // Export report to CSV
  const exportToCSV = async (reportData, filename) => {
    try {
      const response = await fetch('http://localhost:3001/api/reports/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_data: reportData, filename })
      });
      if (!response.ok) throw new Error('Failed to export CSV');
      const data = await response.json();
      alert(`CSV exported successfully: ${data.export.filename}`);
    } catch (err) {
      alert('Error exporting CSV: ' + err.message);
    }
  };

  // Fetch scheduled reports
  const fetchScheduledReports = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/reports/scheduled');
      if (!response.ok) throw new Error('Failed to fetch scheduled reports');
      const data = await response.json();
      setScheduledReports(data.schedules || []);
    } catch (err) {
      console.error('Error fetching scheduled reports:', err);
    }
  };

  // Create scheduled report
  const createScheduledReport = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scheduleForm, client_id: selectedClient?.id || 1 })
      });
      if (!response.ok) throw new Error('Failed to create schedule');
      const data = await response.json();
      setScheduledReports([...scheduledReports, data.schedule]);
      setShowScheduleModal(false);
    } catch (err) {
      alert('Error creating schedule: ' + err.message);
    }
  };

  // Load scheduled reports on tab change
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchScheduledReports();
    }
  }, [activeTab]);

  const handleGenerateLandingPage = async () => {
    if (!landingPageBrief.trim()) {
      setLandingPageError('Please enter a brief for your landing page');
      return;
    }

    setIsGeneratingLandingPage(true);
    setLandingPageError(null);

    try {
      const response = await fetch('http://localhost:3001/api/creative/landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: landingPageBrief,
          campaignId: landingPageCampaign || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate landing page');
      }

      const data = await response.json();
      setGeneratedLandingPage(data);
    } catch (err) {
      setLandingPageError(err.message);
    } finally {
      setIsGeneratingLandingPage(false);
    }
  };

  const tabs = [
    { id: 'reports', name: 'Reports', icon: '📊' },
    { id: 'optimization', name: 'Investment Optimizer', icon: '💰' }
  ];

  // Fetch investment optimization
  const fetchInvestmentOptimization = async () => {
    setInvestmentLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/investment-optimization');
      if (response.ok) {
        const data = await response.json();
        setInvestmentData(data);
      }
    } catch (error) {
      console.error('Failed to fetch investment optimization:', error);
    } finally {
      setInvestmentLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports & Content</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Performance reports and content generation tools
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={fetchWeeklyReport}
              disabled={loadingReport === 'weekly'}
              id="generate-weekly-btn"
              className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left"
            >
              <div className="text-3xl mb-2">📅</div>
              <div className="font-bold text-lg">Weekly Report</div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {loadingReport === 'weekly' ? 'Loading...' : `Generate for ${selectedClient?.name || 'client'}`}
              </p>
            </button>

            <button
              onClick={fetchMonthlyReport}
              disabled={loadingReport === 'monthly'}
              id="generate-monthly-btn"
              className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left"
            >
              <div className="text-3xl mb-2">📆</div>
              <div className="font-bold text-lg">Monthly Report</div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {loadingReport === 'monthly' ? 'Loading...' : `Generate for ${selectedClient?.name || 'client'}`}
              </p>
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              id="schedule-report-btn"
              className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left"
            >
              <div className="text-3xl mb-2">⏰</div>
              <div className="font-bold text-lg">Schedule Report</div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Set up automated reports
              </p>
            </button>

            <button
              onClick={() => setShowAgendaModal(true)}
              id="generate-agenda-btn"
              className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left"
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="font-bold text-lg">Meeting Agenda</div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Generate agenda with talking points
              </p>
            </button>
          </div>

          {reportError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {reportError}
            </div>
          )}

          {/* Weekly Report Display */}
          {weeklyReport && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="weekly-report">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    📅 Weekly Report
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded" data-report-generated="true">Generated</span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {weeklyReport.client_name} • Week {weeklyReport.week_number} • {weeklyReport.date_range?.start_date} to {weeklyReport.date_range?.end_date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToPDF(weeklyReport, `weekly_report_${weeklyReport.client_name}`)}
                    id="export-pdf-btn"
                    className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(weeklyReport, `weekly_report_${weeklyReport.client_name}`)}
                    id="export-csv-btn"
                    className="px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    📊 CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400" data-metric="spend">${weeklyReport.summary?.total_spend?.toFixed(2) || 0}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total Spend</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-metric="roas">{weeklyReport.metrics?.roas || 0}x</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">ROAS</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-metric="ctr">{weeklyReport.metrics?.avg_ctr || 0}%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">CTR</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-metric="conversions">{weeklyReport.summary?.total_conversions || 0}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Conversions</div>
                </div>
              </div>

              {weeklyReport.campaigns?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Campaigns</h4>
                  <div className="space-y-2">
                    {weeklyReport.campaigns.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div>
                          <span className="font-medium">{c.name}</span>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${c.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>{c.status}</span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          ${c.spend?.toFixed(2) || 0} spend • {c.clicks || 0} clicks
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monthly Report Display */}
          {monthlyReport && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="monthly-report">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    📆 Monthly Report
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded" data-report-generated="true">Generated</span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {monthlyReport.client_name} • {monthlyReport.month}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToPDF(monthlyReport, `monthly_report_${monthlyReport.client_name}`)}
                    className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(monthlyReport, `monthly_report_${monthlyReport.client_name}`)}
                    className="px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    📊 CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${monthlyReport.summary?.total_spend?.toFixed(2) || 0}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total Spend</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{monthlyReport.metrics?.roas || 0}x</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">ROAS</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{monthlyReport.metrics?.avg_ctr || 0}%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">CTR</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{monthlyReport.summary?.total_conversions || 0}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Conversions</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">${monthlyReport.metrics?.cpm?.toFixed(2) || 0}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">CPM</div>
                </div>
              </div>

              {/* Insights */}
              {monthlyReport.insights?.length > 0 && (
                <div className="mb-6" id="monthly-insights">
                  <h4 className="font-semibold mb-2">Insights & Analysis</h4>
                  <div className="space-y-2">
                    {monthlyReport.insights.map((insight, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${insight.type === 'positive' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                        <span className="mr-2">{insight.type === 'positive' ? '✅' : '⚠️'}</span>
                        {insight.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {monthlyReport.recommendations?.length > 0 && (
                <div id="monthly-recommendations">
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {monthlyReport.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-700 dark:text-indigo-400 text-sm">
                        💡 {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scheduled Reports */}
          {scheduledReports.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="scheduled-reports">
              <h3 className="text-xl font-bold mb-4">⏰ Scheduled Reports</h3>
              <div className="space-y-3">
                {scheduledReports.map(schedule => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg" data-schedule-id={schedule.id}>
                    <div>
                      <div className="font-medium">{schedule.report_type} Report</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {schedule.schedule_frequency} on {schedule.delivery_day} at {schedule.delivery_time}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${schedule.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                        {schedule.is_active ? 'Active' : 'Paused'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Next: {new Date(schedule.next_run).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md" id="schedule-modal">
                <h3 className="text-xl font-bold mb-4">Schedule Automated Report</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Report Type</label>
                    <select
                      value={scheduleForm.report_type}
                      onChange={(e) => setScheduleForm({...scheduleForm, report_type: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Frequency</label>
                    <select
                      value={scheduleForm.schedule_frequency}
                      onChange={(e) => setScheduleForm({...scheduleForm, schedule_frequency: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Delivery Day</label>
                    <select
                      value={scheduleForm.delivery_day}
                      onChange={(e) => setScheduleForm({...scheduleForm, delivery_day: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Delivery Time</label>
                    <input
                      type="time"
                      value={scheduleForm.delivery_time}
                      onChange={(e) => setScheduleForm({...scheduleForm, delivery_time: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createScheduledReport}
                    id="save-schedule-btn"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create Schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Meeting Agenda Modal */}
          {showAgendaModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md" id="agenda-modal">
                <h3 className="text-xl font-bold mb-4">Generate Meeting Agenda</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Meeting Type</label>
                    <select
                      value={agendaForm.meetingType}
                      onChange={(e) => setAgendaForm({...agendaForm, meetingType: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      <option value="weekly_review">Weekly Performance Review</option>
                      <option value="monthly_review">Monthly Business Review</option>
                      <option value="strategy_session">Strategy Planning Session</option>
                      <option value="campaign_kickoff">Campaign Kickoff Meeting</option>
                      <option value="optimization_review">Optimization Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date Range</label>
                    <select
                      value={agendaForm.dateRange}
                      onChange={(e) => setAgendaForm({...agendaForm, dateRange: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      <option value="last_7_days">Last 7 Days</option>
                      <option value="last_14_days">Last 14 Days</option>
                      <option value="last_30_days">Last 30 Days</option>
                      <option value="this_month">This Month</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1">Include Sections</label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={agendaForm.includeMetrics}
                        onChange={(e) => setAgendaForm({...agendaForm, includeMetrics: e.target.checked})}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm">Performance Metrics Review</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={agendaForm.includeRecommendations}
                        onChange={(e) => setAgendaForm({...agendaForm, includeRecommendations: e.target.checked})}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm">Recommendations & Opportunities</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={agendaForm.includeNextSteps}
                        onChange={(e) => setAgendaForm({...agendaForm, includeNextSteps: e.target.checked})}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm">Action Items & Next Steps</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAgendaModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateMeetingAgenda}
                    id="generate-agenda-confirm-btn"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Generate Agenda
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Meeting Agenda Display */}
          {meetingAgenda && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="meeting-agenda">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    📋 {meetingAgenda.title}
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Generated</span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {meetingAgenda.client} • {meetingAgenda.date} • {meetingAgenda.dateRange}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAgenda(!editingAgenda)}
                    className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    {editingAgenda ? 'Cancel Edit' : '✏️ Edit'}
                  </button>
                  <button
                    onClick={() => setMeetingAgenda(null)}
                    className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {editingAgenda ? (
                <div className="space-y-4">
                  <textarea
                    value={editedAgendaContent}
                    onChange={(e) => setEditedAgendaContent(e.target.value)}
                    className="w-full h-96 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono text-sm"
                    placeholder="Edit agenda JSON..."
                  />
                  <button
                    onClick={saveEditedAgenda}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <>
                  {/* Agenda Sections */}
                  <div className="space-y-4 mb-6">
                    {meetingAgenda.sections.map((section, index) => (
                      <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg">{section.title}</h4>
                          <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">{section.duration}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          {section.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Talking Points */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h4 className="font-bold text-amber-700 dark:text-amber-400 mb-2">💡 Key Talking Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 dark:text-amber-400">
                      {meetingAgenda.talkingPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Landing Page Builder Tab */}
      {activeTab === 'landing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Landing Page Configuration */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🌐</span> Landing Page Copy Generator
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Generate complete landing page copy with headlines, body sections, and CTAs
            </p>

            {/* Landing Page Sections Preview */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Page Sections Included</h3>
              <div className="grid grid-cols-2 gap-2">
                {landingPageSections.map(section => (
                  <div
                    key={section.id}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-slate-600 rounded text-sm"
                  >
                    <span>{section.icon}</span>
                    <span className="text-slate-700 dark:text-slate-200">{section.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Campaign (Optional)
                </label>
                <select
                  value={landingPageCampaign}
                  onChange={(e) => setLandingPageCampaign(e.target.value)}
                  id="landing-campaign-select"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Select a campaign for context</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Landing Page Brief *
                </label>
                <textarea
                  value={landingPageBrief}
                  onChange={(e) => setLandingPageBrief(e.target.value)}
                  placeholder="Describe your landing page purpose, target audience, product/service, and key selling points..."
                  rows={4}
                  id="landing-brief-input"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Be specific about your product, audience, and conversion goal
                </p>
              </div>

              <button
                onClick={handleGenerateLandingPage}
                disabled={isGeneratingLandingPage || !landingPageBrief.trim()}
                id="generate-landing-page-btn"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingLandingPage ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating Landing Page...
                  </span>
                ) : (
                  'Generate Landing Page Copy'
                )}
              </button>

              {landingPageError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {landingPageError}
                </div>
              )}
            </div>
          </div>

          {/* Landing Page Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>👁️</span> Landing Page Preview
            </h2>

            {!generatedLandingPage ? (
              <div className="h-96 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🌐</div>
                  <p>Enter a brief and generate your landing page</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4" id="landing-page-preview">
                {/* Headline Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase">Headline</span>
                    <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded" data-headline-generated="true">✓ Generated</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white" id="landing-headline">
                    {generatedLandingPage.content?.headline || 'No headline generated'}
                  </h3>
                  {generatedLandingPage.content?.subheadline && (
                    <p className="text-lg text-slate-600 dark:text-slate-300 mt-2" id="landing-subheadline">
                      {generatedLandingPage.content.subheadline}
                    </p>
                  )}
                </div>

                {/* Hero Copy Section */}
                {generatedLandingPage.content?.hero_copy && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Hero Copy</span>
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded" data-body-section="true">✓ Created</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300" id="landing-hero-copy">
                      {generatedLandingPage.content.hero_copy}
                    </p>
                  </div>
                )}

                {/* Features Section */}
                {generatedLandingPage.content?.features && generatedLandingPage.content.features.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Features</span>
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded" data-features-section="true">✓ {generatedLandingPage.content.features.length} Features</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3" id="landing-features">
                      {generatedLandingPage.content.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-600 rounded-lg">
                          <span className="text-lg">✨</span>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{feature.title}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-300">{feature.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Proof Section */}
                {generatedLandingPage.content?.social_proof && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">Social Proof</span>
                      <span>⭐</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 italic" id="landing-social-proof">
                      "{generatedLandingPage.content.social_proof}"
                    </p>
                  </div>
                )}

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Call to Action</span>
                    <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded" data-cta-included="true">✓ CTA Included</span>
                  </div>
                  <div className="flex flex-wrap gap-3" id="landing-ctas">
                    {generatedLandingPage.content?.cta_primary && (
                      <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg">
                        {generatedLandingPage.content.cta_primary}
                      </button>
                    )}
                    {generatedLandingPage.content?.cta_secondary && (
                      <button className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        {generatedLandingPage.content.cta_secondary}
                      </button>
                    )}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                      🌐 Landing Page
                    </span>
                    {generatedLandingPage.campaign_id && (
                      <span className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                        Campaign #{generatedLandingPage.campaign_id}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    ID: {generatedLandingPage.id}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investment Optimization Tab */}
      {activeTab === 'optimization' && (
        <div className="space-y-6" id="investment-optimization-tab">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  💰 Investment Optimization
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Analyze campaigns and get budget reallocation suggestions to maximize ROAS
                </p>
              </div>
              <button
                onClick={fetchInvestmentOptimization}
                disabled={investmentLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                id="request-optimization-btn"
              >
                {investmentLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze & Optimize'
                )}
              </button>
            </div>
          </div>

          {investmentLoading && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Analyzing campaign budgets and performance...</p>
            </div>
          )}

          {!investmentLoading && !investmentData && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Get Investment Recommendations</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Click "Analyze & Optimize" to review all campaigns and receive budget reallocation suggestions
              </p>
            </div>
          )}

          {investmentData && (
            <>
              {/* Summary Stats */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="investment-summary">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  📈 Portfolio Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600" id="current-budget">
                      ${investmentData.summary.currentTotalBudget?.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">Total Budget</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600" id="current-roas">
                      {investmentData.summary.currentOverallRoas}x
                    </div>
                    <div className="text-sm text-slate-500">Current ROAS</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600" id="projected-roas">
                      {investmentData.summary.projectedRoas}x
                    </div>
                    <div className="text-sm text-slate-500">Projected ROAS</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                    <div className={`text-2xl font-bold ${investmentData.summary.projectedImprovement > 0 ? 'text-green-600' : 'text-amber-600'}`} id="projected-improvement">
                      {investmentData.summary.projectedImprovement > 0 ? '+' : ''}{investmentData.summary.projectedImprovement}%
                    </div>
                    <div className="text-sm text-slate-500">Projected Improvement</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-slate-500">
                  <span>📊 {investmentData.summary.campaignCount} campaigns analyzed</span>
                  <span>✅ {investmentData.summary.highPerformers} high performers</span>
                  <span>⚠️ {investmentData.summary.lowPerformers} need attention</span>
                </div>
              </div>

              {/* Campaign Performance Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="campaign-performance">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  📋 Campaign Performance
                </h3>
                {investmentData.campaigns.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No active campaigns with spend data found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Campaign</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">Budget</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">Spend</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">Revenue</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">ROAS</th>
                          <th className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {investmentData.campaigns.map(campaign => (
                          <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{campaign.name}</td>
                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">${campaign.totalBudget?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">${campaign.currentSpend?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">${campaign.revenue?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold" style={{
                              color: campaign.efficiency === 'high' ? '#16a34a' : campaign.efficiency === 'medium' ? '#d97706' : '#dc2626'
                            }}>{campaign.roas}x</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                campaign.efficiency === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                campaign.efficiency === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {campaign.efficiency.charAt(0).toUpperCase() + campaign.efficiency.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Optimization Suggestions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="optimization-suggestions">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  💡 Budget Reallocation Suggestions
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                    {investmentData.suggestions.length}
                  </span>
                </h3>
                {investmentData.suggestions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <span className="text-4xl block mb-2">✨</span>
                    <p>Your campaigns are performing well! No immediate reallocation needed.</p>
                  </div>
                ) : (
                  <div className="space-y-4" id="budget-suggestions">
                    {investmentData.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          suggestion.priority === 'critical' ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20' :
                          suggestion.priority === 'high' ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20' :
                          'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                        }`}
                        id={`suggestion-${idx}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              suggestion.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                              suggestion.priority === 'high' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                              'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {suggestion.priority.toUpperCase()}
                            </span>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{suggestion.title}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{suggestion.description}</p>
                        {suggestion.type === 'budget_reallocation' && suggestion.amount && (
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-sm">
                            <div className="font-medium text-green-600">Reallocation Amount: ${suggestion.amount.toLocaleString()}</div>
                            <div className="text-slate-500 mt-1">{suggestion.projectedImpact}</div>
                          </div>
                        )}
                        {suggestion.type === 'increase_budget' && (
                          <div className="flex gap-4 text-sm mt-2">
                            <span className="text-slate-500">Current: ${suggestion.currentBudget?.toLocaleString()}</span>
                            <span className="text-green-600 font-medium">→ Suggested: ${suggestion.suggestedBudget?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generation Timestamp */}
              <div className="text-center text-sm text-slate-500">
                Last analyzed: {new Date(investmentData.generatedAt).toLocaleString()}
              </div>
            </>
          )}
        </div>
      )}

      {/* Email Sequence Builder Tab */}
      {activeTab === 'emails' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Type Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>✉️</span> Email Sequence Builder
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Select an email type to generate professional marketing emails
            </p>

            {/* Email Type Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {emailTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedEmailType(type);
                    setGeneratedEmail(null);
                  }}
                  data-email-type={type.id}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedEmailType?.id === type.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-semibold text-slate-900 dark:text-white">{type.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{type.description}</div>
                </button>
              ))}
            </div>

            {/* Configuration */}
            {selectedEmailType && (
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="font-medium text-slate-700 dark:text-slate-300">Configuration</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder={selectedClient?.name || 'Your Brand'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                {(selectedEmailType.id === 'abandoned_cart' || selectedEmailType.id === 'post_purchase') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Product or Service Name"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Link to Campaign (Optional)
                  </label>
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">No campaign linked</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Email Structure Preview */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2">Email Structure</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmailType.elements.map((element, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded"
                      >
                        {element}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateEmail}
                  disabled={isGenerating}
                  id="generate-email-btn"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Email Content'
                  )}
                </button>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>👁️</span> Email Preview
            </h2>

            {!generatedEmail ? (
              <div className="h-96 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📧</div>
                  <p>Select an email type and generate content</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4" id="email-preview">
                {/* Email Header */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Subject Line</span>
                    {generatedEmail.email?.subject && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded" data-subject-created="true">✓ Created</span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-lg" id="email-subject">
                    {generatedEmail.email?.subject || 'No subject'}
                  </div>
                </div>

                {/* Preview Text */}
                {generatedEmail.email?.preview && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Preview Text</div>
                    <div className="text-slate-700 dark:text-slate-300 italic">
                      {generatedEmail.email.preview}
                    </div>
                  </div>
                )}

                {/* Email Body */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Email Body</span>
                    {generatedEmail.email?.body && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded" data-body-complete="true">✓ Complete</span>
                    )}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed" id="email-body">
                    {generatedEmail.email?.body || 'No body content'}
                  </div>
                </div>

                {/* Email Type Badge */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                      {selectedEmailType?.icon} {generatedEmail.email_type}
                    </span>
                    {generatedEmail.campaign_id && (
                      <span className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                        Campaign #{generatedEmail.campaign_id}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    ID: {generatedEmail.id}
                  </div>
                </div>

                {/* Urgency/Product Elements for specific types */}
                {selectedEmailType?.id === 'abandoned_cart' && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" data-urgency-element="true">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <span>⏰</span>
                      <span className="font-medium">Urgency Element Included</span>
                    </div>
                    <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                      Limited time offer and scarcity messaging included
                    </p>
                  </div>
                )}

                {selectedEmailType?.id === 'abandoned_cart' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4" data-product-reminder="true">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <span>🛒</span>
                      <span className="font-medium">Product Reminder Present</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                      Customer reminded about their cart items
                    </p>
                  </div>
                )}

                {selectedEmailType?.id === 'post_purchase' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4" data-thank-you="true">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <span>🙏</span>
                      <span className="font-medium">Thank You Message Included</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                      Gratitude expressed to the customer
                    </p>
                  </div>
                )}

                {selectedEmailType?.id === 'post_purchase' && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4" data-next-steps="true">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <span>📋</span>
                      <span className="font-medium">Next Steps Outlined</span>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-500 mt-1">
                      Clear guidance on what happens next
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Saved Emails */}
          {savedEmails.length > 0 && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📚</span> Saved Emails
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedEmails.slice(0, 6).map(email => {
                  let content;
                  try {
                    content = typeof email.content === 'string' ? JSON.parse(email.content) : email.content;
                  } catch {
                    content = { subject: 'Email', body: email.content };
                  }
                  return (
                    <div key={email.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate mb-1">
                        {content?.subject || 'Untitled Email'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {email.type} - {new Date(email.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
