import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    age: '',
    gender: 'male'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Handle form submission (POST method - Secure)
  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showMessage('success', result.message);
        setFormData({ username: '', password: '', age: '', gender: 'male' });
        fetchUsers();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Handle insecure creation (GET method - Insecure)
  const handleInsecureCreate = async (e) => {
    e.preventDefault();

    // Build the insecure URL with query parameters
    const insecureUrl = `${API_BASE_URL}/users-insecure/create?username=${encodeURIComponent(formData.username)}&password=${encodeURIComponent(formData.password)}&age=${encodeURIComponent(formData.age)}&gender=${encodeURIComponent(formData.gender)}`;

    // Show alert to students about the insecure URL
    alert(`⚠️ SECURITY WARNING!\n\nLook at your browser URL after this request!\nSensitive data will be visible:\n\nPassword: ${formData.password}\nUsername: ${formData.username}`);

    try {
      setLoading(true);

      // Change the browser URL to show the insecure request
      window.history.pushState({}, '', insecureUrl.replace(API_BASE_URL, ''));

      const response = await fetch(insecureUrl);
      const result = await response.json();

      if (result.success) {
        showMessage('warning', result.message + ' - PASSWORD VISIBLE IN URL ABOVE! 👆');
        setFormData({ username: '', password: '', age: '', gender: 'male' });
        fetchUsers();

        // Keep the insecure URL visible for 5 seconds for educational purposes
        // setTimeout(() => {
        //   window.history.pushState({}, '', '/');
        // }, 8000);
      } else {
        showMessage('error', result.message);
        window.history.pushState({}, '', '/');
      }
    } catch (error) {
      showMessage('error', 'Failed to create user');
      window.history.pushState({}, '', '/');
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          age: formData.age,
          gender: formData.gender
        }),
      });

      const result = await response.json();

      if (result.success) {
        showMessage('success', result.message);
        setFormData({ username: '', password: '', age: '', gender: 'male' });
        setEditingUser(null);
        fetchUsers();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Start editing user
  const startEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't show existing password
      age: user.age.toString(),
      gender: user.gender
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', age: '', gender: 'male' });
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showMessage('success', result.message);
        fetchUsers();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to delete user');
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            User CRUD Demo
          </h1>
          <p className="text-gray-600">
            REST API Example - Comparing POST vs GET Methods
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : message.type === 'warning'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h2>

            {editingUser && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Editing:</strong> {editingUser.username} (ID: {editingUser.id})
                </p>
              </div>
            )}

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter age"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {editingUser ? (
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    onClick={handleUpdateUser}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Updating...' : '✏️ Update User'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={loading}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      onClick={handleCreateUser}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {loading ? 'Creating...' : '✅ Create User (POST - Secure)'}
                    </button>

                    <button
                      type="button"
                      onClick={handleInsecureCreate}
                      disabled={loading}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {loading ? 'Creating...' : '⚠️ Create User (GET - Insecure)'}
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Educational Note:</strong> The red button uses GET method which exposes sensitive data in the URL.
                      Use this to demonstrate security risks to students!
                    </p>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Users List
              </h2>
              <button
                onClick={fetchUsers}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found. Create your first user!
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {user.username}
                        </h3>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          <p>Age: {user.age}</p>
                          <p>Gender: {user.gender}</p>
                          <p>ID: {user.id}</p>
                          <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => startEditUser(user)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Available API Endpoints
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">Secure Endpoints</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="font-mono">GET /api/users</span> - Get all users
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="font-mono">POST /api/users</span> - Create user (secure)
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="font-mono">PUT /api/users/:id</span> - Update user
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="font-mono">DELETE /api/users/:id</span> - Delete user
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-red-600 mb-2">Insecure Endpoint (Demo)</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-red-50 p-2 rounded border border-red-200">
                  <span className="font-mono">GET /api/users-insecure/create</span> - Create user (insecure)
                  <p className="text-red-600 text-xs mt-1">
                    ⚠️ Exposes sensitive data in URL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;