// DOM要素の取得
const genresTextArea = document.getElementById('genres');
const generateButton = document.getElementById('generate');
const spinButton = document.getElementById('spin');
const canvas = document.getElementById('roulette');
const ctx = canvas.getContext('2d');
const pointer = document.getElementById('pointer'); // 矢印要素
const modal = document.getElementById('modal'); // モーダル要素
const winnerText = document.getElementById('winner-text'); // 当選テキスト要素
const closeModalButton = document.getElementById('close-modal'); // 閉じるボタン

// 定数
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2 - 10; // 枠線の内側に描画するため少し小さく

// --- CSS変数に反映 ---
const wheelWrapper = document.getElementById('wheel-wrapper');
wheelWrapper.style.setProperty('--wheel-radius', `${radius}px`);

// ジャンルリストと色
let genres = [];
let segmentColors = []; // 各セグメントの色を保存する配列
// ルーレットの回転状態
let currentRotation = 0;
let isSpinning = false;

// 初期化処理
window.addEventListener('load', () => {
    // localStorageから保存されたジャンルを読み込む
    const savedGenres = localStorage.getItem('bookGenres');
    if (savedGenres) {
        genresTextArea.value = savedGenres;
        generateWheel();
    }
});

// 「ルーレットをつくる」ボタンのクリックイベント
generateButton.addEventListener('click', generateWheel);

// ルーレットを生成する関数
function generateWheel() {
    // テキストエリアからジャンルを取得し、空行を除外
    genres = genresTextArea.value.split('\n').filter(g => g.trim() !== '');
    if (genres.length === 0) {
        alert('ジャンルを1つ以上入力してください。');
        return;
    }

    // ジャンルをlocalStorageに保存
    localStorage.setItem('bookGenres', genresTextArea.value);

    // 各セグメントの色を計算して配列に保存
    segmentColors = genres.map((_, i) => `hsl(${(i * 360) / genres.length}, 80%, 70%)`);

    // ルーレットを描画
    drawRoulette();
}

// ルーレットを描画する関数
function drawRoulette() {
    // Canvasをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const arcSize = (2 * Math.PI) / genres.length;

    genres.forEach((genre, i) => {
        const startAngle = i * arcSize + currentRotation;
        const endAngle = (i + 1) * arcSize + currentRotation;

        // 各セグメント（扇形）を描画
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        // 配列から色を取得
        ctx.fillStyle = segmentColors[i];
        ctx.fill();
        ctx.stroke(); // セグメントの境界線

        // テキストを描画
        ctx.save();
        ctx.fillStyle = "#fff";
        ctx.font = 'bold 16px \'Baloo 2\', cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // テキストの角度を計算
        const textAngle = startAngle + arcSize / 2;
        // テキストの位置を調整
        ctx.translate(centerX + Math.cos(textAngle) * (radius / 1.5), centerY + Math.sin(textAngle) * (radius / 1.5));
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillText(genre, 0, 0);
        ctx.restore();
    });
}

// 「スタート！」ボタンのクリックイベント
spinButton.addEventListener('click', () => {
    // スピン中はボタンを無効化
    if (isSpinning || genres.length === 0) return;

    // スピン開始時に矢印の色を初期色に戻す
    pointer.style.color = '#e91e63'; 

    isSpinning = true;
    // スピンの目標角度をランダムに設定（5〜10回転）
    const totalRotation = (Math.random() * 5 + 5) * 2 * Math.PI;
    const spinDuration = 4000; // 4秒間スピン
    const startTime = performance.now();

    // アニメーション関数
    function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime >= spinDuration) {
            // スピン終了
            isSpinning = false;
            // 最終的な角度を計算
            const finalAngle = currentRotation % (2 * Math.PI);
            // 当選したセグメントを計算（矢印は真上にあるので、270度の位置が基準）
            const winningIndex = Math.floor(genres.length - (finalAngle / (2 * Math.PI)) * genres.length + genres.length / 4) % genres.length;
            
            // ★★★ 変更: alert() の代わりにモーダルを表示 ★★★
            showWinnerModal(genres[winningIndex]);
            return;
        }

        // イージング（だんだん遅くなる）効果を計算
        const progress = elapsedTime / spinDuration;
        const easeOutQuint = 1 - Math.pow(1 - progress, 5);
        currentRotation = totalRotation * easeOutQuint;

        // ルーレットを再描画
        drawRoulette();

        // 次のフレームをリクエスト
        requestAnimationFrame(animate);
    }

    // アニメーションを開始
    requestAnimationFrame(animate);
});

// ★★★ 追加: 当選モーダルを表示する関数 ★★★
function showWinnerModal(winner) {
    winnerText.textContent = `「${winner}」に決まり！`;
    modal.classList.remove('hidden');
}

// ★★★ 追加: モーダルを閉じるイベント ★★★
closeModalButton.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// 初期描画
drawRoulette();