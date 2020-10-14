const Discord = require("discord.js");
const path = require("path");
const request = require("request");
const file_system = require("fs");

const logger = require("../model/logger.js");
const data_operations = require("../model/data_operations.js");
const commands = require("../model/commands.js");
const secrets = require("../_secrets.js");

const bot = new Discord.Client();
const invite_cache = new Map();
const prefix = ";"; // command prefix

// server secrets configs
let email_info = {};
let admin_ids = {};
let channel_id = 0;

// on bot launch
bot.on("ready", () => {
	logger.log.info("bot has connected to server");

	// load all invites for all guilds and save them to the cache
	bot.guilds.cache.forEach((guild) => { // cache is a collection of all the guilds (servers)
		guild.fetchInvites() // returns a promise
			.then((invites) => invite_cache.set(guild.id, invites))
			.catch((error) => logger.log.error(error));
	});
	
	// fill server secrets configs
	try {
		[email_info, admin_ids, channel_id] = data_operations.get_server_secrets_configs();
	} catch (error) { // [../_secrets_server.json] is empty
		data_operations.data_to_json([], path.join(__dirname, "../_secrets_server.json"));
	}
});

// on guild (server) invite creation
bot.on("inviteCreate", async (invite) => {
	invite_cache.set(invite.guild.id, await invite.guild.fetchInvites()); // updates the guilds cache when a new invite link is generated
});

// on user joining guild (server)
bot.on("guildMemberAdd", async (member) => {
	const cached_invites = invite_cache.get(member.guild.id);

	const new_invites = await member.guild.fetchInvites();
	invite_cache.set(member.guild.id, new_invites);

	const used_invite = new_invites.find((inv) => cached_invites.get(inv.code).uses < inv.uses);
	
	if (used_invite == undefined) { // undefined because max uses (1) has been used up and the invite has been removed from the discord API
		let role = member.guild.roles.cache.find((role) => role.name == "beta tester");
		member.roles.add(role);
	}
});

// on direct/server message
bot.on("message", (msg) => {
	// any message
	if (msg.content == "any") {
		msg.reply("any");
	}

	// messages not from bots
	if (!msg.author.bot) {
		let args = msg.content.substring(prefix.length).split(' '); // for commands

		if (msg.channel.type == "dm") { // messages in directs
			if (Object.values(admin_ids).includes(msg.author.id)) { // admins only
				// admin commands (activated by prefix)
				switch (args[0]) {
					case "set":
						if (args[1] == "email_info") {
							commands.set_email_info(msg, args);

							email_info = data_operations.get_server_secrets_configs()[0];
						} else if (args[1] == "admin_ids") {
							commands.set_admin_ids(msg, args);

							admin_ids = data_operations.get_server_secrets_configs()[1];
						} else if (args[1] == "channel_id") {
							commands.set_channel_id(msg, args);

							channel_id = data_operations.get_server_secrets_configs()[2];
						} else {
							msg.channel.send(`error: [set ${args[1]}] is not a command`);
						}
					break;
					case "invite":
						commands.invite(bot, msg, email_info, admin_ids, channel_id);
					break;
					case "get":
						if (args[1] == "log") {
							commands.get_log(msg);
						} else {
							msg.channel.send(`error: [get ${args[1]}] is not a command`);
						}
					break;
				}

				// admin upload file to bot for dl
				if (msg.attachments.first()) { // message has attachment
					const attachment = msg.attachments.first();
					const url = attachment.url;
					
					if (url.split("/").pop() == "closed_beta.xlsx") {
						try {
							request.get(url).pipe(file_system.createWriteStream(path.join(__dirname, "../data/closed_beta.xlsx")));
							msg.channel.send("file saved");
						} catch (error) {
							logger.log.error(error);
							msg.channel.send(`${error}`);
						}
					} else {
						msg.channel.send("error: provided file is not supported. please try again");
					}
				}
			} else { // users only
				if (msg.content != "hi" && msg.content != "hello") {
					msg.channel.send("ヽʕ •ᴥ•ʔﾉ");
				}
			}

			// admin/user direct messages
			if (msg.content == "hi") {
				msg.channel.send("hi im a bot");
				msg.channel.send("hello");
			} else if (msg.content == "hello") {
				msg.channel.send("hello im a bot");
				msg.channel.send("hi");
			}
		} else { // messages in servers
			if (Object.values(admin_ids).includes(msg.author.id)) { // admins only
			} else { // users only
			}

			// admin/user commands (activated by prefix)
			switch (args[0]) {
				case "add":
					if (args[1] == "self") {
						if (msg.member.hasPermission("ADMINISTRATOR")) {
							commands.add_self(msg);

							admin_ids = data_operations.get_server_secrets_configs()[1];
						}
					}
				break;
				case "info":
					if (args[1] == "version") {
						msg.channel.send("v.1.0.0");
					} else if (args[1] == "website") {
						msg.channel.send("website");
					} else {
						msg.channel.send(`error: [info ${args[1]}] is not a command`);
					}
				break;
			}
		}
	}
});

// launch bot
bot.login(secrets.token);
