/* ---- 参照 ---- */
const textarea = document.getElementById('genres');
const spinBtn  = document.getElementById('spin');
const genBtn   = document.getElementById('generate');
const wheel    = document.getElementById('roulette');
const ctx      = wheel.getContext?.('2d');

/* ---- 空ホイール描画（未定義なら追加） ---- */
function drawEmptyWheel(){
  if(!ctx) return;
  ctx.clearRect(0,0,wheel.width,wheel.height);
  ctx.save();
  ctx.translate(wheel.width/2, wheel.height/2);
  ctx.beginPath();
  ctx.arc(0,0, wheel.width/2 - 8, 0, Math.PI*2);
  ctx.fillStyle = '#f7f7f7';
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#e0e0e0';
  ctx.stroke();
  ctx.restore();
}

/* ---- 保存削除（キー名の違いにも対応） ---- */
function clearSavedItems(){
  // あなたの保存キーをここに書く（例）
  const knownKeys = [
    'rouletteItems',
    'book-genre-roulette-items',
    'wheel-items',
    'bookGenres'
  ];
  knownKeys.forEach(k => localStorage.removeItem(k));
  // フォールバック：roulette / wheel を含むキーを全削除
  for (let i = localStorage.length - 1; i >= 0; i--){
    const k = localStorage.key(i);
    if (k && /roulette|wheel/i.test(k)) localStorage.removeItem(k);
  }
}

/* ---- リセット本体 ---- */
function resetWheel(ev){
  ev?.preventDefault();                   // フォーム送信防止
  if(!confirm('ジャンルをすべて消去して初期状態に戻します。よろしいですか？')) return;

  textarea && (textarea.value = '');
  clearSavedItems();
  drawEmptyWheel();

  if (spinBtn) spinBtn.disabled = true;   // スピン不可に
  if (genBtn)  genBtn.disabled  = false;  // 生成は再び可
  document.getElementById('modal')?.classList.add('hidden');
  textarea?.focus();
}

/* ---- DOM 準備後にイベント登録（確実に結びつける） ---- */
document.addEventListener('DOMContentLoaded', () => {
  const resetBtn = document.getElementById('reset');
  if (resetBtn && !resetBtn.dataset.bound){
    resetBtn.addEventListener('click', resetWheel);
    resetBtn.dataset.bound = '1';
  }
  // 初期状態：入力が空なら空円＆スピン不可
  if (!textarea?.value.trim()){
    drawEmptyWheel();
    if (spinBtn) spinBtn.disabled = true;
  }

    const savedGenres = localStorage.getItem('bookGenres');
    if (savedGenres) {
        textarea.value = savedGenres;
        generateWheel();
    } else {
        drawEmptyWheel();
        spinBtn.disabled = true;
    }
});

// --- DOM要素の取得 ---
const genresTextArea = document.getElementById('genres');
const generateButton = document.getElementById('generate');
const spinButton = document.getElementById('spin');
const canvas = document.getElementById('roulette');
const pointer = document.getElementById('pointer');
const modal = document.getElementById('modal');
const winnerText = document.getElementById('winner-text');
const closeModalButton = document.getElementById('close-modal');

// リセットボタンは後からでも参照できるよう防御的に取得
let resetButton = document.getElementById('reset');

// --- 定数・グローバル変数 ---
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2 - 10;
let genres = [];
let segmentColors = [];
let currentRotation = 0;
let isSpinning = false;

// ルーレットを描画
function drawRoulette() {
    if (genres.length === 0) {
        drawEmptyWheel();
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const arcSize = (2 * Math.PI) / genres.length;

    genres.forEach((genre, i) => {
        const startAngle = i * arcSize + currentRotation;
        const endAngle = (i + 1) * arcSize + currentRotation;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segmentColors[i];
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = "#fff";
        ctx.font = 'bold 16px \'Baloo 2\', cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textAngle = startAngle + arcSize / 2;
        ctx.translate(centerX + Math.cos(textAngle) * (radius / 1.5), centerY + Math.sin(textAngle) * (radius / 1.5));
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillText(genre, 0, 0);
        ctx.restore();
    });
}

// ルーレットを生成
function generateWheel() {
    genres = genresTextArea.value.split('\n').filter(g => g.trim() !== '');
    if (genres.length === 0) {
        alert('ジャンルを1つ以上入力してください。');
        spinButton.disabled = true;
        return;
    }
    localStorage.setItem('bookGenres', genresTextArea.value);
    segmentColors = genres.map((_, i) => `hsl(${(i * 360) / genres.length}, 80%, 70%)`);
    spinButton.disabled = false;
    drawRoulette();
}

// 当選モーダルを表示
function showWinnerModal(winner) {
    winnerText.textContent = `「${winner}」に決まり！`;
    modal.classList.remove('hidden');
}

// --- イベントリスナー設定 ---

// 生成ボタン
generateButton.addEventListener('click', generateWheel);

// スタートボタン
spinButton.addEventListener('click', () => {
    if (isSpinning || genres.length === 0) return;
    isSpinning = true;
    [spinButton, generateButton, resetButton].forEach(btn => btn && (btn.disabled = true));

    const totalRotation = (Math.random() * 5 + 5) * 2 * Math.PI;
    const spinDuration = 4000;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime >= spinDuration) {
            isSpinning = false;
            [spinButton, generateButton, resetButton].forEach(btn => btn && (btn.disabled = false));
            const finalAngle = currentRotation % (2 * Math.PI);
            const winningIndex = Math.floor(genres.length - (finalAngle / (2 * Math.PI)) * genres.length + genres.length / 4) % genres.length;
            showWinnerModal(genres[winningIndex]);
            return;
        }
        const progress = elapsedTime / spinDuration;
        const easeOutQuint = 1 - Math.pow(1 - progress, 5);
        currentRotation = totalRotation * easeOutQuint;
        drawRoulette();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
});

// モーダルを閉じる
closeModalButton.addEventListener('click', () => {
    modal.classList.add('hidden');
});
