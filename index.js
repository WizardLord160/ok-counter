require('dotenv').config();
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;


bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  bot.user.setActivity("League of Wyzarde");
});


let okCount = 954;
let welcome = false;

const prefix = "q!"
const queue = new Map();

const patchNotes = new Discord.MessageEmbed()
	.setColor('#800080')
	.setTitle('OK Counter Patch Notes')
	.setAuthor('WizardLord160', 'https://i.imgur.com/MQXk8gN.png')
	.setDescription('Version: 1.06')
  .setThumbnail('https://i.imgur.com/4sb4FU6.png')
  .addField('Description', 'Easter egg! :egg:', true)
	.setTimestamp()
	.setFooter('Quack!', 'https://i.imgur.com/4sb4FU6.png');



var okArray = ["ok", "Ok", "OK", "okay", "Okay"]
bot.on('message', msg => {
    if (msg.author.bot) return;

    if (welcome == true) {
      msg.channel.send("Wizard just updated me!")
      welcome = false;
    }
    if (msg.content == 'quack' || msg.content == 'Quack') {
      msg.channel.send("Quack!");
    }
    if (msg.author.id == 261340729773785109) {
      for (var i = 0; i < okArray.length; i++) {
        if (msg.content.includes(okArray[i])) {
          okCount++;
          msg.channel.send(okCount);
          if (okCount === 1000) {
            msg.channel.send(`"Congratulations." - Dad Kassadin`);
          }
        }
      }
    }

    const serverQueue = queue.get(msg.guild.id);

    if (msg.content.startsWith(`${prefix}play`)) {
        execute(msg, serverQueue);
        return;
    } else if (msg.content.startsWith(`${prefix}skip`)) {
        skip(msg, serverQueue);
        return;
    } else if (msg.content.startsWith(`${prefix}stop`)) {
        stop(msg, serverQueue);
        return;
    }

    if (msg.content.startsWith(prefix + "version")) {
      msg.channel.send(patchNotes);
    } 
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}