import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Aiiot.css';

const ProjectDetail = () => {
  const { projectId } = useParams();

  // Project details data
  const projectsData = {
    'intelligent-sensor': {
      title: 'Intelligent Sensor Module',
      subtitle: 'Real-time Environmental Monitoring',
      mainImage: '/sensor_modules/module2.jpg',
      description: 'Developing a smart sensor module for real-time monitoring and management of environmental pollutants.',
      fullDescription: `
        The Intelligent Sensor Module is an advanced IoT device designed to continuously monitor air quality, water quality, and environmental parameters. 
        This module integrates multiple sensors with edge computing capabilities to provide real-time data processing and analytics.
      `,
      features: [
        'Multi-parameter sensing (PM2.5, PM10, NO2, SO2, O3, CO, NH3)',
        'Real-time data transmission via LoRaWAN',
        'Edge computing for instant alerts',
        'Low power consumption design',
        'Weather-resistant IP67 rating',
        'Modular architecture for easy upgrades'
      ],
      specifications: [
        { label: 'Operating Range', value: '0-500 µg/m³' },
        { label: 'Accuracy', value: '±5%' },
        { label: 'Update Frequency', value: '5 minutes' },
        { label: 'Power Consumption', value: '2W average' },
        { label: 'Battery Life', value: '6 months' }
      ],
      mobileApp: {
        available: true,
        description: 'Monitor sensor data directly from your smartphone',
        features: ['Real-time alerts', 'Historical data', 'Data export', 'Offline mode']
      },
      gallery: [
        '/sensor_modules/module2.jpg',
        '/sensor_modules/module_detail1.jpg',
        '/sensor_modules/module_detail2.jpg'
      ]
    },
    'water-level': {
      title: 'Smart Water Level Monitoring',
      subtitle: 'Flood Risk Mitigation System',
      mainImage: '/sensor_modules/water_authorityy.jpeg',
      description: 'A robust solution for monitoring water levels with an integrated alert system to mitigate flood risks.',
      fullDescription: `
        The Smart Water Level Monitoring system provides real-time water level tracking across rivers, dams, and urban areas. 
        It combines ultrasonic sensors with AI-powered predictive analytics to forecast flooding events and send timely alerts to authorities and residents.
      `,
      features: [
        'Ultrasonic water level sensors',
        'AI-powered flood prediction',
        'Multi-channel alert system (SMS, App, Web)',
        'Historical data analytics',
        'Integration with weather forecasts',
        'Scalable network architecture'
      ],
      specifications: [
        { label: 'Measurement Range', value: '0-10 meters' },
        { label: 'Accuracy', value: '±2 cm' },
        { label: 'Update Interval', value: '10 seconds' },
        { label: 'Transmission Range', value: '15+ km' },
        { label: 'Alert Response Time', value: '< 1 minute' }
      ],
      mobileApp: {
        available: true,
        description: 'Get instant flood alerts and historical water level trends',
        features: ['Push notifications', 'Map view', 'Data charts', 'Community alerts']
      },
      gallery: [
        '/sensor_modules/water_authorityy.jpeg',
        '/sensor_modules/water_detail1.jpg',
        '/sensor_modules/water_detail2.jpg'
      ]
    },
    'digital-water': {
      title: 'Digital Water Distribution',
      subtitle: 'Smart Water Network Management',
      mainImage: '/sensor_modules/water_authorityy.jpeg',
      description: 'Creating a digital twin to efficiently monitor and manage water distribution networks in urban areas.',
      fullDescription: `
        The Digital Water Distribution system creates a virtual replica of water distribution networks, enabling real-time monitoring, 
        leak detection, and predictive maintenance. Using IoT sensors and AI analytics, it optimizes water flow and reduces wastage.
      `,
      features: [
        'IoT-enabled pipeline monitoring',
        'Real-time leak detection',
        'Predictive maintenance scheduling',
        'Digital twin visualization',
        'Pressure and flow optimization',
        'Consumption analytics'
      ],
      specifications: [
        { label: 'Network Coverage', value: 'Up to 500 km' },
        { label: 'Sensor Density', value: '1 sensor per 2 km' },
        { label: 'Data Update Rate', value: 'Real-time' },
        { label: 'Leak Detection Accuracy', value: '95%' },
        { label: 'Water Loss Reduction', value: '20-30%' }
      ],
      mobileApp: {
        available: true,
        description: 'Monitor water supply and report leaks through the app',
        features: ['Network status', 'Leak reporting', 'Usage statistics', 'Service requests']
      },
      gallery: [
        '/sensor_modules/water_authorityy.jpeg'
      ]
    },
    'startup-skill': {
      title: 'Startup & Skill Development',
      subtitle: 'Fostering Innovation and Entrepreneurship',
      mainImage: '/sensor_modules/skill.jpg',
      description: 'Fostering a vibrant startup ecosystem and providing skill development programs centered around our IoT solutions.',
      fullDescription: `
        Our Startup & Skill Development program provides comprehensive training, mentorship, and resources for aspiring entrepreneurs 
        and technology enthusiasts. We offer hands-on workshops, business incubation, and access to cutting-edge IoT hardware and software tools.
      `,
      features: [
        'IoT development bootcamps',
        'Business mentorship programs',
        'Hardware prototyping labs',
        'Startup incubation support',
        'Investor networking events',
        'Certification courses'
      ],
      specifications: [
        { label: 'Training Duration', value: '6-12 months' },
        { label: 'Participants per Batch', value: '20-30' },
        { label: 'Success Rate', value: '85%' },
        { label: 'Startup Funding Support', value: 'Yes' },
        { label: 'Job Placement', value: '75%' }
      ],
      mobileApp: {
        available: true,
        description: 'Access training materials and track your learning progress',
        features: ['Course content', 'Live sessions', 'Certificates', 'Job board']
      },
      gallery: [
        '/sensor_modules/skill.jpg'
      ]
    },
    'xai-software': {
      title: 'Explainable AI Software',
      subtitle: 'Transparent Intelligence for IoT Systems',
      mainImage: '/sensor_modules/ai.jpeg',
      description: 'Building analysis software based on Explainable AI (XAI) to bring transparency and trust to complex IoT systems.',
      fullDescription: `
        Our Explainable AI Software suite provides transparent decision-making algorithms for IoT data analysis. 
        Unlike black-box AI models, our XAI system explains every prediction, making it ideal for critical applications in healthcare, 
        environmental monitoring, and urban management.
      `,
      features: [
        'Interpretable machine learning models',
        'Real-time decision explanations',
        'Data visualization dashboards',
        'Anomaly detection with reasoning',
        'Compliance report generation',
        'Multi-layer transparency'
      ],
      specifications: [
        { label: 'Processing Speed', value: '< 100ms' },
        { label: 'Model Accuracy', value: '92%' },
        { label: 'Explainability Score', value: '9.2/10' },
        { label: 'Data Sources', value: 'Multi-stream' },
        { label: 'API Response Time', value: '50-150ms' }
      ],
      mobileApp: {
        available: true,
        description: 'Understand AI predictions and insights on the go',
        features: ['Decision explanations', 'Confidence scores', 'Data insights', 'Export reports']
      },
      gallery: [
        '/sensor_modules/ai.jpeg'
      ]
    }
  };

  // Map project titles to IDs
  const titleToId = {
    'Intelligent Sensor Module': 'intelligent-sensor',
    'Smart Water Level Monitoring': 'water-level',
    'Digital Water Distribution': 'digital-water',
    'Startup & Skill Development': 'startup-skill',
    'Explainable AI Software': 'xai-software'
  };

  const project = projectsData[projectId];

  if (!project) {
    return (
      <div style={{ padding: '5rem 2rem', textAlign: 'center', minHeight: '100vh' }}>
        <h1 style={{ color: '#1e293b', marginBottom: '1rem' }}>Project Not Found</h1>
        <p style={{ color: '#475569', marginBottom: '2rem' }}>The project you're looking for doesn't exist.</p>
        <Link to="/" style={{
          padding: '0.75rem 1.5rem',
          background: '#3b82f6',
          color: 'white',
          borderRadius: '0.5rem',
          textDecoration: 'none'
        }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        padding: '1rem 2rem'
      }}>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#3b82f6',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'color 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.color = '#2563eb'}
        onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
        >
          ← Back to Projects
        </Link>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ color: 'white' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', opacity: 0.9 }}>
            AI-IoT Innovation Project
            </p>
            <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
              {project.title}
            </h1>
            <p style={{ fontSize: '1.125rem', maxWidth: '600px', opacity: 0.95 }}>
              {project.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '4rem 2rem' }}>
        {/* Project Image */}
        <div style={{ marginBottom: '4rem' }}>
          <img
            src={project.mainImage}
            alt={project.title}
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = '#eff6ff';
              e.target.parentElement.style.display = 'flex';
              e.target.parentElement.style.alignItems = 'center';
              e.target.parentElement.style.justifyContent = 'center';
              e.target.parentElement.style.minHeight = '400px';
              e.target.parentElement.innerHTML = '<span style="font-size: 5rem;">🔧</span>';
            }}
          />
        </div>

        {/* Description Section */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
            Overview
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#475569', lineHeight: 1.8, marginBottom: '1rem' }}>
            {project.description}
          </p>
          <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.8 }}>
            {project.fullDescription}
          </p>
        </div>

        {/* Features Section */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '2rem' }}>
            Key Features
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {project.features.map((feature, idx) => (
              <div key={idx} style={{
                padding: '1.5rem',
                background: '#f1f5f9',
                borderLeft: '4px solid #3b82f6',
                borderRadius: '0.5rem'
              }}>
                <p style={{ color: '#1e293b', fontWeight: 500 }}>
                  ✓ {feature}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Specifications Section */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '2rem' }}>
            Specifications
          </h2>
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {project.specifications.map((spec, idx) => (
                  <tr key={idx} style={{
                    borderBottom: idx < project.specifications.length - 1 ? '1px solid #e2e8f0' : 'none',
                    background: idx % 2 === 0 ? '#f8fafc' : 'white'
                  }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#1e293b', width: '40%' }}>
                      {spec.label}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#475569' }}>
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile App Section */}
        {project.mobileApp.available && (
          <div style={{ marginBottom: '4rem', background: '#eff6ff', padding: '3rem', borderRadius: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
                  📱 Mobile App
                </h2>
                <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.8 }}>
                  {project.mobileApp.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {project.mobileApp.features.map((feature, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>●</span>
                      <span style={{ color: '#475569' }}>{feature}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <a href="#" style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    Download on App Store
                  </a>
                  <a href="#" style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    border: '1px solid #3b82f6',
                    color: '#3b82f6',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    Google Play
                  </a>
                </div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📱</div>
                <p style={{ color: '#64748b' }}>Available on iOS and Android</p>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div style={{ background: '#f8fafc', padding: '3rem', borderRadius: '1rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
            Interested in This Project?
          </h2>
          <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '2rem' }}>
            Contact us to learn more about implementation, partnerships, or research collaboration.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="mailto:aiiot@adishankara.ac.in" style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600
            }}>
              Get in Touch
            </a>
            <Link to="/" style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              border: '1px solid #e2e8f0',
              color: '#1e293b',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600
            }}>
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#1e293b', color: '#cbd5e1', padding: '3rem 2rem', marginTop: '4rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', textAlign: 'center' }}>
          <p>&copy; 2025 Center for AI-IoT Innovations. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ProjectDetail;