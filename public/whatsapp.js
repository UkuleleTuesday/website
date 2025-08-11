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
      
      // On success, show link and then attempt redirect as a fallback
      form.style.display = 'none';
      resultDiv.innerHTML = `🎉 Success! If you are not redirected automatically, <a href="${json.link}" target="_blank" rel="noopener noreferrer">click here to join the WhatsApp group</a>.`;
      
      try {
        window.location.href = json.link;
      } catch (redirectError) {
        console.error("Redirect failed:", redirectError);
        // The link is already displayed, so no further action is needed.
      }

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
