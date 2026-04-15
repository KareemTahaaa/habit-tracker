import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [habitsList, setHabitsList] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState('');
  const [dateRange, setDateRange] = useState('7days'); // '7days' | '30days' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dateRangeLabel = useMemo(() => {
    if (dateRange === '7days') return 'Last 7 Days';
    if (dateRange === '30days') return 'Last 30 Days';
    if (customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
    }
    return 'Custom Range';
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRangeParams = () => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start;

    if (dateRange === '7days') {
      start = new Date(today - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (dateRange === '30days') {
      start = new Date(today - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else {
      start = customStartDate;
    }

    return { start, end: dateRange === 'custom' ? customEndDate : end };
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const { start, end } = getDateRangeParams();
      const habitParam = selectedHabit ? `habitId=${selectedHabit}` : '';

      const statsUrl = habitParam ? `/api/dashboard/stats?${habitParam}` : '/api/dashboard/stats';
      const dailyUrl = `/api/dashboard/daily?startDate=${start}&endDate=${end}${habitParam ? '&' + habitParam : ''}`;
      const weeklyUrl = habitParam ? `/api/dashboard/weekly?${habitParam}` : '/api/dashboard/weekly';

      const [statsRes, dailyRes, weeklyRes, perfRes, habitsRes] = await Promise.all([
        axiosInstance.get(statsUrl),
        axiosInstance.get(dailyUrl),
        axiosInstance.get(weeklyUrl),
        axiosInstance.get('/api/dashboard/performance'),
        axiosInstance.get('/api/dashboard/habits'),
      ]);

      setStats(statsRes.data.stats);
      setDailyData(dailyRes.data.data);
      setWeeklyData(weeklyRes.data.data);
      setPerformance(perfRes.data.performance);
      setHabitsList(habitsRes.data.habits);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedHabit, dateRange]);

  useEffect(() => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      loadDashboardData();
    }
  }, [customStartDate, customEndDate]);

  const handleRangeChange = (range) => {
    setDateRange(range);
    if (range !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    } else {
      // Set default custom range to last 7 days
      const today = new Date();
      const weekAgo = new Date(today - 6 * 24 * 60 * 60 * 1000);
      setCustomEndDate(today.toISOString().split('T')[0]);
      setCustomStartDate(weekAgo.toISOString().split('T')[0]);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatShortDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && !stats) {
    return (
      <div className="page-loading">
        <div className="loading-spinner-lg" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {}
      <div className="dashboard-hero">
        <div>
          <h1>Dashboard</h1>
          <p>Track your progress, analyze your habits, and stay consistent.</p>
        </div>
      </div>

      {}
      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {}
      <div className="dashboard-filters card">
        <div className="filter-group">
          <label className="filter-label">Habit</label>
          <select
            className="filter-select"
            value={selectedHabit}
            onChange={(e) => setSelectedHabit(e.target.value)}
          >
            <option value="">All Habits</option>
            {habitsList.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.title}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Time Range</label>
          <div className="range-toggle">
            <button
              type="button"
              className={`range-btn ${dateRange === '7days' ? 'active' : ''}`}
              onClick={() => handleRangeChange('7days')}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className={`range-btn ${dateRange === '30days' ? 'active' : ''}`}
              onClick={() => handleRangeChange('30days')}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              className={`range-btn ${dateRange === 'custom' ? 'active' : ''}`}
              onClick={() => handleRangeChange('custom')}
            >
              Custom
            </button>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="filter-group custom-dates">
            <label className="filter-label">Date Range</label>
            <div className="date-inputs">
              <input
                type="date"
                className="filter-date-input"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={customEndDate || new Date().toISOString().split('T')[0]}
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                className="filter-date-input"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}
      </div>

      {}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{stats.totalHabits}</div>
            <div className="stat-label">Active Habits</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{stats.bestStreak}</div>
            <div className="stat-label">Best Streak (days)</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{stats.weeklyCompletions}</div>
            <div className="stat-label">Weekly Completions</div>
          </div>
        </div>
      )}

      {}
      <div className="dashboard-charts">
        {}
        <div className="chart-card card">
          <div className="chart-header">
            <h3>Daily Completions</h3>
            <span className="chart-subtitle">{dateRangeLabel}</span>
          </div>
          <div className="chart-container">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e55" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke="#6b6b90"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#6b6b90"
                    fontSize={12}
                    allowDecimals={false}
                    domain={[0, stats?.totalHabits || 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161630',
                      border: '1px solid #252545',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#f0f0ff' }}
                    itemStyle={{ color: '#a78bfa' }}
                    labelFormatter={(label) => formatDate(label)}
                    formatter={(value) => [`${value}/${stats?.totalHabits || '-'} habits completed`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dailyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? '#7c3aed' : '#2e2e55'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">No data available for selected range</div>
            )}
          </div>
        </div>

        {}
        <div className="chart-card card">
          <div className="chart-header">
            <h3>Weekly Trends</h3>
            <span className="chart-subtitle">Last 4 Weeks</span>
          </div>
          <div className="chart-container">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e55" />
                  <XAxis dataKey="week" stroke="#6b6b90" fontSize={12} />
                  <YAxis
                    stroke="#6b6b90"
                    fontSize={12}
                    allowDecimals={false}
                    domain={[0, stats?.totalHabits * 7 || 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161630',
                      border: '1px solid #252545',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value} completions (out of ${(stats?.totalHabits || 0) * 7} max)`, 'Count']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#7c3aed', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">No trend data available</div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="dashboard-performance card">
        <div className="performance-header">
          <h3>Habit Performance</h3>
          <span className="performance-subtitle">Last 30 Days</span>
        </div>

        {performance.length > 0 ? (
          <div className="performance-list">
            {performance.map((habit, index) => (
              <div key={habit.id} className="performance-item">
                <div className="performance-rank">#{index + 1}</div>
                <div className="performance-info">
                  <div className="performance-title">{habit.title}</div>
                  <div className="performance-stats-row">
                    <span className="performance-stat">
                      🔥 Current Streak: <strong>{habit.streak}</strong> days
                    </span>
                    <span className="performance-stat">
                      🏆 Best Streak: <strong>{habit.longestStreak}</strong> days
                    </span>
                    <span className="performance-stat">
                      ✅ Last 30 Days: <strong>{habit.completions30Days}</strong> completions
                    </span>
                    <span className="performance-stat">
                      📊 Total: <strong>{habit.totalCompletions}</strong> completions
                    </span>
                  </div>
                </div>
                <div className="performance-score">
                  <div className="score-value">{habit.completions30Days}</div>
                  <div className="score-label">this month</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="performance-empty">
            <p>No habits created yet. Create your first habit to see performance analytics!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
