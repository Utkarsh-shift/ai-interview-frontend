import React  from 'react';
// import PropsTypes from 'prop-types'
interface MultipleMonitorsDetectedProps {
    isOpen: boolean;
  }
  
  const MultipleMonitorsDetected: React.FC<MultipleMonitorsDetectedProps> = ({ isOpen }) => {
    if (!isOpen) {
      return null;
    }
  
 
  return (
    <div className="cont_temaninouter">
      <div className="cmny_pupop custom-popup-overlay full_scren ">
        <div className="custom-popup">
          <div className="full_scren_cnt">
            <h3>Multiple Monitors Detected</h3>
            <p>
              We have detected multiple monitors. Please disconnect the extra
              monitor (or devices like Chromecast).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default MultipleMonitorsDetected;