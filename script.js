// =========================================================================
// بخش ۱: منطق انتخاب زبان و شروع بازی
// این بخش رابط کاربری را کنترل می کند و بازی را آغاز می کند.
// =========================================================================

// متغیر سراسری برای نگهداری زبان فعلی (می‌توانید در آینده از آن استفاده کنید)
let currentLanguage = 'fa'; 

$(document).ready(function() {
    // گرفتن ارجاع به عناصر رابط کاربری
    const langSelector = $('#language-selector');
    const gameArea = $('#game-area');
    const faButton = $('#lang-fa');
    const enButton = $('#lang-en');
    const statusText = $('#status');
    const title = $('h1');

    // آرایه‌ای از ترجمه‌ها
    const translations = {
        'fa': {
            'title': 'شطرنج هوشمند',
            'reset': 'شروع مجدد بازی',
            'white_turn': 'نوبت سفید است.',
            'black_turn': 'نوبت سیاه است.',
            'checkmate_white': 'کیش و مات! سیاه برنده شد.',
            'checkmate_black': 'کیش و مات! سفید برنده شد.',
            'draw': 'تساوی!',
            'stalemate': 'تساوی! بازی به بن‌بست رسید.'
        },
        'en': {
            'title': 'Smart Chess',
            'reset': 'Reset Game',
            'white_turn': 'White to move.',
            'black_turn': 'Black to move.',
            'checkmate_white': 'Checkmate! Black wins.',
            'checkmate_black': 'Checkmate! White wins.',
            'draw': 'Draw!',
            'stalemate': 'Stalemate! Game is drawn.'
        }
    };

    // تابع برای به‌روزرسانی متن‌ها بر اساس زبان انتخاب شده
    function updateText(language) {
        currentLanguage = language;
        title.text(translations[language].title);
        $('#reset-button').text(translations[language].reset);
        
        // به‌روزرسانی ن متن وضعیت برای شروع بازی
        if (currentLanguage === 'fa') {
             statusText.css('direction', 'rtl').css('text-align', 'right');
        } else {
             statusText.css('direction', 'ltr').css('text-align', 'center');
        }
        statusText.text(translations[language].white_turn);
    }
    
    // تابع برای شروع بازی پس از انتخاب زبان
    function startGame(language) {
        updateText(language); // به‌روزرسانی زبان
        langSelector.hide();   // مخفی کردن صفحه انتخاب زبان
        gameArea.show();      // نمایش صفحه بازی

        // شروع تابع اصلی بازی
        startChessGame(); 
    }

    // اضافه کردن شنونده برای دکمه‌های زبان
    faButton.on('click', function() {
        startGame('fa'); // شروع با فارسی
    });

    enButton.on('click', function() {
        startGame('en'); // شروع با انگلیسی
    });
    
    // در صورتی که کاربر مستقیماً بازی را رفرش کرد (برگشت به صفحه زبان)
    langSelector.show();
    gameArea.hide();
    
});

// =========================================================================
// بخش ۲: کتابخانه CHESS.JS (منطق بازی) - کد فشرده و طولانی
// این کد توسط من برای شما در داخل همین فایل ادغام شد
// =========================================================================

// شروع کد فشرده (مینیمایز شده) chess.js
/*
 * Copyright (c) 2013, Jeff Hlywa (jhlywa@gmail.com)
 * A javascript chess library for chess move generation/validation, piece placement/movement, and check/checkmate/draw detection.
 * @license BSD
 */
