import React from 'react';
import { Link } from 'react-router-dom';
import './Aiiot.css'; // We will add new styles to your existing CSS

const Products = () => {
  // Placeholder data - we can update this later with your specific info
  const productCategories = [
    {
      title: "Air Quality Monitors",
      image: "https://images.unsplash.com/photo-1585779034823-7e9ac8faec70?q=80&w=800&auto=format&fit=crop",
      link: "/project/intelligent-sensor",
      desc: "Indoor & Outdoor real-time monitoring."
    },
    {
      title: "Water Level Sensors",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=800&auto=format&fit=crop",
      link: "/project/water-level",
      desc: "Flood alerts and river forecasting."
    },
    {
      title: "Weather Stations",
      image: "https://images.unsplash.com/photo-1590055531860-6902633df018?q=80&w=800&auto=format&fit=crop",
      link: "/project/water-level",
      desc: "Custom AWS hardware for precision data."
    },
    {
      title: "Industrial IoT",
      image: "https://images.unsplash.com/photo-1563770095-39d46e8c78cc?q=80&w=800&auto=format&fit=crop",
      link: "/project/digital-water",
      desc: "Pipeline and distribution tracking."
    }
  ];

  return (
    <div className="aiiot-page-container" style={{ paddingTop: '5rem' }}>
      
      {/* Hero Section */}
      <section style={{ background: '#f8fafc', padding: '4rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
          Our Product Ecosystem
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Advanced hardware solutions designed for precision, durability, and seamless connectivity.
        </p>
      </section>

      {/* Grid Layout (Like Reference) */}
      <section style={{ padding: '4rem 0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {productCategories.map((item, idx) => (
              <Link to={item.link} key={idx} style={{ textDecoration: 'none' }} className="product-card-hover">
                <div style={{ 
                  borderRadius: '1rem', 
                  overflow: 'hidden', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  background: 'white',
                  height: '100%',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ height: '220px', overflow: 'hidden' }}>
                    <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>{item.title}</h3>
                    <p style={{ color: '#64748b' }}>{item.desc}</p>
                    <span style={{ display: 'inline-block', marginTop: '1rem', color: '#3b82f6', fontWeight: 600 }}>View Series →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Products;