// opif-field-mapping-guide.js
// Information guide for TPMs/PMs on OPIF field mapping

const opifFieldMapping = {
  title: 'OPIF Field Mapping Guide',
  subtitle: 'How to Update Your OPIF to Appear in the E2E Fashion Portal',
  
  sections: [
    {
      id: 'requirements',
      title: '✅ Requirements for Portal Inclusion',
      icon: '📋',
      content: `
        <div class="requirement-box">
          <h3>Primary Requirement: LLTT Label</h3>
          <p class="highlight-text">Your OPIF <strong>MUST</strong> include the label <code>LLTT</code> to appear in this portal.</p>
          <p>This is the primary filter that determines whether an OPIF is tracked in the E2E Fashion Portal.</p>
          
          <div class="how-to-add">
            <h4>How to Add the LLTT Label:</h4>
            <ol>
              <li>Open your OPIF in Jira</li>
              <li>Look for the "Labels" field (usually in the right sidebar)</li>
              <li>Click "+ Add" or click on the Labels field</li>
              <li>Type <code>LLTT</code> and press Enter</li>
              <li>Save the OPIF</li>
            </ol>
          </div>
        </div>
      `
    },
    
    {
      id: 'field-mapping',
      title: '🗺️ Field Mapping Reference',
      icon: '📊',
      content: `
        <div class="mapping-table">
          <table class="field-mapping-table">
            <thead>
              <tr>
                <th>Portal Field</th>
                <th>OPIF/Jira Field</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Card Title</strong></td>
                <td><code>OPIF Epic Name</code></td>
                <td>The main title/summary of your OPIF</n              </tr>
              <tr>
                <td><strong>Status</strong></td>
                <td><code>Status Color</code> + <code>Ready to Start Field</code></td>
                <td>Combination creates status like "Yellow — Ready to Start"</td>
              </tr>
              <tr>
                <td><strong>Primary Owner</strong></td>
                <td><code>Assignee</code> (should match <code>Product Manager</code>)</td>
                <td>Main person responsible for the OPIF</td>
              </tr>
              <tr>
                <td><strong>Software Lead</strong></td>
                <td><code>Engineering Lead</code></td>
                <td>Technical lead for implementation</td>
              </tr>
              <tr>
                <td><strong>Target Date</strong></td>
                <td><code>Due Date</code></td>
                <td>Expected completion date for the OPIF</td>
              </tr>
              <tr style="background:#eff6ff;">
                <td><strong>Update (Last 14 Days)</strong> <span style="font-size:0.75em;background:#0053e2;color:white;border-radius:4px;padding:1px 6px;margin-left:4px;">WPR</span></td>
                <td><code>Status Remarks</code></td>
                <td>Free-text narrative on the Confluence LLTT Dashboard — auto-pulled into the WPR "Update" column on every sync. Lead with a date stamp (e.g. <em>7-Apr-2026 – ...</em>) for clarity.</td>
              </tr>
              <tr>
                <td><strong>Workstream</strong></td>
                <td><code>Activity Type</code></td>
                <td>Determines portal section (Strategy, Design, Buying, Allocation)</td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    },
    
    {
      id: 'status-remarks',
      title: '📝 Status Remarks → WPR Update Column',
      icon: '📝',
      content: `
        <div class="status-remarks-guide">
          <div class="callout-box callout-blue">
            <span class="callout-icon">🔄</span>
            <div>
              <strong>Auto-synced field:</strong> The <code>Status Remarks</code> field in your OPIF is automatically
              pulled into the <strong>"Update (Last 14 Days)"</strong> column of the Weekly Program Review table.
              You do not need to update the portal manually — just keep your OPIF up to date.
            </div>
          </div>

          <h3>What is Status Remarks?</h3>
          <p>
            <code>Status Remarks</code> is a free-text field on the
            <a href="https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard" target="_blank">Confluence LLTT Dashboard</a>.
            It is the primary narrative field TPMs and PMs use to communicate recent progress,
            blockers, and path-to-green notes for their program.
          </p>

          <h3>Where it appears in the portal</h3>
          <div class="remarks-flow">
            <div class="remarks-flow-step">
              <div class="remarks-flow-icon">📋</div>
              <div class="remarks-flow-label">OPIF<br><code>Status Remarks</code></div>
            </div>
            <div class="remarks-flow-arrow">→</div>
            <div class="remarks-flow-step">
              <div class="remarks-flow-icon">🔄</div>
              <div class="remarks-flow-label">e2e-update<br>auto-sync</div>
            </div>
            <div class="remarks-flow-arrow">→</div>
            <div class="remarks-flow-step">
              <div class="remarks-flow-icon">📊</div>
              <div class="remarks-flow-label">WPR Table<br><strong>Update (Last 14 Days)</strong></div>
            </div>
          </div>
          <p style="margin-top:8px;font-size:0.85em;color:#64748b;">
            Only <strong>Critical Program</strong> cards have this field synced today.
            The WPR table shows the composed update for each Critical Program using its primary (and related) OPIF remarks.
          </p>

          <h3>How to write a great Status Remark</h3>
          <div class="best-practices">
            <div class="practice good">
              <span class="practice-icon">✅</span>
              <div>
                <strong>Do</strong> — Lead with a date stamp so the freshness of the update is immediately clear:
                <pre class="example-remark">7-Apr-2026 – Development in progress. IIR scope still being evaluated.
Additional modules added to scope. On track for Apr 30 target.</pre>
              </div>
            </div>
            <div class="practice bad">
              <span class="practice-icon">❌</span>
              <div>
                <strong>Don't</strong> — Leave it as a placeholder or single period:
                <pre class="example-remark">.</pre>
                <p class="practice-note">Placeholder remarks are automatically filtered out and will show as blank in the WPR.</p>
              </div>
            </div>
            <div class="practice good">
              <span class="practice-icon">✅</span>
              <div>
                <strong>Do</strong> — Include a path-to-green note if the program is Yellow/Red:
                <pre class="example-remark">2-Apr-2026 – Timeline pulled in from Aug 27 to Jun 30.
Risk: need finalized technical lead. Path to Green: working with Oscar to identify lead.</pre>
              </div>
            </div>
          </div>

          <h3>Sync timing</h3>
          <p>
            Status Remarks are pulled each time <code>-e2e update</code> runs
            (before every WPR meeting). The column always reflects the latest saved
            value from the Confluence LLTT Dashboard at sync time.
          </p>
        </div>
      `
    },

    {
      id: 'status-logic',
      title: '🚦 Status Logic Explained',
      icon: '⚡',
      content: `
        <div class="status-explanation">
          <h3>How Portal Status is Calculated</h3>
          <p>The status you see on each portal card is a combination of TWO fields in your OPIF:</p>
          
          <div class="field-combo">
            <div class="field-box">
              <h4>Field 1: Status Color</h4>
              <ul>
                <li>🟢 <strong>Green</strong> — On track</li>
                <li>🟡 <strong>Yellow</strong> — At risk / needs attention</li>
                <li>🔴 <strong>Red</strong> — Blocked / critical issues</li>
              </ul>
            </div>
            
            <div class="plus-sign">+</div>
            
            <div class="field-box">
              <h4>Field 2: Ready to Start Field</h4>
              <p class="field-location">Located in the <strong>top header</strong> of OPIF</p>
              <ul>
                <li>Ready to Start</li>
                <li>Cannot Commit</li>
                <li>In Progress</li>
                <li>Blocked</li>
                <li>Backlog</li>
              </ul>
            </div>
          </div>
          
          <div class="result-box">
            <h4>= Portal Status</h4>
            <p>Examples:</p>
            <ul class="status-examples">
              <li><span class="status-badge yellow">Yellow — Ready to Start</span></li>
              <li><span class="status-badge green">Green — In Progress</span></li>
              <li><span class="status-badge red">Red — Blocked</span></li>
              <li><span class="status-badge roadmap">Roadmap — Backlog</span></li>
            </ul>
          </div>
        </div>
      `
    },
    
    {
      id: 'activity-type',
      title: '📍 Activity Type & Workstream Mapping',
      icon: '🎯',
      content: `
        <div class="activity-type-guide">
          <h3>Activity Type Determines Portal Section</h3>
          <p>The <code>Activity Type</code> field in your OPIF determines which workstream section your card appears in:</p>
          
          <div class="workstream-mapping">
            <div class="workstream-item">
              <div class="workstream-header strategy">📊 Strategy</div>
              <p>Activity Types: Planning, Forecasting, Strategic Initiatives</p>
            </div>
            
            <div class="workstream-item">
              <div class="workstream-header design">🎨 Design</div>
              <p>Activity Types: Product Design, UX/UI, Conceptualization</p>
            </div>
            
            <div class="workstream-item">
              <div class="workstream-header buying">🛒 Buying</div>
              <p>Activity Types: Procurement, Vendor Management, Buy Planning</p>
            </div>
            
            <div class="workstream-item">
              <div class="workstream-header allocation">📦 Allocation</div>
              <p>Activity Types: Distribution, Inventory, Allocation Planning</p>
            </div>
          </div>
          
          <div class="note-box">
            <strong>Note:</strong> If Activity Type indicates "Backlog", your OPIF will appear in the Roadmap view regardless of workstream.
          </div>
        </div>
      `
    },
    
    {
      id: 'example',
      title: '📝 Complete Example',
      icon: '💡',
      content: `
        <div class="example-card">
          <h3>Example: AEX - Automated Item Set Up</h3>
          
          <div class="example-split">
            <div class="opif-side">
              <h4>OPIF Fields (Jira)</h4>
              <table class="example-table">
                <tr>
                  <td>Labels</td>
                  <td><code>LLTT</code></td>
                </tr>
                <tr>
                  <td>Epic Name</td>
                  <td>AEX - Automated Item Set Up</td>
                </tr>
                <tr>
                  <td>Status Color</td>
                  <td>🟡 Yellow</td>
                </tr>
                <tr>
                  <td>Ready to Start</td>
                  <td>Ready to Start</td>
                </tr>
                <tr>
                  <td>Assignee</td>
                  <td>Abhishek Jannawar</td>
                </tr>
                <tr>
                  <td>Product Manager</td>
                  <td>Abhishek Jannawar</td>
                </tr>
                <tr>
                  <td>Engineering Lead</td>
                  <td>Aravind Chiruvelli</td>
                </tr>
                <tr>
                  <td>Due Date</td>
                  <td>Apr 30, 2026</td>
                </tr>
                <tr>
                  <td>Activity Type</td>
                  <td>Product Discovery</td>
                </tr>
                <tr style="background:#eff6ff;">
                  <td>Status Remarks</td>
                  <td>7-Apr-2026 – Development in progress. IIR scope still being evaluated. Additional modules added to scope.</td>
                </tr>
              </table>
            </div>
            
            <div class="arrow">→</div>
            
            <div class="portal-side">
              <h4>Portal Card Display</h4>
              <div class="portal-card-preview">
                <div class="card-header">
                  <span class="opif-badge">OPIF-344926</span>
                  <span class="status-badge yellow">Yellow — Ready to Start</span>
                </div>
                <h3 class="card-title">AEX - Automated Item Set Up</h3>
                <div class="card-meta">
                  <div class="meta-item">
                    <span class="meta-label">Owner:</span>
                    <span class="meta-value">Abhishek Jannawar</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Tech Lead:</span>
                    <span class="meta-value">Aravind Chiruvelli</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Target:</span>
                    <span class="meta-value">Apr 30, 2026</span>
                  </div>
                  <div class="meta-item" style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;">
                    <span class="meta-label" style="color:#0053e2;">📝 WPR Update:</span>
                    <span class="meta-value" style="font-style:italic;color:#475569;">7-Apr-2026 – Development in progress. IIR scope still being evaluated…</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    
    {
      id: 'troubleshooting',
      title: '🔧 Troubleshooting',
      icon: '❓',
      content: `
        <div class="troubleshooting">
          <h3>Common Issues & Solutions</h3>
          
          <div class="faq-item">
            <h4>Q: My OPIF isn't showing up in the portal</h4>
            <p><strong>A:</strong> Check the following:</p>
            <ol>
              <li>Verify the <code>LLTT</code> label is added to your OPIF</li>
              <li>Wait 24 hours for the next automated sync</li>
              <li>Ensure your OPIF is in an active status (not Closed/Done)</li>
            </ol>
          </div>
          
          <div class="faq-item">
            <h4>Q: The WPR "Update (Last 14 Days)" column is blank for my program</h4>
            <p><strong>A:</strong> The update column is driven by the <code>Status Remarks</code> field on the Confluence LLTT Dashboard. Check the following:</p>
            <ol>
              <li>Open the <a href="https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard" target="_blank">LLTT Dashboard</a> and find your OPIF row</li>
              <li>Locate the <strong>Status Remarks</strong> column and ensure it has a meaningful update (not just <code>.</code> or blank)</li>
              <li>Lead your entry with a date stamp: <code>7-Apr-2026 – ...</code></li>
              <li>The next <code>-e2e update</code> run will pick it up automatically</li>
            </ol>
            <p><em>Note: Only Critical Program cards display the Status Remarks in the WPR today.</em></p>
          </div>

          <div class="faq-item">
            <h4>Q: My status/date is outdated in the portal</h4>
            <p><strong>A:</strong> The portal syncs daily from Confluence. Updates made in Jira will appear in the portal within 24 hours after the next automated sync runs.</p>
          </div>
          
          <div class="faq-item">
            <h4>Q: Which field should I update to change my status?</h4>
            <p><strong>A:</strong> Update BOTH:</p>
            <ul>
              <li><code>Status Color</code> (Green/Yellow/Red)</li>
              <li><code>Ready to Start Field</code> in the top header (Ready to Start, In Progress, Blocked, etc.)</li>
            </ul>
          </div>
          
          <div class="faq-item">
            <h4>Q: My Assignee and Product Manager don't match</h4>
            <p><strong>A:</strong> They should be the same person. Update the <code>Assignee</code> field to match your <code>Product Manager</code> for consistency.</p>
          </div>
          
          <div class="faq-item">
            <h4>Q: How do I change which workstream my OPIF appears in?</h4>
            <p><strong>A:</strong> Update the <code>Activity Type</code> field in your OPIF to the appropriate category (Strategy, Design, Buying, Allocation).</p>
          </div>
        </div>
      `
    },
    
    {
      id: 'sync-info',
      title: '🔄 Sync Schedule',
      icon: '⏰',
      content: `
        <div class="sync-schedule">
          <h3>How Often Does the Portal Update?</h3>
          
          <div class="schedule-box">
            <div class="schedule-item">
              <div class="schedule-icon">📅</div>
              <div class="schedule-details">
                <h4>Daily Automated Sync</h4>
                <p>The portal automatically syncs with Confluence <strong>every morning</strong>.</p>
                <p class="time-detail">Changes you make in Jira today will appear in the portal tomorrow.</p>
              </div>
            </div>
            
            <div class="schedule-item">
              <div class="schedule-icon">⚡</div>
              <div class="schedule-details">
                <h4>Data Flow</h4>
                <p class="flow-chain">
                  Jira OPIF → Confluence Dashboard → E2E Fashion Portal
                </p>
                <p class="note-text">Make sure your OPIF is visible on the Confluence dashboard to ensure it syncs to the portal.</p>
              </div>
            </div>
          </div>
        </div>
      `
    },
    
    {
      id: 'contact',
      title: '📞 Need Help?',
      icon: '💬',
      content: `
        <div class="contact-info">
          <h3>Get Support</h3>
          
          <div class="contact-methods">
            <div class="contact-card">
              <div class="contact-icon">💬</div>
              <h4>Slack</h4>
              <p>Join the discussion:</p>
              <code>#e2e-fashion-portal</code>
            </div>
            
            <div class="contact-card">
              <div class="contact-icon">📧</div>
              <h4>Email</h4>
              <p>Reach out to the portal team:</p>
              <code>fashion-portal-support@walmart.com</code>
            </div>
            
            <div class="contact-card">
              <div class="contact-icon">📖</div>
              <h4>Confluence</h4>
              <p>Full documentation:</p>
              <a href="https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard" target="_blank">LLTT Dashboard</a>
            </div>
          </div>
        </div>
      `
    }
  ]
};

// Export for use in portal
if (typeof module !== 'undefined' && module.exports) {
  module.exports = opifFieldMapping;
}
