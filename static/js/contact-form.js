// Fills the contact form's hidden "subject" field, which Netlify Forms uses as
// the subject line of the notification email, so each enquiry arrives titled
// with what it is about and who sent it (see templates/_partials/contact_form.html).
(function () {
  const form = document.getElementById('contact');
  if (!form) return;

  form.addEventListener('submit', () => {
    const subject = form.elements['subject'];
    const type = form.elements['enquiry-type'].value.trim();
    const name = form.elements['your-name'].value.trim();
    if (subject && type && name) {
      subject.value = `Website enquiry: ${type} from ${name}`;
    }
  });
})();
