(() => {
  const form = document.querySelector(".contact-form");
  if (!form) {
    return;
  }

  const status = form.querySelector("[data-form-status]");
  const submit = form.querySelector("button[type='submit']");
  const endpoint = window.SSL_FORM_ENDPOINT;

  const setStatus = (message, state = "idle") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  };

  if (!endpoint) {
    setStatus("Formuläret öppnar e-post tills säker formulärmottagning är aktiverad.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    formData.set("submittedAt", new Date().toISOString());
    formData.set("page", window.location.href);
    formData.set("userAgent", navigator.userAgent);

    submit.disabled = true;
    setStatus("Skickar förfrågan...", "pending");

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });

      form.reset();
      setStatus("Tack. Förfrågan är skickad och registreras för uppföljning.", "success");
    } catch (_error) {
      setStatus("Kunde inte skicka formuläret. Mejla info@svensksystemlogik.se direkt.", "error");
    } finally {
      submit.disabled = false;
    }
  });
})();
