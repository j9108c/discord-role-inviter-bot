const nodemailer = require("nodemailer");

const logger = require("../model/logger.js");

function send_emails(msg, email_info, data, load) {
	let sent = true;
	let error_msg = null;
	let sent_count = 0;
	
	data.forEach((object) => {
		const output = `
			<p>you have received a one-time use discord server link for game beta testing!</p>
			<h3>beta tester</h3>
			<ul>
				<li style="list-style-type: circle">username: ${object.username}</li>
				<li style="list-style-type: circle">email: ${object.email}</li>
				<li style="list-style-type: circle">discord beta tester role link: <a target="_blank" href="${object.invite}">${object.invite}</a></li>
			</ul>
			<h3>message message message</h3>
			<p>message message message message message message</p>
		`;
		
		let transporter = nodemailer.createTransport({
			host: email_info.host,
			port: email_info.port,
			secure: false, // true for 465, false for other ports
			auth: {
				user: email_info.user,
				pass: email_info.pass
			},
			tls: {
				rejectUnauthorized: false // allows to send from dev run running on localhost
			}
		});

		let mail_options = {
			from: `"discord-role-inviter-bot" <${email_info.user}>`,
			to: `${object.email}`,
			subject: "beta testing invite",
			text: "hello world",
			html: output
		};

		transporter.sendMail(mail_options, (error, info) => {
			if (error) {
				sent = false;
				error_msg = error;
				return
			} else {
				sent_count++;
				// logger.log.info(`message sent: ${info.messageId}`);
			}
		});
	});

	setTimeout(() => {
		if (sent) {
			if (sent_count == 1) {
				logger.log.info("1 invite has been sent");
				msg.channel.send("1 invite has been sent");
			} else {
				logger.log.info(`${sent_count} invites have been sent`);
				msg.channel.send(`${sent_count} invites have been sent`);
			}
		} else {
			logger.log.error(error_msg);
			msg.channel.send(`${error_msg}`);
			msg.channel.send("error: invites failed to send. please enter the correct server secrets configs from the set command");
		}
	}, load);
}

module.exports.send_emails = send_emails;
