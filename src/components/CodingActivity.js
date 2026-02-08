import React, { useEffect, useState } from 'react';
import {ActivityCalendar} from 'react-activity-calendar';
import { Tooltip } from 'react-tooltip';
import { FaCode, FaGithub } from 'react-icons/fa';
import './CodingActivity.css';

const CodingActivity = () => {
  const [leetcodeData, setLeetcodeData] = useState(null);

  useEffect(() => {
    // Fetch LeetCode stats
    fetch('https://leetcode-stats-api.herokuapp.com/kasivisu3109')
      .then(response => response.json())
      .then(data => setLeetcodeData(data))
      .catch(err => console.error("Error fetching LeetCode data:", err));
  }, []);

  // Theme for GitHub Calendar (Red Palette)
  const theme = {
    light: ['#ebedf0', '#fee2e2', '#fca5a5', '#ef4444', '#b91c1c'],
    dark: ['#161b22', '#3a0c0c', '#7f1d1d', '#b91c1c', '#ef4444'],
  };

  return (
    <section className="coding-activity-section">
      <h2 className="section-title">
        <div className="title-text">
          <span className="section-title-accent">C</span>oding Activity
        </div>
      </h2>
      
      <div className="activity-grid">
        {/* LeetCode Stats Card */}
        <div className="activity-card leetcode-card">
          <div className="card-header">
            <h3><FaCode /> LeetCode Stats</h3>
          </div>
          
          {leetcodeData ? (
             <div className="leetcode-stats">
               <div className="stat-circle">
                 <span className="total-solved">{leetcodeData.totalSolved}</span>
                 <span className="label">Solved</span>
               </div>
               <div className="stat-bars">
                 <div className="stat-row">
                   <span className="difficulty easy">Easy</span>
                   <div className="progress-bar">
                     <div 
                       className="progress-fill easy-fill" 
                       style={{ width: `${(leetcodeData.easySolved / leetcodeData.totalEasy) * 100}%` }}
                     ></div>
                   </div>
                   <span className="count">{leetcodeData.easySolved}</span>
                 </div>
                 <div className="stat-row">
                   <span className="difficulty medium">Medium</span>
                   <div className="progress-bar">
                     <div 
                       className="progress-fill medium-fill" 
                       style={{ width: `${(leetcodeData.mediumSolved / leetcodeData.totalMedium) * 100}%` }}
                     ></div>
                   </div>
                   <span className="count">{leetcodeData.mediumSolved}</span>
                 </div>
                 <div className="stat-row">
                   <span className="difficulty hard">Hard</span>
                   <div className="progress-bar">
                     <div 
                       className="progress-fill hard-fill" 
                       style={{ width: `${(leetcodeData.hardSolved / leetcodeData.totalHard) * 100}%` }}
                     ></div>
                   </div>
                   <span className="count">{leetcodeData.hardSolved}</span>
                 </div>
               </div>
             </div>
          ) : (
            <p className="loading-text">Loading...</p>
          )}
        </div>

        {/* GitHub Calendar Card *
        <div className="activity-card github-card">
          <div className="card-header">
             <h3><FaGithub /> GitHub Contributions</h3>
          </div>
          
          <div className="calendar-wrapper">
             <ActivityCalendar 
               username="kasivisu4" 
               colorScheme="light"
               theme={theme}
               fontSize={12}
               blockSize={12}
               blockMargin={4}
               renderBlock={(block, activity) => React.cloneElement(block, {
                  'data-tooltip-id': 'github-tooltip',
                  'data-tooltip-content': `${activity.count} contributions on ${activity.date}`,
                })}
             />
             <Tooltip id="github-tooltip" />
          </div>
        </div>
              */}
      </div>

    </section>
  );
};

export default CodingActivity;
