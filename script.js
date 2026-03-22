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
    liquidWave: document.querySelector('.liquid-wave'),
    liquidWaveOverlay: document.querySelector('.liquid-wave-overlay'),
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
    
    // 液体を最初から表示
    elements.liquidWave.classList.add('active');
    if (elements.liquidWaveOverlay) {
        elements.liquidWaveOverlay.classList.add('active');
    }
    
    updateDisplay();
    updateLiquid();
    setupEventListeners();
    
    // 波のアニメーションループを開始
    requestAnimationFrame(updateLiquid);
}

// イベントリスナー設定
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
}

// タイマー開始
function startTimer() {
    if (timerState.isRunning) return;
    
    timerState.isRunning = true;
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = false;
    
    // YouTube動画を自動再生
    playMusic();
    
    timerState.intervalId = setInterval(() => {
        timerState.remainingSeconds--;
        
        if (timerState.remainingSeconds < 0) {
            clearInterval(timerState.intervalId);
            completePhase();
        } else {
            updateDisplay();
            updateLiquid();
        }
    }, 1000);
}

// タイマー一時停止
function pauseTimer() {
    timerState.isRunning = false;
    clearInterval(timerState.intervalId);
    
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    
    // YouTubeを一時停止
    pauseMusic();
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
    
    // YouTubeを停止
    stopMusic();
    
    updateDisplay();
    updateLiquid();
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
        elements.phaseText.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    } else if (timerState.currentPhase === 'shortBreak') {
        elements.phaseText.textContent = '短い休憩中';
        elements.phaseText.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    } else if (timerState.currentPhase === 'longBreak') {
        elements.phaseText.textContent = '長い休憩中';
        elements.phaseText.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
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
    const waveOffset = 1080 - (liquidHeight / 100) * 1080;
    
    // 時間ベースの波のアニメーション
    const now = Date.now();
    const wavePhase1 = (now % 3500) / 3500; // 3.5秒周期
    const wavePhase2 = (now % 5000) / 5000; // 5秒周期
    
    // サイン波を使ってスムーズな波動を生成
    const waveAmp1 = Math.sin(wavePhase1 * Math.PI * 2) * 20; // ±20の振幅
    const waveAmp2 = Math.sin(wavePhase2 * Math.PI * 2) * 15; // ±15の振幅
    
    // メインの波形 - より自然な曲線
    const wave1 = `M 0,${waveOffset + waveAmp1} 
                   Q 240,${waveOffset + waveAmp1 - 40} 480,${waveOffset + waveAmp1 - 20}
                   T 960,${waveOffset + waveAmp1 - 30}
                   T 1440,${waveOffset + waveAmp1 - 10}
                   T 1920,${waveOffset + waveAmp1}
                   L 1920,1080 L 0,1080 Z`;
    
    // サブの波形 - 異なる周期で波打つ
    const wave2 = `M 0,${waveOffset + 20 + waveAmp2}
                   Q 320,${waveOffset + waveAmp2 - 15} 640,${waveOffset + 20 + waveAmp2}
                   T 1280,${waveOffset + 20 + waveAmp2}
                   T 1920,${waveOffset + 20 + waveAmp2}
                   L 1920,1080 L 0,1080 Z`;
    
    elements.liquidWave.setAttribute('d', wave1);
    if (elements.liquidWaveOverlay) {
        elements.liquidWaveOverlay.setAttribute('d', wave2);
    }
    
    // 次フレームでアニメーション続行
    requestAnimationFrame(updateLiquid);
}

// プログレスサークル更新
function updateProgress() {
    const progress = 1 - (timerState.remainingSeconds / timerState.totalSeconds);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * progress;
    
    elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    elements.progressCircle.style.strokeDashoffset = offset;
}

// 音楽の自動再生
const MUSIC_VIDEO_ID = 'vr9dLvJs7VE';
let musicIframe = null;

function playMusic() {
    // 既存のiframeを削除（毎回新規作成）
    if (musicIframe) {
        musicIframe.remove();
    }
    
    // YouTube埋め込みプレーヤーを新規作成
    musicIframe = document.createElement('iframe');
    musicIframe.src = `https://www.youtube.com/embed/${MUSIC_VIDEO_ID}?autoplay=1`;
    musicIframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    musicIframe.style.display = 'none';
    musicIframe.width = '0';
    musicIframe.height = '0';
    
    elements.youtubePlayer.innerHTML = '';
    elements.youtubePlayer.appendChild(musicIframe);
}

function pauseMusic() {
    if (musicIframe) {
        musicIframe.remove();
        musicIframe = null;
    }
}

function stopMusic() {
    if (musicIframe) {
        musicIframe.remove();
        musicIframe = null;
    }
}

// 完了通知
function notifyCompletion() {
    alert('ポモドーロサイクルが完了しました！お疲れ様でした🎉');
}

// 設定パネル機能
function setupSettingsPanel() {
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsContent');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const fontFamilySelect = document.getElementById('fontFamilySelect');
    const fontWeightSelect = document.getElementById('fontWeightSelect');
    const colorPicker = document.getElementById('colorPicker');
    
    // 設定パネルのトグル
    settingsToggle.addEventListener('click', () => {
        settingsContent.style.display = settingsContent.style.display === 'none' ? 'block' : 'none';
    });
    
    // フォントサイズ変更
    fontSizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        fontSizeValue.textContent = size + 'px';
        document.documentElement.style.setProperty('--timer-font-size', size + 'px');
    });
    
    // フォントファミリー変更
    fontFamilySelect.addEventListener('change', (e) => {
        document.documentElement.style.setProperty('--timer-font-family', e.target.value);
    });
    
    // フォント太さ変更
    fontWeightSelect.addEventListener('change', (e) => {
        document.documentElement.style.setProperty('--timer-font-weight', e.target.value);
    });
    
    // 色変更
    colorPicker.addEventListener('change', (e) => {
        document.documentElement.style.setProperty('--timer-color', e.target.value);
    });
}

// 初期化実行
init();
setupSettingsPanel();
