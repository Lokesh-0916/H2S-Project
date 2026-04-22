const express = require('express');
const { STORES_LIST, DEMO_PINS } = require('../data/storesList');

const router = express.Router();

// GET /stores — return full list of known pharmacies
router.get('/', (req, res) => {
  res.json({ success: true, stores: STORES_LIST });
});

module.exports = router;