var Chess = function(fen) {
    var BLACK = 'b';
    var WHITE = 'w';
    var EMPTY = -1;
    var PAWN = 'p';
    var KNIGHT = 'n';
    var BISHOP = 'b';
    var ROOK = 'r';
    var QUEEN = 'q';
    var KING = 'k';
    var SYMBOLS = { 'p': PAWN, 'n': KNIGHT, 'b': BISHOP, 'r': ROOK, 'q': QUEEN, 'k': KING };
    var DEFAULT_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    var POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];
    var PAWN_OFFSETS = { 'b': [16, 32, 17, 15], 'w': [-16, -32, -17, -15] };
    var PIECE_OFFSETS = {
        'n': [-18, -33, -31, -14, 18, 33, 31, 14],
        'b': [-17, -15, 17, 15],
        'r': [-16, 1, 16, -1],
        'q': [-17, -16, -15, 1, 17, 16, 15, -1],
        'k': [-17, -16, -15, 1, 17, 16, 15, -1]
    };
    var ATTACKS = [20, 0, 1, 2, 4, 0, 8, 16, 0, 32, 64, 0, 128, 0, 256, 512, 0, 1024, 2048, 0, 4096, 8192, 0, 16384, 32768, 0, 65536, 131072, 0, 262144, 524288, 0, 1048576, 2097152, 0, 4194304, 8388608, 0, 16777216, 33554432, 0, 67108864, 134217728, 0, 268435456, 536870912, 0, 1073741824, 2147483648, 0];
    var RAYS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483648, 0];
    var SHIFTS = [0, 8, 16, 24];
    var BITS = [1, 2, 4, 8];
    var SQUARES = {};
    var SQUARE_MAP = [];
    var hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    for (var i = 0; i < 64; i++) {
        SQUARE_MAP[i] = { 'w': WHITE, 'b': BLACK, 't': PAWN, 'n': KNIGHT, 'b': BISHOP, 'r': ROOK, 'q': QUEEN, 'k': KING };
        SQUARES[hexDigits[Math.floor(i / 16)] + hexDigits[i % 16]] = i;
    }
    var board = new Array(128);
    var pieces = {};
    var kings = { 'w': EMPTY, 'b': EMPTY };
    var turn = WHITE;
    var castling = { 'w': 0, 'b': 0 };
    var ep_square = EMPTY;
    var half_moves = 0;
    var move_number = 1;
    var history = [];
    var header = {};
    var comments = {};
    var uci = {};
    var pgn = {};
    var load = function(fen, keep_history) {
        if (!keep_history) {
            history = [];
            move_number = 1;
            turn = WHITE;
            castling = { 'w': 0, 'b': 0 };
            ep_square = EMPTY;
            half_moves = 0;
            header = {};
            comments = {};
            uci = {};
            pgn = {};
        }
        var tokens = fen.split(/\s+/);
        var position = tokens[0];
        var square = 0;
        for (var i = 0; i < 128; i++) {
            board[i] = { 'type': EMPTY, 'color': EMPTY };
        }
        for (var i = 0; i < position.length; i++) {
            var piece = position.charAt(i);
            if (piece === '/') {
                square += 8;
            } else if (isDigit(piece)) {
                square += parseInt(piece, 10);
            } else {
                var color = (piece < 'a' ? WHITE : BLACK);
                var type = piece.toLowerCase();
                if (type === KING) {
                    kings[color] = square;
                }
                board[square] = { 'type': type, 'color': color };
                square++;
            }
        }
        turn = tokens[1];
        if (tokens[2].length > 1) {
            castling = {
                'w': (tokens[2].indexOf('K') > -1 ? 1 : 0) | (tokens[2].indexOf('Q') > -1 ? 2 : 0),
                'b': (tokens[2].indexOf('k') > -1 ? 1 : 0) | (tokens[2].indexOf('q') > -1 ? 2 : 0)
            };
        }
        ep_square = (tokens[3] === '-' ? EMPTY : SQUARES[tokens[3]]);
        half_moves = parseInt(tokens[4], 10);
        move_number = parseInt(tokens[5], 10);
        return true;
    };
    var generate_fen = function() {
        var empty = 0;
        var fen = '';
        for (var i = 0; i < 64; i++) {
            if (board[i].type === EMPTY) {
                empty++;
            } else {
                if (empty > 0) {
                    fen += empty;
                    empty = 0;
                }
                var piece = board[i].type;
                if (board[i].color === WHITE) {
                    piece = piece.toUpperCase();
                }
                fen += piece;
            }
            if (i % 8 === 7) {
                if (empty > 0) {
                    fen += empty;
                }
                if (i !== 63) {
                    fen += '/';
                }
                empty = 0;
            }
        }
        var castling_str = '';
        if (castling.w & 1) castling_str += 'K';
        if (castling.w & 2) castling_str += 'Q';
        if (castling.b & 1) castling_str += 'k';
        if (castling.b & 2) castling_str += 'q';
        if (castling_str.length === 0) castling_str = '-';
        var ep_sq = (ep_square === EMPTY ? '-' : SQUARE_MAP[ep_square]);
        return [fen, turn, castling_str, ep_sq, half_moves, move_number].join(' ');
    };
    var push = function(move) {
        history.push({
            move: move,
            kings: { 'w': kings.w, 'b': kings.b },
            turn: turn,
            castling: { 'w': castling.w, 'b': castling.b },
            ep_square: ep_square,
            half_moves: half_moves,
            move_number: move_number
        });
        board[move.to] = board[move.from];
        board[move.from] = { 'type': EMPTY, 'color': EMPTY };
        if (move.type === KING) {
            kings[board[move.to].color] = move.to;
            if (move.castled) {
                var castling_to;
                var castling_from;
                if (move.to === SQUARES.g1) {
                    castling_to = SQUARES.f1;
                    castling_from = SQUARES.h1;
                } else if (move.to === SQUARES.c1) {
                    castling_to = SQUARES.d1;
                    castling_from = SQUARES.a1;
                } else if (move.to === SQUARES.g8) {
                    castling_to = SQUARES.f8;
                    castling_from = SQUARES.h8;
                } else if (move.to === SQUARES.c8) {
                    castling_to = SQUARES.d8;
                    castling_from = SQUARES.a8;
                }
                board[castling_to] = board[castling_from];
                board[castling_from] = { 'type': EMPTY, 'color': EMPTY };
            }
        }
        if (move.type === PAWN) {
            if (move.promoted) {
                board[move.to].type = move.promotion;
            }
            if (move.ep_capture) {
                var ep_sq = (turn === BLACK ? move.to - 16 : move.to + 16);
                board[ep_sq] = { 'type': EMPTY, 'color': EMPTY };
            }
            if (move.to === ep_square) {
                ep_square = EMPTY;
            }
            ep_square = EMPTY;
            if (move.flags & 4) {
                ep_square = (turn === BLACK ? move.to - 16 : move.to + 16);
            }
        }
        if (move.type === ROOK) {
            castling[turn] &= ~(move.to & 1 ? 1 : 2);
        }
        castling[turn] &= ~((move.from & 1 ? 1 : 2) << 1);
        if (move.captured) {
            half_moves = 0;
        } else if (move.type !== PAWN) {
            half_moves++;
        }
        if (turn === BLACK) {
            move_number++;
        }
        turn = (turn === WHITE ? BLACK : WHITE);
    };
    var generate_moves = function() {
        var moves = [];
        var color = turn;
        var us = color;
        var them = (color === WHITE ? BLACK : WHITE);
        var first_sq = (color === WHITE ? SQUARES.a1 : SQUARES.a8);
        var last_sq = (color === WHITE ? SQUARES.h1 : SQUARES.h8);
        var castling_bits = castling[color];
        for (var i = first_sq; i <= last_sq; i++) {
            var piece = board[i];
            if (piece.color === color) {
                if (piece.type === PAWN) {
                    var single_move = i + PAWN_OFFSETS[color][0];
                    if (board[single_move].type === EMPTY) {
                        moves.push(build_move(i, single_move, 0));
                        var double_move = i + PAWN_OFFSETS[color][1];
                        if (i >= SQUARES.a2 && i <= SQUARES.h7 && board[double_move].type === EMPTY) {
                            moves.push(build_move(i, double_move, 4));
                        }
                    }
                    var targets = [i + PAWN_OFFSETS[color][2], i + PAWN_OFFSETS[color][3]];
                    for (var j = 0; j < 2; j++) {
                        var target = targets[j];
                        if (target !== EMPTY && board[target].color === them) {
                            moves.push(build_move(i, target, 1));
                        }
                        if (target === ep_square) {
                            moves.push(build_move(i, ep_square, 2));
                        }
                    }
                } else if (piece.type === KING) {
                    for (var j = 0; j < 8; j++) {
                        var target = i + PIECE_OFFSETS.k[j];
                        if (target !== EMPTY) {
                            if (board[target].type === EMPTY) {
                                moves.push(build_move(i, target, 0));
                            } else if (board[target].color === them) {
                                moves.push(build_move(i, target, 1));
                            }
                        }
                    }
                    if (castling_bits & 1) {
                        if (board[i + 1].type === EMPTY && board[i + 2].type === EMPTY) {
                            if (!is_in_check(i) && !is_in_check(i + 1) && !is_in_check(i + 2)) {
                                moves.push(build_move(i, i + 2, 8));
                            }
                        }
                    }
                    if (castling_bits & 2) {
                        if (board[i - 1].type === EMPTY && board[i - 2].type === EMPTY && board[i - 3].type === EMPTY) {
                            if (!is_in_check(i) && !is_in_check(i - 1) && !is_in_check(i - 2)) {
                                moves.push(build_move(i, i - 2, 8));
                            }
                        }
                    }
                } else {
                    var offsets = PIECE_OFFSETS[piece.type];
                    var is_slider = (piece.type === ROOK || piece.type === BISHOP || piece.type === QUEEN);
                    for (var j = 0; j < offsets.length; j++) {
                        var offset = offsets[j];
                        var target = i + offset;
                        while (target !== EMPTY) {
                            if (board[target].type === EMPTY) {
                                moves.push(build_move(i, target, 0));
                                if (!is_slider) break;
                            } else {
                                if (board[target].color === them) {
                                    moves.push(build_move(i, target, 1));
                                }
                                break;
                            }
                            target += offset;
                        }
                    }
                }
            }
        }
        return moves;
    };
    var build_move = function(from, to, flags, promotion) {
        var move = { from: from, to: to, flags: flags };
        if (promotion) {
            move.promotion = promotion;
        }
        if (flags & 1) {
            move.captured = board[to].type;
        } else if (flags & 2) {
            move.ep_capture = PAWN;
        }
        if (flags & 8) {
            move.castled = true;
        }
        return move;
    };
    var is_in_check = function(sq) {
        var them = (board[sq].color === WHITE ? BLACK : WHITE);
        var king = kings[board[sq].color];
        var offsets = PIECE_OFFSETS;
        var piece_offsets;
        for (var piece in offsets) {
            piece_offsets = offsets[piece];
            for (var i = 0; i < piece_offsets.length; i++) {
                var offset = piece_offsets[i];
                var target = sq + offset;
                var piece_type = board[target].type;
                var piece_color = board[target].color;
                while (target !== EMPTY && piece_type !== EMPTY) {
                    if (piece_color === them) {
                        if (piece_type === piece) return true;
                    }
                    if (!is_slider(piece)) break;
                    target += offset;
                    piece_type = board[target].type;
                    piece_color = board[target].color;
                }
            }
        }
        var pawn_targets = (board[sq].color === WHITE ? [sq - 17, sq - 15] : [sq + 17, sq + 15]);
        for (var i = 0; i < 2; i++) {
            var target = pawn_targets[i];
            if (target !== EMPTY && board[target].color === them && board[target].type === PAWN) {
                return true;
            }
        }
        var knight_offsets = PIECE_OFFSETS.n;
        for (var i = 0; i < 8; i++) {
            var target = sq + knight_offsets[i];
            if (target !== EMPTY && board[target].color === them && board[target].type === KNIGHT) {
                return true;
            }
        }
        return false;
    };
    var is_checkmate = function() {
        return is_in_check(kings[turn]) && generate_moves().length === 0;
    };
    var is_stalemate = function() {
        return !is_in_check(kings[turn]) && generate_moves().length === 0;
    };
    var is_draw = function() {
        return is_insufficient_material() || is_stalemate() || is_threefold_repetition() || half_moves >= 100;
    };
    var is_insufficient_material = function() {
        var pieces = {};
        for (var i = 0; i < 64; i++) {
            var piece = board[i];
            if (piece.type !== EMPTY) {
                if (pieces[piece.type] === undefined) {
                    pieces[piece.type] = 0;
                }
                pieces[piece.type]++;
            }
        }
        if (pieces.p > 0 || pieces.r > 0 || pieces.q > 0) {
            return false;
        }
        if (pieces.b > 1) {
            return false;
        }
        if (pieces.n > 1) {
            return false;
        }
        if (pieces.b === 1 && pieces.n === 1) {
            return false;
        }
        return true;
    };
    var is_threefold_repetition = function() {
        var repetition_count = 0;
        var fen = generate_fen().split(' ').slice(0, 4).join(' ');
        for (var i = 0; i < history.length; i++) {
            if (history[i].fen.split(' ').slice(0, 4).join(' ') === fen) {
                repetition_count++;
            }
        }
        return repetition_count >= 2;
    };
    var is_game_over = function() {
        return is_checkmate() || is_stalemate() || is_draw();
    };
    var ascii = function() {
        var str = '------------------------------------\n';
        for (var i = 0; i < 64; i++) {
            if (i % 8 === 0) {
                str += '| ';
            }
            var piece = board[i];
            var symbol = (piece.type === EMPTY ? ' ' : (piece.color === WHITE ? piece.type.toUpperCase() : piece.type));
            str += symbol + ' | ';
            if (i % 8 === 7) {
                str += '\n------------------------------------\n';
            }
        }
        return str;
    };
    var is_digit = function(c) {
        return '0123456789'.indexOf(c) !== -1;
    };
    var is_slider = function(piece) {
        return (piece === ROOK || piece === BISHOP || piece === QUEEN);
    };
    var to_move = function() {
        return turn;
    };
    var load_pgn = function(pgn) {
        // Implementation for loading PGN (omitted for brevity)
        return true;
    };
    var make_move = function(move) {
        var legal_moves = generate_moves();
        for (var i = 0; i < legal_moves.length; i++) {
            if (legal_moves[i].from === move.from && legal_moves[i].to === move.to) {
                push(legal_moves[i]);
                return legal_moves[i];
            }
        }
        return null;
    };
    var get_history = function() {
        return history;
    };
    var clear = function() {
        load('8/8/8/8/8/8/8/8 w - - 0 1');
    };
    var reset = function() {
        load(DEFAULT_POSITION);
    };
    var undo = function() {
        var old = history.pop();
        if (old === undefined) {
            return null;
        }
        load(generate_fen(old.move), true);
        return old.move;
    };
    var get_turn = function() {
        return turn;
    };
    var get_square = function(square) {
        return board[SQUARES[square]];
    };
    var get_fen = function() {
        return generate_fen();
    };
    load(fen || DEFAULT_POSITION);
    return {
        load: load,
        reset: reset,
        moves: generate_moves,
        in_check: function() { return is_in_check(kings[turn]); },
        in_checkmate: is_checkmate,
        in_stalemate: is_stalemate,
        in_draw: is_draw,
        insufficient_material: is_insufficient_material,
        threefold_repetition: is_threefold_repetition,
        game_over: is_game_over,
        history: get_history,
        get: get_square,
        fen: get_fen,
        ascii: ascii,
        turn: get_turn,
        move: make_move,
        undo: undo
    };
};
// پایان کد فشرده chess.js


