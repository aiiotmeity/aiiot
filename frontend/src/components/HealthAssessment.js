import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/HealthAssessment.css';
import logoImage from '../assets/aqi.webp'; 

function HealthAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState({
    age_group: '',
    gender: '',
    respiratory_conditions: [],
    smoking_history: '',
    living_environment: [],
    common_symptoms: [],
    occupational_exposure: '',
    medical_history: []
  });
  const [healthScore, setHealthScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://airaware-app-gcw7.onrender.com' 
    : 'http://localhost:8000';

  // Get username from localStorage or session
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUsername(user.name || 'User');
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Check if user has a completed assessment when the page loads
  useEffect(() => {
    const checkAssessmentStatus = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUsername = user.name;

      if (currentUsername && currentUsername !== 'User') {
        try {
          const response = await fetch(`${API_BASE_URL}/api/health-assessment-status/?username=${currentUsername}`);
          const data = await response.json();
          if (response.ok) {
            setHasCompletedAssessment(data.has_assessment);
          }
        } catch (error) {
          console.error('Failed to check health assessment status:', error);
        }
      }
    };

    checkAssessmentStatus();
  }, [API_BASE_URL]);

  // Optimized particles with reduced count
  const particles = useMemo(() => {
    const particleElements = [];
    for (let i = 0; i < 15; i++) { // Reduced from 20
      particleElements.push(
        <div
          key={i}
          className="floating-particle"
          style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 4 + 's',
            animationDuration: (Math.random() * 2 + 3) + 's'
          }}
        />
      );
    }
    return particleElements;
  }, []);

  const questions = [
    {
      id: 'age_group',
      title: 'What is your age group?',
      subtitle: 'Age affects air quality sensitivity',
      icon: '👤',
      color: '#3b82f6',
      type: 'radio',
      options: [
        { value: '0-12 years', label: '0-12 years', icon: '🧒' },
        { value: '13-18 years', label: '13-18 years', icon: '🎓' },
        { value: '19-40 years', label: '19-40 years', icon: '👔' },
        { value: '41-60 years', label: '41-60 years', icon: '👨' },
        { value: '61 years and above', label: '61 years and above', icon: '👴' }
      ]
    },
    {
      id: 'gender',
      title: 'What is your gender?',
      subtitle: 'Gender can influence health risk factors',
      icon: '⚧️',
      color: '#8b5cf6',
      type: 'radio',
      options: [
        { value: 'Male', label: 'Male', icon: '♂️' },
        { value: 'Female', label: 'Female', icon: '♀️' },
        { value: 'Other', label: 'Other', icon: '⚧️' },
        { value: 'Prefer not to say', label: 'Prefer not to say', icon: '🤐' }
      ]
    },
    {
      id: 'respiratory_conditions',
      title: 'Do you have any respiratory conditions?',
      subtitle: 'Respiratory health affects air quality sensitivity',
      icon: '🫁',
      color: '#ef4444',
      type: 'checkbox',
      options: [
        { value: 'Asthma', label: 'Asthma', icon: '💨' },
        { value: 'COPD', label: 'COPD', icon: '🫁' },
        { value: 'Chronic Bronchitis', label: 'Chronic Bronchitis', icon: '🦠' },
        { value: 'Emphysema', label: 'Emphysema', icon: '🫁' },
        { value: 'None', label: 'None of the above', icon: '✅' }
      ]
    },
    {
      id: 'smoking_history',
      title: 'Smoking History',
      subtitle: 'Smoking significantly impacts respiratory health',
      icon: '🚬',
      color: '#f59e0b',
      type: 'radio',
      options: [
        { value: 'Never smoked', label: 'Never smoked', icon: '🚫' },
        { value: 'Former smoker', label: 'Former smoker', icon: '⏰' },
        { value: 'Current smoker', label: 'Current smoker', icon: '🚬' },
        { value: 'Exposed to secondhand smoke', label: 'Exposed to secondhand smoke', icon: '☁️' }
      ]
    },
    {
      id: 'living_environment',
      title: 'Living Environment',
      subtitle: 'Your environment affects daily air quality exposure',
      icon: '🏙️',
      color: '#10b981',
      type: 'checkbox',
      options: [
        { value: 'Urban area', label: 'Urban area with heavy traffic', icon: '🏙️' },
        { value: 'Industrial zone', label: 'Near industrial zone', icon: '🏭' },
        { value: 'Rural area', label: 'Rural area', icon: '🌳' },
        { value: 'Coastal area', label: 'Coastal area', icon: '🌊' }
      ]
    },
    {
      id: 'common_symptoms',
      title: 'Common Symptoms',
      subtitle: 'Current symptoms that may be air quality related',
      icon: '💓',
      color: '#f43f5e',
      type: 'checkbox',
      options: [
        { value: 'Frequent coughing', label: 'Frequent coughing', icon: '🤧' },
        { value: 'Shortness of breath', label: 'Shortness of breath', icon: '😮‍💨' },
        { value: 'Wheezing', label: 'Wheezing', icon: '💨' },
        { value: 'Chest tightness', label: 'Chest tightness', icon: '🫸' },
        { value: 'None', label: 'None of the above', icon: '😊' }
      ]
    },
    {
      id: 'occupational_exposure',
      title: 'Occupational Exposure',
      subtitle: 'Work environment affects daily exposure to pollutants',
      icon: '💼',
      color: '#6366f1',
      type: 'radio',
      options: [
        { value: 'Construction/Mining', label: 'Construction/Mining', icon: '⛑️' },
        { value: 'Chemical Industry', label: 'Chemical Industry', icon: '🧪' },
        { value: 'Healthcare', label: 'Healthcare', icon: '👩‍⚕️' },
        { value: 'Agriculture', label: 'Agriculture', icon: '🌱' },
        { value: 'Office Environment', label: 'Office Environment', icon: '🏢' },
        { value: 'Other', label: 'Other', icon: '📋' }
      ]
    },
    {
      id: 'medical_history',
      title: 'Medical History',
      subtitle: 'Existing conditions that may increase air quality sensitivity',
      icon: '📋',
      color: '#ec4899',
      type: 'checkbox',
      options: [
        { value: 'Hypertension', label: 'Hypertension', icon: '💓' },
        { value: 'Diabetes', label: 'Diabetes', icon: '💉' },
        { value: 'Heart Disease', label: 'Heart Disease', icon: '❤️' },
        { value: 'Allergies', label: 'Allergies', icon: '🤧' },
        { value: 'Immunocompromised', label: 'Immunocompromised', icon: '🛡️' },
        { value: 'None of the above', label: 'None of the above', icon: '✅' }
      ]
    }
  ];

  // FIXED: Simplified and improved option change handler
  const handleOptionChange = (questionId, value, isCheckbox = false) => {
    if (isCheckbox) {
      setFormData(prev => {
        const currentValues = prev[questionId] || [];
        
        if (value === 'None' || value === 'None of the above') {
          // If "None" is selected, clear all other selections or toggle off
          return {
            ...prev,
            [questionId]: currentValues.includes(value) ? [] : [value]
          };
        } else {
          // Remove "None" if present and toggle the selected value
          const filteredValues = currentValues.filter(v => v !== 'None' && v !== 'None of the above');
          
          if (filteredValues.includes(value)) {
            // Remove the value if already selected
            return {
              ...prev,
              [questionId]: filteredValues.filter(v => v !== value)
            };
          } else {
            // Add the value
            return {
              ...prev,
              [questionId]: [...filteredValues, value]
            };
          }
        }
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const isQuestionAnswered = (questionIndex) => {
    const question = questions[questionIndex];
    const value = formData[question.id];
    
    if (question.type === 'checkbox') {
      return Array.isArray(value) && value.length > 0;
    } else {
      return value !== '';
    }
  };

  const nextQuestion = () => {
    if (isQuestionAnswered(currentQuestion)) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setError('');
      }
    } else {
      setError('Please select an option before proceeding');
      setTimeout(() => setError(''), 3000);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setError('');
    }
  };

  const calculateHealthScore = () => {
    let score = 0;

    // Age Group scoring
    const ageScores = {
      "0-12 years": 5,
      "13-18 years": 8,
      "19-40 years": 10,
      "41-60 years": 15,
      "61 years and above": 20
    };
    score += ageScores[formData.age_group] || 0;

    // Gender scoring
    score += formData.gender === "Male" ? 2 : 1;

    // Respiratory conditions
    if (formData.respiratory_conditions && !formData.respiratory_conditions.includes("None")) {
      score += formData.respiratory_conditions.length * 3;
    }

    // Smoking history
    const smokingScores = {
      "Never smoked": 0,
      "Former smoker": 10,
      "Current smoker": 25,
      "Exposed to secondhand smoke": 8
    };
    score += smokingScores[formData.smoking_history] || 0;

    // Living environment
    const environmentScores = {
      "Urban area": 10,
      "Industrial zone": 15,
      "Rural area": 3,
      "Coastal area": 2
    };
    if (formData.living_environment) {
      formData.living_environment.forEach(env => {
        score += environmentScores[env] || 0;
      });
    }

    // Common symptoms
    const symptomScores = {
      "Frequent coughing": 8,
      "Shortness of breath": 10,
      "Wheezing": 8,
      "Chest tightness": 9
    };
    if (formData.common_symptoms) {
      formData.common_symptoms.forEach(symptom => {
        score += symptomScores[symptom] || 0;
      });
    }

    // Occupational exposure
    const occupationScores = {
      "Construction/Mining": 15,
      "Chemical Industry": 15,
      "Healthcare": 8,
      "Agriculture": 10,
      "Office Environment": 3,
      "Other": 5
    };
    score += occupationScores[formData.occupational_exposure] || 0;

    // Medical history
    const conditionScores = {
      "Hypertension": 8,
      "Diabetes": 8,
      "Heart Disease": 10,
      "Allergies": 5,
      "Immunocompromised": 12
    };
    if (formData.medical_history) {
      formData.medical_history.forEach(condition => {
        score += conditionScores[condition] || 0;
      });
    }

    return score;
  };

  const getHealthStatus = (score) => {
    if (score <= 50) {
      return {
        status: 'Excellent Health',
        color: '#10b981',
        bgColor: '#d1fae5',
        message: 'You are in excellent health. Keep up your healthy lifestyle!'
      };
    } else if (score <= 80) {
      return {
        status: 'Good Health',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
        message: 'You are in good health. Continue to maintain your current lifestyle.'
      };
    } else if (score <= 120) {
      return {
        status: 'Moderate Risk',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        message: 'Some areas need attention. Consider improving your health habits.'
      };
    } else if (score <= 150) {
      return {
        status: 'Warning',
        color: '#f97316',
        bgColor: '#fed7aa',
        message: 'Some areas require serious attention. We recommend consulting a healthcare professional.'
      };
    } else if (score <= 200) {
      return {
        status: 'High Risk',
        color: '#ef4444',
        bgColor: '#fee2e2',
        message: 'High health risks detected. Please seek immediate medical advice.'
      };
    } else {
      return {
        status: 'Critical Risk',
        color: '#dc2626',
        bgColor: '#fef2f2',
        message: 'Severe health risks detected. Immediate medical intervention is necessary.'
      };
    }
  };

  const handleSubmit = async () => {
    if (!isQuestionAnswered(currentQuestion)) {
      setError('Please answer all questions before submitting');
      return;
    }

    setLoading(true);
    setError('');
    setSaveStatus('Saving...');

    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser || !storedUser.user_id) {
      setError('Could not identify user. Please log in again.');
      setLoading(false);
      setSaveStatus('❌ Save failed');
      return;
    }

    try {
      const score = calculateHealthScore();
      
      const payload = {
        ...formData,
        health_score: score,
        user_id: storedUser.user_id,
      };
      
      console.log('Sending data with user_id:', payload);

      const response = await fetch(`${API_BASE_URL}/api/health-assessment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setHealthScore(score);
        setSaveStatus('✅ Saved successfully!');
        setShowResult(true);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 4000);
      } else {
        setError(data.error || 'Failed to save health assessment');
        setSaveStatus('❌ Save failed');
      }
    } catch (err) {
      console.error('Network error details:', err);
      const errorMessage = 'Network error or server issue. Please try again.';
      setError(errorMessage);
      setSaveStatus('❌ Network error');
      
      // The timeout you added is correct
      setTimeout(() => {
        setError('');
      }, 2000);
      
    } finally {
      setLoading(false);
    }
  }; 


  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  if (showResult) {
    const healthStatus = getHealthStatus(healthScore);
    
    return (
      <div className="health-assessment-page">
        <div className="floating-particles">
          {particles}
        </div>
        
        <div className="navbar">
          <div className="navbar-content">
            <Link to="/" className="navbar-brand">
              <img src={logoImage} alt="AQM Logo" width={isMobileView ? "26" : "32"} height={isMobileView ? "26" : "32"} />
              AirAware
            </Link>
          </div>
        </div>

        <div className="container">
          <div className="result-container">
            <div className="result-header">
              <div className="success-animation">
                <div className="checkmark-circle">
                  <div className="checkmark">✓</div>
                </div>
              </div>
              <h1>Assessment Complete!</h1>
              <p>Hello, {username}! Your health assessment has been saved successfully.</p>
            </div>

            <div className="health-score-display" style={{ background: healthStatus.bgColor }}>
              <div className="score-circle" style={{ background: `conic-gradient(${healthStatus.color} ${(healthScore/250)*100}%, #e5e7eb ${(healthScore/250)*100}%)` }}>
                <div className="score-inner-circle">
                  <div className="score-number">{healthScore}</div>
                  <div className="score-label">Health Score</div>
                </div>
              </div>
              <div className="health-status-info">
                <h2>Your Health Score: {healthScore}</h2>
                <div className="health-status" style={{ color: healthStatus.color }}>
                  {healthStatus.status}
                </div>
                <p className="health-message">{healthStatus.message}</p>
              </div>
            </div>

            <div className="save-status">
              {saveStatus}
            </div>

            <div className="redirect-message">
              <div className="countdown-circle">
                ⏰
              </div>
              <p>Redirecting to your dashboard in 4 seconds...</p>
            </div>

            <div className="action-buttons">
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                <span>📊</span>
                Go to Dashboard Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <div className="health-assessment-page">
      <div className="floating-particles">
        {particles}
      </div>
      
      <div className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <img src={logoImage} alt="AQM Logo" width={isMobileView ? "26" : "32"} height={isMobileView ? "26" : "32"} />
            AirAware
          </Link>
        </div>
      </div>

      <div className="container">
        <div className="header">
          <div className="header-content">
            <div className="header-icon">
              📋
            </div>
            <h1>Health Assessment Questionnaire</h1>
            <p><Link to="/">🏠 Home</Link></p>
            <p>Hello, {username}! Let's evaluate your health status for personalized air quality recommendations.</p>
          </div>
          
          <div className="back-button-container">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="back-button"
              disabled={!hasCompletedAssessment}
              title={!hasCompletedAssessment ? "Please complete the assessment to view your profile" : "Back to Profile"}
            >
              <span>←</span>
              Back to Profile
            </button>
          </div>
        </div>

        <div className="progress-container">
          <div className="progress-header">
            <div className="progress-stats">
              <span className="progress-label">Your Progress</span>
              <span className="progress-count">{currentQuestion + 1}/{questions.length} Questions</span>
            </div>
            <div className="progress-percentage">{Math.round(progressPercentage)}%</div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ 
                width: `${progressPercentage}%`,
                background: `linear-gradient(90deg, ${currentQuestionData.color}, ${currentQuestionData.color}aa)`
              }}
            ></div>
          </div>
        </div>

        <div className="question-container">
          <div className="question active">
            <div className="question-header">
              <div className="question-icon" style={{ background: `${currentQuestionData.color}20`, color: currentQuestionData.color }}>
                <span style={{ fontSize: '20px' }}>{currentQuestionData.icon}</span>
              </div>
              <div className="question-text">
                <h3>{currentQuestionData.title}</h3>
                <p className="question-subtitle">{currentQuestionData.subtitle}</p>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="options">
              {currentQuestionData.options.map((option, index) => {
                const isSelected = currentQuestionData.type === 'checkbox'
                  ? (formData[currentQuestionData.id] || []).includes(option.value)
                  : formData[currentQuestionData.id] === option.value;

                return (
                  <div
                    key={option.value}
                    className={`${currentQuestionData.type === 'checkbox' ? 'checkbox-option' : 'option'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleOptionChange(currentQuestionData.id, option.value, currentQuestionData.type === 'checkbox')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOptionChange(currentQuestionData.id, option.value, currentQuestionData.type === 'checkbox');
                      }
                    }}
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="option-icon">
                      {option.icon}
                    </div>
                    <input
                      type={currentQuestionData.type === 'checkbox' ? 'checkbox' : 'radio'}
                      id={`${currentQuestionData.id}-${option.value}`}
                      name={currentQuestionData.id}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent onClick
                      tabIndex={-1} // Remove from tab order, parent div handles focus
                    />
                    <label htmlFor={`${currentQuestionData.id}-${option.value}`}>
                      {option.label}
                    </label>
                    {isSelected && (
                      <div className="option-checkmark">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="navigation">
              <button
                type="button"
                className="nav-button prev-button"
                onClick={prevQuestion}
                style={{ 
                  display: currentQuestion === 0 ? 'none' : 'flex'
                }}
              >
                <span>←</span>
                Previous
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  type="button"
                  className="nav-button next-button"
                  onClick={nextQuestion}
                  style={{ 
                    background: currentQuestionData.color
                  }}
                >
                  Next
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="nav-button submit-button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ 
                    background: loading ? '#94a3b8' : '#10b981',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <>
                      <span>🔄</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      Submit Assessment
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthAssessment;