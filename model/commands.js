const path = require("path");

const logger = require("../model/logger.js");
const data_operations = require("../model/data_operations.js");
const send_emails = require("../model/send_emails.js");

function add_self(msg) {
	const server_secrets = data_operations.json_to_data(path.join(__dirname, "../_secrets_server.json"));

	let found = false;
	server_secrets.forEach((object) => {
		if (Object.keys(object).includes("admin_ids")) {
			found = true;
			
			if (!Object.values(object["admin_ids"]).includes(msg.author.id)) {
				object["admin_ids"][`admin_${Object.keys(object["admin_ids"]).length+1}`] = msg.author.id;

				msg.author.send(`you have been added as an admin of [discord-role-inviter-bot] in server [${msg.guild.name}]`);
				msg.delete();
			} else {
				msg.author.send(`you are already an admin of [discord-role-inviter-bot] in server [${msg.guild.name}]`);
				msg.delete();
			}
		}
	});
	if (!found) {
		server_secrets.push({
			admin_ids: {admin_1: `${msg.author.id}`}
		});
		msg.author.send(`you have been added as an admin of [discord-role-inviter-bot] in server [${msg.guild.name}]`);
		msg.delete();
	}

	data_operations.data_to_json(server_secrets, path.join(__dirname, "../_secrets_server.json"));
}

function set_email_info(msg, args) {
	if (args[2] != undefined) {
		const content = args.slice(2).join(" ").split(", ");

		if (content.length == 4) {
			if (content[0][0] == "[" && content[3][content[3].length-1] == "]") {
				let [pair_1, pair_2, pair_3, pair_4] = content;
				pair_1 = pair_1.slice(1, pair_1.length);
				pair_4 = pair_4.slice(0, pair_4.length-1);
				
				let email_info = {};
				if (pair_1.split(" ")[0] == "host:" && pair_2.split(" ")[0] == "port:" && pair_3.split(" ")[0] == "user:" && pair_4.split(" ")[0] == "pass:") {
					email_info = {
						host: pair_1.split(" ")[1],
						port: Number(pair_2.split(" ")[1]),
						user: pair_3.split(" ")[1],
						pass: pair_4.split(" ")[1]
					};

					const server_secrets = data_operations.json_to_data(path.join(__dirname, "../_secrets_server.json"));

					let found = false;
					server_secrets.forEach((object) => {
						if (Object.keys(object).includes("email_info")) {
							found = true;
							object["email_info"] = email_info;
						}
					});
					if (!found) {
						server_secrets.push({
							email_info: email_info
						});
					}

					data_operations.data_to_json(server_secrets, path.join(__dirname, "../_secrets_server.json"));
					msg.channel.send("updated [email_info] server secrets config");
				} else {
					msg.channel.send("error: you must provide the host, port, user, and pass (in this order). please try again");
				}
			} else {
				msg.channel.send("error: provided values not in valid format. please try again");
			}
		} else {
			msg.channel.send("error: you must provide (only) the host, port, user, and pass. please try again");
		}
	} else {
		msg.channel.send("error: no values provided. please try again");
	}
}

function set_admin_ids(msg, args) {
	if (args[2] != undefined) {
		const content = args.slice(2).join(" ").split(", ");
		const num_admins = content.length;

		if (content[0][0] == "[" && content[num_admins-1][content[num_admins-1].length-1] == "]") {
			let id = "";
			let first_id = "";
			let last_id = "";
			let middle_ids = [];
			let admin_ids = {};

			if (content.length == 1) {
				id = content[0].slice(1, content[0].length-1);

				admin_ids = {admin_1: id};
			} else {
				first_id = content[0].slice(1, content[0].length);
				last_id = content[num_admins-1].slice(0, content[num_admins-1].length-1);

				admin_ids = {admin_1: first_id};

				middle_ids = content.slice(1, num_admins-1);
				let i = 1;
				middle_ids.forEach((id) => {
					i++;
					admin_ids[`admin_${i}`] = id;
				});

				admin_ids[`admin_${num_admins}`] = last_id;
			}

			let all_nums = true;
			Object.values(admin_ids).forEach((id) => {
				if (isNaN(Number(id))) {
					all_nums = false;
				}
			});
			if (all_nums) {
				const server_secrets = data_operations.json_to_data(path.join(__dirname, "../_secrets_server.json"));

				let found = false;
				server_secrets.forEach((object) => {
					if (Object.keys(object).includes("admin_ids")) {
						found = true;
						object["admin_ids"] = admin_ids;
					}
				});
				if (!found) {
					server_secrets.push({
						admin_ids: admin_ids
					});
				}

				data_operations.data_to_json(server_secrets, path.join(__dirname, "../_secrets_server.json"));
				msg.channel.send("updated [admin_ids] server secrets config");
			} else {
				msg.channel.send("error: not all provided values are integers. admin ids must be integer values. please try again");
			}
		} else {
			msg.channel.send("error: provided values not in valid format. please try again");
		}
	} else {
		msg.channel.send("error: no values provided. please try again");
	}
}

