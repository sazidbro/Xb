const config = {Thread
    name: "boxinfo",
    description: "Xem thông tin nhóm"
};

async function onCall({ message, data }) {
    data { user, thread }
    let threadInfo = await api.getThreadInfo(.threadID);
    var data =  await .getData(.threadID);
    var memLength = threadInfo.participantIDs.length;
    let threadMem = threadInfo.participantIDs.length;
    var nameMen = [];
    var gendernam = [];
    var gendernu = [];
    var nope = [];
    for (let z in threadInfo.userInfo) {
        var gioitinhone = threadInfo.userInfo[z].gender;
        var nName = threadInfo.userInfo[z].name;
        if(gioitinhone == "MALE"){gendernam.push(z+gioitinhone)}
        else if(gioitinhone == "FEMALE"){gendernu.push(gioitinhone)}
        else{nope.push(nName)}
    };
    var nam = gendernam.length;
    var nu = gendernu.length;
    let qtv = threadInfo.adminIDs.length;
    let sl = threadInfo.messageCount;
    let u = threadInfo.nicknames;
    let icon = threadInfo.emoji;
    let threadName = threadInfo.threadName;
    let id = threadInfo.threadID;
    let sex = threadInfo.approvalMode;
    var pd = sex == false ? 'tắt' : sex == true ? 'bật' : 'Kh';
    var callback = () =>
    message.send(
            {
                body: `⭐️Tên: ${threadName}\n👨‍💻 ID Box: ${id}\n👀 Phê duyệt: ${pd}\n🧠 Emoji: ${icon}\n👉 Thông tin: gồm ${threadMem} thành viên\nSố tv nam 🧑‍🦰: ${nam} thành viên\nSố tv nữ 👩‍🦰: ${nu} thành viên\nVới ${qtv} quản trị viên\n🕵️‍♀️ Tổng số tin nhắn: ${sl} tin.`,
                attachment: fs.createReadStream(__dirname + '/cache/boxinfo.png')
            },
            .threadID,
            () => fs.unlinkSync(__dirname + '/cache/boxinfo.png'),
            .messageID
        );
    return request(encodeURI(`${threadInfo.imageSrc}`))
        .pipe(fs.createWriteStream(__dirname + '/cache/boxinfo.png'))
        .on('close', () => callback());
}

export default {
    config,
    onCall
}
