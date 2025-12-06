// بازی شطرنج - منطق اصلی
document.addEventListener('DOMContentLoaded', function() {
    // حالت اولیه بازی
    const gameState = {
        board: [],
        currentPlayer: 'white',
        selectedPiece: null,
        possibleMoves: [],
        moveHistory: [],
        moveCount: 0,
        gameStatus: 'active',
        boardFlipped: false,
        whiteTime: 0,
        blackTime: 0,
        timerInterval: null
    };

    // تعریف انواع مهره‌ها
    const PIECE_TYPES = {
        PAWN: 'pawn',
        ROOK: 'rook',
        KNIGHT: 'knight',
        BISHOP: 'bishop',
        QUEEN: 'queen',
        KING: 'king'
    };

    // یونیکد مهره‌های شطرنج
    const PIECE_SYMBOLS = {
        white: {
            king: '♔',
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘',
            pawn: '♙'
        },
        black: {
            king: '♚',
            queen: '♛',
            rook: '♜',
            bishop: '♝',
            knight: '♞',
            pawn: '♟'
        }
    };

    // تخته شطرنج اولیه
    const INITIAL_BOARD = [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];

    // مقداردهی اولیه بازی
    function initializeGame() {
        gameState.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        gameState.currentPlayer = 'white';
        gameState.selectedPiece = null;
        gameState.possibleMoves = [];
        gameState.moveHistory = [];
        gameState.moveCount = 0;
        gameState.gameStatus = 'active';
        gameState.whiteTime = 0;
        gameState.blackTime = 0;
        
        clearInterval(gameState.timerInterval);
        startTimer();
        
        renderBoard();
        updateGameInfo();
        updateMoveHistory();
        
        // اطلاع‌رسانی شروع بازی
        showNotification('بازی شروع شد! نوبت سفید است.');
    }

    // شروع تایمر
    function startTimer() {
        clearInterval(gameState.timerInterval);
        
        gameState.timerInterval = setInterval(() => {
            if (gameState.currentPlayer === 'white') {
                gameState.whiteTime++;
            } else {
                gameState.blackTime++;
            }
            
            updateTimers();
        }, 1000);
    }

    // به‌روزرسانی تایمرها
    function updateTimers() {
        const whiteTimer = document.querySelector('.white-player .player-timer');
        const blackTimer = document.querySelector('.black-player .player-timer');
        
        whiteTimer.textContent = formatTime(gameState.whiteTime);
        blackTimer.textContent = formatTime(gameState.blackTime);
    }

    // فرمت زمان
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // رندر تخته شطرنج
    function renderBoard() {
        const boardElement = document.getElementById('chess-board');
        boardElement.innerHTML = '';
        
        // ایجاد مربع‌های تخته
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                
                // تعیین رنگ مربع
                const isLight = (row + col) % 2 === 0;
                square.classList.add(isLight ? 'light-square' : 'dark-square');
                
                // اضافه کردن شناسه موقعیت
                square.dataset.row = row;
                square.dataset.col = col;
                
                // اضافه کردن رویداد کلیک
                square.addEventListener('click', () => handleSquareClick(row, col));
                
                // نمایش مهره (در صورت وجود)
                const piece = gameState.board[row][col];
                if (piece) {
                    square.textContent = getPieceSymbol(piece);
                    square.dataset.piece = piece;
                }
                
                // اگر مربع انتخاب شده است
                if (gameState.selectedPiece && gameState.selectedPiece.row === row && gameState.selectedPiece.col === col) {
                    square.classList.add('selected');
                }
                
                // اگر حرکت ممکن است
                const isPossibleMove = gameState.possibleMoves.some(move => move.row === row && move.col === col);
                if (isPossibleMove) {
                    const moveInfo = gameState.possibleMoves.find(move => move.row === row && move.col === col);
                    if (moveInfo.isCapture) {
                        square.classList.add('possible-capture');
                    } else {
                        square.classList.add('possible-move');
                    }
                }
                
                boardElement.appendChild(square);
            }
        }
        
        // اگر تخته چرخانده شده باشد
        if (gameState.boardFlipped) {
            boardElement.style.transform = 'rotate(180deg)';
            const squares = boardElement.querySelectorAll('.square');
            squares.forEach(square => {
                square.style.transform = 'rotate(180deg)';
            });
        } else {
            boardElement.style.transform = 'rotate(0deg)';
            const squares = boardElement.querySelectorAll('.square');
            squares.forEach(square => {
                square.style.transform = 'rotate(0deg)';
            });
        }
    }

    // گرفتن نماد یونیکد مهره
    function getPieceSymbol(pieceCode) {
        if (!pieceCode) return '';
        
        const color = pieceCode[0] === 'w' ? 'white' : 'black';
        const pieceType = pieceCode[1].toLowerCase();
        
        switch(pieceType) {
            case 'p': return PIECE_SYMBOLS[color].pawn;
            case 'r': return PIECE_SYMBOLS[color].rook;
            case 'n': return PIECE_SYMBOLS[color].knight;
            case 'b': return PIECE_SYMBOLS[color].bishop;
            case 'q': return PIECE_SYMBOLS[color].queen;
            case 'k': return PIECE_SYMBOLS[color].king;
            default: return '';
        }
    }

    // مدیریت کلیک روی مربع
    function handleSquareClick(row, col) {
        if (gameState.gameStatus !== 'active') return;
        
        const clickedPiece = gameState.board[row][col];
        
        // اگر مهره‌ای انتخاب شده است
        if (gameState.selectedPiece) {
            // بررسی آیا حرکت معتبر است
            const isValidMove = gameState.possibleMoves.some(
                move => move.row === row && move.col === col
            );
            
            if (isValidMove) {
                // انجام حرکت
                makeMove(gameState.selectedPiece.row, gameState.selectedPiece.col, row, col);
                gameState.selectedPiece = null;
                gameState.possibleMoves = [];
                renderBoard();
                return;
            }
            
            // اگر روی مهره خودی کلیک شده، آن را انتخاب کن
            if (clickedPiece && clickedPiece[0] === (gameState.currentPlayer === 'white' ? 'w' : 'b')) {
                selectPiece(row, col);
                return;
            }
            
            // در غیر این صورت انتخاب را لغو کن
            gameState.selectedPiece = null;
            gameState.possibleMoves = [];
            renderBoard();
        }
        
        // اگر روی مهره خودی کلیک شده و هیچ مهره‌ای انتخاب نشده
        if (clickedPiece && clickedPiece[0] === (gameState.currentPlayer === 'white' ? 'w' : 'b')) {
            selectPiece(row, col);
        }
    }

    // انتخاب یک مهره
    function selectPiece(row, col) {
        gameState.selectedPiece = { row, col };
        gameState.possibleMoves = calculatePossibleMoves(row, col);
        renderBoard();
    }

    // محاسبه حرکات ممکن برای یک مهره
    function calculatePossibleMoves(row, col) {
        const piece = gameState.board[row][col];
        if (!piece) return [];
        
        const pieceType = piece[1].toLowerCase();
        const pieceColor = piece[0];
        const moves = [];
        
        // حرکت پیاده
        if (pieceType === 'p') {
            const direction = pieceColor === 'w' ? -1 : 1;
            const startRow = pieceColor === 'w' ? 6 : 1;
            
            // حرکت به جلو
            if (isValidSquare(row + direction, col) && !gameState.board[row + direction][col]) {
                moves.push({ row: row + direction, col, isCapture: false });
                
                // حرکت دو خانه در حرکت اول
                if (row === startRow && !gameState.board[row + 2 * direction][col]) {
                    moves.push({ row: row + 2 * direction, col, isCapture: false });
                }
            }
            
            // ضرب‌گیری اریب
            const captureCols = [col - 1, col + 1];
            for (const captureCol of captureCols) {
                if (isValidSquare(row + direction, captureCol)) {
                    const targetPiece = gameState.board[row + direction][captureCol];
                    if (targetPiece && targetPiece[0] !== pieceColor) {
                        moves.push({ row: row + direction, col: captureCol, isCapture: true });
                    }
                }
            }
        }
        
        // حرکت رخ
        else if (pieceType === 'r') {
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            moves.push(...getSlidingMoves(row, col, directions, pieceColor));
        }
        
        // حرکت اسب
        else if (pieceType === 'n') {
            const knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            
            for (const [dr, dc] of knightMoves) {
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (isValidSquare(newRow, newCol)) {
                    const targetPiece = gameState.board[newRow][newCol];
                    if (!targetPiece || targetPiece[0] !== pieceColor) {
                        moves.push({ 
                            row: newRow, 
                            col: newCol, 
                            isCapture: !!targetPiece 
                        });
                    }
                }
            }
        }
        
        // حرکت فیل
        else if (pieceType === 'b') {
            const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            moves.push(...getSlidingMoves(row, col, directions, pieceColor));
        }
        
        // حرکت وزیر
        else if (pieceType === 'q') {
            const directions = [
                [-1, 0], [1, 0], [0, -1], [0, 1],
                [-1, -1], [-1, 1], [1, -1], [1, 1]
            ];
            moves.push(...getSlidingMoves(row, col, directions, pieceColor));
        }
        
        // حرکت شاه
        else if (pieceType === 'k') {
            const kingMoves = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            
            for (const [dr, dc] of kingMoves) {
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (isValidSquare(newRow, newCol)) {
                    const targetPiece = gameState.board[newRow][newCol];
                    if (!targetPiece || targetPiece[0] !== pieceColor) {
                        moves.push({ 
                            row: newRow, 
                            col: newCol, 
                            isCapture: !!targetPiece 
                        });
                    }
                }
            }
        }
        
        return moves;
    }

    // محاسبه حرکات کشویی (برای رخ، فیل، وزیر)
    function getSlidingMoves(startRow, startCol, directions, pieceColor) {
        const moves = [];
        
        for (const [dr, dc] of directions) {
            let row = startRow + dr;
            let col = startCol + dc;
            
            while (isValidSquare(row, col)) {
                const targetPiece = gameState.board[row][col];
                
                if (!targetPiece) {
                    moves.push({ row, col, isCapture: false });
                } else {
                    if (targetPiece[0] !== pieceColor) {
                        moves.push({ row, col, isCapture: true });
                    }
                    break;
                }
                
                row += dr;
                col += dc;
            }
        }
        
        return moves;
    }

    // بررسی معتبر بودن یک مربع
    function isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // انجام یک حرکت
    function makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = gameState.board[fromRow][fromCol];
        const targetPiece = gameState.board[toRow][toCol];
        
        // ثبت حرکت در تاریخچه
        const moveNotation = getMoveNotation(fromRow, fromCol, toRow, toCol, piece, targetPiece);
        gameState.moveHistory.push({
            white: gameState.currentPlayer === 'white' ? moveNotation : '',
            black: gameState.currentPlayer === 'black' ? moveNotation : '',
            moveNumber: Math.floor(gameState.moveHistory.length / 2) + 1
        });
        
        // انجام حرکت
        gameState.board[toRow][toCol] = piece;
        gameState.board[fromRow][fromCol] = '';
        
        // ارتقای پیاده
        if (piece[1].toLowerCase() === 'p') {
            const promotionRow = piece[0] === 'w' ? 0 : 7;
            if (toRow === promotionRow) {
                gameState.board[toRow][toCol] = piece[0] + 'Q'; // همیشه به وزیر ارتقا می‌یابد
                showNotification('پیاده به وزیر ارتقا یافت!');
            }
        }
        
        // تغییر نوبت
        gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
        gameState.moveCount++;
        
        // بررسی وضعیت بازی
        checkGameStatus();
        
        // به‌روزرسانی اطلاعات بازی
        updateGameInfo();
        updateMoveHistory();
        
        // نمایش پیام حرکت
        showNotification(`حرکت انجام شد: ${moveNotation}`);
    }

    // دریافت نماد حرکت
    function getMoveNotation(fromRow, fromCol, toRow, toCol, piece, targetPiece) {
        const pieceType = piece[1].toLowerCase();
        const file = String.fromCharCode(97 + fromCol); // a-h
        const rank = 8 - fromRow; // 1-8
        const toFile = String.fromCharCode(97 + toCol);
        const toRank = 8 - toRow;
        
        let notation = '';
        
        // برای پیاده فقط مقصد را می‌نویسیم
        if (pieceType === 'p') {
            notation = targetPiece ? `${file}x${toFile}${toRank}` : `${toFile}${toRank}`;
        } 
        // برای سایر مهره‌ها
        else {
            const pieceSymbols = {
                'r': 'R', 'n': 'N', 'b': 'B', 'q': 'Q', 'k': 'K'
            };
            notation = pieceSymbols[pieceType];
            
            // اگر ضرب‌گیری باشد
            if (targetPiece) {
                notation += `x${toFile}${toRank}`;
            } else {
                notation += `${toFile}${toRank}`;
            }
        }
        
        return notation;
    }

    // بررسی وضعیت بازی
    function checkGameStatus() {
        // بررسی کیش (در این نسخه ساده فقط وضعیت ساده بررسی می‌شود)
        // در یک پیاده‌سازی کامل، باید بررسی دقیق کیش و مات انجام شود
        const kingPosition = findKing(gameState.currentPlayer);
        const isInCheck = isSquareUnderAttack(kingPosition.row, kingPosition.col, gameState.currentPlayer);
        
        if (isInCheck) {
            gameState.gameStatus = 'check';
            showNotification(`${gameState.currentPlayer === 'white' ? 'سفید' : 'سیاه'} کیش است!`);
        } else {
            gameState.gameStatus = 'active';
        }
        
        // بررسی مات (در این نسخه ساده فقط بررسی می‌کنیم که آیا حرکتی ممکن است)
        const hasLegalMoves = checkForLegalMoves(gameState.currentPlayer);
        if (!hasLegalMoves) {
            if (isInCheck) {
                gameState.gameStatus = 'checkmate';
                const winner = gameState.currentPlayer === 'white' ? 'سیاه' : 'سفید';
                showNotification(`کیش و مات! ${winner} برنده شد!`);
            } else {
                gameState.gameStatus = 'stalemate';
                showNotification('پات! بازی مساوی شد.');
            }
            
            clearInterval(gameState.timerInterval);
        }
    }

    // پیدا کردن موقعیت شاه
    function findKing(playerColor) {
        const kingCode = playerColor === 'white' ? 'wK' : 'bK';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (gameState.board[row][col] === kingCode) {
                    return { row, col };
                }
            }
        }
        
        return { row: -1, col: -1 };
    }

    // بررسی حمله به یک مربع
    function isSquareUnderAttack(row, col, defenderColor) {
        const attackerColor = defenderColor === 'white' ? 'black' : 'white';
        
        // بررسی تمام مهره‌های حریف
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = gameState.board[r][c];
                if (piece && piece[0] === (attackerColor === 'white' ? 'w' : 'b')) {
                    const moves = calculatePossibleMoves(r, c);
                    if (moves.some(move => move.row === row && move.col === col && move.isCapture)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // بررسی وجود حرکت قانونی برای بازیکن
    function checkForLegalMoves(playerColor) {
        // بررسی تمام مهره‌های بازیکن
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameState.board[row][col];
                if (piece && piece[0] === (playerColor === 'white' ? 'w' : 'b')) {
                    const moves = calculatePossibleMoves(row, col);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // به‌روزرسانی اطلاعات بازی
    function updateGameInfo() {
        document.getElementById('current-turn').textContent = 
            gameState.currentPlayer === 'white' ? 'سفید' : 'سیاه';
        
        document.getElementById('game-status').textContent = 
            gameState.gameStatus === 'active' ? 'بازی در جریان' :
            gameState.gameStatus === 'check' ? 'کیش' :
            gameState.gameStatus === 'checkmate' ? 'کیش و مات' :
            gameState.gameStatus === 'stalemate' ? 'پات' : 'پایان یافته';
        
        document.getElementById('move-count').textContent = gameState.moveCount;
        
        // به‌روزرسانی تایمرها
        updateTimers();
    }

    // به‌روزرسانی تاریخچه حرکات
    function updateMoveHistory() {
        const moveHistoryElement = document.getElementById('move-history');
        moveHistoryElement.innerHTML = '';
        
        gameState.moveHistory.forEach((move, index) => {
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';
            
            if (move.white) {
                moveEntry.innerHTML = `
                    <span class="move-number">${move.moveNumber}.</span>
                    <span class="move-white">${move.white}</span>
                    <span class="move-black">${move.black || ''}</span>
                `;
            } else if (move.black && index === gameState.moveHistory.length - 1) {
                // اگر فقط حرکت سیاه وجود دارد (اولین حرکت سیاه)
                moveEntry.innerHTML = `
                    <span class="move-number">${move.moveNumber}.</span>
                    <span class="move-white"></span>
                    <span class="move-black">${move.black}</span>
                `;
            }
            
            if (move.white || move.black) {
                moveHistoryElement.appendChild(moveEntry);
            }
        });
        
        // اسکرول به پایین
        moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
    }

    // نمایش نوتیفیکیشن
    function showNotification(message) {
        // ایجاد یک نوتیفیکیشن موقت
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 1000;
            font-weight: bold;
            border-right: 5px solid #ffd700;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
            animation: fadeInOut 3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // بازگشت به حرکت قبلی
    function undoMove() {
        if (gameState.moveHistory.length === 0) {
            showNotification('حرکتی برای بازگشت وجود ندارد.');
            return;
        }
        
        // در این پیاده‌سازی ساده، بازی را از ابتدا راه‌اندازی مجدد می‌کنیم
        showNotification('بازگشت حرکت در این نسخه ساده پشتیبانی نمی‌شود. یک بازی جدید شروع کنید.');
    }

    // چرخش تخته
    function flipBoard() {
        gameState.boardFlipped = !gameState.boardFlipped;
        renderBoard();
        showNotification(`تخته ${gameState.boardFlipped ? 'چرخانده شد' : 'به حالت اول بازگشت'}`);
    }

    // پیشنهاد حرکت
    function suggestMove() {
        // پیدا کردن یک حرکت تصادفی معتبر
        const validMoves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameState.board[row][col];
                if (piece && piece[0] === (gameState.currentPlayer === 'white' ? 'w' : 'b')) {
                    const moves = calculatePossibleMoves(row, col);
                    moves.forEach(move => {
                        validMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece
                        });
                    });
                }
            }
        }
        
        if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            selectPiece(randomMove.fromRow, randomMove.fromCol);
            renderBoard();
            showNotification(`پیشنهاد حرکت: از ${String.fromCharCode(97 + randomMove.fromCol)}${8 - randomMove.fromRow} به ${String.fromCharCode(97 + randomMove.toCol)}${8 - randomMove.toRow}`);
        } else {
            showNotification('هیچ حرکت معتبری یافت نشد.');
        }
    }

    // راه‌اندازی رویدادها
    function setupEventListeners() {
        // دکمه بازی جدید
        document.getElementById('new-game').addEventListener('click', initializeGame);
        
        // دکمه بازگشت حرکت
        document.getElementById('undo-move').addEventListener('click', undoMove);
        
        // دکمه چرخش صفحه
        document.getElementById('flip-board').addEventListener('click', flipBoard);
        
        // دکمه پیشنهاد حرکت
        document.getElementById('hint-move').addEventListener('click', suggestMove);
        
        // دکمه قوانین
        const rulesBtn = document.getElementById('rules-btn');
        const rulesModal = document.getElementById('rules-modal');
        const closeModal = document.querySelector('.close-modal');
        
        rulesBtn.addEventListener('click', () => {
            rulesModal.style.display = 'flex';
        });
        
        closeModal.addEventListener('click', () => {
            rulesModal.style.display = 'none';
        });
        
        // بستن مودال با کلیک خارج از آن
        window.addEventListener('click', (event) => {
            if (event.target === rulesModal) {
                rulesModal.style.display = 'none';
            }
        });
    }

    // اضافه کردن استایل برای نوتیفیکیشن
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; top: 0; }
            10% { opacity: 1; top: 20px; }
            90% { opacity: 1; top: 20px; }
            100% { opacity: 0; top: 0; }
        }
    `;
    document.head.appendChild(style);

    // راه‌اندازی اولیه
    initializeGame();
    setupEventListeners();
});