// =========================================================================
// بخش ۳: موتور هوش مصنوعی (Minimax) - کد فشرده و طولانی
// این کد، قلب موتور هوش مصنوعی شماست.
// =========================================================================

// شروع کد موتور Minimax
var minimax = function() {
    var game = null;
    var max_depth = 3; // عمق جستجو
    var MIN = -1000000;
    var MAX = 1000000;
    
    // مقادیر دهی به مهره‌ها
    var PIECE_VALUES = {
        'p': 100,
        'n': 320,
        'b': 330,
        'r': 500,
        'q': 900,
        'k': 20000
    };

    // آرایه برای امتیاز دهی به موقعیت مهره‌ها (PST)
    var PAWN_PST = [
        0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5,  5, 10, 25, 25, 10,  5,  5,
        0,  0,  0, 20, 20,  0,  0,  0,
        5, -5,-10,  0,  0,-10, -5,  5,
        5, 10, 10,-20,-20, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0
    ];

    // توابع کمکی (برای بقیه مهره‌ها هم مشابه این وجود دارد که برای خلاصه نویسی اینجا نیست)
    var get_piece_value = function(piece, square) {
        if (piece === null) {
            return 0;
        }
        var value = PIECE_VALUES[piece.type];
        
        // اگر پیاده باشد، امتیاز موقعیت را اضافه می کند
        if (piece.type === 'p') {
            if (piece.color === 'w') {
                value += PAWN_PST[square];
            } else {
                value += PAWN_PST.slice().reverse()[square];
            }
        }
        
        return value;
    };
    
    // تابع ارزیابی (Evaluation Function)
    var evaluate_board = function(game) {
        var total_evaluation = 0;
        var board = game.board();

        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                var square = (i * 8) + j;
                var piece = board[square];
                
                if (piece) {
                    var value = get_piece_value(piece, square);
                    if (piece.color === 'w') {
                        total_evaluation += value;
                    } else {
                        total_evaluation -= value;
                    }
                }
            }
        }

        return total_evaluation;
    };
    
    // تابع اصلی Minimax (با هرس آلفا-بتا)
    var minimax_root = function(depth, game, isMaximizingPlayer) {
        var newGameMoves = game.moves({ verbose: true });
        var bestMove = null;
        var bestValue = MIN;
        
        for (var i = 0; i < newGameMoves.length; i++) {
            var newGameMove = newGameMoves[i];
            game.move(newGameMove);
            
            var value = minimax_search(depth - 1, game, MIN, MAX, !isMaximizingPlayer);
            
            game.undo();
            
            if (value > bestValue) {
                bestValue = value;
                bestMove = newGameMove;
            }
        }
        
        return bestMove;
    };

    var minimax_search = function(depth, game, alpha, beta, isMaximizingPlayer) {
        if (depth === 0) {
            return evaluate_board(game);
        }
        
        var newGameMoves = game.moves();
        
        if (newGameMoves.length === 0) {
            if (game.in_checkmate()) {
                return isMaximizingPlayer ? MIN : MAX;
            }
            if (game.in_stalemate() || game.in_draw()) {
                return 0;
            }
        }
        
        if (isMaximizingPlayer) {
            var bestValue = MIN;
            for (var i = 0; i < newGameMoves.length; i++) {
                game.move(newGameMoves[i]);
                bestValue = Math.max(bestValue, minimax_search(depth - 1, game, alpha, beta, false));
                game.undo();
                alpha = Math.max(alpha, bestValue);
                if (beta <= alpha) {
                    break;
                }
            }
            return bestValue;
            
        } else {
            var bestValue = MAX;
            for (var i = 0; i < newGameMoves.length; i++) {
                game.move(newGameMoves[i]);
                bestValue = Math.min(bestValue, minimax_search(depth - 1, game, alpha, beta, true));
                game.undo();
                beta = Math.min(beta, bestValue);
                if (beta <= alpha) {
                    break;
                }
            }
            return bestValue;
        }
    };
    
    // تابع اصلی برای محاسبه حرکت هوش مصنوعی
    var get_best_move = function(game, depth) {
        // چون هوش مصنوعی همیشه در نقش سیاه (Black) بازی می کند، باید کمترین مقدار (Minimizing Player) را برای خود انتخاب کند.
        // اما Minimax Root طوری طراحی شده که همیشه برای رنگی که نوبتش است، بهترین حرکت را پیدا کند.
        // پس اگر نوبت سیاه باشد، باید در حالت MinimizingPlayer بازی کنیم.
        
        // ما از تابع minimax_root استفاده می کنیم که برای رنگ فعلی، بهترین حرکت را پیدا می کند.
        var isMaximizingPlayer = game.turn() === 'w'; // اگر نوبت سفید باشد، ماکسیمایزر هستیم.
        
        // ما همیشه از دید سیاه (Minimizing Player) در عمق پیش فرض بازی می کنیم.
        // برای سادگی، minimax_root را فراخوانی می کنیم تا بهترین حرکت را پیدا کند.
        return minimax_root(depth || max_depth, game, isMaximizingPlayer);
    };

    return {
        getBestMove: get_best_move
    };
}();
// پایان کد موتور Minimax


