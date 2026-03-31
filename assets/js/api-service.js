class ApiService {
    constructor() { this.baseUrl = 'https://web-production-47eca.up.railway.app/api'; }
    async getAllDocuments() { const r = await fetch(`${this.baseUrl}/documents`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async getDocumentsByCategory(cat) { const r = await fetch(`${this.baseUrl}/documents/category/${cat}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async getDocumentsByFileType(ft) { const r = await fetch(`${this.baseUrl}/documents/type/${ft}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async searchDocuments(term) { const r = await fetch(`${this.baseUrl}/documents/search?term=${encodeURIComponent(term)}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async uploadDocument(fd) { const r = await fetch(`${this.baseUrl}/documents`, {method:'POST',body:fd}); if (!r.ok) { const e=await r.json(); throw new Error(e.message||`HTTP ${r.status}`); } return r.json(); }
    async updateDocument(id,data) { const r = await fetch(`${this.baseUrl}/documents/${id}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async deleteDocument(id) { const r = await fetch(`${this.baseUrl}/documents/${id}`, {method:'DELETE'}); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async downloadDocument(id) { const r = await fetch(`${this.baseUrl}/documents/download/${id}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); }
    async getAllTests() { const r = await fetch(`${this.baseUrl}/tests`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async getTestsByLevel(level) { const r = await fetch(`${this.baseUrl}/tests/level/${level}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async searchTests(term) { const r = await fetch(`${this.baseUrl}/tests/search?term=${encodeURIComponent(term)}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async uploadTest(fd) { const r = await fetch(`${this.baseUrl}/tests`, {method:'POST',body:fd}); if (!r.ok) { const e=await r.json(); throw new Error(e.message||`HTTP ${r.status}`); } return r.json(); }
    async updateTest(id,data) { const r = await fetch(`${this.baseUrl}/tests/${id}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async deleteTest(id) { const r = await fetch(`${this.baseUrl}/tests/${id}`, {method:'DELETE'}); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
    async startTest(id) { const r = await fetch(`${this.baseUrl}/tests/start/${id}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); }
}
const apiService = new ApiService();

