const config = {
    name: "ttt",  // Command name
    description: "Play a game of Tic-Tac-Toe!",  // Command description
    usage: "[start | move <row> <col>]",  // Command usage
    cooldown: 3,  // Cooldown time
    permissions: [0, 1, 2],  // Permissions: everyone can play
    credits: "Sazid",  // Author credit
    nsfw: false  // No NSFW content
}

const langData = {
    "en_US": {
        "startGame": "Starting a game of Tic-Tac-Toe!\nPlayer 1 (X) vs Player 2 (O)",
        "invalidMove": "Invalid move! Please pick an empty cell.",
        "turn": "It's {player}'s turn ({symbol}).",
        "win": "{player} ({symbol}) wins the game!",
        "draw": "It's a draw!",
        "invalidInput": "Invalid input! Use the correct format: ttt move <row> <col>.",
        "gameOver": "Game over! Start a new game with ttt start."
    },
    "vi_VN": {
        "startGame": "Bắt đầu trò chơi Cờ Caro!\nNgười chơi 1 (X) vs Người chơi 2 (O)",
        "invalidMove": "Nước đi không hợp lệ! Hãy chọn ô trống.",
        "turn": "Lượt của {player} ({symbol}).",
        "win": "{player} ({symbol}) thắng trò chơi!",
        "draw": "Hòa!",
        "invalidInput": "Nhập không hợp lệ! Sử dụng đúng định dạng: ttt move <row> <col>.",
        "gameOver": "Trò chơi kết thúc! Bắt đầu trò chơi mới với ttt start."
    },
    "ar_SY": {
        "startGame": "بدء لعبة تيك تاك تو!\nلاعب 1 (X) مقابل لاعب 2 (O)",
        "invalidMove": "خطوة غير صالحة! اختر خلية فارغة.",
        "turn": "دور {player} ({symbol}).",
        "win": "{player} ({symbol}) يفوز باللعبة!",
        "draw": "إنه تعادل!",
        "invalidInput": "إدخال غير صالح! استخدم التنسيق الصحيح: ttt move <row> <col>.",
        "gameOver": "انتهت اللعبة! ابدأ لعبة جديدة باستخدام ttt start."
    }
}

let gameState = {};

function initGame(player1, player2) {
    return {
        board: [
            ["-", "-", "-"],
            ["-", "-", "-"],
            ["-", "-", "-"]
        ],
        currentPlayer: player1,
        player1,
        player2,
        symbols: { [player1]: "X", [player2]: "O" },
        isGameOver: false
    };
}

function renderBoard(board) {
    return board.map(row => row.join(" ")).join("\n");
}

function checkWin(board, symbol) {
    const winLines = [
        // Rows
        [ [0, 0], [0, 1], [0, 2] ],
        [ [1, 0], [1, 1], [1, 2] ],
        [ [2, 0], [2, 1], [2, 2] ],
        // Columns
        [ [0, 0], [1, 0], [2, 0] ],
        [ [0, 1], [1, 1], [2, 1] ],
        [ [0, 2], [1, 2], [2, 2] ],
        // Diagonals
        [ [0, 0], [1, 1], [2, 2] ],
        [ [0, 2], [1, 1], [2, 0] ]
    ];
    
    return winLines.some(line => line.every(([r, c]) => board[r][c] === symbol));
}

function checkDraw(board) {
    return board.every(row => row.every(cell => cell !== "-"));
}

async function onCall({ message, args, getLang }) {
    const playerID = message.senderID;

    if (!args.length) {
        return message.reply(getLang("invalidInput"));
    }

    const command = args[0].toLowerCase();
    
    if (command === "start") {
        // Start a new game
        const opponentID = args[1];
        if (!opponentID) {
            return message.reply("Please mention your opponent!");
        }
        
        gameState[playerID] = initGame(playerID, opponentID);
        
        message.reply(getLang("startGame") + "\n" + renderBoard(gameState[playerID].board));
        message.reply(getLang("turn", { player: "Player 1", symbol: "X" }));
    } else if (command === "move") {
        const game = gameState[playerID];
        if (!game || game.isGameOver) {
            return message.reply(getLang("gameOver"));
        }

        const row = parseInt(args[1], 10);
        const col = parseInt(args[2], 10);

        if (isNaN(row) || isNaN(col) || row < 0 || row > 2 || col < 0 || col > 2 || game.board[row][col] !== "-") {
            return message.reply(getLang("invalidMove"));
        }

        game.board[row][col] = game.symbols[game.currentPlayer];
        
        // Check for win
        if (checkWin(game.board, game.symbols[game.currentPlayer])) {
            game.isGameOver = true;
            return message.reply(renderBoard(game.board) + "\n" + getLang("win", { player: `Player ${game.currentPlayer === game.player1 ? "1" : "2"}`, symbol: game.symbols[game.currentPlayer] }));
        }

        // Check for draw
        if (checkDraw(game.board)) {
            game.isGameOver = true;
            return message.reply(renderBoard(game.board) + "\n" + getLang("draw"));
        }

        // Switch players
        game.currentPlayer = game.currentPlayer === game.player1 ? game.player2 : game.player1;
        message.reply(renderBoard(game.board));
        message.reply(getLang("turn", { player: game.currentPlayer === game.player1 ? "Player 1" : "Player 2", symbol: game.symbols[game.currentPlayer] }));
    } else {
        message.reply(getLang("invalidInput"));
    }
}

export default {
    config,
    langData,
    onCall
}
