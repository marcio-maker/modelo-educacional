// app.js - Aha! Academy PWA - FINAL E OTIMIZADO
class AhaApp {
    constructor() {
        this.currentScreen = 'home';
        this.carouselInterval = null;
        this.currentCarouselIndex = 0;
        this.isInitialized = false;
        this.currentLessonId = 0; 
        
        // Dados de Lições e Cursos
        this.lessons = [
            { id: 101, title: 'Introdução e Mindset de Liderança', videoId: 'eC7x9u0B6vE', description: 'Bem-vindo ao curso! Nesta lição introdutória, exploraremos os fundamentos da liderança consciente e o mindset necessário para o sucesso.', course: 'Liderança Consciente', completed: false, notes: '', courseId: 'lideranca' },
            { id: 102, title: 'Comunicação Empática e Assertiva', videoId: 'k42_t8e4V_U', description: 'Aprenda técnicas de comunicação que constroem confiança, reduzem atritos e melhoram o engajamento da equipe, focando na escuta ativa.', course: 'Liderança Consciente', completed: false, notes: '', courseId: 'lideranca' },
            { id: 201, title: 'Inteligência Emocional: O Básico', videoId: 't6-51p0QJbY', description: 'O ponto de partida para dominar suas emoções e construir resiliência mental e emocional.', course: 'Inteligência Emocional', completed: false, notes: '', courseId: 'emocional' },
            { id: 202, title: 'A Matriz de Eisenhower (Foco)', videoId: 'Y9fP5F9eP3o', description: 'Domine a arte da priorização com a Matriz de Eisenhower, distinguindo o que é urgente do que é importante para otimizar seu tempo.', course: 'Inteligência Emocional', completed: false, notes: '', courseId: 'emocional' },
        ];
        
        // Simulação de metadados para filtro de cursos (Melhoria 4)
        this.courseMetadata = {
            'lideranca': { level: 'intermediario', topic: 'lideranca' },
            'emocional': { level: 'iniciante', topic: 'emocional' },
            'carreira': { level: 'avancado', topic: 'carreira' },
            'produtividade': { level: 'iniciante', topic: 'produtividade' }
        };

        this.initializeUserData();
        this.handleScreenChange = this.handleScreenChange.bind(this);
    }

