const config = {
    name: "edit",
    description: "Chỉnh sửa tin nhắn bot",
    permissions: [2],
    credits: "XIE"
};

const langData = {
    "vi_VN": {
        "notBotMessage": "Tin nhắn bạn chỉnh sửa không phải của bot",
        "error": "Đã có lỗi xảy ra"
    }
};

async function onCall({ message, args, getLang }) {
    try {
        if (!args.length) return message.reply("Bạn phải cung cấp nội dung mới cho tin nhắn.");

        if (message.type !== "message_reply") return message.reply("Bạn phải reply tin nhắn của bot.");

        if (message.messageReply?.senderID !== global.botID) return message.reply(getLang("notBotMessage"));

        const newContent = args.join(" ");
        const targetMessageID = message.messageReply.messageID;

        global.api.editMessage(newContent, targetMessageID, (error) => {
            if (error) {
                console.error(error);
                return message.react("❌"); 
            }
            message.react("✅"); 
        });
    } catch (error) {
        console.error(error);
        message.react("❌"); 
        message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall
};
