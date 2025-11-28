const axios = require('axios'); // You might need to install axios or use http
const assert = require('assert');

const BASE_URL = 'http://localhost:4000';
const client = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true,
    maxRedirects: 0 // Handle redirects manually
});

let cookie = '';

async function runTests() {
    console.log('Starting Backend Verification...');

    // 1. Test Login Page Availability
    console.log('1. Checking Login Page...');
    let res = await client.get('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.includes('Iniciar Sesión'), 'Login page should contain "Iniciar Sesión"');
    console.log('PASS');

    // 2. Test Register Student
    console.log('2. Registering Student...');
    const studentEmail = `student_${Date.now()}@test.com`;
    res = await client.post('/register', new URLSearchParams({
        nombre: 'Test Student',
        email: studentEmail,
        password: 'password123',
        role: 'alumno'
    }));
    // Should redirect to dashboard
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/dashboard');
    // Save cookie
    cookie = res.headers['set-cookie'];
    console.log('PASS');

    // 3. Test Access Dashboard with Cookie
    console.log('3. Accessing Dashboard...');
    res = await client.get('/dashboard', { headers: { Cookie: cookie } });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.includes('Dashboard'), 'Should be on dashboard');
    console.log('PASS');

    // 4. Test Logout
    console.log('4. Logging out...');
    res = await client.get('/logout', { headers: { Cookie: cookie } });
    assert.strictEqual(res.status, 302);
    console.log('PASS');

    // 5. Test Register Profesor
    console.log('5. Registering Profesor...');
    const profEmail = `prof_${Date.now()}@test.com`;
    res = await client.post('/register', new URLSearchParams({
        nombre: 'Test Prof',
        email: profEmail,
        password: 'password123',
        role: 'profesor'
    }));
    assert.strictEqual(res.status, 302);
    cookie = res.headers['set-cookie'];
    console.log('PASS');

    // 6. Test Profesor Access (e.g. Calificaciones POST) - Just checking if route exists/accessible
    console.log('6. Checking Profesor Access...');
    res = await client.get('/calificaciones', { headers: { Cookie: cookie } });
    assert.strictEqual(res.status, 200);
    console.log('PASS');

    console.log('ALL TESTS PASSED');
}

runTests().catch(err => {
    console.error('TEST FAILED:', err.message);
    if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
    }
    process.exit(1);
});
