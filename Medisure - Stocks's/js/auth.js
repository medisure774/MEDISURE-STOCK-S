// =============================================
// MEDISURE PLUS — Auth Module (JWT)
// =============================================

const auth = {
  async login(employee_id, password) {
    try {
      const data = await api.post('/auth/login', { employee_id, password });

      // Store token and user info
      localStorage.setItem('medisure_token', data.token);
      localStorage.setItem('medisure_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  logout() {
    localStorage.removeItem('medisure_token');
    localStorage.removeItem('medisure_user');
    window.location.href = 'index.html';
  },

  getUser() {
    try {
      const u = localStorage.getItem('medisure_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },

  getToken() {
    return localStorage.getItem('medisure_token');
  },

  requireAuth() {
    const user = this.getUser();
    if (!user || !this.getToken()) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  }
};

window.auth = auth;
