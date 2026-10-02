'use strict';

const workspaceData = {
  all: {
    label: 'All Workspaces',
    lockTitle: 'All Workspaces triage',
    lockCopy: 'Priorities and counts may be reviewed together. Enter a company workspace before opening sensitive details or taking action.',
    nav: {today: 11, interviews: 19, availability: 8, communications: 11, exceptions: 4},
    welcome: 'Four items need intervention across two workspaces. Everything else is on schedule.',
    priority: {title: 'Repair the Fernandez panel conflict.', copy: 'One interviewer declined the 2:30 PM hold. Two alternate slots preserve the full loop.', deadline: 'Due 12:45 PM', workspace: 'Tanzer Anderson', severity: 'High priority'},
    metrics: {interviews: ['11', '9 ready · 2 at risk'], confirmations: ['3', 'Next follow-up at 1:00 PM'], feedback: ['4', 'Oldest: 19 hours'], intervention: ['4', '1 high · 3 medium']},
    schedule: [
      {workspace: 'tanzer', time: '1:00 PM', zone: 'CDT', person: 'Maya Chen', context: 'VP Engineering · Client screen', action: 'Confirm preparation viewed', state: 'Confirmed'},
      {workspace: 'alder', time: '1:30 PM', zone: 'CDT', person: 'Nia Grant', context: 'VP People · Client screen', action: 'Await interviewer response', state: 'Waiting'},
      {workspace: 'tanzer', time: '2:30 PM', zone: 'CDT', person: 'Nelson Fernandez', context: 'Partnership discussion · Panel', action: 'Repair interviewer conflict', state: 'At Risk'},
      {workspace: 'tanzer', time: '3:45 PM', zone: 'CDT', person: 'Jordan Ellis', context: 'Director of Operations · Final', action: 'Validate Meet link', state: 'Action Required'},
      {workspace: 'alder', time: '4:15 PM', zone: 'CDT', person: 'Camille Rhodes', context: 'Director of Talent · Final panel', action: 'Validate participant list', state: 'Action Required'}
    ],
    watch: [
      {workspace: 'tanzer', title: 'Fernandez panel conflict', severity: 'High', copy: 'One interviewer declined. Two safe alternate slots preserve the loop.'},
      {workspace: 'alder', title: 'Rhodes participant mismatch', severity: 'Medium', copy: 'The calendar and approved panel list do not match.'},
      {workspace: 'tanzer', title: 'Jordan Ellis link health', severity: 'Medium', copy: 'Meet link has not passed the final validation check.'},
      {workspace: 'alder', title: 'Nia Grant confirmation', severity: 'Medium', copy: 'One interviewer has not acknowledged the revised time.'}
    ],
    messages: [
      {workspace: 'tanzer', title: 'Candidate confirmation · Jordan Ellis', meta: 'Draft ready · Approval required', action: 'Review'},
      {workspace: 'alder', title: 'Panel correction · Camille Rhodes', meta: 'Blocked until participant list is verified', action: 'Resolve'},
      {workspace: 'tanzer', title: 'Interviewer reminder · Maya Chen', meta: 'Send at 1:15 PM · Approved template', action: 'Open'},
      {workspace: 'alder', title: 'Interviewer follow-up · Nia Grant', meta: 'Approved template · Due 1:00 PM', action: 'Open'}
    ],
    journey: {initials: 'NF', name: 'Nelson Fernandez', context: 'Client introduction', workspace: 'tanzer'},
    timeline: [
      {title: 'Introduction acknowledged', detail: '10:18 AM · Reply received'},
      {title: 'Internal briefing prepared', detail: '10:42 AM · Ready for review'},
      {title: 'Meeting format proposed', detail: '11:15 AM · Panel coordination started'},
      {title: 'Schedule exception opened', detail: '12:03 PM · Coordinator action required'}
    ],
    availability: {count: 8, title: 'Eight availability requests are pending.', copy: 'The production version will rank common slots using each company’s calendars and rules, then place tentative holds only after workspace and policy checks pass.'},
    exceptions: [
      {workspace: 'tanzer', severity: 'High', title: 'No viable panel time', affected: 'Nelson Fernandez · Partnership discussion', remedy: 'Offer the two highest-ranked alternate slots and preserve participant order.', safe: 'Place new tentative holds; release the declined hold after acceptance.', escalation: 'Henry if no common slot remains by 1:30 PM.'},
      {workspace: 'alder', severity: 'Medium', title: 'Participant list mismatch', affected: 'Camille Rhodes · Final panel', remedy: 'Reconcile the approved panel roster before changing the calendar invitation.', safe: 'Prepare the corrected event and message; do not send from All Workspaces.', escalation: 'Alder & Rowe search lead if the approved roster is unclear.'},
      {workspace: 'tanzer', severity: 'Medium', title: 'Meeting link not validated', affected: 'Jordan Ellis · Final interview', remedy: 'Regenerate the Meet link, test guest access, then replace the calendar link.', safe: 'Update the event only after validation passes.', escalation: 'Henry if the interview begins within 60 minutes.'},
      {workspace: 'alder', severity: 'Medium', title: 'Interviewer response missing', affected: 'Nia Grant · Client screen', remedy: 'Send the approved reminder and rank one alternate slot.', safe: 'The reminder may be prepared from the Alder & Rowe template.', escalation: 'Alder & Rowe search lead after the first missed deadline.'}
    ],
    interviewRows: [
      {workspace: 'tanzer', candidate: 'Maya Chen', role: 'VP Engineering', stage: 'Client screen', time: '1:00 PM CDT', readiness: 'Confirmed', action: 'Monitor attendance'},
      {workspace: 'alder', candidate: 'Nia Grant', role: 'VP People', stage: 'Client screen', time: '1:30 PM CDT', readiness: 'Waiting', action: 'Await response'},
      {workspace: 'tanzer', candidate: 'Nelson Fernandez', role: 'Partnership discussion', stage: 'Panel', time: '2:30 PM CDT', readiness: 'At Risk', action: 'Repair conflict'},
      {workspace: 'tanzer', candidate: 'Jordan Ellis', role: 'Director of Operations', stage: 'Final', time: '3:45 PM CDT', readiness: 'Action Required', action: 'Validate link'},
      {workspace: 'alder', candidate: 'Camille Rhodes', role: 'Director of Talent', stage: 'Final panel', time: '4:15 PM CDT', readiness: 'Action Required', action: 'Verify panel'}
    ],
    communicationRows: [
      {workspace: 'tanzer', recipient: 'Jordan Ellis', purpose: 'Interview confirmation', commitment: 'Reply by 1:30 PM', approval: 'Needs approval', delivery: 'Draft', action: 'Review'},
      {workspace: 'alder', recipient: 'Camille Rhodes panel', purpose: 'Participant correction', commitment: 'Update by 2:00 PM', approval: 'Blocked', delivery: 'Held', action: 'Resolve exception'},
      {workspace: 'tanzer', recipient: 'Maya Chen panel', purpose: 'Feedback reminder', commitment: 'Complete by 5:00 PM', approval: 'Approved', delivery: 'Scheduled', action: 'Open'},
      {workspace: 'alder', recipient: 'Nia Grant panel', purpose: 'Interviewer reminder', commitment: 'Reply by 1:00 PM', approval: 'Approved', delivery: 'Prepared', action: 'Open'}
    ],
    report: {time: ['6.8h', 'Combined operational view', '78%'], reschedule: ['9%', 'Target: under 10%', '66%'], feedback: ['82%', 'Target: 90%', '82%'], failures: ['1', 'Current month · Both workspaces', '18%']}
  },
  tanzer: {
    label: 'Tanzer Anderson',
    lockTitle: 'Tanzer Anderson workspace active',
    lockCopy: 'Only Tanzer Anderson records, approved identities, calendars, templates, reports, and actions are available in this scope.',
    nav: {today: 8, interviews: 14, availability: 5, communications: 7, exceptions: 3},
    welcome: 'Three Tanzer Anderson items need intervention. Everything else is on schedule.',
    priority: {title: 'Repair the Fernandez panel conflict.', copy: 'One interviewer declined the 2:30 PM hold. Two alternate slots preserve the full loop.', deadline: 'Due 12:45 PM', workspace: 'Tanzer Anderson', severity: 'High priority'},
    metrics: {interviews: ['8', '7 ready · 1 at risk'], confirmations: ['2', 'Next follow-up at 1:00 PM'], feedback: ['3', 'Oldest: 19 hours'], intervention: ['3', '1 high · 2 medium']},
    schedule: [
      {workspace: 'tanzer', time: '1:00 PM', zone: 'CDT', person: 'Maya Chen', context: 'VP Engineering · Client screen', action: 'Confirm preparation viewed', state: 'Confirmed'},
      {workspace: 'tanzer', time: '2:30 PM', zone: 'CDT', person: 'Nelson Fernandez', context: 'Partnership discussion · Panel', action: 'Repair interviewer conflict', state: 'At Risk'},
      {workspace: 'tanzer', time: '3:45 PM', zone: 'CDT', person: 'Jordan Ellis', context: 'Director of Operations · Final', action: 'Validate Meet link', state: 'Action Required'},
      {workspace: 'tanzer', time: '5:00 PM', zone: 'CDT', person: 'Avery Brooks', context: 'CFO · Initial conversation', action: 'No action required', state: 'Confirmed'}
    ],
    watch: [
      {workspace: 'tanzer', title: 'Fernandez panel conflict', severity: 'High', copy: 'One interviewer declined. Two safe alternate slots preserve the loop.'},
      {workspace: 'tanzer', title: 'Jordan Ellis link health', severity: 'Medium', copy: 'Meet link has not passed the final validation check.'},
      {workspace: 'tanzer', title: 'Maya Chen feedback owner', severity: 'Medium', copy: 'Scorecard owner has not acknowledged the 5:00 PM deadline.'}
    ],
    messages: [
      {workspace: 'tanzer', title: 'Candidate confirmation · Jordan Ellis', meta: 'Draft ready · Approval required', action: 'Review'},
      {workspace: 'tanzer', title: 'Interviewer reminder · Maya Chen', meta: 'Send at 1:15 PM · Approved template', action: 'Open'},
      {workspace: 'tanzer', title: 'Client update · Fernandez', meta: 'Waiting on repaired schedule', action: 'Hold'}
    ],
    journey: {initials: 'NF', name: 'Nelson Fernandez', context: 'Client introduction', workspace: 'tanzer'},
    timeline: [
      {title: 'Introduction acknowledged', detail: '10:18 AM · Reply received'},
      {title: 'Internal briefing prepared', detail: '10:42 AM · Ready for review'},
      {title: 'Meeting format proposed', detail: '11:15 AM · Panel coordination started'},
      {title: 'Schedule exception opened', detail: '12:03 PM · Coordinator action required'}
    ],
    availability: {count: 5, title: 'Five availability requests are pending.', copy: 'Tanzer Anderson calendars, working hours, buffers, and approved scheduling language will govern these requests after authorization.'},
    exceptions: [
      {workspace: 'tanzer', severity: 'High', title: 'No viable panel time', affected: 'Nelson Fernandez · Partnership discussion', remedy: 'Offer the two highest-ranked alternate slots and preserve participant order.', safe: 'Place new tentative holds; release the declined hold after acceptance.', escalation: 'Henry if no common slot remains by 1:30 PM.'},
      {workspace: 'tanzer', severity: 'Medium', title: 'Meeting link not validated', affected: 'Jordan Ellis · Final interview', remedy: 'Regenerate the Meet link, test guest access, then replace the calendar link.', safe: 'Update the event only after validation passes.', escalation: 'Henry if the interview begins within 60 minutes.'},
      {workspace: 'tanzer', severity: 'Medium', title: 'Feedback owner unconfirmed', affected: 'Maya Chen · Client screen', remedy: 'Send the approved reminder and nominate a backup owner if unanswered by 3:30 PM.', safe: 'The reminder may be sent without executive approval.', escalation: 'Search lead after the first missed deadline.'}
    ],
    interviewRows: [
      {workspace: 'tanzer', candidate: 'Maya Chen', role: 'VP Engineering', stage: 'Client screen', time: '1:00 PM CDT', readiness: 'Confirmed', action: 'Monitor attendance'},
      {workspace: 'tanzer', candidate: 'Nelson Fernandez', role: 'Partnership discussion', stage: 'Panel', time: '2:30 PM CDT', readiness: 'At Risk', action: 'Repair conflict'},
      {workspace: 'tanzer', candidate: 'Jordan Ellis', role: 'Director of Operations', stage: 'Final', time: '3:45 PM CDT', readiness: 'Action Required', action: 'Validate link'},
      {workspace: 'tanzer', candidate: 'Avery Brooks', role: 'CFO', stage: 'Initial', time: '5:00 PM CDT', readiness: 'Confirmed', action: 'No action'},
      {workspace: 'tanzer', candidate: 'Taylor Monroe', role: 'Head of Product', stage: 'Panel', time: 'Tomorrow · 10:00 AM CDT', readiness: 'Waiting', action: 'Await confirmation'}
    ],
    communicationRows: [
      {workspace: 'tanzer', recipient: 'Jordan Ellis', purpose: 'Interview confirmation', commitment: 'Reply by 1:30 PM', approval: 'Needs approval', delivery: 'Draft', action: 'Review'},
      {workspace: 'tanzer', recipient: 'Maya Chen panel', purpose: 'Feedback reminder', commitment: 'Complete by 5:00 PM', approval: 'Approved', delivery: 'Scheduled', action: 'Open'},
      {workspace: 'tanzer', recipient: 'Nelson Fernandez', purpose: 'Schedule correction', commitment: 'Update by 1:00 PM', approval: 'Blocked', delivery: 'Held', action: 'Resolve exception'},
      {workspace: 'tanzer', recipient: 'Avery Brooks', purpose: 'Preparation note', commitment: 'Review before 4:00 PM', approval: 'Approved', delivery: 'Delivered', action: 'View receipt'}
    ],
    report: {time: ['6.4h', 'Target: under 8 hours', '80%'], reschedule: ['8%', 'Target: under 10%', '62%'], feedback: ['84%', 'Target: 90%', '84%'], failures: ['1', 'Current month · Tanzer Anderson', '18%']}
  },
  alder: {
    label: 'Alder & Rowe',
    lockTitle: 'Alder & Rowe workspace active',
    lockCopy: 'Only Alder & Rowe records, approved identities, calendars, templates, reports, and actions are available in this scope.',
    nav: {today: 3, interviews: 5, availability: 3, communications: 4, exceptions: 2},
    welcome: 'Two Alder & Rowe items need intervention. The remaining interview work is on schedule.',
    priority: {title: 'Correct the Rhodes panel roster.', copy: 'The approved participant list and calendar invitation do not match. The corrected version is prepared but not sent.', deadline: 'Due 2:00 PM', workspace: 'Alder & Rowe', severity: 'Medium priority'},
    metrics: {interviews: ['3', '2 ready · 1 requires action'], confirmations: ['1', 'Interviewer follow-up due 1:00 PM'], feedback: ['1', 'Due within 4 hours'], intervention: ['2', '2 medium']},
    schedule: [
      {workspace: 'alder', time: '1:30 PM', zone: 'CDT', person: 'Nia Grant', context: 'VP People · Client screen', action: 'Await interviewer response', state: 'Waiting'},
      {workspace: 'alder', time: '4:15 PM', zone: 'CDT', person: 'Camille Rhodes', context: 'Director of Talent · Final panel', action: 'Validate participant list', state: 'Action Required'},
      {workspace: 'alder', time: '5:30 PM', zone: 'CDT', person: 'Sofia Bennett', context: 'VP Client Partnerships · Calibration', action: 'Confirm brief delivered', state: 'Confirmed'}
    ],
    watch: [
      {workspace: 'alder', title: 'Rhodes participant mismatch', severity: 'Medium', copy: 'The calendar and approved panel list do not match.'},
      {workspace: 'alder', title: 'Nia Grant confirmation', severity: 'Medium', copy: 'One interviewer has not acknowledged the revised time.'}
    ],
    messages: [
      {workspace: 'alder', title: 'Panel correction · Camille Rhodes', meta: 'Blocked until participant list is verified', action: 'Resolve'},
      {workspace: 'alder', title: 'Interviewer follow-up · Nia Grant', meta: 'Approved template · Due 1:00 PM', action: 'Open'},
      {workspace: 'alder', title: 'Preparation note · Sofia Bennett', meta: 'Delivered · Receipt available', action: 'View'}
    ],
    journey: {initials: 'CR', name: 'Camille Rhodes', context: 'Final panel coordination', workspace: 'alder'},
    timeline: [
      {title: 'Availability confirmed', detail: '9:10 AM · Candidate acknowledged'},
      {title: 'Panel roster approved', detail: '10:05 AM · Search lead approval'},
      {title: 'Calendar mismatch detected', detail: '11:32 AM · Automated preflight'},
      {title: 'Corrected invitation prepared', detail: '11:41 AM · Coordinator review required'}
    ],
    availability: {count: 3, title: 'Three availability requests are pending.', copy: 'Alder & Rowe calendars, working hours, buffers, and approved scheduling language will govern these requests after authorization.'},
    exceptions: [
      {workspace: 'alder', severity: 'Medium', title: 'Participant list mismatch', affected: 'Camille Rhodes · Final panel', remedy: 'Reconcile the approved panel roster before changing the calendar invitation.', safe: 'Prepare the corrected event and message; send only after the roster is verified.', escalation: 'Alder & Rowe search lead if the approved roster is unclear.'},
      {workspace: 'alder', severity: 'Medium', title: 'Interviewer response missing', affected: 'Nia Grant · Client screen', remedy: 'Send the approved reminder and rank one alternate slot.', safe: 'The approved Alder & Rowe reminder may be sent within policy.', escalation: 'Alder & Rowe search lead after the first missed deadline.'}
    ],
    interviewRows: [
      {workspace: 'alder', candidate: 'Nia Grant', role: 'VP People', stage: 'Client screen', time: '1:30 PM CDT', readiness: 'Waiting', action: 'Await response'},
      {workspace: 'alder', candidate: 'Camille Rhodes', role: 'Director of Talent', stage: 'Final panel', time: '4:15 PM CDT', readiness: 'Action Required', action: 'Verify panel'},
      {workspace: 'alder', candidate: 'Sofia Bennett', role: 'VP Client Partnerships', stage: 'Calibration', time: '5:30 PM CDT', readiness: 'Confirmed', action: 'Confirm brief'},
      {workspace: 'alder', candidate: 'Marcus Lee', role: 'Operating Partner', stage: 'Initial', time: 'Tomorrow · 9:30 AM CDT', readiness: 'Confirmed', action: 'No action'},
      {workspace: 'alder', candidate: 'Amina Patel', role: 'Chief People Officer', stage: 'Panel', time: 'Tomorrow · 2:00 PM CDT', readiness: 'Waiting', action: 'Await candidate'}
    ],
    communicationRows: [
      {workspace: 'alder', recipient: 'Camille Rhodes panel', purpose: 'Participant correction', commitment: 'Update by 2:00 PM', approval: 'Blocked', delivery: 'Held', action: 'Resolve exception'},
      {workspace: 'alder', recipient: 'Nia Grant panel', purpose: 'Interviewer reminder', commitment: 'Reply by 1:00 PM', approval: 'Approved', delivery: 'Prepared', action: 'Open'},
      {workspace: 'alder', recipient: 'Sofia Bennett', purpose: 'Preparation note', commitment: 'Review before 5:00 PM', approval: 'Approved', delivery: 'Delivered', action: 'View receipt'}
    ],
    report: {time: ['7.2h', 'Target: under 8 hours', '74%'], reschedule: ['10%', 'At target threshold', '70%'], feedback: ['78%', 'Target: 90%', '78%'], failures: ['0', 'Current month · Alder & Rowe', '4%']}
  }
};

