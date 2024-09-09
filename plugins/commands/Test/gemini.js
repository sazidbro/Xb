const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ytdl = require("ytdl-core");
const yts = require("yt-search");

async function downloadAudio(api, event, args, message) {
  try {
    const songName = args.join(" ");
    const searchResults = await yts(songName);

    if (!searchResults.videos.length) {
      return message.reply("No song found for the given query.");
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
    message.reply("Sorry, an error occurred while processing your request.");
  }
}

async function downloadVideo(api, event, args, message) {
  try {
    const query = args.join(" ");
    const searchResults = await yts(query);

    if (!searchResults.videos.length) {
      return message.reply("No videos found for the given query.");
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
    console.error(error);
    message.reply("Sorry, an error occurred while processing your request.");
  }
}

async function fetchAnswer(prompt, uid) {
  try {
    const response = await axios.get(`https://gemini-ai-pearl-two.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}&uid=${uid}&apikey=kshitiz`);
    return response.data.answer;
  } catch (error) {
    throw error;
  }
}

async function fetchImage(prompt) {
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
      return message.reply(`Description: ${description}`);
    }

    if (!prompt) {
      return message.reply("Please provide a prompt.");
    }

    if (action === "draw") {
      await generateImage(message, prompt);
    } else if (action === "sendTikTok") {
      await downloadVideo(api, event, args.slice(1), message);
    } else if (action === "sing") {
      await downloadAudio(api, event, args.slice(1), message);
    } else {
      const replyMessage = await fetchAnswer(prompt, userID);
      message.reply(replyMessage, (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: commandConfig.name,
          uid: userID
        });
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    message.reply("An error occurred while processing the request.");
  }
}

async function generateImage(message, prompt) {
  try {
    const imageUrl = await fetchImage(prompt);
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
    console.error("Error:", error.message);
    message.reply("An error occurred while generating the image.");
  }
}

const commandConfig = {
  name: "gemini2",
  aliases: ["bard"],
  version: "4.0",
  author: "Sazid",
  countDown: 5,
  role: 0,
  longDescription: "Chat with gemini AI, draw images, or download audio/video.",
  category: "ai",
  guide: {
    en: "{p}gemini {prompt} - Chat with AI, draw, or download media"
  }
};

module.exports = {
  config: commandConfig,
  handleCommand,
  onStart: ({ api, message, event, args }) => handleCommand({ api, message, event, args }),
  onReply: ({ api, message, event, args }) => handleCommand({ api, message, event, args })
};

