/**
 * Lightweight Web Analytics Tracking Snippet
 * 
 * This script collects and reports web vitals, pageviews, and custom events
 * to a self-hosted analytics endpoint.
 */

(function() {
  // Configuration
  const config = {
    endpoint: '/api/track',
    eventsEndpoint: '/api/events',
    sessionDuration: 30 * 60 * 1000, // 30 minutes
    reportWebVitals: true
  };

  // Generate or retrieve session ID
  function getSessionId() {
    let sessionId = localStorage.getItem('lwa_session_id');
    const sessionTimestamp = localStorage.getItem('lwa_session_timestamp');
    const now = Date.now();
    
    // Create new session if none exists or if expired
    if (!sessionId || !sessionTimestamp || now - parseInt(sessionTimestamp, 10) > config.sessionDuration) {
      sessionId = generateId();
      localStorage.setItem('lwa_session_id', sessionId);
      localStorage.setItem('lwa_session_timestamp', now.toString());
    } else {
      // Update timestamp for existing session
      localStorage.setItem('lwa_session_timestamp', now.toString());
    }
    
    return sessionId;
  }
  
  // Generate random ID
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Send data to analytics endpoint
  function sendBeacon(url, data) {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) {
        return;
      }
    }
    
    // Fallback to fetch if sendBeacon fails or is not available
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      // Use keepalive to ensure the request completes even if the page unloads
      keepalive: true
    }).catch(err => {
      // Silent fail - we don't want to affect user experience
      console.debug('Analytics error:', err);
    });
  }
  
  // Track pageview
  function trackPageview() {
    const sessionId = getSessionId();
    const timestamp = Date.now();
    const pageUrl = window.location.pathname + window.location.search;
    const referrer = document.referrer;
    const userAgent = navigator.userAgent;
    
    const data = {
      sessionId,
      timestamp,
      pageUrl,
      referrer,
      userAgent,
      webVitals: [] // Will be populated later if reportWebVitals is true
    };
    
    // Send pageview data
    sendBeacon(config.endpoint, data);
    
    // Store data for web vitals reporting
    if (config.reportWebVitals) {
      window.__LWA_DATA = {
        sessionId,
        pageUrl,
        timestamp
      };
    }
  }
  
  // Track custom event
  window.lwaTrackEvent = function(eventName, eventData) {
    if (!eventName) {
      console.error('Event name is required');
      return;
    }
    
    const sessionId = getSessionId();
    const timestamp = Date.now();
    const pageUrl = window.location.pathname + window.location.search;
    
    const data = {
      sessionId,
      timestamp,
      pageUrl,
      eventName,
      eventData
    };
    
    // Send event data
    sendBeacon(config.eventsEndpoint, data);
  };
  
  // Report web vitals
  function reportWebVital(metric) {
    if (!window.__LWA_DATA) {
      return;
    }
    
    const { name, value, rating } = metric;
    const { sessionId, pageUrl } = window.__LWA_DATA;
    const timestamp = Date.now();
    
    const data = {
      sessionId,
      timestamp,
      pageUrl,
      userAgent: navigator.userAgent,
      webVitals: [{
        name,
        value,
        rating
      }]
    };
    
    // Send web vital data
    sendBeacon(config.endpoint, data);
  }
  
  // Initialize tracking
  function init() {
    // Track initial pageview
    trackPageview();
    
    // Set up web vitals reporting
    if (config.reportWebVitals && typeof window !== 'undefined') {
      import('web-vitals').then(({ onLCP, onFID, onCLS, onFCP, onTTFB }) => {
        onLCP(reportWebVital);
        onFID(reportWebVital);
        onCLS(reportWebVital);
        onFCP(reportWebVital);
        onTTFB(reportWebVital);
      });
    }
  }
  
  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
