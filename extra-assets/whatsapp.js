document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('whatsapp-form');
  const resultDiv = document.getElementById('form-result');
  const submitButton = form.querySelector('input[type="submit"]');

  if (!form) {
    console.error('WhatsApp form not found.');
    return;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.value = 'Submitting...';
    }
    resultDiv.textContent = '';

    const formData = new FormData(form);
    const data = new URLSearchParams(formData);

    try {
      const response = await fetch('/.netlify/functions/whatsapp-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'An unknown error occurred.');
      }
      
      // On success, redirect to the WhatsApp link
      if (submitButton) {
        submitButton.value = 'Redirecting...';
      }
      window.location.href = json.link;

    } catch (error) {
      resultDiv.textContent = `Error: ${error.message}`;
      resultDiv.style.color = 'red';
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.value = 'Join Community';
      }
    }
  });
});
