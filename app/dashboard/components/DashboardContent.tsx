'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { DashboardData } from '@/lib/types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Time range options
const timeRanges = [
  { label: 'Last 24 hours', value: '1d' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' }
];

export default function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Calculate time range
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        let startTime: number;

        switch (timeRange) {
          case '1d':
            startTime = now - oneDay;
            break;
          case '7d':
            startTime = now - (7 * oneDay);
            break;
          case '30d':
            startTime = now - (30 * oneDay);
            break;
          case '90d':
            startTime = now - (90 * oneDay);
            break;
          default:
            startTime = now - (7 * oneDay);
        }

        // Fetch dashboard data
        const response = await fetch(`/api/dashboard/data?start=${startTime}&end=${now}`);

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const dashboardData = await response.json();
        setData(dashboardData);

        // Calculate unique sessions (this would normally come from the API)
        // For now, we'll just use a placeholder value
        setSessionCount(Math.floor(dashboardData.pageviews.total * 0.7));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading) {
    return <div className="flex justify-center py-12">Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading dashboard data: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  // Prepare pageviews chart data
  const pageviewsData = {
    labels: data.pageviews.byDay.map(item => item.date),
    datasets: [
      {
        label: 'Pageviews',
        data: data.pageviews.byDay.map(item => item.count),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Prepare top pages chart data
  const topPagesData = {
    labels: data.pageviews.byPage.map(item => item.page),
    datasets: [
      {
        label: 'Pageviews',
        data: data.pageviews.byPage.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }
    ]
  };

  // Prepare referrers chart data
  const referrersData = {
    labels: data.referrers.byReferrer.map(item => item.referrer),
    datasets: [
      {
        label: 'Visits',
        data: data.referrers.byReferrer.map(item => item.count),
        backgroundColor: 'rgba(255, 159, 64, 0.6)'
      }
    ]
  };

  // Prepare devices chart data
  const devicesData = {
    labels: data.devices.byDeviceType.map(item => item.deviceType),
    datasets: [
      {
        label: 'Devices',
        data: data.devices.byDeviceType.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Prepare browsers chart data
  const browsersData = {
    labels: data.devices.byBrowser.map(item => item.browser),
    datasets: [
      {
        label: 'Browsers',
        data: data.devices.byBrowser.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(201, 203, 207, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Pageviews Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <div>
      {/* Time range selector */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center">
          <label htmlFor="timeRange" className="mr-2 text-sm font-medium text-gray-700">
            Time Range:
          </label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Pageviews
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {data.pageviews.total.toLocaleString()}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Unique Sessions
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {sessionCount.toLocaleString()}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Avg. LCP
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {data.webVitals.byMetric.find(m => m.name === 'LCP')?.average.toFixed(2) || 'N/A'} ms
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Avg. CLS
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {data.webVitals.byMetric.find(m => m.name === 'CLS')?.average.toFixed(3) || 'N/A'}
            </dd>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pageviews over time */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Line data={pageviewsData} options={lineOptions} />
        </div>

        {/* Top pages */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pages</h3>
          <Bar data={topPagesData} options={barOptions} />
        </div>

        {/* Referrers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Referrers</h3>
          <Bar data={referrersData} options={barOptions} />
        </div>

        {/* Devices */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Types</h3>
          <Doughnut data={devicesData} options={doughnutOptions} />
        </div>

        {/* Browsers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Browsers</h3>
          <Doughnut data={browsersData} options={doughnutOptions} />
        </div>

        {/* Web Vitals */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Core Web Vitals</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Median
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    p75
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.webVitals.byMetric.map((metric) => (
                  <tr key={metric.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.average.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.median.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.p75.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${metric.rating === 'good'
                          ? 'bg-green-100 text-green-800'
                          : metric.rating === 'needs-improvement'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {metric.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Custom Events */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Custom Events</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.customEvents.recent.length > 0 ? (
                data.customEvents.recent.map((event, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.eventName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.pageUrl}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {event.eventData ? JSON.stringify(event.eventData) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No custom events recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
