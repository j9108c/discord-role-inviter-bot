const XLSX = require('xlsx');
const path = require("path");
const file_system = require("fs");

const logger = require("../model/logger.js");

function excel_to_json() {
	const excel = XLSX.readFile(path.join(__dirname, "../data/closed_beta.xlsx"));
	const sheet_name_list = excel.SheetNames;
	const json = XLSX.utils.sheet_to_json(excel.Sheets[sheet_name_list[0]]);
	
	const extract = json.map((object) => {
		return {username: object["username"], email: object["email"]};
	});
	
	file_system.writeFileSync(path.join(__dirname, "../data/beta_testers.json"), JSON.stringify(extract, null, 4), "utf-8");
}

function json_to_data(file_path) {
	// reading from beta_testers.json into data var
	let data = JSON.parse(file_system.readFileSync(file_path, "utf-8"));

	return data;
}

function create_invites(channel, data, load) {
	let data_with_inv = [];

	data.forEach((object) => {
		channel.createInvite({
			unique: true,
			maxUses: 1,
			maxAge: 0 // link expiry in seconds. 0 = forever, max is 86400 = 24h
		}).then((invite) => {
			// console.log(object.username);
			// console.log(object.email);
			// console.log(invite.url);
			logger.log.info(`username: ${object.username}, email: ${object.email}, invite: ${invite.url}`);
			data_with_inv.push({
				username: object.username,
				email: object.email,
				invite: invite.url
			});
		}).catch((error) => logger.log.error(error));
	});

	setTimeout(() => {
		// console.log(data_with_inv);
		data_to_json(data_with_inv, path.join(__dirname, "../data/beta_testers.json"));
	}, load);
}

function data_to_json(data, file_path) {
	// console.log(data_with_inv);
	file_system.writeFileSync(file_path, JSON.stringify(data, null, 4), "utf-8");
}

function get_server_secrets_configs() {
	// server secrets config vars
	let email_info = {};
	let admin_ids = {};
	let channel_id = 0;

	// fill server secrets config vars
	const server_secrets = json_to_data(path.join(__dirname, "../_secrets_server.json"));
	server_secrets.forEach((object) => {
		if (Object.keys(object).includes("email_info")) {
			email_info = object["email_info"];
		}

		if (Object.keys(object).includes("admin_ids")) {
			admin_ids = object["admin_ids"];
		}

		if (Object.keys(object).includes("channel_id")) {
			channel_id = object["channel_id"];
		}
	});

	return [email_info, admin_ids, channel_id];
}

module.exports.excel_to_json = excel_to_json;
module.exports.json_to_data = json_to_data;
module.exports.create_invites = create_invites;
module.exports.data_to_json = data_to_json;
module.exports.get_server_secrets_configs = get_server_secrets_configs;