    // ========== 1. INICIALIZAÇÃO DE DADOS E SAVE ==========
    initializeUserData() {
        try {
            const savedSettings = localStorage.getItem('ahaUserSettings');
            this.userSettings = savedSettings ?
                JSON.parse(savedSettings) :
                {
                    profile: { name: 'João Silva', email: 'joao@email.com' },
                    preferences: { darkMode: false, emailNotifications: true, autoplay: true },
                    lastScreen: 'home'
                };

            const savedProgress = localStorage.getItem('ahaUserProgress');
            this.userProgress = savedProgress ?
                JSON.parse(savedProgress) :
                {
                    totalStudyTime: 0, 
                    streak: 0,
                    lastStudyDate: null,
                    lessonsCompleted: [], 
                    lessonNotes: {} 
                };

            this.lessons.forEach(lesson => {
                lesson.completed = this.userProgress.lessonsCompleted.includes(lesson.id);
                lesson.notes = this.userProgress.lessonNotes[lesson.id] || '';
            });

        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }

    saveSettings() {
        localStorage.setItem('ahaUserSettings', JSON.stringify(this.userSettings));
    }

    saveProgress() {
        // Sincroniza estado de conclusão e notas antes de salvar
        this.userProgress.lessonsCompleted = this.lessons
            .filter(l => l.completed)
            .map(l => l.id);
        
        this.userProgress.lessonNotes = {};
        this.lessons.forEach(l => {
            if (l.notes) {
                this.userProgress.lessonNotes[l.id] = l.notes;
            }
        });
        
        localStorage.setItem('ahaUserProgress', JSON.stringify(this.userProgress));
        this.updateProgressUI();
    }
    
    // ========== 2. CONTROLE DE TELA E UI ==========
    initUI() {
        // 1. Aplica o Dark Mode, se necessário
        if (this.userSettings.preferences.darkMode) {
            document.body.classList.add('dark-mode');
        }
        
        // 2. Sincroniza as configurações
        this.safeUpdateCheckbox('dark-mode-toggle', this.userSettings.preferences.darkMode);
        this.safeUpdateCheckbox('email-notifications-toggle', this.userSettings.preferences.emailNotifications);
        this.safeUpdateCheckbox('autoplay-toggle', this.userSettings.preferences.autoplay);


        // 3. Preenche campos do usuário
        this.safeUpdateText('welcome-user-name', this.userSettings.profile.name.split(' ')[0] + '!');
        this.safeUpdateText('user-name-sidebar', this.userSettings.profile.name);
        this.safeUpdateText('user-email-sidebar', this.userSettings.profile.email);
        this.safeUpdateValue('settings-name', this.userSettings.profile.name);
        this.safeUpdateValue('settings-email', this.userSettings.profile.email);
        this.safeUpdateText('total-courses-count', '2'); // Simula 2 cursos totais

        // 4. Navega para a última tela e atualiza o progresso
        this.navigateTo(this.userSettings.lastScreen || 'home', false);
        this.updateProgressUI();
        
        // Melhoria 1: Solicita permissão de notificação
        this.requestNotificationPermission();
    }

    navigateTo(screenId, save = true) {
        document.querySelectorAll('.app-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
        
        document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(item => {
            const dataScreen = item.getAttribute('data-screen');
            item.classList.toggle('active', dataScreen === screenId);
        });
        document.getElementById('sidebar')?.classList.remove('active');
        
        if (save) {
            this.userSettings.lastScreen = screenId;
            this.saveSettings();
        }
        
        if (screenId === 'home') this.startCarousel();
        if (screenId !== 'home' && this.carouselInterval) clearInterval(this.carouselInterval);
        
        // Melhoria 4: Aplica filtros se for a tela de cursos
        if (screenId === 'cursos') this.applyCourseFilters();
    }

    handleScreenChange(event) {
        const target = event.currentTarget.getAttribute('data-screen');
        if (target) {
            event.preventDefault();
            this.navigateTo(target);
        }
    }

    safeUpdateText(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    safeUpdateValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }
    
    safeUpdateCheckbox(id, checked) {
        const element = document.getElementById(id);
        if (element) {
            element.checked = checked;
        }
    }

    // ========== 3. CAROUSEL E ACESSIBILIDADE ==========
    goToCarouselSlide(index) {
        this.currentCarouselIndex = index;
        const track = document.querySelector('.carousel-track');
        const dots = document.querySelectorAll('.carousel-dots .dot');
        
        if (track) {
            track.style.transform = `translateX(-${index * (100 / track.children.length)}%)`;
        }
        
        dots.forEach((dot, i) => {
            const isActive = i === index;
            dot.classList.toggle('active', isActive);
            
            // Melhoria 3: Acessibilidade ARIA
            dot.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
            dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    }

    // ========== 4. PROGRESSO E GAMIFICAÇÃO ==========
    markLessonComplete(lessonId, markComplete = true) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (!lesson || lesson.completed === markComplete) return;
        
        lesson.completed = markComplete;
        this.updateStudyStreak(); 
        this.saveProgress();
        this.showLesson(lessonId, false);

        // Melhoria 2: Adiciona feedback visual de gamificação
        if (markComplete) {
            const markBtn = document.getElementById('mark-complete-btn');
            if (markBtn) {
                const userName = this.userSettings.profile.name.split(' ')[0];
                markBtn.textContent = 'Concluído! 🥳';
                markBtn.classList.add('pulse-active'); // Ativa a animação CSS
                
                setTimeout(() => {
                    alert(`Parabéns, ${userName}! Lição concluída e sua sequência de estudos continua!`);
                }, 500);
                
                setTimeout(() => {
                    markBtn.textContent = 'Lição Concluída';
                    markBtn.classList.remove('pulse-active');
                }, 1500);
            }
        }
    }

    updateStudyStreak() {
        const today = new Date().toDateString();
        const lastStudyDate = this.userProgress.lastStudyDate;
        
        if (lastStudyDate !== today) {
            if (!lastStudyDate || this.isYesterday(lastStudyDate)) {
                this.userProgress.streak++;
            } else if (!this.isToday(lastStudyDate)) {
                this.userProgress.streak = 1;
            }
            
            this.userProgress.lastStudyDate = today;
        }
        
        // Simula o acúmulo de tempo de estudo
        this.userProgress.totalStudyTime += 5;
    }

    isYesterday(dateString) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return dateString === yesterday.toDateString();
    }
    
    isToday(dateString) {
        return dateString === new Date().toDateString();
    }


    // ========== 5. FILTRAGEM DE CURSOS E NOTIFICAÇÕES ==========
    
    // Melhoria 1: Método para pedir permissão de notificação
    requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Este navegador não suporta notificações de desktop.');
            return;
        }
        
        if (Notification.permission === 'granted') {
            console.log('Permissão de notificação já concedida.');
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Permissão de notificação concedida.');
                    // Aqui você faria a assinatura do usuário para Push
                }
            });
        }
    }
    
    // Melhoria 4: Método para aplicar filtros de cursos
    applyCourseFilters() {
        const level = document.getElementById('filter-level')?.value;
        const topic = document.getElementById('filter-topic')?.value;
        const courseCards = document.querySelectorAll('.course-grid.full-catalog .course-card');

        if (courseCards.length === 0) return;

        courseCards.forEach(card => {
            const courseId = card.getAttribute('data-course-id');
            let shouldShow = true;
            
            const metadata = this.courseMetadata[courseId];

            if (metadata) {
                if (level !== 'all' && metadata.level !== level) {
                    shouldShow = false;
                }
                if (topic !== 'all' && metadata.topic !== topic) {
                    shouldShow = false;
                }
            } else {
                 // Trata cursos sem metadados (como placeholders futuros)
                 if (level !== 'all' || topic !== 'all') {
                    shouldShow = false;
                 }
            }

            card.style.display = shouldShow ? 'flex' : 'none';
        });
    }

    // ========== 6. LISTENERS E INICIAÇÃO ==========
    addEventListeners() {
        // ... (Listeners de navegação e botões existentes) ...
        document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
            link.addEventListener('click', this.handleScreenChange);
        });
        document.getElementById('show-sidebar-btn')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('active');
        });
        document.getElementById('sidebar')?.addEventListener('click', (e) => {
            if (e.target.tagName === 'ASIDE' || e.target.classList.contains('nav-link')) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
        document.getElementById('back-to-cursos')?.addEventListener('click', () => {
            this.navigateTo('cursos');
        });

        // Botão de Dark Mode
        document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
            this.userSettings.preferences.darkMode = e.target.checked;
            document.body.classList.toggle('dark-mode', e.target.checked);
            this.saveSettings();
        });
        
        // Listener de progresso (exemplo: salvar anotações)
        document.getElementById('save-notes-btn')?.addEventListener('click', () => {
            this.lessons.find(l => l.id === this.currentLessonId).notes = document.getElementById('lesson-notes-textarea').value;
            this.saveProgress();
            alert('Anotações salvas com sucesso!');
        });
        
        // Listener de conclusão de lição
        document.getElementById('mark-complete-btn')?.addEventListener('click', () => {
            this.markLessonComplete(this.currentLessonId);
        });

        // Melhoria 5: Listener para salvar configurações de perfil
        document.querySelector('#configuracoes .btn-primary')?.addEventListener('click', (e) => {
            e.preventDefault();
            const newNameInput = document.getElementById('settings-name');
            const newEmailInput = document.getElementById('settings-email');
            
            const newName = newNameInput.value.trim();
            const newEmail = newEmailInput.value.trim();
            let changed = false;
            
            if (newName && newName !== this.userSettings.profile.name) {
                this.userSettings.profile.name = newName;
                // Atualiza a UI imediatamente
                this.safeUpdateText('welcome-user-name', newName.split(' ')[0] + '!');
                this.safeUpdateText('user-name-sidebar', newName);
                changed = true;
            }
            
            // O email está desabilitado, mas a lógica de salvar está correta se for habilitado
            if (newEmail && newEmail !== this.userSettings.profile.email && !newEmailInput.disabled) {
                this.userSettings.profile.email = newEmail;
                this.safeUpdateText('user-email-sidebar', newEmail);
                changed = true;
            }
            
            if (changed) {
                this.saveSettings();
                alert('Perfil atualizado com sucesso!');
            } else {
                alert('Nenhuma alteração detectada.');
            }
        });
        
        // Melhoria 4: Listener para aplicar filtros de cursos (e mudança de select)
        document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
            this.applyCourseFilters();
        });
        document.getElementById('filter-level')?.addEventListener('change', () => this.applyCourseFilters());
        document.getElementById('filter-topic')?.addEventListener('change', () => this.applyCourseFilters());
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        document.getElementById('loading-screen')?.classList.remove('active');
        document.getElementById('app-container')?.setAttribute('aria-hidden', 'false');

        this.initUI();
        this.addEventListeners();
        
        // Configuração inicial e loop do Carousel
        const track = document.querySelector('.carousel-track');
        if (track) {
            const items = track.children.length;
            const dotsContainer = document.getElementById('carousel-dots');
            if (dotsContainer.children.length === 0) {
                for(let i=0; i<items; i++) {
                    const dot = document.createElement('span');
                    dot.classList.add('dot');
                    dot.onclick = () => this.goToCarouselSlide(i);
                    dotsContainer.appendChild(dot);
                }
            }
            this.goToCarouselSlide(this.currentCarouselIndex);

            this.startCarousel = () => {
                if (this.carouselInterval) clearInterval(this.carouselInterval);
                this.carouselInterval = setInterval(() => {
                    this.currentCarouselIndex = (this.currentCarouselIndex + 1) % items;
                    this.goToCarouselSlide(this.currentCarouselIndex);
                }, 5000); 
            };
        }
        
        console.log('Aha! Academy PWA inicializada com sucesso.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new AhaApp();
    app.init();
});