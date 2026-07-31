const header=document.querySelector('.site-header');
const menu=document.querySelector('.menu-btn');
const links=document.querySelector('.nav-links');
window.addEventListener('scroll',()=>header?.classList.toggle('scrolled',window.scrollY>12));
menu?.addEventListener('click',()=>{const open=links?.classList.toggle('open');menu.setAttribute('aria-expanded',String(Boolean(open)));});
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>{links?.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));

if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));

function updateProgress(form,step){
  const dots=form.closest('.hero-intake')?.querySelectorAll('.intake-progress b');
  dots?.forEach((dot,index)=>dot.classList.toggle('active',index<step));
}

document.querySelectorAll('[data-multistep]').forEach(form=>{
  let current=1;
  const steps=[...form.querySelectorAll('.form-step')];
  const show=step=>{current=step;steps.forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===step));updateProgress(form,step)};
  form.querySelectorAll('[data-next]').forEach(button=>button.addEventListener('click',()=>{
    const active=steps.find(el=>Number(el.dataset.step)===current);
    const required=[...active.querySelectorAll('[required]')];
    if(required.some(field=>!field.reportValidity()))return;
    show(Math.min(current+1,steps.length));
  }));
  form.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>show(Math.max(current-1,1))));
});

async function submitContact(form){
  const status=form.querySelector('.form-status')||form.parentElement?.querySelector('.form-status');
  const button=form.querySelector('button[type="submit"]');
  const original=button?.textContent;
  const data=Object.fromEntries(new FormData(form));
  const services=[...form.querySelectorAll('input[name="services"]:checked')].map(input=>input.value);
  if(services.length)data.inquiry=services.join(', ');
  if(button){button.disabled=true;button.textContent='Sending…'}
  if(status)status.className='status form-status';
  try{
    const response=await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
    if(!response.ok)throw new Error('mail fallback');
    form.reset();
    if(status){status.textContent='Thank you. A Tanzer Anderson partner will be in touch.';status.className='status form-status show'}
  }catch(error){
    const subject=encodeURIComponent(`Website inquiry — ${data.company||data.name||'New contact'}`);
    const body=encodeURIComponent(`Name: ${data.name||''}\nCompany: ${data.company||''}\nEmail: ${data.email||''}\nPhone: ${data.phone||''}\nInquiry: ${data.inquiry||''}\n\n${data.message||''}`);
    window.location.href=`mailto:clientservices@tanzeranderson.com?subject=${subject}&body=${body}`;
    if(status){status.textContent='Your email application has opened with the inquiry prepared. Send it to complete your request.';status.className='status form-status show'}
  }finally{
    if(button){button.disabled=false;button.textContent=original||'Send message'}
  }
}

document.querySelectorAll('.js-contact-form').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();submitContact(form)}));