const workspaceLabels = {tanzer: 'Tanzer Anderson', alder: 'Alder & Rowe'};
const titleMap = {today: 'Today', interviews: 'Interviews', availability: 'Availability', communications: 'Communications', exceptions: 'Exceptions', reporting: 'Reporting'};
let currentWorkspace = 'all';

const stateClass = value => value.toLowerCase().replaceAll(' ', '-');
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[character]));
const tag = key => `<span class="workspace-tag ${key}">${escapeHtml(workspaceLabels[key])}</span>`;

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setBar(id, width) {
  const element = document.getElementById(id);
  if (element) element.style.width = width;
}

function renderWorkspace() {
  const data = workspaceData[currentWorkspace];
  setText('active-workspace', data.label);
  setText('workspace-lock-title', data.lockTitle);
  setText('workspace-lock-copy', data.lockCopy);
  setText('nav-today-count', data.nav.today);
  setText('nav-interview-count', data.nav.interviews);
  setText('nav-availability-count', data.nav.availability);
  setText('nav-message-count', data.nav.communications);
  setText('nav-exception-count', data.nav.exceptions);
  setText('welcome-summary', data.welcome);
  setText('priority-title', data.priority.title);
  setText('priority-copy', data.priority.copy);
  setText('priority-deadline', data.priority.deadline);
  setText('priority-workspace', `${data.priority.workspace} · ${data.priority.severity}`);
  setText('metric-interviews', data.metrics.interviews[0]);
  setText('metric-interviews-note', data.metrics.interviews[1]);
  setText('metric-confirmations', data.metrics.confirmations[0]);
  setText('metric-confirmations-note', data.metrics.confirmations[1]);
  setText('metric-feedback', data.metrics.feedback[0]);
  setText('metric-feedback-note', data.metrics.feedback[1]);
  setText('metric-intervention', data.metrics.intervention[0]);
  setText('metric-intervention-note', data.metrics.intervention[1]);

  document.querySelector('#schedule-list').innerHTML = data.schedule.map(item => `
    <article class="schedule-item">
      <div class="time"><strong>${escapeHtml(item.time)}</strong><span>${escapeHtml(item.zone)}</span></div>
      <div class="schedule-person"><strong>${escapeHtml(item.person)}</strong><span>${escapeHtml(item.context)}</span>${tag(item.workspace)}</div>
      <div class="schedule-action"><strong>${escapeHtml(item.action)}</strong><span>Coordinator next action</span></div>
      <span class="state ${stateClass(item.state)}">${escapeHtml(item.state)}</span>
    </article>`).join('');

  document.querySelector('#watch-list').innerHTML = data.watch.map(item => `
    <article class="watch-item">
      <header><strong>${escapeHtml(item.title)}</strong><span class="severity ${item.severity.toLowerCase()}">${escapeHtml(item.severity)}</span></header>
      ${tag(item.workspace)}
      <p>${escapeHtml(item.copy)}</p>
    </article>`).join('');

  document.querySelector('#message-list').innerHTML = data.messages.map(item => `
    <article class="message-item"><div><strong>${escapeHtml(item.title)}</strong>${tag(item.workspace)}<span>${escapeHtml(item.meta)}</span></div><button class="text-button" type="button" data-action="message-action">${escapeHtml(item.action)}</button></article>`).join('');

  setText('journey-initials', data.journey.initials);
  setText('journey-name', data.journey.name);
  setText('journey-context', data.journey.context);
  const journeyTag = document.querySelector('#journey-workspace');
  journeyTag.textContent = workspaceLabels[data.journey.workspace];
  journeyTag.className = `workspace-tag ${data.journey.workspace}`;
  document.querySelector('#timeline').innerHTML = data.timeline.map(item => `<li><strong>${escapeHtml(item.title)}</strong>${escapeHtml(item.detail)}</li>`).join('');

  setText('availability-number', String(data.availability.count).padStart(2, '0'));
  setText('availability-title', data.availability.title);
  setText('availability-copy', data.availability.copy);

  document.querySelector('#exception-grid').innerHTML = data.exceptions.map(item => `
    <article class="exception-card ${item.severity.toLowerCase()}">
      <span class="severity ${item.severity.toLowerCase()}">${escapeHtml(item.severity)} severity</span>
      ${tag(item.workspace)}
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.affected)}</p>
      <dl><div><dt>Recommended remedy</dt><dd>${escapeHtml(item.remedy)}</dd></div><div><dt>Safe action</dt><dd>${escapeHtml(item.safe)}</dd></div><div><dt>Escalation</dt><dd>${escapeHtml(item.escalation)}</dd></div></dl>
      <button class="primary-button" type="button" data-action="resolve-exception">Open recovery plan</button>
    </article>`).join('');

  document.querySelector('#interview-table').innerHTML = data.interviewRows.map(row => `
    <tr><td>${tag(row.workspace)}</td><td><strong>${escapeHtml(row.candidate)}</strong></td><td>${escapeHtml(row.role)}</td><td>${escapeHtml(row.stage)}</td><td>${escapeHtml(row.time)}</td><td><span class="state ${stateClass(row.readiness)}">${escapeHtml(row.readiness)}</span></td><td><button class="text-button" type="button" data-action="interview-action">${escapeHtml(row.action)}</button></td></tr>`).join('');

  document.querySelector('#communications-table').innerHTML = data.communicationRows.map(row => `
    <tr><td>${tag(row.workspace)}</td><td><strong>${escapeHtml(row.recipient)}</strong></td><td>${escapeHtml(row.purpose)}</td><td>${escapeHtml(row.commitment)}</td><td>${escapeHtml(row.approval)}</td><td>${escapeHtml(row.delivery)}</td><td><button class="text-button" type="button" data-action="communication-action">${escapeHtml(row.action)}</button></td></tr>`).join('');

  setText('report-time', data.report.time[0]);
  setText('report-time-note', data.report.time[1]);
  setBar('report-time-bar', data.report.time[2]);
  setText('report-reschedule', data.report.reschedule[0]);
  setText('report-reschedule-note', data.report.reschedule[1]);
  setBar('report-reschedule-bar', data.report.reschedule[2]);
  setText('report-feedback', data.report.feedback[0]);
  setText('report-feedback-note', data.report.feedback[1]);
  setBar('report-feedback-bar', data.report.feedback[2]);
  setText('report-failures', data.report.failures[0]);
  setText('report-failures-note', data.report.failures[1]);
  setBar('report-failures-bar', data.report.failures[2]);
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(panel => panel.classList.toggle('is-visible', panel.dataset.panel === view));
  document.querySelectorAll('.nav-item').forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  setText('page-title', titleMap[view] || 'Interview Operations');
  document.querySelector('.sidebar').classList.remove('is-open');
  document.querySelector('.menu-button').setAttribute('aria-expanded', 'false');
  document.querySelector('#main').focus({preventScroll: true});
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function showDialog(title, copy) {
  const dialog = document.querySelector('#action-dialog');
  setText('dialog-title', title);
  setText('dialog-copy', copy);
  if (typeof dialog.showModal === 'function') dialog.showModal();
}

let toastTimer;
function showToast(copy) {
  const toast = document.querySelector('#toast');
  toast.textContent = copy;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function requireCompanyWorkspace() {
  if (currentWorkspace !== 'all') return true;
  showDialog('Select a company workspace', 'All Workspaces is a triage view. Choose Tanzer Anderson or Alder & Rowe before opening sensitive details or preparing an action.');
  return false;
}

function handleAction(action) {
  if (action === 'open-exceptions') return switchView('exceptions');
  if (action === 'view-all-interviews') return switchView('interviews');
  if (action === 'open-communications') return switchView('communications');
  if (!requireCompanyWorkspace()) return;

  const data = workspaceData[currentWorkspace];
  const actions = {
    'new-loop': ['Interview loop builder', `The ${data.label} workflow will collect stages, participants, duration, buffers, time zones, policy checks, and approval before publishing.`],
    'resolve-top': ['Recovery plan prepared', `${data.priority.title} The prototype has prepared the next safe step but has not created calendar holds or sent messages.`],
    'send-reminders': ['Reminder batch prepared', `${data.availability.count} ${data.label} availability reminders would be prepared from approved templates. This prototype has not sent them.`],
    'message-action': ['Message opened', `The ${data.label} communication center will verify sender identity, recipient, approval, timing commitment, and delivery state before any send.`],
    'resolve-exception': ['Recovery plan opened', `The ${data.label} remedy, safe-action limit, and escalation route would be reviewed here before execution.`],
    'interview-action': ['Interview workspace opened', `The production version will show only the ${data.label} loop, evidence, links, confirmations, and audit receipt.`],
    'communication-action': ['Communication workspace opened', `No ${data.label} email or calendar write occurs in this synthetic prototype.`]
  };
  const entry = actions[action];
  if (entry) showDialog(entry[0], entry[1]); else showToast('Prototype action acknowledged. No live system was changed.');
}

document.addEventListener('click', event => {
  const navButton = event.target.closest('[data-view]');
  if (navButton) return switchView(navButton.dataset.view);
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) handleAction(actionButton.dataset.action);
});

document.querySelector('#workspace-select').addEventListener('change', event => {
  currentWorkspace = event.target.value;
  renderWorkspace();
  showToast(`${workspaceData[currentWorkspace].label} workspace loaded. No live system was changed.`);
});

document.querySelector('.menu-button').addEventListener('click', event => {
  const sidebar = document.querySelector('.sidebar');
  const open = sidebar.classList.toggle('is-open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    document.querySelector('.sidebar').classList.remove('is-open');
    document.querySelector('.menu-button').setAttribute('aria-expanded', 'false');
  }
});

renderWorkspace();
showToast('Dual-workspace Interview Operations loaded with synthetic demonstration data.');
