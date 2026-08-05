'use strict';

const schedule = [
  {time:'1:00 PM', zone:'CDT', person:'Maya Chen', context:'VP Engineering · Client screen', action:'Confirm preparation viewed', state:'Confirmed'},
  {time:'2:30 PM', zone:'CDT', person:'Nelson Fernandez', context:'Partnership discussion · Panel', action:'Repair interviewer conflict', state:'At Risk'},
  {time:'3:45 PM', zone:'CDT', person:'Jordan Ellis', context:'Director of Operations · Final', action:'Validate Meet link', state:'Action Required'},
  {time:'5:00 PM', zone:'CDT', person:'Avery Brooks', context:'CFO · Initial conversation', action:'No action required', state:'Confirmed'}
];

const watch = [
  {title:'Fernandez panel conflict', severity:'High', copy:'One interviewer declined. Two safe alternate slots preserve the loop.'},
  {title:'Jordan Ellis link health', severity:'Medium', copy:'Meet link has not passed the final validation check.'},
  {title:'Maya Chen feedback owner', severity:'Medium', copy:'Scorecard owner has not acknowledged the 5:00 PM deadline.'}
];

const messages = [
  {title:'Candidate confirmation · Jordan Ellis', meta:'Draft ready · Approval required', action:'Review'},
  {title:'Interviewer reminder · Maya Chen', meta:'Send at 1:15 PM · Approved template', action:'Open'},
  {title:'Client update · Fernandez', meta:'Waiting on repaired schedule', action:'Hold'}
];

const timeline = [
  {title:'Introduction acknowledged', detail:'10:18 AM · Reply received'},
  {title:'Internal briefing prepared', detail:'10:42 AM · Ready for review'},
  {title:'Meeting format proposed', detail:'11:15 AM · Panel coordination started'},
  {title:'Schedule exception opened', detail:'12:03 PM · Coordinator action required'}
];

const exceptions = [
  {severity:'High', title:'No viable panel time', affected:'Nelson Fernandez · Partnership discussion', remedy:'Offer the two highest-ranked alternate slots and preserve participant order.', safe:'Place new tentative holds; release the declined hold after acceptance.', escalation:'Henry if no common slot remains by 1:30 PM.'},
  {severity:'Medium', title:'Meeting link not validated', affected:'Jordan Ellis · Final interview', remedy:'Regenerate the Meet link, test guest access, then replace the calendar link.', safe:'Update the event only after validation passes.', escalation:'Henry only if the interview begins within 60 minutes.'},
  {severity:'Medium', title:'Feedback owner unconfirmed', affected:'Maya Chen · Client screen', remedy:'Send the approved reminder and nominate a backup owner if unanswered by 3:30 PM.', safe:'The reminder may be sent without executive approval.', escalation:'Search lead after the first missed deadline.'}
];

const interviewRows = [
  ['Maya Chen','VP Engineering','Client screen','1:00 PM CDT','Confirmed','Monitor attendance'],
  ['Nelson Fernandez','Partnership discussion','Panel','2:30 PM CDT','At Risk','Repair conflict'],
  ['Jordan Ellis','Director of Operations','Final','3:45 PM CDT','Action Required','Validate link'],
  ['Avery Brooks','CFO','Initial','5:00 PM CDT','Confirmed','No action'],
  ['Taylor Monroe','Head of Product','Panel','Tomorrow · 10:00 AM CDT','Waiting','Await candidate confirmation']
];

const communicationRows = [
  ['Jordan Ellis','Interview confirmation','Reply by 1:30 PM','Needs approval','Draft','Review'],
  ['Maya Chen panel','Feedback reminder','Complete by 5:00 PM','Approved','Scheduled','Open'],
  ['Nelson Fernandez','Schedule correction','Update by 1:00 PM','Blocked','Held','Resolve exception'],
  ['Avery Brooks','Preparation note','Review before 4:00 PM','Approved','Delivered','View receipt']
];

const stateClass = value => value.toLowerCase().replaceAll(' ', '-');
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));

