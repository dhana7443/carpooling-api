const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = async (userId) => {
  const user = await User.findById(userId).populate('role_id', 'name');

  if (!user) throw new Error('User not found');

  const payload = {
    id: user._id,
    role: user.role_id.name, // Get role name from populated role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return token;
};

module.exports = generateToken;
