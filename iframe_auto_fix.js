
// Override iframe restrictions in RZB template
document.addEventListener("DOMContentLoaded", ()=>{
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe=>{
    iframe.style.setProperty('height','auto','important');
    iframe.style.setProperty('min-height','0','important');
    iframe.style.setProperty('max-height','none','important');
    iframe.style.setProperty('width','100%','important');
    iframe.style.setProperty('min-width','0','important');
    iframe.style.setProperty('max-width','100%','important');
    iframe.removeAttribute('height');
    iframe.removeAttribute('width');
  });
});
