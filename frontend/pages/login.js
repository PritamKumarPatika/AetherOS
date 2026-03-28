document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');

    if (localStorage.getItem('token')) {
        window.location.href = '/';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        const oldText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;

        try {
            const data = await API.login({ email, password });
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/';
            } else {
                errorMsg.textContent = data.error || 'Invalid credentials';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMsg.textContent = 'A network error occurred';
            errorMsg.style.display = 'block';
        } finally {
            submitBtn.textContent = oldText;
            submitBtn.disabled = false;
        }
    });
});
