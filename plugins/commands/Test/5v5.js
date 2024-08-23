import shuffle from 'lodash.shuffle';

const config = {
    name: "randomteam5v5",
    credits: "XIE",
    aliases: ["5v5"],
    version: "1.0.0",
    description: "Tự động tạo ra 2 team ngẫu nhiên",
    permissions: [1, 2],
    cooldown: 5
}

async function onCall({ message, getLang }) {
    const participantIDs = message.participantIDs.filter(id => id !== global.botID);

    if (participantIDs.length < 10) {
        const notEnoughParticipantsMessage = 'Không đủ người tham gia để tạo đội. Cần ít nhất 10 người.';
        message.reply(notEnoughParticipantsMessage);
        return;
    }

    const shuffledParticipantIDs = shuffle(participantIDs);

    const team1 = shuffledParticipantIDs.slice(0, 5);
    const team2 = shuffledParticipantIDs.slice(5, 10);

    const team1Names = await Promise.all(team1.map(async (id) => {
        const userName = await getUserName(id);
        return { id, userName };
    }));
    
    const team2Names = await Promise.all(team2.map(async (id) => {
        const userName = await getUserName(id);
        return { id, userName };
    }));

    const team1Mentions = team1Names.map(({ id, userName }) => ({ id, tag: `${userName}` }));
    const team2Mentions = team2Names.map(({ id, userName }) => ({ id, tag: `${userName}` }));

    const team1Label = '> Team 1 <';
    const team2Label = '> Team 2 <';

    const team1Message = `${team1Label}\n- ${team1Mentions.map(({ tag }) => tag).join("\n- ")}`;
    const team2Message = `${team2Label}\n${team2Mentions.map(({ tag }) => tag).join("\n- ")}`;

    const allMentions = [...team1Mentions, ...team2Mentions];

    message.reply({
        body: `${team1Message}\n${team2Message}`,
        mentions: allMentions
    });
}

async function getUserName(userID) {
    return new Promise((resolve, reject) => {
        global.api.getUserInfo(userID, (err, info) => {
            if (err) return reject(err);
            const userName = info[userID]?.name || `${userID}`;
            resolve(userName);
        });
    });
}

export default {
    config,
    onCall
}
