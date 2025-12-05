let game;
let lastMoveFrom = null;
let lastMoveTo = null;

function selectLanguage(lang) {
    game = new ChessGame();
    game.updateLanguage(lang);
    
    document.getElementById('language-selector').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    
    updateUIForLanguage();
    initBoard();
    updateBoard();
    updateMoveHistory();
    startTimer();
}

function updateUIForLanguage() {
    const t = game.translations[game.language];
    
    document.getElementById('game-title').textContent = t.title;
    document.getElementById('white-player-label').textContent = t.white;
    document.getElementById('black-player-label').textContent = t.black;
    document.getElementById('new-game-btn').querySelector('span').textContent = t.newGame;
    document.getElementById('undo-btn').querySelector('span').textContent = t.undo;
    document.getElementById('board-color-title').textContent = t.boardColor;
    document.getElementById('piece-color-title').textContent = t.pieceColor;
    document.getElementById('ai-level-title').textContent = t.aiLevel;
    document.getElementById('ai-mode-label').textContent = t.aiMode;
    document.getElementById('move-history-title').textContent = t.moveHistory;
    document.getElementById('sound-label').textContent = t.soundOn;
    
    document.querySelectorAll('.ai-level-btn').forEach((btn, index) => {
        const levels = [t.easy, t.medium, t.hard];
        btn.textContent = levels[index];
    });
    
    updateStatusMessage();
}

function updateStatusMessage() {
    const t = game.translations[game.language];
    let message = '';
    
    if (game.gameOver) {
        if (game.isCheckmate) {
            const winner = game.currentPlayer === 'white' ? t.black : t.white;
            message = `${winner} ${t.checkmate}`;
        } else if (game.isStalemate) {
            message = t.stalemate;
        }
    } else {
        const currentPlayerText = game.currentPlayer === 'white' ? t.white : t.black;
        message = currentPlayerText + t.turn;
        if (game.isCheck) {
            message += t.check;
        }
    }
    
    document.getElementById('status-message').textContent = message;
}

