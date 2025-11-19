// filepath: c:\React\my-django-react-app\frontend\src\component_aiiot\Aiiot_index.js
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './Aiiot.css';

const AIIOT_INDEX = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const [heroImages, setHeroImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Map project titles to IDs
  const projectIdMap = {
    'Intelligent Sensor Module': 'intelligent-sensor',
    'Smart Water Level Monitoring': 'water-level',
    'Digital Water Distribution': 'digital-water',
    'Startup & Skill Development': 'startup-skill',
    'Explainable AI Software': 'xai-software'
  };

  useEffect(() => {
    // Initialize Feather Icons (if available)
    if (window.feather) {
      window.feather.replace();
    }

    // Reveal on scroll animation
    const scrollElements = document.querySelectorAll(".reveal-on-scroll");

    const elementInView = (el, dividend = 1) => {
      const elementTop = el.getBoundingClientRect().top;
      return elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend;
    };

    const displayScrollElement = (element) => element.classList.add("is-visible");

    const handleScrollAnimation = () => {
      scrollElements.forEach((el) => {
        if (elementInView(el, 1.25)) displayScrollElement(el);
      });
    };

    handleScrollAnimation(); // Initial check
    window.addEventListener("scroll", handleScrollAnimation);

    // Setup carousel with local images from public folder
    setupCarousel();

    return () => {
      window.removeEventListener("scroll", handleScrollAnimation);
    };
  }, []);

  const setupCarousel = () => {
    // Use images from your public/carousel-images folder
    const localImages = [
      '/carousel-images/aiiot1.jpg',
      '/carousel-images/aiiot2.jpeg',
      '/carousel-images/aiiot3.jpg',
      '/carousel-images/aiiot4.jpg',
    ];

    setHeroImages(localImages);
    setIsLoading(false);
  };

  useEffect(() => {
    if (heroImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroImages]);

  const handleIndicatorClick = (index) => {
    setCurrentImageIndex(index);
  };

  const teamMembers = [
    {
      name: "Dr. Ajay Kumar",
      role: "Principal Investigator",
      description: "Dr. Ajay Kumar is an Associate Professor at ASIET with a PhD in Electronics and Communication Engineering. His research interests include IoT and Wireless Sensor Networks.",
      image: "/faculties/ajay.jpeg"
    },
    {
      name: "Mr. Albins Paul",
      role: "Co-Investigator",
      description: "Assistant Professor at ASIET's ECE Department, specializing in Microwave & Television Engineering.",
      image: "/faculties/albins.jpg"
    },
    {
      name: "Prof. P.V. Rajaraman",
      role: "Co-Investigator",
      description: "Assistant Professor, CTO, and Head of the AI Department at ASIET. He specializes in NLP and XAI, has multiple publications, and is currently pursuing his Ph.D.",
      image: "/faculties/rajaraman.jpg"
    },
    {
      name: "Mr. Abhijith Pm",
      role: "Project Associate",
      description: "",
      image: "/faculties/abhijith.jpeg"
    },
    {
      name: "Mrs. Hasna Hameed",
      role: "Project Associate",
      description: "",
      image: "/faculties/hasna2.jpg"
    },
    {
      name: "Ms. Arathy Surendran",
      role: "Project Associate",
      description: "",
      image: "/faculties/arathy.jpg"
    },
    {
      name: "Mr. Bhagyaraj J",
      role: "Project Assistant",
      description: "",
      image: "/faculties/bhagyaraj.jpeg"
    },
    {
      name: "Mr. Amaljith N Raj",
      role: "Project Assistant",
      description: "",
      image: "/faculties/amaljith.jpg"
    },
    {
      name: "Mrs. Jibina EA",
      role: "Project Assistant",
      description: "",
      image: "/faculties/jibinaea.jpeg"
    }
  ];

  const projects = [
    {
      title: "Intelligent Sensor Module",
      description: "Developing a smart sensor module for real-time monitoring and management of environmental pollutants.",
      image: "/sensor_modules/module2.jpg"
    },
    {
      title: "Smart Water Level Monitoring",
      description: "A robust solution for monitoring water levels with an integrated alert system to mitigate flood risks.",
      image: "/sensor_modules/water_monitor.jpg"
    },
    {
      title: "Digital Water Distribution",
      description: "Creating a digital twin to efficiently monitor and manage water distribution networks in urban areas.",
      image: "/sensor_modules/water_authorityy.jpeg"
    },
    {
      title: "Startup & Skill Development",
      description: "Fostering a vibrant startup ecosystem and providing skill development programs centered around our IoT solutions.",
      image: "/sensor_modules/skill.jpg"
    },
    {
      title: "Explainable AI Software",
      description: "Building analysis software based on Explainable AI (XAI) to bring transparency and trust to complex IoT systems.",
      image: "/sensor_modules/ai.jpeg"
    }
  ];

  return (
    <div className="aiiot-page-container">
      {/* Header Section */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '5rem' }}>
            {/* Logo - Enhanced */}
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '10rem',
                height: '3.25rem',
                borderRadius: '0.5rem',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
                border: '1px solid #e2e8f0'
              }}>
                <img src="/logo/logo.png" alt="Adi Shankara Institute" style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'contain',
                  imageRendering: 'auto'
                }} srcSet="/logo/logo.png 1x" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                  AI-IoT Innovations
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                  Adi Shankara Institute
                </span>
              </div>
            </a>

            {/* Navigation Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <a href="#about" style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#475569',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
              onMouseLeave={(e) => e.target.style.color = '#475569'}
              >
                About
              </a>
              <a href="#team" style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#475569',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
              onMouseLeave={(e) => e.target.style.color = '#475569'}
              >
                Team
              </a>
              <a href="#projects" style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#475569',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
              onMouseLeave={(e) => e.target.style.color = '#475569'}
              >
                Projects
              </a>

              {/* Our Deployments Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProjectsDropdownOpen(!projectsDropdownOpen)}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#475569',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                >
                  Launches
                  <span style={{ fontSize: '0.75rem' }}>▼</span>
                </button>

                {/* Dropdown Menu */}
                {projectsDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #e2e8f0',
                    minWidth: '12rem',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}>
                      <Link
                            to="/homepage"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#1e293b',
                                textDecoration: 'none',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#eff6ff';
                                e.currentTarget.style.color = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#1e293b';
                            }}
                            >
                            <span style={{ fontSize: '1.25rem' }}>🌬️</span>
                            <div>
                                <div>AirAware</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Air Quality Monitor</div>
                            </div>
                            </Link>

                    <div style={{ height: '1px', background: '#e2e8f0' }}></div>
                    <a
                      href="/weather-home"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#1e293b',
                        textDecoration: 'none',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#1e293b';
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>💧</span>
                      <div>
                        <div>AWS Link</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Water Monitoring</div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              <a href="#contact" style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#475569',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
              onMouseLeave={(e) => e.target.style.color = '#475569'}
              >
                Contact
              </a>
            </div>

            {/* CTA Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a href="#contact" style={{
                padding: '0.625rem 1.25rem',
                background: '#3b82f6',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#3b82f6';
                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                e.target.style.transform = 'translateY(0)';
              }}
              >
                Get in Touch
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section className="hero-gradient reveal-on-scroll" style={{ padding: '5rem 0' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
              {/* Left Side - Text Content */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '9999px',
                  marginBottom: '1.5rem'
                }}>
                  Sponsored by Ministry of Electronics and Information Technology
                </p>
                <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                  Center for AI-IoT <span style={{ color: '#3b82f6' }}>Innovations</span>
                </h1>
                <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2rem' }}>
                  The Center for AI IoT Innovation is a facility focused on the integration of electronics hardware design 
                  with artificial intelligence (AI) and explainable AI (XAI).
                </p>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center' }}>
                  <a href="#projects" style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    Explore Projects
                    <span>→</span>
                  </a>
                  <a href="#team" style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    Meet the Team
                    <span>👥</span>
                  </a>
                </div>
              </div>

              {/* Right Side - Hero Image with Carousel */}
              <div style={{ flex: 1 }}>
                <div id="hero-image-container" style={{ position: 'relative' }}>
                  {isLoading ? (
                    <div className="animate-pulse" style={{
                      width: '100%',
                      height: '24rem',
                      background: '#e2e8f0',
                      borderRadius: '1rem'
                    }}></div>
                  ) : (
                    <img
                      id="hero-image"
                      src={heroImages[currentImageIndex]}
                      alt="AI IoT Innovation"
                      style={{
                        width: '100%',
                        height: '24rem',
                        objectFit: 'cover',
                        borderRadius: '1rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  )}

                  {/* Carousel Indicators */}
                  {heroImages.length > 0 && (
                    <div id="carousel-indicators" style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      {heroImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleIndicatorClick(index)}
                          className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                          style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            borderRadius: '9999px',
                            background: index === currentImageIndex ? '#3b82f6' : 'rgba(255, 255, 255, 0.5)'
                          }}
                          aria-label={`Go to slide ${index + 1}`}
                        ></button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="reveal-on-scroll" style={{ padding: '5rem 0' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
                About Our Center
              </h2>
              <p style={{ fontSize: '1.125rem', color: '#475569' }}>
                Pioneering research where intelligence meets connectivity.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  The Center for AI IoT Innovation is a facility focused on the integration of electronics hardware design 
                  with artificial intelligence (AI) and explainable AI (XAI). The lab is equipped with hardware development tools, 
                  computing systems, and educational resources to support research and development in this area.
                </p>
                <p style={{ color: '#475569', lineHeight: 1.6 }}>
                  The center provides resources for both theoretical research and practical applications, aiming to advance 
                  the integration of AI technologies with IoT systems.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {[
                  { icon: '⚡', title: 'Innovation', desc: 'State-of-the-art research facilities' },
                  { icon: '💻', title: 'Technology', desc: 'Advanced AI & IoT integration' },
                  { icon: '👥', title: 'Collaboration', desc: 'Expert faculty and researchers' },
                  { icon: '🏆', title: 'Excellence', desc: 'Industry-leading solutions' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: '1.5rem',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{item.icon}</div>
                    <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: '#475569' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="reveal-on-scroll" style={{ padding: '5rem 0', background: '#f8fafc' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
                Meet Our Expert Faculty
              </h2>
              <p style={{ fontSize: '1.125rem', color: '#475569' }}>
                The brilliant minds leading our research and innovation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {teamMembers.map((member, index) => (
                <div key={index} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    {/* Team Member Photo */}
                    <div style={{
                      width: '6rem',
                      height: '6rem',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      border: '3px solid #ffffffff',
                      flexShrink: 0
                    }}>
                      <img 
                        src={member.image} 
                        alt={member.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          // Fallback if image doesn't load
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background = '#dbeafe';
                          e.target.parentElement.style.display = 'flex';
                          e.target.parentElement.style.alignItems = 'center';
                          e.target.parentElement.style.justifyContent = 'center';
                          e.target.parentElement.innerHTML = '<span style="font-size: 2rem; color: #3b82f6;">👤</span>';
                        }}
                      />
                    </div>

                    {/* Member Info */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem', fontSize: '1.125rem' }}>
                        {member.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {member.role}
                      </p>
                      {member.description && (
                        <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, textAlign: 'left', marginTop: '1rem' }}>
                          {member.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
<section id="projects" className="reveal-on-scroll" style={{ padding: '5rem 0' }}>
  <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
      <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
        Our Ongoing Projects
      </h2>
      <p style={{ fontSize: '1.125rem', color: '#475569' }}>
        From concept to reality, we're building solutions that matter.
      </p>
    </div>

    {/* Projects as Paragraphs with Images */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      {projects.map((project, index) => {
        const projectId = projectIdMap[project.title] || 'unknown';
        return (
          <div 
            key={index}
            className="reveal-on-scroll"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3rem',
              flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
              '@media (max-width: 768px)': {
                flexDirection: 'column'
              }
            }}
          >
            {/* Image Section */}
            <div style={{
              flex: '0 0 45%',
              minWidth: 0
            }}>
              <img 
                src={project.image}
                alt={project.title}
                style={{
                  width: '100%',
                  height: '280px',
                  objectFit: 'cover',
                  borderRadius: '1rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.background = '#eff6ff';
                  e.target.parentElement.style.display = 'flex';
                  e.target.parentElement.style.alignItems = 'center';
                  e.target.parentElement.style.justifyContent = 'center';
                  e.target.parentElement.style.borderRadius = '1rem';
                  e.target.parentElement.innerHTML = `<div style="text-align: center;"><span style="font-size: 4rem;">📊</span></div>`;
                }}
              />
            </div>

            {/* Text Content Section */}
            <div style={{ flex: '0 0 55%' }}>
              <h3 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                {project.title}
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#475569',
                lineHeight: 1.8,
                marginBottom: '1.5rem'
              }}>
                {project.description}
              </p>
              <Link 
                  to={`/project/${projectId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3b82f6';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  Learn More 
                  <span style={{ fontSize: '1.125rem' }}>→</span>
                </Link>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>

        {/* Contact Section */}
        <section id="contact" className="reveal-on-scroll" style={{ padding: '5rem 0', background: '#f8fafc' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
              Let's Build the Future Together
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2rem' }}>
              Have a project in mind, a question, or want to collaborate? We'd love to hear from you.
            </p>
            <a href="mailto:contact@aiiot.edu" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              fontWeight: 500,
              borderRadius: '0.5rem'
            }}>
              <span>✉️</span>
              Contact Us
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: '#1e293b', color: '#cbd5e1', padding: '3rem 0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div>
              <h5 style={{ fontWeight: 700, color: 'white', marginBottom: '1rem' }}>AI-IoT Innovations</h5>
              <p style={{ fontSize: '0.875rem' }}>
                Advancing the integration of AI and IoT technologies for a smarter tomorrow.
              </p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Quick Links</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['About', 'Team', 'Projects', 'Contact'].map((link, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    <a href={`#${link.toLowerCase()}`} style={{ fontSize: '0.875rem' }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-section">
              <h3>Contact Information</h3>
              <p className="footer-text">
                Adi Shankara Institute of Engineering and Technology<br />
                Kalady 683574, Ernakulam<br />
                Kerala, India
              </p>
              <br />
              <p className="footer-text">
                <strong>Email:</strong> aiiot@adishankara.ac.in<br />
                <strong>Phone:</strong> 9846900310
              </p>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid #334155',
            marginTop: '2rem',
            paddingTop: '2rem',
            textAlign: 'center',
            fontSize: '0.875rem'
          }}>
            <p>&copy; 2025 Center for AI-IoT Innovations. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AIIOT_INDEX;