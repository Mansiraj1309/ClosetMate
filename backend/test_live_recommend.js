const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { userId: '69c85ff78353c46ae9a41471' },
    'closetmate_jwt_super_secret_key_2026',
    { expiresIn: '1h' }
);

fetch('http://localhost:5001/api/stylist/recommend', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ occasion: 'Date night in cool weather' })
})
.then(res => res.json())
.then(data => {
    console.log('RESPONSE:', JSON.stringify(data, null, 2));
    process.exit(0);
})
.catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
