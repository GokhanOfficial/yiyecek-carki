class WheelGame {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinButton = document.getElementById('spinButton');
        this.resultMessage = document.getElementById('result');
        this.codeInput = document.getElementById('codeInput');
        this.codeError = document.getElementById('codeError');
        
        this.isSpinning = false;
        this.currentRotation = 0;
        this.segments = [];
        this.code = null;
        
        this.init();
    }
    
    async init() {
        // Get code from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const codeParam = urlParams.get('code');
        
        if (codeParam) {
            this.codeInput.value = codeParam;
            await this.validateCode(codeParam);
        }
        
        // Load foods from API
        await this.loadFoods();
        
        this.setupCanvas();
        this.drawWheel();
        this.bindEvents();
    }
    
    async loadFoods() {
        try {
            const response = await fetch('/api/foods');
            if (!response.ok) throw new Error('Yiyecekler yüklenemedi');
            
            this.segments = await response.json();
            this.segmentAngle = 360 / this.segments.length;
        } catch (error) {
            console.error('Error loading foods:', error);
            this.showError('Yiyecekler yüklenirken bir hata oluştu');
        }
    }
    
    async validateCode(code) {
        try {
            const response = await fetch(`/api/validate-code/${code}`);
            const data = await response.json();
            
            if (data.valid) {
                this.code = code;
                this.codeError.textContent = '';
                this.codeError.classList.remove('show');
                this.spinButton.disabled = false;
                return true;
            } else {
                this.showError(data.message);
                this.spinButton.disabled = true;
                return false;
            }
        } catch (error) {
            console.error('Error validating code:', error);
            this.showError('Kod doğrulanırken bir hata oluştu');
            this.spinButton.disabled = true;
            return false;
        }
    }
    
    showError(message) {
        this.codeError.textContent = message;
        this.codeError.classList.add('show');
    }
    
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;
        this.radius = Math.min(rect.width, rect.height) / 2 - 10;
    }
    
    drawWheel(rotation = 0) {
        if (this.segments.length === 0) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate((rotation * Math.PI) / 180);
        
        this.segments.forEach((segment, index) => {
            const startAngle = (index * this.segmentAngle * Math.PI) / 180;
            const endAngle = ((index + 1) * this.segmentAngle * Math.PI) / 180;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
            gradient.addColorStop(0, this.lightenColor(segment.color, 20));
            gradient.addColorStop(1, segment.color);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            this.ctx.save();
            this.ctx.rotate(startAngle + (this.segmentAngle * Math.PI) / 360);
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 14px Arial';
            
            const words = segment.name.split(' ');
            const textLines = words.length > 2 ? 
                [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : 
                [segment.name];
            
            textLines.forEach((line, index) => {
                const y = words.length > 2 ? (index === 0 ? -5 : 10) : 3;
                
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
                this.ctx.lineJoin = 'round';
                this.ctx.lineCap = 'round';
                this.ctx.strokeText(line, this.radius * 0.65, y);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText(line, this.radius * 0.65, y);
            });
            
            this.ctx.restore();
        });
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }
    
    async spin() {
        if (this.isSpinning) return;
        
        if (!this.code) {
            this.showError('Lütfen geçerli bir kod girin');
            return;
        }
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.spinButton.classList.add('spinning');
        this.resultMessage.textContent = '';
        this.resultMessage.classList.remove('celebrate');
        
        try {
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: this.code })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Çark çevrilemedi');
            }
            
            const winner = data.winner;
            const winningIndex = this.segments.findIndex(s => s.id === winner.id);
            
            const segmentCenter = winningIndex * this.segmentAngle + this.segmentAngle / 2;
            const targetRotation = 360 - segmentCenter + 270;
            const spins = 5 + Math.floor(Math.random() * 3);
            const totalRotation = spins * 360 + targetRotation;
            
            this.animateWheel(totalRotation, winner);
            
        } catch (error) {
            console.error('Spin error:', error);
            this.showError(error.message);
            this.isSpinning = false;
            this.spinButton.disabled = false;
            this.spinButton.classList.remove('spinning');
        }
    }
    
    animateWheel(targetRotation, winner) {
        const duration = 4000 + Math.random() * 2000;
        const startTime = Date.now();
        const startRotation = this.currentRotation;
        
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            this.currentRotation = startRotation + targetRotation * easeOut;
            this.drawWheel(this.currentRotation);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.onSpinComplete(winner);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    onSpinComplete(winner) {
        this.isSpinning = false;
        this.spinButton.classList.remove('spinning');
        
        this.resultMessage.textContent = `🎉 Tebrikler! ${winner.name} kazandınız!`;
        this.resultMessage.classList.add('celebrate');
        
        // Disable further spins
        this.code = null;
        this.codeInput.disabled = true;
        this.showError('Bu kod kullanılmıştır');
    }
    
    bindEvents() {
        this.spinButton.addEventListener('click', () => this.spin());
        
        this.codeInput.addEventListener('input', async (e) => {
            const code = e.target.value.trim();
            if (code.length >= 12) {
                await this.validateCode(code);
            }
        });
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawWheel(this.currentRotation);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning && this.code) {
                e.preventDefault();
                this.spin();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WheelGame();
});

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});
