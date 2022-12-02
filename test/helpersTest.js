const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert(user.id === expectedUserID, `User found: ${expectedUserID} === ${user.id}`);
  });
  it('should return undefined with invalid email', function() {
      const user = getUserByEmail("totally@fake.com", testUsers)
      const expectedUserID = null;
      assert(user === expectedUserID, `User not found`);
  });
});