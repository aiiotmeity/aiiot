import React, { useEffect, useState } from 'react';

function HomePage() {
  const [homeData, setHomeData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/home/')
      .then(res => res.json())
      .then(setHomeData);
  }, []);

  if (!homeData) return <div>Loading...</div>;

  return (
    <div>
      <h1>{homeData.message}</h1>
      <p>Current AQI: {homeData.aqi}</p>
      <p>Status: {homeData.status}</p>
    </div>
  );
}

export default HomePage;