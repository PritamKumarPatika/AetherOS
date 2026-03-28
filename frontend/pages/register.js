document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const errorMsg = document.getElementById('error-msg');

    if (localStorage.getItem('token')) {
        window.location.href = '/';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        const oldText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;

        try {
            const data = await API.register({ name, email, password });
            if (data.success) {
                // Auto login after registration
                const loginData = await API.login({ email, password });
                if (loginData.token) {
                    localStorage.setItem('token', loginData.token);
                    localStorage.setItem('user', JSON.stringify(loginData.user));
                    window.location.href = '/';
                }
            } else {
                errorMsg.textContent = data.error || 'Failed to create account';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error('Register error:', error);
            errorMsg.textContent = 'A network error occurred';
            errorMsg.style.display = 'block';
        } finally {
            submitBtn.textContent = oldText;
            submitBtn.disabled = false;
        }
    });
});
