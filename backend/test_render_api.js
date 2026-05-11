const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { userId: 'testuserid' },
    'closetmate_jwt_super_secret_key_2026',
    { expiresIn: '1h' }
);

fetch('https://closetmate-n5l2.onrender.com/api/stylist/recommend', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ occasion: 'Office outfit' })
})
.then(res => res.text())
.then(text => console.log(text))
.catch(err => console.error(err));
