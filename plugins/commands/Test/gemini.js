const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ytdl = require("ytdl-core");
const yts = require("yt-search");

// Command Configuration
const commandConfig = {
    name: "gemini2",
    aliases: ["bard"],
    version: "4.0",
    author: "Sazid",
    cooldown: 5,
    role: 0,
    longDescription: "Handles various media tasks including downloading audio, video, and generating images.",
    category: "ai",
    guide: {
        en: "{p}gemini2 [draw/send/sing] [prompt] - Handles media tasks or generates responses based on user prompts."
    }
};

// Language Data
const langData = {
    "en_US": {
        "noSongFound": "No song found for the given query.",
        "noVideoFound": "No videos found for the given query.",
        "error": "Sorry, an error occurred while processing your request.",
        "noPrompt": "Please provide a prompt."
    },
    "vi_VN": {
        "noSongFound": "Không tìm thấy bài hát cho truy vấn đã cho.",
        "noVideoFound": "Không tìm thấy video cho truy vấn đã cho.",
        "error": "Xin lỗi, đã xảy ra lỗi trong khi xử lý yêu cầu của bạn.",
        "noPrompt": "Vui lòng cung cấp một gợi ý."
    },
    "ar_SY": {
        "noSongFound": "لم يتم العثور على أغنية للبحث المعطى.",
        "noVideoFound": "لم يتم العثور على مقاطع الفيديو للبحث المعطى.",
        "error": "عذرًا، حدث خطأ أثناء معالجة طلبك.",
        "noPrompt": "يرجى تقديم موجه."
    }
};

// Utility Functions
async function fetchAnswer(prompt, uid) {
    try {
        const response = await axios.get(`https://gemini-ai-pearl-two.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}&uid=${uid}&apikey=kshitiz`);
        return response.data.answer;
    } catch (error) {
        throw error;
    }
}

async function fetchImageUrl(prompt) {
    try {
        const response = await axios.get(`https://sdxl-kshitiz.onrender.com/gen?prompt=${encodeURIComponent(prompt)}&style=3`);
        return response.data.url;
    } catch (error) {
        throw error;
    }
}

async function describeImage(prompt, photoUrl) {
    try {
        const url = `https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(photoUrl)}`;
        const response = await axios.get(url);
        return response.data.answer;
    } catch (error) {
        throw error;
    }
}

async function downloadAudio(api, event, args, message) {
    try {
        const songName = args.join(" ");
        const searchResults = await yts(songName);

        if (!searchResults.videos.length) {
            return message.reply(getLang("noSongFound"));
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;
        const stream = ytdl(videoUrl, { filter: "audioonly" });
        const fileName = `music.mp3`; 
        const filePath = path.join(__dirname, "tmp", fileName);

        stream.pipe(fs.createWriteStream(filePath));

        stream.on('response', () => console.info('[DOWNLOADER]', 'Starting download now!'));
        stream.on('info', (info) => console.info('[DOWNLOADER]', `Downloading ${info.videoDetails.title} by ${info.videoDetails.author.name}`));

        stream.on('end', () => {
            const audioStream = fs.createReadStream(filePath);
            message.reply({ attachment: audioStream });
            api.setMessageReaction("✅", event.messageID, () => {}, true);
        });
    } catch (error) {
        console.error("Error:", error);
        message.reply(getLang("error"));
    }
}

async function downloadVideo(api, event, args, message) {
    try {
        const query = args.join(" ");
        const searchResults = await yts(query);

        if (!searchResults.videos.length) {
            return message.reply(getLang("noVideoFound"));
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;
        const stream = ytdl(videoUrl, { filter: "audioandvideo" }); 
        const fileName = `music.mp4`;
        const filePath = path.join(__dirname, "tmp", fileName);

        stream.pipe(fs.createWriteStream(filePath));

        stream.on('response', () => console.info('[DOWNLOADER]', 'Starting download now!'));
        stream.on('info', (info) => console.info('[DOWNLOADER]', `Downloading ${info.videoDetails.title} by ${info.videoDetails.author.name}`));

        stream.on('end', () => {
            const videoStream = fs.createReadStream(filePath);
            message.reply({ attachment: videoStream });
            api.setMessageReaction("✅", event.messageID, () => {}, true);
        });
    } catch (error) {
        console.error("Error:", error);
        message.reply(getLang("error"));
    }
}

async function generateImage(message, prompt) {
    try {
        const imageUrl = await fetchImageUrl(prompt);
        const filePath = path.join(__dirname, 'cache', `image_${Date.now()}.png`);
        const writer = fs.createWriteStream(filePath);

        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        }).then(() => {
            message.reply({
                body: "Generated image:",
                attachment: fs.createReadStream(filePath)
            });
        });
    } catch (error) {
        console.error("Error:", error);
        message.reply("An error occurred while generating the image.");
    }
}

// Main Command Handler
async function handleCommand({ api, message, event, args }) {
    try {
        const userID = event.senderID;
        let prompt = args.join(" ").trim();
        let action = "";

        if (args[0].toLowerCase() === "draw") {
            action = "draw";
            prompt = args.slice(1).join(" ").trim();
        } else if (args[0].toLowerCase() === "send") {
            action = "sendTikTok";
            prompt = args.slice(1).join(" ").trim();
        } else if (args[0].toLowerCase() === "sing") {
            action = "sing";
            prompt = args.slice(1).join(" ").trim();
        } else if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
            const photoUrl = event.messageReply.attachments[0].url;
            const description = await describeImage(prompt, photoUrl);
            message.reply(`Description: ${description}`);
            return;
        }

        if (!prompt) {
            return message.reply(getLang("noPrompt"));
        }

        switch(action) {
            case "draw":
                await generateImage(message, prompt);
                break;
            case "sendTikTok":
                await downloadVideo(api, event, args.slice(1), message);
                break;
            case "sing":
                await downloadAudio(api, event, args.slice(1), message);
                break;
            default:
                const answer = await fetchAnswer(prompt, userID);
                message.reply(answer, (error, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: commandConfig.name,
                        uid: userID
                    });
                });
                break;
        }
    } catch (error) {
        console.error("Error:", error.message);
        message.reply(getLang("error"));
    }
}

// Export
module.exports = {
    config: commandConfig,
    handleCommand,
    onStart: function (params) {
        return handleCommand(params);
    },
    onReply: function (params) {
        return handleCommand(params);
    }
};
