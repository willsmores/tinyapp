// Helper function for looking up users by email address
const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

module.exports = { getUserByEmail };