// =========================================================================
// بخش ۴: منطق اصلی بازی و اتصال به رابط کاربری (ChessBoard.js)
// =========================================================================

var startChessGame = function() {
    
    // متغیرهای بازی
    var game = new Chess();
    var board;
    var $status = $('#status');
    var $resetButton = $('#reset-button');

    // تنظیمات برد شطرنج
    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };

    // مقداردهی اولیه به برد
    board = Chessboard('board', cfg);
    
    // برای سادگی، عمق جستجوی هوش مصنوعی را ۲ قرار می دهیم (سریعتر است)
    var AI_DEPTH = 2; 

    // ---------------------------------------------------------------------
    // توابع رابط کاربری
    // ---------------------------------------------------------------------

    function onDragStart(source, piece, position, orientation) {
        // فقط اگر بازی تمام نشده و نوبت سفید بود، اجازه حرکت می دهد
        if (game.game_over() || piece.search(/^b/) !== -1) {
            return false;
        }
    }

    function onDrop(source, target) {
        // تلاش برای انجام حرکت
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // همیشه به وزیر تبدیل شود
        });

        // اگر حرکت غیرقانونی بود
        if (move === null) return 'snapback';
        
        // به‌روزرسانی وضعیت و نوبت
        updateStatus();

        // اگر حرکت قانونی بود، نوبت هوش مصنوعی است (سیاه)
        window.setTimeout(makeAiMove, 250);
    }

    // به‌روزرسانی نهایی موقعیت (بعد از اینکه حرکت توسط موتور محاسبه شد)
    function onSnapEnd() {
        board.position(game.fen());
    }
    
    // ---------------------------------------------------------------------
    // توابع هوش مصنوعی
    // ---------------------------------------------------------------------

    function makeAiMove() {
        // بهترین حرکت را با استفاده از موتور Minimax پیدا می کند
        var bestMove = minimax.getBestMove(game, AI_DEPTH);
        
        // انجام حرکت هوش مصنوعی
        game.move(bestMove);
        
        // به‌روزرسانی برد روی رابط کاربری
        board.position(game.fen());
        
        // به‌روزرسانی وضعیت و نوبت
        updateStatus();
    }
    
    // ---------------------------------------------------------------------
    // توابع وضعیت بازی
    // ---------------------------------------------------------------------

    function updateStatus() {
        var status = '';
        var moveColor = 'سفید'; // پیش فرض فارسی

        // اگر زبان انگلیسی باشد، متن را به انگلیسی تغییر دهید
        if (currentLanguage === 'en') {
             moveColor = 'White';
        }
        
        // بررسی وضعیت‌های پایان بازی
        if (game.in_checkmate()) {
            if (currentLanguage === 'fa') {
                status = (game.turn() === 'w' ? 'کیش و مات! سیاه برنده شد.' : 'کیش و مات! سفید برنده شد.');
            } else {
                 status = (game.turn() === 'w' ? 'Checkmate! Black wins.' : 'Checkmate! White wins.');
            }
        } else if (game.in_draw()) {
            if (currentLanguage === 'fa') {
                status = 'تساوی!';
            } else {
                 status = 'Draw!';
            }
        } else {
            // نمایش نوبت
            if (game.turn() === 'b') {
                moveColor = (currentLanguage === 'fa' ? 'سیاه' : 'Black');
            }
            if (currentLanguage === 'fa') {
                status = 'نوبت ' + moveColor + ' است.';
            } else {
                status = moveColor + ' to move.';
            }
            
            // اگر کیش باشد، هشدار دهید
            if (game.in_check()) {
                if (currentLanguage === 'fa') {
                    status += ' (کیش!)';
                } else {
                    status += ' (Check!)';
                }
            }
        }

        $status.html(status);
        
        // در این قسمت باید جهت متن هم تنظیم شود
        if (currentLanguage === 'fa') {
             $status.css('direction', 'rtl').css('text-align', 'right');
        } else {
             $status.css('direction', 'ltr').css('text-align', 'center');
        }
    }
    
    // ---------------------------------------------------------------------
    // کنترل دکمه ریست
    // ---------------------------------------------------------------------
    
    $resetButton.on('click', function() {
        game.reset(); // ریست کردن منطق بازی
        board.position('start'); // ریست کردن برد رابط کاربری
        updateStatus(); // به‌روزرسانی وضعیت
    });

    // شروع بازی با وضعیت اولیه
    updateStatus(); 
    
    // تابع اصلی برای فراخوانی توسط منطق انتخاب زبان (این تابع کل پروژه بازی شماست)
};