function initBoard() {
    const board = document.getElementById('chess-board');
    board.innerHTML = '';
    
    const boardColors = {
        classic: {light: '#f0d9b5', dark: '#b58863'},
        green: {light: '#eeeed2', dark: '#769656'},
        purple: {light: '#9370db', dark: '#8a2be2'},
        blue: {light: '#87ceeb', dark: '#4682b4'}
    };
    
    const colors = boardColors[game.boardColor];
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'board-square';
            square.dataset.row = row;
            square.dataset.col = col;
            
            const isLight = (row + col) % 2 === 0;
            square.style.backgroundColor = isLight ? colors.light : colors.dark;
            
            if (lastMoveFrom && lastMoveTo && 
                ((row === lastMoveFrom.row && col === lastMoveFrom.col) || 
                 (row === lastMoveTo.row && col === lastMoveTo.col))) {
                square.classList.add('last-move');
            }
            
            square.addEventListener('click', () => handleSquareClick(row, col));
            
            const piece = game.board[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece ${game.getPieceColorClass(piece)}`;
                pieceElement.textContent = game.getPieceSymbol(piece);
                
                const pieceColors = {
                    classic: {white: '#f1f1f1', black: '#333'},
                    red: {white: '#ff6b6b', black: '#c44569'},
                    gold: {white: '#ffd700', black: '#b8860b'},
                    blue: {white: '#4ecdc4', black: '#1a535c'}
                };
                
                const colorSet = pieceColors[game.pieceColor];
                pieceElement.style.color = piece.color === 'white' ? colorSet.white : colorSet.black;
                pieceElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
                pieceElement.style.fontSize = '45px';
                pieceElement.style.fontWeight = 'bold';
                
                square.appendChild(pieceElement);
            }
            
            if (row === 0) {
                const fileLabel = document.createElement('div');
                fileLabel.className = 'coordinates coord-file';
                fileLabel.textContent = String.fromCharCode(97 + col);
                square.appendChild(fileLabel);
            }
            
            if (col === 0) {
                const rankLabel = document.createElement('div');
                rankLabel.className = 'coordinates coord-rank';
                rankLabel.textContent = 8 - row;
                square.appendChild(rankLabel);
            }
            
            board.appendChild(square);
        }
    }
    
    const kingPos = game.findKing(game.currentPlayer === 'white' ? 'black' : 'white');
    if (kingPos && game.isKingInCheck(game.currentPlayer === 'white' ? 'black' : 'white')) {
        const square = board.querySelector(`[data-row="${kingPos.row}"][data-col="${kingPos.col}"]`);
        if (square) square.classList.add('check');
    }
    
    updateValidMoves();
}

function updateValidMoves() {
    document.querySelectorAll('.valid-move, .valid-capture').forEach(el => el.remove());
    
    if (!game.selectedPiece) return;
    
    const validMoves = game.getValidMoves(game.selectedPiece.row, game.selectedPiece.col);
    const board = document.getElementById('chess-board');
    
    validMoves.forEach(move => {
        const square = board.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
        if (square) {
            const indicator = document.createElement('div');
            if (move.capture) {
                indicator.className = 'valid-capture';
            } else {
                indicator.className = 'valid-move';
            }
            square.appendChild(indicator);
        }
    });
}

function handleSquareClick(row, col) {
    if (game.gameOver) return;
    
    const piece = game.board[row][col];
    
    if (game.selectedPiece) {
        const result = game.makeMove(game.selectedPiece.row, game.selectedPiece.col, row, col);
        
        if (result.success) {
            playSound(result.capture ? 'capture' : 'move');
            
            if (result.check) {
                playSound('check');
            }
            
            lastMoveFrom = {row: game.selectedPiece.row, col: game.selectedPiece.col};
            lastMoveTo = {row, col};
            
            game.selectedPiece = null;
            updateBoard();
            updateStatusMessage();
            updateMoveHistory();
            
            if (game.aiEnabled && game.currentPlayer === 'black' && !game.gameOver) {
                setTimeout(makeAIMove, 500);
            }
        } else {
            playSound('illegal');
            alert(game.translations[game.language].illegalMove || "حرکت غیرمجاز!");
            game.selectedPiece = null;
            updateBoard();
        }
    } else {
        if (piece && piece.color === game.currentPlayer) {
            game.selectedPiece = {row, col};
            document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
            const clickedPiece = document.querySelector(`[data-row="${row}"][data-col="${col}"] .piece`);
            if (clickedPiece) clickedPiece.classList.add('selected');
            updateValidMoves();
        }
    }
}

function updateBoard() {
    initBoard();
}

function updateMoveHistory() {
    const moveList = document.getElementById('move-history-list');
    moveList.innerHTML = '';
    
    const moves = game.getSimpleMoveList();
    
    moves.forEach(move => {
        if (move.white || move.black) {
            const item = document.createElement('div');
            item.className = 'move-history-item';
            item.innerHTML = `
                <span class="move-number">${move.number}.</span>
                <span class="move-white">${move.white}</span>
                <span class="move-black">${move.black}</span>
            `;
            moveList.appendChild(item);
        }
    });
    
    moveList.scrollTop = moveList.scrollHeight;
}

function startTimer() {
    if (game.timerInterval) clearInterval(game.timerInterval);
    
    game.timerInterval = setInterval(() => {
        if (game.gameOver) {
            clearInterval(game.timerInterval);
            return;
        }
        
        if (game.currentPlayer === 'white') {
            game.whiteTime--;
        } else {
            game.blackTime--;
        }
        
        updateTimerDisplay();
        
        if (game.whiteTime <= 0 || game.blackTime <= 0) {
            clearInterval(game.timerInterval);
            game.gameOver = true;
            updateStatusMessage();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    document.getElementById('white-timer').textContent = formatTime(game.whiteTime);
    document.getElementById('black-timer').textContent = formatTime(game.blackTime);
}

function makeAIMove() {
    if (game.gameOver || game.currentPlayer !== 'black') return;
    
    const aiMove = game.getAIMove();
    if (aiMove) {
        const result = game.makeMove(aiMove.from.row, aiMove.from.col, aiMove.to.row, aiMove.to.col);
        
        if (result.success) {
            playSound(result.capture ? 'capture' : 'move');
            
            if (result.check) {
                playSound('check');
            }
            
            lastMoveFrom = {row: aiMove.from.row, col: aiMove.from.col};
            lastMoveTo = {row: aiMove.to.row, col: aiMove.to.col};
            
            updateBoard();
            updateStatusMessage();
            updateMoveHistory();
        }
    }
}

function changeBoardColor(color) {
    game.boardColor = color;
    updateBoard();
    
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    event.target.classList.add('active');
}

function changePieceColor(color) {
    game.pieceColor = color;
    updateBoard();
    
    document.querySelectorAll('.piece-option').forEach(opt => opt.classList.remove('active'));
    event.target.classList.add('active');
}

function changeAILevel(level) {
    game.aiLevel = level;
    
    document.querySelectorAll('.ai-level-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function playSound(type) {
    if (!game.soundEnabled) return;
    
    const sounds = {
        move: document.getElementById('move-sound'),
        capture: document.getElementById('capture-sound'),
        illegal: document.getElementById('illegal-sound'),
        check: document.getElementById('check-sound')
    };
    
    if (sounds[type]) {
        sounds[type].currentTime = 0;
        sounds[type].play().catch(e => console.log("Audio play failed:", e));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('new-game-btn').addEventListener('click', function() {
        game.initBoard();
        game.currentPlayer = 'white';
        game.selectedPiece = null;
        game.moveHistory = [];
        game.gameOver = false;
        game.isCheck = false;
        game.isCheckmate = false;
        game.isStalemate = false;
        game.whiteTime = 15 * 60;
        game.blackTime = 15 * 60;
        lastMoveFrom = null;
        lastMoveTo = null;
        
        updateBoard();
        updateStatusMessage();
        updateMoveHistory();
        startTimer();
    });
    
    document.getElementById('undo-btn').addEventListener('click', function() {
        if (game.undoMove()) {
            updateBoard();
            updateStatusMessage();
            updateMoveHistory();
        }
    });
    
    document.getElementById('ai-toggle').addEventListener('change', function() {
        game.aiEnabled = this.checked;
    });
    
    document.getElementById('sound-toggle').addEventListener('click', function() {
        game.soundEnabled = !game.soundEnabled;
        const icon = this.querySelector('i');
        const label = this.querySelector('span');
        const t = game.translations[game.language];
        
        if (game.soundEnabled) {
            icon.className = 'fas fa-volume-up';
            label.textContent = t.soundOn;
        } else {
            icon.className = 'fas fa-volume-mute';
            label.textContent = t.soundOff;
        }
    });
});
