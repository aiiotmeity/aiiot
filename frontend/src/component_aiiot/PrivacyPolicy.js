import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const styles = {
    pageWrapper: {
      backgroundColor: '#f1f5f9',
      minHeight: '100vh',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      color: '#334155',
      position: 'relative',
    },
    headerBg: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      height: '400px',
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 0,
    },
    navBar: {
      backgroundColor: '#ffffff',
      position: 'relative',
      zIndex: 20,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    },
    navContentWidth: {
      maxWidth: '80rem',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logoText: {
      color: '#1e293b',
      fontSize: '1.25rem',
      fontWeight: '800',
      textDecoration: 'none',
      letterSpacing: '-0.025em',
    },
    backButton: {
      backgroundColor: '#f1f5f9',
      color: '#475569',
      padding: '0.6rem 1.2rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '600',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    mainContainer: {
      position: 'relative',
      zIndex: 5,
      maxWidth: '56rem',
      margin: '3rem auto 4rem auto',
      padding: '0 1.5rem',
    },
    heroText: {
      textAlign: 'center',
      color: '#fff',
      marginBottom: '3rem',
      paddingTop: '1rem',
    },
    title: {
      fontSize: '3rem',
      fontWeight: '800',
      marginBottom: '1rem',
      letterSpacing: '-0.03em',
      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    subtitle: {
      fontSize: '1.125rem',
      color: '#cbd5e1',
      maxWidth: '36rem',
      margin: '0 auto',
      lineHeight: '1.6',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      padding: '4rem',
      marginBottom: '2rem',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '1.5rem',
      paddingBottom: '0.75rem',
      borderBottom: '2px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    subHeader: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#1e293b',
      marginTop: '2rem',
      marginBottom: '0.75rem',
    },
    paragraph: {
      lineHeight: '1.8',
      marginBottom: '1.25rem',
      color: '#475569',
    },
    highlightBox: {
      backgroundColor: '#f0f9ff',
      borderLeft: '4px solid #3b82f6',
      padding: '1.5rem',
      borderRadius: '0 0.5rem 0.5rem 0',
      margin: '2rem 0',
      color: '#334155',
      fontStyle: 'italic',
    },
    footer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#64748b',
      fontSize: '0.875rem',
    },
    iconCircle: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2rem',
      height: '2rem',
      backgroundColor: '#e0f2fe',
      color: '#0284c7',
      borderRadius: '50%',
      fontSize: '1rem',
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.headerBg}></div>

      <nav style={styles.navBar}>
        <div style={styles.navContentWidth}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', zIndex: 1001 }}>
            <div className="logo-box">
              <img src="/logo/logo.png" alt="Adi Shankara Institute" style={{ height: '100%', width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>AI-IoT Innovations</span>
            </div>
          </Link>
          <Link 
            to="/" 
            style={styles.backButton}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
          >
            <span>←</span> Return Home
          </Link>
        </div>
      </nav>

      <div style={styles.mainContainer}>
        <div style={styles.heroText}>
          <h1 style={styles.title}>Privacy Policy</h1>
          <p style={styles.subtitle}>
            Transparency regarding our research data, location services, and health data usage across AirAware, AWS, River Forecast, and Demand Forecasting systems.
          </p>
          
        </div>

        <div style={styles.card} className="privacy-card">
          <section style={{ marginBottom: '3rem' }}>
            <div style={styles.highlightBox}>
              <p style={{ margin: 0 }}>
                <strong>Scope:</strong> This policy applies to the <strong>Center for AI-IoT Innovations (AIIOT)</strong> website and its core solutions: <strong>AirAware</strong> (Air Quality & Health Monitoring), <strong>AWS</strong> (Automatic Weather Station), <strong>River Forecast</strong> (Periyar River Flood Forecasting), and <strong>Demand Forecasting</strong> (Real-time Hydraulic Water Distribution Monitoring), managed by <strong>Adi Shankara Institute of Engineering Technology (ASIET)</strong>, Kerala.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>1</span> Information We Collect</h2>

            <div style={{ paddingLeft: '0.5rem' }}>
              <h3 style={styles.subHeader}>A. Location Data</h3>
              <p style={styles.paragraph}>
                We collect your <strong>precise geolocation data</strong> while you are logged in. This is strictly used by:
              </p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8', marginBottom: '1.25rem' }}>
                <li><strong>AirAware:</strong> To provide real-time Air Quality Index (AQI) readings specific to your area.</li>
                <li><strong>AWS:</strong> To display hyper-local weather parameters relevant to your current location.</li>
              </ul>

              <h3 style={styles.subHeader}>B. Health Data (Sensitive)</h3>
              <p style={styles.paragraph}>
                Through the <strong>AirAware</strong> system, we may collect health-related information that you voluntarily provide (e.g., respiratory conditions, asthma triggers). This data is processed to offer personalized health advisories based on the air quality in your vicinity.
              </p>

              <h3 style={styles.subHeader}>C. Contact & Verification Data</h3>
              <p style={styles.paragraph}>
                We collect your mobile number to perform <strong>SMS-based One-Time Password (OTP) verification</strong>. This ensures the security of your account across our platforms.
              </p>

              <h3 style={styles.subHeader}>D. Sensor & Environmental Data (Non-Personal)</h3>
              <p style={styles.paragraph}>
                Our <strong>River Forecast</strong> and <strong>Demand Forecasting</strong> dashboards display real-time and AI-predicted readings collected from fixed IoT sensor nodes — such as <strong>Periyar River water levels</strong> at monitoring stations in the Kalady region, and <strong>ward-wise hydraulic water demand</strong> (in litres) from distribution zone nodes. This data reflects conditions at the sensor's fixed physical location and infrastructure, and is <strong>not linked to any individual user's identity or account</strong>.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>2</span> How We Use Your Data</h2>
            <div style={{ paddingLeft: '0.5rem' }}>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>AWS Environmental Analysis:</strong> To calculate and display real-time weather parameters including <strong>Temperature, Humidity, and Pressure</strong> based on sensor data.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>AirAware Monitoring:</strong> To track pollutants such as <strong>CO, NO2, NH3, PM2.5, and PM10</strong> and generate location-specific Air Quality Index (AQI) reports.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Personalized Health Alerts:</strong> To warn you if pollution levels detected by AirAware exceed safe limits for your specific health profile.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Account Security:</strong> To verify your identity via third-party SMS services during login or registration.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Flood Forecasting (River Forecast):</strong> To monitor Periyar River water levels in real time and generate AI-powered 6-hour water level projections, current-condition status, and explainable forecasts (via LIME) for the Kalady region.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Water Distribution Management (Demand Forecasting):</strong> To monitor and forecast hydraulic water demand across zone/node sections, supporting efficient supply planning across service wards.
                </li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>3</span> Third-Party Sharing</h2>
            <div style={{ paddingLeft: '0.5rem' }}>
              <p style={styles.paragraph}>
                We do not sell your personal data. However, we share data with specific third-party providers to enable our services:
              </p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '0.5rem' }}><strong>SMS Providers:</strong> Your phone number is shared with our SMS gateway partner solely for the purpose of sending OTPs.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Infrastructure:</strong> Data is stored on secure cloud services to ensure high availability of our IoT dashboards.</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>4</span> Data Retention</h2>
            <div style={{ paddingLeft: '0.5rem' }}>
              <p style={styles.paragraph}>
                We retain personal data only for as long as it is needed for the purposes described in this policy, or as required by applicable law. Retention periods differ by data type:
              </p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8', marginBottom: '1.25rem' }}>
                <li style={{ marginBottom: '0.5rem' }}><strong>Location Data:</strong> Used in real time to fetch AQI and weather readings for your area. We do not permanently store historical location data; it is used only for the duration of your active session and to generate the report you requested.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Health Data:</strong> Retained for as long as your AirAware account remains active, so we can continue to generate personalized advisories. This data is deleted when you delete your account, or earlier upon request.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Mobile Number:</strong> Retained for as long as your account is active, for login and verification purposes. OTP codes are temporary and are automatically deleted shortly after verification is complete.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Account Data:</strong> Retained for the lifetime of your account. If you delete your account, associated personal data is removed from our active systems within <strong>30 days</strong>, except where we are required to keep it for legal, security, or regulatory purposes.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Sensor & Forecast Data (River Forecast / Demand Forecasting):</strong> Environmental readings (river water levels, ward-wise water demand) and AI-generated forecasts are retained to support historical trend analysis and to improve our forecasting models. As this data is not linked to an individual user, it may be retained longer term in aggregated, non-personal form.</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>5</span> Data Deletion &amp; Your Rights</h2>
            <div style={{ paddingLeft: '0.5rem' }}>
              <p style={styles.paragraph}>
                You have the right to access, correct, or request deletion of your personal data at any time. To submit a data deletion request:
              </p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8', marginBottom: '1.25rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Email us at <a href="mailto:aiiot@adishankara.ac.in" style={{ color: '#3b82f6', textDecoration: 'none' }}>aiiot@adishankara.ac.in</a> with the subject line <strong>"Data Deletion Request"</strong>, including your registered mobile number so we can verify your identity.</li>
                <li style={{ marginBottom: '0.5rem' }}>We will process verified requests within <strong>30 days</strong> and confirm once your data has been removed from our active systems.</li>
                <li style={{ marginBottom: '0.5rem' }}>Some information may be retained beyond this period where necessary to comply with legal obligations, resolve disputes, or enforce our agreements.</li>
              </ul>
              <div style={styles.highlightBox}>
                <p style={{ margin: 0 }}>
                  Deleting your account removes access to personalized AQI and weather features tied to your profile. Non-personal, aggregated environmental and infrastructure sensor data — such as AWS weather station readings, River Forecast water levels, and Demand Forecasting zone data — is not affected, as it is not linked to your identity.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>6</span> Grievance Officer</h2>
            <div style={{ paddingLeft: '0.5rem' }}>
              <p style={styles.paragraph}>
                If you have concerns about the use of your data across AirAware, AWS, River Forecast, or Demand Forecasting, please contact our designated officer:
              </p>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '700', color: '#1e293b' }}>Project Coordinator</p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Center for AI-IoT Innovations, ASIET</p>
                <p style={{ margin: '0' }}>
                  <a href="mailto:aiiot@adishankara.ac.in" style={{ color: '#3b82f6', textDecoration: 'none' }}>aiiot@adishankara.ac.in</a>
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>

      <footer style={styles.footer}>
        &copy; 2025 Center for AI-IoT Innovations. All rights reserved.
      </footer>
    </div>
  );
};

export default PrivacyPolicy;