// タイマー状態管理
const timerState = {
    isRunning: false,
    totalSeconds: 0,
    remainingSeconds: 0,
    currentPhase: 'work', // 'work', 'shortBreak', 'longBreak'
    currentSet: 1,
    maxSets: 4,             // 長い休憩までのセット数（デフォルト: 4）
    cycleCount: 0,          // 完了したサイクル数
    totalPhases: 0,         // 全フェーズを通じての進捗
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
    cycleCounter: document.getElementById('cycleCounter'),
    liquidWave: document.querySelector('.liquid-wave'),
    liquidWaveOverlay: document.querySelector('.liquid-wave-overlay'),
    youtubePlayer: document.getElementById('youtubePlayer'),
    setCountInput: document.getElementById('setCountInput'),
    setCountValue: document.getElementById('setCountValue'),
    workTimeInput: document.getElementById('workTimeInput'),
    workTimeValue: document.getElementById('workTimeValue'),
    shortBreakInput: document.getElementById('shortBreakInput'),
    shortBreakValue: document.getElementById('shortBreakValue'),
    longBreakInput: document.getElementById('longBreakInput'),
    longBreakValue: document.getElementById('longBreakValue')
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
    
    // セット数変更リスナー
    if (elements.setCountInput) {
        elements.setCountInput.addEventListener('change', (e) => {
            const newSetCount = parseInt(e.target.value);
            if (newSetCount > 0) {
                timerState.maxSets = newSetCount;
                if (elements.setCountValue) {
                    elements.setCountValue.textContent = `${newSetCount} セット`;
                }
                // タイマーが実行中でなければセット数の表示を更新
                if (!timerState.isRunning) {
                    updateDisplay();
                }
            }
        });
    }
    
    // 作業時間変更リスナー
    if (elements.workTimeInput) {
        elements.workTimeInput.addEventListener('change', (e) => {
            const newWorkTime = parseInt(e.target.value);
            if (newWorkTime > 0) {
                TIMES.work = newWorkTime * 60;
                if (elements.workTimeValue) {
                    elements.workTimeValue.textContent = `${newWorkTime}分`;
                }
                // タイマーが実行中でなく、かつ現在のフェーズが仕事フェーズなら表示を更新
                if (!timerState.isRunning && timerState.currentPhase === 'work') {
                    timerState.totalSeconds = TIMES.work;
                    timerState.remainingSeconds = TIMES.work;
                    updateDisplay();
                    updateLiquid();
                }
            }
        });
    }
    
    // 短い休憩時間変更リスナー
    if (elements.shortBreakInput) {
        elements.shortBreakInput.addEventListener('change', (e) => {
            const newShortBreak = parseInt(e.target.value);
            if (newShortBreak > 0) {
                TIMES.shortBreak = newShortBreak * 60;
                if (elements.shortBreakValue) {
                    elements.shortBreakValue.textContent = `${newShortBreak}分`;
                }
                // タイマーが実行中でなく、かつ現在のフェーズが短い休憩なら表示を更新
                if (!timerState.isRunning && timerState.currentPhase === 'shortBreak') {
                    timerState.totalSeconds = TIMES.shortBreak;
                    timerState.remainingSeconds = TIMES.shortBreak;
                    updateDisplay();
                    updateLiquid();
                }
            }
        });
    }
    
    // 長い休憩時間変更リスナー
    if (elements.longBreakInput) {
        elements.longBreakInput.addEventListener('change', (e) => {
            const newLongBreak = parseInt(e.target.value);
            if (newLongBreak > 0) {
                TIMES.longBreak = newLongBreak * 60;
                if (elements.longBreakValue) {
                    elements.longBreakValue.textContent = `${newLongBreak}分`;
                }
                // タイマーが実行中でなく、かつ現在のフェーズが長い休憩なら表示を更新
                if (!timerState.isRunning && timerState.currentPhase === 'longBreak') {
                    timerState.totalSeconds = TIMES.longBreak;
                    timerState.remainingSeconds = TIMES.longBreak;
                    updateDisplay();
                    updateLiquid();
                }
            }
        });
    }
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
    timerState.cycleCount = 0;
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
        if (timerState.currentSet === timerState.maxSets) {
            // 指定セット数完了 → 長い休憩へ
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
        // サイクル完了 → 次のサイクルへ自動遷移
        timerState.cycleCount++;
        notifyCompletion();
        
        // セット数をリセットして、次のサイクルの作業フェーズを開始
        timerState.currentSet = 1;
        timerState.currentPhase = 'work';
        timerState.remainingSeconds = TIMES.work;
        timerState.totalSeconds = TIMES.work;
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
        elements.phaseText.textContent = 'work';
        elements.phaseText.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    } else if (timerState.currentPhase === 'shortBreak') {
        elements.phaseText.textContent = 'short break';
        elements.phaseText.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    } else if (timerState.currentPhase === 'longBreak') {
        elements.phaseText.textContent = 'long break';
        elements.phaseText.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    }
    
    // セットカウンター
    if (timerState.currentPhase === 'longBreak') {
        elements.setCounter.textContent = `set - / ${timerState.maxSets}`;
    } else {
        elements.setCounter.textContent = `set ${timerState.currentSet}/${timerState.maxSets}`;
    }
    
    // サイクルカウンター
    if (elements.cycleCounter) {
        elements.cycleCounter.textContent = `cycle ${timerState.cycleCount}`;
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
    
    // 設定パネルのトグル
    settingsToggle.addEventListener('click', () => {
        settingsContent.style.display = settingsContent.style.display === 'none' ? 'block' : 'none';
    });
}

// 初期化実行
init();
setupSettingsPanel();
