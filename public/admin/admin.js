class AdminPanel {
    constructor() {
        this.adminPassword = null;
        this.foods = [];
        this.codes = [];
        this.currentEditingFood = null;
        
        this.init();
    }
    
    init() {
        this.bindLoginEvents();
    }
    
    bindLoginEvents() {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            await this.login(password);
        });
    }
    
    async login(password) {
        try {
            const response = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.adminPassword = password;
                this.showAdminPanel();
            } else {
                document.getElementById('loginError').textContent = data.error || 'Hatalı şifre';
            }
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('loginError').textContent = 'Giriş yapılırken bir hata oluştu';
        }
    }
    
    showAdminPanel() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        
        this.bindAdminEvents();
        this.loadStats();
        this.loadFoods();
        this.loadCodes();
    }
    
    bindAdminEvents() {
        // Logout
        document.getElementById('logoutButton').addEventListener('click', () => {
            location.reload();
        });
        
        // Tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Foods
        document.getElementById('addFoodButton').addEventListener('click', () => {
            this.openFoodModal();
        });
        
        document.getElementById('saveFoodsButton').addEventListener('click', () => {
            this.saveFoods();
        });
        
        document.getElementById('foodForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFoodFromModal();
        });
        
        document.getElementById('cancelFoodButton').addEventListener('click', () => {
            this.closeFoodModal();
        });
        
        // Codes
        document.getElementById('generateCodeButton').addEventListener('click', () => {
            this.openCodeModal();
        });
        
        document.getElementById('codeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateCode();
        });
        
        document.getElementById('cancelCodeButton').addEventListener('click', () => {
            this.closeCodeModal();
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
    switchTab(tab) {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });
        
        // Update panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        document.getElementById(`${tab}Tab`).classList.add('active');
        
        // Reload data if needed
        if (tab === 'stats') {
            this.loadStats();
        } else if (tab === 'foods') {
            this.loadFoods();
        } else if (tab === 'codes') {
            this.loadCodes();
        }
    }
    
    async apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Admin-Password': this.adminPassword,
            ...options.headers
        };
        
        const response = await fetch(endpoint, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            alert('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
            location.reload();
            throw new Error('Unauthorized');
        }
        
        return response;
    }
    
    async loadStats() {
        try {
            const response = await this.apiCall('/api/admin/stats');
            const data = await response.json();
            
            document.getElementById('totalCodes').textContent = data.totalCodes;
            document.getElementById('totalSpins').textContent = data.totalSpins;
            document.getElementById('mostWon').textContent = data.mostWonItem ? 
                `${data.mostWonItem.name} (${data.mostWonItem.count})` : '-';
            document.getElementById('last24h').textContent = data.last24Hours;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    async loadFoods() {
        try {
            const response = await this.apiCall('/api/admin/foods');
            const data = await response.json();
            
            this.foods = data.foods;
            this.renderFoods();
            this.updateTotalWeight();
        } catch (error) {
            console.error('Error loading foods:', error);
        }
    }
    
    renderFoods() {
        const container = document.getElementById('foodsList');
        
        if (this.foods.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Henüz yiyecek eklenmemiş</p>';
            return;
        }
        
        container.innerHTML = this.foods.map((food, index) => `
            <div class="food-item" style="border-left-color: ${food.color}">
                <div class="food-color" style="background-color: ${food.color}"></div>
                <div class="food-info">
                    <div class="food-name">${food.name}</div>
                    <div class="food-weight">Oran: ${food.weight}%</div>
                </div>
                <div class="food-actions">
                    <button class="btn-info" onclick="adminPanel.editFood(${index})">Düzenle</button>
                    <button class="btn-danger" onclick="adminPanel.deleteFood(${index})">Sil</button>
                </div>
            </div>
        `).join('');
    }
    
    updateTotalWeight() {
        const total = this.foods.reduce((sum, food) => sum + food.weight, 0);
        document.getElementById('totalWeightDisplay').textContent = `${total}%`;
        
        const warning = document.getElementById('weightWarning');
        if (total !== 100) {
            warning.style.display = 'inline';
        } else {
            warning.style.display = 'none';
        }
    }
    
    openFoodModal(food = null, index = null) {
        this.currentEditingFood = index;
        
        if (food) {
            document.getElementById('foodModalTitle').textContent = 'Yiyecek Düzenle';
            document.getElementById('foodName').value = food.name;
            document.getElementById('foodWeight').value = food.weight;
            document.getElementById('foodColor').value = food.color;
        } else {
            document.getElementById('foodModalTitle').textContent = 'Yiyecek Ekle';
            document.getElementById('foodName').value = '';
            document.getElementById('foodWeight').value = '';
            document.getElementById('foodColor').value = '#FF6B9D';
        }
        
        document.getElementById('foodModal').style.display = 'block';
    }
    
    closeFoodModal() {
        document.getElementById('foodModal').style.display = 'none';
        this.currentEditingFood = null;
    }
    
    saveFoodFromModal() {
        const name = document.getElementById('foodName').value;
        const weight = parseInt(document.getElementById('foodWeight').value);
        const color = document.getElementById('foodColor').value;
        
        const foodData = {
            name,
            weight,
            color
        };
        
        if (this.currentEditingFood !== null) {
            // Edit existing
            this.foods[this.currentEditingFood] = {
                ...this.foods[this.currentEditingFood],
                ...foodData
            };
        } else {
            // Add new
            foodData.id = `food_${Date.now()}`;
            this.foods.push(foodData);
        }
        
        this.renderFoods();
        this.updateTotalWeight();
        this.closeFoodModal();
    }
    
    editFood(index) {
        this.openFoodModal(this.foods[index], index);
    }
    
    deleteFood(index) {
        if (confirm('Bu yiyeceği silmek istediğinizden emin misiniz?')) {
            this.foods.splice(index, 1);
            this.renderFoods();
            this.updateTotalWeight();
        }
    }
    
    async saveFoods() {
        const total = this.foods.reduce((sum, food) => sum + food.weight, 0);
        
        if (total !== 100) {
            alert('Toplam oran 100% olmalıdır!');
            return;
        }
        
        try {
            const response = await this.apiCall('/api/admin/foods', {
                method: 'PUT',
                body: JSON.stringify({ foods: this.foods })
            });
            
            if (response.ok) {
                alert('Yiyecekler başarıyla kaydedildi!');
                await this.loadFoods();
            } else {
                const data = await response.json();
                alert(`Hata: ${data.error}`);
            }
        } catch (error) {
            console.error('Error saving foods:', error);
            alert('Yiyecekler kaydedilirken bir hata oluştu');
        }
    }
    
    async loadCodes() {
        try {
            const response = await this.apiCall('/api/admin/codes');
            this.codes = await response.json();
            this.renderCodes();
        } catch (error) {
            console.error('Error loading codes:', error);
        }
    }
    
    renderCodes() {
        const container = document.getElementById('codesList');
        
        if (this.codes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Henüz kod oluşturulmamış</p>';
            return;
        }
        
        container.innerHTML = this.codes.map(code => {
            const createdDate = new Date(code.createdAt).toLocaleString('tr-TR');
            const status = code.usedCount >= code.maxSpins ? '✅ Kullanılmış' : '🎟️ Aktif';
            const link = `${window.location.origin}/?code=${code.code}`;
            
            return `
                <div class="code-item">
                    <div class="code-header">
                        <div class="code-info">
                            <h3>${code.name}</h3>
                            <div class="code-code">${code.code}</div>
                            <div class="code-meta">
                                Oluşturulma: ${createdDate} | 
                                Durum: ${status} | 
                                Kullanım: ${code.usedCount}/${code.maxSpins}
                            </div>
                        </div>
                        <div class="code-actions">
                            <button class="btn-info" onclick="adminPanel.showCodeDetails('${code.code}')">Detaylar</button>
                            <button class="btn-danger" onclick="adminPanel.deleteCode('${code.code}')">Sil</button>
                        </div>
                    </div>
                    <div class="code-link">
                        <div class="code-link-header">
                            <strong>Paylaşım Linki:</strong>
                            <button class="btn-copy" onclick="adminPanel.copyLink('${link}', this)">
                                Kopyala
                            </button>
                        </div>
                        <div>${link}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    openCodeModal() {
        document.getElementById('codeName').value = '';
        document.getElementById('codeModal').style.display = 'block';
    }
    
    closeCodeModal() {
        document.getElementById('codeModal').style.display = 'none';
    }
    
    async generateCode() {
        const name = document.getElementById('codeName').value.trim();
        
        try {
            const response = await this.apiCall('/api/admin/codes/generate', {
                method: 'POST',
                body: JSON.stringify({ 
                    name: name || undefined,
                    maxSpins: 1
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                alert(`Kod başarıyla oluşturuldu!\n\nKod: ${data.code.code}\nLink: ${window.location.origin}/?code=${data.code.code}`);
                this.closeCodeModal();
                await this.loadCodes();
            } else {
                const data = await response.json();
                alert(`Hata: ${data.error}`);
            }
        } catch (error) {
            console.error('Error generating code:', error);
            alert('Kod oluşturulurken bir hata oluştu');
        }
    }
    
    async deleteCode(code) {
        if (!confirm('Bu kodu silmek istediğinizden emin misiniz?')) {
            return;
        }
        
        try {
            const response = await this.apiCall(`/api/admin/codes/${code}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Kod başarıyla silindi');
                await this.loadCodes();
            } else {
                const data = await response.json();
                alert(`Hata: ${data.error}`);
            }
        } catch (error) {
            console.error('Error deleting code:', error);
            alert('Kod silinirken bir hata oluştu');
        }
    }
    
    showCodeDetails(code) {
        const codeData = this.codes.find(c => c.code === code);
        if (!codeData) return;
        
        const createdDate = new Date(codeData.createdAt).toLocaleString('tr-TR');
        const spinsHtml = codeData.spins && codeData.spins.length > 0 ? `
            <table class="spins-table">
                <thead>
                    <tr>
                        <th>Tarih</th>
                        <th>Kazanılan</th>
                        <th>IP Adresi</th>
                    </tr>
                </thead>
                <tbody>
                    ${codeData.spins.map(spin => `
                        <tr>
                            <td>${new Date(spin.timestamp).toLocaleString('tr-TR')}</td>
                            <td><strong>${spin.wonItem}</strong></td>
                            <td>${spin.ipAddress}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<p style="text-align: center; color: #7f8c8d;">Henüz çevirme yapılmamış</p>';
        
        const content = `
            <div class="code-detail-section">
                <h3>Genel Bilgiler</h3>
                <div class="detail-item">
                    <span class="detail-label">Kampanya Adı:</span>
                    <span class="detail-value">${codeData.name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Kod:</span>
                    <span class="detail-value">${codeData.code}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Oluşturulma Tarihi:</span>
                    <span class="detail-value">${createdDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Kullanım Durumu:</span>
                    <span class="detail-value">${codeData.usedCount}/${codeData.maxSpins}</span>
                </div>
            </div>
            
            <div class="code-detail-section">
                <h3>Çevirme Geçmişi (${codeData.spins ? codeData.spins.length : 0})</h3>
                ${spinsHtml}
            </div>
        `;
        
        document.getElementById('codeDetailsContent').innerHTML = content;
        document.getElementById('codeDetailsModal').style.display = 'block';
    }
    
    copyLink(link, button) {
        navigator.clipboard.writeText(link).then(() => {
            const originalText = button.textContent;
            button.textContent = '✓ Kopyalandı';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('Link kopyalanamadı. Lütfen manuel olarak kopyalayın.');
        });
    }
}

// Initialize admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
