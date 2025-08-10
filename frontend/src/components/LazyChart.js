import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LazyChart = ({ forecastData, selectedParameter }) => {
    const chartData = useMemo(() => {
        if (!forecastData || forecastData.length === 0) return { labels: [], datasets: [] };
        const labels = forecastData.map(d => new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const dataPoints = forecastData.map(d => d[`${selectedParameter}_max`]);
        return {
            labels,
            datasets: [{
                label: selectedParameter.toUpperCase(),
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.4,
            }]
        };
    }, [forecastData, selectedParameter]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: '#6b7280' } }, y: { ticks: { color: '#6b7280' } } }
    };

    if (!forecastData || forecastData.length === 0) {
        return <div className="panel-loader"><p>No forecast data available.</p></div>;
    }

    return <Line options={chartOptions} data={chartData} />;
};

export default LazyChart;