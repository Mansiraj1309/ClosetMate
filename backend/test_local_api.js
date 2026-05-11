const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { userId: 'testuserid' },
    'closetmate_jwt_super_secret_key_2026',
    { expiresIn: '1h' }
);

fetch('http://localhost:5001/api/stylist/recommend', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ occasion: 'Office outfit' })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
