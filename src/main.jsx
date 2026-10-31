import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
class ErrorBoundary extends React.Component{state={error:null};static getDerivedStateFromError(error){return{error};}render(){if(this.state.error)return <div className="fatal"><h1>Let’s get the studio back.</h1><p>Your work is saved on this Mac. Reload the page to continue.</p><button onClick={()=>location.reload()}>Reload studio</button><details><summary>Details</summary>{this.state.error.message}</details></div>;return this.props.children;}}
createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>);
