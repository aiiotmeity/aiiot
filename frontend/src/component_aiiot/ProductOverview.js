import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ProductOverview.css'; 

const ProductOverview = () => {
  const { productId } = useParams(); // 'slug' from URL
  
  // --- DATA STATES ---
  const [product, setProduct] = useState(null);
  const [menuData, setMenuData] = useState({}); // Dynamic Menu Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // --- UI STATES ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileProductExpanded, setMobileProductExpanded] = useState(false);
  const [mobileSolutionsExpanded, setMobileSolutionsExpanded] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:8000'; // Change if deployed

  // --- 1. FETCH PRODUCT DETAILS ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await axios.get(`${API_BASE_URL}/api/product/${productId}/`);
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
    window.scrollTo(0, 0);
  }, [productId]);

  // --- 2. FETCH DYNAMIC MENU ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products-menu/`);
        setMenuData(response.data);
        
        // Set default active category to the first one available
        const keys = Object.keys(response.data);
        if (keys.length > 0) setActiveCategory(keys[0]);
        
      } catch (err) {
        console.error("Error fetching menu:", err);
      }
    };
    fetchMenu();
  }, []);

  // --- STATIC SOLUTIONS LIST (Keep as is) ---
  const solutionsList = [
    { name: 'Air Quality Monitoring', link: '/project/intelligent-sensor' },
    { name: 'Flood Alert System', link: '/project/water-level' },
    { name: 'Digital Water Distribution', link: '/project/digital-water' },
    { name: 'Startup & Skill Development', link: '/project/startup-skill' }
  ];

  // --- HELPERS ---
  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/600x400?text=No+Image';
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  // --- RENDER ---
  if (loading) return (
    <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc'}}>
        <div style={{fontSize: '1.5rem', fontWeight: '600', color: '#3b82f6'}}>Loading...</div>
    </div>
  );

  if (error || !product) return (
    <div className="project-page">
        <header className="aiiot-header-local">
             <div className="project-header-inner">
                 <Link to="/" className="logo-link">
                   <div style={{fontWeight:'700', fontSize:'1.2rem', color:'#1e293b'}}>AI-IoT Innovations</div>
                 </Link>
             </div>
        </header>
        <div className="container" style={{paddingTop: '8rem', textAlign:'center'}}>
            <h2 style={{fontSize:'2rem', marginBottom:'1rem'}}>Product Not Found</h2>
            <Link to="/" className="btn-primary" style={{marginTop:'2rem', display:'inline-block'}}>Back to Home</Link>
        </div>
    </div>
  );

  return (
    <div className="project-page">
      
      {/* HEADER */}
      <header className="aiiot-header-local">
         <div className="project-header-inner">
             <Link to="/" className="logo-link">
               <div className="logo-box">
                 <img src="/logo/logo.png" alt="Adi Shankara Institute" style={{ height: '100%', width: 'auto' }} />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>AI-IoT Innovations</span>
               </div>
             </Link>
 
             {/* DESKTOP NAV */}
             <div className="project-desktop-nav">
               <Link to="/" className="project-nav-link">Home</Link>
               
               {/* Solutions Dropdown */}
               <div 
                   className="dropdown-wrapper"
                   onMouseEnter={() => setIsSolutionsMenuOpen(true)}
                   onMouseLeave={() => setIsSolutionsMenuOpen(false)}
               >
                   <div className="project-nav-link product-trigger" style={{ cursor: 'pointer' }}>
                     Solutions <span>▾</span>
                   </div>
                   <div className={`simple-dropdown ${isSolutionsMenuOpen ? 'visible' : ''}`}>
                     {solutionsList.map((sol, index) => (
                       <Link key={index} to={sol.link} className="simple-dropdown-item">
                         {sol.name}
                       </Link>
                     ))}
                   </div>
               </div>

               {/* DYNAMIC PRODUCTS MEGA MENU */}
               <div 
                 className="mega-menu-wrapper"
                 onMouseEnter={() => setIsMegaMenuOpen(true)}
                 onMouseLeave={() => setIsMegaMenuOpen(false)}
               >
                 <Link to="/products" className="project-nav-link product-trigger">
                   Products <span>▾</span>
                 </Link>
                 <div className={`mega-menu-container ${isMegaMenuOpen ? 'visible' : ''}`}>
                   {/* Left Sidebar */}
                   <div className="mega-menu-sidebar">
                     {Object.keys(menuData).map((key) => (
                       <div 
                         key={key} 
                         className={`mega-sidebar-item ${activeCategory === key ? 'active' : ''}`}
                         onMouseEnter={() => setActiveCategory(key)}
                       >
                         {key} <span>›</span>
                       </div>
                     ))}
                   </div>
                   
                   {/* Right Content */}
                   <div className="mega-menu-content">
                     {activeCategory && menuData[activeCategory] ? (
                       <>
                         <div className="mega-content-header">
                           <h4>{menuData[activeCategory].title}</h4>
                           <p>{menuData[activeCategory].description}</p>
                         </div>
                         <div className="mega-grid">
                           {menuData[activeCategory].items.map((item, idx) => (
                             <Link to={item.link} key={idx} className="mega-product-card" onClick={() => setIsMegaMenuOpen(false)}>
                                <div className="mega-img-box">
                                  <img src={getImageUrl(item.image)} alt={item.name} />
                                </div>
                                <span>{item.name}</span>
                             </Link>
                           ))}
                         </div>
                       </>
                     ) : (
                       <div style={{padding:'2rem', color:'#64748b'}}>No products in this category.</div>
                     )}
                   </div>
                 </div>
               </div>
               
               <Link to="/resources" className="project-nav-link">Resources</Link>
               <a href="#contact" className="btn-primary-small">Get in Touch</a>
             </div>
 
             {/* MOBILE HAMBURGER */}
             <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
               {isMobileMenuOpen ? '✕' : '☰'}
             </button>
         </div>

         {/* MOBILE MENU OVERLAY */}
         {isMobileMenuOpen && (
            <div className="mobile-menu-wrapper">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="mobile-link">Home</Link>
                
                {/* Solutions Accordion */}
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <div 
                        onClick={() => setMobileSolutionsExpanded(!mobileSolutionsExpanded)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                    >
                        Solutions <span>{mobileSolutionsExpanded ? '▴' : '▾'}</span>
                    </div>
                    {mobileSolutionsExpanded && (
                        <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                            {solutionsList.map((sol, i) => (
                                <Link 
                                    key={i} 
                                    to={sol.link} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{ display: 'block', padding: '0.5rem 0', fontSize: '0.95rem', color: '#475569', textDecoration: 'none', borderBottom: i !== solutionsList.length -1 ? '1px solid #e2e8f0' : 'none' }}
                                >
                                    • {sol.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* DYNAMIC PRODUCTS ACCORDION (Mobile) */}
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <div 
                        onClick={() => setMobileProductExpanded(!mobileProductExpanded)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                    >
                        Products <span>{mobileProductExpanded ? '▴' : '▾'}</span>
                    </div>
                    {mobileProductExpanded && (
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            {Object.keys(menuData).length > 0 ? (
                                Object.keys(menuData).map((categoryKey) => (
                                    <div key={categoryKey} style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', marginBottom:'0.5rem' }}>{categoryKey}</div>
                                        {menuData[categoryKey].items.map((item, i) => (
                                            <Link 
                                                key={i} 
                                                to={item.link} 
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                style={{ display: 'block', padding: '0.25rem 0', fontSize: '0.95rem', color: '#475569', textDecoration: 'none' }}
                                            >
                                                • {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                <div style={{color:'#94a3b8', fontSize:'0.9rem'}}>Loading products...</div>
                            )}
                        </div>
                    )}
                </div>

                <Link to="/resources" onClick={() => setIsMobileMenuOpen(false)} className="mobile-link">Resources</Link>
                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary" style={{ textAlign: 'center', marginTop: '1rem', display:'block' }}>Get in Touch</a>
            </div>
         )}
      </header>

      {/* MAIN CONTENT */}
      <div className="container" style={{paddingTop: '8rem', paddingBottom: '5rem'}}>
        
        {/* HERO SECTION */}
        <div className="product-hero-section">
          <div className="product-text-side">
            <span className="product-badge">{product.category || 'Product'}</span>
            <h1 className="product-title">{product.name}</h1>
            <p className="product-tagline">{product.tagline}</p>
            <p className="product-desc">{product.description}</p>
            
            <div style={{marginTop:'2rem'}}>
               <button className="btn-primary">Request Quote / Info</button>
            </div>
          </div>

          <div className="product-image-side">
             <img src={getImageUrl(product.image)} alt={product.name} />
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="product-details-grid">
           {/* Features */}
           <div className="features-container">
              <h3>Key Features</h3>
              <div style={{marginTop:'1.5rem'}}>
                {product.features && product.features.length > 0 ? (
                    product.features.map((f, i) => (
                      <div key={i} className="feature-list-item">
                        <div className="check-icon">{f.icon || '✓'}</div>
                        <span>{f.title}</span>
                      </div>
                    ))
                ) : (
                    <p style={{color:'#64748b'}}>No specific features listed.</p>
                )}
              </div>
           </div>

           {/* Specifications */}
           <div className="specs-container">
              <h3>Technical Specs</h3>
              <div className="specs-box">
                {product.specifications && product.specifications.length > 0 ? (
                    product.specifications.map((spec, idx) => (
                       <div key={idx} className="spec-row">
                          <span className="spec-key">{spec.spec_key}</span>
                          <span className="spec-val">{spec.spec_value}</span>
                       </div>
                    ))
                ) : (
                    <div className="spec-row">
                        <span className="spec-key">Details</span>
                        <span className="spec-val">Contact us for full specifications</span>
                    </div>
                )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProductOverview;