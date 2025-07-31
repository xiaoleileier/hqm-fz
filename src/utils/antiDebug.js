
import { SECURITY_CONFIG } from './baseConfig';


export const initAntiDebug = () => {
  if (!SECURITY_CONFIG.enableAntiDebugging) {
    return;
  }
  
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }
    
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      return false;
    }
  }, { capture: true });
  
  
    
      
    
      
      
      
      
    
      
    
  
}; 
