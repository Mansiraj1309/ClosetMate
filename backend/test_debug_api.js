const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: '69c85ff78353c46ae9a41471' }, 'closetmate_jwt_super_secret_key_2026');

fetch('http://localhost:5002/api/stylist/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ occasion: 'Office outfit' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
