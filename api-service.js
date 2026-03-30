/**
 * API Service for OrthoPro+ Dashboard
 * Handles communication with the backend services
 */

class ApiService {
    /**
     * Base URL for API requests
     */
    constructor() {
      this.baseUrl = 'https://mouad-erraji-211-orthopro-api.hf.space/api';    }

    /**
     * Get all documents from the database
     * @returns {Promise} Promise that resolves to a list of documents
     */
    async getAllDocuments() {
        try {
            const response = await fetch(`${this.baseUrl}/documents`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching documents:', error);
            throw error;
        }
    }

    /**
     * Get documents by category
     * @param {string} category - The category to filter by
     * @returns {Promise} Promise that resolves to a list of filtered documents
     */
    async getDocumentsByCategory(category) {
        try {
            const response = await fetch(`${this.baseUrl}/documents/category/${category}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching documents by category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Get documents by file type
     * @param {string} fileType - The file type to filter by
     * @returns {Promise} Promise that resolves to a list of filtered documents
     */
    async getDocumentsByFileType(fileType) {
        try {
            const response = await fetch(`${this.baseUrl}/documents/type/${fileType}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching documents by file type ${fileType}:`, error);
            throw error;
        }
    }

    /**
     * Search documents by term
     * @param {string} term - The search term
     * @returns {Promise} Promise that resolves to a list of matching documents
     */
    async searchDocuments(term) {
        try {
            const response = await fetch(`${this.baseUrl}/documents/search?term=${encodeURIComponent(term)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error searching documents with term ${term}:`, error);
            throw error;
        }
    }

    /**
     * Upload a new document
     * @param {FormData} formData - Form data containing document information and file
     * @returns {Promise} Promise that resolves to the uploaded document
     */
    async uploadDocument(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/documents`, {
                method: 'POST',
                body: formData
                // No Content-Type header, browser will set it with boundary for FormData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    }

    /**
     * Update a document's metadata
     * @param {number} id - Document ID
     * @param {Object} updateData - Data to update
     * @returns {Promise} Promise that resolves to the updated document
     */
    async updateDocument(id, updateData) {
        try {
            const response = await fetch(`${this.baseUrl}/documents/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error updating document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a document
     * @param {number} id - Document ID to delete
     * @returns {Promise} Promise that resolves to the delete operation result
     */
    async deleteDocument(id) {
        try {
            const response = await fetch(`${this.baseUrl}/documents/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error deleting document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Download a document
     * @param {number} id - Document ID to download
     * @returns {Promise} Promise that resolves to the document blob
     */
    async downloadDocument(id) {
        try {
            const response = await fetch(`${this.baseUrl}/documents/download/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.blob();
        } catch (error) {
            console.error(`Error downloading document ${id}:`, error);
            throw error;
        }
    }

    // Tests API calls

    /**
     * Get all tests from the database
     * @returns {Promise} Promise that resolves to a list of tests
     */
    async getAllTests() {
        try {
            const response = await fetch(`${this.baseUrl}/tests`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching tests:', error);
            throw error;
        }
    }

    /**
     * Get tests by level
     * @param {string} level - The difficulty level to filter by
     * @returns {Promise} Promise that resolves to a list of filtered tests
     */
    async getTestsByLevel(level) {
        try {
            const response = await fetch(`${this.baseUrl}/tests/level/${level}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching tests by level ${level}:`, error);
            throw error;
        }
    }

    /**
     * Search tests by term
     * @param {string} term - The search term
     * @returns {Promise} Promise that resolves to a list of matching tests
     */
    async searchTests(term) {
        try {
            const response = await fetch(`${this.baseUrl}/tests/search?term=${encodeURIComponent(term)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error searching tests with term ${term}:`, error);
            throw error;
        }
    }

    /**
     * Upload a new test
     * @param {FormData} formData - Form data containing test information and file
     * @returns {Promise} Promise that resolves to the uploaded test
     */
    async uploadTest(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/tests`, {
                method: 'POST',
                body: formData
                // No Content-Type header, browser will set it with boundary for FormData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading test:', error);
            throw error;
        }
    }

    /**
     * Update a test's metadata
     * @param {number} id - Test ID
     * @param {Object} updateData - Data to update
     * @returns {Promise} Promise that resolves to the updated test
     */
    async updateTest(id, updateData) {
        try {
            const response = await fetch(`${this.baseUrl}/tests/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error updating test ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a test
     * @param {number} id - Test ID to delete
     * @returns {Promise} Promise that resolves to the delete operation result
     */
    async deleteTest(id) {
        try {
            const response = await fetch(`${this.baseUrl}/tests/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error deleting test ${id}:`, error);
            throw error;
        }
    }

    /**
     * Load test for starting
     * @param {number} id - Test ID to start
     * @returns {Promise} Promise that resolves to the test HTML content
     */
    async startTest(id) {
        try {
            const response = await fetch(`${this.baseUrl}/tests/start/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error(`Error starting test ${id}:`, error);
            throw error;
        }
    }
}

// Create a singleton instance for the application
const apiService = new ApiService();