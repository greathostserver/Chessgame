class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.gameOver = false;
        this.isCheck = false;
        this.isCheckmate = false;
        this.isStalemate = false;
        this.whiteTime = 15 * 60;
        this.blackTime = 15 * 60;
        this.timerInterval = null;
        this.aiLevel = 1;
        this.aiEnabled = true;
        this.soundEnabled = true;
        this.boardColor = 'classic';
        this.pieceColor = 'classic';
        this.language = 'fa';
        
        this.pieceImages = {
            white: {
                classic: {
                    king: '♔',
                    queen: '♕',
                    rook: '♖',
                    bishop: '♗',
                    knight: '♘',
                    pawn: '♙'
                },
                red: {
                    king: '♔',
                    queen: '♕',
                    rook: '♖',
                    bishop: '♗',
                    knight: '♘',
                    pawn: '♙'
                },
                gold: {
                    king: '♔',
                    queen: '♕',
                    rook: '♖',
                    bishop: '♗',
                    knight: '♘',
                    pawn: '♙'
                },
                blue: {
                    king: '♔',
                    queen: '♕',
                    rook: '♖',
                    bishop: '♗',
                    knight: '♘',
                    pawn: '♙'
                }
            },
            black: {
                classic: {
                    king: '♚',
                    queen: '♛',
                    rook: '♜',
                    bishop: '♝',
                    knight: '♞',
                    pawn: '♟'
                },
                red: {
                    king: '♚',
                    queen: '♛',
                    rook: '♜',
                    bishop: '♝',
                    knight: '♞',
                    pawn: '♟'
                },
                gold: {
                    king: '♚',
                    queen: '♛',
                    rook: '♜',
                    bishop: '♝',
                    knight: '♞',
                    pawn: '♟'
                },
                blue: {
                    king: '♚',
                    queen: '♛',
                    rook: '♜',
                    bishop: '♝',
                    knight: '♞',
                    pawn: '♟'
                }
            }
        };
        
        this.translations = {
            fa: {
                title: "شطرنج",
                white: "سفید",
                black: "سیاه",
                turn: " نوبت",
                check: " کیش",
                checkmate: " کیش و مات",
                stalemate: " پات",
                newGame: "بازی جدید",
                undo: "بازگشت حرکت",
                boardColor: "رنگ صفحه",
                pieceColor: "رنگ مهره‌ها",
                aiLevel: "سطح هوش مصنوعی",
                easy: "آسان",
                medium: "متوسط",
                hard: "سخت",
                aiMode: "بازی با کامپیوتر",
                moveHistory: "تاریخچه حرکات",
                soundOn: "صدا فعال",
                soundOff: "صدا غیرفعال"
            },
            ar: {
                title: "شطرنج",
                white: "أبيض",
                black: "أسود",
                turn: " دور",
                check: " كش ملك",
                checkmate: " كش مات",
                stalemate: " طريق مسدود",
                newGame: "لعبة جديدة",
                undo: "تراجع عن النقلة",
                boardColor: "لون الرقعة",
                pieceColor: "لون القطع",
                aiLevel: "مستوى الذكاء الاصطناعي",
                easy: "سهل",
                medium: "متوسط",
                hard: "صعب",
                aiMode: "اللعب ضد الكمبيوتر",
                moveHistory: "سجل النقلات",
                soundOn: "الصوت مفعل",
                soundOff: "الصوت معطل"
            },
            en: {
                title: "Chess",
                white: "White",
                black: "Black",
                turn: "'s turn",
                check: " - Check",
                checkmate: " - Checkmate",
                stalemate: " - Stalemate",
                newGame: "New Game",
                undo: "Undo Move",
                boardColor: "Board Color",
                pieceColor: "Piece Color",
                aiLevel: "AI Level",
                easy: "Easy",
                medium: "Medium",
                hard: "Hard",
                aiMode: "Play vs Computer",
                moveHistory: "Move History",
                soundOn: "Sound On",
                soundOff: "Sound Off"
            }
        };
        
        this.initBoard();
    }
    
    initBoard() {
        this.board = [
            [
                {type: 'rook', color: 'black', moved: false},
                {type: 'knight', color: 'black', moved: false},
                {type: 'bishop', color: 'black', moved: false},
                {type: 'queen', color: 'black', moved: false},
                {type: 'king', color: 'black', moved: false},
                {type: 'bishop', color: 'black', moved: false},
                {type: 'knight', color: 'black', moved: false},
                {type: 'rook', color: 'black', moved: false}
            ],
            [
                {type: 'pawn', color: 'black', moved: false},
                {type: 'pawn', color: 'black', moved: false},
                {type: 'pawn', color: 'black', moved: false},
                {type: 'pawn', color: 'black', moved: false},
                {type: 'pawn', color: 'black', moved: false},
                {type: 'pawn', color: 'black', moved: false},
                {type: 'pawn', color: 'black', moved: false},
                {type: 'pawn', color: 'black', moved: false}
            ],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [
                {type: 'pawn', color: 'white', moved: false},
                {type: 'pawn', color: 'white', moved: false},
                {type: 'pawn', color: 'white', moved: false},
                {type: 'pawn', color: 'white', moved: false},
                {type: 'pawn', color: 'white', moved: false},
                {type: 'pawn', color: 'white', moved: false},
                {type: 'pawn', color: 'white', moved: false},
                {type: 'pawn', color: 'white', moved: false}
            ],
            [
                {type: 'rook', color: 'white', moved: false},
                {type: 'knight', color: 'white', moved: false},
                {type: 'bishop', color: 'white', moved: false},
                {type: 'queen', color: 'white', moved: false},
                {type: 'king', color: 'white', moved: false},
                {type: 'bishop', color: 'white', moved: false},
                {type: 'knight', color: 'white', moved: false},
                {type: 'rook', color: 'white', moved: false}
            ]
        ];
    }
    
    getPieceSymbol(piece) {
        if (!piece) return '';
        return this.pieceImages[piece.color][this.pieceColor][piece.type];
    }
    
    getPieceColorClass(piece) {
        if (!piece) return '';
        return piece.color === 'white' ? 'piece-white' : 'piece-black';
    }
    
    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves.push(...this.getPawnMoves(row, col, piece.color));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(row, col, piece.color));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(row, col, piece.color));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(row, col, piece.color));
                break;
            case 'queen':
                moves.push(...this.getQueenMoves(row, col, piece.color));
                break;
            case 'king':
                moves.push(...this.getKingMoves(row, col, piece.color));
                break;
        }
        
        return this.filterValidMoves(moves, row, col, piece);
    }
    
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        if (this.isInBounds(row + direction, col) && !this.board[row + direction][col]) {
            moves.push({row: row + direction, col, capture: false});
            
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({row: row + 2 * direction, col, capture: false});
            }
        }
        
        for (let dc of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dc;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({row: newRow, col: newCol, capture: true});
                }
            }
        }
        
        return moves;
    }
    
    getRookMoves(row, col, color) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                
                if (!targetPiece) {
                    moves.push({row: newRow, col: newCol, capture: false});
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({row: newRow, col: newCol, capture: true});
                    }
                    break;
                }
                
                newRow += dr;
                newCol += dc;
            }
        }
        
        return moves;
    }
    
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [dr, dc] of knightMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                
                if (!targetPiece) {
                    moves.push({row: newRow, col: newCol, capture: false});
                } else if (targetPiece.color !== color) {
                    moves.push({row: newRow, col: newCol, capture: true});
                }
            }
        }
        
        return moves;
    }
    
    getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                
                if (!targetPiece) {
                    moves.push({row: newRow, col: newCol, capture: false});
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({row: newRow, col: newCol, capture: true});
                    }
                    break;
                }
                
                newRow += dr;
                newCol += dc;
            }
        }
        
        return moves;
    }
    
    getQueenMoves(row, col, color) {
        return [...this.getRookMoves(row, col, color), ...this.getBishopMoves(row, col, color)];
    }
    
    getKingMoves(row, col, color) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                
                if (!targetPiece) {
                    moves.push({row: newRow, col: newCol, capture: false});
                } else if (targetPiece.color !== color) {
                    moves.push({row: newRow, col: newCol, capture: true});
                }
            }
        }
        
        return moves;
    }
    
    filterValidMoves(moves, fromRow, fromCol, piece) {
        const validMoves = [];
        
        for (const move of moves) {
            const originalPiece = this.board[move.row][move.col];
            
            this.board[move.row][move.col] = piece;
            this.board[fromRow][fromCol] = null;
            
            if (!this.isKingInCheck(piece.color)) {
                validMoves.push(move);
            }
            
            this.board[move.row][move.col] = originalPiece;
            this.board[fromRow][fromCol] = piece;
        }
        
        return validMoves;
    }
    
    isKingInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color !== color) {
                    const moves = this.getValidMoves(row, col);
                    for (const move of moves) {
                        if (move.row === kingPos.row && move.col === kingPos.col) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return {row, col};
                }
            }
        }
        return null;
    }
    
    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentPlayer) {
            return {success: false, message: "انتخاب نامعتبر"};
        }
        
        const validMoves = this.getValidMoves(fromRow, fromCol);
        const isValidMove = validMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
        
        if (!isValidMove) {
            return {success: false, message: "حرکت غیرمجاز"};
        }
        
        const capturedPiece = this.board[toRow][toCol];
        
        const moveRecord = {
            from: {row: fromRow, col: fromCol},
            to: {row: toRow, col: toCol},
            piece: {...piece},
            captured: capturedPiece ? {...capturedPiece} : null,
            player: this.currentPlayer
        };
        
        this.board[toRow][toCol] = {...piece, moved: true};
        this.board[fromRow][fromCol] = null;
        
        this.moveHistory.push(moveRecord);
        
        this.isCheck = this.isKingInCheck(this.currentPlayer === 'white' ? 'black' : 'white');
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        this.checkGameOver();
        
        return {success: true, captured: !!capturedPiece, check: this.isCheck};
    }
    
    checkGameOver() {
        const opponentColor = this.currentPlayer;
        let hasValidMoves = false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.getValidMoves(row, col).length > 0) {
                        hasValidMoves = true;
                        break;
                    }
                }
            }
            if (hasValidMoves) break;
        }
        
        if (!hasValidMoves) {
            if (this.isKingInCheck(opponentColor)) {
                this.isCheckmate = true;
                this.gameOver = true;
            } else {
                this.isStalemate = true;
                this.gameOver = true;
            }
        }
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) return false;
        
        const lastMove = this.moveHistory.pop();
        
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
        
        this.currentPlayer = lastMove.player;
        
        this.isCheck = this.isKingInCheck(this.currentPlayer === 'white' ? 'black' : 'white');
        this.isCheckmate = false;
        this.isStalemate = false;
        this.gameOver = false;
        
        return true;
    }
    
    getSimpleMoveList() {
        return this.moveHistory.map((move, index) => {
            const fromSquare = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
            const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
            return {
                number: Math.floor(index / 2) + 1,
                white: index % 2 === 0 ? `${fromSquare}${toSquare}` : '',
                black: index % 2 === 1 ? `${fromSquare}${toSquare}` : ''
            };
        });
    }
    
    getAIMove() {
        const possibleMoves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    const moves = this.getValidMoves(row, col);
                    for (const move of moves) {
                        possibleMoves.push({
                            from: {row, col},
                            to: {row: move.row, col: move.col},
                            capture: move.capture,
                            piece: piece.type
                        });
                    }
                }
            }
        }
        
        if (possibleMoves.length === 0) return null;
        
        if (this.aiLevel === 1) {
            const randomIndex = Math.floor(Math.random() * possibleMoves.length);
            return possibleMoves[randomIndex];
        } else if (this.aiLevel === 2) {
            const captureMoves = possibleMoves.filter(move => move.capture);
            if (captureMoves.length > 0) {
                const randomIndex = Math.floor(Math.random() * captureMoves.length);
                return captureMoves[randomIndex];
            }
            const randomIndex = Math.floor(Math.random() * possibleMoves.length);
            return possibleMoves[randomIndex];
        } else {
            const bestMoves = possibleMoves.filter(move => {
                if (move.capture) return true;
                if (move.piece === 'pawn' && (move.to.row === 0 || move.to.row === 7)) return true;
                return false;
            });
            
            if (bestMoves.length > 0) {
                const randomIndex = Math.floor(Math.random() * bestMoves.length);
                return bestMoves[randomIndex];
            }
            
            const randomIndex = Math.floor(Math.random() * possibleMoves.length);
            return possibleMoves[randomIndex];
        }
    }
    
    updateLanguage(lang) {
        this.language = lang;
    }
}
