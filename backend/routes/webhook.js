const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    console.log('Webhook POST request received');
    res.json({ received: true });
});

module.exports = router;
