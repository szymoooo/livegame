// System Zarządzania Meczem Koszykówki
class MatchManager {
    constructor() {
        this.matchState = {
            isRunning: false,
            isPaused: false,
            startTime: null,
            pausedTime: 0,
            currentTime: 0,
            currentPeriod: 1,
            maxPeriods: 4,
            periodDuration: 10 * 60 * 1000, // 10 minut na okres
            homeScore: 0,
            awayScore: 0,
            periodScores: [
                {home: 0, away: 0},
                {home: 0, away: 0},
                {home: 0, away: 0},
                {home: 0, away: 0}
            ],
            events: [],
            stats: {
                homeFouls: 0,
                awayFouls: 0,
                homeTimeouts: 0,
                awayTimeouts: 0
            }
        };
        
        this.teams = {
            home: {
                name: 'Rostock Seawolves I',
                color1: '#ffffff',
                color2: '#3d41da'
            },
            away: {
                name: 'AK MAMA Sierakowice',
                color1: '#000000',
                color2: '#ffffff'
            }
        };

        this.timerInterval = null;
        this.eventId = 1;
        
        this.initializeEventHandlers();
        this.updateDisplay();
        this.loadTeamColors();
        this.createStatusIndicator();
    }

    // Inicjalizacja event handlerów
    initializeEventHandlers() {
        // Obsługa zmian nazw drużyn i kolorów
        document.getElementById('homeTeam').addEventListener('input', (e) => {
            this.teams.home.name = e.target.value;
            this.updateTeamDisplay();
        });

        document.getElementById('awayTeam').addEventListener('input', (e) => {
            this.teams.away.name = e.target.value;
            this.updateTeamDisplay();
        });

        // Obsługa zmian kolorów
        ['homeColor1', 'homeColor2', 'awayColor1', 'awayColor2'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                const [team, colorNum] = id.match(/(home|away)Color(\d)/).slice(1);
                this.teams[team][`color${colorNum}`] = e.target.value;
                this.updateTeamColors();
            });
        });

        // Auto-uzupełnianie graczy
        this.setupPlayerAutocomplete();
    }

    // Stworzenie wskaźnika statusu
    createStatusIndicator() {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'match-status';
        statusDiv.innerHTML = `
            <span class="status-indicator stopped" id="statusIndicator"></span>
            <span id="statusText">Mecz zatrzymany</span>
        `;
        document.body.appendChild(statusDiv);
    }

    // Aktualizacja wskaźnika statusu
    updateStatusIndicator() {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        
        if (this.matchState.isRunning && !this.matchState.isPaused) {
            indicator.className = 'status-indicator running';
            text.textContent = 'Mecz trwa';
        } else if (this.matchState.isPaused) {
            indicator.className = 'status-indicator paused';
            text.textContent = 'Pauza';
        } else {
            indicator.className = 'status-indicator stopped';
            text.textContent = 'Mecz zatrzymany';
        }
    }

    // Ładowanie kolorów drużyn
    loadTeamColors() {
        document.getElementById('homeColor1').value = this.teams.home.color1;
        document.getElementById('homeColor2').value = this.teams.home.color2;
        document.getElementById('awayColor1').value = this.teams.away.color1;
        document.getElementById('awayColor2').value = this.teams.away.color2;
        this.updateTeamColors();
    }

    // Aktualizacja kolorów drużyn w interfejsie
    updateTeamColors() {
        const homeColors = document.getElementById('homeTeamColors');
        const awayColors = document.getElementById('awayTeamColors');
        
        homeColors.style.background = `linear-gradient(90deg, ${this.teams.home.color1} 50%, ${this.teams.home.color2} 50%)`;
        awayColors.style.background = `linear-gradient(90deg, ${this.teams.away.color1} 50%, ${this.teams.away.color2} 50%)`;
    }

    // Aktualizacja nazw drużyn w interfejsie
    updateTeamDisplay() {
        document.getElementById('homeTeamName').textContent = this.teams.home.name;
        document.getElementById('awayTeamName').textContent = this.teams.away.name;
    }

    // Rozpoczęcie meczu
    startMatch() {
        if (!this.matchState.isRunning) {
            this.matchState.isRunning = true;
            this.matchState.isPaused = false;
            this.matchState.startTime = Date.now() - this.matchState.pausedTime;
            
            this.addEvent({
                type: 'start',
                description: `Rozpoczęcie ${this.matchState.currentPeriod}. okresu`,
                team: 'both'
            });
        } else if (this.matchState.isPaused) {
            this.matchState.isPaused = false;
            this.matchState.startTime = Date.now() - this.matchState.currentTime;
            
            this.addEvent({
                type: 'resume',
                description: 'Wznowienie meczu',
                team: 'both'
            });
        }

        this.startTimer();
        this.updateStatusIndicator();
    }

    // Pauza meczu
    pauseMatch() {
        if (this.matchState.isRunning && !this.matchState.isPaused) {
            this.matchState.isPaused = true;
            this.stopTimer();
            
            this.addEvent({
                type: 'pause',
                description: 'Pauza w meczu',
                team: 'both'
            });
            
            this.updateStatusIndicator();
        }
    }

    // Reset meczu
    resetMatch() {
        const confirmed = confirm('Czy na pewno chcesz zresetować mecz? Wszystkie dane zostaną utracone.');
        if (!confirmed) return;

        this.stopTimer();
        this.matchState = {
            isRunning: false,
            isPaused: false,
            startTime: null,
            pausedTime: 0,
            currentTime: 0,
            currentPeriod: 1,
            maxPeriods: 4,
            periodDuration: 10 * 60 * 1000,
            homeScore: 0,
            awayScore: 0,
            periodScores: [
                {home: 0, away: 0},
                {home: 0, away: 0},
                {home: 0, away: 0},
                {home: 0, away: 0}
            ],
            events: [],
            stats: {
                homeFouls: 0,
                awayFouls: 0,
                homeTimeouts: 0,
                awayTimeouts: 0
            }
        };

        this.eventId = 1;
        this.updateDisplay();
        this.clearFeed();
        this.updateStatusIndicator();

        this.addEvent({
            type: 'reset',
            description: 'Mecz został zresetowany',
            team: 'both'
        });
    }

    // Następny okres
    nextPeriod() {
        if (this.matchState.currentPeriod < this.matchState.maxPeriods) {
            this.matchState.currentPeriod++;
            this.matchState.currentTime = 0;
            this.matchState.pausedTime = 0;
            
            if (this.matchState.isRunning) {
                this.matchState.startTime = Date.now();
            }

            this.addEvent({
                type: 'period',
                description: `Rozpoczęcie ${this.matchState.currentPeriod}. okresu`,
                team: 'both'
            });

            this.updateDisplay();
        } else {
            this.endMatch();
        }
    }

    // Zakończenie meczu
    endMatch() {
        this.stopTimer();
        this.matchState.isRunning = false;
        
        const winner = this.matchState.homeScore > this.matchState.awayScore ? 
            this.teams.home.name : 
            this.matchState.awayScore > this.matchState.homeScore ? 
            this.teams.away.name : 
            'Remis';

        this.addEvent({
            type: 'end',
            description: `Koniec meczu! ${winner === 'Remis' ? 'Remis!' : `Zwycięzca: ${winner}!`}`,
            team: 'both'
        });

        this.updateStatusIndicator();
        alert(`Mecz zakończony!\nWynik: ${this.matchState.homeScore} - ${this.matchState.awayScore}\n${winner === 'Remis' ? 'Remis!' : `Zwycięzca: ${winner}`}`);
    }

    // Timer meczu
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.matchState.isRunning && !this.matchState.isPaused) {
                this.matchState.currentTime = Date.now() - this.matchState.startTime;
                
                // Sprawdzenie czy okres się skończył
                if (this.matchState.currentTime >= this.matchState.periodDuration) {
                    this.addEvent({
                        type: 'period_end',
                        description: `Koniec ${this.matchState.currentPeriod}. okresu`,
                        team: 'both'
                    });
                    
                    if (this.matchState.currentPeriod < this.matchState.maxPeriods) {
                        setTimeout(() => this.nextPeriod(), 1000);
                    } else {
                        this.endMatch();
                    }
                }
                
                this.updateTimeDisplay();
            }
        }, 100);
    }

    // Zatrzymanie timera
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.matchState.pausedTime = this.matchState.currentTime;
    }

    // Formatowanie czasu
    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Aktualizacja wyświetlania czasu
    updateTimeDisplay() {
        const timeString = this.formatTime(this.matchState.currentTime);
        document.getElementById('currentTime').textContent = timeString;
        document.getElementById('liveTime').textContent = timeString;
    }

    // Szybkie dodanie gola
    quickGoal(team, points) {
        if (!this.matchState.isRunning) {
            alert('Mecz musi być rozpoczęty aby dodać gol!');
            return;
        }

        this.matchState[`${team}Score`] += points;
        this.matchState.periodScores[this.matchState.currentPeriod - 1][team] += points;

        this.addEvent({
            type: 'goal',
            description: `${points === 2 ? 'Gol za 2 pkt' : 'Gol za 3 pkt'}`,
            team: team,
            points: points,
            player: 'Nieznany zawodnik'
        });

        this.updateDisplay();
    }

    // Dodanie wydarzenia
    addEvent(eventData = {}) {
        const currentTime = this.matchState.isRunning ? this.matchState.currentTime : 0;
        
        const event = {
            id: this.eventId++,
            timestamp: Date.now(),
            matchTime: currentTime,
            period: this.matchState.currentPeriod,
            type: eventData.type || document.getElementById('eventType').value,
            team: eventData.team || document.getElementById('eventTeam').value,
            player: eventData.player || document.getElementById('playerName').value,
            playerNumber: eventData.playerNumber || document.getElementById('playerNumber').value,
            description: eventData.description || document.getElementById('eventDescription').value,
            points: eventData.points || 0
        };

        // Aktualizacja wyniku dla goli
        if (event.type.includes('goal')) {
            const points = event.type === 'goal3' ? 3 : 2;
            if (event.team === 'home') {
                this.matchState.homeScore += points;
                this.matchState.periodScores[this.matchState.currentPeriod - 1].home += points;
            } else if (event.team === 'away') {
                this.matchState.awayScore += points;
                this.matchState.periodScores[this.matchState.currentPeriod - 1].away += points;
            }
            event.points = points;
        }

        // Aktualizacja statystyk
        if (event.type === 'foul') {
            if (event.team === 'home') this.matchState.stats.homeFouls++;
            if (event.team === 'away') this.matchState.stats.awayFouls++;
        }

        if (event.type === 'timeout') {
            if (event.team === 'home') this.matchState.stats.homeTimeouts++;
            if (event.team === 'away') this.matchState.stats.awayTimeouts++;
        }

        this.matchState.events.unshift(event); // Najnowsze wydarzenia na górze
        this.displayEvent(event);
        this.updateDisplay();
        this.clearEventForm();

        // Zapisanie do localStorage
        this.saveToLocalStorage();
    }

    // Wyświetlenie wydarzenia w feed
    displayEvent(event) {
        const feedContent = document.getElementById('feedContent');
        const eventElement = this.createEventElement(event);
        
        // Dodanie na początek feedu
        if (feedContent.firstChild && feedContent.firstChild.className !== 'welcome-message') {
            feedContent.insertBefore(eventElement, feedContent.firstChild);
        } else {
            feedContent.appendChild(eventElement);
        }

        // Scroll do góry żeby pokazać najnowsze wydarzenie
        feedContent.scrollTop = 0;
    }

    // Tworzenie elementu wydarzenia
    createEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = `event-item ${event.team} ${event.type}`;
        
        const timeString = this.formatTime(event.matchTime);
        const teamName = event.team === 'home' ? this.teams.home.name : 
                        event.team === 'away' ? this.teams.away.name : '';

        let iconClass = 'fas fa-info-circle';
        let eventDescription = event.description;

        switch(event.type) {
            case 'goal':
            case 'goal3':
                iconClass = 'fas fa-basketball-ball';
                eventDescription = `${event.points} punkty dla ${teamName}`;
                break;
            case 'foul':
                iconClass = 'fas fa-whistle';
                eventDescription = `Faul - ${teamName}`;
                break;
            case 'timeout':
                iconClass = 'fas fa-hand-paper';
                eventDescription = `Timeout - ${teamName}`;
                break;
            case 'comment':
                iconClass = 'fas fa-comment';
                break;
            case 'start':
            case 'resume':
                iconClass = 'fas fa-play';
                break;
            case 'pause':
                iconClass = 'fas fa-pause';
                break;
            case 'period':
            case 'period_end':
                iconClass = 'fas fa-clock';
                break;
            case 'end':
                iconClass = 'fas fa-flag-checkered';
                break;
        }

        eventDiv.innerHTML = `
            <div class="event-icon ${event.type}">
                <i class="${iconClass}"></i>
            </div>
            <div class="event-details">
                <div class="event-time">${timeString} - Okres ${event.period}</div>
                <div class="event-description">${eventDescription}</div>
                ${event.player ? `<div class="event-player">${event.player}${event.playerNumber ? ` #${event.playerNumber}` : ''}</div>` : ''}
            </div>
        `;

        return eventDiv;
    }

    // Wyczyszczenie formularza wydarzenia
    clearEventForm() {
        document.getElementById('playerName').value = '';
        document.getElementById('playerNumber').value = '';
        document.getElementById('eventDescription').value = '';
        document.getElementById('eventType').selectedIndex = 0;
        document.getElementById('eventTeam').selectedIndex = 0;
    }

    // Wyczyszczenie feed
    clearFeed() {
        const feedContent = document.getElementById('feedContent');
        feedContent.innerHTML = `
            <div class="welcome-message">
                <div class="commentator-message both">
                    <div class="commentator-avatar">
                        <i class="fas fa-microphone"></i>
                    </div>
                    <div class="message-content">
                        <p>Mecz został zresetowany. System gotowy do nowego meczu!</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Aktualizacja całego wyświetlania
    updateDisplay() {
        // Aktualizacja wyniku
        document.getElementById('homeScore').textContent = this.matchState.homeScore;
        document.getElementById('awayScore').textContent = this.matchState.awayScore;
        document.getElementById('totalHomeScore').textContent = this.matchState.homeScore;
        document.getElementById('totalAwayScore').textContent = this.matchState.awayScore;

        // Aktualizacja okresu
        document.getElementById('currentPeriod').textContent = this.matchState.currentPeriod;
        document.getElementById('livePeriod').textContent = this.matchState.currentPeriod;

        // Aktualizacja wyniku okresów
        this.updatePeriodScores();

        // Aktualizacja statystyk
        document.getElementById('eventCount').textContent = this.matchState.events.length;
        document.getElementById('homeFouls').textContent = this.matchState.stats.homeFouls;
        document.getElementById('awayFouls').textContent = this.matchState.stats.awayFouls;
        document.getElementById('homeTimeouts').textContent = this.matchState.stats.homeTimeouts;
        document.getElementById('awayTimeouts').textContent = this.matchState.stats.awayTimeouts;
    }

    // Aktualizacja wyniku okresów
    updatePeriodScores() {
        const periodScoresElement = document.getElementById('periodScores');
        const scores = this.matchState.periodScores
            .slice(0, this.matchState.currentPeriod)
            .map(period => `${period.home}-${period.away}`)
            .join(' / ');
        periodScoresElement.textContent = scores || '0-0';
    }

    // Autouzupełnianie zawodników
    setupPlayerAutocomplete() {
        const playerNames = [];
        const playerInput = document.getElementById('playerName');
        
        // Tutaj można dodać listę zawodników z bazy danych
        const suggestedPlayers = [
            'Elisa Klein', 'Mathilda Borchardt', 'Luisa Bröcker', 'Carly Norden',
            'Charlotte Lanz', 'Abby Scholz', 'Emma Lomot', 'Lilo Bluhm',
            'Oliwia Labuda', 'Maja Labuda', 'Blanka Labudda', 'Agnieszka Bach',
            'Lena Lis', 'Antonina Gdaniec', 'Martyna Wenta', 'Aurelia Syldatk',
            'Freda Sperlich', 'Adalie Winter', 'Emma Warzok'
        ];

        // Prosta implementacja autouzupełniania
        playerInput.addEventListener('input', (e) => {
            // Tu można dodać zaawansowaną logikę autouzupełniania
        });
    }

    // Eksport danych meczu
    exportMatchData() {
        const matchData = {
            teams: this.teams,
            matchState: this.matchState,
            exportTime: new Date().toISOString()
        };

        const dataStr = JSON.stringify(matchData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mecz_${this.teams.home.name}_vs_${this.teams.away.name}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Zapisanie do localStorage
    saveToLocalStorage() {
        const saveData = {
            teams: this.teams,
            matchState: this.matchState,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('basketballMatch', JSON.stringify(saveData));
    }

    // Zapisanie meczu
    saveMatch() {
        this.saveToLocalStorage();
        
        // Pokazanie powiadomienia
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #48bb78;
                color: white;
                padding: 15px 30px;
                border-radius: 25px;
                box-shadow: 0 4px 20px rgba(72, 187, 120, 0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideDown 0.3s ease;
            ">
                <i class="fas fa-check-circle"></i>
                Mecz został zapisany pomyślnie!
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Ładowanie meczu z localStorage
    loadFromLocalStorage() {
        const savedData = localStorage.getItem('basketballMatch');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.teams = data.teams || this.teams;
                this.matchState = { ...this.matchState, ...data.matchState };
                
                this.updateDisplay();
                this.updateTeamDisplay();
                this.updateTeamColors();
                this.loadTeamColors();
                
                // Odtworzenie wydarzeń w feed
                this.matchState.events.reverse().forEach(event => {
                    this.displayEvent(event);
                });
                
                return true;
            } catch (e) {
                console.error('Błąd przy ładowaniu danych:', e);
                return false;
            }
        }
        return false;
    }
}

// Funkcje globalne dla HTML
let matchManager;

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    matchManager = new MatchManager();
    
    // Próba załadowania zapisanego meczu
    const loaded = matchManager.loadFromLocalStorage();
    if (loaded) {
        console.log('Załadowano zapisany mecz');
    }
});

// Funkcje kontrolne
function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    const icon = document.getElementById('toggleIcon');
    
    panel.classList.toggle('collapsed');
    icon.className = panel.classList.contains('collapsed') ? 
        'fas fa-chevron-down' : 'fas fa-chevron-up';
}

function startMatch() {
    matchManager.startMatch();
}

function pauseMatch() {
    matchManager.pauseMatch();
}

function resetMatch() {
    matchManager.resetMatch();
}

function nextPeriod() {
    matchManager.nextPeriod();
}

function addEvent() {
    matchManager.addEvent();
}

function quickGoal(team, points) {
    matchManager.quickGoal(team, points);
}

function toggleFeed() {
    const feedContent = document.getElementById('feedContent');
    const toggleIcon = document.querySelector('.toggle-feed i');
    
    if (feedContent.style.display === 'none') {
        feedContent.style.display = 'block';
        toggleIcon.className = 'fas fa-chevron-down';
    } else {
        feedContent.style.display = 'none';
        toggleIcon.className = 'fas fa-chevron-up';
    }
}

function exportMatchData() {
    matchManager.exportMatchData();
}

function saveMatch() {
    matchManager.saveMatch();
}

// Dodatkowe style do animacji
const additionalStyles = `
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}
`;

// Dodanie stylów do head
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Automatyczne zapisywanie co 30 sekund
setInterval(() => {
    if (matchManager && matchManager.matchState.isRunning) {
        matchManager.saveToLocalStorage();
    }
}, 30000);
