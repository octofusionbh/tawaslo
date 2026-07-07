import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Root-level safety net: if any page throws during render, show a recoverable
// card instead of a blank white screen. Also lets the user reset to a safe page
// (a bad persisted page in sessionStorage can otherwise crash on every reload).
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error: error };
  }
  componentDidCatch(error, info) {
    try { console.error('Tawaslo crash:', error, info && info.componentStack); } catch (e) {}
  }
  handleReset() {
    try { sessionStorage.removeItem('tw_page'); } catch (e) {}
    try { window.location.href = '/'; } catch (e) { window.location.reload(); }
  }
  render() {
    if (!this.state.error) return this.props.children;
    var err = this.state.error;
    var msg = (err && (err.message || String(err))) || 'Unknown error';
    var stack = (err && err.stack) || '';
    return (
      React.createElement('div', { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0E14', color: '#E8EFF8', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24 } },
        React.createElement('div', { style: { maxWidth: 520, width: '100%', background: '#131824', border: '1px solid #232B38', borderRadius: 16, padding: '28px 26px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' } },
          React.createElement('div', { style: { fontSize: 26, marginBottom: 6 } }, '🐙'),
          React.createElement('div', { style: { fontSize: 19, fontWeight: 700, marginBottom: 8 } }, 'Something went wrong on this page'),
          React.createElement('div', { style: { fontSize: 13.5, color: '#9DB0C7', lineHeight: 1.55, marginBottom: 18 } }, 'The rest of Tawaslo is fine — this one screen hit an error. Reload to try again, or reset to your dashboard.'),
          React.createElement('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 } },
            React.createElement('button', { onClick: function () { window.location.reload(); }, style: { padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#5B8DEF,#7C5CFF)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' } }, 'Reload'),
            React.createElement('button', { onClick: this.handleReset.bind(this), style: { padding: '10px 18px', borderRadius: 10, border: '1px solid #2B3546', background: '#1A2130', color: '#E8EFF8', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' } }, 'Reset to dashboard')
          ),
          React.createElement('details', { style: { fontSize: 11.5, color: '#7C8CA6' } },
            React.createElement('summary', { style: { cursor: 'pointer', userSelect: 'none' } }, 'Technical details'),
            React.createElement('div', { style: { marginTop: 8, padding: 12, background: '#0B0E14', border: '1px solid #232B38', borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'ui-monospace, Menlo, monospace', maxHeight: 240, overflow: 'auto' } },
              React.createElement('div', { style: { color: '#FF8080', marginBottom: 6 } }, msg),
              stack
            )
          )
        )
      )
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(RootErrorBoundary, null, React.createElement(App, null))
);

reportWebVitals();