function set_channel_id(msg, args) {
	if (args[2] != undefined) {
		const content = args[2];

		if (content[0] == "[" && content[content.length-1] == "]") {
			const channel_id = content.slice(1, content.length-1);
			
			if (!isNaN(Number(channel_id))) {
				const server_secrets = data_operations.json_to_data(path.join(__dirname, "../_secrets_server.json"));

				let found = false;
				server_secrets.forEach((object) => {
					if (Object.keys(object).includes("channel_id")) {
						found = true;
						object["channel_id"] = channel_id;
					}
				});
				if (!found) {
					server_secrets.push({
						channel_id: channel_id
					});
				}

				data_operations.data_to_json(server_secrets, path.join(__dirname, "../_secrets_server.json"));
				msg.channel.send("updated [channel_id] server secrets config");
			} else {
				msg.channel.send("error: provided value is not an integer. a channel id must be an integer value. please try again");
			}
		} else {
			msg.channel.send("error: provided value not in valid format. please try again");
		}
	} else {
		msg.channel.send("error: no value provided. please try again");
	}
}

function invite(bot, msg, email_info, admin_ids, channel_id) {
	let all_server_secrets_configs_set = true;
	if (Object.keys(email_info).length == 0) {
		all_server_secrets_configs_set = false;
	}
	if (Object.keys(admin_ids).length == 0) {
		all_server_secrets_configs_set = false;
	}
	if (channel_id == 0) {
		all_server_secrets_configs_set = false;
	}

	if (all_server_secrets_configs_set) {
		msg.channel.send("sending invites");
		msg.channel.send("...");
	
		data_operations.excel_to_json();

		let data = data_operations.json_to_data(path.join(__dirname, "../data/beta_testers.json"));
		let load = data.length*1000 * 1;
		
		const channel = bot.channels.cache.get(channel_id);
		data_operations.create_invites(channel, data, load);
		
		setTimeout(() => { // need to perform rest of the operations in here bc of promises/async/await issue with create_invites
			data = data_operations.json_to_data(path.join(__dirname, "../data/beta_testers.json"));
			// console.log(data);

			send_emails.send_emails(msg, email_info, data, load);
		}, load);
	} else {
		const server_secrets = data_operations.json_to_data(path.join(__dirname, "../_secrets_server.json"));

		let found_email_info = false;
		let found_admin_ids = false;
		let found_channel_id = false;
		server_secrets.forEach((object) => {
			if (Object.keys(object).includes("email_info")) {
				found_email_info = true;
			}
			if (Object.keys(object).includes("admin_ids")) {
				found_admin_ids = true;
			}
			if (Object.keys(object).includes("channel_id")) {
				found_channel_id = true;
			}
		});

		if (!found_email_info) {
			msg.channel.send("warning: [email_info] server secrets config is not set");
		}
		if (!found_admin_ids) {
			msg.channel.send("warning: [admin_ids] server secrets config is not set");
		}
		if (!found_channel_id) {
			msg.channel.send("warning: [channel_id] server secrets config is not set");
		}
		msg.channel.send("error: one or more server secrets configs are not set. please use the set command to set up the server secrets configs, then try the invite command again");
	}
}

function get_log(msg) {
	try {
		msg.channel.send({
			files: [{
				attachment: `${path.join(__dirname, "../# log.log")}`,
				name: "log.txt"
			}]
		});
	} catch (error) {
		logger.log.error(error);
		msg.channel.send(`${error}`);
	}
}

module.exports.add_self = add_self;
module.exports.set_email_info = set_email_info;
module.exports.set_admin_ids = set_admin_ids;
module.exports.set_channel_id = set_channel_id;
module.exports.invite = invite;
module.exports.get_log = get_log;
