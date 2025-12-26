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
                          {/* <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Adi Shankara Engineering Institute</span> */}
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
            Transparency regarding our research data, location services, and health data usage.
          </p>
          
        </div>

        <div style={styles.card} className="privacy-card">
          <section style={{ marginBottom: '3rem' }}>
            <div style={styles.highlightBox}>
              <p style={{ margin: 0 }}>
                <strong>Scope:</strong> This policy applies to the <strong>Center for AI-IoT Innovations (AIIOT)</strong> website and associated IoT services managed by <strong>Adi Shankara Institute of Engineering Technology (ASIET)</strong>, Kerala.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>1</span> Information We Collect</h2>

            <div style={{ paddingLeft: '0.5rem' }}>
              <h3 style={styles.subHeader}>A. Location Data</h3>
              <p style={styles.paragraph}>
                We collect your <strong>precise geolocation data</strong> while you are logged in to our application. This is strictly used to provide you with real-time Air Quality Index (AQI) readings and environmental parameter alerts specific to your current location.
              </p>

              <h3 style={styles.subHeader}>B. Health Data (Sensitive)</h3>
              <p style={styles.paragraph}>
                We may collect health-related information that you voluntarily provide (e.g., respiratory conditions, asthma triggers). This data is processed to offer personalized health advisories based on the air quality in your vicinity.
              </p>

              <h3 style={styles.subHeader}>C. Contact & Verification Data</h3>
              <p style={styles.paragraph}>
                We collect your mobile number to perform <strong>SMS-based One-Time Password (OTP) verification</strong>. This ensures the security of your account and prevents unauthorized access.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>2</span> How We Use Your Data</h2>
            <div style={{ paddingLeft: '0.5rem' }}>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Real-Time Environmental Analysis:</strong> To calculate and display real-time parameters including <strong>CO, NO2, NH3, PM2.5, and PM10</strong> based on your specific user location.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Personalized AQI Alerts:</strong> To generate location-specific Air Quality Index (AQI) reports and warn you if pollution levels exceed safe limits for your specific health profile.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Account Security:</strong> To verify your identity via third-party SMS services during login or registration.
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
                <li style={{ marginBottom: '0.5rem' }}><strong>SMS Providers:</strong> Your phone number is shared with our SMS gateway partner  solely for the purpose of sending OTPs.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Infrastructure:</strong> Data is stored on secure cloud services  to ensure high availability of our IoT dashboard.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={styles.sectionTitle}><span style={styles.iconCircle}>4</span> Grievance Officer</h2>
            <div style={{ paddingLeft: '0.5rem' }}>
              <p style={styles.paragraph}>
                If you have concerns about the use of your health or location data, please contact our designated officer:
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