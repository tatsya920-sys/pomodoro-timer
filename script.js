// タイマー状態管理
const timerState = {
    isRunning: false,
    totalSeconds: 0,
    remainingSeconds: 0,
    currentPhase: 'work', // 'work', 'shortBreak', 'longBreak'
    currentSet: 1,
    totalPhases: 0, // 0-11: (work+break) × 4, then 12: long break
    intervalId: null,
    audioContext: null,
    player: null
};

// 各フェーズの時間（秒）
const TIMES = {
    work: 25 * 60,        // 25分
    shortBreak: 5 * 60,   // 5分
    longBreak: 30 * 60    // 30分
};

// DOM要素
const elements = {
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    phaseText: document.getElementById('phaseText'),
    setCounter: document.getElementById('setCounter'),
    progressCircle: document.getElementById('progressCircle'),
    liquidWave: document.querySelector('.liquid-wave'),
    youtubeUrl: document.getElementById('youtubeUrl'),
    setVideoBtn: document.getElementById('setVideoBtn'),
    youtubePlayer: document.getElementById('youtubePlayer')
};

// 初期化
function init() {
    timerState.currentPhase = 'work';
    timerState.currentSet = 1;
    timerState.totalPhases = 0;
    timerState.isRunning = false;
    timerState.remainingSeconds = TIMES.work;
    timerState.totalSeconds = TIMES.work;
    
    updateDisplay();
    updateLiquid();
    updateProgress();
    setupEventListeners();
}

// イベントリスナー設定
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    elements.setVideoBtn.addEventListener('click', setYoutubeVideo);
    
    // EnterキーでYouTube設定
    elements.youtubeUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setYoutubeVideo();
    });
}

// タイマー開始
function startTimer() {
    if (timerState.isRunning) return;
    
    timerState.isRunning = true;
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = false;
    
    timerState.intervalId = setInterval(() => {
        timerState.remainingSeconds--;
        
        if (timerState.remainingSeconds < 0) {
            clearInterval(timerState.intervalId);
            completePhase();
        } else {
            updateDisplay();
            updateLiquid();
            updateProgress();
        }
    }, 1000);
}

// タイマー一時停止
function pauseTimer() {
    timerState.isRunning = false;
    clearInterval(timerState.intervalId);
    
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
}

// タイマーリセット
function resetTimer() {
    clearInterval(timerState.intervalId);
    timerState.isRunning = false;
    timerState.currentPhase = 'work';
    timerState.currentSet = 1;
    timerState.totalPhases = 0;
    timerState.remainingSeconds = TIMES.work;
    timerState.totalSeconds = TIMES.work;
    
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    
    updateDisplay();
    updateLiquid();
    updateProgress();
}

// フェーズ完了
function completePhase() {
    // 次のフェーズへ
    if (timerState.currentPhase === 'work') {
        // 作業完了 → 短い休憩へ
        timerState.currentPhase = 'shortBreak';
        timerState.remainingSeconds = TIMES.shortBreak;
        timerState.totalSeconds = TIMES.shortBreak;
    } else if (timerState.currentPhase === 'shortBreak') {
        // 短い休憩完了
        if (timerState.currentSet === 4) {
            // 4セット完了 → 長い休憩へ
            timerState.currentPhase = 'longBreak';
            timerState.remainingSeconds = TIMES.longBreak;
            timerState.totalSeconds = TIMES.longBreak;
        } else {
            // 次のセットの作業へ
            timerState.currentSet++;
            timerState.currentPhase = 'work';
            timerState.remainingSeconds = TIMES.work;
            timerState.totalSeconds = TIMES.work;
        }
    } else if (timerState.currentPhase === 'longBreak') {
        // サイクル完了
        notifyCompletion();
        resetTimer();
        return;
    }
    
    updateDisplay();
    updateLiquid();
    updateProgress();
    
    // 自動再生
    timerState.remainingSeconds = timerState.totalSeconds;
    startTimer();
}

// 表示更新
function updateDisplay() {
    const minutes = Math.floor(timerState.remainingSeconds / 60);
    const seconds = timerState.remainingSeconds % 60;
    
    elements.minutes.textContent = String(minutes).padStart(2, '0');
    elements.seconds.textContent = String(seconds).padStart(2, '0');
    
    // フェーズテキスト
    if (timerState.currentPhase === 'work') {
        elements.phaseText.textContent = '作業中';
        elements.phaseText.style.backgroundColor = 'rgba(255, 107, 107, 0.5)';
    } else if (timerState.currentPhase === 'shortBreak') {
        elements.phaseText.textContent = '短い休憩中';
        elements.phaseText.style.backgroundColor = 'rgba(107, 255, 107, 0.5)';
    } else if (timerState.currentPhase === 'longBreak') {
        elements.phaseText.textContent = '長い休憩中';
        elements.phaseText.style.backgroundColor = 'rgba(107, 150, 255, 0.5)';
    }
    
    // セットカウンター
    if (timerState.currentPhase === 'longBreak') {
        elements.setCounter.textContent = 'サイクル完了！';
    } else {
        elements.setCounter.textContent = `セット ${timerState.currentSet}/4`;
    }
}

// 液体レベル更新
function updateLiquid() {
    const progress = timerState.remainingSeconds / timerState.totalSeconds;
    const liquidHeight = progress * 100;
    
    // 波形のパスを計算
    const waveHeight = liquidHeight;
    const path = `M 0,${100 - waveHeight} Q 480,${90 - waveHeight} 960,${100 - waveHeight} T 1920,${100 - waveHeight} L 1920,100 L 0,100 Z`;
    
    elements.liquidWave.setAttribute('d', path);
}

// プログレスサークル更新
function updateProgress() {
    const progress = 1 - (timerState.remainingSeconds / timerState.totalSeconds);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * progress;
    
    elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    elements.progressCircle.style.strokeDashoffset = offset;
}

// YouTube動画設定
function setYoutubeVideo() {
    const url = elements.youtubeUrl.value.trim();
    if (!url) return;
    
    // YouTubeの動画IDを抽出
    let videoId = null;
    
    // 長いURL形式: https://www.youtube.com/watch?v=xxxxx
    const longUrlMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (longUrlMatch) {
        videoId = longUrlMatch[1];
    }
    
    // 短いURL形式: https://youtu.be/xxxxx
    if (!videoId) {
        const shortUrlMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (shortUrlMatch) {
            videoId = shortUrlMatch[1];
        }
    }
    
    if (videoId) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        
        elements.youtubePlayer.innerHTML = '';
        elements.youtubePlayer.appendChild(iframe);
        elements.youtubePlayer.classList.add('active');
        
        // 自動再生（ユーザー操作後なので有効）
        iframe.style.display = 'block';
    } else {
        alert('有効なYouTube動画URLを入力してください');
    }
}

// 完了通知
function notifyCompletion() {
    alert('ポモドーロサイクルが完了しました！お疲れ様でした🎉');
}

// 初期化実行
init();