function render() {
  document.querySelector('#schedule-list').innerHTML = schedule.map(item => `
    <article class="schedule-item">
      <div class="time"><strong>${escapeHtml(item.time)}</strong><span>${escapeHtml(item.zone)}</span></div>
      <div class="schedule-person"><strong>${escapeHtml(item.person)}</strong><span>${escapeHtml(item.context)}</span></div>
      <div class="schedule-action"><strong>${escapeHtml(item.action)}</strong><span>Coordinator next action</span></div>
      <span class="state ${stateClass(item.state)}">${escapeHtml(item.state)}</span>
    </article>`).join('');

  document.querySelector('#watch-list').innerHTML = watch.map(item => `
    <article class="watch-item">
      <header><strong>${escapeHtml(item.title)}</strong><span class="severity ${item.severity.toLowerCase()}">${escapeHtml(item.severity)}</span></header>
      <p>${escapeHtml(item.copy)}</p>
    </article>`).join('');

  document.querySelector('#message-list').innerHTML = messages.map(item => `
    <article class="message-item"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.meta)}</span></div><button class="text-button" type="button" data-action="message-action">${escapeHtml(item.action)}</button></article>`).join('');

  document.querySelector('#timeline').innerHTML = timeline.map(item => `<li><strong>${escapeHtml(item.title)}</strong>${escapeHtml(item.detail)}</li>`).join('');

  document.querySelector('#exception-grid').innerHTML = exceptions.map(item => `
    <article class="exception-card ${item.severity.toLowerCase()}">
      <span class="severity ${item.severity.toLowerCase()}">${escapeHtml(item.severity)} severity</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.affected)}</p>
      <dl><div><dt>Recommended remedy</dt><dd>${escapeHtml(item.remedy)}</dd></div><div><dt>Safe action</dt><dd>${escapeHtml(item.safe)}</dd></div><div><dt>Escalation</dt><dd>${escapeHtml(item.escalation)}</dd></div></dl>
      <button class="primary-button" type="button" data-action="resolve-exception">Open recovery plan</button>
    </article>`).join('');

  document.querySelector('#interview-table').innerHTML = interviewRows.map(row => `
    <tr><td><strong>${escapeHtml(row[0])}</strong></td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td><span class="state ${stateClass(row[4])}">${escapeHtml(row[4])}</span></td><td><button class="text-button" type="button" data-action="interview-action">${escapeHtml(row[5])}</button></td></tr>`).join('');

  document.querySelector('#communications-table').innerHTML = communicationRows.map(row => `
    <tr><td><strong>${escapeHtml(row[0])}</strong></td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td><td><button class="text-button" type="button" data-action="communication-action">${escapeHtml(row[5])}</button></td></tr>`).join('');
}

const titleMap = {today:'Today', interviews:'Interviews', availability:'Availability', communications:'Communications', exceptions:'Exceptions', reporting:'Reporting'};

function switchView(view) {
  document.querySelectorAll('.view').forEach(panel => panel.classList.toggle('is-visible', panel.dataset.panel === view));
  document.querySelectorAll('.nav-item').forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  document.querySelector('#page-title').textContent = titleMap[view] || 'Interview Operations';
  document.querySelector('.sidebar').classList.remove('is-open');
  document.querySelector('.menu-button').setAttribute('aria-expanded', 'false');
  document.querySelector('#main').focus({preventScroll:true});
  window.scrollTo({top:0, behavior:'smooth'});
}

function showDialog(title, copy) {
  const dialog = document.querySelector('#action-dialog');
  document.querySelector('#dialog-title').textContent = title;
  document.querySelector('#dialog-copy').textContent = copy;
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

function handleAction(action) {
  const actions = {
    'new-loop':['Interview loop builder','The production workflow will collect stages, participants, duration, buffers, time zones, policy checks, and approval before publishing.'],
    'resolve-top':['Recovery plan prepared','Two alternate synthetic slots are ready for review. No calendar holds or messages have been created.'],
    'send-reminders':['Reminder batch prepared','Five availability reminders would be prepared from approved templates. This prototype has not sent them.'],
    'message-action':['Message opened','The production center will show content, recipient, approval, timing commitment, and delivery state before any send.'],
    'resolve-exception':['Recovery plan opened','The recommended remedy, safe-action limit, and escalation route would be reviewed here before execution.'],
    'interview-action':['Interview workspace opened','The production version will show the complete loop, evidence, links, confirmations, and audit receipt.'],
    'communication-action':['Communication workspace opened','No email or calendar write occurs in this synthetic prototype.']
  };
  if (action === 'open-exceptions') return switchView('exceptions');
  if (action === 'view-all-interviews') return switchView('interviews');
  if (action === 'open-communications') return switchView('communications');
  const entry = actions[action];
  if (entry) showDialog(entry[0], entry[1]); else showToast('Prototype action acknowledged. No live system was changed.');
}

document.addEventListener('click', event => {
  const navButton = event.target.closest('[data-view]');
  if (navButton) return switchView(navButton.dataset.view);
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) handleAction(actionButton.dataset.action);
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

render();
showToast('Interview Operations loaded with synthetic demonstration data.');
